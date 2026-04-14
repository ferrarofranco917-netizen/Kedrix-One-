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

  function currentOperatorName(state) {
    const activeUserId = String(state?.activeUserId || '').trim();
    const user = (state?.users || []).find((entry) => String(entry?.id || '').trim() === activeUserId) || null;
    return String(user?.name || '').trim();
  }

  function inferTripType(practice) {
    const type = String(practice?.practiceType || '').toLowerCase();
    if (type.includes('air')) return 'AEREO';
    if (type.includes('road') || type.includes('terra')) return 'TERRA';
    return 'MARE';
  }

  function createEmptyDraft(state, overrides = {}) {
    return Workspace.cloneDraft({
      editingRecordId: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      hawbReference: '',
      status: 'draft',
      client: '',
      sender: '',
      consignee: '',
      reference: '',
      attentionTo: '',
      documentDate: today(),
      loadingPort: '',
      unloadingPort: '',
      supplierInvoice: '',
      amount: '',
      amountCurrency: 'EUR',
      courierMode: '',
      voyage: '',
      vessel: '',
      deliveryConditions: '',
      internalText: '',
      customerText: '',
      operatorName: currentOperatorName(state),
      tripType: 'MARE',
      sourcePracticeSnapshot: {},
      lineItems: [Workspace.defaultLineItem()],
      ...overrides
    });
  }

  function buildDraftFromPractice(state, practice) {
    const dynamic = practice?.dynamicData || {};
    const booking = String(practice?.booking || dynamic.booking || '').trim();
    const policyReference = String(dynamic.policyNumber || dynamic.policyReference || '').trim();
    return createEmptyDraft(state, {
      practiceId: String(practice?.id || '').trim(),
      practiceReference: String(practice?.reference || '').trim(),
      practiceType: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
      hawbReference: String(dynamic.hawb || dynamic.awb || dynamic.hawbReference || '').trim(),
      status: String(practice?.status || 'draft').trim() || 'draft',
      client: String(practice?.clientName || practice?.client || '').trim(),
      sender: String(dynamic.senderParty || dynamic.exporter || dynamic.shipper || '').trim(),
      consignee: String(dynamic.consignee || dynamic.receiverParty || '').trim(),
      reference: String(dynamic.mainReference || practice?.reference || booking || '').trim(),
      attentionTo: String(dynamic.attentionTo || '').trim(),
      documentDate: String(practice?.practiceDate || today()).trim() || today(),
      loadingPort: String(dynamic.loadingPort || dynamic.originPort || dynamic.originNode || '').trim(),
      unloadingPort: String(dynamic.unloadingPort || dynamic.destinationPort || dynamic.destinationNode || '').trim(),
      supplierInvoice: String(dynamic.foreignInvoice || dynamic.supplierInvoice || '').trim(),
      amount: String(dynamic.invoiceAmount || dynamic.amount || '').trim(),
      amountCurrency: String(dynamic.invoiceCurrency || dynamic.amountCurrency || 'EUR').trim() || 'EUR',
      courierMode: String(dynamic.courierMode || dynamic.deliveryMethod || '').trim(),
      voyage: String(dynamic.voyage || '').trim(),
      vessel: String(dynamic.vessel || '').trim(),
      deliveryConditions: String(dynamic.deliveryConditions || dynamic.incoterm || '').trim(),
      operatorName: currentOperatorName(state),
      tripType: inferTripType(practice),
      sourcePracticeSnapshot: {
        id: String(practice?.id || '').trim(),
        reference: String(practice?.reference || '').trim(),
        type: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
        status: String(practice?.status || '').trim(),
        bookingReference: booking,
        policyReference
      },
      lineItems: [Workspace.defaultLineItem({
        documentType: policyReference ? 'Polizza / BL / AWB' : 'Documento operativo',
        documentReference: policyReference || booking || String(practice?.reference || '').trim(),
        copies: '1',
        note: String(dynamic.goodsDescription || practice?.goodsDescription || '').trim()
      })]
    });
  }

  function eligiblePractices(state) {
    return (state?.practices || []).filter((practice) => {
      const type = String(practice?.practiceType || '').toLowerCase();
      return type.includes('sea') || type.includes('air');
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

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const rows = Number(options.rows || 4);
    const items = Array.isArray(options.items) ? options.items : [];
    const disabled = options.disabled ? ' disabled' : '';
    const placeholder = U.escapeHtml(options.placeholder || '');
    const span = Number(options.span || 2);
    const classes = ['field', 'remittance-field', `remittance-field-${String(name || '').trim()}`, `remittance-col-${span}`];
    if (options.full) classes.push('full');
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
      <section class="panel practice-workspace-panel remittance-documents-workspace-panel remittance-module-panel">
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
            const title = String(draft.practiceReference || i18n?.t('practices/rimessa-documenti', 'Rimessa documenti') || 'Rimessa documenti').trim();
            const meta = [draft.client, draft.hawbReference || draft.reference].filter(Boolean).join(' · ');
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
    const available = eligiblePractices(state);
    const activePractice = selectedPractice || null;
    const activeAir = activePractice && String(activePractice.practiceType || '').toLowerCase().includes('air') ? activePractice : null;
    return `
      <section class="panel remittance-documents-launcher-panel remittance-module-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsLauncherTitle', 'Apri o crea rimessa documenti'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsLauncherHint', 'Usa la pratica attiva, un HAWB attivo oppure scegli una pratica collegata al flusso documentale.'))}</p>
          </div>
          <div class="action-row">
            ${activePractice ? `<button class="btn" type="button" data-remittance-documents-open-active>${U.escapeHtml(i18n?.t('ui.choosePractice', 'Scegli pratica'))}</button>` : ''}
            ${activeAir ? `<button class="btn secondary" type="button" data-remittance-documents-open-hawb>${U.escapeHtml(i18n?.t('ui.chooseHawb', 'Scegli HAWB'))}</button>` : ''}
            <button class="btn secondary" type="button" data-remittance-documents-new-session>${U.escapeHtml(i18n?.t('ui.newBlankDocument', 'Nuovo documento vuoto'))}</button>
          </div>
        </div>
        <div class="form-grid three remittance-documents-practice-grid">
          ${available.slice(0, 18).map((practice) => `
            <button class="stack-item remittance-documents-practice-chip" type="button" data-remittance-documents-open-practice="${U.escapeHtml(practice.id)}">
              <strong>${U.escapeHtml(practice.reference || '—')}</strong>
              <span>${U.escapeHtml(practice.clientName || practice.client || '')}</span>
              <span>${U.escapeHtml(practice.practiceTypeLabel || practice.practiceType || '')}</span>
            </button>`).join('')}
        </div>
      </section>`;
  }

  function renderSummaryPills(draft, i18n) {
    const items = [
      [i18n?.t('ui.generatedNumber', 'Numero pratica'), draft.practiceReference || '—'],
      [i18n?.t('ui.clientRequired', 'Cliente'), draft.client || '—'],
      [i18n?.t('ui.reference', 'Riferimento'), draft.reference || '—'],
      [i18n?.t('ui.date', 'Data'), draft.documentDate || '—']
    ];
    return `<div class="tag-grid remittance-documents-summary-pills">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderGeneralTab(draft, i18n) {
    const fields = [
      { label: i18n?.t('ui.generatedNumber', 'Numero pratica'), name: 'practiceReference', value: draft.practiceReference, options: { span: 2, disabled: true } },
      { label: i18n?.t('ui.clientRequired', 'Cliente'), name: 'client', value: draft.client, options: { span: 4 } },
      { label: i18n?.t('ui.sender', 'Mittente'), name: 'sender', value: draft.sender, options: { span: 3 } },
      { label: i18n?.t('ui.consignee', 'Destinatario'), name: 'consignee', value: draft.consignee, options: { span: 3 } },
      { label: i18n?.t('ui.reference', 'Riferimento'), name: 'reference', value: draft.reference, options: { span: 3 } },
      { label: i18n?.t('ui.remittanceDocumentsAttentionTo', 'All’attenzione di'), name: 'attentionTo', value: draft.attentionTo, options: { span: 3 } },
      { label: i18n?.t('ui.date', 'Data'), name: 'documentDate', value: draft.documentDate, options: { type: 'date', span: 2 } },
      { label: i18n?.t('ui.hawb', 'HAWB'), name: 'hawbReference', value: draft.hawbReference, options: { span: 2 } },
      { label: i18n?.t('ui.amount', 'Importo'), name: 'amount', value: draft.amount, options: { span: 1 } },
      { label: i18n?.t('ui.currency', 'Valuta'), name: 'amountCurrency', value: draft.amountCurrency, options: { type: 'select', span: 1, items: [{ value: 'EUR', label: 'EUR' }, { value: 'USD', label: 'USD' }, { value: 'GBP', label: 'GBP' }] } },
      { label: i18n?.t('ui.remittanceDocumentsLoading', 'Imbarco'), name: 'loadingPort', value: draft.loadingPort, options: { span: 3 } },
      { label: i18n?.t('ui.remittanceDocumentsUnloading', 'Sbarco'), name: 'unloadingPort', value: draft.unloadingPort, options: { span: 3 } },
      { label: i18n?.t('ui.remittanceDocumentsSupplierInvoice', 'Fattura Fornitore'), name: 'supplierInvoice', value: draft.supplierInvoice, options: { span: 2 } },
      { label: i18n?.t('ui.remittanceDocumentsCourierMode', 'A mezzo corriere'), name: 'courierMode', value: draft.courierMode, options: { span: 2 } },
      { label: i18n?.t('ui.voyage', 'Viaggio'), name: 'voyage', value: draft.voyage, options: { span: 2 } },
      { label: i18n?.t('ui.vessel', 'Nave'), name: 'vessel', value: draft.vessel, options: { span: 2 } },
      { label: i18n?.t('ui.deliveryConditions', 'Condizioni di consegna'), name: 'deliveryConditions', value: draft.deliveryConditions, options: { span: 4 } }
    ];
    return `${renderSummaryPills(draft, i18n)}<div class="remittance-general-grid">${fields.map((field) => renderField(field.label, field.name, field.value, field.options || {})).join('')}</div>`;
  }

  function renderTextsTab(draft, i18n) {
    return `
      <div class="form-grid two remittance-documents-form-grid">
        ${renderField(i18n?.t('ui.remittanceDocumentsInternalText', 'Testo interno'), 'internalText', draft.internalText, { type: 'textarea', rows: 10, full: true, span: 6 })}
        ${renderField(i18n?.t('ui.remittanceDocumentsCustomerText', 'Testo cliente'), 'customerText', draft.customerText, { type: 'textarea', rows: 10, full: true, span: 6 })}
      </div>`;
  }

  function renderDetailTab(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <section class="table-panel remittance-documents-lines-panel notice-lines-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.details', 'Dettaglio'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsDetailHint', 'Elenca i documenti inclusi nella rimessa con riferimento, copie e note operative.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-remittance-documents-add-line>${U.escapeHtml(i18n?.t('ui.addLine', 'Aggiungi riga'))}</button></div>
        </div>
        <div class="table-wrap notice-lines-wrap">
          <table class="table remittance-documents-lines-table notice-lines-table">
            <thead>
              <tr>
                <th>${U.escapeHtml(i18n?.t('ui.documentType', 'Tipo documento'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.copies', 'Copie'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.notes', 'Note'))}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, index) => `
                <tr>
                  <td><input type="text" value="${U.escapeHtml(row.documentType || '')}" data-remittance-documents-line-index="${index}" data-remittance-documents-line-field="documentType"></td>
                  <td><input type="text" value="${U.escapeHtml(row.documentReference || '')}" data-remittance-documents-line-index="${index}" data-remittance-documents-line-field="documentReference"></td>
                  <td><input type="text" value="${U.escapeHtml(row.copies || '')}" data-remittance-documents-line-index="${index}" data-remittance-documents-line-field="copies"></td>
                  <td><input type="text" value="${U.escapeHtml(row.note || '')}" data-remittance-documents-line-index="${index}" data-remittance-documents-line-field="note"></td>
                  <td><button class="btn secondary" type="button" data-remittance-documents-remove-line="${index}">${U.escapeHtml(i18n?.t('ui.remove', 'Rimuovi'))}</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function buildMailtoHref(draft, i18n) {
    const subject = `${i18n?.t('practices/rimessa-documenti', 'Rimessa documenti')} ${draft.practiceReference || ''}`.trim();
    const lines = [
      `${i18n?.t('ui.generatedNumber', 'Pratica')}: ${draft.practiceReference || '—'}`,
      `${i18n?.t('ui.clientRequired', 'Cliente')}: ${draft.client || '—'}`,
      `${i18n?.t('ui.reference', 'Riferimento')}: ${draft.reference || '—'}`,
      `${i18n?.t('ui.date', 'Data')}: ${draft.documentDate || '—'}`,
      `${i18n?.t('ui.remittanceDocumentsLoading', 'Imbarco')}: ${draft.loadingPort || '—'}`,
      `${i18n?.t('ui.remittanceDocumentsUnloading', 'Sbarco')}: ${draft.unloadingPort || '—'}`,
      '',
      draft.customerText || draft.internalText || ''
    ];
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  function buildPrintableHtml(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 8px;font-size:24px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cfd4dc;padding:8px;font-size:12px;text-align:left;vertical-align:top}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}.meta div{border:1px solid #d8dde6;padding:10px}.block{margin-top:18px}.block h2{font-size:16px;margin:0 0 8px}</style></head><body><h1>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h1><div class="meta"><div><strong>${U.escapeHtml(i18n?.t('ui.generatedNumber', 'Pratica'))}</strong><br>${U.escapeHtml(draft.practiceReference || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.clientRequired', 'Cliente'))}</strong><br>${U.escapeHtml(draft.client || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</strong><br>${U.escapeHtml(draft.reference || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.date', 'Data'))}</strong><br>${U.escapeHtml(draft.documentDate || '—')}</div></div><table><thead><tr><th>${U.escapeHtml(i18n?.t('ui.documentType', 'Tipo documento'))}</th><th>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</th><th>${U.escapeHtml(i18n?.t('ui.copies', 'Copie'))}</th><th>${U.escapeHtml(i18n?.t('ui.notes', 'Note'))}</th></tr></thead><tbody>${rows.map((row)=>`<tr><td>${U.escapeHtml(row.documentType || '')}</td><td>${U.escapeHtml(row.documentReference || '')}</td><td>${U.escapeHtml(row.copies || '')}</td><td>${U.escapeHtml(row.note || '')}</td></tr>`).join('')}</tbody></table><div class="block"><h2>${U.escapeHtml(i18n?.t('ui.remittanceDocumentsCustomerText', 'Testo cliente'))}</h2><div>${U.escapeHtml(draft.customerText || '').replace(/\n/g,'<br>')}</div></div><div class="block"><h2>${U.escapeHtml(i18n?.t('ui.remittanceDocumentsInternalText', 'Testo interno'))}</h2><div>${U.escapeHtml(draft.internalText || '').replace(/\n/g,'<br>')}</div></div></body></html>`;
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
      <section class="panel remittance-documents-editor-panel remittance-module-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsEditorHint', 'Documento operativo per la rimessa documentale collegata alla pratica madre, con tab Generale, Testi e Dettaglio.'))}</p>
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
          <button class="tab-chip${activeTab === 'detail' ? ' active' : ''}" type="button" data-remittance-documents-tab="detail">${U.escapeHtml(i18n?.t('ui.details', 'Dettaglio'))}</button>
        </div>
        ${activeTab === 'texts' ? renderTextsTab(draft, i18n) : activeTab === 'detail' ? renderDetailTab(draft, i18n) : renderGeneralTab(draft, i18n)}
      </section>`;
  }

  function renderSavedRecords(state, i18n) {
    const records = Array.isArray(state?.remittanceDocumentRecords) ? state.remittanceDocumentRecords : [];
    return `
      <section class="panel remittance-documents-records-panel remittance-module-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsSavedHint', 'Riapri rapidamente le rimesse documenti già generate.'))}</p>
          </div>
        </div>
        ${records.length ? `<div class="three-col remittance-documents-records-grid">${records.map((record) => `
          <button class="module-card remittance-documents-record-card" type="button" data-remittance-documents-open-record="${U.escapeHtml(record.id)}">
            <strong>${U.escapeHtml(record.practiceReference || '—')}</strong>
            <span>${U.escapeHtml(record.client || '—')}</span>
            <span>${U.escapeHtml(record.reference || record.hawbReference || '—')}</span>
          </button>`).join('')}</div>` : `<div class="empty-state"><strong>${U.escapeHtml(i18n?.t('ui.noSavedDocuments', 'Nessun documento salvato'))}</strong><span>${U.escapeHtml(i18n?.t('ui.remittanceDocumentsSavedEmpty', 'Salva una rimessa documenti per ritrovarla qui.'))}</span></div>`}
      </section>`;
  }

  function render(state, context = {}) {
    const i18n = context.i18n || { t: (key, fallback) => fallback || key };
    const getSelectedPractice = typeof context.getSelectedPractice === 'function' ? context.getSelectedPractice : () => null;
    ensureState(state);
    const kpis = buildKpis(state);
    const selectedPractice = getSelectedPractice();
    return `
      <div class="remittance-documents-module notice-module">
      <section class="hero remittance-documents-hero">
        <div class="hero-meta">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsEyebrow', 'PRATICHE · RIMESSA DOCUMENTI'))}</div>
        <h2>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h2>
        <p>${U.escapeHtml(i18n?.t('ui.remittanceDocumentsHeroHint', 'Sottomodulo operativo per la trasmissione e rimessa dei documenti collegati alla pratica madre.'))}</p>
      </section>
      <section class="three-col remittance-documents-kpi-row">
        <div class="panel"><div class="summary-box"><span>${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.records))}</div></div></div>
        <div class="panel"><div class="summary-box"><span>${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.openMasks))}</div></div></div>
        <div class="panel"><div class="summary-box"><span>${U.escapeHtml(i18n?.t('ui.linkedPractices', 'Pratiche collegate'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.linkedPractices))}</div></div></div>
      </section>
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

    root.querySelectorAll('[data-remittance-documents-open-hawb]').forEach((button) => {
      button.addEventListener('click', () => {
        const practice = typeof getSelectedPractice === 'function' ? getSelectedPractice() : null;
        if (!practice) return;
        const draft = buildDraftFromPractice(state, practice);
        draft.hawbReference = draft.hawbReference || draft.reference;
        Workspace.openDraftSession(state, {
          createEmptyDraft: () => createEmptyDraft(state),
          draft,
          source: 'hawb',
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
