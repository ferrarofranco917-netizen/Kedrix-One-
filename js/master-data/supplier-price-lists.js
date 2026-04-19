window.KedrixOneSupplierPriceLists = (() => {
  'use strict';

  function cleanText(value) {
    return String(value || '').trim();
  }

  function ensurePracticeConfig(companyConfig) {
    if (!companyConfig || typeof companyConfig !== 'object') {
      return { practiceConfig: { directories: {} }, masterDataRecords: {} };
    }
    if (!companyConfig.practiceConfig || typeof companyConfig.practiceConfig !== 'object') {
      companyConfig.practiceConfig = { directories: {} };
    }
    if (!companyConfig.practiceConfig.directories || typeof companyConfig.practiceConfig.directories !== 'object') {
      companyConfig.practiceConfig.directories = {};
    }
    if (!companyConfig.masterDataRecords || typeof companyConfig.masterDataRecords !== 'object') {
      companyConfig.masterDataRecords = {};
    }
    return companyConfig.practiceConfig;
  }

  function ensureStore(stateOrConfig) {
    const companyConfig = stateOrConfig && stateOrConfig.companyConfig ? stateOrConfig.companyConfig : stateOrConfig;
    if (!companyConfig || typeof companyConfig !== 'object') return [];
    ensurePracticeConfig(companyConfig);
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

  function normalizePriceList(record) {
    if (!record || typeof record !== 'object') return null;
    const supplierName = cleanText(record.supplierName || '');
    const serviceLabel = cleanText(record.serviceLabel || '');
    if (!supplierName || !serviceLabel) return null;
    return {
      id: cleanText(record.id || ''),
      supplierId: cleanText(record.supplierId || ''),
      supplierName,
      serviceLabel,
      routeScope: cleanText(record.routeScope || ''),
      validityFrom: cleanText(record.validityFrom || ''),
      validityTo: cleanText(record.validityTo || ''),
      currency: cleanText(record.currency || 'EUR') || 'EUR',
      unitPrice: cleanText(record.unitPrice || ''),
      unitType: cleanText(record.unitType || ''),
      leadTime: cleanText(record.leadTime || ''),
      paymentTerms: cleanText(record.paymentTerms || ''),
      notes: cleanText(record.notes || ''),
      active: record.active !== false,
      createdAt: cleanText(record.createdAt || ''),
      updatedAt: cleanText(record.updatedAt || ''),
      lastUsedAt: cleanText(record.lastUsedAt || '')
    };
  }

  function createDraft(record = null, supplierRecord = null) {
    const normalized = normalizePriceList(record) || {};
    const supplierId = cleanText(normalized.supplierId || (supplierRecord && supplierRecord.id) || '');
    const supplierName = cleanText(normalized.supplierName || (supplierRecord && (supplierRecord.name || supplierRecord.value)) || '');
    return {
      id: cleanText(normalized.id || ''),
      supplierId,
      supplierName,
      serviceLabel: cleanText(normalized.serviceLabel || ''),
      routeScope: cleanText(normalized.routeScope || ''),
      validityFrom: cleanText(normalized.validityFrom || ''),
      validityTo: cleanText(normalized.validityTo || ''),
      currency: cleanText(normalized.currency || 'EUR') || 'EUR',
      unitPrice: cleanText(normalized.unitPrice || ''),
      unitType: cleanText(normalized.unitType || ''),
      leadTime: cleanText(normalized.leadTime || ''),
      paymentTerms: cleanText(normalized.paymentTerms || (supplierRecord && supplierRecord.paymentTerms) || ''),
      notes: cleanText(normalized.notes || ''),
      active: normalized.active !== false
    };
  }

  function listForSupplier(stateOrConfig, supplierRecord = null) {
    const supplierId = cleanText(supplierRecord && supplierRecord.id || '');
    const supplierName = cleanText(supplierRecord && (supplierRecord.name || supplierRecord.value) || '');
    return ensureStore(stateOrConfig)
      .map((item) => normalizePriceList(item))
      .filter(Boolean)
      .filter((item) => {
        if (supplierId && cleanText(item.supplierId) === supplierId) return true;
        if (!supplierId && supplierName && cleanText(item.supplierName).toUpperCase() === supplierName.toUpperCase()) return true;
        return false;
      })
      .sort((left, right) => {
        const a = cleanText(right.updatedAt || right.validityFrom || '');
        const b = cleanText(left.updatedAt || left.validityFrom || '');
        return a.localeCompare(b);
      });
  }

  function savePriceList(stateOrConfig, payload = {}) {
    const store = ensureStore(stateOrConfig);
    const normalized = normalizePriceList({
      id: payload.id,
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      serviceLabel: payload.serviceLabel,
      routeScope: payload.routeScope,
      validityFrom: payload.validityFrom,
      validityTo: payload.validityTo,
      currency: payload.currency,
      unitPrice: payload.unitPrice,
      unitType: payload.unitType,
      leadTime: payload.leadTime,
      paymentTerms: payload.paymentTerms,
      notes: payload.notes,
      active: payload.active !== false,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      lastUsedAt: payload.lastUsedAt
    });
    if (!normalized) return { ok: false, reason: 'missing-required' };
    const nowIso = new Date().toISOString();
    const currentIndex = normalized.id
      ? store.findIndex((item) => cleanText(item && item.id) === normalized.id)
      : -1;
    const previous = currentIndex >= 0 ? normalizePriceList(store[currentIndex]) : null;
    const nextRecord = {
      ...normalized,
      id: normalized.id || nextSequentialId(store),
      createdAt: previous && previous.createdAt ? previous.createdAt : nowIso,
      updatedAt: nowIso,
      lastUsedAt: previous && previous.lastUsedAt ? previous.lastUsedAt : ''
    };
    if (currentIndex >= 0) store[currentIndex] = nextRecord;
    else store.push(nextRecord);
    return {
      ok: true,
      created: currentIndex < 0,
      updated: currentIndex >= 0,
      record: normalizePriceList(nextRecord)
    };
  }

  function getById(stateOrConfig, recordId) {
    const cleanId = cleanText(recordId);
    if (!cleanId) return null;
    return ensureStore(stateOrConfig)
      .map((item) => normalizePriceList(item))
      .filter(Boolean)
      .find((item) => cleanText(item.id) === cleanId) || null;
  }

  return {
    ensureStore,
    normalizePriceList,
    createDraft,
    listForSupplier,
    savePriceList,
    getById
  };
})();
