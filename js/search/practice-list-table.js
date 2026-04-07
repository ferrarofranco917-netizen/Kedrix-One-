window.KedrixOnePracticeListTable = (() => {
  'use strict';

  const Utils = window.KedrixOneUtils || {
    normalize: (value) => String(value || '').trim().toUpperCase()
  };
  const Analytics = window.KedrixOnePracticeListAnalytics || null;

  function normalize(value) {
    return Utils.normalize ? Utils.normalize(value) : String(value || '').trim().toUpperCase();
  }

  function cleanDate(value) {
    const raw = String(value || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
  }

  function safeString(value) {
    return String(value || '').trim();
  }

  function defaultSort() {
    return {
      sortBy: 'practiceDate',
      sortDirection: 'desc'
    };
  }

  function normalizeSortBy(value) {
    const allowed = new Set(['practiceDate', 'reference', 'client', 'importer', 'destination', 'status', 'practiceType']);
    const safe = String(value || '').trim();
    return allowed.has(safe) ? safe : 'practiceDate';
  }

  function normalizeSortDirection(value) {
    return String(value || '').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
  }

  function sortOptions(t) {
    const label = (key, fallback) => (t && typeof t.t === 'function' ? t.t(key, fallback) : fallback);
    return [
      { value: 'practiceDate', label: label('ui.practiceListSortByDate', 'Data pratica') },
      { value: 'reference', label: label('ui.practiceListSortByReference', 'Numero pratica') },
      { value: 'client', label: label('ui.practiceListSortByClient', 'Cliente') },
      { value: 'importer', label: label('ui.practiceListSortByImporter', 'Importatore') },
      { value: 'destination', label: label('ui.practiceListSortByDestination', 'Destinazione') },
      { value: 'status', label: label('ui.practiceListSortByStatus', 'Stato') },
      { value: 'practiceType', label: label('ui.practiceListSortByType', 'Tipologia') }
    ];
  }

  function directionOptions(t) {
    const label = (key, fallback) => (t && typeof t.t === 'function' ? t.t(key, fallback) : fallback);
    return [
      { value: 'desc', label: label('ui.sortDirectionDesc', 'Discendente') },
      { value: 'asc', label: label('ui.sortDirectionAsc', 'Ascendente') }
    ];
  }

  function extractValues(practice) {
    if (Analytics && typeof Analytics.extractValues === 'function') {
      return Analytics.extractValues(practice);
    }
    return {
      reference: safeString(practice?.reference || practice?.generatedReference || practice?.id),
      client: safeString(practice?.clientName || practice?.client),
      importer: safeString(practice?.importer),
      destination: safeString(practice?.destination || practice?.port),
      practiceDate: cleanDate(practice?.practiceDate || practice?.eta),
      status: safeString(practice?.status),
      practiceType: safeString(practice?.practiceTypeLabel || practice?.practiceType)
    };
  }

  function compareValues(left, right, type = 'text') {
    if (type === 'date') {
      const a = cleanDate(left);
      const b = cleanDate(right);
      if (!a && !b) return 0;
      if (!a) return -1;
      if (!b) return 1;
      return a.localeCompare(b);
    }
    if (type === 'number') return Number(left || 0) - Number(right || 0);
    return normalize(left).localeCompare(normalize(right));
  }

  function sorterFor(sortBy) {
    switch (normalizeSortBy(sortBy)) {
      case 'reference':
        return { type: 'text', pick: (practice, values) => values.reference || practice?.reference || practice?.id || '' };
      case 'client':
        return { type: 'text', pick: (practice, values) => values.client || practice?.clientName || practice?.client || '' };
      case 'importer':
        return { type: 'text', pick: (practice, values) => values.importer || practice?.importer || '' };
      case 'destination':
        return { type: 'text', pick: (practice, values) => values.destination || practice?.port || '' };
      case 'status':
        return { type: 'text', pick: (practice, values) => values.status || practice?.status || '' };
      case 'practiceType':
        return { type: 'text', pick: (practice, values) => values.practiceType || practice?.practiceTypeLabel || practice?.practiceType || '' };
      case 'practiceDate':
      default:
        return { type: 'date', pick: (practice, values) => values.practiceDate || practice?.practiceDate || practice?.eta || '' };
    }
  }

  function sortPractices(practices = [], filters = {}) {
    const sortBy = normalizeSortBy(filters.sortBy);
    const sortDirection = normalizeSortDirection(filters.sortDirection);
    const config = sorterFor(sortBy);
    const decorated = (Array.isArray(practices) ? practices : []).map((practice, index) => ({
      practice,
      index,
      values: extractValues(practice)
    }));
    decorated.sort((left, right) => {
      const primary = compareValues(
        config.pick(left.practice, left.values),
        config.pick(right.practice, right.values),
        config.type
      );
      if (primary !== 0) return sortDirection === 'asc' ? primary : -primary;
      const dateTie = compareValues(left.values.practiceDate, right.values.practiceDate, 'date');
      if (dateTie !== 0) return sortDirection === 'asc' ? dateTie : -dateTie;
      const referenceTie = compareValues(left.values.reference, right.values.reference, 'text');
      if (referenceTie !== 0) return referenceTie;
      return left.index - right.index;
    });
    return decorated.map((item) => item.practice);
  }

  function buildDirectionRows(metrics = {}) {
    return [
      {
        key: 'import',
        labelKey: 'ui.importWord',
        fallback: 'Import',
        active: Number(metrics.primaryImportCount || 0),
        compare: Number(metrics.compareImportCount || 0)
      },
      {
        key: 'export',
        labelKey: 'ui.exportWord',
        fallback: 'Export',
        active: Number(metrics.primaryExportCount || 0),
        compare: Number(metrics.compareExportCount || 0)
      },
      {
        key: 'warehouse',
        labelKey: 'ui.typeWarehouse',
        fallback: 'Magazzino',
        active: Number(metrics.primaryWarehouseCount || 0),
        compare: Number(metrics.compareWarehouseCount || 0)
      }
    ].map((row) => ({ ...row, delta: row.active - row.compare }));
  }

  return {
    defaultSort,
    sortOptions,
    directionOptions,
    normalizeSortBy,
    normalizeSortDirection,
    sortPractices,
    buildDirectionRows
  };
})();
