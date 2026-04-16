window.KedrixOneQuotationsModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneQuotationsWorkspace || null;
  const Feedback = window.KedrixOneAppFeedback || null;

  const SERVICE_PROFILES = [
    { value: 'generic', label: 'Generica' },
    { value: 'sea', label: 'Mare' },
    { value: 'air', label: 'Aerea' },
    { value: 'rail', label: 'Ferrovia' },
    { value: 'road', label: 'Terra' },
    { value: 'agency', label: 'Agenzia' },
    { value: 'warehouse', label: 'Magazzino' }
  ];

  const STATUS_OPTIONS = [
    { value: 'draft', label: 'Bozza' },
    { value: 'active', label: 'Attiva' },
    { value: 'expired', label: 'Scaduta' },
    { value: 'archived', label: 'Archiviata' }
  ];

  const MOVEMENT_OPTIONS = [
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' },
    { value: 'domestic', label: 'Nazionalе' },
    { value: 'cross-trade', label: 'Cross trade' }
  ];

  const DOCUMENT_CATEGORY_OPTIONS = [
    { value: 'quotation', label: 'Quotazione' },
    { value: 'supplier-offer', label: 'Offerta fornitore' },
    { value: 'tariff-sheet', label: 'Tariffario' },
    { value: 'customer-mail', label: 'Email cliente' },
    { value: 'annex', label: 'Allegato' }
  ];

  const LINE_CALCULATION_OPTIONS = [
    { value: 'fixed', label: 'Fisso' },
    { value: 'per-package', label: 'Per collo' },
    { value: 'per-weight', label: 'Per peso' },
    { value: 'per-volume', label: 'Per volume' },
    { value: 'per-shipment', label: 'Per spedizione' }
  ];

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function toNumber(value) {
    const normalized = String(value ?? '').replace(',', '.').trim();
    if (!normalized) return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatNumber(value, digits = 2) {
    const number = Number(value || 0);
    return number.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function profileLabel(profile) {
    const match = SERVICE_PROFILES.find((item) => item.value === String(profile || '').trim());
    return match ? match.label : 'Generica';
  }

  function statusLabel(status) {
    const match = STATUS_OPTIONS.find((item) => item.value === String(status || '').trim());
    return match ? match.label : 'Bozza';
  }

  function currencies(state) {
    const values = state?.companyConfig?.practiceConfig?.directories?.currencies;
    return Array.isArray(values) && values.length ? values : ['EUR', 'USD', 'GBP'];
  }

  function incotermOptions(state) {
    const profiles = state?.companyConfig?.practiceConfig?.incotermProfiles || {};
    const merged = Array.from(new Set(Object.values(profiles).flat().filter(Boolean)));
    return merged.length ? merged : ['EXW', 'FCA', 'FOB', 'CPT', 'DAP', 'DDP'];
  }

  function supplierOptions(state) {
    const values = state?.companyConfig?.practiceConfig?.directories?.suppliers;
    return Array.isArray(values) && values.length ? values : [];
  }

  function carrierOptions(state) {
    const base = state?.companyConfig?.practiceConfig?.directories || {};
    const merged = Array.from(new Set([
      ...(Array.isArray(base.shippingCompanies) ? base.shippingCompanies : []),
      ...(Array.isArray(base.airlines) ? base.airlines : []),
      ...(Array.isArray(base.carriers) ? base.carriers : [])
    ].filter(Boolean)));
    return merged;
  }

  function paymentTermsOptions() {
    return ['Anticipato', '30 gg d.f.', '60 gg d.f.', 'Alla partenza', 'Alla consegna'];
  }

  function goodsTypeOptions() {
    return ['Merce generale', 'Merce pericolosa', 'Project cargo', 'FTL / LTL', 'FCL', 'LCL', 'Aereo'];
  }

  function currentOperatorName(state) {
    const activeUserId = String(state?.activeUserId || '').trim();
    const user = (state?.users || []).find((entry) => String(entry?.id || '').trim() === activeUserId) || null;
    return String(user?.name || '').trim();
  }

  function nextQuoteNumber(state) {
    const year = new Date().getFullYear();
    const allNumbers = [];
    (state?.quotationRecords || []).forEach((record) => allNumbers.push(String(record?.quoteNumber || '')));
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    sessions.forEach((session) => allNumbers.push(String(session?.draft?.quoteNumber || '')));
    let max = 0;
    allNumbers.forEach((value) => {
      const match = value.match(/Q-(\d{4})-(\d{4,})$/i);
      if (!match) return;
      if (Number(match[1]) !== year) return;
      max = Math.max(max, Number(match[2]));
    });
    return `Q-${year}-${String(max + 1).padStart(4, '0')}`;
  }

  function ensureState(state) {
    if (!Workspace || typeof Workspace.ensureState !== 'function') return null;
    Workspace.ensureState(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!Array.isArray(state.quotationRecords)) state.quotationRecords = [];
    if (!state.quotationsModule || typeof state.quotationsModule !== 'object') {
      state.quotationsModule = {
        quickFilter: '',
        statusFilter: 'all',
        profileFilter: 'all',
        clientFilter: '',
        validOn: ''
      };
    }
    return state.quotationsWorkspace;
  }

  function createEmptyDraft(state, overrides = {}) {
    return Workspace.cloneDraft({
      editingRecordId: '',
      quoteNumber: nextQuoteNumber(state),
      linkedPracticeId: '',
      linkedPracticeReference: '',
      linkedPracticeType: '',
      status: 'draft',
      serviceProfile: 'generic',
      movementType: 'export',
      description: '',
      code: '',
      issueDate: today(),
      validFrom: today(),
      validUntil: '',
      clientId: '',
      clientName: '',
      prospect: '',
      contactPerson: '',
      importerExporter: '',
      carrier: '',
      paymentTerms: '',
      incoterm: '',
      origin: '',
      destination: '',
      loadingPort: '',
      dischargePort: '',
      pickupLocation: '',
      deliveryLocation: '',
      goodsType: '',
      dangerousGoods: 'no',
      packageCount: '',
      packageType: '',
      dimensions: '',
      stackable: 'yes',
      grossWeight: '',
      netWeight: '',
      volume: '',
      chargeableWeight: '',
      cargoValue: '',
      currency: 'EUR',
      customerNotes: '',
      internalNotes: `Preparata da ${currentOperatorName(state)}`.trim(),
      lineItems: [Workspace.defaultLineItem()],
      documents: [],
      createdAt: '',
      updatedAt: '',
      ...overrides
    });
  }

  function buildDraftFromPractice(state, practice) {
    const dynamic = practice?.dynamicData || {};
    const type = String(practice?.practiceType || '').toLowerCase();
    let profile = 'generic';
    if (type.includes('mare') || type.includes('sea')) profile = 'sea';
    else if (type.includes('aereo') || type.includes('air')) profile = 'air';
    else if (type.includes('ferro')) profile = 'rail';
    else if (type.includes('terra') || type.includes('road')) profile = 'road';

    return createEmptyDraft(state, {
      linkedPracticeId: String(practice?.id || '').trim(),
      linkedPracticeReference: String(practice?.reference || '').trim(),
      linkedPracticeType: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
      serviceProfile: profile,
      movementType: String(dynamic.direction || dynamic.movementDirection || 'export').trim().toLowerCase() || 'export',
      description: String(dynamic.goodsDescription || practice?.reference || '').trim(),
      issueDate: today(),
      validFrom: today(),
      validUntil: '',
      clientId: String(practice?.clientId || '').trim(),
      clientName: String(practice?.clientName || practice?.client || '').trim(),
      importerExporter: String(dynamic.importer || dynamic.exporter || dynamic.senderParty || '').trim(),
      carrier: String(dynamic.shippingCompany || dynamic.airline || dynamic.carrier || '').trim(),
      incoterm: String(dynamic.incoterm || '').trim(),
      origin: String(dynamic.originNode || dynamic.originDirectory || dynamic.origin || '').trim(),
      destination: String(dynamic.destinationNode || dynamic.destinationDirectory || dynamic.destination || '').trim(),
      loadingPort: String(dynamic.loadingPort || dynamic.originPort || '').trim(),
      dischargePort: String(dynamic.unloadingPort || dynamic.destinationPort || '').trim(),
      pickupLocation: String(dynamic.pickupLocation || dynamic.deposit || '').trim(),
      deliveryLocation: String(dynamic.deliveryLocation || dynamic.consignee || '').trim(),
      goodsType: String(dynamic.goodsDescription || '').trim(),
      dangerousGoods: /^(1|true|yes|si|sì)$/i.test(String(dynamic.dangerousGoods || '').trim()) ? 'yes' : 'no',
      packageCount: String(dynamic.packageCount || '').trim(),
      packageType: String(dynamic.packageType || dynamic.packageNature || '').trim(),
      grossWeight: String(dynamic.grossWeight || '').trim(),
      netWeight: String(dynamic.netWeight || '').trim(),
      volume: String(dynamic.volume || '').trim(),
      chargeableWeight: String(dynamic.chargeableWeight || '').trim(),
      cargoValue: String(dynamic.invoiceAmount || '').trim(),
      currency: String(dynamic.invoiceCurrency || 'EUR').trim() || 'EUR',
      customerNotes: String(dynamic.customerInstructions || '').trim(),
      lineItems: [Workspace.defaultLineItem({
        description: String(dynamic.goodsDescription || 'Voce principale').trim() || 'Voce principale',
        supplier: String(dynamic.shippingCompany || dynamic.airline || dynamic.carrier || '').trim(),
        currency: String(dynamic.invoiceCurrency || 'EUR').trim() || 'EUR'
      })]
    });
  }

  function computeDerivedStatus(record) {
    const explicit = String(record?.status || '').trim();
    if (explicit === 'archived') return 'archived';
    const validUntil = String(record?.validUntil || '').trim();
    if (validUntil && validUntil < today()) return 'expired';
    if (explicit === 'active') return 'active';
    return explicit || 'draft';
  }

  function computeTotals(draft) {
    const lineItems = Array.isArray(draft?.lineItems) ? draft.lineItems : [];
    const totalCost = lineItems.reduce((sum, item) => sum + (toNumber(item.costAmount) * Math.max(toNumber(item.quantity), 1)), 0);
    const totalRevenue = lineItems.reduce((sum, item) => sum + (toNumber(item.sellAmount) * Math.max(toNumber(item.quantity), 1)), 0);
    const margin = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;
    return { totalCost, totalRevenue, margin, marginPct };
  }

  function buildKpis(state) {
    const records = Array.isArray(state?.quotationRecords) ? state.quotationRecords : [];
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const activeQuotes = records.filter((record) => computeDerivedStatus(record) === 'active').length;
    const estimatedMargin = records.reduce((sum, record) => sum + computeTotals(record).margin, 0);
    return {
      records: records.length,
      openMasks: sessions.length,
      activeQuotes,
      estimatedMargin
    };
  }

  function filteredRecords(state) {
    const filters = state?.quotationsModule || {};
    const quick = String(filters.quickFilter || '').trim().toLowerCase();
    const statusFilter = String(filters.statusFilter || 'all').trim();
    const profileFilter = String(filters.profileFilter || 'all').trim();
    const clientFilter = String(filters.clientFilter || '').trim().toLowerCase();
    const validOn = String(filters.validOn || '').trim();

    return (state?.quotationRecords || [])
      .slice()
      .filter((record) => {
        const derivedStatus = computeDerivedStatus(record);
        if (statusFilter !== 'all' && derivedStatus !== statusFilter) return false;
        if (profileFilter !== 'all' && String(record?.serviceProfile || '').trim() !== profileFilter) return false;
        if (clientFilter && !String(record?.clientName || '').toLowerCase().includes(clientFilter)) return false;
        if (validOn) {
          const from = String(record?.validFrom || '').trim();
          const to = String(record?.validUntil || '').trim();
          if (from && validOn < from) return false;
          if (to && validOn > to) return false;
        }
        if (!quick) return true;
        const haystack = [
          record?.quoteNumber,
          record?.description,
          record?.clientName,
          record?.prospect,
          record?.linkedPracticeReference,
          record?.origin,
          record?.destination,
          record?.loadingPort,
          record?.dischargePort,
          record?.carrier
        ].map((value) => String(value || '').toLowerCase()).join(' ');
        return haystack.includes(quick);
      })
      .sort((a, b) => String(b?.updatedAt || b?.createdAt || '').localeCompare(String(a?.updatedAt || a?.createdAt || '')));
  }

  function fieldClass(name, options = {}) {
    if (options.full) return 'quote-col-4';
    const key = String(name || '').trim();
    const xs = new Set(['issueDate', 'validFrom', 'validUntil', 'status', 'serviceProfile', 'movementType', 'dangerousGoods', 'stackable', 'currency']);
    const sm = new Set(['code', 'packageCount', 'packageType', 'grossWeight', 'netWeight', 'volume', 'chargeableWeight', 'cargoValue']);
    const md = new Set(['incoterm', 'loadingPort', 'dischargePort', 'paymentTerms', 'carrier', 'contactPerson']);
    const lg = new Set(['clientName', 'prospect', 'description', 'origin', 'destination', 'pickupLocation', 'deliveryLocation', 'importerExporter', 'goodsType']);
    if (xs.has(key)) return 'quote-col-1';
    if (sm.has(key)) return 'quote-col-1';
    if (md.has(key)) return 'quote-col-2';
    if (lg.has(key)) return 'quote-col-2';
    return 'quote-col-2';
  }

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const rows = Number(options.rows || 4);
    const items = Array.isArray(options.items) ? options.items : [];
    const disabled = options.disabled ? ' disabled' : '';
    const readonly = options.readonly ? ' readonly' : '';
    const placeholder = U.escapeHtml(options.placeholder || '');
    const fieldClassName = fieldClass(name, options);
    const wrapperClass = `field quotation-field ${fieldClassName}`;
    const id = `qt-${U.escapeHtml(name)}`;
    const attrs = `id="${id}" data-quotation-field="${U.escapeHtml(name)}"${disabled}${readonly}`;

    if (type === 'textarea') {
      return `<div class="${wrapperClass}"><label for="${id}">${U.escapeHtml(label)}</label><textarea ${attrs} rows="${rows}" placeholder="${placeholder}">${U.escapeHtml(value || '')}</textarea></div>`;
    }

    if (type === 'select') {
      return `<div class="${wrapperClass}"><label for="${id}">${U.escapeHtml(label)}</label><select ${attrs}>${items.map((item) => {
        const itemValue = String(item?.value ?? item ?? '');
        const itemLabel = String(item?.label ?? itemValue);
        const selected = itemValue === String(value ?? '') ? ' selected' : '';
        return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(itemLabel)}</option>`;
      }).join('')}</select></div>`;
    }

    return `<div class="${wrapperClass}"><label for="${id}">${U.escapeHtml(label)}</label><input ${attrs} type="${U.escapeHtml(type)}" value="${U.escapeHtml(value || '')}" placeholder="${placeholder}"></div>`;
  }

  function renderHero(i18n) {
    return `
      <section class="hero">
        <div class="hero-meta">${U.escapeHtml(i18n?.t('ui.quotationsEyebrow', 'COMMERCIALE · QUOTAZIONI'))}</div>
        <h2>${U.escapeHtml(i18n?.t('quotations', 'Quotazioni'))}</h2>
        <p>${U.escapeHtml(i18n?.t('ui.quotationsIntro', 'Workspace commerciale Kedrix per offerte multi-servizio, dettaglio costi/ricavi e documenti collegati.'))}</p>
      </section>`;
  }

  function renderKpis(state, i18n) {
    const kpis = buildKpis(state);
    return `
      <section class="three-col quotations-kpis">
        <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.savedQuotes', 'Quotazioni salvate'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.records))}</div></div>
        <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.openMasks))}</div></div>
        <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.estimatedMargin', 'Margine stimato'))}</span><div class="summary-value">${U.escapeHtml(formatNumber(kpis.estimatedMargin))}</div></div>
      </section>`;
  }

  function renderLauncher(state, i18n, selectedPractice) {
    const filters = state?.quotationsModule || {};
    const profiles = [{ value: 'all', label: 'Tutti' }, ...SERVICE_PROFILES];
    const records = filteredRecords(state);
    return `
      <section class="quotations-shell">
        <aside class="panel quotations-filter-rail">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.quoteControlDesk', 'Control desk'))}</h3>
              <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quoteControlDeskHint', 'Filtri rapidi e apertura nuove maschere senza dispersione di spazio.'))}</p>
            </div>
          </div>
          <div class="quotations-filter-stack">
            <div class="field full">
              <label for="quotationQuickFilter">${U.escapeHtml(i18n?.t('ui.search', 'Cerca'))}</label>
              <input id="quotationQuickFilter" type="search" data-quotation-filter="quickFilter" value="${U.escapeHtml(filters.quickFilter || '')}" placeholder="${U.escapeHtml(i18n?.t('ui.quoteSearchPlaceholder', 'Numero, cliente, descrizione, porto...'))}" />
            </div>
            <div class="field full">
              <label for="quotationStatusFilter">${U.escapeHtml(i18n?.t('ui.status', 'Stato'))}</label>
              <select id="quotationStatusFilter" data-quotation-filter="statusFilter">
                <option value="all"${String(filters.statusFilter || 'all') === 'all' ? ' selected' : ''}>${U.escapeHtml(i18n?.t('ui.all', 'Tutti'))}</option>
                ${STATUS_OPTIONS.map((item) => `<option value="${U.escapeHtml(item.value)}"${item.value === String(filters.statusFilter || '') ? ' selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}
              </select>
            </div>
            <div class="field full">
              <label for="quotationValidOn">${U.escapeHtml(i18n?.t('ui.validOn', 'Valida il'))}</label>
              <input id="quotationValidOn" type="date" data-quotation-filter="validOn" value="${U.escapeHtml(filters.validOn || '')}" />
            </div>
            <div class="field full">
              <label for="quotationClientFilter">${U.escapeHtml(i18n?.t('ui.clientRequired', 'Cliente'))}</label>
              <input id="quotationClientFilter" type="text" data-quotation-filter="clientFilter" value="${U.escapeHtml(filters.clientFilter || '')}" placeholder="Cliente / Prospect" />
            </div>
            <div class="quotations-profile-pills">
              ${profiles.map((item) => `<button class="tag-pill${String(filters.profileFilter || 'all') === item.value ? ' active' : ''}" type="button" data-quotation-profile-filter="${U.escapeHtml(item.value)}">${U.escapeHtml(item.label)}</button>`).join('')}
            </div>
            <div class="quotations-launch-actions">
              <button class="btn" type="button" data-quotation-new>${U.escapeHtml(i18n?.t('ui.newQuotation', 'Nuova quotazione'))}</button>
              ${selectedPractice ? `<button class="btn secondary" type="button" data-quotation-new-from-practice>${U.escapeHtml(i18n?.t('ui.fromActivePractice', 'Da pratica attiva'))}</button>` : ''}
            </div>
            <div class="quotations-filter-footnote">${U.escapeHtml(`${records.length} ${records.length === 1 ? 'quotazione visibile' : 'quotazioni visibili'}`)}</div>
          </div>
        </aside>
        <section class="panel quotations-list-panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.quotationList', 'Elenco quotazioni'))}</h3>
              <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationListHint', 'Vista operativa compatta: stato, validità, profilo servizio e margine.'))}</p>
            </div>
          </div>
          ${renderRecordsTable(state, i18n)}
        </section>
      </section>`;
  }

  function renderRecordsTable(state, i18n) {
    const records = filteredRecords(state);
    if (!records.length) {
      return `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noQuotesYet', 'Nessuna quotazione salvata. Apri una nuova maschera per iniziare.'))}</div>`;
    }
    return `
      <div class="quotations-table-wrap">
        <table class="quotations-table">
          <thead>
            <tr>
              <th>${U.escapeHtml(i18n?.t('ui.generatedNumber', 'Numero'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.clientRequired', 'Cliente'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.description', 'Descrizione'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.issueDate', 'Emissione'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.validUntil', 'Valida fino'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.profile', 'Profilo'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.status', 'Stato'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.margin', 'Margine'))}</th>
              <th>${U.escapeHtml(i18n?.t('ui.actions', 'Azioni'))}</th>
            </tr>
          </thead>
          <tbody>
            ${records.map((record) => {
              const derivedStatus = computeDerivedStatus(record);
              const totals = computeTotals(record);
              return `<tr>
                <td><strong>${U.escapeHtml(record.quoteNumber || '—')}</strong></td>
                <td>${U.escapeHtml(record.clientName || record.prospect || '—')}</td>
                <td>${U.escapeHtml(record.description || '—')}</td>
                <td>${U.escapeHtml(record.issueDate || '—')}</td>
                <td>${U.escapeHtml(record.validUntil || '—')}</td>
                <td><span class="quotation-badge quotation-profile-${U.escapeHtml(record.serviceProfile || 'generic')}">${U.escapeHtml(profileLabel(record.serviceProfile))}</span></td>
                <td><span class="quotation-badge quotation-status-${U.escapeHtml(derivedStatus)}">${U.escapeHtml(statusLabel(derivedStatus))}</span></td>
                <td>${U.escapeHtml(formatNumber(totals.margin))}</td>
                <td>
                  <div class="action-row quotations-row-actions">
                    <button class="btn secondary small" type="button" data-quotation-open-record="${U.escapeHtml(record.id)}">${U.escapeHtml(i18n?.t('ui.open', 'Apri'))}</button>
                    <button class="btn secondary small" type="button" data-quotation-duplicate-record="${U.escapeHtml(record.id)}">${U.escapeHtml(i18n?.t('ui.duplicate', 'Duplica'))}</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const activeId = String(state?.quotationsWorkspace?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel quotations-session-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quoteSessionHint', 'Più quotazioni possono restare aperte contemporaneamente per confronto e compilazione parallela.'))}</p>
          </div>
        </div>
        <div class="quotation-session-strip">
          ${sessions.map((session) => {
            const draft = session.draft || {};
            const isActive = session.id === activeId;
            return `<div class="quotation-session-chip${isActive ? ' active' : ''}">
              <button class="quotation-session-main" type="button" data-quotation-session-switch="${U.escapeHtml(session.id)}">
                <strong>${U.escapeHtml(draft.quoteNumber || 'Nuova')}</strong>
                <span>${U.escapeHtml(draft.clientName || draft.prospect || '—')}</span>
                <em>${session.isDirty ? '• ' : ''}${U.escapeHtml(draft.description || profileLabel(draft.serviceProfile))}</em>
              </button>
              <button class="quotation-session-close" type="button" data-quotation-session-close="${U.escapeHtml(session.id)}" aria-label="${U.escapeHtml(i18n?.t('ui.closeMask', 'Chiudi maschera'))}">×</button>
            </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  function renderSummaryPills(draft, i18n) {
    const totals = computeTotals(draft);
    const items = [
      [i18n?.t('ui.generatedNumber', 'Numero'), draft.quoteNumber || '—'],
      [i18n?.t('ui.clientRequired', 'Cliente'), draft.clientName || draft.prospect || '—'],
      [i18n?.t('ui.profile', 'Profilo'), profileLabel(draft.serviceProfile)],
      [i18n?.t('ui.margin', 'Margine'), formatNumber(totals.margin)]
    ];
    return `<div class="tag-grid quotations-summary-pills">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderHeaderTab(state, draft, i18n) {
    return `
      <div class="quotations-editor-body">
        ${renderSummaryPills(draft, i18n)}
        <section class="panel quotations-editor-section">
          <div class="panel-head compact-head">
            <div>
              <h4 class="panel-title">${U.escapeHtml(i18n?.t('ui.linkedPractice', 'Pratica collegata'))}</h4>
              <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.linkedPracticeHint', 'Ponte operativo verso Pratiche e storico documentale.'))}</p>
            </div>
          </div>
          <div class="quotations-linked-practice-card">
            <div><strong>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</strong><span>${U.escapeHtml(draft.linkedPracticeReference || '—')}</span></div>
            <div><strong>${U.escapeHtml(i18n?.t('ui.practiceType', 'Tipo pratica'))}</strong><span>${U.escapeHtml(draft.linkedPracticeType || '—')}</span></div>
            <div><strong>${U.escapeHtml(i18n?.t('ui.clientRequired', 'Cliente'))}</strong><span>${U.escapeHtml(draft.clientName || '—')}</span></div>
          </div>
        </section>
        <section class="panel quotations-editor-section">
          <div class="panel-head compact-head"><div><h4 class="panel-title">Testata</h4><p class="panel-subtitle">Identità offerta, validità e soggetti commerciali.</p></div></div>
          <div class="quotations-form-grid">
            ${renderField('Numero quotazione', 'quoteNumber', draft.quoteNumber, { readonly: true })}
            ${renderField('Emissione', 'issueDate', draft.issueDate, { type: 'date' })}
            ${renderField('Valida dal', 'validFrom', draft.validFrom, { type: 'date' })}
            ${renderField('Valida fino', 'validUntil', draft.validUntil, { type: 'date' })}
            ${renderField('Stato', 'status', draft.status, { type: 'select', items: STATUS_OPTIONS })}
            ${renderField('Profilo servizio', 'serviceProfile', draft.serviceProfile, { type: 'select', items: SERVICE_PROFILES })}
            ${renderField('Movimento', 'movementType', draft.movementType, { type: 'select', items: MOVEMENT_OPTIONS })}
            ${renderField('Codice', 'code', draft.code)}
            ${renderField('Descrizione offerta', 'description', draft.description, { full: true })}
            ${renderField('Cliente', 'clientName', draft.clientName)}
            ${renderField('Prospect', 'prospect', draft.prospect)}
            ${renderField('Persona di riferimento', 'contactPerson', draft.contactPerson)}
            ${renderField('Importatore / Esportatore', 'importerExporter', draft.importerExporter)}
            ${renderField('Compagnia / Vettore', 'carrier', draft.carrier, { type: 'select', items: [{ value: '', label: 'Seleziona' }, ...carrierOptions(state).map((item) => ({ value: item, label: item }))] })}
            ${renderField('Condizioni di pagamento', 'paymentTerms', draft.paymentTerms, { type: 'select', items: [{ value: '', label: 'Seleziona' }, ...paymentTermsOptions().map((item) => ({ value: item, label: item }))] })}
            ${renderField('Resa', 'incoterm', draft.incoterm, { type: 'select', items: [{ value: '', label: 'Seleziona' }, ...incotermOptions(state).map((item) => ({ value: item, label: item }))] })}
          </div>
        </section>
        <section class="panel quotations-editor-section">
          <div class="panel-head compact-head"><div><h4 class="panel-title">Servizio e merce</h4><p class="panel-subtitle">Spazio ottimizzato sulle sole informazioni operative utili alla quotazione.</p></div></div>
          <div class="quotations-form-grid">
            ${renderField('Origine', 'origin', draft.origin)}
            ${renderField('Destinazione', 'destination', draft.destination)}
            ${renderField('Porto / Aeroporto imbarco', 'loadingPort', draft.loadingPort)}
            ${renderField('Porto / Aeroporto sbarco', 'dischargePort', draft.dischargePort)}
            ${renderField('Ritiro', 'pickupLocation', draft.pickupLocation)}
            ${renderField('Consegna', 'deliveryLocation', draft.deliveryLocation)}
            ${renderField('Tipologia merce', 'goodsType', draft.goodsType, { type: 'select', items: [{ value: '', label: 'Seleziona' }, ...goodsTypeOptions().map((item) => ({ value: item, label: item }))] })}
            ${renderField('Merce pericolosa', 'dangerousGoods', draft.dangerousGoods, { type: 'select', items: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Sì' }] })}
            ${renderField('Colli', 'packageCount', draft.packageCount, { type: 'number' })}
            ${renderField('Tipo colli', 'packageType', draft.packageType)}
            ${renderField('Dimensioni', 'dimensions', draft.dimensions, { placeholder: 'L x W x H cm' })}
            ${renderField('Sovrapponibile', 'stackable', draft.stackable, { type: 'select', items: [{ value: 'yes', label: 'Sì' }, { value: 'no', label: 'No' }] })}
            ${renderField('Peso lordo', 'grossWeight', draft.grossWeight, { type: 'number' })}
            ${renderField('Peso netto', 'netWeight', draft.netWeight, { type: 'number' })}
            ${renderField('Volume', 'volume', draft.volume, { type: 'number' })}
            ${renderField('Peso tassabile', 'chargeableWeight', draft.chargeableWeight, { type: 'number' })}
            ${renderField('Valore merce', 'cargoValue', draft.cargoValue, { type: 'number' })}
            ${renderField('Valuta', 'currency', draft.currency, { type: 'select', items: currencies(state).map((item) => ({ value: item, label: item })) })}
            ${renderField('Nota cliente', 'customerNotes', draft.customerNotes, { type: 'textarea', rows: 4, full: true })}
            ${renderField('Nota interna', 'internalNotes', draft.internalNotes, { type: 'textarea', rows: 4, full: true })}
          </div>
        </section>
      </div>`;
  }

  function renderDetailTab(state, draft, i18n) {
    const totals = computeTotals(draft);
    const currency = draft.currency || 'EUR';
    const suppliers = supplierOptions(state);
    const lines = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <div class="quotations-editor-body">
        <section class="panel quotations-editor-section">
          <div class="panel-head compact-head">
            <div>
              <h4 class="panel-title">Dettaglio economico</h4>
              <p class="panel-subtitle">Costi fornitore, prezzo cliente e marginalità interna nella stessa griglia compatta.</p>
            </div>
            <div class="action-row">
              <button class="btn secondary" type="button" data-quotation-add-line>${U.escapeHtml(i18n?.t('ui.addLine', 'Aggiungi riga'))}</button>
            </div>
          </div>
          <div class="quotations-lines-wrap">
            <table class="quotations-lines-table">
              <thead>
                <tr>
                  <th>Codice</th>
                  <th>Descrizione</th>
                  <th>Calcolo</th>
                  <th>Q.tà</th>
                  <th>U.M.</th>
                  <th>Fornitore</th>
                  <th>Costo</th>
                  <th>Ricavo</th>
                  <th>Valuta</th>
                  <th>IVA</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${lines.map((line, index) => `<tr>
                  <td><input type="text" value="${U.escapeHtml(line.code || '')}" data-quotation-line-field="code" data-quotation-line-index="${index}" /></td>
                  <td><input type="text" value="${U.escapeHtml(line.description || '')}" data-quotation-line-field="description" data-quotation-line-index="${index}" /></td>
                  <td><select data-quotation-line-field="calculationType" data-quotation-line-index="${index}">${LINE_CALCULATION_OPTIONS.map((item) => `<option value="${U.escapeHtml(item.value)}"${item.value === String(line.calculationType || '') ? ' selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}</select></td>
                  <td><input type="number" step="0.01" value="${U.escapeHtml(line.quantity || '')}" data-quotation-line-field="quantity" data-quotation-line-index="${index}" /></td>
                  <td><input type="text" value="${U.escapeHtml(line.unit || '')}" data-quotation-line-field="unit" data-quotation-line-index="${index}" /></td>
                  <td><select data-quotation-line-field="supplier" data-quotation-line-index="${index}"><option value="">Seleziona</option>${suppliers.map((item) => `<option value="${U.escapeHtml(item)}"${item === String(line.supplier || '') ? ' selected' : ''}>${U.escapeHtml(item)}</option>`).join('')}</select></td>
                  <td><input type="number" step="0.01" value="${U.escapeHtml(line.costAmount || '')}" data-quotation-line-field="costAmount" data-quotation-line-index="${index}" /></td>
                  <td><input type="number" step="0.01" value="${U.escapeHtml(line.sellAmount || '')}" data-quotation-line-field="sellAmount" data-quotation-line-index="${index}" /></td>
                  <td><select data-quotation-line-field="currency" data-quotation-line-index="${index}">${currencies(state).map((item) => `<option value="${U.escapeHtml(item)}"${item === String(line.currency || currency) ? ' selected' : ''}>${U.escapeHtml(item)}</option>`).join('')}</select></td>
                  <td><input type="number" step="0.01" value="${U.escapeHtml(line.vat || '')}" data-quotation-line-field="vat" data-quotation-line-index="${index}" /></td>
                  <td><input type="text" value="${U.escapeHtml(line.note || '')}" data-quotation-line-field="note" data-quotation-line-index="${index}" /></td>
                  <td><button class="btn secondary small" type="button" data-quotation-remove-line="${index}">×</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="quotations-totals-bar">
            <div class="stack-item"><span>Totale costi</span><div class="summary-value">${U.escapeHtml(formatNumber(totals.totalCost))} ${U.escapeHtml(currency)}</div></div>
            <div class="stack-item"><span>Totale ricavi</span><div class="summary-value">${U.escapeHtml(formatNumber(totals.totalRevenue))} ${U.escapeHtml(currency)}</div></div>
            <div class="stack-item"><span>Margine</span><div class="summary-value">${U.escapeHtml(formatNumber(totals.margin))} ${U.escapeHtml(currency)}</div><p class="summary-text">${U.escapeHtml(formatNumber(totals.marginPct))}%</p></div>
          </div>
        </section>
      </div>`;
  }

  function renderDocumentsTab(draft, i18n) {
    const docs = Array.isArray(draft.documents) ? draft.documents : [];
    return `
      <div class="quotations-editor-body">
        <section class="panel quotations-editor-section">
          <div class="panel-head compact-head">
            <div>
              <h4 class="panel-title">Documenti</h4>
              <p class="panel-subtitle">Registro documenti di supporto alla quotazione: allegati, email cliente e offerte fornitore.</p>
            </div>
          </div>
          <div class="quotations-doc-upload-row">
            <div class="field full">
              <label for="quotationDocumentTitle">Titolo</label>
              <input id="quotationDocumentTitle" type="text" data-quotation-document-draft="title" placeholder="Es. Offerta fornitore mare" />
            </div>
            <div class="field full">
              <label for="quotationDocumentCategory">Categoria</label>
              <select id="quotationDocumentCategory" data-quotation-document-draft="category">
                ${DOCUMENT_CATEGORY_OPTIONS.map((item) => `<option value="${U.escapeHtml(item.value)}">${U.escapeHtml(item.label)}</option>`).join('')}
              </select>
            </div>
            <div class="field full">
              <label for="quotationDocumentFile">File</label>
              <input id="quotationDocumentFile" type="file" data-quotation-document-file />
            </div>
            <div class="field full">
              <label for="quotationDocumentNote">Nota</label>
              <input id="quotationDocumentNote" type="text" data-quotation-document-draft="note" placeholder="Nota breve" />
            </div>
            <div class="action-row quotations-doc-upload-action">
              <button class="btn secondary" type="button" data-quotation-add-document>${U.escapeHtml(i18n?.t('ui.addDocument', 'Aggiungi documento'))}</button>
            </div>
          </div>
          ${docs.length ? `
            <div class="quotations-documents-table-wrap">
              <table class="quotations-documents-table">
                <thead>
                  <tr>
                    <th>Titolo</th>
                    <th>Categoria</th>
                    <th>File</th>
                    <th>Caricato il</th>
                    <th>Nota</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${docs.map((doc, index) => `<tr>
                    <td>${U.escapeHtml(doc.title || '—')}</td>
                    <td>${U.escapeHtml((DOCUMENT_CATEGORY_OPTIONS.find((item) => item.value === doc.category) || {}).label || doc.category || '—')}</td>
                    <td>${U.escapeHtml(doc.fileName || '—')}</td>
                    <td>${U.escapeHtml(String(doc.uploadedAt || '').slice(0, 16).replace('T', ' ') || '—')}</td>
                    <td>${U.escapeHtml(doc.note || '—')}</td>
                    <td><button class="btn secondary small" type="button" data-quotation-remove-document="${index}">×</button></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>` : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noDocumentsYet', 'Nessun documento registrato in questa quotazione.'))}</div>`}
        </section>
      </div>`;
  }

  function buildMailtoHref(draft) {
    const totals = computeTotals(draft);
    const subject = `Quotazione ${draft.quoteNumber || ''}`.trim();
    const lines = [
      `Numero quotazione: ${draft.quoteNumber || '—'}`,
      `Cliente: ${draft.clientName || draft.prospect || '—'}`,
      `Descrizione: ${draft.description || '—'}`,
      `Validità: ${draft.validFrom || '—'} → ${draft.validUntil || '—'}`,
      `Profilo: ${profileLabel(draft.serviceProfile)}`,
      `Totale ricavi: ${formatNumber(totals.totalRevenue)} ${draft.currency || 'EUR'}`,
      '',
      draft.customerNotes || ''
    ];
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  function buildPrintableHtml(draft) {
    const totals = computeTotals(draft);
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    const docs = Array.isArray(draft.documents) ? draft.documents : [];
    return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>${U.escapeHtml(draft.quoteNumber || 'Quotazione')}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 6px;font-size:24px}h2{margin:20px 0 8px;font-size:16px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #cfd4dc;padding:7px;font-size:12px;text-align:left;vertical-align:top}.meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0}.meta div{border:1px solid #d8dde6;padding:10px}.totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px}.totals div{border:1px solid #d8dde6;padding:12px}.notes{margin-top:14px;padding:12px;border:1px solid #d8dde6}</style></head><body><h1>${U.escapeHtml(draft.quoteNumber || 'Quotazione')}</h1><div>${U.escapeHtml(draft.description || '')}</div><div class="meta"><div><strong>Cliente</strong><br>${U.escapeHtml(draft.clientName || draft.prospect || '—')}</div><div><strong>Validità</strong><br>${U.escapeHtml(draft.validFrom || '—')} → ${U.escapeHtml(draft.validUntil || '—')}</div><div><strong>Profilo</strong><br>${U.escapeHtml(profileLabel(draft.serviceProfile))}</div><div><strong>Origine</strong><br>${U.escapeHtml(draft.origin || '—')}</div><div><strong>Destinazione</strong><br>${U.escapeHtml(draft.destination || '—')}</div><div><strong>Resa</strong><br>${U.escapeHtml(draft.incoterm || '—')}</div></div><h2>Dettaglio economico</h2><table><thead><tr><th>Codice</th><th>Descrizione</th><th>Fornitore</th><th>Q.tà</th><th>Costo</th><th>Ricavo</th><th>Valuta</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${U.escapeHtml(row.code || '')}</td><td>${U.escapeHtml(row.description || '')}</td><td>${U.escapeHtml(row.supplier || '')}</td><td>${U.escapeHtml(row.quantity || '')}</td><td>${U.escapeHtml(row.costAmount || '')}</td><td>${U.escapeHtml(row.sellAmount || '')}</td><td>${U.escapeHtml(row.currency || '')}</td></tr>`).join('')}</tbody></table><div class="totals"><div><strong>Totale costi</strong><br>${U.escapeHtml(formatNumber(totals.totalCost))} ${U.escapeHtml(draft.currency || 'EUR')}</div><div><strong>Totale ricavi</strong><br>${U.escapeHtml(formatNumber(totals.totalRevenue))} ${U.escapeHtml(draft.currency || 'EUR')}</div><div><strong>Margine</strong><br>${U.escapeHtml(formatNumber(totals.margin))} ${U.escapeHtml(draft.currency || 'EUR')}</div></div><h2>Documenti</h2><table><thead><tr><th>Titolo</th><th>Categoria</th><th>File</th><th>Nota</th></tr></thead><tbody>${docs.map((doc) => `<tr><td>${U.escapeHtml(doc.title || '')}</td><td>${U.escapeHtml((DOCUMENT_CATEGORY_OPTIONS.find((item) => item.value === doc.category) || {}).label || doc.category || '')}</td><td>${U.escapeHtml(doc.fileName || '')}</td><td>${U.escapeHtml(doc.note || '')}</td></tr>`).join('')}</tbody></table><div class="notes"><strong>Note cliente</strong><br>${U.escapeHtml(draft.customerNotes || '').replace(/\n/g,'<br>')}</div><div class="notes"><strong>Note interne</strong><br>${U.escapeHtml(draft.internalNotes || '').replace(/\n/g,'<br>')}</div></body></html>`;
  }

  function printDraft(draft) {
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=820');
    if (!popup) return false;
    popup.document.write(buildPrintableHtml(draft));
    popup.document.close();
    popup.focus();
    popup.print();
    return true;
  }

  async function closeSessionWithGuard(state, sessionId, i18n) {
    const session = Workspace.findSession(state, sessionId, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return false;
    if (session.isDirty) {
      if (!Feedback || typeof Feedback.confirm !== 'function') return false;
      const confirmed = await Feedback.confirm({
        title: i18n?.t('ui.workspaceDirtyCloseTitle', 'Chiudere la maschera con modifiche non salvate?'),
        message: i18n?.t('ui.workspaceDirtyCloseMessage', 'Questa maschera contiene modifiche non salvate. Se la chiudi adesso, le modifiche andranno perse.'),
        confirmLabel: i18n?.t('ui.workspaceDiscardMask', 'Chiudi senza salvare'),
        cancelLabel: i18n?.t('ui.workspaceKeepMask', 'Torna alla maschera'),
        tone: 'warning'
      });
      if (!confirmed) return false;
    }
    Workspace.closeSession(state, sessionId, { createEmptyDraft: () => createEmptyDraft(state) });
    return true;
  }

  function renderEditor(state, i18n) {
    const session = Workspace?.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) }) || null;
    if (!session) {
      return `<section class="panel quotations-editor-panel"><div class="empty-text">${U.escapeHtml(i18n?.t('ui.openQuoteMaskHint', 'Apri una nuova quotazione o riapri un record salvato per lavorare nella maschera Kedrix.'))}</div></section>`;
    }
    const draft = session.draft || createEmptyDraft(state);
    const activeTab = String(session?.uiState?.tab || 'header').trim() || 'header';
    return `
      <section class="panel quotations-editor-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(draft.quoteNumber || 'Nuova quotazione')}</h3>
            <p class="panel-subtitle">${U.escapeHtml(draft.description || 'Quotazione commerciale-operativa con dettaglio economico e documenti.')}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-quotation-print>${U.escapeHtml(i18n?.t('ui.print', 'Stampa'))}</button>
            <button class="btn secondary" type="button" data-quotation-email>${U.escapeHtml(i18n?.t('ui.sendEmail', 'Invia email'))}</button>
            <button class="btn secondary" type="button" data-quotation-save-continue>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-quotation-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        <div class="tab-row quotations-tabs">
          <button class="tab-chip${activeTab === 'header' ? ' active' : ''}" type="button" data-quotation-tab="header">Testata</button>
          <button class="tab-chip${activeTab === 'detail' ? ' active' : ''}" type="button" data-quotation-tab="detail">Dettaglio</button>
          <button class="tab-chip${activeTab === 'documents' ? ' active' : ''}" type="button" data-quotation-tab="documents">Documenti</button>
        </div>
        ${activeTab === 'detail' ? renderDetailTab(state, draft, i18n) : activeTab === 'documents' ? renderDocumentsTab(draft, i18n) : renderHeaderTab(state, draft, i18n)}
      </section>`;
  }

  function upsertRecord(state, session) {
    if (!session || !session.draft) return null;
    if (!Array.isArray(state.quotationRecords)) state.quotationRecords = [];
    const now = new Date().toISOString();
    const next = {
      ...Workspace.cloneDraft(session.draft),
      id: String(session.draft.editingRecordId || '').trim() || `qt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: String(session.draft.createdAt || now),
      updatedAt: now
    };
    next.editingRecordId = next.id;
    if (!next.quoteNumber) next.quoteNumber = nextQuoteNumber(state);
    const index = state.quotationRecords.findIndex((record) => String(record?.id || '').trim() === next.id);
    if (index === -1) state.quotationRecords.unshift(next);
    else state.quotationRecords.splice(index, 1, next);
    session.draft = Workspace.cloneDraft(next);
    Workspace.markSessionSaved(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
    return next;
  }

  function findRecord(state, recordId) {
    return (state?.quotationRecords || []).find((record) => String(record?.id || '').trim() === String(recordId || '').trim()) || null;
  }

  function addLineItem(state) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => ({
      ...draft,
      lineItems: [...(Array.isArray(draft.lineItems) ? draft.lineItems.map((item) => Workspace.defaultLineItem(item)) : []), Workspace.defaultLineItem({ currency: draft.currency || 'EUR' })]
    }), { createEmptyDraft: () => createEmptyDraft(state) });
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

  function removeLineItem(state, index) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => {
      const current = Array.isArray(draft.lineItems) ? draft.lineItems.map((item) => Workspace.defaultLineItem(item)) : [];
      if (current.length <= 1) return { ...draft, lineItems: [Workspace.defaultLineItem({ currency: draft.currency || 'EUR' })] };
      current.splice(index, 1);
      return { ...draft, lineItems: current.length ? current : [Workspace.defaultLineItem({ currency: draft.currency || 'EUR' })] };
    }, { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function addDocumentToActiveDraft(state, documentDraft) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => ({
      ...draft,
      documents: [...(Array.isArray(draft.documents) ? draft.documents.map((item) => Workspace.defaultDocument(item)) : []), Workspace.defaultDocument(documentDraft)]
    }), { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function removeDocumentFromActiveDraft(state, index) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => {
      const docs = Array.isArray(draft.documents) ? draft.documents.map((item) => Workspace.defaultDocument(item)) : [];
      docs.splice(index, 1);
      return { ...draft, documents: docs };
    }, { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function render(state, options = {}) {
    const { i18n, getSelectedPractice } = options;
    ensureState(state);
    const selectedPractice = typeof getSelectedPractice === 'function' ? getSelectedPractice() : null;
    return `
      <div class="quotations-module">
        ${renderHero(i18n)}
        ${renderKpis(state, i18n)}
        ${renderLauncher(state, i18n, selectedPractice)}
        ${renderSessionStrip(state, i18n)}
        ${renderEditor(state, i18n)}
      </div>`;
  }

  function bind(context = {}) {
    const { root, state, save, render, toast, i18n, getSelectedPractice } = context;
    if (!root || !state || !Workspace) return;

    root.querySelectorAll('[data-quotation-filter]').forEach((field) => {
      const handler = () => {
        state.quotationsModule[field.dataset.quotationFilter] = field.value;
        save?.();
        render?.();
      };
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    root.querySelectorAll('[data-quotation-profile-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        state.quotationsModule.profileFilter = button.dataset.quotationProfileFilter || 'all';
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-new]').forEach((button) => {
      button.addEventListener('click', () => {
        const preferredProfile = String(state?.quotationsModule?.profileFilter || 'all').trim();
        const serviceProfile = preferredProfile !== 'all' ? preferredProfile : 'generic';
        Workspace.openDraftSession(state, {
          createEmptyDraft: () => createEmptyDraft(state),
          draft: createEmptyDraft(state, { serviceProfile }),
          source: 'manual',
          isDirty: true,
          tab: 'header'
        });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-new-from-practice]').forEach((button) => {
      button.addEventListener('click', () => {
        const practice = typeof getSelectedPractice === 'function' ? getSelectedPractice() : null;
        if (!practice) return;
        Workspace.openDraftSession(state, {
          createEmptyDraft: () => createEmptyDraft(state),
          draft: buildDraftFromPractice(state, practice),
          source: 'practice',
          isDirty: true,
          tab: 'header'
        });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-open-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = findRecord(state, button.dataset.quotationOpenRecord);
        if (!record) return;
        Workspace.openRecordSession(state, record, { createEmptyDraft: () => createEmptyDraft(state), tab: 'header' });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-duplicate-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = findRecord(state, button.dataset.quotationDuplicateRecord);
        if (!record) return;
        const draft = Workspace.cloneDraft({ ...record, editingRecordId: '', quoteNumber: nextQuoteNumber(state), status: 'draft', createdAt: '', updatedAt: '' });
        Workspace.openDraftSession(state, { createEmptyDraft: () => createEmptyDraft(state), draft, source: 'duplicate', isDirty: true, tab: 'header' });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-session-switch]').forEach((button) => {
      button.addEventListener('click', () => {
        Workspace.switchSession(state, button.dataset.quotationSessionSwitch, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-session-close]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const closed = await closeSessionWithGuard(state, button.dataset.quotationSessionClose, i18n);
        if (!closed) return;
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionTab(state, session.id, button.dataset.quotationTab, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-field]').forEach((field) => {
      const handler = () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionField(state, session.id, field.dataset.quotationField, field.value, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
      };
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    root.querySelectorAll('[data-quotation-line-field]').forEach((field) => {
      const handler = () => {
        const index = Number(field.dataset.quotationLineIndex || -1);
        if (index < 0) return;
        updateActiveLineItem(state, index, field.dataset.quotationLineField, field.value);
        save?.();
      };
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    root.querySelectorAll('[data-quotation-add-line]').forEach((button) => {
      button.addEventListener('click', () => {
        addLineItem(state);
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-remove-line]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.quotationRemoveLine || -1);
        if (index < 0) return;
        removeLineItem(state, index);
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-add-document]').forEach((button) => {
      button.addEventListener('click', () => {
        const titleField = root.querySelector('[data-quotation-document-draft="title"]');
        const categoryField = root.querySelector('[data-quotation-document-draft="category"]');
        const noteField = root.querySelector('[data-quotation-document-draft="note"]');
        const fileField = root.querySelector('[data-quotation-document-file]');
        const file = fileField?.files?.[0] || null;
        const title = String(titleField?.value || '').trim();
        const category = String(categoryField?.value || 'quotation').trim() || 'quotation';
        const note = String(noteField?.value || '').trim();
        if (!title && !file) {
          toast?.('Inserisci almeno un titolo o seleziona un file.', 'warning');
          return;
        }
        addDocumentToActiveDraft(state, {
          title: title || file?.name || 'Documento quotazione',
          category,
          fileName: file?.name || '',
          fileSize: file ? String(file.size || '') : '',
          note
        });
        if (titleField) titleField.value = '';
        if (noteField) noteField.value = '';
        if (fileField) fileField.value = '';
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-remove-document]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.quotationRemoveDocument || -1);
        if (index < 0) return;
        removeDocumentFromActiveDraft(state, index);
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-quotation-print]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        printDraft(session.draft || {});
      });
    });

    root.querySelectorAll('[data-quotation-email]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        window.location.href = buildMailtoHref(session.draft || {});
      });
    });

    root.querySelectorAll('[data-quotation-save-continue]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        save?.();
        render?.();
        toast?.(i18n?.t('ui.quotationSaved', 'Quotazione salvata'), 'success');
      });
    });

    root.querySelectorAll('[data-quotation-save-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        Workspace.closeSession(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
        toast?.(i18n?.t('ui.quotationSaved', 'Quotazione salvata'), 'success');
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
