window.KedrixOneQuotationsModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneQuotationsWorkspace || null;
  const Feedback = window.KedrixOneAppFeedback || null;
  const Branding = window.KedrixOneModuleBranding || null;
  const TransportUnits = window.KedrixOneTransportUnitData || { defaultTransportUnitTypes: [] };

  function safeClone(value) {
    if (Workspace && typeof Workspace.cloneDraft === 'function') return Workspace.cloneDraft(value);
    if (typeof window !== 'undefined' && typeof window.structuredClone === 'function') return window.structuredClone(value || {});
    return JSON.parse(JSON.stringify(value || {}));
  }

  function today() {
    return Workspace?.today?.() || new Date().toISOString().slice(0, 10);
  }

  function parseNumber(value) {
    const normalized = Number(String(value || '').replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : 0;
  }

  function money(value) {
    return parseNumber(value).toFixed(2);
  }

  function ensureState(state) {
    Workspace?.ensureState?.(state);
    if (!Array.isArray(state.quotationRecords)) state.quotationRecords = [];
    if (!Array.isArray(state.quotationDispatchQueue)) state.quotationDispatchQueue = [];
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

  function directories(state) {
    return state?.companyConfig?.practiceConfig?.directories || {};
  }

  function transportUnitOptions() {
    return (TransportUnits?.defaultTransportUnitTypes || []).map((item) => ({
      value: String(item?.value || '').trim(),
      label: String(item?.displayValue || item?.label || item?.value || '').trim()
    })).filter((item) => item.value && item.label);
  }

  function serviceProfileLabel(profile) {
    const labels = {
      generic: 'Generica',
      sea: 'Mare',
      air: 'Aerea',
      rail: 'Ferrovia',
      road: 'Terra',
      agency: 'Agenzia',
      warehouse: 'Magazzino'
    };
    return labels[String(profile || '').trim()] || 'Generica';
  }

  function companyMeta(state, draft) {
    return [
      `Profilo ${serviceProfileLabel(draft?.serviceProfile)}`,
      String(draft?.quotationNumber || '').trim() || 'Nuova quotazione',
      Branding?.companyName?.(state) || String(state?.companyConfig?.name || 'Kedrix One').trim()
    ].filter(Boolean);
  }

  function emptySpecificProfile(profile) {
    return {
      containerType: '',
      containerSize: '',
      containerCount: '',
      vesselName: '',
      voyageNumber: '',
      freeDays: '',
      airportOrigin: '',
      airportDestination: '',
      awbMode: '',
      mawb: '',
      hawb: '',
      truckMode: '',
      vehicleType: '',
      transitDays: '',
      warehouseSite: '',
      storageDays: '',
      palletCount: '',
      agencyScope: '',
      customsOffice: '',
      customsSection: '',
      railTerminalOrigin: '',
      railTerminalDestination: '',
      wagonType: '',
      scheduleNote: '',
      ...(profile === 'sea' ? { awbMode: '' } : {})
    };
  }

  function createEmptyDraft(state, overrides = {}) {
    const quotationNumber = Workspace?.nextQuotationNumber?.(state) || `Q-${new Date().getFullYear()}-0001`;
    const base = {
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
      ...emptySpecificProfile('generic')
    };
    const merged = { ...base, ...overrides };
    return safeClone({ ...merged, ...emptySpecificProfile(String(merged.serviceProfile || 'generic').trim()) , ...merged });
  }

  function detectProfile(rawValue) {
    const value = String(rawValue || '').toLowerCase();
    if (/air|aereo/.test(value)) return 'air';
    if (/sea|mare/.test(value)) return 'sea';
    if (/road|terra|truck/.test(value)) return 'road';
    if (/rail|ferro/.test(value)) return 'rail';
    if (/ware|magazz/.test(value)) return 'warehouse';
    if (/agenzia|agency|customs/.test(value)) return 'agency';
    return 'generic';
  }

  function buildDraftFromPractice(state, practice, profile = '') {
    const dynamic = practice?.dynamicData || {};
    const serviceProfile = profile || detectProfile(practice?.mode || practice?.practiceType || dynamic.mode || dynamic.serviceProfile);
    const base = createEmptyDraft(state, {
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
      pieces: String(dynamic.packages || dynamic.pieces || practice?.packageCount || '').trim(),
      dimensions: String(dynamic.dimensions || '').trim(),
      grossWeight: String(dynamic.grossWeight || practice?.grossWeight || '').trim(),
      netWeight: String(dynamic.netWeight || '').trim(),
      volume: String(dynamic.volume || '').trim(),
      chargeableWeight: String(dynamic.chargeableWeight || '').trim(),
      valueAmount: String(dynamic.invoiceAmount || '').trim(),
      currency: String(dynamic.currency || dynamic.invoiceCurrency || 'EUR').trim() || 'EUR',
      note: String(dynamic.customerInstructions || '').trim(),
      internalNote: String(dynamic.internalNotes || '').trim(),
      containerType: String(dynamic.transportUnitType || dynamic.containerType || '').trim(),
      containerSize: String(dynamic.containerSize || '').trim(),
      containerCount: String(dynamic.containerCount || '').trim(),
      vesselName: String(dynamic.vessel || '').trim(),
      voyageNumber: String(dynamic.voyage || '').trim(),
      airportOrigin: String(dynamic.originAirport || '').trim(),
      airportDestination: String(dynamic.destinationAirport || '').trim(),
      mawb: String(dynamic.mawb || '').trim(),
      hawb: String(dynamic.hawb || dynamic.hawbReference || '').trim(),
      truckMode: String(dynamic.truckMode || '').trim(),
      vehicleType: String(dynamic.vehicleType || '').trim(),
      warehouseSite: String(dynamic.deposit || dynamic.warehouseSite || '').trim(),
      customsOffice: String(dynamic.customsOffice || '').trim(),
      customsSection: String(dynamic.customsSection || '').trim(),
      railTerminalOrigin: String(dynamic.railTerminalOrigin || '').trim(),
      railTerminalDestination: String(dynamic.railTerminalDestination || '').trim()
    });
    return base;
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
      const haystack = [record?.quotationNumber, record?.title, record?.client, record?.practiceReference, record?.serviceProfile].join(' ').toLowerCase();
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
    return (state?.practices || [])
      .slice()
      .sort((a, b) => String(b?.practiceDate || '').localeCompare(String(a?.practiceDate || '')))
      .slice(0, 12);
  }

  function fieldClass(name, options = {}) {
    const sizeMap = { xs: 'quotation-field-xs', sm: 'quotation-field-sm', md: 'quotation-field-md', lg: 'quotation-field-lg', xl: 'quotation-field-xl', full: 'quotation-field-full' };
    const size = String(options.size || 'md').trim();
    const extras = Array.isArray(options.extraClass) ? options.extraClass : [];
    return ['field', 'quotation-field', sizeMap[size] || sizeMap.md, `quotation-field-${String(name || '').trim()}`, ...extras].join(' ');
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
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationsModuleHint', 'Preventivi multi-servizio con profili differenziati, dettaglio economico e documenti collegati.'))}</p>
          </div>
        </div>
        <div class="quotations-kpi-grid">
          <article class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Quotazioni salvate'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.records))}</div></article>
          <article class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.openMasks))}</div></article>
          <article class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.queuedDispatches', 'Invii in coda'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.queued))}</div></article>
          <article class="stack-item"><span>Profili</span><div class="summary-value">7</div></article>
        </div>
        <div class="quotations-launcher-grid">
          <div class="quotation-side-card">
            <div class="quotation-side-card-title">Azioni rapide</div>
            <div class="quotation-filter-stack">
              <button class="btn" type="button" data-quotation-new>Nuova quotazione</button>
              ${selectedPractice ? `<button class="btn secondary" type="button" data-quotation-open-active>Usa pratica attiva</button>` : ''}
              ${renderField('Ricerca rapida', 'filterQuick', state?.quotationFilters?.quick || '', { size: 'full' })}
              ${renderField('Stato', 'filterStatus', state?.quotationFilters?.status || 'all', { type: 'select', size: 'full', items: [{ value: 'all', label: 'Tutti' }, { value: 'draft', label: 'Bozza' }, { value: 'sent', label: 'Inviata' }, { value: 'approved', label: 'Confermata' }, { value: 'expired', label: 'Scaduta' }] })}
              ${renderField('Profilo', 'filterProfile', state?.quotationFilters?.serviceProfile || 'all', { type: 'select', size: 'full', items: [{ value: 'all', label: 'Tutti i profili' }, { value: 'generic', label: 'Generica' }, { value: 'sea', label: 'Mare' }, { value: 'air', label: 'Aerea' }, { value: 'rail', label: 'Ferrovia' }, { value: 'road', label: 'Terra' }, { value: 'agency', label: 'Agenzia' }, { value: 'warehouse', label: 'Magazzino' }] })}
            </div>
          </div>
          <div class="quotation-main-card">
            <div class="quotation-side-card-title">Pratiche recenti</div>
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
        ${records.length ? `<div class="quotation-record-list">${records.map((record) => `<article class="quotation-record-card"><div><strong>${U.escapeHtml(record.quotationNumber || '—')}</strong><span>${U.escapeHtml(record.client || '—')}</span><em>${U.escapeHtml(serviceProfileLabel(record.serviceProfile))} · ${U.escapeHtml(record.practiceReference || record.title || '—')}</em></div><div class="action-row"><button type="button" class="btn secondary" data-quotation-open-record="${U.escapeHtml(record.id)}">${U.escapeHtml(i18n?.t('ui.open', 'Apri'))}</button><button type="button" class="btn secondary" data-quotation-duplicate-record="${U.escapeHtml(record.id)}">${U.escapeHtml(i18n?.t('ui.duplicate', 'Duplica'))}</button></div></article>`).join('')}</div>` : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noQuotationsYet', 'Nessuna quotazione salvata.'))}</div>`}
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
          return `<div class="quotation-session-chip${active}"><button type="button" class="quotation-session-main" data-quotation-session-switch="${U.escapeHtml(session.id)}"><strong>${U.escapeHtml(draft.quotationNumber || 'Nuova')}</strong><span>${U.escapeHtml(draft.client || '—')}</span><span>${U.escapeHtml(serviceProfileLabel(draft.serviceProfile))}</span></button><button type="button" class="quotation-session-close" data-quotation-session-close="${U.escapeHtml(session.id)}">×</button></div>`;
        }).join('')}</div>
      </section>`;
  }

  function renderSummary(draft) {
    const items = [
      ['Numero', draft.quotationNumber || '—'],
      ['Cliente', draft.client || '—'],
      ['Profilo', serviceProfileLabel(draft.serviceProfile)],
      ['Valida dal', draft.validFrom || '—']
    ];
    return `<div class="tag-grid quotation-summary-grid">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderCommonFields(draft, dirs, i18n) {
    const seaPorts = (dirs.seaPortLocodes || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name).filter(Boolean);
    const airports = (dirs.airports || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name || entry).filter(Boolean);
    const companies = [].concat(dirs.shippingCompanies || [], dirs.airlines || [], dirs.carriers || []);
    return `
      <section class="quotation-service-card">
        <div class="quotation-service-card-head">
          <h4>Dati comuni</h4>
          <p>Campi condivisi della testata commerciale e logistica.</p>
        </div>
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
          ${renderField(i18n?.t('ui.loadingPort', 'Porto imbarco'), 'loadingPort', draft.loadingPort, { size: 'md', list: seaPorts.length ? seaPorts : airports })}
          ${renderField(i18n?.t('ui.unloadingPort', 'Porto sbarco'), 'unloadingPort', draft.unloadingPort, { size: 'md', list: seaPorts.length ? seaPorts : airports })}
          ${renderField(i18n?.t('ui.carrier', 'Compagnia / vettore'), 'carrier', draft.carrier, { size: 'md', list: companies })}
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

  function renderSeaFields(draft, dirs) {
    const containerSizes = ['20', '40', '40HC', '45HC', 'LCL', 'Break bulk'].map((item) => ({ value: item, label: item }));
    return `
      <section class="quotation-service-card is-sea">
        <div class="quotation-service-card-head"><h4>Profilo mare</h4><p>Sea profile con container, nave e viaggio.</p></div>
        <div class="quotation-grid">
          ${renderField('Tipo di container', 'containerType', draft.containerType, { type: 'select', size: 'lg', items: [{ value: '', label: 'Seleziona tipo unità' }, ...transportUnitOptions()] })}
          ${renderField('Dimensione container', 'containerSize', draft.containerSize, { type: 'select', size: 'sm', items: [{ value: '', label: 'Seleziona' }, ...containerSizes] })}
          ${renderField('N. container / unità', 'containerCount', draft.containerCount, { size: 'xs' })}
          ${renderField('Nave', 'vesselName', draft.vesselName, { size: 'md', list: dirs.shippingCompanies || [] })}
          ${renderField('Viaggio', 'voyageNumber', draft.voyageNumber, { size: 'sm' })}
          ${renderField('Franchi / free days', 'freeDays', draft.freeDays, { size: 'sm' })}
          ${renderField('Porto imbarco', 'loadingPort', draft.loadingPort, { size: 'md', list: (dirs.seaPortLocodes || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name).filter(Boolean) })}
          ${renderField('Porto sbarco', 'unloadingPort', draft.unloadingPort, { size: 'md', list: (dirs.seaPortLocodes || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name).filter(Boolean) })}
        </div>
      </section>`;
  }

  function renderAirFields(draft, dirs) {
    const airports = (dirs.airports || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name || entry).filter(Boolean);
    return `
      <section class="quotation-service-card is-air">
        <div class="quotation-service-card-head"><h4>Profilo aereo</h4><p>Campi dedicati a aeroporto, AWB e peso tassabile.</p></div>
        <div class="quotation-grid">
          ${renderField('Aeroporto partenza', 'airportOrigin', draft.airportOrigin, { size: 'md', list: airports })}
          ${renderField('Aeroporto arrivo', 'airportDestination', draft.airportDestination, { size: 'md', list: airports })}
          ${renderField('Tipo AWB', 'awbMode', draft.awbMode, { type: 'select', size: 'sm', items: [{ value: '', label: 'Seleziona' }, { value: 'direct', label: 'Diretto' }, { value: 'console', label: 'Consolle' }, { value: 'back-to-back', label: 'Back to back' }] })}
          ${renderField('MAWB', 'mawb', draft.mawb, { size: 'sm' })}
          ${renderField('HAWB', 'hawb', draft.hawb, { size: 'sm' })}
          ${renderField('Peso tassabile', 'chargeableWeight', draft.chargeableWeight, { size: 'xs' })}
        </div>
      </section>`;
  }

  function renderRoadFields(draft, dirs) {
    return `
      <section class="quotation-service-card is-road">
        <div class="quotation-service-card-head"><h4>Profilo terra</h4><p>Campi dedicati a tipo servizio strada e mezzo.</p></div>
        <div class="quotation-grid">
          ${renderField('Servizio', 'truckMode', draft.truckMode, { type: 'select', size: 'sm', items: [{ value: '', label: 'Seleziona' }, { value: 'FTL', label: 'FTL' }, { value: 'LTL', label: 'LTL' }, { value: 'Espresso', label: 'Espresso' }, { value: 'Dedicato', label: 'Dedicato' }] })}
          ${renderField('Tipologia mezzo', 'vehicleType', draft.vehicleType, { size: 'md', list: dirs.vehicleTypes || [] })}
          ${renderField('Transit time', 'transitDays', draft.transitDays, { size: 'sm' })}
          ${renderField('Schedule / note corsa', 'scheduleNote', draft.scheduleNote, { size: 'md' })}
        </div>
      </section>`;
  }

  function renderRailFields(draft) {
    return `
      <section class="quotation-service-card is-rail">
        <div class="quotation-service-card-head"><h4>Profilo ferrovia</h4><p>Campi dedicati a terminal e asset ferroviari.</p></div>
        <div class="quotation-grid">
          ${renderField('Terminal origine', 'railTerminalOrigin', draft.railTerminalOrigin, { size: 'md' })}
          ${renderField('Terminal destinazione', 'railTerminalDestination', draft.railTerminalDestination, { size: 'md' })}
          ${renderField('Tipologia wagon', 'wagonType', draft.wagonType, { size: 'sm' })}
          ${renderField('Schedule / slot', 'scheduleNote', draft.scheduleNote, { size: 'md' })}
        </div>
      </section>`;
  }

  function renderAgencyFields(draft, dirs) {
    return `
      <section class="quotation-service-card is-agency">
        <div class="quotation-service-card-head"><h4>Profilo agenzia</h4><p>Campi dedicati a scope documentale e doganale.</p></div>
        <div class="quotation-grid">
          ${renderField('Ambito agenzia', 'agencyScope', draft.agencyScope, { type: 'select', size: 'sm', items: [{ value: '', label: 'Seleziona' }, { value: 'Documentale', label: 'Documentale' }, { value: 'Doganale', label: 'Doganale' }, { value: 'Rappresentanza', label: 'Rappresentanza' }, { value: 'Booking', label: 'Booking' }] })}
          ${renderField('Dogana', 'customsOffice', draft.customsOffice, { size: 'md', list: (dirs.customsOffices || []).map((entry) => entry?.label || entry?.value || entry?.name || entry).filter(Boolean) })}
          ${renderField('Sezione', 'customsSection', draft.customsSection, { size: 'sm' })}
          ${renderField('Riferimenti / note pratiche', 'scheduleNote', draft.scheduleNote, { size: 'md' })}
        </div>
      </section>`;
  }

  function renderWarehouseFields(draft, dirs) {
    return `
      <section class="quotation-service-card is-warehouse">
        <div class="quotation-service-card-head"><h4>Profilo magazzino</h4><p>Campi dedicati a deposito, giacenza e pallet.</p></div>
        <div class="quotation-grid">
          ${renderField('Sito / deposito', 'warehouseSite', draft.warehouseSite, { size: 'md', list: dirs.deposits || [] })}
          ${renderField('Giorni giacenza', 'storageDays', draft.storageDays, { size: 'sm' })}
          ${renderField('N. pallet', 'palletCount', draft.palletCount, { size: 'sm' })}
          ${renderField('Schedule / note deposito', 'scheduleNote', draft.scheduleNote, { size: 'md' })}
        </div>
      </section>`;
  }

  function renderServiceSpecificFields(draft, state) {
    const dirs = directories(state);
    switch (String(draft.serviceProfile || 'generic').trim()) {
      case 'sea': return renderSeaFields(draft, dirs);
      case 'air': return renderAirFields(draft, dirs);
      case 'rail': return renderRailFields(draft, dirs);
      case 'road': return renderRoadFields(draft, dirs);
      case 'agency': return renderAgencyFields(draft, dirs);
      case 'warehouse': return renderWarehouseFields(draft, dirs);
      default:
        return `
          <section class="quotation-service-card is-generic">
            <div class="quotation-service-card-head"><h4>Profilo generico</h4><p>Seleziona un profilo dedicato per abilitare campi specifici mare, aereo, terra, ferrovia, agenzia o magazzino.</p></div>
          </section>`;
    }
  }

  function renderTestata(draft, state, i18n) {
    const dirs = directories(state);
    return `
      <section class="panel quotation-editor-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(draft.quotationNumber || 'Nuova quotazione')}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationHeaderHint', 'Testata compatta con profili diversi per mare, aerea, terra, ferrovia, agenzia e magazzino.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-quotation-print>${U.escapeHtml(i18n?.t('ui.print', 'Stampa'))}</button>
            <button class="btn secondary" type="button" data-quotation-save-send>${U.escapeHtml(i18n?.t('ui.saveAndSend', 'Salva e invia'))}</button>
            <button class="btn secondary" type="button" data-quotation-save>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-quotation-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        ${Branding?.renderBanner?.(state, { eyebrow: 'Kedrix One · Quotazioni', title: String(state?.companyConfig?.name || 'Kedrix One').trim(), subtitle: 'Header aziendale visualizzato in testata modulo e stampa', meta: companyMeta(state, draft) }) || ''}
        ${profileButtons(draft.serviceProfile)}
        ${renderSummary(draft)}
        ${renderServiceSpecificFields(draft, state)}
        ${renderCommonFields(draft, dirs, i18n)}
      </section>`;
  }

  function renderDetail(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <section class="panel quotation-editor-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.detail', 'Dettaglio'))}</h3><p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationDetailHint', 'Righe interne costo/ricavo per simulazione, marginalità e prezzo cliente.'))}</p></div><div class="action-row"><button class="btn secondary" type="button" data-quotation-add-line>${U.escapeHtml(i18n?.t('ui.addRow', 'Aggiungi riga'))}</button></div></div>
        <div class="quotation-line-table-wrap">
          <table class="quotation-line-table"><thead><tr><th>Codice</th><th>Descrizione</th><th>Calc.</th><th>Q.tà</th><th>Unità</th><th>Fornitore</th><th>Costo</th><th>Prezzo cliente</th><th>Valuta</th><th>IVA</th><th>Op.</th></tr></thead><tbody>${rows.map((row, index) => `<tr>
            <td><input type="text" data-quotation-line-field="code" data-quotation-line-index="${index}" value="${U.escapeHtml(row.code || '')}"></td>
            <td><input type="text" data-quotation-line-field="description" data-quotation-line-index="${index}" value="${U.escapeHtml(row.description || '')}"></td>
            <td><select data-quotation-line-field="calcType" data-quotation-line-index="${index}"><option value="fixed"${String(row.calcType || 'fixed') === 'fixed' ? ' selected' : ''}>Fixed</option><option value="per-unit"${String(row.calcType || '') === 'per-unit' ? ' selected' : ''}>Per unità</option></select></td>
            <td><input type="number" step="0.01" data-quotation-line-field="quantity" data-quotation-line-index="${index}" value="${U.escapeHtml(row.quantity || '')}"></td>
            <td><input type="text" data-quotation-line-field="unit" data-quotation-line-index="${index}" value="${U.escapeHtml(row.unit || '')}"></td>
            <td><input type="text" data-quotation-line-field="supplier" data-quotation-line-index="${index}" value="${U.escapeHtml(row.supplier || '')}"></td>
            <td><input type="number" step="0.01" data-quotation-line-field="cost" data-quotation-line-index="${index}" value="${U.escapeHtml(row.cost || '')}"></td>
            <td><input type="number" step="0.01" data-quotation-line-field="revenue" data-quotation-line-index="${index}" value="${U.escapeHtml(row.revenue || '')}"></td>
            <td><input type="text" data-quotation-line-field="currency" data-quotation-line-index="${index}" value="${U.escapeHtml(row.currency || 'EUR')}"></td>
            <td><input type="text" data-quotation-line-field="vat" data-quotation-line-index="${index}" value="${U.escapeHtml(row.vat || '22')}"></td>
            <td><button class="btn secondary small-btn" type="button" data-quotation-remove-line="${index}">Rimuovi</button></td>
          </tr>`).join('')}</tbody></table>
        </div>
        ${renderTotals(rows)}
      </section>`;
  }

  function renderTotals(rows) {
    const totalCost = rows.reduce((sum, row) => sum + parseNumber(row.cost) * parseNumber(row.quantity || 1), 0);
    const totalRevenue = rows.reduce((sum, row) => sum + parseNumber(row.revenue) * parseNumber(row.quantity || 1), 0);
    const margin = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;
    return `
      <div class="quotation-totals-grid">
        <article class="stack-item"><span>Totale costi</span><div class="summary-value">${U.escapeHtml(money(totalCost))}</div></article>
        <article class="stack-item"><span>Totale ricavi</span><div class="summary-value">${U.escapeHtml(money(totalRevenue))}</div></article>
        <article class="stack-item"><span>Margine</span><div class="summary-value">${U.escapeHtml(money(margin))}</div></article>
        <article class="stack-item"><span>Margine %</span><div class="summary-value">${U.escapeHtml(marginPct.toFixed(2))}%</div></article>
      </div>`;
  }

  function renderDocuments(draft, i18n) {
    const items = Array.isArray(draft.attachments) ? draft.attachments : [];
    return `
      <section class="panel quotation-editor-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.documents', 'Documenti'))}</h3><p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationDocumentsHint', 'Registro documenti di supporto collegati alla quotazione.'))}</p></div><div class="action-row"><button class="btn secondary" type="button" data-quotation-add-document>${U.escapeHtml(i18n?.t('ui.addDocument', 'Aggiungi documento'))}</button></div></div>
        ${items.length ? `<div class="quotation-attachments-list">${items.map((item, index) => `<article class="quotation-attachment-card"><div class="quotation-attachment-grid">${renderField('Titolo', `attachment-title-${index}`, item.title, { size: 'lg', extraClass: ['quotation-attachment-field'] }).replace('data-quotation-field', 'data-quotation-attachment-field="title" data-quotation-attachment-index')}
        </div></article>`).join('')}</div>` : `<div class="empty-text">Nessun documento allegato.</div>`}
        <div class="quotation-attachments-list">${items.map((item, index) => `<article class="quotation-attachment-card"><div class="quotation-attachment-grid">
          <div class="quotation-field quotation-field-lg"><label>Titolo</label><input type="text" data-quotation-attachment-field="title" data-quotation-attachment-index="${index}" value="${U.escapeHtml(item.title || '')}"></div>
          <div class="quotation-field quotation-field-sm"><label>Categoria</label><input type="text" data-quotation-attachment-field="category" data-quotation-attachment-index="${index}" value="${U.escapeHtml(item.category || 'quotation')}"></div>
          <div class="quotation-field quotation-field-lg"><label>File</label><input type="text" data-quotation-attachment-field="fileName" data-quotation-attachment-index="${index}" value="${U.escapeHtml(item.fileName || '')}"></div>
          <div class="quotation-field quotation-field-full"><label>Nota</label><textarea rows="2" data-quotation-attachment-field="note" data-quotation-attachment-index="${index}">${U.escapeHtml(item.note || '')}</textarea></div>
          <div class="quotation-field quotation-field-sm"><label>&nbsp;</label><button class="btn secondary" type="button" data-quotation-remove-document="${index}">Rimuovi</button></div>
        </div></article>`).join('')}</div>
      </section>`;
  }

  function activeSession(state) {
    return Workspace?.getActiveSession?.(state) || null;
  }

  function activeSessionId(context) {
    return String(context?.state?.quotationsWorkspace?.activeSessionId || '').trim();
  }

  function renderEditor(state, i18n) {
    const session = activeSession(state);
    if (!session) return '';
    const draft = session.draft || {};
    const activeTab = String(session.tab || 'testata').trim() || 'testata';
    const tabs = [
      ['testata', 'Testata'],
      ['dettaglio', 'Dettaglio'],
      ['documenti', 'Documenti']
    ];
    const body = activeTab === 'dettaglio'
      ? renderDetail(draft, i18n)
      : activeTab === 'documenti'
        ? renderDocuments(draft, i18n)
        : renderTestata(draft, state, i18n);
    return `
      <section class="module-quotations-shell">
        <div class="quotation-tab-strip">${tabs.map(([key, label]) => `<button class="quotation-tab${activeTab === key ? ' active' : ''}" type="button" data-quotation-tab="${U.escapeHtml(key)}">${U.escapeHtml(label)}</button>`).join('')}</div>
        ${body}
      </section>`;
  }

  function render(state, options = {}) {
    const { i18n } = options;
    ensureState(state);
    const selectedPractice = typeof options.getSelectedPractice === 'function' ? options.getSelectedPractice() : null;
    return `
      <div class="stack page-shell module-quotations-shell">
        <section class="hero">
          <div class="hero-meta">KEDRIX ONE · QUOTAZIONI</div>
          <h2>Quotazioni</h2>
          <p>Modulo commerciale-operativo con profili diversi per mare, aerea, terra, ferrovia, agenzia e magazzino.</p>
        </section>
        ${renderLauncher(state, i18n, selectedPractice)}
        ${renderSessionStrip(state, i18n)}
        ${renderEditor(state, i18n)}
        ${renderSavedRecords(state, i18n)}
      </div>`;
  }

  function openBlankQuotation(context, profile = 'generic') {
    const draft = createEmptyDraft(context.state, { serviceProfile: profile });
    Workspace?.openSession?.(context.state, draft, { isDirty: true, tab: 'testata' });
    context.save?.();
    context.render?.();
  }

  function openFromPractice(context, practice) {
    if (!practice) {
      context.toast?.('Seleziona una pratica valida prima di creare la quotazione.', 'warning');
      return;
    }
    const draft = buildDraftFromPractice(context.state, practice);
    Workspace?.openSession?.(context.state, draft, { isDirty: true, tab: 'testata' });
    context.save?.();
    context.render?.();
  }

  function openFromRecord(context, record, duplicate) {
    if (!record) return;
    const draft = safeClone(record.draft || {});
    if (duplicate) {
      draft.editingRecordId = '';
      draft.quotationNumber = Workspace?.nextQuotationNumber?.(context.state) || draft.quotationNumber;
      draft.status = 'draft';
    }
    Workspace?.openSession?.(context.state, draft, { isDirty: Boolean(duplicate), tab: 'testata' });
    context.save?.();
    context.render?.();
  }

  function saveCurrent(context, closeAfterSave = false, queueSend = false) {
    const sessionId = activeSessionId(context);
    if (!sessionId) return null;
    const operator = currentOperatorName(context.state);
    const record = Workspace?.saveRecord?.(context.state, sessionId, { updatedBy: operator }) || null;
    if (!record) return null;
    if (queueSend) {
      Workspace?.queueDispatch?.(context.state, record, { recipient: record.client || '' });
      Feedback?.success?.('Documento salvato e accodato al Centro invii automatici di Kedrix One.');
    } else {
      Feedback?.success?.('Quotazione salvata correttamente.');
    }
    if (closeAfterSave) Workspace?.closeSession?.(context.state, sessionId);
    context.save?.();
    context.render?.();
    return record;
  }

  function buildPrintableHtml(context) {
    const session = activeSession(context.state);
    if (!session) return '';
    const draft = safeClone(session.draft || {});
    const logo = Branding?.logoUrl?.(context.state) || './brand/kedrix-one-mark.svg';
    const companyName = Branding?.companyName?.(context.state) || String(context.state?.companyConfig?.name || 'Kedrix One').trim();
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    const publicRows = rows.filter((row) => String(row.description || row.code || '').trim() || parseNumber(row.revenue)).map((row) => ({
      code: row.code || '',
      description: row.description || '',
      quantity: row.quantity || '',
      price: money(parseNumber(row.revenue) * parseNumber(row.quantity || 1) / Math.max(parseNumber(row.quantity || 1), 1)),
      currency: row.currency || draft.currency || 'EUR'
    }));
    const totalOffered = rows.reduce((sum, row) => sum + parseNumber(row.revenue) * parseNumber(row.quantity || 1), 0);
    const modeDetails = [];
    if (draft.serviceProfile === 'sea') {
      modeDetails.push(['Tipo container', draft.containerType || '—']);
      modeDetails.push(['Dimensione', draft.containerSize || '—']);
      modeDetails.push(['Nave / Viaggio', [draft.vesselName, draft.voyageNumber].filter(Boolean).join(' / ') || '—']);
    }
    if (draft.serviceProfile === 'air') {
      modeDetails.push(['Aeroporti', [draft.airportOrigin, draft.airportDestination].filter(Boolean).join(' → ') || '—']);
      modeDetails.push(['MAWB / HAWB', [draft.mawb, draft.hawb].filter(Boolean).join(' / ') || '—']);
    }
    if (draft.serviceProfile === 'road') {
      modeDetails.push(['Servizio', draft.truckMode || '—']);
      modeDetails.push(['Mezzo', draft.vehicleType || '—']);
    }
    if (draft.serviceProfile === 'warehouse') {
      modeDetails.push(['Deposito', draft.warehouseSite || '—']);
      modeDetails.push(['Giacenza', draft.storageDays || '—']);
    }
    return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>${U.escapeHtml(draft.quotationNumber || 'Quotazione')}</title>
<style>
body{font-family:Arial,sans-serif;padding:28px;color:#0f1720} 
.header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #d7e2ec;padding-bottom:16px;margin-bottom:22px;min-height:92px}
.logo{width:64px;height:64px;object-fit:contain}
.company{font-size:24px;font-weight:700}
.sub{font-size:12px;color:#4a5b6b;text-transform:uppercase;letter-spacing:.12em}
.doc-title{margin:0;font-size:26px}
.doc-meta{margin:4px 0 0;color:#516171}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:18px}
.card{border:1px solid #d7e2ec;border-radius:12px;padding:12px}
.card strong{display:block;margin-bottom:4px;color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.section{margin-top:18px}
.section h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#334155;margin:0 0 8px}
table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #d7e2ec;padding:8px;font-size:12px;text-align:left}th{background:#f2f6fa}
.total{margin-top:12px;text-align:right;font-size:15px;font-weight:700}
.note{border:1px solid #d7e2ec;border-radius:12px;padding:12px;white-space:pre-wrap}
</style></head><body>
<div class="header"><img class="logo" src="${U.escapeHtml(logo)}" alt="${U.escapeHtml(companyName)}"><div><div class="sub">Kedrix One · Quotazioni</div><div class="company">${U.escapeHtml(companyName)}</div><h1 class="doc-title">${U.escapeHtml(draft.quotationNumber || 'Quotazione')}</h1><div class="doc-meta">${U.escapeHtml(draft.title || '')}</div></div></div>
<div class="grid">
  <div class="card"><strong>Cliente</strong><div>${U.escapeHtml(draft.client || '—')}</div></div>
  <div class="card"><strong>Profilo</strong><div>${U.escapeHtml(serviceProfileLabel(draft.serviceProfile))}</div></div>
  <div class="card"><strong>Valida dal</strong><div>${U.escapeHtml(draft.validFrom || '—')}</div></div>
  <div class="card"><strong>Valida a</strong><div>${U.escapeHtml(draft.validTo || '—')}</div></div>
  <div class="card"><strong>Origine / Destinazione</strong><div>${U.escapeHtml([draft.origin, draft.destination].filter(Boolean).join(' → ') || '—')}</div></div>
  <div class="card"><strong>Resa / Pagamento</strong><div>${U.escapeHtml([draft.incoterm, draft.paymentTerms].filter(Boolean).join(' · ') || '—')}</div></div>
  ${modeDetails.map(([label, value]) => `<div class="card"><strong>${U.escapeHtml(label)}</strong><div>${U.escapeHtml(value)}</div></div>`).join('')}
</div>
<div class="section"><h2>Dettaglio offerta</h2><table><thead><tr><th>Codice</th><th>Descrizione</th><th>Q.tà</th><th>Prezzo offerto</th><th>Valuta</th></tr></thead><tbody>${publicRows.map((row) => `<tr><td>${U.escapeHtml(row.code)}</td><td>${U.escapeHtml(row.description)}</td><td>${U.escapeHtml(row.quantity)}</td><td>${U.escapeHtml(row.price)}</td><td>${U.escapeHtml(row.currency)}</td></tr>`).join('')}</tbody></table><div class="total">Totale offerta: ${U.escapeHtml(money(totalOffered))} ${U.escapeHtml(draft.currency || 'EUR')}</div></div>
${draft.note ? `<div class="section"><h2>Note</h2><div class="note">${U.escapeHtml(draft.note)}</div></div>` : ''}
</body></html>`;
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
      if (newButton) return openBlankQuotation(context);

      const activeButton = event.target.closest('[data-quotation-open-active]');
      if (activeButton) {
        const practice = typeof context.getSelectedPractice === 'function' ? context.getSelectedPractice() : null;
        return openFromPractice(context, practice);
      }

      const practiceButton = event.target.closest('[data-quotation-open-practice]');
      if (practiceButton) {
        const practiceId = String(practiceButton.dataset.quotationOpenPractice || '').trim();
        const practice = (context.state?.practices || []).find((entry) => String(entry?.id || '').trim() === practiceId) || null;
        return openFromPractice(context, practice);
      }

      const openRecordButton = event.target.closest('[data-quotation-open-record]');
      if (openRecordButton) {
        const recordId = String(openRecordButton.dataset.quotationOpenRecord || '').trim();
        const record = (context.state?.quotationRecords || []).find((entry) => String(entry?.id || '').trim() === recordId) || null;
        return openFromRecord(context, record, false);
      }

      const duplicateRecordButton = event.target.closest('[data-quotation-duplicate-record]');
      if (duplicateRecordButton) {
        const recordId = String(duplicateRecordButton.dataset.quotationDuplicateRecord || '').trim();
        const record = (context.state?.quotationRecords || []).find((entry) => String(entry?.id || '').trim() === recordId) || null;
        return openFromRecord(context, record, true);
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
        const nextProfile = String(profileButton.dataset.quotationProfile || 'generic').trim() || 'generic';
        const session = activeSession(context.state);
        if (session) {
          const preserved = safeClone(session.draft || {});
          session.draft = safeClone({ ...emptySpecificProfile(nextProfile), ...preserved, serviceProfile: nextProfile });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const addLineButton = event.target.closest('[data-quotation-add-line]');
      if (addLineButton) {
        const session = activeSession(context.state);
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
        const session = activeSession(context.state);
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
        const session = activeSession(context.state);
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
        const session = activeSession(context.state);
        if (session && Number.isInteger(index)) {
          session.draft.attachments.splice(index, 1);
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      if (event.target.closest('[data-quotation-save]')) return void saveCurrent(context, false, false);
      if (event.target.closest('[data-quotation-save-close]')) return void saveCurrent(context, true, false);
      if (event.target.closest('[data-quotation-save-send]')) return void saveCurrent(context, false, true);
      if (event.target.closest('[data-quotation-print]')) return void printCurrent(context);
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
        const session = activeSession(context.state);
        if (session) {
          session.draft[fieldName] = field.value;
          session.isDirty = true;
          context.save?.();
        }
        return;
      }

      const lineField = event.target.closest('[data-quotation-line-field]');
      if (lineField) {
        const index = Number(lineField.dataset.quotationLineIndex);
        const fieldName = String(lineField.dataset.quotationLineField || '').trim();
        const session = activeSession(context.state);
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
        const session = activeSession(context.state);
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
