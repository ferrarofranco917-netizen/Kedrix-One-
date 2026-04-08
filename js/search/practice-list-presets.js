window.KedrixOnePracticeListPresets = (() => {
  'use strict';

  const Analytics = window.KedrixOnePracticeListAnalytics || null;

  function defaultFilters() {
    return Analytics && typeof Analytics.defaultFilters === 'function'
      ? Analytics.defaultFilters()
      : {
          quick: '', status: 'all', draftState: 'all', direction: 'all', practiceType: '', reference: '', client: '', importer: '', exporter: '', consignee: '', container: '', booking: '', policy: '', vessel: '', origin: '', destination: '', dateFrom: '', dateTo: '', compareDateFrom: '', compareDateTo: '', sortBy: 'practiceDate', sortDirection: 'desc'
        };
  }

  function list(t) {
    const translate = typeof t === 'function' ? t : ((_, fallback) => fallback || '');
    return [
      {
        id: 'all',
        label: translate('ui.practiceListPresetAll', 'Tutte'),
        description: translate('ui.practiceListPresetAllHint', 'Azzera i filtri rapidi e torna alla vista completa della lista.')
      },
      {
        id: 'drafts',
        label: translate('ui.practiceListPresetDrafts', 'Bozze incomplete'),
        description: translate('ui.practiceListPresetDraftsHint', 'Mostra solo le pratiche ancora salvate come bozza incompleta.')
      },
      {
        id: 'waitingDocs',
        label: translate('ui.practiceListPresetWaitingDocs', 'In attesa documenti'),
        description: translate('ui.practiceListPresetWaitingDocsHint', 'Focalizza subito le pratiche ancora in attesa documenti.')
      },
      {
        id: 'import',
        label: translate('ui.practiceListPresetImport', 'Solo import'),
        description: translate('ui.practiceListPresetImportHint', 'Applica il focus alle pratiche import mantenendo il perimetro date corrente.')
      },
      {
        id: 'export',
        label: translate('ui.practiceListPresetExport', 'Solo export'),
        description: translate('ui.practiceListPresetExportHint', 'Applica il focus alle pratiche export mantenendo il perimetro date corrente.')
      }
    ];
  }

  function preserveTemporalAndOrdering(current = {}, base = {}) {
    return {
      ...base,
      dateFrom: String(current.dateFrom || '').trim(),
      dateTo: String(current.dateTo || '').trim(),
      compareDateFrom: String(current.compareDateFrom || '').trim(),
      compareDateTo: String(current.compareDateTo || '').trim(),
      sortBy: String(current.sortBy || base.sortBy || 'practiceDate').trim() || 'practiceDate',
      sortDirection: String(current.sortDirection || base.sortDirection || 'desc').trim() || 'desc'
    };
  }

  function applyPreset(currentFilters = {}, presetId = 'all') {
    const defaults = defaultFilters();
    const safeId = String(presetId || 'all').trim() || 'all';
    const next = preserveTemporalAndOrdering(currentFilters, defaults);

    switch (safeId) {
      case 'drafts':
        return {
          ...next,
          draftState: 'incomplete',
          status: 'all',
          direction: 'all',
          practiceType: '',
          quick: ''
        };
      case 'waitingDocs':
        return {
          ...next,
          draftState: 'all',
          status: 'In attesa documenti',
          direction: 'all',
          practiceType: '',
          quick: ''
        };
      case 'import':
        return {
          ...next,
          draftState: 'all',
          status: 'all',
          direction: 'import',
          practiceType: '',
          quick: ''
        };
      case 'export':
        return {
          ...next,
          draftState: 'all',
          status: 'all',
          direction: 'export',
          practiceType: '',
          quick: ''
        };
      case 'all':
      default:
        return {
          ...defaults,
          dateFrom: String(currentFilters.dateFrom || '').trim(),
          dateTo: String(currentFilters.dateTo || '').trim(),
          compareDateFrom: String(currentFilters.compareDateFrom || '').trim(),
          compareDateTo: String(currentFilters.compareDateTo || '').trim(),
          sortBy: String(currentFilters.sortBy || defaults.sortBy || 'practiceDate').trim() || 'practiceDate',
          sortDirection: String(currentFilters.sortDirection || defaults.sortDirection || 'desc').trim() || 'desc'
        };
    }
  }

  function detectActivePreset(filters = {}) {
    const draftState = String(filters.draftState || 'all').trim() || 'all';
    const status = String(filters.status || 'all').trim() || 'all';
    const direction = String(filters.direction || 'all').trim() || 'all';
    const quick = String(filters.quick || '').trim();
    const practiceType = String(filters.practiceType || '').trim();
    const hasOtherScopedFilters = [
      'reference', 'client', 'importer', 'exporter', 'consignee', 'container', 'booking', 'policy', 'vessel', 'origin', 'destination'
    ].some((key) => String(filters[key] || '').trim());

    if (!quick && !practiceType && !hasOtherScopedFilters) {
      if (draftState === 'incomplete' && status === 'all' && direction === 'all') return 'drafts';
      if (draftState === 'all' && status === 'In attesa documenti' && direction === 'all') return 'waitingDocs';
      if (draftState === 'all' && status === 'all' && direction === 'import') return 'import';
      if (draftState === 'all' && status === 'all' && direction === 'export') return 'export';
      if (draftState === 'all' && status === 'all' && direction === 'all') return 'all';
    }
    return '';
  }

  return {
    list,
    applyPreset,
    detectActivePreset
  };
})();
