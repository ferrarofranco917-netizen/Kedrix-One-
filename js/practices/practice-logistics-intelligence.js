window.KedrixOnePracticeLogisticsIntelligence = (() => {
  'use strict';

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function text(value, fallback = '') {
    if (value === null || value === undefined) return String(fallback || '').trim();
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
    if (Array.isArray(value)) return value.map((entry) => text(entry, '')).filter(Boolean).join(', ');
    if (typeof value === 'object') {
      const candidates = [value.displayValue, value.label, value.value, value.name, value.code, value.city, value.id];
      for (const candidate of candidates) {
        const resolved = text(candidate, '');
        if (resolved) return resolved;
      }
    }
    return String(fallback || '').trim();
  }

  function normalize(value) {
    return text(value, '').toUpperCase();
  }

  function includesAny(value, tokens = []) {
    const normalized = normalize(value);
    return tokens.some((token) => normalized.includes(String(token || '').toUpperCase()));
  }

  function getDraftValue(draft, fieldName) {
    if (!draft || !fieldName) return '';
    if (fieldName === 'category') return text(draft?.dynamicData?.category, '') || text(draft?.category, '');
    if (fieldName === 'client') return text(draft?.dynamicData?.client, '') || text(draft?.clientName, '');
    return text(draft?.dynamicData?.[fieldName], '');
  }

  function findItem(items = [], fieldName) {
    return (Array.isArray(items) ? items : []).find((item) => String(item.fieldName || '') === String(fieldName || '')) || null;
  }

  function buildFlags(context = {}) {
    const draft = context.draft || {};
    const type = String(context.type || draft.practiceType || '').trim();
    const category = getDraftValue(draft, 'category');
    const transportUnitType = getDraftValue(draft, 'transportUnitType');
    const containerCode = getDraftValue(draft, 'containerCode');
    const deposit = getDraftValue(draft, 'deposit');
    const linkedTo = getDraftValue(draft, 'linkedTo');
    const customsOffice = getDraftValue(draft, 'customsOffice');

    const sea = type.startsWith('sea_');
    const road = type.startsWith('road_');
    const air = type.startsWith('air_');
    const warehouse = type === 'warehouse';
    const isFcl = sea && (
      includesAny(category, ['FCL']) ||
      includesAny(transportUnitType, ['CONTAINER', 'STANDARD', 'BULK']) ||
      Boolean(containerCode)
    );
    const isLcl = sea && (
      includesAny(category, ['LCL', 'GROUPAGE']) ||
      includesAny(transportUnitType, ['LCL', 'GROUPAGE'])
    );
    const hasWarehouseLeg = Boolean(deposit || linkedTo || warehouse);
    const hasContainerLeg = Boolean(containerCode || isFcl);
    let flowLabel = text(category, '') || text(transportUnitType, '');

    if (!flowLabel) {
      if (warehouse) flowLabel = t(context.i18n, 'ui.typeWarehouse', 'Warehouse');
      else if (road) flowLabel = t(context.i18n, type === 'road_import' ? 'ui.typeRoadImport' : 'ui.typeRoadExport', type === 'road_import' ? 'Road Import' : 'Road Export');
      else if (air) flowLabel = t(context.i18n, type === 'air_import' ? 'ui.typeAirImport' : 'ui.typeAirExport', type === 'air_import' ? 'Air Import' : 'Air Export');
      else if (sea) flowLabel = t(context.i18n, type === 'sea_import' ? 'ui.typeSeaImport' : 'ui.typeSeaExport', type === 'sea_import' ? 'Sea Import' : 'Sea Export');
    }

    return {
      type,
      category,
      transportUnitType,
      containerCode,
      deposit,
      linkedTo,
      customsOffice,
      sea,
      road,
      air,
      warehouse,
      isFcl,
      isLcl,
      hasWarehouseLeg,
      hasContainerLeg,
      flowLabel
    };
  }

  function buildDirective(context = {}, item = {}, sectionKey = '', flags = {}, supportItems = [], routeItems = []) {
    const fieldName = String(item.fieldName || '').trim();
    const hasValue = Boolean(item.value);
    const portLoading = findItem(routeItems, 'portLoading');
    const portDischarge = findItem(routeItems, 'portDischarge');
    const pickupPlace = findItem(routeItems, 'pickupPlace');
    const deliveryPlace = findItem(routeItems, 'deliveryPlace');
    const depositItem = findItem(supportItems, 'deposit') || item;
    const linkedToItem = findItem(supportItems, 'linkedTo') || item;

    if (flags.sea && sectionKey === 'route' && fieldName === 'terminal') {
      if (hasValue) {
        return {
          status: 'ready',
          presentHelperKey: 'ui.practiceLogisticsItemContextReady',
          presentHelperFallback: 'Nodo attivo sul flusso',
          pillTone: 'success'
        };
      }
      if (flags.isFcl || flags.hasContainerLeg) {
        return {
          status: 'attention',
          missingHelperKey: 'ui.practiceLogisticsConditionalTerminal',
          missingHelperFallback: 'Meglio chiarire il terminal per la tratta containerizzata.',
          pillTone: 'warning'
        };
      }
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemInactive',
        missingHelperFallback: 'Non attivo per questo flusso',
        pillTone: 'default'
      };
    }

    if (flags.road && sectionKey === 'route' && fieldName === 'originDest' && !hasValue) {
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemConditional',
        missingHelperFallback: 'Riepilogo tratta utile ma non bloccante',
        pillTone: 'default'
      };
    }

    if (flags.sea && sectionKey === 'support' && fieldName === 'terminalPickup') {
      if (hasValue) {
        return {
          status: 'ready',
          presentHelperKey: 'ui.practiceLogisticsItemContextReady',
          presentHelperFallback: 'Nodo attivo sul flusso',
          pillTone: 'success'
        };
      }
      if (flags.isFcl || flags.hasContainerLeg || flags.hasWarehouseLeg) {
        return {
          status: 'attention',
          missingHelperKey: 'ui.practiceLogisticsConditionalTerminalPickup',
          missingHelperFallback: 'Meglio chiarire il terminal di ritiro per l’ultimo miglio.',
          pillTone: 'warning'
        };
      }
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemInactive',
        missingHelperFallback: 'Non attivo per questo flusso',
        pillTone: 'default'
      };
    }

    if (flags.sea && sectionKey === 'support' && fieldName === 'terminalDelivery') {
      if (hasValue) {
        return {
          status: 'ready',
          presentHelperKey: 'ui.practiceLogisticsItemContextReady',
          presentHelperFallback: 'Nodo attivo sul flusso',
          pillTone: 'success'
        };
      }
      if (flags.isFcl || flags.hasContainerLeg || flags.hasWarehouseLeg) {
        return {
          status: 'attention',
          missingHelperKey: 'ui.practiceLogisticsConditionalTerminalDelivery',
          missingHelperFallback: 'Meglio chiarire il terminal di resa per chiudere il ramo logistico.',
          pillTone: 'warning'
        };
      }
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemInactive',
        missingHelperFallback: 'Non attivo per questo flusso',
        pillTone: 'default'
      };
    }

    if (flags.sea && sectionKey === 'support' && fieldName === 'deposit') {
      if (hasValue) {
        return {
          status: 'ready',
          presentHelperKey: 'ui.practiceLogisticsItemContextReady',
          presentHelperFallback: 'Nodo attivo sul flusso',
          pillTone: 'success'
        };
      }
      if (flags.hasWarehouseLeg || Boolean(linkedToItem?.value)) {
        return {
          status: 'attention',
          missingHelperKey: 'ui.practiceLogisticsConditionalDeposit',
          missingHelperFallback: 'Manca il deposito sul ramo operativo attivo.',
          pillTone: 'warning'
        };
      }
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemInactive',
        missingHelperFallback: 'Non attivo per questo flusso',
        pillTone: 'default'
      };
    }

    if (flags.sea && sectionKey === 'support' && fieldName === 'linkedTo') {
      if (hasValue) {
        return {
          status: 'ready',
          presentHelperKey: 'ui.practiceLogisticsItemContextReady',
          presentHelperFallback: 'Nodo attivo sul flusso',
          pillTone: 'success'
        };
      }
      if (Boolean(depositItem?.value)) {
        return {
          status: 'attention',
          missingHelperKey: 'ui.practiceLogisticsConditionalLinkedTo',
          missingHelperFallback: 'Manca il collegamento operativo del ramo deposito.',
          pillTone: 'warning'
        };
      }
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemInactive',
        missingHelperFallback: 'Non attivo per questo flusso',
        pillTone: 'default'
      };
    }

    if (flags.sea && sectionKey === 'timing' && fieldName === 'unloadingDate') {
      if (hasValue) {
        return {
          status: 'ready',
          presentHelperKey: 'ui.practiceLogisticsItemContextReady',
          presentHelperFallback: 'Nodo attivo sul flusso',
          pillTone: 'success'
        };
      }
      if (flags.hasContainerLeg || flags.hasWarehouseLeg || Boolean(depositItem?.value) || Boolean(linkedToItem?.value)) {
        return {
          status: 'attention',
          missingHelperKey: 'ui.practiceLogisticsConditionalUnloading',
          missingHelperFallback: 'Meglio fissare lo scarico quando la tratta è già leggibile.',
          pillTone: 'warning'
        };
      }
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemInactive',
        missingHelperFallback: 'Non attivo per questo flusso',
        pillTone: 'default'
      };
    }

    if (flags.warehouse && sectionKey === 'support' && fieldName === 'customsOffice' && !hasValue) {
      const depositLabel = normalize(flags.deposit);
      if (depositLabel.includes('DOGAN')) {
        return {
          status: 'attention',
          missingHelperKey: 'ui.practiceLogisticsConditionalDeposit',
          missingHelperFallback: 'Manca il riferimento doganale sul ramo deposito attivo.',
          pillTone: 'warning'
        };
      }
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemInactive',
        missingHelperFallback: 'Non attivo per questo flusso',
        pillTone: 'default'
      };
    }

    if (flags.road && sectionKey === 'support' && !hasValue) {
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemInactive',
        missingHelperFallback: 'Non attivo per questo flusso',
        pillTone: 'default'
      };
    }

    if (flags.air && sectionKey === 'support' && !hasValue) {
      return {
        status: 'inactive',
        missingHelperKey: 'ui.practiceLogisticsItemInactive',
        missingHelperFallback: 'Non attivo per questo flusso',
        pillTone: 'default'
      };
    }

    if (flags.road && sectionKey === 'timing' && !hasValue && (fieldName === 'pickupDate' || fieldName === 'deliveryDate')) {
      return {
        status: 'critical',
        missingHelperKey: 'ui.practiceLogisticsItemMissingRequired',
        missingHelperFallback: 'Essenziale mancante',
        pillTone: 'danger'
      };
    }

    if (flags.road && sectionKey === 'route' && (fieldName === 'pickupPlace' || fieldName === 'deliveryPlace') && !hasValue) {
      return {
        status: 'critical',
        missingHelperKey: 'ui.practiceLogisticsItemMissingRequired',
        missingHelperFallback: 'Essenziale mancante',
        pillTone: 'danger'
      };
    }

    if (flags.air && sectionKey === 'route' && (fieldName === 'airportDeparture' || fieldName === 'airportDestination') && !hasValue) {
      return {
        status: 'critical',
        missingHelperKey: 'ui.practiceLogisticsItemMissingRequired',
        missingHelperFallback: 'Essenziale mancante',
        pillTone: 'danger'
      };
    }

    if (flags.air && sectionKey === 'timing' && (fieldName === 'arrivalDate' || fieldName === 'departureDate') && !hasValue) {
      return {
        status: 'critical',
        missingHelperKey: 'ui.practiceLogisticsItemMissingRequired',
        missingHelperFallback: 'Essenziale mancante',
        pillTone: 'danger'
      };
    }

    return null;
  }

  function applyDirective(item, directive, i18n) {
    if (!directive) return item;
    const hasValue = Boolean(item.value);
    const updated = { ...item };
    if (directive.status) updated.status = directive.status;
    if (hasValue && directive.presentHelperKey) {
      updated.helper = t(i18n, directive.presentHelperKey, directive.presentHelperFallback || item.helper || '');
    } else if (!hasValue && directive.missingHelperKey) {
      updated.helper = t(i18n, directive.missingHelperKey, directive.missingHelperFallback || item.helper || '');
    }
    if (directive.pillTone) updated.pillTone = directive.pillTone;
    return updated;
  }

  function annotateItems(context = {}, sectionKey = '', items = [], extra = {}) {
    const flags = extra.flags || buildFlags(context);
    const routeItems = Array.isArray(extra.routeItems) ? extra.routeItems : [];
    const supportItems = Array.isArray(extra.supportItems) ? extra.supportItems : [];
    return (Array.isArray(items) ? items : []).map((item) => {
      const directive = buildDirective(context, item, sectionKey, flags, supportItems, routeItems);
      return applyDirective(item, directive, context.i18n);
    });
  }

  function buildCoverage(context = {}, summary = {}) {
    const flags = summary.flags || buildFlags(context);
    const routeItems = Array.isArray(summary.routeItems) ? summary.routeItems : [];
    const supportItems = Array.isArray(summary.supportItems) ? summary.supportItems : [];
    const timingItems = Array.isArray(summary.timingItems) ? summary.timingItems : [];
    const issues = Array.isArray(summary.issues) ? summary.issues : [];
    const criticalCount = [...routeItems, ...timingItems].filter((item) => item.status === 'critical').length + issues.filter((issue) => issue.tone === 'danger').length;
    const attentionCount = [...routeItems, ...supportItems, ...timingItems].filter((item) => item.status === 'attention').length + issues.filter((issue) => issue.tone === 'warning').length;
    const supportAttention = supportItems.filter((item) => item.status === 'attention').length + timingItems.filter((item) => item.status === 'attention' && !item.required).length;
    const routeReady = routeItems.filter((item) => item.status !== 'inactive').every((item) => item.status === 'ready');
    const coreRouteReady = routeItems.filter((item) => item.required && item.status !== 'inactive').every((item) => item.status === 'ready');
    const hasActiveSupport = supportItems.some((item) => item.status !== 'inactive' || item.value) || timingItems.some((item) => !item.required && (item.status !== 'inactive' || item.value));

    if (criticalCount > 0) {
      return {
        tone: 'danger',
        label: t(context.i18n, 'ui.practiceLogisticsCoverageCritical', 'Tratta incompleta'),
        detail: t(context.i18n, 'ui.practiceLogisticsCoverageCriticalDetail', 'Mancano ancora nodi logistici core: chiudi prima la spina dorsale del flusso.'),
        flowLabel: flags.flowLabel,
        hasActiveSupport,
        routeReady
      };
    }
    if (coreRouteReady && supportAttention > 0) {
      return {
        tone: 'warning',
        label: t(context.i18n, 'ui.practiceLogisticsCoverageSupport', 'Tratta principale pronta, ultimo miglio da chiarire'),
        detail: t(context.i18n, 'ui.practiceLogisticsCoverageSupportDetail', 'La tratta principale è leggibile, ma resta da consolidare almeno un ramo operativo o di supporto.'),
        flowLabel: flags.flowLabel,
        hasActiveSupport,
        routeReady
      };
    }
    if (attentionCount > 0) {
      return {
        tone: 'warning',
        label: t(context.i18n, 'ui.practiceLogisticsCoverageBackbone', 'Tratta leggibile, restano alcuni punti da consolidare'),
        detail: t(context.i18n, 'ui.practiceLogisticsCoverageBackboneDetail', 'La base è solida, ma conviene chiarire adesso alcuni punti per evitare correzioni a valle.'),
        flowLabel: flags.flowLabel,
        hasActiveSupport,
        routeReady
      };
    }
    return {
      tone: 'success',
      label: t(context.i18n, 'ui.practiceLogisticsCoverageReady', 'Flusso logistico coerente'),
      detail: t(context.i18n, 'ui.practiceLogisticsCoverageReadyDetail', 'Percorso, tempi e rami attivi risultano leggibili per il flusso corrente.'),
      flowLabel: flags.flowLabel,
      hasActiveSupport,
      routeReady
    };
  }

  return {
    buildFlags,
    annotateItems,
    buildCoverage
  };
})();
