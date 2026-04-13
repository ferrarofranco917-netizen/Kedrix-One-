window.KedrixOneRemittanceDocumentsModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneRemittanceDocumentsWorkspace || null;
  const Feedback = window.KedrixOneAppFeedback || null;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function ensureState(state) {
    if (!Workspace || typeof Workspace.ensureState !== 'function') return null;
    Workspace.ensureState(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!Array.isArray(state.remittanceDocumentRecords)) state.remittanceDocumentRecords = [];
    return state.remittanceDocumentsWorkspace;
  }

  function seaAirPractices(state) {
    return (state?.practices || []).filter((practice) => {
      const type = String(practice?.practiceType || '').toLowerCase();
      return type.includes('sea') || type.includes('air');
    });
  }

  function currentOperatorName(state) {
    const activeUserId = String(state?.activeUserId || '').trim();
    const user = (state?.users || []).find((entry) => String(entry?.id || '').trim() === activeUserId) || null;
    return String(user?.name || '').trim();
  }

  function createEmptyDraft(state, overrides = {}) {
    return Workspace.cloneDraft({
      editingRecordId: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      status: 'draft',
      hawbReference: '',
      client: '',
      sender: '',
      destination: '',
      reference: '',
      attentionTo: '',
      documentDate: today(),
      loadingPort: '',
      unloadingPort: '',
      supplierInvoice: '',
      supplierInvoiceDate: '',
      amount: '',
      amountCurrency: 'EUR',
      courierName: '',
      voyage: '',
      vessel: '',
      deliveryConditions: '',
      internalText: '',
      customerText: '',
      detailNotes: '',
      sourcePracticeSnapshot: {},
      lineItems: [Workspace.defaultLineItem()],
      ...overrides
    });
  }

  function buildDraftFromPractice(state, practice) {
    const dynamic = practice?.dynamicData || {};
    return createEmptyDraft(state, {
      practiceId: String(practice?.id || '').trim(),
      practiceReference: String(practice?.reference || '').trim(),
      practiceType: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
      status: String(practice?.status || 'draft').trim() || 'draft',
      client: String(practice?.clientName || practice?.client || '').trim(),
      sender: String(dynamic.senderParty || dynamic.exporter || dynamic.shipper || '').trim(),
      destination: String(dynamic.consignee || dynamic.receiverParty || dynamic.destinationParty || '').trim(),
      reference: String(dynamic.mainReference || practice?.reference || '').trim(),
      attentionTo: String(dynamic.attentionTo || '').trim(),
      documentDate: String(practice?.practiceDate || today()).trim() || today(),
      loadingPort: String(dynamic.loadingPort || dynamic.originPort || dynamic.originNode || '').trim(),
      unloadingPort: String(dynamic.unloadingPort || dynamic.destinationPort || dynamic.destinationNode || '').trim(),
      supplierInvoice: String(dynamic.foreignInvoice || dynamic.supplierInvoice || '').trim(),
      supplierInvoiceDate: String(dynamic.foreignInvoiceDate || dynamic.supplierInvoiceDate || '').trim(),
      amount: String(dynamic.invoiceAmount || dynamic.amount || '').trim(),
      amountCurrency: String(dynamic.invoiceCurrency || dynamic.amountCurrency || 'EUR').trim() || 'EUR',
      courierName: String(dynamic.courierName || dynamic.transporter || '').trim(),
      voyage: String(dynamic.voyage || '').trim(),
      vessel: String(dynamic.vessel || '').trim(),
      deliveryConditions: String(dynamic.deliveryConditions || dynamic.incoterm || '').trim(),
      hawbReference: String(dynamic.hawb || dynamic.airWaybill || '').trim(),
      sourcePracticeSnapshot: {
        id: String(practice?.id || '').trim(),
        reference: String(practice?.reference || '').trim(),
        type: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
        status: String(practice?.status || '').trim()
      },
      lineItems: [Workspace.defaultLineItem({
        documentType: 'Documenti pratica',
        documentReference: String(dynamic.mainReference || practice?.reference || '').trim(),
        copies: '',
        note: String(dynamic.goodsDescription || '').trim()
      })]
    });
  }

  function buildKpis(state) {
    const records = Array.isArray(state?.remittanceDocumentRecords) ? state.remittanceDocumentRecords : [];
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const linkedPractices = new Set(records.map((record) => String(record?.practiceId || '').trim()).filter(Boolean));
    return { records: records.length, openMasks: sessions.length, linkedPractices: linkedPractices.size };
  }

  function fieldSize(name, options = {}) {
    if (options.full || options.type === 'textarea') return 'full';
    const xs = new Set(['amountCurrency']);
    const sm = new Set(['documentDate', 'supplierInvoiceDate']);
    const md = new Set(['practiceReference', 'reference', 'hawbReference', 'loadingPort', 'unloadingPort', 'supplierInvoice', 'amount', 'courierName', 'voyage', 'vessel']);
    const lg = new Set(['client', 'sender', 'destination', 'attentionTo', 'deliveryConditions']);
    if (xs.has(name)) return 'xs';
    if (sm.has(name)) return 'sm';
    if (md.has(name)) return 'md';
    if (lg.has(name)) return 'lg';
    return 'md';
  }

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const rows = Number(options.rows || 4);
    const items = Array.isArray(options.items) ? options.items : [];
    const disabled = options.disabled ? ' disabled' : '';
    const placeholder = U.escapeHtml(options.placeholder || '');
    const size = fieldSize(name, options);
    const classes = ['field', 'notice-field', 'remittance-field', `notice-size-${size}`, `notice-field-${String(name || '').trim()}`];
    const baseAttrs = `id="rd-${U.escapeHtml(name)}" data-remittance-documents-field="${U.escapeHtml(name)}"${disabled}`;
    if (type === 'textarea') {
      return `<div class="${classes.join(' ')}"><label for="rd-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><textarea ${baseAttrs} rows="${rows}" placeholder="${placeholder}">${U.escapeHtml(value || '')}</textarea></div>`;
    }
    if (type === 'select') {
      return `<div class="${classes.join(' ')}"><label for="rd-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><select ${baseAttrs}>${items.map((item) => {
        const itemValue = String(item?.value ?? '');
        const selected = itemValue === String(value ?? '') ? ' selected' : '';
        return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
      }).join('')}</select></div>`;
    }
    return `<div class="${classes.join(' ')}"><label for="rd-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><input ${baseAttrs} type="${U.escapeHtml(type)}" value="${U.escapeHtml(value || '')}" placeholder="${placeholder}"></div>`;
  }

  function renderLauncher(state, i18n, selectedPractice) {
    const practices = seaAirPractices(state);
    const cards = selectedPractice ? [selectedPractice, ...practices.filter((p) => String(p.id) !== String(selectedPractice.id)).slice(0, 2)] : practices.slice(0, 3);
    return `
      <section class="panel remittance-launcher-panel notice-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceLauncherHint', 'Apri una rimessa documenti da una pratica mare/aereo oppure crea una nuova maschera vuota.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-remittance-new-session>${U.escapeHtml(i18n?.t('ui.newEmptyDocument', 'Nuovo documento vuoto'))}</button></div>
        </div>
        <div class="module-card-grid remittance-practice-grid">
          ${cards.length ? cards.map((practice) => `
            <button class="module-card" type="button" data-remittance-open-practice="${U.escapeHtml(String(practice.id || ''))}">
              <div><strong>${U.escapeHtml(practice.reference || '—')}</strong><div class="module-card-meta">${U.escapeHtml(practice.clientName || practice.client || '—')}</div></div>
              <div class="module-card-meta">${U.escapeHtml(practice.practiceTypeLabel || practice.practiceType || '')}</div>
            </button>`).join('') : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noPracticesAvailable', 'Nessuna pratica disponibile.'))}</div>`}
        </div>
      </section>`;
  }

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const activeId = String(state?.remittanceDocumentsWorkspace?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel remittance-workspace-panel notice-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceOpenMasksHint', 'Più rimesse documenti possono restare aperte contemporaneamente.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-remittance-new-session>${U.escapeHtml(i18n?.t('ui.newMask', 'Nuova maschera'))}</button></div>
        </div>
        <div class="notice-session-strip">
          ${sessions.map((session) => `
            <div class="notice-session-chip${session.id === activeId ? ' active' : ''}">
              <button class="notice-session-main" type="button" data-remittance-switch-session="${U.escapeHtml(session.id)}">
                <strong>${U.escapeHtml(session?.draft?.practiceReference || i18n?.t('ui.newRemittanceDocuments', 'Nuova rimessa documenti'))}</strong>
                <span>${U.escapeHtml(session?.draft?.client || '—')}</span>
                <em>${U.escapeHtml(session?.uiState?.tab === 'texts' ? i18n?.t('ui.texts', 'Testi') : session?.uiState?.tab === 'detail' ? i18n?.t('ui.detail', 'Dettaglio') : i18n?.t('ui.general', 'Generale'))}</em>
              </button>
              <button class="notice-session-close" type="button" data-remittance-close-session="${U.escapeHtml(session.id)}" aria-label="${U.escapeHtml(i18n?.t('ui.closeMask', 'Chiudi maschera'))}">×</button>
            </div>`).join('')}
        </div>
      </section>`;
  }

  function renderSummaryPills(draft, i18n) {
    const items = [
      [i18n?.t('ui.generatedNumber', 'Pratica'), draft.practiceReference || '—'],
      [i18n?.t('ui.clientRequired', 'Cliente'), draft.client || '—'],
      [i18n?.t('ui.reference', 'Riferimento'), draft.reference || '—'],
      [i18n?.t('ui.date', 'Data'), draft.documentDate || '—']
    ];
    return `<div class="tag-grid remittance-summary-pills">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderGeneralTab(draft, i18n) {
    const fields = [
      { label: i18n?.t('ui.generatedNumber', 'Numero pratica'), name: 'practiceReference', value: draft.practiceReference, options: { disabled: true } },
      { label: i18n?.t('ui.clientRequired', 'Cliente'), name: 'client', value: draft.client },
      { label: i18n?.t('ui.hawb', 'HAWB'), name: 'hawbReference', value: draft.hawbReference },
      { label: i18n?.t('ui.policyNumber', 'Riferimento'), name: 'reference', value: draft.reference },
      { label: i18n?.t('ui.sender', 'Mittente'), name: 'sender', value: draft.sender },
      { label: i18n?.t('ui.consignee', 'Destinatario'), name: 'destination', value: draft.destination },
      { label: i18n?.t('ui.attentionTo', 'All’attenzione di'), name: 'attentionTo', value: draft.attentionTo },
      { label: i18n?.t('ui.date', 'Data'), name: 'documentDate', value: draft.documentDate, options: { type: 'date' } },
      { label: i18n?.t('ui.loadingPort', 'Imbarco'), name: 'loadingPort', value: draft.loadingPort },
      { label: i18n?.t('ui.unloadingPort', 'Sbarco'), name: 'unloadingPort', value: draft.unloadingPort },
      { label: i18n?.t('ui.arrivalNoticeSupplierInvoice', 'Fattura fornitore'), name: 'supplierInvoice', value: draft.supplierInvoice },
      { label: i18n?.t('ui.invoiceDate', 'Data fattura'), name: 'supplierInvoiceDate', value: draft.supplierInvoiceDate, options: { type: 'date' } },
      { label: i18n?.t('ui.amount', 'Importo'), name: 'amount', value: draft.amount },
      { label: i18n?.t('ui.currency', 'Valuta'), name: 'amountCurrency', value: draft.amountCurrency, options: { type: 'select', items: [{ value: 'EUR', label: 'EUR' }, { value: 'USD', label: 'USD' }, { value: 'GBP', label: 'GBP' }, { value: 'CHF', label: 'CHF' }] } },
      { label: i18n?.t('ui.courier', 'A mezzo corriere'), name: 'courierName', value: draft.courierName },
      { label: i18n?.t('ui.voyage', 'Viaggio'), name: 'voyage', value: draft.voyage },
      { label: i18n?.t('ui.vessel', 'Nave'), name: 'vessel', value: draft.vessel },
      { label: i18n?.t('ui.deliveryConditions', 'Condizioni di consegna'), name: 'deliveryConditions', value: draft.deliveryConditions }
    ];
    return `
      ${renderSummaryPills(draft, i18n)}
      <div class="notice-general-grid remittance-general-grid">${fields.map((field) => renderField(field.label, field.name, field.value, field.options || {})).join('')}</div>`;
  }

  function renderTextsTab(draft, i18n) {
    return `
      <div class="form-grid two remittance-form-grid">
        ${renderField(i18n?.t('ui.internalText', 'Testo interno'), 'internalText', draft.internalText, { type: 'textarea', rows: 10, full: true })}
        ${renderField(i18n?.t('ui.customerText', 'Testo cliente'), 'customerText', draft.customerText, { type: 'textarea', rows: 10, full: true })}
      </div>`;
  }

  function renderDetailTab(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <section class="table-panel remittance-detail-panel notice-lines-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.detail', 'Dettaglio'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDetailHint', 'Elenco documenti, riferimenti e note della rimessa.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-remittance-add-line>${U.escapeHtml(i18n?.t('ui.addLine', 'Aggiungi riga'))}</button></div>
        </div>
        <div class="table-wrap notice-lines-wrap">
          <table class="table remittance-lines-table notice-lines-table">
            <colgroup><col style="width:22%"><col style="width:28%"><col style="width:10%"><col style="width:32%"><col style="width:8%"></colgroup>
            <thead><tr>
              <th>${U.escapeHtml(i18n?.t('ui.documentType', 'Tipo documento'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.copies', 'Copie'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.note', 'Note'))}</th>
              <th></th>
            </tr></thead>
            <tbody>
              ${rows.map((row, index) => `
                <tr>
                  <td><input type="text" value="${U.escapeHtml(row.documentType || '')}" data-remittance-line-index="${index}" data-remittance-line-field="documentType"></td>
                  <td><input type="text" value="${U.escapeHtml(row.documentReference || '')}" data-remittance-line-index="${index}" data-remittance-line-field="documentReference"></td>
                  <td><input type="text" value="${U.escapeHtml(row.copies || '')}" data-remittance-line-index="${index}" data-remittance-line-field="copies"></td>
                  <td><input type="text" value="${U.escapeHtml(row.note || '')}" data-remittance-line-index="${index}" data-remittance-line-field="note"></td>
                  <td><button class="btn secondary" type="button" data-remittance-remove-line="${index}">${U.escapeHtml(i18n?.t('ui.remove', 'Rimuovi'))}</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="form-grid one remittance-form-grid">${renderField(i18n?.t('ui.detailNotes', 'Note dettaglio'), 'detailNotes', draft.detailNotes, { type: 'textarea', rows: 6, full: true })}</div>
      </section>`;
  }

  function buildMailtoHref(draft, i18n) {
    const subject = `${i18n?.t('practices/rimessa-documenti', 'Rimessa documenti')} ${draft.practiceReference || ''}`.trim();
    const lines = [
      `${i18n?.t('ui.generatedNumber', 'Pratica')}: ${draft.practiceReference || '—'}`,
      `${i18n?.t('ui.clientRequired', 'Cliente')}: ${draft.client || '—'}`,
      `${i18n?.t('ui.reference', 'Riferimento')}: ${draft.reference || '—'}`,
      `${i18n?.t('ui.date', 'Data')}: ${draft.documentDate || '—'}`,
      `${i18n?.t('ui.loadingPort', 'Imbarco')}: ${draft.loadingPort || '—'}`,
      `${i18n?.t('ui.unloadingPort', 'Sbarco')}: ${draft.unloadingPort || '—'}`,
      '',
      draft.customerText || draft.internalText || ''
    ];
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  function buildPrintableHtml(draft, i18n) {
    const rows = (draft.lineItems || []).map((row) => `<tr><td>${U.escapeHtml(row.documentType || '—')}</td><td>${U.escapeHtml(row.documentReference || '—')}</td><td>${U.escapeHtml(row.copies || '—')}</td><td>${U.escapeHtml(row.note || '—')}</td></tr>`).join('');
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:22px;margin:0 0 12px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:12px}section{margin-top:20px} .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px} .item{border:1px solid #cbd5e1;padding:10px;border-radius:8px}</style></head><body><h1>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h1><div class="grid"><div class="item"><strong>${U.escapeHtml(i18n?.t('ui.generatedNumber', 'Pratica'))}</strong><div>${U.escapeHtml(draft.practiceReference || '—')}</div></div><div class="item"><strong>${U.escapeHtml(i18n?.t('ui.clientRequired', 'Cliente'))}</strong><div>${U.escapeHtml(draft.client || '—')}</div></div><div class="item"><strong>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</strong><div>${U.escapeHtml(draft.reference || '—')}</div></div><div class="item"><strong>${U.escapeHtml(i18n?.t('ui.date', 'Data'))}</strong><div>${U.escapeHtml(draft.documentDate || '—')}</div></div></div><table><thead><tr><th>${U.escapeHtml(i18n?.t('ui.documentType', 'Tipo documento'))}</th><th>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</th><th>${U.escapeHtml(i18n?.t('ui.copies', 'Copie'))}</th><th>${U.escapeHtml(i18n?.t('ui.note', 'Note'))}</th></tr></thead><tbody>${rows || `<tr><td colspan="4">—</td></tr>`}</tbody></table><section><strong>${U.escapeHtml(i18n?.t('ui.customerText', 'Testo cliente'))}</strong><div>${U.escapeHtml(draft.customerText || '—')}</div></section><section><strong>${U.escapeHtml(i18n?.t('ui.internalText', 'Testo interno'))}</strong><div>${U.escapeHtml(draft.internalText || '—')}</div></section></body></html>`;
  }

  function printDraft(draft, i18n) {
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
    if (!popup) return false;
    popup.document.open();
    popup.document.write(buildPrintableHtml(draft, i18n));
    popup.document.close();
    popup.focus();
    popup.print();
    return true;
  }

  async function closeSessionWithGuard(state, sessionId, i18n) {
    const session = Workspace.findSession(state, sessionId, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return false;
    if (session.isDirty && Feedback && typeof Feedback.confirm === 'function') {
      const confirmed = await Feedback.confirm({
        title: i18n?.t('ui.closeMask', 'Chiudi maschera'),
        message: i18n?.t('ui.unsavedChangesMask', 'Ci sono modifiche non salvate in questa maschera. Vuoi chiuderla comunque?'),
        confirmLabel: i18n?.t('ui.close', 'Chiudi'),
        cancelLabel: i18n?.t('ui.cancel', 'Annulla'),
        tone: 'warning'
      });
      if (!confirmed) return false;
    } else if (session.isDirty && !window.confirm(i18n?.t('ui.unsavedChangesMask', 'Ci sono modifiche non salvate in questa maschera. Vuoi chiuderla comunque?'))) {
      return false;
    }
    Workspace.closeSession(state, sessionId, { createEmptyDraft: () => createEmptyDraft(state) });
    return true;
  }

  function renderEditor(state, i18n) {
    const session = Workspace?.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) }) || null;
    if (!session) return '';
    const draft = session.draft || createEmptyDraft(state);
    const activeTab = String(session?.uiState?.tab || 'general').trim() || 'general';
    return `
      <section class="panel remittance-editor-panel notice-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceEditorHint', 'Documento operativo per la trasmissione dei documenti pratica, con tab generale, testi e dettaglio.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-remittance-print>${U.escapeHtml(i18n?.t('ui.print', 'Stampa'))}</button>
            <button class="btn secondary" type="button" data-remittance-email>${U.escapeHtml(i18n?.t('ui.sendEmail', 'Invia email'))}</button>
            <button class="btn secondary" type="button" data-remittance-save-continue>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-remittance-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        <div class="tab-row remittance-tabs">
          <button class="tab-chip${activeTab === 'general' ? ' active' : ''}" type="button" data-remittance-tab="general">${U.escapeHtml(i18n?.t('ui.general', 'Generale'))}</button>
          <button class="tab-chip${activeTab === 'texts' ? ' active' : ''}" type="button" data-remittance-tab="texts">${U.escapeHtml(i18n?.t('ui.texts', 'Testi'))}</button>
          <button class="tab-chip${activeTab === 'detail' ? ' active' : ''}" type="button" data-remittance-tab="detail">${U.escapeHtml(i18n?.t('ui.detail', 'Dettaglio'))}</button>
        </div>
        ${activeTab === 'texts' ? renderTextsTab(draft, i18n) : activeTab === 'detail' ? renderDetailTab(draft, i18n) : renderGeneralTab(draft, i18n)}
      </section>`;
  }

  function renderSavedRecords(state, i18n) {
    const records = Array.isArray(state?.remittanceDocumentRecords) ? state.remittanceDocumentRecords : [];
    return `
      <section class="panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</h3><p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceSavedHint', 'Riapri rapidamente le rimesse documenti già generate.'))}</p></div></div>
        <div class="module-card-grid remittance-records-grid">
          ${records.length ? records.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).map((record) => `
            <button class="module-card" type="button" data-remittance-open-record="${U.escapeHtml(record.id)}">
              <div><strong>${U.escapeHtml(record.practiceReference || '—')}</strong><div class="module-card-meta">${U.escapeHtml(record.client || '—')}</div></div>
              <div class="module-card-meta">${U.escapeHtml(record.reference || '—')}</div>
              <div class="module-card-meta">${U.escapeHtml(record.documentDate || '—')}</div>
            </button>`).join('') : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noSavedDocuments', 'Nessun documento salvato.'))}</div>`}
        </div>
      </section>`;
  }

  function render(state, options = {}) {
    const { i18n } = options;
    ensureState(state);
    const selectedPractice = typeof options.getSelectedPractice === 'function' ? options.getSelectedPractice() : null;
    const kpis = buildKpis(state);
    return `
      <div class="notice-module remittance-module">
        <section class="hero"><div class="hero-meta">${U.escapeHtml(i18n?.t('ui.remittanceEyebrow', 'PRATICHE · RIMESSA DOCUMENTI'))}</div><h2>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h2><p>${U.escapeHtml(i18n?.t('ui.remittanceIntro', 'Sottomodulo operativo dedicato alla rimessa documenti collegata alla pratica madre.'))}</p></section>
        <section class="three-col"><div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.records))}</div></div><div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.openMasks))}</div></div><div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.linkedPractices', 'Pratiche collegate'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.linkedPractices))}</div></div></section>
        ${renderLauncher(state, i18n, selectedPractice)}
        ${renderSessionStrip(state, i18n)}
        ${renderEditor(state, i18n)}
        ${renderSavedRecords(state, i18n)}
      </div>`;
  }

  function upsertRecord(state, session) {
    if (!session || !session.draft) return null;
    if (!Array.isArray(state.remittanceDocumentRecords)) state.remittanceDocumentRecords = [];
    const draft = Workspace.cloneDraft(session.draft);
    const now = new Date().toISOString();
    const next = {
      id: String(draft.editingRecordId || '').trim() || `rd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      ...draft,
      editingRecordId: String(draft.editingRecordId || '').trim() || '',
      createdAt: String(draft.createdAt || now),
      updatedAt: now
    };
    next.editingRecordId = next.id;
    const index = state.remittanceDocumentRecords.findIndex((record) => String(record?.id || '').trim() === next.id);
    if (index === -1) state.remittanceDocumentRecords.unshift(next);
    else state.remittanceDocumentRecords.splice(index, 1, next);
    session.draft = Workspace.cloneDraft(next);
    Workspace.markSessionSaved(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
    return next;
  }

  function findRecord(state, recordId) {
    return (state?.remittanceDocumentRecords || []).find((record) => String(record?.id || '').trim() === String(recordId || '').trim()) || null;
  }

  function updateActiveLineItem(state, index, fieldName, value) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => {
      const nextItems = Array.isArray(draft.lineItems) ? draft.lineItems.map((item) => Workspace.defaultLineItem(item)) : [];
      if (!nextItems[index]) return draft;
      nextItems[index] = Workspace.defaultLineItem({ ...nextItems[index], [fieldName]: value });
      return { ...draft, lineItems: nextItems };
    }, { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function addLineItem(state) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => ({
      ...draft,
      lineItems: [...(Array.isArray(draft.lineItems) ? draft.lineItems.map((item) => Workspace.defaultLineItem(item)) : []), Workspace.defaultLineItem()]
    }), { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function removeLineItem(state, index) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => {
      const current = Array.isArray(draft.lineItems) ? draft.lineItems.map((item) => Workspace.defaultLineItem(item)) : [];
      if (current.length <= 1) return { ...draft, lineItems: [Workspace.defaultLineItem()] };
      current.splice(index, 1);
      return { ...draft, lineItems: current.length ? current : [Workspace.defaultLineItem()] };
    }, { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function bind(context = {}) {
    const { root, state, save, render, toast, i18n, getSelectedPractice } = context;
    if (!root || !state || !Workspace) return;

    root.querySelectorAll('[data-remittance-new-session]').forEach((button) => {
      button.addEventListener('click', () => {
        ensureState(state);
        Workspace.openDraftSession(state, { createEmptyDraft: () => createEmptyDraft(state), draft: createEmptyDraft(state), source: 'manual', isDirty: true });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-open-practice]').forEach((button) => {
      button.addEventListener('click', () => {
        const practiceId = button.getAttribute('data-remittance-open-practice');
        const practice = seaAirPractices(state).find((entry) => String(entry?.id || '') === String(practiceId || '')) || (typeof getSelectedPractice === 'function' ? getSelectedPractice() : null);
        if (!practice) return;
        Workspace.openDraftSession(state, { createEmptyDraft: () => createEmptyDraft(state), draft: buildDraftFromPractice(state, practice), source: 'practice', isDirty: true });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-switch-session]').forEach((button) => {
      button.addEventListener('click', () => {
        Workspace.switchSession(state, button.getAttribute('data-remittance-switch-session'), { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-close-session]').forEach((button) => {
      button.addEventListener('click', async () => {
        const sessionId = button.getAttribute('data-remittance-close-session');
        const closed = await closeSessionWithGuard(state, sessionId, i18n);
        if (!closed) return;
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionTab(state, session.id, button.getAttribute('data-remittance-tab'), { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-field]').forEach((input) => {
      const eventName = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventName, () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionField(state, session.id, input.getAttribute('data-remittance-documents-field'), input.value, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
      });
    });

    root.querySelectorAll('[data-remittance-add-line]').forEach((button) => button.addEventListener('click', () => { addLineItem(state); save?.(); render?.(); }));
    root.querySelectorAll('[data-remittance-remove-line]').forEach((button) => button.addEventListener('click', () => { removeLineItem(state, Number(button.getAttribute('data-remittance-remove-line'))); save?.(); render?.(); }));

    root.querySelectorAll('[data-remittance-line-field]').forEach((input) => {
      input.addEventListener('input', () => {
        updateActiveLineItem(state, Number(input.getAttribute('data-remittance-line-index')), input.getAttribute('data-remittance-line-field'), input.value);
        save?.();
      });
    });

    root.querySelectorAll('[data-remittance-open-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = findRecord(state, button.getAttribute('data-remittance-open-record'));
        if (!record) return;
        Workspace.openRecordSession(state, record, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-save-continue]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        save?.();
        toast?.(i18n?.t('ui.saved', 'Salvato'));
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-save-close]').forEach((button) => {
      button.addEventListener('click', async () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        await closeSessionWithGuard(state, session.id, i18n);
        save?.();
        toast?.(i18n?.t('ui.saved', 'Salvato'));
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-print]').forEach((button) => button.addEventListener('click', () => {
      const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
      if (!session) return;
      printDraft(session.draft, i18n);
    }));

    root.querySelectorAll('[data-remittance-email]').forEach((button) => button.addEventListener('click', () => {
      const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
      if (!session) return;
      window.location.href = buildMailtoHref(session.draft, i18n);
    }));
  }

  return { ensureState, render, bind };
})();
