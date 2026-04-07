window.KedrixOnePracticeListAnalytics = (() => {
  'use strict';

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
    return String(value || '').trim().toLowerCase();
  }

  function normalizeDate(value) {
    const raw = String(value || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
  }

  function directionOf(practice = {}) {
    const type = normalize(practice.practiceType);
    if (type.includes('import')) return 'import';
    if (type.includes('export')) return 'export';
    if (type.includes('warehouse')) return 'warehouse';
    return '';
  }

  function scopedDate(practice = {}) {
    return normalizeDate(practice.practiceDate || practice.eta || '');
  }

  function collectValues(practice = {}) {
    const dynamicData = practice.dynamicData && typeof practice.dynamicData === 'object' ? practice.dynamicData : {};
    return [
      practice.reference, practice.client, practice.clientName, practice.id, practice.practiceType, practice.status,
      practice.importer, practice.exporter, practice.shipper, practice.consignee, practice.containerCode,
      practice.booking, practice.policyNumber, practice.mbl, practice.hbl, practice.mawb, practice.hawb,
      practice.cmr, practice.carrier, practice.airline, practice.vessel, practice.vesselName, practice.voyage,
      practice.portLoading, practice.portDischarge, practice.origin, practice.destination, practice.port,
      dynamicData.importer, dynamicData.exporter, dynamicData.shipper, dynamicData.sender, dynamicData.consignee,
      dynamicData.containerCode, dynamicData.booking, dynamicData.policyNumber, dynamicData.mbl, dynamicData.hbl,
      dynamicData.mawb, dynamicData.hawb, dynamicData.cmr, dynamicData.vessel, dynamicData.vesselName,
      dynamicData.voyage, dynamicData.portLoading, dynamicData.portDischarge, dynamicData.origin, dynamicData.destination,
      ...Object.values(dynamicData)
    ];
  }

  function matchesText(value, query) {
    if (!query) return true;
    if (Array.isArray(value)) return value.some((item) => matchesText(item, query));
    return normalize(value).includes(query);
  }

  function inRange(dateValue, fromValue, toValue) {
    const date = normalizeDate(dateValue);
    const from = normalizeDate(fromValue);
    const to = normalizeDate(toValue);
    if (!from && !to) return true;
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  }

  function filterPractices(practices = [], filters = {}) {
    const active = { ...defaultFilters(), ...(filters || {}) };
    const quick = normalize(active.quick);
    const status = normalize(active.status);
    const direction = normalize(active.direction);
    const practiceType = normalize(active.practiceType);
    const reference = normalize(active.reference);
    const client = normalize(active.client);
    const importer = normalize(active.importer);
    const exporter = normalize(active.exporter);
    const consignee = normalize(active.consignee);
    const container = normalize(active.container);
    const booking = normalize(active.booking);
    const policy = normalize(active.policy);
    const vessel = normalize(active.vessel);
    const origin = normalize(active.origin);
    const destination = normalize(active.destination);

    return (Array.isArray(practices) ? practices : []).filter((practice) => {
      const dynamicData = practice.dynamicData && typeof practice.dynamicData === 'object' ? practice.dynamicData : {};
      const effectiveDirection = directionOf(practice);
      if (status && status !== 'all' && normalize(practice.status) !== status) return false;
      if (direction && direction !== 'all' && effectiveDirection !== direction) return false;
      if (practiceType && normalize(practice.practiceType) !== practiceType) return false;
      if (!matchesText(practice.reference, reference)) return false;
      if (!matchesText([practice.client, practice.clientName], client)) return false;
      if (!matchesText([practice.importer, dynamicData.importer], importer)) return false;
      if (!matchesText([practice.exporter, practice.shipper, dynamicData.exporter, dynamicData.shipper, dynamicData.sender], exporter)) return false;
      if (!matchesText([practice.consignee, dynamicData.consignee], consignee)) return false;
      if (!matchesText([practice.containerCode, dynamicData.containerCode], container)) return false;
      if (!matchesText([practice.booking, dynamicData.booking], booking)) return false;
      if (!matchesText([practice.policyNumber, practice.mbl, dynamicData.policyNumber, dynamicData.mbl], policy)) return false;
      if (!matchesText([practice.vessel, practice.vesselName, dynamicData.vessel, dynamicData.vesselName, dynamicData.voyage], vessel)) return false;
      if (!matchesText([practice.portLoading, practice.origin, dynamicData.portLoading, dynamicData.origin], origin)) return false;
      if (!matchesText([practice.portDischarge, practice.destination, practice.port, dynamicData.portDischarge, dynamicData.destination], destination)) return false;
      if (!inRange(scopedDate(practice), active.dateFrom, active.dateTo)) return false;
      if (quick && !matchesText(collectValues(practice), quick)) return false;
      return true;
    });
  }

  function countByDirection(practices = [], direction = '') {
    return (Array.isArray(practices) ? practices : []).filter((practice) => directionOf(practice) === direction).length;
  }

  function buildMetrics(practices = [], filters = {}) {
    const active = { ...defaultFilters(), ...(filters || {}) };
    const primary = filterPractices(practices, active);
    const compareEnabled = Boolean(normalizeDate(active.compareDateFrom) || normalizeDate(active.compareDateTo));
    const comparison = compareEnabled
      ? filterPractices(practices, { ...active, dateFrom: active.compareDateFrom, dateTo: active.compareDateTo, compareDateFrom: '', compareDateTo: '' })
      : [];

    return {
      primary,
      comparison,
      primaryCount: primary.length,
      compareCount: comparison.length,
      deltaCount: primary.length - comparison.length,
      primaryImportCount: countByDirection(primary, 'import'),
      primaryExportCount: countByDirection(primary, 'export'),
      primaryWarehouseCount: countByDirection(primary, 'warehouse'),
      compareImportCount: countByDirection(comparison, 'import'),
      compareExportCount: countByDirection(comparison, 'export'),
      compareWarehouseCount: countByDirection(comparison, 'warehouse'),
      compareEnabled,
      totalScopedCount: primary.length
    };
  }

  return {
    defaultFilters,
    buildMetrics,
    collectValues,
    filterPractices
  };
})();
