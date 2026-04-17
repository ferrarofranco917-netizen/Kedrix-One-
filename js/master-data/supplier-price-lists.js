window.KedrixOneSupplierPriceLists = (() => {
  'use strict';

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanUpper(value) {
    return cleanText(value).toUpperCase();
  }

  function ensureCompanyConfig(stateOrConfig) {
    const companyConfig = stateOrConfig && stateOrConfig.companyConfig ? stateOrConfig.companyConfig : stateOrConfig;
    if (!companyConfig || typeof companyConfig !== 'object') return null;
    if (!companyConfig.masterDataRecords || typeof companyConfig.masterDataRecords !== 'object') {
      companyConfig.masterDataRecords = {};
    }
    return companyConfig;
  }

  function ensureStore(stateOrConfig) {
    const companyConfig = ensureCompanyConfig(stateOrConfig);
    if (!companyConfig) return [];
    if (!Array.isArray(companyConfig.masterDataRecords.supplierPriceLists)) {
      companyConfig.masterDataRecords.supplierPriceLists = [];
    }
    return companyConfig.masterDataRecords.supplierPriceLists;
  }

  function nextSequentialId(items) {
    const max = (Array.isArray(items) ? items : []).reduce((acc, item) => {
      const raw = String(item && item.id ? item.id : '');
      const numeric = Number(raw.replace(/[^0-9]/g, ''));
      return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);
    return `SPL-${String(max + 1).padStart(3, '0')}`;
  }

  function getMasterDataEntities() {
    return window.KedrixOneMasterDataEntities || null;
  }

  function normalizeAmount(value) {
    const clean = cleanText(value).replace(',', '.');
    if (!clean) return '';
    const numeric = Number(clean);
    if (!Number.isFinite(numeric)) return clean;
    return String(Math.round(numeric * 100) / 100);
  }

  function normalizeRecord(record) {
    if (!record || typeof record !== 'object') return null;
    const supplierId = cleanText(record.supplierId || '');
    const supplierName = cleanText(record.supplierName || record.supplier || '');
    const service = cleanText(record.service || '');
    const mode = cleanText(record.mode || '');
    const route = cleanText(record.route || '');
    const equipment = cleanText(record.equipment || '');
    const costAmount = normalizeAmount(record.costAmount || '');
    const currency = cleanText(record.currency || 'EUR') || 'EUR';
    const costUnit = cleanText(record.costUnit || 'shipment') || 'shipment';
    const validityStart = cleanText(record.validityStart || '');
    const validityEnd = cleanText(record.validityEnd || '');
    const notes = cleanText(record.notes || '');
    const contactName = cleanText(record.contactName || '');
    const contactEmail = cleanText(record.contactEmail || '');
    const coverageArea = cleanText(record.coverageArea || '');
    const active = record.active !== false;
    const supplierDisplay = supplierName || supplierId;
    if (!supplierDisplay && !service && !mode && !route) return null;
    const primary = [supplierDisplay, service || mode].filter(Boolean).join(' · ') || supplierDisplay;
    const secondary = [route, equipment || coverageArea].filter(Boolean).join(' · ') || coverageArea || '—';
    const priceSide = [currency, costAmount].filter(Boolean).join(' ');
    const unitSide = costUnit ? `/${costUnit}` : '';
    const tertiary = `${priceSide || '—'}${priceSide ? unitSide : ''}`;
    return {
      id: cleanText(record.id || ''),
      supplierId,
      supplierName,
      service,
      mode,
      route,
      equipment,
      costAmount,
      currency,
      costUnit,
      validityStart,
      validityEnd,
      notes,
      contactName,
      contactEmail,
      coverageArea,
      active,
      updatedAt: cleanText(record.updatedAt || ''),
      createdAt: cleanText(record.createdAt || ''),
      primary,
      secondary,
      tertiary
    };
  }

  function createFormDraft(sourceRecord = null) {
    const normalized = normalizeRecord(sourceRecord || null);
    return normalized ? {
      id: normalized.id,
      supplierId: normalized.supplierId,
      supplierName: normalized.supplierName,
      service: normalized.service,
      mode: normalized.mode,
      route: normalized.route,
      equipment: normalized.equipment,
      costAmount: normalized.costAmount,
      currency: normalized.currency,
      costUnit: normalized.costUnit,
      validityStart: normalized.validityStart,
      validityEnd: normalized.validityEnd,
      notes: normalized.notes,
      contactName: normalized.contactName,
      contactEmail: normalized.contactEmail,
      coverageArea: normalized.coverageArea,
      active: normalized.active
    } : {
      id: '',
      supplierId: '',
      supplierName: '',
      service: '',
      mode: 'sea',
      route: '',
      equipment: '',
      costAmount: '',
      currency: 'EUR',
      costUnit: 'shipment',
      validityStart: '',
      validityEnd: '',
      notes: '',
      contactName: '',
      contactEmail: '',
      coverageArea: '',
      active: true
    };
  }

  function createDraftFromSupplier(supplierRecord) {
    const normalizedSupplier = supplierRecord && typeof supplierRecord === 'object' ? supplierRecord : {};
    return {
      ...createFormDraft(),
      supplierId: cleanText(normalizedSupplier.id || ''),
      supplierName: cleanText(normalizedSupplier.name || normalizedSupplier.value || '')
    };
  }

  function getSupplierOptions(state) {
    const MasterDataEntities = getMasterDataEntities();
    if (!MasterDataEntities || typeof MasterDataEntities.listEntityRecords !== 'function') return [];
    return MasterDataEntities.listEntityRecords(state, 'supplier').map((entry) => {
      const record = entry.record || {};
      return {
        id: cleanText(record.id || entry.id || ''),
        name: cleanText(record.name || entry.primary || ''),
        city: cleanText(record.city || ''),
        vatNumber: cleanText(record.vatNumber || ''),
        label: [cleanText(record.name || entry.primary || ''), cleanText(record.city || ''), cleanText(record.vatNumber || '')].filter(Boolean).join(' · ')
      };
    }).filter((item) => item.id && item.name);
  }

  function hydrateSupplierIdentity(state, payload) {
    const next = { ...payload };
    const supplierId = cleanText(payload.supplierId || '');
    if (!supplierId) {
      next.supplierName = cleanText(payload.supplierName || '');
      return next;
    }
    const supplier = getSupplierOptions(state).find((item) => item.id === supplierId);
    next.supplierName = supplier ? supplier.name : cleanText(payload.supplierName || '');
    return next;
  }

  function sameRecordKey(record, payload) {
    return [
      cleanUpper(record.supplierId || record.supplierName || ''),
      cleanUpper(record.service || ''),
      cleanUpper(record.mode || ''),
      cleanUpper(record.route || ''),
      cleanUpper(record.equipment || ''),
      cleanUpper(record.currency || ''),
      cleanUpper(record.costUnit || ''),
      cleanUpper(record.validityStart || '')
    ].join('|') === [
      cleanUpper(payload.supplierId || payload.supplierName || ''),
      cleanUpper(payload.service || ''),
      cleanUpper(payload.mode || ''),
      cleanUpper(payload.route || ''),
      cleanUpper(payload.equipment || ''),
      cleanUpper(payload.currency || ''),
      cleanUpper(payload.costUnit || ''),
      cleanUpper(payload.validityStart || '')
    ].join('|');
  }

  function saveRecord(state, payload = {}) {
    const enriched = hydrateSupplierIdentity(state, payload);
    const normalized = normalizeRecord({
      id: payload.id,
      supplierId: enriched.supplierId,
      supplierName: enriched.supplierName,
      service: payload.service,
      mode: payload.mode,
      route: payload.route,
      equipment: payload.equipment,
      costAmount: payload.costAmount,
      currency: payload.currency,
      costUnit: payload.costUnit,
      validityStart: payload.validityStart,
      validityEnd: payload.validityEnd,
      notes: payload.notes,
      contactName: payload.contactName,
      contactEmail: payload.contactEmail,
      coverageArea: payload.coverageArea,
      active: payload.active !== false,
      updatedAt: new Date().toISOString(),
      createdAt: payload.createdAt || new Date().toISOString()
    });

    if (!normalized || !normalized.supplierName) return { ok: false, reason: 'missing-supplier' };
    if (!normalized.service && !normalized.mode) return { ok: false, reason: 'missing-service' };
    if (!normalized.costAmount) return { ok: false, reason: 'missing-amount' };

    const store = ensureStore(state);
    const currentIndex = normalized.id ? store.findIndex((item) => cleanText(item.id) === normalized.id) : -1;
    const duplicateIndex = store.findIndex((item, index) => {
      if (index === currentIndex) return false;
      const candidate = normalizeRecord(item);
      return candidate && sameRecordKey(candidate, normalized);
    });
    if (duplicateIndex >= 0) {
      const existing = normalizeRecord(store[duplicateIndex]);
      return { ok: true, created: false, updated: false, duplicate: true, value: existing.primary, relatedId: existing.id, record: existing };
    }

    const previous = currentIndex >= 0 ? normalizeRecord(store[currentIndex]) : null;
    const record = {
      id: normalized.id || nextSequentialId(store),
      supplierId: normalized.supplierId,
      supplierName: normalized.supplierName,
      service: normalized.service,
      mode: normalized.mode,
      route: normalized.route,
      equipment: normalized.equipment,
      costAmount: normalized.costAmount,
      currency: normalized.currency,
      costUnit: normalized.costUnit,
      validityStart: normalized.validityStart,
      validityEnd: normalized.validityEnd,
      notes: normalized.notes,
      contactName: normalized.contactName,
      contactEmail: normalized.contactEmail,
      coverageArea: normalized.coverageArea,
      active: normalized.active,
      createdAt: previous ? previous.createdAt : normalized.createdAt,
      updatedAt: normalized.updatedAt
    };

    if (currentIndex >= 0) store[currentIndex] = record;
    else store.push(record);
    const finalRecord = normalizeRecord(record);
    return { ok: true, created: currentIndex < 0, updated: currentIndex >= 0, value: finalRecord.primary, relatedId: finalRecord.id, record: finalRecord };
  }

  function listRecords(state) {
    return ensureStore(state)
      .map((item) => normalizeRecord(item))
      .filter(Boolean)
      .sort((left, right) => {
        const leftSupplier = cleanUpper(left.supplierName || '');
        const rightSupplier = cleanUpper(right.supplierName || '');
        if (leftSupplier !== rightSupplier) return leftSupplier.localeCompare(rightSupplier);
        return cleanUpper(left.service || '').localeCompare(cleanUpper(right.service || ''));
      })
      .map((record) => ({
        id: record.id,
        primary: record.primary,
        secondary: record.secondary,
        tertiary: record.tertiary,
        value: record.primary,
        record
      }));
  }

  function getRecordById(state, recordId) {
    if (!recordId) return null;
    const raw = ensureStore(state).find((item) => cleanText(item.id) === cleanText(recordId));
    return raw ? normalizeRecord(raw) : null;
  }

  function formatMoney(record) {
    const normalized = normalizeRecord(record || {});
    if (!normalized) return '—';
    return `${normalized.currency || ''} ${normalized.costAmount || ''}${normalized.costAmount ? `/${normalized.costUnit || 'shipment'}` : ''}`.trim() || '—';
  }

  function getSummary(state) {
    const items = ensureStore(state).map((item) => normalizeRecord(item)).filter(Boolean);
    const activeItems = items.filter((item) => item.active !== false);
    const today = new Date();
    const soon = new Date();
    soon.setDate(today.getDate() + 30);
    const expiringSoon = activeItems.filter((item) => {
      if (!item.validityEnd) return false;
      const validity = new Date(item.validityEnd);
      return Number.isFinite(validity.getTime()) && validity >= today && validity <= soon;
    });
    const supplierCoverage = new Set(activeItems.map((item) => item.supplierId || item.supplierName).filter(Boolean)).size;
    return {
      totalRecords: items.length,
      activeRecords: activeItems.length,
      expiringSoon: expiringSoon.length,
      supplierCoverage
    };
  }

  function renderEditor(options = {}) {
    const { state = null, formDraft = {}, i18n = null } = options;
    const supplierOptions = getSupplierOptions(state);
    const selectedSupplierId = cleanText(formDraft.supplierId || '');
    const supplierHint = supplierOptions.length
      ? t(i18n, 'ui.masterDataSupplierPriceListSupplierHint', 'Collega il listino a un fornitore già strutturato.')
      : t(i18n, 'ui.masterDataSupplierPriceListSupplierMissing', 'Prima crea almeno un fornitore strutturato in Anagrafiche.');
    const modeOptions = [
      { value: 'sea', label: t(i18n, 'ui.masterDataModeSea', 'Mare') },
      { value: 'air', label: t(i18n, 'ui.masterDataModeAir', 'Aereo') },
      { value: 'road', label: t(i18n, 'ui.masterDataModeRoad', 'Terrestre') },
      { value: 'warehouse', label: t(i18n, 'ui.masterDataModeWarehouse', 'Magazzino') },
      { value: 'other', label: t(i18n, 'ui.masterDataModeOther', 'Altro') }
    ];
    const currencyOptions = ['EUR', 'USD', 'GBP', 'CHF', 'CNY'];
    const unitOptions = ['shipment', 'container', 'pallet', 'kg', 'hour', 'day'];
    return `
      <div class="form-grid two master-data-entity-grid">
        <div class="field full">
          <label for="supplierPriceListSupplierId">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListSupplier', 'Fornitore'))} <span class="required-mark">*</span></label>
          <select id="supplierPriceListSupplierId" name="supplierId">
            <option value="">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListSupplierPlaceholder', 'Seleziona fornitore'))}</option>
            ${supplierOptions.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedSupplierId ? 'selected' : ''}>${escapeHtml(item.label || item.name)}</option>`).join('')}
          </select>
          <small>${escapeHtml(supplierHint)}</small>
        </div>
        <div class="field">
          <label for="supplierPriceListService">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListService', 'Servizio'))} <span class="required-mark">*</span></label>
          <input id="supplierPriceListService" name="service" type="text" value="${escapeHtml(formDraft.service || '')}" autocomplete="off" placeholder="${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListServicePlaceholder', 'Es. trasporto FTL / booking / sosta'))}" />
        </div>
        <div class="field">
          <label for="supplierPriceListMode">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListMode', 'Modalità'))}</label>
          <select id="supplierPriceListMode" name="mode">
            ${modeOptions.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === cleanText(formDraft.mode || 'sea') ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
          </select>
        </div>
        <div class="field full">
          <label for="supplierPriceListRoute">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListRoute', 'Tratta / direttrice'))}</label>
          <input id="supplierPriceListRoute" name="route" type="text" value="${escapeHtml(formDraft.route || '')}" autocomplete="off" placeholder="${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListRoutePlaceholder', 'Es. Genova → Milano / CNF Shanghai → Genova'))}" />
        </div>
        <div class="field">
          <label for="supplierPriceListEquipment">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListEquipment', 'Mezzo / equipment'))}</label>
          <input id="supplierPriceListEquipment" name="equipment" type="text" value="${escapeHtml(formDraft.equipment || '')}" autocomplete="off" placeholder="${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListEquipmentPlaceholder', 'Es. 40HC / bilico / pallet'))}" />
        </div>
        <div class="field">
          <label for="supplierPriceListCoverageArea">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListCoverageArea', 'Area servita'))}</label>
          <input id="supplierPriceListCoverageArea" name="coverageArea" type="text" value="${escapeHtml(formDraft.coverageArea || '')}" autocomplete="off" placeholder="${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListCoverageAreaPlaceholder', 'Es. Nord Ovest / Malpensa / Export mare'))}" />
        </div>
        <div class="field">
          <label for="supplierPriceListCostAmount">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListAmount', 'Costo fornitore'))} <span class="required-mark">*</span></label>
          <input id="supplierPriceListCostAmount" name="costAmount" type="text" value="${escapeHtml(formDraft.costAmount || '')}" autocomplete="off" placeholder="0.00" />
        </div>
        <div class="field">
          <label for="supplierPriceListCurrency">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListCurrency', 'Valuta'))}</label>
          <select id="supplierPriceListCurrency" name="currency">
            ${currencyOptions.map((item) => `<option value="${escapeHtml(item)}" ${item === cleanText(formDraft.currency || 'EUR') ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="supplierPriceListCostUnit">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListUnit', 'Unità costo'))}</label>
          <select id="supplierPriceListCostUnit" name="costUnit">
            ${unitOptions.map((item) => `<option value="${escapeHtml(item)}" ${item === cleanText(formDraft.costUnit || 'shipment') ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="supplierPriceListValidityStart">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListValidityStart', 'Validità dal'))}</label>
          <input id="supplierPriceListValidityStart" name="validityStart" type="date" value="${escapeHtml(formDraft.validityStart || '')}" />
        </div>
        <div class="field">
          <label for="supplierPriceListValidityEnd">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListValidityEnd', 'Validità al'))}</label>
          <input id="supplierPriceListValidityEnd" name="validityEnd" type="date" value="${escapeHtml(formDraft.validityEnd || '')}" />
        </div>
        <div class="field">
          <label for="supplierPriceListContactName">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListContactName', 'Contatto'))}</label>
          <input id="supplierPriceListContactName" name="contactName" type="text" value="${escapeHtml(formDraft.contactName || '')}" autocomplete="off" />
        </div>
        <div class="field">
          <label for="supplierPriceListContactEmail">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListContactEmail', 'Email contatto'))}</label>
          <input id="supplierPriceListContactEmail" name="contactEmail" type="email" value="${escapeHtml(formDraft.contactEmail || '')}" autocomplete="off" />
        </div>
        <div class="field full">
          <label for="supplierPriceListNotes">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListNotes', 'Note operative'))}</label>
          <textarea id="supplierPriceListNotes" name="notes" rows="3">${escapeHtml(formDraft.notes || '')}</textarea>
        </div>
        <div class="field full">
          <label class="checkbox-chip master-data-checkbox"><input name="active" type="checkbox" ${formDraft.active !== false ? 'checked' : ''} /> ${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListActive', 'Listino attivo'))}</label>
        </div>
      </div>`;
  }

  function renderFoundationPanel(options = {}) {
    const { state = null, i18n = null } = options;
    const summary = getSummary(state);
    return `
      <section class="panel master-data-supplier-price-panel">
        <div class="panel-head compact">
          <div>
            <h3 class="panel-title">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListFoundationTitle', 'Listini fornitore foundation'))}</h3>
            <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListFoundationSubtitle', 'Base costi fornitore pronta per ponte Quotazioni, storico variazioni e selezione partner.'))}</p>
          </div>
          <span class="badge ${summary.activeRecords > 0 ? 'success' : 'default'}">${escapeHtml(summary.activeRecords > 0 ? t(i18n, 'ui.masterDataOverviewStatusAttention', 'Base in espansione') : t(i18n, 'ui.masterDataOverviewStatusCritical', 'Base da completare'))}</span>
        </div>
        <div class="master-data-supplier-price-kpis">
          <div class="master-data-supplier-price-kpi"><strong>${escapeHtml(summary.totalRecords)}</strong><span>${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListTotal', 'listini totali'))}</span></div>
          <div class="master-data-supplier-price-kpi"><strong>${escapeHtml(summary.activeRecords)}</strong><span>${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListActiveCount', 'listini attivi'))}</span></div>
          <div class="master-data-supplier-price-kpi"><strong>${escapeHtml(summary.supplierCoverage)}</strong><span>${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListCoverage', 'fornitori coperti'))}</span></div>
          <div class="master-data-supplier-price-kpi"><strong>${escapeHtml(summary.expiringSoon)}</strong><span>${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListExpiring', 'in scadenza 30g'))}</span></div>
        </div>
      </section>`;
  }

  function renderSupplierBridgePanel(options = {}) {
    const { state = null, supplierRecord = null, i18n = null } = options;
    const supplier = supplierRecord && typeof supplierRecord === 'object' ? supplierRecord : null;
    if (!supplier || !supplier.id) return '';
    const related = ensureStore(state)
      .map((item) => normalizeRecord(item))
      .filter(Boolean)
      .filter((item) => cleanText(item.supplierId || '') === cleanText(supplier.id || '') || cleanUpper(item.supplierName || '') === cleanUpper(supplier.name || ''));
    const visibleItems = related.slice(0, 3).map((item) => `
      <li>
        <strong>${escapeHtml(item.service || item.mode || t(i18n, 'ui.masterDataSupplierPriceListUnnamed', 'Listino'))}</strong>
        <span>${escapeHtml(item.secondary)}</span>
        <em>${escapeHtml(formatMoney(item))}</em>
      </li>`).join('');
    return `
      <section class="panel master-data-supplier-price-panel">
        <div class="panel-head compact">
          <div>
            <h3 class="panel-title">${escapeHtml(t(i18n, 'ui.masterDataSupplierBridgeTitle', 'Storico listini del fornitore'))}</h3>
            <p class="panel-subtitle">${escapeHtml(supplier.name || '')}</p>
          </div>
          <button class="btn secondary" id="supplierCreatePriceListButton" type="button">${escapeHtml(t(i18n, 'ui.masterDataSupplierBridgeAction', 'Nuovo listino'))}</button>
        </div>
        <div class="master-data-supplier-price-bridge">
          <div class="master-data-supplier-price-kpis compact">
            <div class="master-data-supplier-price-kpi"><strong>${escapeHtml(related.length)}</strong><span>${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListTotal', 'listini totali'))}</span></div>
          </div>
          ${related.length ? `<ul class="master-data-supplier-price-list">${visibleItems}</ul>` : `<div class="master-data-empty-state">${escapeHtml(t(i18n, 'ui.masterDataSupplierBridgeEmpty', 'Nessun listino ancora registrato per questo fornitore.'))}</div>`}
        </div>
      </section>`;
  }

  function getOverviewMeta(state) {
    return getSummary(state);
  }

  function describeActiveFamily(i18n) {
    return {
      title: t(i18n, 'ui.masterDataSupplierPriceListContextTitle', 'Listino fornitore strutturato'),
      detail: t(i18n, 'ui.masterDataSupplierPriceListContextDetail', 'Questa famiglia salva listini costi con validità, tratta, mezzo e base storica per il futuro collegamento alle Quotazioni.'),
      badgeLabel: t(i18n, 'ui.masterDataSupplierPriceListContextBadge', 'Listini'),
      badgeTone: 'success',
      metricLabel: t(i18n, 'ui.masterDataSupplierPriceListTotal', 'listini totali')
    };
  }

  return {
    ensureStore,
    normalizeRecord,
    createFormDraft,
    createDraftFromSupplier,
    listRecords,
    getRecordById,
    saveRecord,
    renderEditor,
    renderFoundationPanel,
    renderSupplierBridgePanel,
    getOverviewMeta,
    describeActiveFamily,
    getSupplierOptions
  };
})();
