window.KedrixOneSupplierRoadRates = (() => {
  'use strict';

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanUpper(value) {
    return cleanText(value).toUpperCase();
  }

  function normalizeHeader(value) {
    return cleanUpper(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim();
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
    if (!Array.isArray(companyConfig.masterDataRecords.supplierRoadRates)) {
      companyConfig.masterDataRecords.supplierRoadRates = [];
    }
    return companyConfig.masterDataRecords.supplierRoadRates;
  }

  function nextSequentialId(items) {
    const max = (Array.isArray(items) ? items : []).reduce((acc, item) => {
      const raw = String(item && item.id ? item.id : '');
      const numeric = Number(raw.replace(/[^0-9]/g, ''));
      return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);
    return `SRR-${String(max + 1).padStart(4, '0')}`;
  }

  function normalizeBoolean(value, defaultValue = true) {
    if (typeof value === 'boolean') return value;
    const clean = cleanUpper(value);
    if (!clean) return defaultValue;
    if (['0', 'FALSE', 'NO', 'N', 'OFF'].includes(clean)) return false;
    if (['1', 'TRUE', 'YES', 'Y', 'ON', 'SI', 'S'].includes(clean)) return true;
    return defaultValue;
  }

  function normalizeRoadRate(record) {
    if (!record || typeof record !== 'object') return null;
    const supplierName = cleanText(record.supplierName || '');
    const origin = cleanText(record.origin || '');
    const destination = cleanText(record.destination || '');
    if (!supplierName || !origin || !destination) return null;
    return {
      id: cleanText(record.id || ''),
      supplierId: cleanText(record.supplierId || ''),
      supplierName,
      origin,
      destination,
      viaPoint: cleanText(record.viaPoint || ''),
      distanceKm: cleanText(record.distanceKm || ''),
      tariffAmount: cleanText(record.tariffAmount || ''),
      currency: cleanText(record.currency || 'EUR') || 'EUR',
      vehicleType: cleanText(record.vehicleType || ''),
      serviceType: cleanText(record.serviceType || ''),
      validityFrom: cleanText(record.validityFrom || ''),
      validityTo: cleanText(record.validityTo || ''),
      paymentTerms: cleanText(record.paymentTerms || ''),
      tollIncluded: normalizeBoolean(record.tollIncluded, false),
      fuelIncluded: normalizeBoolean(record.fuelIncluded, false),
      notes: cleanText(record.notes || ''),
      active: normalizeBoolean(record.active, true),
      sourceType: cleanText(record.sourceType || 'manual') || 'manual',
      importBatchId: cleanText(record.importBatchId || ''),
      importSourceName: cleanText(record.importSourceName || ''),
      createdAt: cleanText(record.createdAt || ''),
      updatedAt: cleanText(record.updatedAt || ''),
      lastMatchedAt: cleanText(record.lastMatchedAt || '')
    };
  }

  function createDraft(record = null, supplierRecord = null) {
    const normalized = normalizeRoadRate(record) || {};
    const supplierId = cleanText(normalized.supplierId || (supplierRecord && supplierRecord.id) || '');
    const supplierName = cleanText(normalized.supplierName || (supplierRecord && (supplierRecord.name || supplierRecord.value)) || '');
    return {
      id: cleanText(normalized.id || ''),
      supplierId,
      supplierName,
      origin: cleanText(normalized.origin || ''),
      destination: cleanText(normalized.destination || ''),
      viaPoint: cleanText(normalized.viaPoint || ''),
      distanceKm: cleanText(normalized.distanceKm || ''),
      tariffAmount: cleanText(normalized.tariffAmount || ''),
      currency: cleanText(normalized.currency || 'EUR') || 'EUR',
      vehicleType: cleanText(normalized.vehicleType || ''),
      serviceType: cleanText(normalized.serviceType || ''),
      validityFrom: cleanText(normalized.validityFrom || ''),
      validityTo: cleanText(normalized.validityTo || ''),
      paymentTerms: cleanText(normalized.paymentTerms || (supplierRecord && supplierRecord.paymentTerms) || ''),
      tollIncluded: normalized.tollIncluded === true,
      fuelIncluded: normalized.fuelIncluded === true,
      notes: cleanText(normalized.notes || ''),
      active: normalized.active !== false,
      sourceType: cleanText(normalized.sourceType || 'manual') || 'manual',
      importBatchId: cleanText(normalized.importBatchId || ''),
      importSourceName: cleanText(normalized.importSourceName || '')
    };
  }

  function listForSupplier(stateOrConfig, supplierRecord = null) {
    const supplierId = cleanText(supplierRecord && supplierRecord.id || '');
    const supplierName = cleanText(supplierRecord && (supplierRecord.name || supplierRecord.value) || '');
    return ensureStore(stateOrConfig)
      .map((item) => normalizeRoadRate(item))
      .filter(Boolean)
      .filter((item) => {
        if (supplierId && cleanText(item.supplierId) === supplierId) return true;
        if (!supplierId && supplierName && cleanUpper(item.supplierName) === cleanUpper(supplierName)) return true;
        return false;
      })
      .sort((left, right) => {
        const a = cleanText(right.updatedAt || right.validityFrom || '');
        const b = cleanText(left.updatedAt || left.validityFrom || '');
        return a.localeCompare(b);
      });
  }

  function buildDuplicateKey(record) {
    return [
      cleanUpper(record.supplierId || record.supplierName),
      cleanUpper(record.origin),
      cleanUpper(record.destination),
      cleanUpper(record.vehicleType),
      cleanUpper(record.serviceType),
      cleanUpper(record.validityFrom),
      cleanUpper(record.validityTo)
    ].join('||');
  }

  function saveRoadRate(stateOrConfig, payload = {}) {
    const store = ensureStore(stateOrConfig);
    const normalized = normalizeRoadRate({
      id: payload.id,
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      origin: payload.origin,
      destination: payload.destination,
      viaPoint: payload.viaPoint,
      distanceKm: payload.distanceKm,
      tariffAmount: payload.tariffAmount,
      currency: payload.currency,
      vehicleType: payload.vehicleType,
      serviceType: payload.serviceType,
      validityFrom: payload.validityFrom,
      validityTo: payload.validityTo,
      paymentTerms: payload.paymentTerms,
      tollIncluded: payload.tollIncluded,
      fuelIncluded: payload.fuelIncluded,
      notes: payload.notes,
      active: payload.active,
      sourceType: payload.sourceType,
      importBatchId: payload.importBatchId,
      importSourceName: payload.importSourceName,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      lastMatchedAt: payload.lastMatchedAt
    });
    if (!normalized) return { ok: false, reason: 'missing-required' };

    const nowIso = new Date().toISOString();
    const duplicateKey = buildDuplicateKey(normalized);
    const currentIndex = normalized.id
      ? store.findIndex((item) => cleanText(item && item.id) === normalized.id)
      : store.findIndex((item) => {
          const candidate = normalizeRoadRate(item);
          return candidate ? buildDuplicateKey(candidate) === duplicateKey : false;
        });
    const previous = currentIndex >= 0 ? normalizeRoadRate(store[currentIndex]) : null;
    const nextRecord = {
      ...normalized,
      id: normalized.id || (previous && previous.id) || nextSequentialId(store),
      createdAt: previous && previous.createdAt ? previous.createdAt : nowIso,
      updatedAt: nowIso,
      lastMatchedAt: previous && previous.lastMatchedAt ? previous.lastMatchedAt : ''
    };

    if (currentIndex >= 0) store[currentIndex] = nextRecord;
    else store.push(nextRecord);

    return {
      ok: true,
      created: currentIndex < 0,
      updated: currentIndex >= 0,
      record: normalizeRoadRate(nextRecord)
    };
  }

  function getById(stateOrConfig, recordId) {
    const cleanId = cleanText(recordId);
    if (!cleanId) return null;
    return ensureStore(stateOrConfig)
      .map((item) => normalizeRoadRate(item))
      .filter(Boolean)
      .find((item) => cleanText(item.id) === cleanId) || null;
  }

  const headerAliases = {
    origin: ['ORIGINE', 'ORIGIN', 'FROM', 'PARTENZA', 'CARICO', 'LOAD', 'LOADING PLACE'],
    destination: ['DESTINAZIONE', 'DESTINATION', 'TO', 'ARRIVO', 'SCARICO', 'DELIVERY', 'UNLOAD', 'UNLOADING PLACE'],
    viaPoint: ['VIA', 'TRANSITO', 'INTERMEDIO', 'VIA POINT'],
    distanceKm: ['KM', 'KILOMETRI', 'CHILOMETRI', 'DISTANZA KM', 'DISTANCE KM', 'DISTANCE', 'KM TOTALI'],
    tariffAmount: ['TARIFFA', 'COSTO', 'NOLI', 'NOLI EUR', 'RATE', 'PRICE', 'AMOUNT', 'IMPORTO'],
    currency: ['VALUTA', 'CURRENCY'],
    vehicleType: ['TIPO MEZZO', 'MEZZO', 'VEHICLE TYPE', 'VEHICLE', 'EQUIPMENT'],
    serviceType: ['SERVIZIO', 'MODALITA', 'SERVICE', 'TRASPORTO'],
    validityFrom: ['VALIDITA DAL', 'VALID FROM', 'FROM DATE', 'START DATE'],
    validityTo: ['VALIDITA AL', 'VALID TO', 'TO DATE', 'END DATE'],
    paymentTerms: ['PAGAMENTO', 'PAYMENT', 'PAYMENT TERMS'],
    tollIncluded: ['PEDAGGIO INCLUSO', 'TOLL INCLUDED', 'PEDAGGIO'],
    fuelIncluded: ['FUEL INCLUSO', 'CARBURANTE INCLUSO', 'FUEL INCLUDED'],
    notes: ['NOTE', 'NOTES', 'COMMENTI', 'COMMENTS'],
    active: ['ATTIVO', 'ACTIVE', 'ABILITATO', 'ENABLED']
  };

  function mapHeaders(headerRow) {
    const resolved = {};
    const normalizedHeaders = (Array.isArray(headerRow) ? headerRow : []).map((cell) => normalizeHeader(cell));
    Object.entries(headerAliases).forEach(([field, aliases]) => {
      const index = normalizedHeaders.findIndex((header) => aliases.includes(header));
      if (index >= 0) resolved[field] = index;
    });
    return resolved;
  }

  function rowHasContent(row) {
    return (Array.isArray(row) ? row : []).some((cell) => cleanText(cell));
  }

  function importRoadRates(stateOrConfig, supplierRecord, matrix, options = {}) {
    const supplierName = cleanText(supplierRecord && (supplierRecord.name || supplierRecord.value) || '');
    const supplierId = cleanText(supplierRecord && supplierRecord.id || '');
    if (!supplierName) return { ok: false, reason: 'missing-supplier' };
    const rows = Array.isArray(matrix) ? matrix.filter((row) => rowHasContent(row)) : [];
    if (!rows.length) return { ok: false, reason: 'empty-matrix' };
    const headers = rows[0] || [];
    const mapping = mapHeaders(headers);
    if (typeof mapping.origin !== 'number' || typeof mapping.destination !== 'number') {
      return { ok: false, reason: 'missing-columns' };
    }
    const batchId = `IMP-${Date.now()}`;
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    rows.slice(1).forEach((row, index) => {
      const payload = {
        supplierId,
        supplierName,
        origin: mapping.origin >= 0 ? row[mapping.origin] : '',
        destination: mapping.destination >= 0 ? row[mapping.destination] : '',
        viaPoint: mapping.viaPoint >= 0 ? row[mapping.viaPoint] : '',
        distanceKm: mapping.distanceKm >= 0 ? row[mapping.distanceKm] : '',
        tariffAmount: mapping.tariffAmount >= 0 ? row[mapping.tariffAmount] : '',
        currency: mapping.currency >= 0 ? row[mapping.currency] : 'EUR',
        vehicleType: mapping.vehicleType >= 0 ? row[mapping.vehicleType] : '',
        serviceType: mapping.serviceType >= 0 ? row[mapping.serviceType] : '',
        validityFrom: mapping.validityFrom >= 0 ? row[mapping.validityFrom] : '',
        validityTo: mapping.validityTo >= 0 ? row[mapping.validityTo] : '',
        paymentTerms: mapping.paymentTerms >= 0 ? row[mapping.paymentTerms] : '',
        tollIncluded: mapping.tollIncluded >= 0 ? row[mapping.tollIncluded] : false,
        fuelIncluded: mapping.fuelIncluded >= 0 ? row[mapping.fuelIncluded] : false,
        notes: mapping.notes >= 0 ? row[mapping.notes] : '',
        active: mapping.active >= 0 ? row[mapping.active] : true,
        sourceType: 'excel-import',
        importBatchId: batchId,
        importSourceName: cleanText(options.fileName || options.sourceName || '')
      };
      if (!cleanText(payload.origin) && !cleanText(payload.destination)) {
        skipped += 1;
        return;
      }
      const result = saveRoadRate(stateOrConfig, payload);
      if (!result.ok) {
        errors.push({ row: index + 2, reason: result.reason || 'invalid-row' });
        skipped += 1;
        return;
      }
      if (result.updated) updated += 1;
      else imported += 1;
    });

    return {
      ok: imported + updated > 0,
      imported,
      updated,
      skipped,
      errors,
      batchId,
      sourceFormat: cleanText(options.sourceFormat || ''),
      sourceName: cleanText(options.fileName || options.sourceName || ''),
      mapping
    };
  }

  function getMetrics(items) {
    const list = Array.isArray(items) ? items : [];
    return {
      total: list.length,
      active: list.filter((item) => item && item.active !== false).length,
      withDistance: list.filter((item) => cleanText(item && item.distanceKm)).length,
      withTariff: list.filter((item) => cleanText(item && item.tariffAmount)).length,
      imported: list.filter((item) => cleanText(item && item.sourceType) === 'excel-import').length
    };
  }

  function scoreMatch(candidate, query) {
    const candidateOrigin = cleanUpper(candidate.origin);
    const candidateDestination = cleanUpper(candidate.destination);
    const queryOrigin = cleanUpper(query.origin);
    const queryDestination = cleanUpper(query.destination);
    const candidateVehicle = cleanUpper(candidate.vehicleType);
    const queryVehicle = cleanUpper(query.vehicleType);
    const candidateService = cleanUpper(candidate.serviceType);
    const queryService = cleanUpper(query.serviceType);

    let score = 0;
    let matchType = 'partial';

    if (candidateOrigin === queryOrigin && candidateDestination === queryDestination) {
      score += 100;
      matchType = 'exact';
    } else if (candidateOrigin === queryDestination && candidateDestination === queryOrigin) {
      score += 80;
      matchType = 'reverse';
    } else {
      if (queryOrigin && candidateOrigin.includes(queryOrigin)) score += 25;
      if (queryDestination && candidateDestination.includes(queryDestination)) score += 25;
    }

    if (queryVehicle && candidateVehicle === queryVehicle) score += 15;
    if (queryService && candidateService === queryService) score += 10;
    if (cleanText(candidate.distanceKm)) score += 5;
    if (cleanText(candidate.tariffAmount)) score += 5;

    return { score, matchType };
  }

  function matchRoute(stateOrConfig, supplierRecord, query = {}) {
    const list = listForSupplier(stateOrConfig, supplierRecord).filter((item) => item.active !== false);
    if (!list.length) return { ok: false, reason: 'no-rates' };
    const origin = cleanText(query.origin || '');
    const destination = cleanText(query.destination || '');
    if (!origin || !destination) return { ok: false, reason: 'missing-route' };
    const ranked = list
      .map((item) => ({ item, ...scoreMatch(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        const a = cleanText(right.item.updatedAt || right.item.validityFrom || '');
        const b = cleanText(left.item.updatedAt || left.item.validityFrom || '');
        return a.localeCompare(b);
      });
    if (!ranked.length) return { ok: false, reason: 'no-match' };
    return {
      ok: true,
      matchType: ranked[0].matchType,
      score: ranked[0].score,
      record: ranked[0].item
    };
  }

  return {
    ensureStore,
    normalizeRoadRate,
    createDraft,
    listForSupplier,
    saveRoadRate,
    getById,
    importRoadRates,
    getMetrics,
    matchRoute
  };
})();
