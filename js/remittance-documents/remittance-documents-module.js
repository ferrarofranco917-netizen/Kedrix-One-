window.KedrixOneRemittanceDocumentsModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneRemittanceDocumentsWorkspace || null;
  const Feedback = window.KedrixOneAppFeedback || null;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function currentOperatorName(state) {
    const activeUserId = String(state?.activeUserId || '').trim();
    const user = (state?.users || []).find((entry) => String(entry?.id || '').trim() === activeUserId) || null;
    return String(user?.name || '').trim();
  }

  function ensureState(state) {
    if (!Workspace || typeof Workspace.ensureState !== 'function') return null;
    Workspace.ensureState(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!Array.isArray(state.remittanceDocumentRecords)) state.remittanceDocumentRecords = [];
    return state.remittanceDocumentsWorkspace;
  }

  function createEmptyDraft(state, overrides = {}) {
    return Workspace.cloneDraft({
      editingRecordId: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      status: 'draft',
      client: '',
      sender: '',
      consignee: '',
      reference: '',
      attentionTo: '',
      loadingPort: '',
      unloadingPort: '',
      documentDate: today(),
      supplierInvoice: '',
      amount: '',
      currency: 'EUR',
      courierMode: '',
      voyage: '',
      vessel: '',
      deliveryConditions: '',
      hawbReference: '',
      operatorName: currentOperatorName(state),
      internalText: '',
      customerText: '',
      detailText: '',
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
      consignee: String(dynamic.consignee || dynamic.receiverParty || dynamic.destinationParty || '').trim(),
      reference: String(dynamic.mainReference || practice?.reference || '').trim(),
      attentionTo: String(dynamic.attentionTo || '').trim(),
      loadingPort: String(dynamic.loadingPort || dynamic.portLoading || dynamic.originPort || dynamic.originNode || '').trim(),
      unloadingPort: String(dynamic.unloadingPort || dynamic.portDischarge || dynamic.destinationPort || dynamic.destinationNode || '').trim(),
      documentDate: String(practice?.practiceDate || today()).trim() || today(),
      supplierInvoice: String(dynamic.foreignInvoice || dynamic.supplierInvoice || '').trim(),
      amount: String(dynamic.invoiceAmount || dynamic.amount || '').trim(),
      currency: String(dynamic.invoiceCurrency || dynamic.currency || 'EUR').trim() || 'EUR',
      courierMode: String(dynamic.courierMode || dynamic.deliveryByCourier || '').trim(),
      voyage: String(dynamic.voyage || '').trim(),
      vessel: String(dynamic.vessel || '').trim(),
      deliveryConditions: String(dynamic.deliveryConditions || dynamic.incoterm || '').trim(),
      hawbReference: String(dynamic.hawb || practice?.hawb || '').trim(),
      operatorName: currentOperatorName(state),
      sourcePracticeSnapshot: {
        id: String(practice?.id || '').trim(),
        reference: String(practice?.reference || '').trim(),
        type: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
        status: String(practice?.status || '').trim()
      },
      lineItems: [Workspace.defaultLineItem({
        documentLabel: 'Packing list',
        documentReference: String(dynamic.hawb || dynamic.booking || practice?.reference || '').trim(),
        copies: '1',
        deliveryMode: String(dynamic.courierMode || '').trim(),
        notes: ''
      })]
    });
  }

  function availablePractices(state) {
    return (state?.practices || []).filter((practice) => {
      const type = String(practice?.practiceType || '').trim();
      return type && type !== 'warehouse';
    });
  }

  function buildKpis(state) {
    const records = Array.isArray(state?.remittanceDocumentRecords) ? state.remittanceDocumentRecords : [];
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const linkedPractices = new Set(records.map((record) => String(record?.practiceId || '').trim()).filter(Boolean));
    return {
      records: records.length,
      openMasks: sessions.length,
      linkedPractices: linkedPractices.size
    };
  }

  function fieldSize(name, options = {}) {
    if (options.full || options.type === 'textarea') return 'full';
    const key = String(name || '').trim();
    const xs = new Set(['amount', 'currency', 'documentDate']);
    const sm = new Set(['hawbReference', 'loadingPort', 'unloadingPort', 'courierMode', 'operatorName']);
    const lg = new Set(['client', 'sender', 'consignee', 'deliveryConditions', 'reference', 'attentionTo']);
    if (xs.has(key)) return 'xs';
    if (sm.has(key)) return 'sm';
    if (lg.has(key)) return 'lg';
    return 'md';
  }

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const rows = Number(options.rows || 4);
    const items = Array.isArray(options.items) ? options.items : [];
    const disabled = options.disabled ? ' disabled' : '';
    const placeholder = U.escapeHtml(options.placeholder || '');
    const size = fieldSize(name, options);
    const classes = ['field', 'remittance-field', `remittance-size-${size}`, `remittance-field-${String(name || '').trim()}`];
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

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const activeId = String(state?.remittanceDocumentsWorkspace?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel practice-workspace-panel remittance-documents-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsMasksHint', 'Più rimesse documenti possono restare aperte contemporaneamente.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-remittance-documents-new-session>${U.escapeHtml(i18n?.t('ui.newMask', 'Nuova maschera'))}</button></div>
        </div>
        <div class="practice-session-strip notice-session-strip">
          ${sessions.map((session) => {
            const draft = session?.draft || {};
            const title = String(draft.practiceReference || i18n?.t('ui.remittanceDocumentsUntitled', 'Nuova rimessa documenti') || 'Nuova rimessa documenti').trim();
            const meta = [draft.client, draft.hawbReference].filter(Boolean).join(' · ');
            const active = session.id === activeId;
            return `
              <div class="practice-session-chip notice-session-chip${active ? ' active' : ''}">
                <button class="notice-session-main" type="button" data-remittance-documents-session-switch="${U.escapeHtml(session.id)}">
                  <strong>${U.escapeHtml(title)}</strong>
                  <span>${U.escapeHtml(meta || '—')}</span>
                  ${session.isDirty ? '<em>•</em>' : ''}
                </button>
                <button class="notice-session-close" type="button" data-remittance-documents-session-close="${U.escapeHtml(session.id)}" aria-label="${U.escapeHtml(i18n?.t('ui.closeMask', 'Chiudi maschera'))}">×</button>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  function renderLauncher(state, i18n, selectedPractice) {
    const available = availablePractices(state);
    const activePractice = selectedPractice && String(selectedPractice?.id || '').trim() ? selectedPractice : null;
    return `
      <section class="panel remittance-documents-launcher-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsLauncherTitle', 'Apri o crea rimessa documenti'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsLauncherHint', 'Apri il documento dalla pratica attiva o scegli una pratica operativa dall’elenco.'))}</p>
          </div>
          <div class="action-row">
            ${activePractice ? `<button class="btn" type="button" data-remittance-documents-open-active>${U.escapeHtml(i18n?.t('ui.useCurrentPractice', 'Usa pratica attiva'))}</button>` : ''}
            <button class="btn secondary" type="button" data-remittance-documents-new-session>${U.escapeHtml(i18n?.t('ui.newBlankDocument', 'Nuovo documento vuoto'))}</button>
          </div>
        </div>
        <div class="form-grid three remittance-documents-practice-grid">
          ${available.slice(0, 18).map((practice) => {
            const dynamic = practice?.dynamicData || {};
            const meta = [dynamic.hawb || '', practice.practiceTypeLabel || practice.practiceType || ''].filter(Boolean).join(' · ');
            return `
            <button class="stack-item remittance-documents-practice-chip" type="button" data-remittance-documents-open-practice="${U.escapeHtml(practice.id)}">
              <strong>${U.escapeHtml(practice.reference || '—')}</strong>
              <span>${U.escapeHtml(practice.clientName || practice.client || '')}</span>
              <span>${U.escapeHtml(meta || '—')}</span>
            </button>`;
          }).join('')}
        </div>
      </section>`;
  }

  function renderSummaryPills(draft, i18n) {
    const items = [
      [i18n?.t('ui.generatedNumber', 'Numero pratica'), draft.practiceReference || '—'],
      [i18n?.t('ui.clientRequired', 'Cliente'), draft.client || '—'],
      [i18n?.t('ui.date', 'Data'), draft.documentDate || '—'],
      ['HAWB', draft.hawbReference || '—']
    ];
    return `<div class="tag-grid remittance-documents-summary-pills">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderDetailTable(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <section class="table-panel remittance-documents-detail-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.detail', 'Dettaglio'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsDetailHint', 'Righe documentali della rimessa con nome documento, riferimento, copie, vettore e note operative.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-remittance-documents-add-line>${U.escapeHtml(i18n?.t('ui.addLine', 'Aggiungi riga'))}</button></div>
        </div>
        <div class="table-wrap notice-lines-wrap">
          <table class="table remittance-detail-table">
            <thead>
              <tr>
                <th>${U.escapeHtml(i18n?.t('ui.document', 'Documento'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.copies', 'Copie'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.deliveryMode', 'Modalità invio'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.notes', 'Note'))}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, index) => `
                <tr>
                  <td><input type="text" data-remittance-documents-line-field="documentLabel" data-remittance-documents-line-index="${index}" value="${U.escapeHtml(row.documentLabel || '')}"></td>
                  <td><input type="text" data-remittance-documents-line-field="documentReference" data-remittance-documents-line-index="${index}" value="${U.escapeHtml(row.documentReference || '')}"></td>
                  <td><input type="text" data-remittance-documents-line-field="copies" data-remittance-documents-line-index="${index}" value="${U.escapeHtml(row.copies || '')}"></td>
                  <td><input type="text" data-remittance-documents-line-field="deliveryMode" data-remittance-documents-line-index="${index}" value="${U.escapeHtml(row.deliveryMode || '')}"></td>
                  <td><input type="text" data-remittance-documents-line-field="notes" data-remittance-documents-line-index="${index}" value="${U.escapeHtml(row.notes || '')}"></td>
                  <td><button class="btn secondary" type="button" data-remittance-documents-remove-line="${index}">${U.escapeHtml(i18n?.t('ui.remove', 'Rimuovi'))}</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function renderGeneralTab(draft, i18n) {
    const currencies = ['EUR', 'USD', 'GBP', 'CHF', 'CNY'];
    return `
      ${renderSummaryPills(draft, i18n)}
      <div class="remittance-general-grid">
        ${renderField(i18n?.t('ui.generatedNumber', 'Numero pratica'), 'practiceReference', draft.practiceReference, { disabled: true })}
        ${renderField(i18n?.t('ui.clientRequired', 'Cliente'), 'client', draft.client)}
        ${renderField(i18n?.t('ui.sender', 'Mittente'), 'sender', draft.sender)}
        ${renderField(i18n?.t('ui.consignee', 'Destinatario'), 'consignee', draft.consignee)}
        ${renderField(i18n?.t('ui.reference', 'Riferimento'), 'reference', draft.reference)}
        ${renderField(i18n?.t('ui.attentionTo', 'All’attenzione di'), 'attentionTo', draft.attentionTo)}
        ${renderField(i18n?.t('ui.date', 'Data'), 'documentDate', draft.documentDate, { type: 'date' })}
        ${renderField(i18n?.t('ui.loadingPort', 'Imbarco'), 'loadingPort', draft.loadingPort)}
        ${renderField(i18n?.t('ui.unloadingPort', 'Sbarco'), 'unloadingPort', draft.unloadingPort)}
        ${renderField(i18n?.t('ui.supplierInvoice', 'Fattura fornitore'), 'supplierInvoice', draft.supplierInvoice)}
        ${renderField(i18n?.t('ui.amount', 'Importo'), 'amount', draft.amount)}
        ${renderField(i18n?.t('ui.currency', 'Valuta'), 'currency', draft.currency, { type: 'select', items: currencies.map((value) => ({ value, label: value })) })}
        ${renderField(i18n?.t('ui.byCourier', 'A mezzo corriere'), 'courierMode', draft.courierMode)}
        ${renderField(i18n?.t('ui.voyage', 'Viaggio'), 'voyage', draft.voyage)}
        ${renderField(i18n?.t('ui.vessel', 'Nave'), 'vessel', draft.vessel)}
        ${renderField(i18n?.t('ui.deliveryConditions', 'Condizioni di consegna'), 'deliveryConditions', draft.deliveryConditions)}
        ${renderField('HAWB', 'hawbReference', draft.hawbReference)}
        ${renderField(i18n?.t('ui.operator', 'Operatore'), 'operatorName', draft.operatorName, { disabled: true })}
      </div>`;
  }

  function renderTextsTab(draft, i18n) {
    return `
      <div class="remittance-texts-grid">
        ${renderField(i18n?.t('ui.internalText', 'Testo operativo'), 'internalText', draft.internalText, { type: 'textarea', rows: 8 })}
        ${renderField(i18n?.t('ui.customerText', 'Testo cliente'), 'customerText', draft.customerText, { type: 'textarea', rows: 8 })}
        ${renderField(i18n?.t('ui.detailNotes', 'Note dettaglio'), 'detailText', draft.detailText, { type: 'textarea', rows: 6, full: true })}
      </div>`;
  }

  function buildMailtoHref(draft, i18n) {
    const subject = encodeURIComponent(`${i18n?.t('practices/rimessa-documenti', 'Rimessa documenti')} · ${draft.practiceReference || '—'}`);
    const body = encodeURIComponent([
      `${i18n?.t('ui.generatedNumber', 'Pratica')}: ${draft.practiceReference || '—'}`,
      `${i18n?.t('ui.clientRequired', 'Cliente')}: ${draft.client || '—'}`,
      `HAWB: ${draft.hawbReference || '—'}`,
      `${i18n?.t('ui.reference', 'Riferimento')}: ${draft.reference || '—'}`,
      '',
      draft.customerText || draft.internalText || ''
    ].join('\n'));
    return `mailto:?subject=${subject}&body=${body}`;
  }

  function buildPrintableHtml(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `<!doctype html><html><head><meta charset="utf-8"><title>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 16px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #d8dde6;padding:8px;text-align:left;font-size:12px}th{background:#f3f6fb}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}.meta div{border:1px solid #d8dde6;padding:10px}.block{margin-top:18px}.block h2{font-size:16px;margin:0 0 8px}</style></head><body><h1>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h1><div class="meta"><div><strong>${U.escapeHtml(i18n?.t('ui.generatedNumber', 'Pratica'))}</strong><br>${U.escapeHtml(draft.practiceReference || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.clientRequired', 'Cliente'))}</strong><br>${U.escapeHtml(draft.client || '—')}</div><div><strong>HAWB</strong><br>${U.escapeHtml(draft.hawbReference || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.date', 'Data'))}</strong><br>${U.escapeHtml(draft.documentDate || '—')}</div></div><table><thead><tr><th>${U.escapeHtml(i18n?.t('ui.document', 'Documento'))}</th><th>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</th><th>${U.escapeHtml(i18n?.t('ui.copies', 'Copie'))}</th><th>${U.escapeHtml(i18n?.t('ui.deliveryMode', 'Modalità invio'))}</th><th>${U.escapeHtml(i18n?.t('ui.notes', 'Note'))}</th></tr></thead><tbody>${rows.map((row)=>`<tr><td>${U.escapeHtml(row.documentLabel || '')}</td><td>${U.escapeHtml(row.documentReference || '')}</td><td>${U.escapeHtml(row.copies || '')}</td><td>${U.escapeHtml(row.deliveryMode || '')}</td><td>${U.escapeHtml(row.notes || '')}</td></tr>`).join('')}</tbody></table><div class="block"><h2>${U.escapeHtml(i18n?.t('ui.customerText', 'Testo cliente'))}</h2><div>${U.escapeHtml(draft.customerText || '').replace(/\n/g,'<br>')}</div></div><div class="block"><h2>${U.escapeHtml(i18n?.t('ui.internalText', 'Testo operativo'))}</h2><div>${U.escapeHtml(draft.internalText || '').replace(/\n/g,'<br>')}</div></div></body></html>`;
  }

  function printDraft(draft, i18n) {
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
    if (!popup) return false;
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
      <section class="panel remittance-documents-editor-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsEditorHint', 'Documento operativo collegato alla pratica madre con dati generali, testi e dettaglio documentale pronti per stampa o invio.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-remittance-documents-print>${U.escapeHtml(i18n?.t('ui.print', 'Stampa'))}</button>
            <button class="btn secondary" type="button" data-remittance-documents-email>${U.escapeHtml(i18n?.t('ui.sendEmail', 'Invia email'))}</button>
            <button class="btn secondary" type="button" data-remittance-documents-save-continue>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-remittance-documents-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        <div class="tab-row remittance-documents-tabs">
          <button class="tab-chip${activeTab === 'general' ? ' active' : ''}" type="button" data-remittance-documents-tab="general">${U.escapeHtml(i18n?.t('ui.general', 'Generale'))}</button>
          <button class="tab-chip${activeTab === 'texts' ? ' active' : ''}" type="button" data-remittance-documents-tab="texts">${U.escapeHtml(i18n?.t('ui.texts', 'Testi'))}</button>
          <button class="tab-chip${activeTab === 'detail' ? ' active' : ''}" type="button" data-remittance-documents-tab="detail">${U.escapeHtml(i18n?.t('ui.detail', 'Dettaglio'))}</button>
        </div>
        ${activeTab === 'texts' ? renderTextsTab(draft, i18n) : (activeTab === 'detail' ? renderDetailTable(draft, i18n) : renderGeneralTab(draft, i18n))}
      </section>`;
  }

  function renderSavedRecords(state, i18n) {
    const records = Array.isArray(state?.remittanceDocumentRecords) ? state.remittanceDocumentRecords : [];
    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsSavedHint', 'Riapri rapidamente le rimesse documenti già generate.'))}</p>
          </div>
        </div>
        <div class="module-card-grid remittance-documents-records-grid">
          ${records.length ? records.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).map((record) => `
            <button class="module-card remittance-documents-record-card" type="button" data-remittance-documents-open-record="${U.escapeHtml(record.id)}">
              <div><strong>${U.escapeHtml(record.practiceReference || '—')}</strong><div class="module-card-meta">${U.escapeHtml(record.client || '—')}</div></div>
              <div class="module-card-meta">${U.escapeHtml(record.hawbReference || '—')}</div>
              <div class="module-card-meta">${U.escapeHtml(record.reference || '—')}</div>
            </button>`).join('') : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noSavedDocuments', 'Nessun documento salvato.'))}</div>`}
        </div>
      </section>`;
  }

  function render(state, options = {}) {
    const { i18n } = options;
    ensureState(state);
    const kpis = buildKpis(state);
    const selectedPractice = typeof options.getSelectedPractice === 'function' ? options.getSelectedPractice() : null;
    return `
      <div class="remittance-module notice-module">
        <section class="hero">
          <div class="hero-meta">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsEyebrow', 'PRATICHE · RIMESSA DOCUMENTI'))}</div>
          <h2>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h2>
          <p>${U.escapeHtml(i18n?.t('ui.remittanceDocumentsIntro', 'Sottomodulo operativo dedicato alla rimessa documenti collegata alla pratica madre, con gestione testi e dettaglio documentale.'))}</p>
        </section>
        <section class="three-col">
          <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.records))}</div></div>
          <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.openMasks))}</div></div>
          <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.linkedPractices', 'Pratiche collegate'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.linkedPractices))}</div></div>
        </section>
        ${renderLauncher(state, i18n, selectedPractice)}
        ${renderSessionStrip(state, i18n)}
        ${renderEditor(state, i18n)}
        ${renderSavedRecords(state, i18n)}
      </div>
    `;
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

    root.querySelectorAll('[data-remittance-documents-new-session]').forEach((button) => {
      button.addEventListener('click', () => {
        ensureState(state);
        Workspace.openDraftSession(state, { createEmptyDraft: () => createEmptyDraft(state), draft: createEmptyDraft(state), source: 'manual', isDirty: true });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-open-active]').forEach((button) => {
      button.addEventListener('click', () => {
        const practice = typeof getSelectedPractice === 'function' ? getSelectedPractice() : null;
        if (!practice) return;
        Workspace.openDraftSession(state, {
          createEmptyDraft: () => createEmptyDraft(state),
          draft: buildDraftFromPractice(state, practice),
          source: 'practice',
          isDirty: true
        });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-open-practice]').forEach((button) => {
      button.addEventListener('click', () => {
        const practiceId = button.dataset.remittanceDocumentsOpenPractice;
        const practice = (state.practices || []).find((entry) => String(entry?.id || '').trim() === String(practiceId || '').trim()) || null;
        if (!practice) return;
        Workspace.openDraftSession(state, {
          createEmptyDraft: () => createEmptyDraft(state),
          draft: buildDraftFromPractice(state, practice),
          source: 'practice',
          isDirty: true
        });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-open-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = findRecord(state, button.dataset.remittanceDocumentsOpenRecord);
        if (!record) return;
        Workspace.openRecordSession(state, record, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-session-switch]').forEach((button) => {
      button.addEventListener('click', () => {
        Workspace.switchSession(state, button.dataset.remittanceDocumentsSessionSwitch, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionTab(state, session.id, button.dataset.remittanceDocumentsTab, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-field]').forEach((field) => {
      const handler = () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionField(state, session.id, field.dataset.remittanceDocumentsField, field.value, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
      };
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    root.querySelectorAll('[data-remittance-documents-line-field]').forEach((field) => {
      const handler = () => {
        const index = Number(field.dataset.remittanceDocumentsLineIndex || -1);
        if (index < 0) return;
        updateActiveLineItem(state, index, field.dataset.remittanceDocumentsLineField, field.value);
        save?.();
      };
      field.addEventListener('input', handler);
    });

    root.querySelectorAll('[data-remittance-documents-add-line]').forEach((button) => {
      button.addEventListener('click', () => {
        addLineItem(state);
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-remove-line]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.remittanceDocumentsRemoveLine || -1);
        if (index < 0) return;
        removeLineItem(state, index);
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-session-close]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const closed = await closeSessionWithGuard(state, button.dataset.remittanceDocumentsSessionClose, i18n);
        if (!closed) return;
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-documents-print]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        printDraft(session.draft || {}, i18n);
      });
    });

    root.querySelectorAll('[data-remittance-documents-email]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        window.location.href = buildMailtoHref(session.draft || {}, i18n);
      });
    });

    root.querySelectorAll('[data-remittance-documents-save-continue]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        save?.();
        render?.();
        toast?.(i18n?.t('ui.remittanceDocumentsSaved', 'Rimessa documenti salvata'), 'success');
      });
    });

    root.querySelectorAll('[data-remittance-documents-save-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        Workspace.closeSession(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
        toast?.(i18n?.t('ui.remittanceDocumentsSaved', 'Rimessa documenti salvata'), 'success');
      });
    });
  }

  return {
    ensureState,
    createEmptyDraft,
    render,
    bind
  };
})();
