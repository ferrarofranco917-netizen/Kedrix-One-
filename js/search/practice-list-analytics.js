window.KedrixOnePracticeListAnalytics = (() => {
  'use strict';
  function defaultFilters() {
    return { quick: '', status: 'all', direction: 'all', practiceType: '', reference: '', client: '', importer: '', exporter: '', consignee: '', container: '', booking: '', policy: '', vessel: '', origin: '', destination: '', dateFrom: '', dateTo: '', compareDateFrom: '', compareDateTo: '' };
  }
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function extractValues(practice = {}) {
    const dynamicData = practice.dynamicData && typeof practice.dynamicData === 'object' ? practice.dynamicData : {};
    return {
      reference: practice.reference || '', client: practice.clientName || practice.client || '', importer: practice.importer || dynamicData.importer || '', exporter: practice.shipper || dynamicData.shipper || '', consignee: practice.consignee || dynamicData.consignee || '', container: practice.containerCode || dynamicData.containerCode || '', booking: practice.booking || dynamicData.booking || '', policy: practice.policyNumber || practice.mbl || dynamicData.policyNumber || dynamicData.mbl || '', vessel: dynamicData.vesselVoyage || practice.vesselVoyage || '', origin: dynamicData.portLoading || dynamicData.airportDeparture || practice.portLoading || '', destination: dynamicData.portDischarge || dynamicData.airportDestination || practice.portDischarge || ''
    };
  }
  function matchesText(haystack, needle) { return !needle || normalize(haystack).includes(normalize(needle)); }
  function withinRange(dateValue, from, to) {
    const value = String(dateValue || '').slice(0, 10);
    if (!value) return false;
    if (from && value < from) return false;
    if (to && value > to) return false;
    return true;
  }
  function filterPractices(practices = [], filters = {}) {
    const active = { ...defaultFilters(), ...(filters || {}) };
    return (Array.isArray(practices) ? practices : []).filter((practice) => {
      const v = extractValues(practice);
      const quickText = [practice.reference, practice.clientName, practice.client, v.importer, v.exporter, v.consignee, v.container, v.booking, v.policy, v.origin, v.destination].join(' ');
      if (!matchesText(quickText, active.quick)) return false;
      if (active.status && active.status !== 'all' && normalize(practice.status) !== normalize(active.status)) return false;
      if (active.direction && active.direction !== 'all' && normalize(practice.type || '') !== normalize(active.direction)) return false;
      if (active.practiceType && normalize(practice.practiceType) != normalize(active.practiceType)) return false;
      for (const [key, value] of Object.entries({ reference:v.reference, client:v.client, importer:v.importer, exporter:v.exporter, consignee:v.consignee, container:v.container, booking:v.booking, policy:v.policy, vessel:v.vessel, origin:v.origin, destination:v.destination })) {
        if (!matchesText(value, active[key])) return false;
      }
      if ((active.dateFrom || active.dateTo) && !withinRange(practice.practiceDate || practice.eta, active.dateFrom, active.dateTo)) return false;
      return true;
    });
  }
  function buildMetrics(practices = [], filters = {}) {
    const filtered = filterPractices(practices, filters);
    return { total: filtered.length, importCount: filtered.filter((item) => normalize(item.type) === 'import').length, exportCount: filtered.filter((item) => normalize(item.type) === 'export').length };
  }
  return { defaultFilters, extractValues, filterPractices, buildMetrics };
})();
