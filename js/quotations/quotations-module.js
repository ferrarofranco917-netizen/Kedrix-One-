window.KedrixOneQuotationsModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneQuotationsWorkspace || null;
  const Feedback = window.KedrixOneAppFeedback || null;

  function safeClone(value) {
    return Workspace && typeof Workspace.cloneDraft === 'function'
      ? Workspace.cloneDraft(value)
      : JSON.parse(JSON.stringify(value || {}));
  }

  function today() {
    return Workspace?.today?.() || new Date().toISOString().slice(0, 10);
  }

  function ensureState(state) {
    Workspace?.ensureState?.(state);
    if (!Array.isArray(state.quotationRecords)) state.quotationRecords = [];
    if (!state.quotationFilters || typeof state.quotationFilters !== 'object') {
      state.quotationFilters = { quick: '', serviceProfile: 'all', status: 'all' };
    }
    return state.quotationsWorkspace;
  }

  function currentOperatorName(state) {
    const activeUserId = String(state?.activeUserId || '').trim();
    const user = (state?.users || []).find((entry) => String(entry?.id || '').trim() === activeUserId) || null;
    return String(user?.name || '').trim();
  }

  function sharedDirectories(state) {
    return state?.companyConfig?.practiceConfig?.directories || {};
  }

  function createEmptyDraft(state, overrides = {}) {
    const quotationNumber = Workspace?.nextQuotationNumber?.(state) || `Q-${new Date().getFullYear()}-0001`;
    return safeClone({
      editingRecordId: '',
      quotationNumber,
      serviceProfile: 'generic',
      status: 'draft',
      title: '',
      code: '',
      validFrom: today(),
      validTo: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      client: '',
      prospect: '',
      contactPerson: '',
      payer: '',
      paymentTerms: '',
      incoterm: '',
      pickupPlace: '',
      deliveryPlace: '',
      origin: '',
      destination: '',
      loadingPort: '',
      unloadingPort: '',
      carrier: '',
      supplier: '',
      goodsType: '',
      dangerousGoods: 'NO',
      pieces: '',
      dimensions: '',
      grossWeight: '',
      netWeight: '',
      volume: '',
      chargeableWeight: '',
      valueAmount: '',
      currency: 'EUR',
      note: '',
      internalNote: '',
      operatorName: currentOperatorName(state),
      lineItems: [Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` }],
      attachments: [],
      linkedEntities: {},
      ...overrides
    });
  }

  function buildDraftFromPractice(state, practice, profile = '') {
    const dynamic = practice?.dynamicData || {};
    const guessedProfile = profile || String(practice?.mode || practice?.practiceType || '').toLowerCase();
    const serviceProfile = /air|aereo/.test(guessedProfile)
      ? 'air'
      : /terra|road|truck/.test(guessedProfile)
        ? 'road'
        : /rail|ferro/.test(guessedProfile)
          ? 'rail'
          : /agency|agenzia/.test(guessedProfile)
            ? 'agency'
            : /warehouse|magazz/.test(guessedProfile)
              ? 'warehouse'
              : 'sea';
    return createEmptyDraft(state, {
      serviceProfile,
      title: String(practice?.reference || '').trim(),
      practiceId: String(practice?.id || '').trim(),
      practiceReference: String(practice?.reference || '').trim(),
      practiceType: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
      client: String(practice?.clientName || practice?.client || '').trim(),
      prospect: String(dynamic.prospect || '').trim(),
      contactPerson: String(dynamic.attentionTo || '').trim(),
      payer: String(dynamic.payer || '').trim(),
      paymentTerms: String(dynamic.paymentTerms || '').trim(),
      incoterm: String(dynamic.incoterm || '').trim(),
      pickupPlace: String(dynamic.pickupPlace || dynamic.pickupLocation || '').trim(),
      deliveryPlace: String(dynamic.deliveryPlace || dynamic.deliveryLocation || '').trim(),
      origin: String(dynamic.origin || dynamic.originNode || '').trim(),
      destination: String(dynamic.destination || dynamic.destinationNode || '').trim(),
      loadingPort: String(dynamic.loadingPort || dynamic.originPort || '').trim(),
      unloadingPort: String(dynamic.unloadingPort || dynamic.destinationPort || '').trim(),
      carrier: String(dynamic.carrier || dynamic.shippingCompany || '').trim(),
      supplier: String(dynamic.supplier || '').trim(),
      goodsType: String(dynamic.goodsType || dynamic.goodsDescription || '').trim(),
      dangerousGoods: String(dynamic.dangerousGoods || 'NO').trim() || 'NO',
      pieces: String(dynamic.packages || dynamic.pieces || '').trim(),
      dimensions: String(dynamic.dimensions || '').trim(),
      grossWeight: String(dynamic.grossWeight || '').trim(),
      netWeight: String(dynamic.netWeight || '').trim(),
      volume: String(dynamic.volume || '').trim(),
      chargeableWeight: String(dynamic.chargeableWeight || '').trim(),
      valueAmount: String(dynamic.invoiceAmount || '').trim(),
      currency: String(dynamic.currency || dynamic.invoiceCurrency || 'EUR').trim() || 'EUR',
      note: String(dynamic.customerInstructions || '').trim(),
      internalNote: String(dynamic.internalNotes || '').trim()
    });
  }

  function filteredRecords(state) {
    const filters = state?.quotationFilters || {};
    const quick = String(filters.quick || '').trim().toLowerCase();
    const profile = String(filters.serviceProfile || 'all').trim();
    const status = String(filters.status || 'all').trim();
    return (state?.quotationRecords || []).filter((record) => {
      if (profile !== 'all' && String(record?.serviceProfile || '').trim() !== profile) return false;
      if (status !== 'all' && String(record?.status || '').trim() !== status) return false;
      if (!quick) return true;
      const haystack = [record?.quotationNumber, record?.title, record?.client, record?.practiceReference].join(' ').toLowerCase();
      return haystack.includes(quick);
    });
  }

  function quotationKpis(state) {
    const records = Array.isArray(state?.quotationRecords) ? state.quotationRecords : [];
    const sessions = Workspace?.listSessions?.(state) || [];
    const queued = Array.isArray(state?.quotationDispatchQueue) ? state.quotationDispatchQueue.filter((entry) => String(entry?.moduleKey || '') === 'quotations').length : 0;
    return {
      records: records.length,
      openMasks: sessions.length,
      queued
    };
  }

  function recentPractices(state) {
    return (state?.practices || []).slice().sort((a, b) => String(b?.practiceDate || '').localeCompare(String(a?.practiceDate || ''))).slice(0, 12);
  }

  function fieldClass(name, options = {}) {
    const sizeMap = { xs: 'quotation-field-xs', sm: 'quotation-field-sm', md: 'quotation-field-md', lg: 'quotation-field-lg', xl: 'quotation-field-xl', full: 'quotation-field-full' };
    const size = String(options.size || 'md').trim();
    return ['field', 'quotation-field', sizeMap[size] || sizeMap.md, `quotation-field-${String(name || '').trim()}`].join(' ');
  }

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const list = Array.isArray(options.list) ? options.list.filter(Boolean) : [];
    const datalistId = list.length ? `quotation-list-${String(name || '').trim()}` : '';
    const attrs = [`data-quotation-field="${U.escapeHtml(name)}"`, `id="quotation-${U.escapeHtml(name)}"`];
    if (datalistId) attrs.push(`list="${U.escapeHtml(datalistId)}"`);
    if (options.placeholder) attrs.push(`placeholder="${U.escapeHtml(options.placeholder)}"`);
    const wrapClass = fieldClass(name, options);
    if (type === 'textarea') {
      return `<div class="${wrapClass}"><label for="quotation-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><textarea ${attrs.join(' ')} rows="${Number(options.rows || 3)}">${U.escapeHtml(value || '')}</textarea></div>`;
    }
    if (type === 'select') {
      const items = Array.isArray(options.items) ? options.items : [];
      return `<div class="${wrapClass}"><label for="quotation-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><select ${attrs.join(' ')}>${items.map((item) => {
        const itemValue = String(item?.value ?? '');
        const selected = itemValue === String(value ?? '') ? ' selected' : '';
        return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
      }).join('')}</select></div>`;
    }
    return `<div class="${wrapClass}"><label for="quotation-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><input ${attrs.join(' ')} type="${U.escapeHtml(type)}" value="${U.escapeHtml(value || '')}">${datalistId ? `<datalist id="${U.escapeHtml(datalistId)}">${list.map((item) => `<option value="${U.escapeHtml(typeof item === 'string' ? item : item?.label || item?.value || '')}"></option>`).join('')}</datalist>` : ''}</div>`;
  }

  function profileButtons(activeProfile) {
    const items = [
      ['generic', 'Generica'],
      ['sea', 'Mare'],
      ['air', 'Aerea'],
      ['rail', 'Ferrovia'],
      ['road', 'Terra'],
      ['agency', 'Agenzia'],
      ['warehouse', 'Magazzino']
    ];
    return `<div class="quotation-profile-strip">${items.map(([value, label]) => `<button type="button" class="quotation-profile-chip${value === activeProfile ? ' active' : ''}" data-quotation-profile="${U.escapeHtml(value)}">${U.escapeHtml(label)}</button>`).join('')}</div>`;
  }

  function renderLauncher(state, i18n, selectedPractice) {
    const kpis = quotationKpis(state);
    return `
      <section class="panel quotations-launcher-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.quotations', 'Quotazioni'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationsModuleHint', 'Preventivi multi-servizio con testata, dettaglio economico e documenti collegati.'))}</p>
          </div>
          <div class="action-row">
            ${selectedPractice ? `<button class="btn" type="button" data-quotation-open-active>${U.escapeHtml(i18n?.t('ui.useCurrentPractice', 'Usa pratica attiva'))}</button>` : ''}
            <button class="btn secondary" type="button" data-quotation-new>${U.escapeHtml(i18n?.t('ui.newQuotation', 'Nuova quotazione'))}</button>
          </div>
        </div>
        <div class="tag-grid quotations-kpi-grid">
          <div class="stack-item"><strong>${kpis.records}</strong><span>${U.escapeHtml(i18n?.t('ui.records', 'Record salvati'))}</span></div>
          <div class="stack-item"><strong>${kpis.openMasks}</strong><span>${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</span></div>
          <div class="stack-item"><strong>${kpis.queued}</strong><span>${U.escapeHtml(i18n?.t('ui.queuedSends', 'Invii accodati'))}</span></div>
        </div>
        <div class="quotations-launcher-grid">
          <div class="quotation-side-card">
            <div class="quotation-side-card-title">${U.escapeHtml(i18n?.t('ui.search', 'Ricerca'))}</div>
            <div class="quotation-filter-stack">
              ${renderField(i18n?.t('ui.search', 'Ricerca'), 'filterQuick', state?.quotationFilters?.quick || '', { size: 'lg', placeholder: 'Numero, cliente, pratica…' })}
              ${renderField(i18n?.t('ui.status', 'Stato'), 'filterStatus', state?.quotationFilters?.status || 'all', { type: 'select', size: 'sm', items: [
                { value: 'all', label: 'Tutti' },
                { value: 'draft', label: 'Bozza' },
                { value: 'active', label: 'Attiva' },
                { value: 'expired', label: 'Scaduta' }
              ]})}
              ${renderField(i18n?.t('ui.type', 'Profilo servizio'), 'filterProfile', state?.quotationFilters?.serviceProfile || 'all', { type: 'select', size: 'sm', items: [
                { value: 'all', label: 'Tutti' }, { value: 'generic', label: 'Generica' }, { value: 'sea', label: 'Mare' }, { value: 'air', label: 'Aerea' }, { value: 'rail', label: 'Ferrovia' }, { value: 'road', label: 'Terra' }, { value: 'agency', label: 'Agenzia' }, { value: 'warehouse', label: 'Magazzino' }
              ]})}
            </div>
          </div>
          <div class="quotation-main-card">
            <div class="quotation-side-card-title">${U.escapeHtml(i18n?.t('ui.recentPractices', 'Pratiche recenti'))}</div>
            <div class="quotation-practice-chip-grid">
              ${recentPractices(state).map((practice) => `<button class="stack-item quotation-practice-chip" type="button" data-quotation-open-practice="${U.escapeHtml(practice.id)}"><strong>${U.escapeHtml(practice.reference || '—')}</strong><span>${U.escapeHtml(practice.clientName || practice.client || '')}</span><span>${U.escapeHtml(practice.practiceTypeLabel || practice.practiceType || '')}</span></button>`).join('')}
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderSavedRecords(state, i18n) {
    const records = filteredRecords(state);
    return `
      <section class="panel quotations-records-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Quotazioni salvate'))}</h3></div></div>
        ${records.length ? `<div class="quotation-record-list">${records.map((record) => `<article class="quotation-record-card"><div><strong>${U.escapeHtml(record.quotationNumber || '—')}</strong><span>${U.escapeHtml(record.client || '—')}</span><em>${U.escapeHtml(record.practiceReference || record.title || '—')}</em></div><div class="action-row"><button type="button" class="btn secondary" data-quotation-open-record="${U.escapeHtml(record.id)}">${U.escapeHtml(i18n?.t('ui.open', 'Apri'))}</button><button type="button" class="btn secondary" data-quotation-duplicate-record="${U.escapeHtml(record.id)}">${U.escapeHtml(i18n?.t('ui.duplicate', 'Duplica'))}</button></div></article>`).join('')}</div>` : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noQuotationsYet', 'Nessuna quotazione salvata.'))}</div>`}
      </section>`;
  }

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions?.(state) || [];
    const activeId = String(state?.quotationsWorkspace?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel quotations-session-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</h3></div></div>
        <div class="quotation-session-strip">${sessions.map((session) => {
          const draft = session.draft || {};
          const active = session.id === activeId ? ' active' : '';
          return `<div class="quotation-session-chip${active}"><button type="button" class="quotation-session-main" data-quotation-session-switch="${U.escapeHtml(session.id)}"><strong>${U.escapeHtml(draft.quotationNumber || 'Nuova')}</strong><span>${U.escapeHtml(draft.client || '—')}</span></button><button type="button" class="quotation-session-close" data-quotation-session-close="${U.escapeHtml(session.id)}">×</button></div>`;
        }).join('')}</div>
      </section>`;
  }

  function renderSummary(draft) {
    const items = [
      ['Numero', draft.quotationNumber || '—'],
      ['Cliente', draft.client || '—'],
      ['Pratica', draft.practiceReference || '—'],
      ['Valida dal', draft.validFrom || '—']
    ];
    return `<div class="tag-grid quotation-summary-grid">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderTestata(draft, state, i18n) {
    const dirs = sharedDirectories(state);
    return `
      <section class="panel quotation-editor-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(draft.quotationNumber || 'Nuova quotazione')}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationHeaderHint', 'Testata compatta con dati commerciali, logistici e anagrafici riusabili.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-quotation-print>${U.escapeHtml(i18n?.t('ui.print', 'Stampa'))}</button>
            <button class="btn secondary" type="button" data-quotation-save-send>${U.escapeHtml(i18n?.t('ui.saveAndSend', 'Salva e invia'))}</button>
            <button class="btn secondary" type="button" data-quotation-save>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-quotation-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        ${profileButtons(draft.serviceProfile)}
        ${renderSummary(draft)}
        <div class="quotation-grid">
          ${renderField(i18n?.t('ui.description', 'Descrizione'), 'title', draft.title, { size: 'xl' })}
          ${renderField('Codice', 'code', draft.code, { size: 'sm' })}
          ${renderField(i18n?.t('ui.validFrom', 'Valida dal'), 'validFrom', draft.validFrom, { type: 'date', size: 'sm' })}
          ${renderField(i18n?.t('ui.validTo', 'Valida a'), 'validTo', draft.validTo, { type: 'date', size: 'sm' })}
          ${renderField(i18n?.t('ui.clientRequired', 'Cliente'), 'client', draft.client, { size: 'lg', list: dirs.importers || [] })}
          ${renderField('Prospect', 'prospect', draft.prospect, { size: 'md' })}
          ${renderField(i18n?.t('ui.contactPerson', 'Contatto'), 'contactPerson', draft.contactPerson, { size: 'md' })}
          ${renderField(i18n?.t('ui.payer', 'Pagatore'), 'payer', draft.payer, { size: 'md' })}
          ${renderField(i18n?.t('ui.paymentTerms', 'Condizioni pagamento'), 'paymentTerms', draft.paymentTerms, { size: 'md' })}
          ${renderField(i18n?.t('ui.incoterm', 'Resa'), 'incoterm', draft.incoterm, { size: 'sm' })}
          ${renderField(i18n?.t('ui.pickup', 'Ritiro'), 'pickupPlace', draft.pickupPlace, { size: 'md', list: dirs.logisticsLocations || [] })}
          ${renderField(i18n?.t('ui.delivery', 'Consegna'), 'deliveryPlace', draft.deliveryPlace, { size: 'md', list: dirs.logisticsLocations || [] })}
          ${renderField(i18n?.t('ui.origin', 'Origine'), 'origin', draft.origin, { size: 'md', list: dirs.originDirectories || [] })}
          ${renderField(i18n?.t('ui.destination', 'Destinazione'), 'destination', draft.destination, { size: 'md', list: dirs.destinationDirectories || [] })}
          ${renderField(i18n?.t('ui.loadingPort', 'Porto imbarco'), 'loadingPort', draft.loadingPort, { size: 'md', list: (dirs.seaPortLocodes || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name).filter(Boolean) })}
          ${renderField(i18n?.t('ui.unloadingPort', 'Porto sbarco'), 'unloadingPort', draft.unloadingPort, { size: 'md', list: (dirs.seaPortLocodes || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name).filter(Boolean) })}
          ${renderField(i18n?.t('ui.carrier', 'Compagnia / vettore'), 'carrier', draft.carrier, { size: 'md', list: [].concat(dirs.shippingCompanies || [], dirs.airlines || [], dirs.carriers || []) })}
          ${renderField(i18n?.t('ui.supplier', 'Fornitore'), 'supplier', draft.supplier, { size: 'md', list: dirs.suppliers || [] })}
          ${renderField(i18n?.t('ui.goodsType', 'Tipologia merce'), 'goodsType', draft.goodsType, { size: 'md' })}
          ${renderField(i18n?.t('ui.dangerousGoods', 'Merce pericolosa'), 'dangerousGoods', draft.dangerousGoods, { type: 'select', size: 'xs', items: [{ value: 'NO', label: 'NO' }, { value: 'SI', label: 'SI' }] })}
          ${renderField(i18n?.t('ui.packages', 'Colli'), 'pieces', draft.pieces, { size: 'xs' })}
          ${renderField(i18n?.t('ui.dimensions', 'Dimensioni'), 'dimensions', draft.dimensions, { size: 'sm' })}
          ${renderField(i18n?.t('ui.grossWeight', 'Peso lordo'), 'grossWeight', draft.grossWeight, { size: 'xs' })}
          ${renderField(i18n?.t('ui.netWeight', 'Peso netto'), 'netWeight', draft.netWeight, { size: 'xs' })}
          ${renderField(i18n?.t('ui.volume', 'Volume'), 'volume', draft.volume, { size: 'xs' })}
          ${renderField(i18n?.t('ui.chargeableWeight', 'Peso tassabile'), 'chargeableWeight', draft.chargeableWeight, { size: 'xs' })}
          ${renderField(i18n?.t('ui.amount', 'Valore'), 'valueAmount', draft.valueAmount, { size: 'xs' })}
          ${renderField(i18n?.t('ui.currency', 'Valuta'), 'currency', draft.currency, { type: 'select', size: 'xs', items: (dirs.currencies || ['EUR']).map((item) => ({ value: item, label: item })) })}
          ${renderField(i18n?.t('ui.customerNotes', 'Note cliente'), 'note', draft.note, { type: 'textarea', size: 'full', rows: 3 })}
          ${renderField(i18n?.t('ui.internalNotes', 'Note interne'), 'internalNote', draft.internalNote, { type: 'textarea', size: 'full', rows: 3 })}
        </div>
      </section>`;
  }

  function renderDetail(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <section class="panel quotation-editor-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.detail', 'Dettaglio'))}</h3><p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationDetailHint', 'Righe costo/ricavo compatte per simulazione e marginalità.'))}</p></div><div class="action-row"><button class="btn secondary" type="button" data-quotation-add-line>${U.escapeHtml(i18n?.t('ui.addRow', 'Aggiungi riga'))}</button></div></div>
        <div class="quotation-line-table-wrap">
          <table class="quotation-line-table"><thead><tr><th>Codice</th><th>Descrizione</th><th>Calc.</th><th>Q.tà</th><th>Unità</th><th>Fornitore</th><th>Costo</th><th>Ricavo</th><th>Valuta</th><th>IVA</th><th>Op.</th></tr></thead><tbody>${rows.map((row, index) => `<tr>
            <td><input type="text" data-quotation-line-field="code" data-quotation-line-index="${index}" value="${U.escapeHtml(row.code || '')}"></td>
            <td><input type="text" data-quotation-line-field="description" data-quotation-line-index="${index}" value="${U.escapeHtml(row.description || '')}"></td>
            <td><select data-quotation-line-field="calcType" data-quotation-line-index="${index}"><option value="fixed"${row.calcType === 'fixed' ? ' selected' : ''}>FIX</option><option value="per_kg"${row.calcType === 'per_kg' ? ' selected' : ''}>Kg</option><option value="per_cbm"${row.calcType === 'per_cbm' ? ' selected' : ''}>CBM</option><option value="per_piece"${row.calcType === 'per_piece' ? ' selected' : ''}>Pz</option></select></td>
            <td><input type="number" step="0.01" data-quotation-line-field="quantity" data-quotation-line-index="${index}" value="${U.escapeHtml(row.quantity || '')}"></td>
            <td><input type="text" data-quotation-line-field="unit" data-quotation-line-index="${index}" value="${U.escapeHtml(row.unit || '')}"></td>
            <td><input type="text" data-quotation-line-field="supplier" data-quotation-line-index="${index}" value="${U.escapeHtml(row.supplier || '')}"></td>
            <td><input type="number" step="0.01" data-quotation-line-field="cost" data-quotation-line-index="${index}" value="${U.escapeHtml(row.cost || '')}"></td>
            <td><input type="number" step="0.01" data-quotation-line-field="revenue" data-quotation-line-index="${index}" value="${U.escapeHtml(row.revenue || '')}"></td>
            <td><input type="text" data-quotation-line-field="currency" data-quotation-line-index="${index}" value="${U.escapeHtml(row.currency || 'EUR')}"></td>
            <td><input type="number" step="0.01" data-quotation-line-field="vat" data-quotation-line-index="${index}" value="${U.escapeHtml(row.vat || '')}"></td>
            <td><button type="button" class="btn secondary" data-quotation-remove-line="${index}">${U.escapeHtml(i18n?.t('ui.remove', 'Rimuovi'))}</button></td>
          </tr>`).join('')}</tbody></table>
        </div>
        ${renderDetailTotals(draft)}
      </section>`;
  }

  function parseNumber(value) {
    const normalized = String(value || '').replace(',', '.').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function renderDetailTotals(draft) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    const totalCost = rows.reduce((sum, row) => sum + parseNumber(row.cost) * parseNumber(row.quantity || 1), 0);
    const totalRevenue = rows.reduce((sum, row) => sum + parseNumber(row.revenue) * parseNumber(row.quantity || 1), 0);
    const margin = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;
    return `<div class="quotation-totals-grid"><div class="stack-item"><strong>€ ${totalCost.toFixed(2)}</strong><span>Totale costi</span></div><div class="stack-item"><strong>€ ${totalRevenue.toFixed(2)}</strong><span>Totale ricavi</span></div><div class="stack-item"><strong>€ ${margin.toFixed(2)}</strong><span>Margine</span></div><div class="stack-item"><strong>${marginPct.toFixed(1)}%</strong><span>Margine %</span></div></div>`;
  }

  function renderDocuments(draft, i18n) {
    const rows = Array.isArray(draft.attachments) ? draft.attachments : [];
    return `
      <section class="panel quotation-editor-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.documents', 'Documenti'))}</h3><p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationDocumentsHint', 'Registro compatto di allegati collegati alla quotazione.'))}</p></div><div class="action-row"><button class="btn secondary" type="button" data-quotation-add-document>${U.escapeHtml(i18n?.t('ui.addDocument', 'Aggiungi documento'))}</button></div></div>
        ${rows.length ? `<div class="quotation-attachments-list">${rows.map((row, index) => `<article class="quotation-attachment-card"><div class="quotation-attachment-grid">${renderField(i18n?.t('ui.title', 'Titolo'), `attachment-title-${index}`, row.title, { size: 'md' }).replace(`data-quotation-field="attachment-title-${index}"`, `data-quotation-attachment-field="title" data-quotation-attachment-index="${index}"`)}${renderField(i18n?.t('ui.category', 'Categoria'), `attachment-category-${index}`, row.category, { size: 'sm' }).replace(`data-quotation-field="attachment-category-${index}"`, `data-quotation-attachment-field="category" data-quotation-attachment-index="${index}"`)}${renderField(i18n?.t('ui.file', 'File'), `attachment-file-${index}`, row.fileName, { size: 'sm' }).replace(`data-quotation-field="attachment-file-${index}"`, `data-quotation-attachment-field="fileName" data-quotation-attachment-index="${index}"`)}${renderField(i18n?.t('ui.note', 'Nota'), `attachment-note-${index}`, row.note, { type: 'textarea', size: 'full', rows: 2 }).replace(`data-quotation-field="attachment-note-${index}"`, `data-quotation-attachment-field="note" data-quotation-attachment-index="${index}"`)}</div><div class="action-row"><button type="button" class="btn secondary" data-quotation-remove-document="${index}">${U.escapeHtml(i18n?.t('ui.remove', 'Rimuovi'))}</button></div></article>`).join('')}</div>` : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noDocumentsYet', 'Nessun documento collegato.'))}</div>`}
      </section>`;
  }

  function renderActiveEditor(state, i18n) {
    const session = Workspace?.getActiveSession?.(state) || null;
    if (!session) return '';
    const draft = session.draft || {};
    const activeTab = String(session.tab || 'testata').trim() || 'testata';
    const tabs = [
      ['testata', i18n?.t('ui.headerTab', 'Testata') || 'Testata'],
      ['dettaglio', i18n?.t('ui.detail', 'Dettaglio') || 'Dettaglio'],
      ['documenti', i18n?.t('ui.documents', 'Documenti') || 'Documenti']
    ];
    return `<section class="quotations-editor-shell"><header class="quotation-tab-strip">${tabs.map(([key, label]) => `<button type="button" class="quotation-tab${key === activeTab ? ' active' : ''}" data-quotation-tab="${U.escapeHtml(key)}">${U.escapeHtml(label)}</button>`).join('')}</header>${activeTab === 'dettaglio' ? renderDetail(draft, i18n) : activeTab === 'documenti' ? renderDocuments(draft, i18n) : renderTestata(draft, state, i18n)}</section>`;
  }

  function render(state, options = {}) {
    ensureState(state);
    const i18n = options.i18n || null;
    const selectedPractice = typeof options.getSelectedPractice === 'function' ? options.getSelectedPractice() : null;
    return `
      <section class="stack module-quotations-shell">
        ${renderLauncher(state, i18n, selectedPractice)}
        ${renderSavedRecords(state, i18n)}
        ${renderSessionStrip(state, i18n)}
        ${renderActiveEditor(state, i18n)}
      </section>`;
  }

  function openBlankQuotation(context) {
    const draft = createEmptyDraft(context.state);
    Workspace?.openSession?.(context.state, draft);
    context.save?.();
    context.render?.();
  }

  function openFromPractice(context, practice) {
    if (!practice) return;
    const draft = buildDraftFromPractice(context.state, practice);
    Workspace?.openSession?.(context.state, draft);
    context.save?.();
    context.render?.();
  }

  function openFromRecord(context, record, duplicate = false) {
    if (!record) return;
    const draft = safeClone(record.draft || {});
    if (duplicate) {
      draft.editingRecordId = '';
      draft.quotationNumber = Workspace?.nextQuotationNumber?.(context.state) || draft.quotationNumber;
      draft.status = 'draft';
    }
    Workspace?.openSession?.(context.state, draft);
    context.save?.();
    context.render?.();
  }

  function activeSessionId(context) {
    return String(context.state?.quotationsWorkspace?.activeSessionId || '').trim();
  }

  function saveCurrent(context, closeAfter = false, queueSend = false) {
    const sessionId = activeSessionId(context);
    if (!sessionId) return null;
    const record = Workspace?.saveRecord?.(context.state, sessionId, { updatedBy: currentOperatorName(context.state) }) || null;
    if (queueSend && record) {
      Workspace?.queueDispatch?.(context.state, record, { recipient: record.client || '' });
      context.toast?.success?.('Quotazione salvata e accodata al Centro invii automatici di Kedrix One.');
    } else {
      context.toast?.success?.('Quotazione salvata in Kedrix One.');
    }
    if (closeAfter) {
      Workspace?.closeSession?.(context.state, sessionId);
    }
    context.save?.();
    context.render?.();
    return record;
  }

  function buildPrintableHtml(context) {
    const session = Workspace?.getActiveSession?.(context.state) || null;
    if (!session) return '';
    const draft = session.draft || {};
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${U.escapeHtml(draft.quotationNumber || 'Quotazione')}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:22px;margin:0 0 8px}h2{font-size:14px;margin:20px 0 8px;text-transform:uppercase;color:#444}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ccc;padding:8px;font-size:12px;text-align:left}small{color:#666} .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px} .card{border:1px solid #ddd;padding:12px}</style></head><body><h1>${U.escapeHtml(draft.quotationNumber || 'Quotazione')}</h1><small>${U.escapeHtml(draft.title || '')}</small><div class="grid"><div class="card"><strong>Cliente</strong><div>${U.escapeHtml(draft.client || '—')}</div></div><div class="card"><strong>Pratica</strong><div>${U.escapeHtml(draft.practiceReference || '—')}</div></div><div class="card"><strong>Valida dal</strong><div>${U.escapeHtml(draft.validFrom || '—')}</div></div><div class="card"><strong>Valida a</strong><div>${U.escapeHtml(draft.validTo || '—')}</div></div></div><h2>Dettaglio economico</h2><table><thead><tr><th>Codice</th><th>Descrizione</th><th>Q.tà</th><th>Costo</th><th>Ricavo</th><th>Valuta</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${U.escapeHtml(row.code || '')}</td><td>${U.escapeHtml(row.description || '')}</td><td>${U.escapeHtml(row.quantity || '')}</td><td>${U.escapeHtml(row.cost || '')}</td><td>${U.escapeHtml(row.revenue || '')}</td><td>${U.escapeHtml(row.currency || 'EUR')}</td></tr>`).join('')}</tbody></table></body></html>`;
  }

  function printCurrent(context) {
    const html = buildPrintableHtml(context);
    if (!html) return;
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.position = 'fixed';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    document.body.appendChild(frame);
    const doc = frame.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 800);
    };
  }

  async function maybeCloseDirtySession(context, sessionId) {
    const session = Workspace?.getSession?.(context.state, sessionId) || null;
    if (!session || !session.isDirty) return true;
    const confirmed = Feedback && typeof Feedback.confirm === 'function'
      ? await Feedback.confirm({ title: 'Chiudere la maschera?', message: 'Questa quotazione contiene modifiche non salvate.', confirmLabel: 'Chiudi', cancelLabel: 'Annulla', tone: 'warning' })
      : window.confirm('Questa quotazione contiene modifiche non salvate. Chiudere la maschera?');
    return Boolean(confirmed);
  }

  function bind(context) {
    const root = context.root;
    if (!root || root.dataset.quotationBound === '1') return;
    root.dataset.quotationBound = '1';

    root.addEventListener('click', async (event) => {
      const newButton = event.target.closest('[data-quotation-new]');
      if (newButton) {
        openBlankQuotation(context);
        return;
      }
      const activeButton = event.target.closest('[data-quotation-open-active]');
      if (activeButton) {
        const practice = typeof context.getSelectedPractice === 'function' ? context.getSelectedPractice() : null;
        openFromPractice(context, practice);
        return;
      }
      const practiceButton = event.target.closest('[data-quotation-open-practice]');
      if (practiceButton) {
        const practiceId = String(practiceButton.dataset.quotationOpenPractice || '').trim();
        const practice = (context.state?.practices || []).find((entry) => String(entry?.id || '').trim() === practiceId) || null;
        openFromPractice(context, practice);
        return;
      }
      const openRecordButton = event.target.closest('[data-quotation-open-record]');
      if (openRecordButton) {
        const recordId = String(openRecordButton.dataset.quotationOpenRecord || '').trim();
        const record = (context.state?.quotationRecords || []).find((entry) => String(entry?.id || '').trim() === recordId) || null;
        openFromRecord(context, record, false);
        return;
      }
      const duplicateRecordButton = event.target.closest('[data-quotation-duplicate-record]');
      if (duplicateRecordButton) {
        const recordId = String(duplicateRecordButton.dataset.quotationDuplicateRecord || '').trim();
        const record = (context.state?.quotationRecords || []).find((entry) => String(entry?.id || '').trim() === recordId) || null;
        openFromRecord(context, record, true);
        return;
      }
      const switchButton = event.target.closest('[data-quotation-session-switch]');
      if (switchButton) {
        Workspace?.switchSession?.(context.state, switchButton.dataset.quotationSessionSwitch || '');
        context.save?.();
        context.render?.();
        return;
      }
      const closeButton = event.target.closest('[data-quotation-session-close]');
      if (closeButton) {
        const sessionId = String(closeButton.dataset.quotationSessionClose || '').trim();
        if (await maybeCloseDirtySession(context, sessionId)) {
          Workspace?.closeSession?.(context.state, sessionId);
          context.save?.();
          context.render?.();
        }
        return;
      }
      const tabButton = event.target.closest('[data-quotation-tab]');
      if (tabButton) {
        Workspace?.setTab?.(context.state, activeSessionId(context), tabButton.dataset.quotationTab || 'testata');
        context.save?.();
        context.render?.();
        return;
      }
      const profileButton = event.target.closest('[data-quotation-profile]');
      if (profileButton) {
        Workspace?.updateField?.(context.state, activeSessionId(context), 'serviceProfile', profileButton.dataset.quotationProfile || 'generic');
        context.save?.();
        context.render?.();
        return;
      }
      const addLineButton = event.target.closest('[data-quotation-add-line]');
      if (addLineButton) {
        const session = Workspace?.getActiveSession?.(context.state) || null;
        if (session) {
          session.draft.lineItems.push(Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }
      const removeLineButton = event.target.closest('[data-quotation-remove-line]');
      if (removeLineButton) {
        const index = Number(removeLineButton.dataset.quotationRemoveLine);
        const session = Workspace?.getActiveSession?.(context.state) || null;
        if (session && Number.isInteger(index)) {
          session.draft.lineItems.splice(index, 1);
          if (!session.draft.lineItems.length) session.draft.lineItems.push(Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }
      const addDocumentButton = event.target.closest('[data-quotation-add-document]');
      if (addDocumentButton) {
        const session = Workspace?.getActiveSession?.(context.state) || null;
        if (session) {
          session.draft.attachments.push(Workspace?.defaultAttachment?.() || { id: `qad-${Date.now()}` });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }
      const removeDocumentButton = event.target.closest('[data-quotation-remove-document]');
      if (removeDocumentButton) {
        const index = Number(removeDocumentButton.dataset.quotationRemoveDocument);
        const session = Workspace?.getActiveSession?.(context.state) || null;
        if (session && Number.isInteger(index)) {
          session.draft.attachments.splice(index, 1);
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }
      if (event.target.closest('[data-quotation-save]')) {
        saveCurrent(context, false, false);
        return;
      }
      if (event.target.closest('[data-quotation-save-close]')) {
        saveCurrent(context, true, false);
        return;
      }
      if (event.target.closest('[data-quotation-save-send]')) {
        saveCurrent(context, false, true);
        return;
      }
      if (event.target.closest('[data-quotation-print]')) {
        printCurrent(context);
      }
    });

    root.addEventListener('input', (event) => {
      const field = event.target.closest('[data-quotation-field]');
      if (field) {
        const fieldName = String(field.dataset.quotationField || '').trim();
        if (fieldName === 'filterQuick') {
          context.state.quotationFilters.quick = field.value;
          context.save?.();
          context.render?.();
          return;
        }
        Workspace?.updateField?.(context.state, activeSessionId(context), fieldName, field.value);
        context.save?.();
        return;
      }
      const lineField = event.target.closest('[data-quotation-line-field]');
      if (lineField) {
        const index = Number(lineField.dataset.quotationLineIndex);
        const fieldName = String(lineField.dataset.quotationLineField || '').trim();
        const session = Workspace?.getActiveSession?.(context.state) || null;
        if (session && Number.isInteger(index) && session.draft.lineItems[index]) {
          session.draft.lineItems[index][fieldName] = lineField.value;
          session.isDirty = true;
          context.save?.();
        }
        return;
      }
      const attachmentField = event.target.closest('[data-quotation-attachment-field]');
      if (attachmentField) {
        const index = Number(attachmentField.dataset.quotationAttachmentIndex);
        const fieldName = String(attachmentField.dataset.quotationAttachmentField || '').trim();
        const session = Workspace?.getActiveSession?.(context.state) || null;
        if (session && Number.isInteger(index) && session.draft.attachments[index]) {
          session.draft.attachments[index][fieldName] = attachmentField.value;
          session.isDirty = true;
          context.save?.();
        }
      }
    });

    root.addEventListener('change', (event) => {
      const field = event.target.closest('[data-quotation-field]');
      if (field) {
        const name = String(field.dataset.quotationField || '').trim();
        if (name === 'filterStatus') {
          context.state.quotationFilters.status = field.value;
          context.save?.();
          context.render?.();
          return;
        }
        if (name === 'filterProfile') {
          context.state.quotationFilters.serviceProfile = field.value;
          context.save?.();
          context.render?.();
          return;
        }
      }
    });
  }

  return {
    ensureState,
    render,
    bind
  };
})();
