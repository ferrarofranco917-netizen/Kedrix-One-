window.KedrixOneRemittanceDocumentsModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneRemittanceDocumentsWorkspace || null;
  const Feedback = window.KedrixOneAppFeedback || null;
  const ModuleFieldLinks = window.KedrixOneModuleFieldLinks || null;

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

  function createEmptyDraft(state, overrides = {}) {
    const draft = Workspace.cloneDraft({
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
      documentDate: today(),
      hawbReference: '',
      loadingPort: '',
      unloadingPort: '',
      supplierInvoice: '',
      amount: '',
      currency: 'EUR',
      courierMode: 'NO',
      voyage: '',
      vessel: '',
      deliveryConditions: '',
      operatorName: currentOperatorName(state),
      internalText: '',
      customerText: '',
      sourcePracticeSnapshot: {},
      lineItems: [Workspace.defaultLineItem()],
      ...overrides
    });
    return ModuleFieldLinks?.seedDraftLinks
      ? ModuleFieldLinks.seedDraftLinks({ state, moduleKey: 'remittanceDocuments', draft })
      : draft;
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
      consignee: String(dynamic.consignee || dynamic.receiverParty || '').trim(),
      reference: String(dynamic.mainReference || practice?.reference || '').trim(),
      attentionTo: String(dynamic.attentionTo || '').trim(),
      documentDate: String(practice?.practiceDate || today()).trim() || today(),
      hawbReference: String(dynamic.hawbReference || dynamic.hawb || dynamic.hawbNumber || dynamic.houseAwb || dynamic.policyNumber || '').trim(),
      loadingPort: String(dynamic.loadingPort || dynamic.originPort || dynamic.originNode || '').trim(),
      unloadingPort: String(dynamic.unloadingPort || dynamic.destinationPort || dynamic.destinationNode || '').trim(),
      supplierInvoice: String(dynamic.foreignInvoice || dynamic.supplierInvoice || '').trim(),
      amount: String(dynamic.invoiceAmount || dynamic.amount || '').trim(),
      currency: String(dynamic.invoiceCurrency || dynamic.currency || 'EUR').trim() || 'EUR',
      courierMode: String(dynamic.courierMode || 'NO').trim() || 'NO',
      voyage: String(dynamic.voyage || '').trim(),
      vessel: String(dynamic.vessel || '').trim(),
      deliveryConditions: String(dynamic.deliveryConditions || dynamic.incoterm || '').trim(),
      operatorName: currentOperatorName(state),
      sourcePracticeSnapshot: {
        id: String(practice?.id || '').trim(),
        reference: String(practice?.reference || '').trim(),
        type: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
        status: String(practice?.status || '').trim()
      },
      lineItems: [Workspace.defaultLineItem({
        documentType: 'Fattura',
        reference: String(dynamic.foreignInvoice || dynamic.supplierInvoice || '').trim(),
        copies: String(dynamic.copies || '').trim(),
        notes: String(dynamic.goodsDescription || '').trim()
      })]
    });
  }

  function practiceCandidates(state) {
    return (state?.practices || []).slice().sort((a, b) => String(b?.practiceDate || '').localeCompare(String(a?.practiceDate || '')));
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
    const xs = new Set(['amount', 'currency', 'courierMode']);
    const sm = new Set(['documentDate', 'operatorName', 'hawbReference']);
    const md = new Set(['practiceReference', 'reference', 'attentionTo', 'loadingPort', 'unloadingPort', 'supplierInvoice', 'voyage', 'vessel']);
    const lg = new Set(['client', 'sender', 'consignee', 'deliveryConditions']);
    if (xs.has(key)) return 'xs';
    if (sm.has(key)) return 'sm';
    if (md.has(key)) return 'md';
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
    const span = Number(options.span || 1);
    const classes = ['field', 'notice-field', `notice-size-${size}`, `notice-field-${String(name || '').trim()}`, `notice-col-${Number.isFinite(span) ? span : 1}`];
    if (options.full || size === 'full') classes.push('full');
    const baseAttrs = `id="rd-${U.escapeHtml(name)}" data-remittance-field="${U.escapeHtml(name)}"${disabled}`;
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
      <section class="panel practice-workspace-panel remittance-documents-workspace-panel notice-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsWorkspaceHint', 'Ogni rimessa documenti resta aperta nella sua maschera interna Kedrix.'))}</p>
          </div>
        </div>
        <div class="notice-session-strip">
          ${sessions.map((session) => {
            const draft = session.draft || {};
            const isActive = session.id === activeId;
            return `<div class="notice-session-chip${isActive ? ' active' : ''}">
              <button class="notice-session-main" type="button" data-remittance-session-switch="${U.escapeHtml(session.id)}">
                <strong>${U.escapeHtml(draft.practiceReference || i18n?.t('ui.newMask', 'Nuova maschera'))}</strong>
                <span>${U.escapeHtml(draft.client || '—')}</span>
                <em>${session.isDirty ? '• ' : ''}${U.escapeHtml(draft.reference || draft.hawbReference || '—')}</em>
              </button>
              <button class="notice-session-close" type="button" data-remittance-session-close="${U.escapeHtml(session.id)}" aria-label="${U.escapeHtml(i18n?.t('ui.closeMask', 'Chiudi maschera'))}">×</button>
            </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  function renderLauncher(state, i18n, selectedPractice) {
    const available = practiceCandidates(state);
    return `
      <section class="panel remittance-documents-launcher-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsLauncherTitle', 'Apri o crea rimessa documenti'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsLauncherHint', 'Apri il documento dalla pratica attiva o scegli una pratica dall’elenco operativo.'))}</p>
          </div>
          <div class="action-row">
            ${selectedPractice ? `<button class="btn" type="button" data-remittance-open-active>${U.escapeHtml(i18n?.t('ui.useCurrentPractice', 'Usa pratica attiva'))}</button>` : ''}
            <button class="btn secondary" type="button" data-remittance-new-session>${U.escapeHtml(i18n?.t('ui.newBlankDocument', 'Nuovo documento vuoto'))}</button>
          </div>
        </div>
        <div class="form-grid three remittance-documents-practice-grid">
          ${available.slice(0, 18).map((practice) => `
            <button class="stack-item remittance-documents-practice-chip" type="button" data-remittance-open-practice="${U.escapeHtml(practice.id)}">
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
      [i18n?.t('ui.hawb', 'HAWB'), draft.hawbReference || '—']
    ];
    return `<div class="tag-grid remittance-documents-summary-pills">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderDocumentTypeOptions(value, i18n) {
    const baseItems = [
      { value: '', label: i18n?.t('ui.select', 'Seleziona') || 'Seleziona' },
      { value: 'Fattura', label: i18n?.t('ui.invoice', 'Fattura') || 'Fattura' },
      { value: 'Packing list', label: i18n?.t('ui.packingList', 'Packing list') || 'Packing list' },
      { value: 'Polizza', label: i18n?.t('ui.policyNumber', 'Polizza') || 'Polizza' },
      { value: 'HAWB', label: 'HAWB' },
      { value: 'MAWB', label: 'MAWB' },
      { value: 'Certificato origine', label: i18n?.t('ui.certificateOfOrigin', 'Certificato origine') || 'Certificato origine' },
      { value: 'DDT', label: 'DDT' },
      { value: 'Lettera vettura', label: i18n?.t('ui.transportDocument', 'Lettera vettura') || 'Lettera vettura' },
      { value: 'Altro', label: i18n?.t('ui.other', 'Altro') || 'Altro' }
    ];
    const normalized = String(value || '').trim();
    if (normalized && !baseItems.some((item) => item.value === normalized)) {
      baseItems.splice(baseItems.length - 1, 0, { value: normalized, label: normalized });
    }
    return baseItems;
  }

  function renderDetailTable(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <section class="table-panel remittance-documents-lines-panel notice-lines-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.detail', 'Dettaglio'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsDetailHint', 'Elenco documenti, riferimenti, copie e note di rimessa.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-remittance-add-line>${U.escapeHtml(i18n?.t('ui.addLine', 'Aggiungi riga'))}</button></div>
        </div>
        <div class="table-wrap notice-lines-wrap">
          <table class="table notice-lines-table remittance-lines-table">
            <colgroup>
              <col style="width:20%"><col style="width:26%"><col style="width:9%"><col style="width:35%"><col style="width:10%">
            </colgroup>
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
                  <td>
                    <select data-remittance-line-index="${index}" data-remittance-line-field="documentType">
                      ${renderDocumentTypeOptions(row.documentType, i18n).map((item) => {
                        const itemValue = String(item?.value ?? '');
                        const selected = itemValue === String(row.documentType ?? '') ? ' selected' : '';
                        return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
                      }).join('')}
                    </select>
                  </td>
                  <td><input type="text" value="${U.escapeHtml(row.reference || '')}" data-remittance-line-index="${index}" data-remittance-line-field="reference"></td>
                  <td><input type="text" value="${U.escapeHtml(row.copies || '')}" data-remittance-line-index="${index}" data-remittance-line-field="copies"></td>
                  <td><textarea rows="2" data-remittance-line-index="${index}" data-remittance-line-field="notes">${U.escapeHtml(row.notes || '')}</textarea></td>
                  <td><button class="btn secondary" type="button" data-remittance-remove-line="${index}">${U.escapeHtml(i18n?.t('ui.remove', 'Rimuovi'))}</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function renderGeneralFieldGrid(fields, className = 'notice-general-grid') {
    return `<div class="${U.escapeHtml(className)}">${fields.map((field) => renderField(field.label, field.name, field.value, { ...(field.options || {}), span: field.span || 1 })).join('')}</div>`;
  }

  function renderGeneralSection(title, hint, fields, options = {}) {
    return `
      <section class="remittance-documents-section ${U.escapeHtml(options.sectionClass || '')}">
        <div class="remittance-documents-section-head">
          <h4>${U.escapeHtml(title)}</h4>
          ${hint ? `<p>${U.escapeHtml(hint)}</p>` : ''}
        </div>
        ${renderGeneralFieldGrid(fields, options.gridClass || 'remittance-documents-general-grid')}
      </section>`;
  }

  function renderLinkedPracticeCard(draft, i18n) {
    const snapshot = draft?.sourcePracticeSnapshot || {};
    const items = [
      [i18n?.t('ui.generatedNumber', 'Pratica'), draft.practiceReference || '—'],
      [i18n?.t('ui.type', 'Tipologia'), draft.practiceType || snapshot.type || '—'],
      [i18n?.t('ui.status', 'Stato'), draft.status || snapshot.status || '—'],
      [i18n?.t('ui.clientRequired', 'Cliente'), draft.client || '—']
    ];
    return `
      <section class="remittance-documents-section remittance-documents-linked-practice">
        <div class="remittance-documents-section-head">
          <h4>${U.escapeHtml(i18n?.t('ui.linkedPractice', 'Pratica collegata'))}</h4>
          <p>${U.escapeHtml(i18n?.t('ui.remittanceDocumentsLinkedPracticeHint', 'Ancoraggio rapido alla pratica madre per mantenere coerenza operativa e documentale.'))}</p>
        </div>
        <div class="tag-grid remittance-documents-practice-meta">
          ${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}
        </div>
      </section>`;
  }

  function renderGeneralTab(draft, i18n) {
    const identityFields = [
      { label: i18n?.t('ui.generatedNumber', 'Pratica'), name: 'practiceReference', value: draft.practiceReference, options: { disabled: true } },
      { label: i18n?.t('ui.type', 'Tipologia'), name: 'practiceType', value: draft.practiceType, options: { disabled: true } },
      { label: i18n?.t('ui.status', 'Stato'), name: 'status', value: draft.status, options: { disabled: true } },
      { label: i18n?.t('ui.date', 'Data'), name: 'documentDate', value: draft.documentDate, options: { type: 'date' } },
      { label: i18n?.t('ui.reference', 'Riferimento'), name: 'reference', value: draft.reference, span: 2 },
      { label: i18n?.t('ui.hawb', 'HAWB'), name: 'hawbReference', value: draft.hawbReference },
      { label: i18n?.t('ui.remittanceDocumentsSupplierInvoice', 'Fattura fornitore'), name: 'supplierInvoice', value: draft.supplierInvoice },
      { label: i18n?.t('ui.operator', 'Operatore'), name: 'operatorName', value: draft.operatorName }
    ];

    const counterpartFields = [
      { label: i18n?.t('ui.clientRequired', 'Cliente'), name: 'client', value: draft.client, span: 2 },
      { label: i18n?.t('ui.sender', 'Mittente'), name: 'sender', value: draft.sender },
      { label: i18n?.t('ui.consignee', 'Destinatario'), name: 'consignee', value: draft.consignee },
      { label: i18n?.t('ui.remittanceDocumentsAttentionTo', 'All’attenzione di'), name: 'attentionTo', value: draft.attentionTo, span: 2 }
    ];

    const movementFields = [
      { label: i18n?.t('ui.remittanceDocumentsLoadingPort', 'Imbarco'), name: 'loadingPort', value: draft.loadingPort },
      { label: i18n?.t('ui.remittanceDocumentsUnloadingPort', 'Sbarco'), name: 'unloadingPort', value: draft.unloadingPort },
      { label: i18n?.t('ui.vessel', 'Nave'), name: 'vessel', value: draft.vessel },
      { label: i18n?.t('ui.voyage', 'Viaggio'), name: 'voyage', value: draft.voyage },
      { label: i18n?.t('ui.remittanceDocumentsCourierMode', 'A mezzo corriere'), name: 'courierMode', value: draft.courierMode, options: { type: 'select', items: [{ value: 'NO', label: 'NO' }, { value: 'SI', label: 'SI' }] } },
      { label: i18n?.t('ui.deliveryConditions', 'Condizioni di consegna'), name: 'deliveryConditions', value: draft.deliveryConditions, span: 2 }
    ];

    const valueFields = [
      { label: i18n?.t('ui.amount', 'Importo'), name: 'amount', value: draft.amount },
      { label: i18n?.t('ui.currency', 'Valuta'), name: 'currency', value: draft.currency, options: { type: 'select', items: [{ value: 'EUR', label: 'EUR' }, { value: 'USD', label: 'USD' }, { value: 'GBP', label: 'GBP' }, { value: 'CHF', label: 'CHF' }] } }
    ];

    return `
      ${renderSummaryPills(draft, i18n)}
      <div class="remittance-documents-general-layout">
        ${renderLinkedPracticeCard(draft, i18n)}
        ${renderGeneralSection(
          i18n?.t('ui.remittanceDocumentsIdentityTitle', 'Identità documento'),
          i18n?.t('ui.remittanceDocumentsIdentityHint', 'Riferimenti chiave della rimessa, operatore e legame con la pratica.'),
          identityFields
        )}
        ${renderGeneralSection(
          i18n?.t('ui.remittanceDocumentsCounterpartiesTitle', 'Parti e recapiti'),
          i18n?.t('ui.remittanceDocumentsCounterpartiesHint', 'Cliente, mittente, destinatario e soggetto di riferimento per l’invio.'),
          counterpartFields
        )}
        ${renderGeneralSection(
          i18n?.t('ui.remittanceDocumentsMovementTitle', 'Movimento e trasporto'),
          i18n?.t('ui.remittanceDocumentsMovementHint', 'Nodi logistici e dati di trasporto riusabili per stampa ed email.'),
          movementFields
        )}
        ${renderGeneralSection(
          i18n?.t('ui.remittanceDocumentsValuesTitle', 'Valori economici'),
          i18n?.t('ui.remittanceDocumentsValuesHint', 'Importo e valuta mantenuti compatti per una lettura desktop enterprise.'),
          valueFields,
          { sectionClass: 'remittance-documents-section-compact' }
        )}
      </div>`;
  }

  function renderTextsTab(draft, i18n) {
    return `
      <div class="form-grid two remittance-documents-form-grid">
        ${renderField(i18n?.t('ui.remittanceDocumentsInternalText', 'Testo interno'), 'internalText', draft.internalText, { type: 'textarea', rows: 8, full: true })}
        ${renderField(i18n?.t('ui.remittanceDocumentsCustomerText', 'Testo cliente'), 'customerText', draft.customerText, { type: 'textarea', rows: 8, full: true })}
      </div>`;
  }

  function buildMailtoHref(draft, i18n) {
    const subject = `${i18n?.t('practices/rimessa-documenti', 'Rimessa documenti')} ${draft.practiceReference || ''}`.trim();
    const lines = [
      `${i18n?.t('ui.generatedNumber', 'Pratica')}: ${draft.practiceReference || '—'}`,
      `${i18n?.t('ui.clientRequired', 'Cliente')}: ${draft.client || '—'}`,
      `${i18n?.t('ui.reference', 'Riferimento')}: ${draft.reference || '—'}`,
      `${i18n?.t('ui.hawb', 'HAWB')}: ${draft.hawbReference || '—'}`,
      '',
      draft.customerText || draft.internalText || ''
    ];
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  function buildPrintableHtml(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 8px;font-size:24px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cfd4dc;padding:8px;font-size:12px;text-align:left;vertical-align:top}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}.meta div{border:1px solid #d8dde6;padding:10px}.block{margin-top:18px}.block h2{font-size:16px;margin:0 0 8px}</style></head><body><h1>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h1><div class="meta"><div><strong>${U.escapeHtml(i18n?.t('ui.generatedNumber', 'Pratica'))}</strong><br>${U.escapeHtml(draft.practiceReference || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.clientRequired', 'Cliente'))}</strong><br>${U.escapeHtml(draft.client || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</strong><br>${U.escapeHtml(draft.reference || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.hawb', 'HAWB'))}</strong><br>${U.escapeHtml(draft.hawbReference || '—')}</div></div><table><thead><tr><th>${U.escapeHtml(i18n?.t('ui.documentType', 'Tipo documento'))}</th><th>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</th><th>${U.escapeHtml(i18n?.t('ui.copies', 'Copie'))}</th><th>${U.escapeHtml(i18n?.t('ui.notes', 'Note'))}</th></tr></thead><tbody>${rows.map((row)=>`<tr><td>${U.escapeHtml(row.documentType || '')}</td><td>${U.escapeHtml(row.reference || '')}</td><td>${U.escapeHtml(row.copies || '')}</td><td>${U.escapeHtml(row.notes || '')}</td></tr>`).join('')}</tbody></table><div class="block"><h2>${U.escapeHtml(i18n?.t('ui.remittanceDocumentsCustomerText', 'Testo cliente'))}</h2><div>${U.escapeHtml(draft.customerText || '').replace(/\n/g,'<br>')}</div></div><div class="block"><h2>${U.escapeHtml(i18n?.t('ui.remittanceDocumentsInternalText', 'Testo interno'))}</h2><div>${U.escapeHtml(draft.internalText || '').replace(/\n/g,'<br>')}</div></div></body></html>`;
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
    if (session.isDirty) {
      if (!Feedback || typeof Feedback.confirm !== 'function') {
        Feedback?.warning?.(i18n?.t('ui.unsavedChangesMask', 'Ci sono modifiche non salvate in questa maschera. Vuoi chiuderla comunque?'));
        return false;
      }
      const confirmed = await Feedback.confirm({
        title: i18n?.t('ui.closeMask', 'Chiudi maschera'),
        message: i18n?.t('ui.unsavedChangesMask', 'Ci sono modifiche non salvate in questa maschera. Vuoi chiuderla comunque?'),
        confirmLabel: i18n?.t('ui.close', 'Chiudi'),
        cancelLabel: i18n?.t('ui.cancel', 'Annulla'),
        tone: 'warning'
      });
      if (!confirmed) return false;
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
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsEditorHint', 'Documento operativo collegato alla pratica madre, con dati generali, testi e dettaglio rimessa pronti per stampa o invio email.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-remittance-print>${U.escapeHtml(i18n?.t('ui.print', 'Stampa'))}</button>
            <button class="btn secondary" type="button" data-remittance-email>${U.escapeHtml(i18n?.t('ui.sendEmail', 'Invia email'))}</button>
            <button class="btn secondary" type="button" data-remittance-save-continue>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-remittance-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        <div class="tab-row remittance-documents-tabs">
          <button class="tab-chip${activeTab === 'general' ? ' active' : ''}" type="button" data-remittance-tab="general">${U.escapeHtml(i18n?.t('ui.general', 'Generale'))}</button>
          <button class="tab-chip${activeTab === 'texts' ? ' active' : ''}" type="button" data-remittance-tab="texts">${U.escapeHtml(i18n?.t('ui.texts', 'Testi'))}</button>
          <button class="tab-chip${activeTab === 'detail' ? ' active' : ''}" type="button" data-remittance-tab="detail">${U.escapeHtml(i18n?.t('ui.detail', 'Dettaglio'))}</button>
        </div>
        ${activeTab === 'texts' ? renderTextsTab(draft, i18n) : activeTab === 'detail' ? renderDetailTable(draft, i18n) : renderGeneralTab(draft, i18n)}
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
            <button class="module-card remittance-documents-record-card" type="button" data-remittance-open-record="${U.escapeHtml(record.id)}">
              <div><strong>${U.escapeHtml(record.practiceReference || '—')}</strong><div class="module-card-meta">${U.escapeHtml(record.client || '—')}</div></div>
              <div class="module-card-meta">${U.escapeHtml(record.reference || '—')}</div>
              <div class="module-card-meta">${U.escapeHtml(record.hawbReference || '—')}</div>
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
      <div class="notice-module remittance-module">
      <section class="hero">
        <div class="hero-meta">${U.escapeHtml(i18n?.t('ui.remittanceDocumentsEyebrow', 'PRATICHE · RIMESSA DOCUMENTI'))}</div>
        <h2>${U.escapeHtml(i18n?.t('practices/rimessa-documenti', 'Rimessa documenti'))}</h2>
        <p>${U.escapeHtml(i18n?.t('ui.remittanceDocumentsIntro', 'Sottomodulo operativo dedicato alla rimessa documenti collegata alla pratica madre.'))}</p>
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

    root.querySelectorAll('[data-remittance-new-session]').forEach((button) => {
      button.addEventListener('click', () => {
        ensureState(state);
        Workspace.openDraftSession(state, { createEmptyDraft: () => createEmptyDraft(state), draft: createEmptyDraft(state), source: 'manual', isDirty: true });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-open-active]').forEach((button) => {
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

    root.querySelectorAll('[data-remittance-open-practice]').forEach((button) => {
      button.addEventListener('click', () => {
        const practiceId = button.dataset.remittanceOpenPractice;
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

    root.querySelectorAll('[data-remittance-open-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = findRecord(state, button.dataset.remittanceOpenRecord);
        if (!record) return;
        Workspace.openRecordSession(state, record, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-session-switch]').forEach((button) => {
      button.addEventListener('click', () => {
        Workspace.switchSession(state, button.dataset.remittanceSessionSwitch, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionTab(state, session.id, button.dataset.remittanceTab, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-field]').forEach((field) => {
      const handler = () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        const updatedSession = Workspace.setSessionField(state, session.id, field.dataset.remittanceField, field.value, { createEmptyDraft: () => createEmptyDraft(state) });
        if (updatedSession && ModuleFieldLinks?.syncDraftField) {
          ModuleFieldLinks.syncDraftField({
            state,
            moduleKey: 'remittanceDocuments',
            draft: updatedSession.draft,
            fieldName: field.dataset.remittanceField,
            value: field.value
          });
        }
        ModuleFieldLinks?.enhanceFields?.({ root, state, moduleKey: 'remittanceDocuments', draft: updatedSession?.draft || session.draft });
        save?.();
      };
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    root.querySelectorAll('[data-remittance-line-field]').forEach((field) => {
      const handler = () => {
        const index = Number(field.dataset.remittanceLineIndex || -1);
        if (index < 0) return;
        updateActiveLineItem(state, index, field.dataset.remittanceLineField, field.value);
        save?.();
      };
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    root.querySelectorAll('[data-remittance-add-line]').forEach((button) => {
      button.addEventListener('click', () => {
        addLineItem(state);
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-remove-line]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.remittanceRemoveLine || -1);
        if (index < 0) return;
        removeLineItem(state, index);
        save?.();
        render?.();
      });
    });

    ModuleFieldLinks?.enhanceFields?.({
      root,
      state,
      moduleKey: 'remittanceDocuments',
      draft: Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) })?.draft || null
    });

    root.querySelectorAll('[data-remittance-session-close]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const closed = await closeSessionWithGuard(state, button.dataset.remittanceSessionClose, i18n);
        if (!closed) return;
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-remittance-print]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        printDraft(session.draft || {}, i18n);
      });
    });

    root.querySelectorAll('[data-remittance-email]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        window.location.href = buildMailtoHref(session.draft || {}, i18n);
      });
    });

    root.querySelectorAll('[data-remittance-save-continue]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        save?.();
        render?.();
        toast?.(i18n?.t('ui.remittanceDocumentsSaved', 'Rimessa documenti salvata'), 'success');
      });
    });

    root.querySelectorAll('[data-remittance-save-close]').forEach((button) => {
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
