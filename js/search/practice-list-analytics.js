window.KedrixOnePracticeListAnalytics = (() => {
  'use strict';

  const Utils = window.KedrixOneUtils || {
    normalize: (value) => String(value || '').trim().toLowerCase()
  };

  function defaultFilters() {
    return {
      quick: '',
      status: 'all',
      direction: 'all',
      practiceType: '',
      reference: '',
      client: '',
      importer: '',
      exporter: '',
      consignee: '',
      container: '',
      booking: '',
      policy: '',
      vessel: '',
      origin: '',
      destination: '',
      dateFrom: '',
      dateTo: '',
      compareDateFrom: '',
      compareDateTo: ''
    };
  }

  function normalize(value) {
    return typeof Utils.normalize === 'function'
      ? Utils.normalize(value)
      : String(value || '').trim().toLowerCase();
  }

  function toDateValue(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const iso = raw.length >= 10 ? raw.slice(0, 10) : raw;
    const time = Date.parse(iso);
    return Number.isNaN(time) ? '' : new Date(time).toISOString().slice(0, 10);
  }

  function isInsideRange(value, from, to) {
    const current = toDateValue(value);
    if (!current) return false;
    const lower = toDateValue(from);
    const upper = toDateValue(to);
    if (lower && current < lower) return false;
    if (upper && current > upper) return false;
    return true;
  }

  function extractValues(practice = {}) {
    const dynamicData = practice && practice.dynamicData && typeof practice.dynamicData === 'object'
      ? practice.dynamicData
      : {};

    return {
      reference: practice.reference || practice.id || '',
      client: practice.clientName || practice.client || '',
      practiceType: practice.practiceType || '',
      status: practice.status || '',
      practiceDate: practice.practiceDate || practice.eta || '',
      importer: dynamicData.importer || practice.importer || '',
      exporter: dynamicData.shipper || dynamicData.exporter || practice.shipper || practice.exporter || '',
      consignee: dynamicData.consignee || practice.consignee || '',
      container: dynamicData.containerCode || practice.containerCode || '',
      booking: dynamicData.booking || practice.booking || '',
      policy: dynamicData.policyNumber || practice.policyNumber || practice.mbl || practice.mawb || '',
      vessel: dynamicData.vesselVoyage || dynamicData.vessel || practice.vessel || '',
      origin: dynamicData.portLoading || dynamicData.airportDeparture || dynamicData.origin || practice.portLoading || '',
      destination: dynamicData.portDischarge || dynamicData.airportDestination || dynamicData.deliveryPlace || dynamicData.destination || practice.portDischarge || practice.port || ''
    };
  }

  function matchesDirection(practiceType, direction) {
    const type = normalize(practiceType);
    const wanted = normalize(direction);
    if (!wanted || wanted === 'all') return true;
    if (wanted === 'import') return type.includes('import');
    if (wanted === 'export') return type.includes('export');
    if (wanted === 'warehouse') return type.includes('warehouse') || type.includes('magazzino');
    return type === wanted;
  }

  function matchesText(haystack, needle) {
    const wanted = normalize(needle);
    if (!wanted) return true;
    if (Array.isArray(haystack)) return haystack.some((item) => normalize(item).includes(wanted));
    return normalize(haystack).includes(wanted);
  }

  function matchesQuickFilter(practice, values, quick) {
    const wanted = normalize(quick);
    if (!wanted) return true;
    const dynamicValues = practice && practice.dynamicData && typeof practice.dynamicData === 'object'
      ? Object.values(practice.dynamicData)
      : [];
    const searchable = [
      values.reference,
      values.client,
      values.practiceType,
      values.importer,
      values.exporter,
      values.consignee,
      values.container,
      values.booking,
      values.policy,
      values.vessel,
      values.origin,
      values.destination,
      practice.goodsDescription,
      practice.customsOffice,
      ...dynamicValues
    ];
    return searchable.some((value) => matchesText(value, wanted));
  }

  function filterPractices(practices = [], filters = {}) {
    const merged = { ...defaultFilters(), ...(filters || {}) };
    return (Array.isArray(practices) ? practices : []).filter((practice) => {
      const values = extractValues(practice);
      if (!matchesQuickFilter(practice, values, merged.quick)) return false;
      if (merged.status && merged.status !== 'all' && normalize(values.status) !== normalize(merged.status)) return false;
      if (!matchesDirection(values.practiceType, merged.direction)) return false;
      if (merged.practiceType && normalize(values.practiceType) !== normalize(merged.practiceType)) return false;
      if (!matchesText(values.reference, merged.reference)) return false;
      if (!matchesText(values.client, merged.client)) return false;
      if (!matchesText(values.importer, merged.importer)) return false;
      if (!matchesText(values.exporter, merged.exporter)) return false;
      if (!matchesText(values.consignee, merged.consignee)) return false;
      if (!matchesText(values.container, merged.container)) return false;
      if (!matchesText(values.booking, merged.booking)) return false;
      if (!matchesText(values.policy, merged.policy)) return false;
      if (!matchesText(values.vessel, merged.vessel)) return false;
      if (!matchesText(values.origin, merged.origin)) return false;
      if (!matchesText(values.destination, merged.destination)) return false;
      const hasDateScope = merged.dateFrom || merged.dateTo;
      if (hasDateScope && !isInsideRange(values.practiceDate, merged.dateFrom, merged.dateTo)) return false;
      return true;
    });
  }

  function summarizeRange(practices = []) {
    const source = Array.isArray(practices) ? practices : [];
    return {
      count: source.length,
      importCount: source.filter((practice) => normalize(practice.practiceType).includes('import')).length,
      exportCount: source.filter((practice) => normalize(practice.practiceType).includes('export')).length,
      warehouseCount: source.filter((practice) => {
        const type = normalize(practice.practiceType);
        return type.includes('warehouse') || type.includes('magazzino');
      }).length
    };
  }

  function buildMetrics(practices = [], filters = {}) {
    const merged = { ...defaultFilters(), ...(filters || {}) };
    const primary = filterPractices(practices, merged);
    const compareEnabled = Boolean(merged.compareDateFrom || merged.compareDateTo);
    const baseWithoutPrimaryDates = {
      ...merged,
      dateFrom: merged.compareDateFrom || '',
      dateTo: merged.compareDateTo || ''
    };
    const comparison = compareEnabled ? filterPractices(practices, baseWithoutPrimaryDates) : [];
    const primarySummary = summarizeRange(primary);
    const comparisonSummary = summarizeRange(comparison);

    return {
      primary,
      comparison,
      primaryCount: primarySummary.count,
      compareCount: comparisonSummary.count,
      deltaCount: primarySummary.count - comparisonSummary.count,
      primaryImportCount: primarySummary.importCount,
      primaryExportCount: primarySummary.exportCount,
      primaryWarehouseCount: primarySummary.warehouseCount,
      compareImportCount: comparisonSummary.importCount,
      compareExportCount: comparisonSummary.exportCount,
      compareWarehouseCount: comparisonSummary.warehouseCount,
      compareEnabled,
      totalScopedCount: primarySummary.count
    };
  }

  return {
    defaultFilters,
    extractValues,
    filterPractices,
    buildMetrics
  };
})();
