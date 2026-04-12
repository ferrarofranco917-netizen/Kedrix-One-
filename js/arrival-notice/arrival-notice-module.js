window.KedrixOneArrivalNoticeModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneArrivalNoticeWorkspace || null;
  const Feedback = window.KedrixOneAppFeedback || null;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function ensureState(state) {
    if (!Workspace || typeof Workspace.ensureState !== 'function') return null;
    Workspace.ensureState(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!Array.isArray(state.arrivalNoticeRecords)) state.arrivalNoticeRecords = [];
    return state.arrivalNoticeWorkspace;
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
      status: 'draft',
      client: '',
      sender: '',
      destinationDepot: '',
      importer: '',
      consignee: '',
      notifyParty: '',
      reference: '',
      tripType: 'MARE',
      compileLocation: '',
      documentDate: today(),
      loadingPort: '',
      etdEta: '',
      unloadingPort: '',
      supplierInvoice: '',
      amount: '',
      goodsType: '',
      voyage: '',
      vessel: '',
      deliveryConditions: '',
      originGoods: '',
      bookingReference: '',
      policyReference: '',
      originalNo: '',
      originalCopyCount: '',
      operatorName: currentOperatorName(state),
      documentReceiptDate: '',
      customsSection: '',
      emptyingAppointmentDate: '',
      internalText: '',
      customerText: '',
      sourcePracticeSnapshot: {},
      lineItems: [Workspace.defaultLineItem()],
      ...overrides
    });
  }

  function buildDraftFromPractice(state, practice) {
    const dynamic = practice?.dynamicData || {};
    const booking = String(practice?.booking || dynamic.booking || '').trim();
    const containerCode = String(practice?.containerCode || dynamic.containerCode || '').trim();
    const description = String(practice?.goodsDescription || dynamic.goodsDescription || '').trim();
    return createEmptyDraft(state, {
      practiceId: String(practice?.id || '').trim(),
      practiceReference: String(practice?.reference || '').trim(),
      practiceType: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
      status: String(practice?.status || 'draft').trim() || 'draft',
      client: String(practice?.clientName || practice?.client || '').trim(),
      sender: String(dynamic.senderParty || dynamic.exporter || dynamic.shipper || '').trim(),
      destinationDepot: String(dynamic.destinationDepot || dynamic.depot || '').trim(),
      importer: String(dynamic.importer || '').trim(),
      consignee: String(dynamic.consignee || dynamic.receiverParty || '').trim(),
      notifyParty: String(dynamic.notifyParty || '').trim(),
      reference: String(dynamic.mainReference || practice?.reference || '').trim(),
      tripType: inferTripType(practice),
      compileLocation: String(dynamic.compileLocation || dynamic.loadingPlace || '').trim(),
      documentDate: String(practice?.practiceDate || today()).trim() || today(),
      loadingPort: String(dynamic.loadingPort || dynamic.originPort || dynamic.originNode || '').trim(),
      etdEta: String(dynamic.etdEta || dynamic.eta || dynamic.etd || '').trim(),
      unloadingPort: String(dynamic.unloadingPort || dynamic.destinationPort || dynamic.destinationNode || '').trim(),
      supplierInvoice: String(dynamic.foreignInvoice || dynamic.supplierInvoice || '').trim(),
      amount: String(dynamic.invoiceAmount || dynamic.amount || '').trim(),
      goodsType: String(dynamic.goodsType || dynamic.packageType || '').trim(),
      voyage: String(dynamic.voyage || '').trim(),
      vessel: String(dynamic.vessel || '').trim(),
      deliveryConditions: String(dynamic.deliveryConditions || dynamic.incoterm || '').trim(),
      originGoods: String(dynamic.originGoods || dynamic.origin || '').trim(),
      bookingReference: booking,
      policyReference: String(dynamic.policyNumber || dynamic.policyReference || '').trim(),
      originalNo: String(dynamic.originalNo || dynamic.originals || '').trim(),
      originalCopyCount: String(dynamic.copies || dynamic.originalCopies || '').trim(),
      operatorName: currentOperatorName(state),
      documentReceiptDate: String(dynamic.documentReceiptDate || '').trim(),
      customsSection: String(dynamic.customsSection || dynamic.customsOffice || '').trim(),
      emptyingAppointmentDate: String(dynamic.emptyingAppointmentDate || dynamic.emptyingDate || '').trim(),
      sourcePracticeSnapshot: {
        id: String(practice?.id || '').trim(),
        reference: String(practice?.reference || '').trim(),
        type: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
        status: String(practice?.status || '').trim()
      },
      lineItems: [Workspace.defaultLineItem({
        containerCode,
        containerType: String(dynamic.transportUnitType || '').trim(),
        description,
        seals: String(dynamic.seals || '').trim(),
        packageCount: String(dynamic.packageCount || '').trim(),
        packaging: String(dynamic.packaging || '').trim(),
        grossWeight: String(practice?.grossWeight || dynamic.grossWeight || '').trim(),
        netWeight: String(practice?.netWeight || dynamic.netWeight || '').trim(),
        cbm: String(practice?.volume || dynamic.cbm || dynamic.volume || '').trim(),
        supplementaryUnits: String(dynamic.supplementaryUnits || '').trim(),
        articleCode: String(dynamic.articleCode || '').trim()
      })]
    });
  }

  function seaPractices(state) {
    return (state?.practices || []).filter((practice) => String(practice?.practiceType || '').includes('sea'));
  }

  function buildKpis(state) {
    const records = Array.isArray(state?.arrivalNoticeRecords) ? state.arrivalNoticeRecords : [];
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
    const xs = new Set(['tripType', 'amount', 'originalNo', 'originalCopyCount']);
    const sm = new Set(['practiceReference', 'documentDate', 'documentReceiptDate', 'emptyingAppointmentDate', 'operatorName', 'bookingReference', 'policyReference', 'atd']);
    const md = new Set(['client', 'sender', 'destinationDepot', 'importer', 'consignee', 'notifyParty', 'compileLocation', 'reference', 'attentionTo', 'loadingPort', 'unloadingPort', 'supplierInvoice', 'goodsType', 'voyage', 'vessel', 'deliveryConditions', 'originGoods', 'customsSection']);
    if (xs.has(key)) return 'xs';
    if (sm.has(key)) return 'sm';
    if (md.has(key)) return 'md';
    return 'md';
  }

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const rows = Number(options.rows || 4);
    const items = Array.isArray(options.items) ? options.items : [];
    const disabled = options.disabled ? ' disabled' : '';
    const placeholder = U.escapeHtml(options.placeholder || '');
    const size = fieldSize(name, options);
    const classes = ['field', 'notice-field', `notice-size-${size}`, `notice-field-${String(name || '').trim()}`];
    if (options.full || size === 'full') classes.push('full');
    const baseAttrs = `id="an-${U.escapeHtml(name)}" data-arrival-notice-field="${U.escapeHtml(name)}"${disabled}`;
    if (type === 'textarea') {
      return `<div class="${classes.join(' ')}"><label for="an-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><textarea ${baseAttrs} rows="${rows}" placeholder="${placeholder}">${U.escapeHtml(value || '')}</textarea></div>`;
    }
    if (type === 'select') {
      return `<div class="${classes.join(' ')}"><label for="an-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><select ${baseAttrs}>${items.map((item) => {
        const itemValue = String(item?.value ?? '');
        const selected = itemValue === String(value ?? '') ? ' selected' : '';
        return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
      }).join('')}</select></div>`;
    }
    return `<div class="${classes.join(' ')}"><label for="an-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><input ${baseAttrs} type="${U.escapeHtml(type)}" value="${U.escapeHtml(value || '')}" placeholder="${placeholder}"></div>`;
  }

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const activeId = String(state?.arrivalNoticeWorkspace?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel practice-workspace-panel arrival-notice-workspace-panel notice-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.arrivalNoticeMasksHint', 'Più notifiche arrivo merce possono restare aperte contemporaneamente.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-arrival-notice-new-session>${U.escapeHtml(i18n?.t('ui.newMask', 'Nuova maschera'))}</button></div>
        </div>
        <div class="practice-session-strip notice-session-strip">
          ${sessions.map((session) => {
            const draft = session?.draft || {};
            const title = String(draft.practiceReference || i18n?.t('ui.arrivalNoticeUntitled', 'Nuova notifica arrivo merce') || 'Nuova notifica arrivo merce').trim();
            const meta = [draft.client, draft.bookingReference].filter(Boolean).join(' · ');
            const active = session.id === activeId;
            return `
              <div class="practice-session-chip notice-session-chip${active ? ' active' : ''}">
                <button class="notice-session-main" type="button" data-arrival-notice-session-switch="${U.escapeHtml(session.id)}">
                  <strong>${U.escapeHtml(title)}</strong>
                  <span>${U.escapeHtml(meta || '—')}</span>
                  ${session.isDirty ? '<em>•</em>' : ''}
                </button>
                <button class="notice-session-close" type="button" data-arrival-notice-session-close="${U.escapeHtml(session.id)}" aria-label="${U.escapeHtml(i18n?.t('ui.closeMask', 'Chiudi maschera'))}">×</button>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  function renderLauncher(state, i18n, selectedPractice) {
    const available = seaPractices(state);
    const selectedSea = selectedPractice && String(selectedPractice.practiceType || '').includes('sea') ? selectedPractice : null;
    return `
      <section class="panel arrival-notice-launcher-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.arrivalNoticeLauncherTitle', 'Apri o crea notifica arrivo merce'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.arrivalNoticeLauncherHint', 'Apri il documento dalla pratica mare attiva o scegli una pratica dall’elenco.'))}</p>
          </div>
          <div class="action-row">
            ${selectedSea ? `<button class="btn" type="button" data-arrival-notice-open-active>${U.escapeHtml(i18n?.t('ui.useCurrentPractice', 'Usa pratica attiva'))}</button>` : ''}
            <button class="btn secondary" type="button" data-arrival-notice-new-session>${U.escapeHtml(i18n?.t('ui.newBlankDocument', 'Nuovo documento vuoto'))}</button>
          </div>
        </div>
        <div class="form-grid three arrival-notice-practice-grid">
          ${available.slice(0, 18).map((practice) => `
            <button class="stack-item arrival-notice-practice-chip" type="button" data-arrival-notice-open-practice="${U.escapeHtml(practice.id)}">
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
      [i18n?.t('ui.bookingWord', 'Booking'), draft.bookingReference || '—'],
      [i18n?.t('ui.policyNumber', 'Polizza / BL / AWB'), draft.policyReference || '—']
    ];
    return `<div class="tag-grid arrival-notice-summary-pills">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderLineTable(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <section class="table-panel arrival-notice-lines-panel notice-lines-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.detail', 'Dettagli'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.arrivalNoticeDetailHint', 'Container, tipologia, colli, pesi e riferimenti articolo.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-arrival-notice-add-line>${U.escapeHtml(i18n?.t('ui.addLine', 'Aggiungi riga'))}</button></div>
        </div>
        <div class="table-wrap notice-lines-wrap">
          <table class="table arrival-notice-lines-table notice-lines-table">
            <colgroup>
              <col style="width:9%"><col style="width:9%"><col style="width:14%"><col style="width:8%"><col style="width:6%"><col style="width:7%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:7%">
            </colgroup>
            <thead>
              <tr>
                <th>${U.escapeHtml(i18n?.t('ui.container', 'Container'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.transportUnitType', 'Tipologia'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.description', 'Descrizione'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.bookingEmbarkationSeals', 'Sigilli'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.packageCount', 'Colli'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.packaging', 'Imballi'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.grossWeight', 'Peso lordo'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.netWeight', 'Peso netto'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.volume', 'CBM'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.arrivalNoticeSupplementaryUnits', 'Unità suppl.'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.articleCode', 'Cod. art.'))}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, index) => `
                <tr>
                  <td><input type="text" value="${U.escapeHtml(row.containerCode || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="containerCode"></td>
                  <td><input type="text" value="${U.escapeHtml(row.containerType || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="containerType"></td>
                  <td><input type="text" value="${U.escapeHtml(row.description || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="description"></td>
                  <td><input type="text" value="${U.escapeHtml(row.seals || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="seals"></td>
                  <td><input type="text" value="${U.escapeHtml(row.packageCount || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="packageCount"></td>
                  <td><input type="text" value="${U.escapeHtml(row.packaging || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="packaging"></td>
                  <td><input type="text" value="${U.escapeHtml(row.grossWeight || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="grossWeight"></td>
                  <td><input type="text" value="${U.escapeHtml(row.netWeight || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="netWeight"></td>
                  <td><input type="text" value="${U.escapeHtml(row.cbm || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="cbm"></td>
                  <td><input type="text" value="${U.escapeHtml(row.supplementaryUnits || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="supplementaryUnits"></td>
                  <td><input type="text" value="${U.escapeHtml(row.articleCode || '')}" data-arrival-notice-line-index="${index}" data-arrival-notice-line-field="articleCode"></td>
                  <td><button class="btn secondary" type="button" data-arrival-notice-remove-line="${index}">${U.escapeHtml(i18n?.t('ui.remove', 'Rimuovi'))}</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function renderGeneralTab(draft, i18n) {
    return `
      ${renderSummaryPills(draft, i18n)}
      <div class="form-grid three arrival-notice-form-grid">
        ${renderField(i18n?.t('ui.clientRequired', 'Cliente'), 'client', draft.client)}
        ${renderField(i18n?.t('ui.sender', 'Mittente'), 'sender', draft.sender)}
        ${renderField(i18n?.t('ui.arrivalNoticeDestinationDepot', 'Deposito di destinazione'), 'destinationDepot', draft.destinationDepot)}
        ${renderField(i18n?.t('ui.importer', 'Importatore'), 'importer', draft.importer)}
        ${renderField(i18n?.t('ui.consignee', 'Consignee'), 'consignee', draft.consignee)}
        ${renderField(i18n?.t('ui.notify', 'Notify'), 'notifyParty', draft.notifyParty)}
        ${renderField(i18n?.t('ui.generatedNumber', 'Pratica'), 'practiceReference', draft.practiceReference, { disabled: true })}
        ${renderField(i18n?.t('ui.arrivalNoticeTripType', 'Tipo viaggio'), 'tripType', draft.tripType, { type: 'select', items: [{ value: 'MARE', label: 'MARE' }, { value: 'AEREO', label: 'AEREO' }, { value: 'TERRA', label: 'TERRA' }] })}
        ${renderField(i18n?.t('ui.arrivalNoticeCompileLocation', 'Luogo compilazione'), 'compileLocation', draft.compileLocation)}
        ${renderField(i18n?.t('ui.reference', 'Riferimento'), 'reference', draft.reference)}
        ${renderField(i18n?.t('ui.arrivalNoticeAttentionTo', 'All’attenzione di'), 'attentionTo', draft.attentionTo)}
        ${renderField(i18n?.t('ui.date', 'Data'), 'documentDate', draft.documentDate, { type: 'date' })}
        ${renderField(i18n?.t('ui.arrivalNoticeLoadingPort', 'Porto imbarco'), 'loadingPort', draft.loadingPort)}
        ${renderField(i18n?.t('ui.arrivalNoticeEtdEta', 'ETD/ETA'), 'etdEta', draft.etdEta)}
        ${renderField(i18n?.t('ui.arrivalNoticeUnloadingPort', 'Porto sbarco'), 'unloadingPort', draft.unloadingPort)}
        ${renderField(i18n?.t('ui.arrivalNoticeSupplierInvoice', 'Fattura fornitore'), 'supplierInvoice', draft.supplierInvoice)}
        ${renderField(i18n?.t('ui.amount', 'Importo'), 'amount', draft.amount)}
        ${renderField(i18n?.t('ui.arrivalNoticeGoodsType', 'Tipo merce'), 'goodsType', draft.goodsType)}
        ${renderField(i18n?.t('ui.voyage', 'Viaggio'), 'voyage', draft.voyage)}
        ${renderField(i18n?.t('ui.vessel', 'Nave'), 'vessel', draft.vessel)}
        ${renderField(i18n?.t('ui.arrivalNoticeDeliveryConditions', 'Condizioni di consegna'), 'deliveryConditions', draft.deliveryConditions)}
        ${renderField(i18n?.t('ui.arrivalNoticeOriginGoods', 'Origine merce'), 'originGoods', draft.originGoods)}
        ${renderField(i18n?.t('ui.bookingWord', 'Booking'), 'bookingReference', draft.bookingReference)}
        ${renderField(i18n?.t('ui.policyNumber', 'Polizza'), 'policyReference', draft.policyReference)}
        ${renderField(i18n?.t('ui.arrivalNoticeOriginalNo', 'Original NO.'), 'originalNo', draft.originalNo)}
        ${renderField(i18n?.t('ui.arrivalNoticeOriginalCopies', 'Original copie'), 'originalCopyCount', draft.originalCopyCount)}
        ${renderField(i18n?.t('ui.operator', 'Operatore'), 'operatorName', draft.operatorName)}
        ${renderField(i18n?.t('ui.arrivalNoticeDocumentReceiptDate', 'Data ricezione documenti'), 'documentReceiptDate', draft.documentReceiptDate, { type: 'date' })}
        ${renderField(i18n?.t('ui.customsSection', 'Sez. doganale'), 'customsSection', draft.customsSection)}
        ${renderField(i18n?.t('ui.arrivalNoticeEmptyingDate', 'Data pres. svuotamento'), 'emptyingAppointmentDate', draft.emptyingAppointmentDate, { type: 'date' })}
      </div>
      ${renderLineTable(draft, i18n)}`;
  }

  function renderTextsTab(draft, i18n) {
    return `
      <div class="form-grid two arrival-notice-form-grid">
        ${renderField(i18n?.t('ui.arrivalNoticeInternalText', 'Testo interno'), 'internalText', draft.internalText, { type: 'textarea', rows: 12, full: true })}
        ${renderField(i18n?.t('ui.arrivalNoticeCustomerText', 'Testo cliente'), 'customerText', draft.customerText, { type: 'textarea', rows: 12, full: true })}
      </div>`;
  }


  function buildMailtoHref(draft, i18n) {
    const subject = `${i18n?.t('practices/notifica-arrivo-merce', 'Notifica arrivo merce')} ${draft.practiceReference || ''}`.trim();
    const lines = [
      `${i18n?.t('ui.generatedNumber', 'Pratica')}: ${draft.practiceReference || '—'}`,
      `${i18n?.t('ui.clientRequired', 'Cliente')}: ${draft.client || '—'}`,
      `${i18n?.t('ui.bookingWord', 'Booking')}: ${draft.bookingReference || '—'}`,
      `${i18n?.t('ui.policyNumber', 'Polizza')}: ${draft.policyReference || '—'}`,
      `${i18n?.t('ui.arrivalNoticeLoadingPort', 'Porto imbarco')}: ${draft.loadingPort || '—'}`,
      `${i18n?.t('ui.arrivalNoticeUnloadingPort', 'Porto sbarco')}: ${draft.unloadingPort || '—'}`,
      '',
      draft.customerText || draft.internalText || ''
    ];
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  function buildPrintableHtml(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>${U.escapeHtml(i18n?.t('practices/notifica-arrivo-merce', 'Notifica arrivo merce'))}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 8px;font-size:24px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cfd4dc;padding:8px;font-size:12px;text-align:left;vertical-align:top}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}.meta div{border:1px solid #d8dde6;padding:10px}.block{margin-top:18px}.block h2{font-size:16px;margin:0 0 8px}</style></head><body><h1>${U.escapeHtml(i18n?.t('practices/notifica-arrivo-merce', 'Notifica arrivo merce'))}</h1><div class="meta"><div><strong>${U.escapeHtml(i18n?.t('ui.generatedNumber', 'Pratica'))}</strong><br>${U.escapeHtml(draft.practiceReference || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.clientRequired', 'Cliente'))}</strong><br>${U.escapeHtml(draft.client || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.bookingWord', 'Booking'))}</strong><br>${U.escapeHtml(draft.bookingReference || '—')}</div><div><strong>${U.escapeHtml(i18n?.t('ui.policyNumber', 'Polizza'))}</strong><br>${U.escapeHtml(draft.policyReference || '—')}</div></div><table><thead><tr><th>Container</th><th>Tipologia</th><th>Descrizione</th><th>Colli</th><th>Peso lordo</th><th>CBM</th></tr></thead><tbody>${rows.map((row)=>`<tr><td>${U.escapeHtml(row.containerCode || '')}</td><td>${U.escapeHtml(row.containerType || '')}</td><td>${U.escapeHtml(row.description || '')}</td><td>${U.escapeHtml(row.packageCount || '')}</td><td>${U.escapeHtml(row.grossWeight || '')}</td><td>${U.escapeHtml(row.cbm || '')}</td></tr>`).join('')}</tbody></table><div class="block"><h2>${U.escapeHtml(i18n?.t('ui.arrivalNoticeCustomerText', 'Testo cliente'))}</h2><div>${U.escapeHtml(draft.customerText || '').replace(/\n/g,'<br>')}</div></div><div class="block"><h2>${U.escapeHtml(i18n?.t('ui.arrivalNoticeInternalText', 'Testo interno'))}</h2><div>${U.escapeHtml(draft.internalText || '').replace(/\n/g,'<br>')}</div></div></body></html>`;
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
      <section class="panel arrival-notice-editor-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('practices/notifica-arrivo-merce', 'Notifica arrivo merce'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.arrivalNoticeEditorHint', 'Documento operativo collegato alla pratica madre, con dati generali, dettagli merce e testi pronti per invio o stampa.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-arrival-notice-print>${U.escapeHtml(i18n?.t('ui.print', 'Stampa'))}</button>
            <button class="btn secondary" type="button" data-arrival-notice-email>${U.escapeHtml(i18n?.t('ui.sendEmail', 'Invia email'))}</button>
            <button class="btn secondary" type="button" data-arrival-notice-save-continue>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-arrival-notice-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        <div class="tab-row arrival-notice-tabs">
          <button class="tab-chip${activeTab === 'general' ? ' active' : ''}" type="button" data-arrival-notice-tab="general">${U.escapeHtml(i18n?.t('ui.general', 'Generale'))}</button>
          <button class="tab-chip${activeTab === 'texts' ? ' active' : ''}" type="button" data-arrival-notice-tab="texts">${U.escapeHtml(i18n?.t('ui.texts', 'Testi'))}</button>
        </div>
        ${activeTab === 'texts' ? renderTextsTab(draft, i18n) : renderGeneralTab(draft, i18n)}
      </section>`;
  }

  function renderSavedRecords(state, i18n) {
    const records = Array.isArray(state?.arrivalNoticeRecords) ? state.arrivalNoticeRecords : [];
    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.arrivalNoticeSavedHint', 'Riapri rapidamente le notifiche arrivo merce già generate.'))}</p>
          </div>
        </div>
        <div class="module-card-grid arrival-notice-records-grid">
          ${records.length ? records.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).map((record) => `
            <button class="module-card arrival-notice-record-card" type="button" data-arrival-notice-open-record="${U.escapeHtml(record.id)}">
              <div><strong>${U.escapeHtml(record.practiceReference || '—')}</strong><div class="module-card-meta">${U.escapeHtml(record.client || '—')}</div></div>
              <div class="module-card-meta">${U.escapeHtml(record.bookingReference || '—')}</div>
              <div class="module-card-meta">${U.escapeHtml(record.unloadingPort || '—')}</div>
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
      <section class="hero">
        <div class="hero-meta">${U.escapeHtml(i18n?.t('ui.arrivalNoticeEyebrow', 'PRATICHE · NOTIFICA ARRIVO MERCE'))}</div>
        <h2>${U.escapeHtml(i18n?.t('practices/notifica-arrivo-merce', 'Notifica arrivo merce'))}</h2>
        <p>${U.escapeHtml(i18n?.t('ui.arrivalNoticeIntro', 'Sottomodulo operativo dedicato alle notifiche di arrivo merce collegate alla pratica madre.'))}</p>
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
    `;
  }

  function upsertRecord(state, session) {
    if (!session || !session.draft) return null;
    if (!Array.isArray(state.arrivalNoticeRecords)) state.arrivalNoticeRecords = [];
    const draft = Workspace.cloneDraft(session.draft);
    const now = new Date().toISOString();
    const next = {
      id: String(draft.editingRecordId || '').trim() || `an-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      ...draft,
      editingRecordId: String(draft.editingRecordId || '').trim() || '',
      createdAt: String(draft.createdAt || now),
      updatedAt: now
    };
    next.editingRecordId = next.id;
    const index = state.arrivalNoticeRecords.findIndex((record) => String(record?.id || '').trim() === next.id);
    if (index === -1) state.arrivalNoticeRecords.unshift(next);
    else state.arrivalNoticeRecords.splice(index, 1, next);
    session.draft = Workspace.cloneDraft(next);
    Workspace.markSessionSaved(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
    return next;
  }

  function findRecord(state, recordId) {
    return (state?.arrivalNoticeRecords || []).find((record) => String(record?.id || '').trim() === String(recordId || '').trim()) || null;
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

    root.querySelectorAll('[data-arrival-notice-new-session]').forEach((button) => {
      button.addEventListener('click', () => {
        ensureState(state);
        Workspace.openDraftSession(state, { createEmptyDraft: () => createEmptyDraft(state), draft: createEmptyDraft(state), source: 'manual', isDirty: true });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-arrival-notice-open-active]').forEach((button) => {
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

    root.querySelectorAll('[data-arrival-notice-open-practice]').forEach((button) => {
      button.addEventListener('click', () => {
        const practiceId = button.dataset.arrivalNoticeOpenPractice;
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

    root.querySelectorAll('[data-arrival-notice-open-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = findRecord(state, button.dataset.arrivalNoticeOpenRecord);
        if (!record) return;
        Workspace.openRecordSession(state, record, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-arrival-notice-session-switch]').forEach((button) => {
      button.addEventListener('click', () => {
        Workspace.switchSession(state, button.dataset.arrivalNoticeSessionSwitch, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-arrival-notice-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionTab(state, session.id, button.dataset.arrivalNoticeTab, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-arrival-notice-field]').forEach((field) => {
      const handler = () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionField(state, session.id, field.dataset.arrivalNoticeField, field.value, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
      };
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    root.querySelectorAll('[data-arrival-notice-line-field]').forEach((field) => {
      const handler = () => {
        const index = Number(field.dataset.arrivalNoticeLineIndex || -1);
        if (index < 0) return;
        updateActiveLineItem(state, index, field.dataset.arrivalNoticeLineField, field.value);
        save?.();
      };
      field.addEventListener('input', handler);
    });

    root.querySelectorAll('[data-arrival-notice-add-line]').forEach((button) => {
      button.addEventListener('click', () => {
        addLineItem(state);
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-arrival-notice-remove-line]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.arrivalNoticeRemoveLine || -1);
        if (index < 0) return;
        removeLineItem(state, index);
        save?.();
        render?.();
      });
    });


    root.querySelectorAll('[data-arrival-notice-session-close]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const closed = await closeSessionWithGuard(state, button.dataset.arrivalNoticeSessionClose, i18n);
        if (!closed) return;
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-arrival-notice-print]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        printDraft(session.draft || {}, i18n);
      });
    });

    root.querySelectorAll('[data-arrival-notice-email]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        window.location.href = buildMailtoHref(session.draft || {}, i18n);
      });
    });

    root.querySelectorAll('[data-arrival-notice-save-continue]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        save?.();
        render?.();
        toast?.(i18n?.t('ui.arrivalNoticeSaved', 'Notifica arrivo merce salvata'), 'success');
      });
    });

    root.querySelectorAll('[data-arrival-notice-save-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        Workspace.closeSession(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
        toast?.(i18n?.t('ui.arrivalNoticeSaved', 'Notifica arrivo merce salvata'), 'success');
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
