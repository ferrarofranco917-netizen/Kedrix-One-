window.KedrixOnePracticeListAnalytics = (() => {
  'use strict';

  const Utils = window.KedrixOneUtils || {
    normalize: (value) => String(value || '').trim().toUpperCase()
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
    return Utils.normalize ? Utils.normalize(value) : String(value || '').trim().toUpperCase();
  }

  function asText(value) {
    if (Array.isArray(value)) return value.join(' ');
    if (value === undefined || value === null) return '';
    return String(value);
  }

  function cleanDate(value) {
    const raw = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
    return raw;
  }

  function directionOf(practice) {
    const type = String(practice?.practiceType || '').toLowerCase();
    if (type.includes('import')) return 'import';
    if (type.includes('export')) return 'export';
    if (type.includes('warehouse')) return 'warehouse';
    return '';
  }

  function extractDynamic(practice) {
    return practice && practice.dynamicData && typeof practice.dynamicData === 'object'
      ? practice.dynamicData
      : {};
  }

  function firstFilled(...values) {
    for (const value of values) {
      if (Array.isArray(value) && value.length) return value;
      if (String(value || '').trim()) return value;
    }
    return '';
  }

  function extractValues(practice) {
    const dynamic = extractDynamic(practice);
    const practiceDate = cleanDate(
      firstFilled(
        practice?.practiceDate,
        dynamic.practiceDate,
        practice?.eta,
        practice?.etd,
        dynamic.eta,
        dynamic.etd
      )
    );

    return {
      reference: asText(firstFilled(practice?.reference, practice?.generatedReference, practice?.id)),
      client: asText(firstFilled(practice?.clientName, practice?.client, dynamic.clientName, dynamic.client)),
      importer: asText(firstFilled(practice?.importer, dynamic.importer, dynamic.importerName)),
      exporter: asText(firstFilled(practice?.exporter, practice?.shipper, dynamic.exporter, dynamic.shipper, dynamic.sender)),
      consignee: asText(firstFilled(practice?.consignee, dynamic.consignee)),
      container: asText(firstFilled(practice?.containerCode, dynamic.containerCode, dynamic.container, practice?.container)),
      booking: asText(firstFilled(practice?.booking, dynamic.booking)),
      policy: asText(firstFilled(practice?.policyNumber, practice?.mbl, practice?.mawb, practice?.hbl, practice?.hawb, dynamic.policyNumber, dynamic.mbl, dynamic.mawb, dynamic.hbl, dynamic.hawb)),
      vessel: asText(firstFilled(practice?.vessel, practice?.vesselName, dynamic.vessel, dynamic.vesselName, dynamic.voyageVessel, practice?.voyageVessel)),
      origin: asText(firstFilled(practice?.origin, dynamic.origin, practice?.originDestination, dynamic.originDestination, practice?.portLoading, dynamic.portLoading, practice?.airportDeparture, dynamic.airportDeparture)),
      destination: asText(firstFilled(practice?.destination, dynamic.destination, practice?.port, dynamic.port, practice?.portDischarge, dynamic.portDischarge, practice?.airportDestination, dynamic.airportDestination)),
      practiceDate,
      direction: directionOf(practice),
      practiceType: String(practice?.practiceType || '').trim(),
      status: String(practice?.status || '').trim()
    };
  }

  function includesFilter(source, expected) {
    const needle = normalize(expected);
    if (!needle) return true;
    return normalize(source).includes(needle);
  }

  function inRange(value, from, to) {
    if (!from && !to) return true;
    const safeValue = cleanDate(value);
    if (!safeValue) return false;
    if (from && safeValue < from) return false;
    if (to && safeValue > to) return false;
    return true;
  }

  function applyBaseFilters(practices = [], filters = {}) {
    return (Array.isArray(practices) ? practices : []).filter((practice) => {
      const values = extractValues(practice);
      const quickMatches = !String(filters.quick || '').trim()
        || [
          values.reference,
          values.client,
          values.importer,
          values.exporter,
          values.consignee,
          values.container,
          values.booking,
          values.policy,
          values.vessel,
          values.origin,
          values.destination,
          practice?.id,
          practice?.category,
          practice?.practiceTypeLabel,
          practice?.goodsDescription,
          practice?.terminal
        ].some((item) => includesFilter(item, filters.quick));

      const statusMatches = !filters.status || filters.status === 'all' || includesFilter(values.status, filters.status);
      const directionMatches = !filters.direction || filters.direction === 'all' || values.direction === String(filters.direction || '').toLowerCase();
      const typeMatches = !filters.practiceType || values.practiceType === String(filters.practiceType || '').trim();

      return quickMatches
        && statusMatches
        && directionMatches
        && typeMatches
        && includesFilter(values.reference, filters.reference)
        && includesFilter(values.client, filters.client)
        && includesFilter(values.importer, filters.importer)
        && includesFilter(values.exporter, filters.exporter)
        && includesFilter(values.consignee, filters.consignee)
        && includesFilter(values.container, filters.container)
        && includesFilter(values.booking, filters.booking)
        && includesFilter(values.policy, filters.policy)
        && includesFilter(values.vessel, filters.vessel)
        && includesFilter(values.origin, filters.origin)
        && includesFilter(values.destination, filters.destination);
    });
  }

  function filterPractices(practices = [], filters = {}) {
    const base = applyBaseFilters(practices, filters);
    const from = cleanDate(filters.dateFrom);
    const to = cleanDate(filters.dateTo);
    if (!from && !to) return base;
    return base.filter((practice) => inRange(extractValues(practice).practiceDate, from, to));
  }

  function countByDirection(practices = [], direction) {
    return (Array.isArray(practices) ? practices : []).filter((practice) => extractValues(practice).direction === direction).length;
  }

  function buildMetrics(practices = [], filters = {}) {
    const scoped = applyBaseFilters(practices, filters);
    const primary = filterPractices(scoped, {
      ...filters,
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
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    });
    const compareFrom = cleanDate(filters.compareDateFrom);
    const compareTo = cleanDate(filters.compareDateTo);
    const comparison = (compareFrom || compareTo)
      ? scoped.filter((practice) => inRange(extractValues(practice).practiceDate, compareFrom, compareTo))
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
      compareEnabled: Boolean(compareFrom || compareTo),
      totalScopedCount: scoped.length
    };
  }

  return {
    defaultFilters,
    extractValues,
    filterPractices,
    buildMetrics
  };
})();
