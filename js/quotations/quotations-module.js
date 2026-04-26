window.KedrixOneQuotationsModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneQuotationsWorkspace || null;
  const Feedback = window.KedrixOneAppFeedback || null;
  const Branding = window.KedrixOneModuleBranding || null;
  const TransportUnits = window.KedrixOneTransportUnitData || { defaultTransportUnitTypes: [] };
  const SupplierRoadRates = window.KedrixOneSupplierRoadRates || null;
  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;

  function safeClone(value) {
    if (Workspace && typeof Workspace.cloneDraft === 'function') return Workspace.cloneDraft(value);
    if (typeof window !== 'undefined' && typeof window.structuredClone === 'function') return window.structuredClone(value || {});
    return JSON.parse(JSON.stringify(value || {}));
  }

  function today() {
    return Workspace?.today?.() || new Date().toISOString().slice(0, 10);
  }

  function parseNumber(value) {
    const normalized = Number(String(value || '').replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : 0;
  }

  function money(value) {
    return parseNumber(value).toFixed(2);
  }

  function ensureState(state) {
    Workspace?.ensureState?.(state);
    if (!Array.isArray(state.quotationRecords)) state.quotationRecords = [];
    if (!Array.isArray(state.quotationDispatchQueue)) state.quotationDispatchQueue = [];
    if (!Array.isArray(state.quotationFeedbackFollowUps)) state.quotationFeedbackFollowUps = [];
    if (!state.quotationFilters || typeof state.quotationFilters !== 'object') {
      state.quotationFilters = { quick: '', serviceProfile: 'all', status: 'all' };
    }
    if (!state.companyConfig) state.companyConfig = {};
    if (!state.companyConfig.crmAutomation || typeof state.companyConfig.crmAutomation !== 'object') {
      state.companyConfig.crmAutomation = {};
    }
    if (!state.companyConfig.crmAutomation.quotationFeedback || typeof state.companyConfig.crmAutomation.quotationFeedback !== 'object') {
      state.companyConfig.crmAutomation.quotationFeedback = {
        enabled: true,
        defaultDelayDays: 5,
        defaultTemplateKey: 'quotation-feedback-standard',
        templates: [
          {
            key: 'quotation-feedback-standard',
            name: 'Feedback quotazione standard',
            subject: 'Riscontro sulla quotazione {{quotation_number}}',
            body: 'Buongiorno {{client_name}},\n\nLe scriviamo per avere un cortese riscontro sulla quotazione {{quotation_number}} inviata in data {{sent_date}}.\n\nRestiamo a disposizione per qualsiasi chiarimento o aggiornamento.\n\nCordiali saluti\n{{company_name}}'
          }
        ]
      };
    }
    return state.quotationsWorkspace;
  }

  function currentOperatorName(state) {
    const activeUserId = String(state?.activeUserId || '').trim();
    const user = (state?.users || []).find((entry) => String(entry?.id || '').trim() === activeUserId) || null;
    return String(user?.name || '').trim();
  }

  function directories(state) {
    return state?.companyConfig?.practiceConfig?.directories || {};
  }

  function quotationClientEntries(state) {
    if (!MasterDataEntities || typeof MasterDataEntities.listEntityRecords !== 'function') return [];
    return MasterDataEntities.listEntityRecords(state, 'client');
  }

  function getQuotationClientRecordById(state, clientId) {
    if (!MasterDataEntities || typeof MasterDataEntities.getEntityRecordById !== 'function') return null;
    const cleanId = cleanText(clientId);
    if (!cleanId) return null;
    return MasterDataEntities.getEntityRecordById(state, 'client', cleanId) || null;
  }

  function findQuotationClientRecordByValue(state, value) {
    if (!MasterDataEntities || typeof MasterDataEntities.findStructuredEntityRecordByValue !== 'function') return null;
    const cleanValue = cleanText(value);
    if (!cleanValue) return null;
    return MasterDataEntities.findStructuredEntityRecordByValue(state, 'client', cleanValue) || null;
  }

  function buildQuotationClientSnapshot(record) {
    if (!record || !MasterDataEntities || typeof MasterDataEntities.buildRelationSnapshot !== 'function') return null;
    return MasterDataEntities.buildRelationSnapshot('client', record, 'client');
  }

  function syncQuotationClientDraft(state, draft, payload = {}) {
    if (!draft || typeof draft !== 'object') return null;
    if (!draft.linkedEntities || typeof draft.linkedEntities !== 'object') draft.linkedEntities = {};

    const explicitClientId = cleanText(Object.prototype.hasOwnProperty.call(payload, 'clientId') ? payload.clientId : draft.clientId);
    const explicitClientName = cleanText(
      Object.prototype.hasOwnProperty.call(payload, 'client')
        ? payload.client
        : (Object.prototype.hasOwnProperty.call(payload, 'clientName') ? payload.clientName : draft.client)
    );

    let record = null;
    if (explicitClientId) record = getQuotationClientRecordById(state, explicitClientId);
    if (!record && explicitClientName) record = findQuotationClientRecordByValue(state, explicitClientName);

    const finalClientName = cleanText(record?.name || record?.clientName || explicitClientName);
    draft.client = finalClientName;
    draft.clientId = cleanText(record?.id || '');

    const snapshot = buildQuotationClientSnapshot(record);
    if (snapshot) draft.linkedEntities.client = snapshot;
    else delete draft.linkedEntities.client;

    return record;
  }

  function quotationSupplierEntries(state) {
    if (!MasterDataEntities || typeof MasterDataEntities.listEntityRecords !== 'function') return [];
    return MasterDataEntities.listEntityRecords(state, 'supplier');
  }

  function getQuotationSupplierRecordById(state, supplierId) {
    if (!MasterDataEntities || typeof MasterDataEntities.getEntityRecordById !== 'function') return null;
    const cleanId = cleanText(supplierId);
    if (!cleanId) return null;
    return MasterDataEntities.getEntityRecordById(state, 'supplier', cleanId) || null;
  }

  function findQuotationSupplierRecordByValue(state, value) {
    if (!MasterDataEntities || typeof MasterDataEntities.findStructuredEntityRecordByValue !== 'function') return null;
    const cleanValue = cleanText(value);
    if (!cleanValue) return null;
    return MasterDataEntities.findStructuredEntityRecordByValue(state, 'supplier', cleanValue) || null;
  }

  function buildQuotationSupplierSnapshot(record) {
    if (!record || !MasterDataEntities || typeof MasterDataEntities.buildRelationSnapshot !== 'function') return null;
    return MasterDataEntities.buildRelationSnapshot('supplier', record, 'supplier');
  }

  function syncQuotationLineSupplier(state, line, payload = {}) {
    if (!line || typeof line !== 'object') return null;
    if (!line.linkedEntities || typeof line.linkedEntities !== 'object') line.linkedEntities = {};

    const explicitSupplierId = cleanText(Object.prototype.hasOwnProperty.call(payload, 'supplierId') ? payload.supplierId : line.supplierId);
    const explicitSupplierName = cleanText(
      Object.prototype.hasOwnProperty.call(payload, 'supplier')
        ? payload.supplier
        : (Object.prototype.hasOwnProperty.call(payload, 'supplierName') ? payload.supplierName : line.supplier)
    );

    let record = null;
    if (explicitSupplierId) record = getQuotationSupplierRecordById(state, explicitSupplierId);
    if (!record && explicitSupplierName) record = findQuotationSupplierRecordByValue(state, explicitSupplierName);

    line.supplier = cleanText(record?.name || record?.supplierName || explicitSupplierName);
    line.supplierId = cleanText(record?.id || '');

    const snapshot = buildQuotationSupplierSnapshot(record);
    if (snapshot) line.linkedEntities.supplier = snapshot;
    else delete line.linkedEntities.supplier;

    return record;
  }

  function normalizeQuotationDraft(state, draft) {
    if (!draft || typeof draft !== 'object') return draft;
    if (!draft.linkedEntities || typeof draft.linkedEntities !== 'object') draft.linkedEntities = {};
    const linkedClientId = cleanText(draft.linkedEntities?.client?.recordId || '');
    const linkedClientValue = cleanText(draft.linkedEntities?.client?.value || draft.linkedEntities?.client?.displayValue || '');
    syncQuotationClientDraft(state, draft, {
      clientId: draft.clientId || linkedClientId,
      client: draft.client || linkedClientValue
    });
    const linkedIncotermValue = cleanText(draft.linkedEntities?.incoterm?.value || draft.linkedEntities?.incoterm?.displayValue || draft.linkedEntities?.incoterm?.recordId || '');
    syncQuotationIncotermDraft(state, draft, { incoterm: draft.incoterm || linkedIncotermValue });
    if (!Array.isArray(draft.lineItems) || !draft.lineItems.length) {
      draft.lineItems = [Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` }];
    }
    draft.lineItems = draft.lineItems.map((line) => {
      const normalizedLine = line && typeof line === 'object' ? line : (Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` });
      const linkedSupplierId = cleanText(normalizedLine?.linkedEntities?.supplier?.recordId || '');
      const linkedSupplierValue = cleanText(normalizedLine?.linkedEntities?.supplier?.value || normalizedLine?.linkedEntities?.supplier?.displayValue || '');
      syncQuotationLineSupplier(state, normalizedLine, {
        supplierId: normalizedLine.supplierId || linkedSupplierId,
        supplier: normalizedLine.supplier || linkedSupplierValue
      });
      return normalizedLine;
    });
    return draft;
  }

  function quotationIncotermPracticeType(draft = {}) {
    const profile = cleanText(draft?.serviceProfile || '').toLowerCase();
    if (profile === 'sea') return 'sea_import';
    if (profile === 'air') return 'air_import';
    if (profile === 'road') return 'road_import';
    if (profile === 'warehouse') return 'warehouse';
    return 'sea_import';
  }

  function quotationIncotermEntries(state, draft = {}) {
    if (PracticeSchemas && typeof PracticeSchemas.getFieldOptionEntries === 'function') {
      const type = quotationIncotermPracticeType(draft);
      return PracticeSchemas.getFieldOptionEntries(type, { name: 'incoterm', optionSource: 'incoterms' }, state?.companyConfig || {})
        .map((entry) => ({
          value: cleanText(entry?.value),
          label: cleanText(entry?.label || entry?.displayValue || entry?.value),
          displayValue: cleanText(entry?.displayValue || entry?.label || entry?.value),
          aliases: Array.isArray(entry?.aliases) ? entry.aliases.map((alias) => cleanUpper(alias)).filter(Boolean) : []
        }))
        .filter((entry) => entry.value);
    }
    const fallback = Array.isArray(PracticeSchemas?.incoterms2020) && PracticeSchemas.incoterms2020.length
      ? PracticeSchemas.incoterms2020
      : ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'];
    return fallback.map((value) => ({ value: cleanText(value), label: cleanText(value), displayValue: cleanText(value), aliases: [cleanUpper(value)] })).filter((entry) => entry.value);
  }

  function findQuotationIncotermEntry(state, draft, rawValue) {
    const cleanValue = cleanUpper(rawValue);
    if (!cleanValue) return null;
    return quotationIncotermEntries(state, draft).find((entry) => {
      if (cleanUpper(entry.value) === cleanValue) return true;
      if (cleanUpper(entry.displayValue) === cleanValue) return true;
      return Array.isArray(entry.aliases) && entry.aliases.includes(cleanValue);
    }) || null;
  }

  function buildQuotationIncotermSnapshot(entry) {
    const value = cleanText(entry?.value);
    if (!value) return null;
    return {
      fieldName: 'incoterm',
      entityKey: 'incoterm',
      recordId: value,
      value,
      displayValue: cleanText(entry?.displayValue || entry?.label || value),
      code: value,
      description: cleanText(entry?.label || value),
      active: true
    };
  }

  function syncQuotationIncotermDraft(state, draft, payload = {}) {
    if (!draft || typeof draft !== 'object') return null;
    if (!draft.linkedEntities || typeof draft.linkedEntities !== 'object') draft.linkedEntities = {};
    const explicitValue = cleanText(
      Object.prototype.hasOwnProperty.call(payload, 'incoterm')
        ? payload.incoterm
        : (Object.prototype.hasOwnProperty.call(payload, 'value') ? payload.value : draft.incoterm)
    );
    if (!explicitValue) {
      draft.incoterm = '';
      delete draft.linkedEntities.incoterm;
      return null;
    }
    const entry = findQuotationIncotermEntry(state, draft, explicitValue);
    draft.incoterm = cleanText(entry?.value || explicitValue);
    const snapshot = buildQuotationIncotermSnapshot(entry);
    if (snapshot) draft.linkedEntities.incoterm = snapshot;
    else delete draft.linkedEntities.incoterm;
    return entry;
  }

  function transportUnitOptions() {
    return (TransportUnits?.defaultTransportUnitTypes || []).map((item) => ({
      value: String(item?.value || '').trim(),
      label: String(item?.displayValue || item?.label || item?.value || '').trim()
    })).filter((item) => item.value && item.label);
  }

  function serviceProfileLabel(profile) {
    const labels = {
      generic: 'Generica',
      sea: 'Mare',
      air: 'Aerea',
      rail: 'Ferrovia',
      road: 'Terra',
      agency: 'Agenzia',
      warehouse: 'Magazzino'
    };
    return labels[String(profile || '').trim()] || 'Generica';
  }

  function companyMeta(state, draft) {
    return [
      `Profilo ${serviceProfileLabel(draft?.serviceProfile)}`,
      String(draft?.quotationNumber || '').trim() || 'Nuova quotazione',
      Branding?.companyName?.(state) || String(state?.companyConfig?.name || 'Kedrix One').trim()
    ].filter(Boolean);
  }

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanUpper(value) {
    return cleanText(value).toUpperCase();
  }

  function parseLooseNumber(value) {
    const raw = cleanText(value).replace(/\s+/g, '');
    if (!raw) return null;
    const sanitized = raw.replace(/[^0-9,.-]/g, '');
    if (!sanitized) return null;
    let normalized = sanitized;
    if (sanitized.includes(',') && sanitized.includes('.')) {
      normalized = sanitized.replace(/\./g, '').replace(',', '.');
    } else if (sanitized.includes(',')) {
      normalized = sanitized.replace(',', '.');
    }
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function todayIsoLocal() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseLooseDate(value) {
    const raw = cleanText(value);
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parsed = new Date(`${raw}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(raw)) {
      const parsed = new Date(`${raw.replace(/\//g, '-')}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const slashMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) {
      const parsed = new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatDateIso(value) {
    const parsed = value instanceof Date ? value : parseLooseDate(value);
    if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function normalizeRoadRateReferenceDate(value) {
    return formatDateIso(value) || todayIsoLocal();
  }

  function evaluateRoadRateCandidateStatus(candidate, referenceDate) {
    const refDate = parseLooseDate(referenceDate) || parseLooseDate(todayIsoLocal()) || new Date();
    const fromDate = parseLooseDate(candidate?.validityFromIso || candidate?.validityFrom || '');
    const toDate = parseLooseDate(candidate?.validityToIso || candidate?.validityTo || '');
    const active = candidate?.active !== false;
    let validityStatus = cleanText(candidate?.validityStatus || '');
    if (!validityStatus) {
      if (fromDate || toDate) {
        if (fromDate && refDate < fromDate) validityStatus = 'scheduled';
        else if (toDate && refDate > toDate) validityStatus = 'expired';
        else validityStatus = 'current';
      } else {
        validityStatus = 'undated';
      }
    }
    const validityLabel = validityStatus === 'expired'
      ? 'Scaduta'
      : validityStatus === 'scheduled'
        ? 'Non ancora valida'
        : validityStatus === 'current'
          ? 'Valida alla data'
          : 'Senza date';
    const validityWindowLabel = [candidate?.validityFromIso || candidate?.validityFrom || '', candidate?.validityToIso || candidate?.validityTo || '']
      .map((item) => formatDateIso(item) || cleanText(item))
      .filter(Boolean)
      .join(' → ') || 'Nessuna finestra';
    return {
      active,
      validityStatus,
      validityLabel,
      validityWindowLabel,
      isCurrent: validityStatus === 'current',
      isExpired: validityStatus === 'expired',
      isScheduled: validityStatus === 'scheduled',
      isUndated: validityStatus === 'undated'
    };
  }

  function defaultRoadRateBridgeFilters() {
    return {
      commercialOnly: 'all',
      matchType: 'all',
      vehicleMode: 'all',
      serviceMode: 'all',
      priorityMode: 'all',
      activeState: 'active-only',
      validityMode: 'current-or-undated',
      referenceDate: todayIsoLocal(),
      sortBy: 'commercial-priority'
    };
  }

  function roadRateMatchPriority(matchType) {
    switch (cleanText(matchType || '')) {
      case 'exact':
        return 3;
      case 'reverse':
        return 2;
      case 'partial':
        return 1;
      default:
        return 0;
    }
  }

  function evaluateRoadRateCommercialPriority(candidate) {
    const hasTariff = Boolean(candidate?.hasCommercialMatch || cleanText(candidate?.tariffAmount || ''));
    const isActive = candidate?.active !== false;
    const validityStatus = cleanText(candidate?.validityStatus || 'undated') || 'undated';
    const matchPriority = roadRateMatchPriority(candidate?.matchType);
    let tier = 'review';
    let label = 'Da verificare';
    let tierScore = 150;

    if (isActive && hasTariff && validityStatus === 'current') {
      tier = 'recommended';
      label = 'Consigliata';
      tierScore = 400;
    } else if (isActive && hasTariff && validityStatus === 'undated') {
      tier = 'usable';
      label = 'Utilizzabile';
      tierScore = 320;
    } else if (isActive && hasTariff && validityStatus === 'scheduled') {
      tier = 'review';
      label = 'Futura';
      tierScore = 220;
    } else if (isActive && !hasTariff && (validityStatus === 'current' || validityStatus === 'undated')) {
      tier = 'review';
      label = 'Senza tariffa';
      tierScore = 180;
    } else {
      tier = 'attention';
      label = !isActive ? 'Inattiva' : validityStatus === 'expired' ? 'Scaduta' : 'Critica';
      tierScore = 80;
    }

    const tariffPriority = hasTariff ? 12 : 0;
    const activePriority = isActive ? 8 : 0;
    const validityPriority = validityStatus === 'current' ? 10 : validityStatus === 'undated' ? 6 : validityStatus === 'scheduled' ? 2 : -10;
    const recommendationScore = tierScore + (matchPriority * 10) + tariffPriority + activePriority + validityPriority + Number(candidate?.score || 0);
    return {
      commercialPriorityTier: tier,
      commercialPriorityLabel: label,
      commercialPriorityScore: recommendationScore
    };
  }

  function getRoadRateBridgeFilters(bridge) {
    return {
      ...defaultRoadRateBridgeFilters(),
      ...(bridge && typeof bridge.filters === 'object' ? bridge.filters : {})
    };
  }

  function setRoadRateBridgeFilter(bridge, filterName, value) {
    if (!bridge || typeof bridge !== 'object') return;
    const next = getRoadRateBridgeFilters(bridge);
    next[cleanText(filterName)] = cleanText(value);
    bridge.filters = next;
  }

  function buildRoadRatePreferenceScopeKey(query = {}, options = {}) {
    const includeVehicle = options.includeVehicle !== false;
    const includeService = options.includeService !== false;
    return [
      cleanUpper(query?.supplierName || ''),
      cleanUpper(query?.origin || ''),
      cleanUpper(query?.destination || ''),
      includeVehicle ? cleanUpper(query?.vehicleType || '') : '*',
      includeService ? cleanUpper(query?.serviceType || '') : '*'
    ].join('||');
  }

  function buildRoadRatePreferenceScopes(query = {}) {
    const definitions = [
      { level: 'exact', label: 'fornitore/percorso/mezzo/servizio', includeVehicle: true, includeService: true },
      { level: 'vehicle', label: 'fornitore/percorso/mezzo', includeVehicle: true, includeService: false },
      { level: 'service', label: 'fornitore/percorso/servizio', includeVehicle: false, includeService: true },
      { level: 'lane', label: 'fornitore/percorso', includeVehicle: false, includeService: false }
    ];
    const seen = new Set();
    return definitions.map((definition) => ({
      ...definition,
      scopeKey: buildRoadRatePreferenceScopeKey(query, definition)
    })).filter((definition) => {
      if (!definition.scopeKey || seen.has(definition.scopeKey)) return false;
      seen.add(definition.scopeKey);
      return true;
    });
  }

  function roadRateManualPreferenceLabel(value = '') {
    switch (cleanText(value || '')) {
      case 'preferred':
        return 'Preferenza forte';
      case 'backup':
        return 'Backup';
      case 'avoid':
        return 'Evita salvo eccezioni';
      default:
        return 'Standard';
    }
  }

  function roadRatePreferenceHistoryActionLabel(value = '') {
    switch (cleanText(value || '')) {
      case 'created':
        return 'Creata';
      case 'updated':
        return 'Aggiornata';
      case 'deleted':
        return 'Rimossa';
      default:
        return 'Storico';
    }
  }

  function formatRoadRateTimestampLabel(value = '') {
    const raw = cleanText(value || '');
    if (!raw) return '—';
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      const fallback = parseLooseDate(raw);
      if (!(fallback instanceof Date) || Number.isNaN(fallback.getTime())) return raw;
      return `${formatDateIso(fallback)} 00:00`;
    }
    return parsed.toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function syncRoadRatePreferenceEditor(bridge) {
    if (!bridge || typeof bridge !== 'object') return;
    const selectedRoadRateId = cleanText(bridge.selectedRoadRateId || bridge.roadRateId || '');
    const savedSelectedId = cleanText(bridge.savedPreferenceSelectedId || '');
    const currentEditorRoadRateId = cleanText(bridge.preferenceEditorRoadRateId || '');
    if (selectedRoadRateId && selectedRoadRateId === savedSelectedId) {
      bridge.preferenceEditorRoadRateId = selectedRoadRateId;
      bridge.preferenceEditorPriority = cleanText(bridge.savedPreferenceManualPriority || '');
      bridge.preferenceEditorNote = cleanText(bridge.savedPreferenceInternalNote || '');
      bridge.preferenceEditorOperator = cleanText(bridge.savedPreferenceOperator || '');
      return;
    }
    if (currentEditorRoadRateId !== selectedRoadRateId) {
      bridge.preferenceEditorRoadRateId = selectedRoadRateId;
      bridge.preferenceEditorPriority = '';
      bridge.preferenceEditorNote = '';
      bridge.preferenceEditorOperator = '';
    }
  }

  function getRoadRatePreferenceStore(draft) {
    if (!draft || typeof draft !== 'object') return [];
    if (!Array.isArray(draft.roadRatePreferences)) draft.roadRatePreferences = [];
    return draft.roadRatePreferences;
  }

  function getRoadRatePreferenceHistoryStore(draft) {
    if (!draft || typeof draft !== 'object') return [];
    if (!Array.isArray(draft.roadRatePreferenceHistory)) draft.roadRatePreferenceHistory = [];
    return draft.roadRatePreferenceHistory;
  }

  function appendRoadRatePreferenceHistoryEntry(draft, entry = {}) {
    if (!draft || typeof draft !== 'object') return null;
    const store = getRoadRatePreferenceHistoryStore(draft);
    const normalized = {
      historyId: cleanText(entry.historyId || `rrph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      action: cleanText(entry.action || 'updated') || 'updated',
      scopeKey: cleanText(entry.scopeKey || ''),
      scopeLevel: cleanText(entry.scopeLevel || ''),
      scopeLabel: cleanText(entry.scopeLabel || ''),
      supplierName: cleanText(entry.supplierName || ''),
      origin: cleanText(entry.origin || ''),
      destination: cleanText(entry.destination || ''),
      vehicleType: cleanText(entry.vehicleType || ''),
      serviceType: cleanText(entry.serviceType || ''),
      selectedRoadRateId: cleanText(entry.selectedRoadRateId || ''),
      selectedRouteLabel: cleanText(entry.selectedRouteLabel || ''),
      commercialReference: cleanText(entry.commercialReference || ''),
      manualPriority: cleanText(entry.manualPriority || ''),
      internalNote: cleanText(entry.internalNote || ''),
      modifiedBy: cleanText(entry.modifiedBy || ''),
      modifiedAt: cleanText(entry.modifiedAt || new Date().toISOString())
    };
    store.unshift(normalized);
    if (store.length > 30) store.length = 30;
    return normalized;
  }

  function getRoadRatePreferenceHistory(draft, query = {}, options = {}) {
    const supplier = cleanUpper(query?.supplierName || '');
    const origin = cleanUpper(query?.origin || '');
    const destination = cleanUpper(query?.destination || '');
    const limit = Math.max(1, Math.min(10, Number(options?.limit || 5)));
    const store = getRoadRatePreferenceHistoryStore(draft)
      .filter((entry) => cleanUpper(entry?.supplierName || '') === supplier)
      .map((entry) => ({
        ...entry,
        sameLane: cleanUpper(entry?.origin || '') === origin && cleanUpper(entry?.destination || '') === destination
      }))
      .sort((left, right) => {
        if (Boolean(right.sameLane) !== Boolean(left.sameLane)) return right.sameLane ? 1 : -1;
        return cleanText(right?.modifiedAt || '').localeCompare(cleanText(left?.modifiedAt || ''));
      });
    return store.slice(0, limit);
  }

  function findRoadRatePreferenceByScopeKey(draft, scopeKey = '') {
    const normalizedScopeKey = cleanText(scopeKey || '');
    if (!normalizedScopeKey) return null;
    return getRoadRatePreferenceStore(draft).find((item) => cleanText(item?.scopeKey || '') === normalizedScopeKey) || null;
  }

  function getRoadRatePreference(draft, query = {}) {
    const exactScope = buildRoadRatePreferenceScopes(query)[0] || null;
    return exactScope ? findRoadRatePreferenceByScopeKey(draft, exactScope.scopeKey) : null;
  }

  function resolveRoadRatePreference(draft, query = {}, candidates = []) {
    const scopes = buildRoadRatePreferenceScopes(query);
    const availableIds = new Set((Array.isArray(candidates) ? candidates : []).map((candidate) => cleanText(candidate?.roadRateId || '')).filter(Boolean));
    let firstStored = null;
    for (const scope of scopes) {
      const preference = findRoadRatePreferenceByScopeKey(draft, scope.scopeKey);
      if (!preference) continue;
      const selectionAvailable = availableIds.has(cleanText(preference?.selectedRoadRateId || ''));
      const resolved = {
        ...preference,
        resolvedScopeKey: scope.scopeKey,
        resolvedScopeLevel: scope.level,
        resolvedScopeLabel: scope.label,
        fallbackUsed: scope.level !== 'exact',
        selectionAvailable
      };
      if (!firstStored) firstStored = resolved;
      if (selectionAvailable) return resolved;
    }
    return firstStored;
  }

  function saveRoadRatePreference(draft, bridge, query = {}) {
    if (!draft || typeof draft !== 'object' || !bridge || typeof bridge !== 'object') return { ok: false, reason: 'missing-context' };
    const selectedId = cleanText(bridge.selectedRoadRateId || '');
    if (!selectedId) return { ok: false, reason: 'missing-selection' };
    const exactScope = buildRoadRatePreferenceScopes(query)[0] || null;
    const scopeKey = cleanText(exactScope?.scopeKey || '');
    if (!scopeKey) return { ok: false, reason: 'missing-scope' };
    const store = getRoadRatePreferenceStore(draft);
    const index = store.findIndex((item) => cleanText(item?.scopeKey || '') === scopeKey);
    const existing = index >= 0 ? store[index] || null : null;
    const nowIso = new Date().toISOString();
    const operatorName = cleanText(bridge.preferenceEditorOperator || existing?.modifiedBy || '');
    const payload = {
      scopeKey,
      scopeLevel: cleanText(exactScope?.level || 'exact') || 'exact',
      scopeLabel: cleanText(exactScope?.label || 'fornitore/percorso/mezzo/servizio') || 'fornitore/percorso/mezzo/servizio',
      supplierName: cleanText(query?.supplierName || bridge?.supplierName || ''),
      origin: cleanText(query?.origin || bridge?.origin || ''),
      destination: cleanText(query?.destination || bridge?.destination || ''),
      vehicleType: cleanText(query?.vehicleType || bridge?.vehicleType || ''),
      serviceType: cleanText(query?.serviceType || bridge?.serviceType || ''),
      selectedRoadRateId: selectedId,
      selectedRouteLabel: [cleanText(bridge.origin || ''), cleanText(bridge.destination || '')].filter(Boolean).join(' → '),
      commercialReference: cleanText(bridge.commercialReference || ''),
      manualPriority: cleanText(bridge.preferenceEditorPriority || ''),
      internalNote: cleanText(bridge.preferenceEditorNote || ''),
      modifiedBy: operatorName,
      createdAt: cleanText(existing?.createdAt || existing?.savedAt || nowIso),
      modifiedAt: nowIso,
      savedAt: nowIso,
      version: Number(existing?.version || 0) + 1,
      filters: { ...getRoadRateBridgeFilters(bridge) }
    };
    if (index >= 0) store[index] = payload;
    else store.push(payload);
    appendRoadRatePreferenceHistoryEntry(draft, {
      action: existing ? 'updated' : 'created',
      ...payload
    });
    return { ok: true, preference: payload };
  }

  function clearRoadRatePreference(draft, query = {}, explicitScopeKey = '', actorName = '') {
    const scopeKey = cleanText(explicitScopeKey || '') || buildRoadRatePreferenceScopeKey(query);
    if (!scopeKey) return { ok: false, reason: 'missing-scope' };
    const store = getRoadRatePreferenceStore(draft);
    const index = store.findIndex((item) => cleanText(item?.scopeKey || '') === scopeKey);
    if (index === -1) return { ok: false, reason: 'missing-preference' };
    const removed = store.splice(index, 1)[0] || null;
    appendRoadRatePreferenceHistoryEntry(draft, {
      action: 'deleted',
      ...(removed || {}),
      modifiedBy: cleanText(actorName || removed?.modifiedBy || ''),
      modifiedAt: new Date().toISOString()
    });
    return { ok: true, removed };
  }

  function compareRoadRateCandidates(sortBy, left, right) {
    const leftTariff = parseLooseNumber(left?.tariffAmount);
    const rightTariff = parseLooseNumber(right?.tariffAmount);
    const leftContractual = parseLooseNumber(left?.contractualDistanceKm);
    const rightContractual = parseLooseNumber(right?.contractualDistanceKm);
    const leftOperational = parseLooseNumber(left?.operationalDistanceKm);
    const rightOperational = parseLooseNumber(right?.operationalDistanceKm);
    const leftUpdated = cleanText(left?.updatedAt || left?.validityFrom || '');
    const rightUpdated = cleanText(right?.updatedAt || right?.validityFrom || '');
    const leftValidityTo = cleanText(left?.validityToIso || left?.validityTo || '');
    const rightValidityTo = cleanText(right?.validityToIso || right?.validityTo || '');
    switch (cleanText(sortBy || 'commercial-priority')) {
      case 'commercial-priority':
        if (Number(right?.commercialPriorityScore || 0) !== Number(left?.commercialPriorityScore || 0)) {
          return Number(right?.commercialPriorityScore || 0) - Number(left?.commercialPriorityScore || 0);
        }
        break;
      case 'lowest-tariff': {
        if (Number.isFinite(leftTariff) && Number.isFinite(rightTariff) && leftTariff !== rightTariff) return leftTariff - rightTariff;
        if (Number.isFinite(leftTariff) !== Number.isFinite(rightTariff)) return Number.isFinite(leftTariff) ? -1 : 1;
        break;
      }
      case 'shortest-contractual-km': {
        if (Number.isFinite(leftContractual) && Number.isFinite(rightContractual) && leftContractual !== rightContractual) return leftContractual - rightContractual;
        if (Number.isFinite(leftContractual) !== Number.isFinite(rightContractual)) return Number.isFinite(leftContractual) ? -1 : 1;
        break;
      }
      case 'shortest-operational-km': {
        if (Number.isFinite(leftOperational) && Number.isFinite(rightOperational) && leftOperational !== rightOperational) return leftOperational - rightOperational;
        if (Number.isFinite(leftOperational) !== Number.isFinite(rightOperational)) return Number.isFinite(leftOperational) ? -1 : 1;
        break;
      }
      case 'newest':
        if (rightUpdated !== leftUpdated) return rightUpdated.localeCompare(leftUpdated);
        break;
      case 'earliest-expiry': {
        if (leftValidityTo && rightValidityTo && leftValidityTo !== rightValidityTo) return leftValidityTo.localeCompare(rightValidityTo);
        if (Boolean(leftValidityTo) !== Boolean(rightValidityTo)) return leftValidityTo ? -1 : 1;
        break;
      }
      default:
        break;
    }
    if (Number(right?.score || 0) !== Number(left?.score || 0)) return Number(right?.score || 0) - Number(left?.score || 0);
    if (Boolean(right?.hasCommercialMatch) !== Boolean(left?.hasCommercialMatch)) return Number(Boolean(right?.hasCommercialMatch)) - Number(Boolean(left?.hasCommercialMatch));
    if (rightUpdated !== leftUpdated) return rightUpdated.localeCompare(leftUpdated);
    return cleanText(left?.origin || '').localeCompare(cleanText(right?.origin || ''));
  }

  function getRoadRateBridgeCandidateView(bridge, query = {}, options = {}) {
    const filters = getRoadRateBridgeFilters(bridge);
    filters.referenceDate = normalizeRoadRateReferenceDate(filters.referenceDate);
    const referenceDate = filters.referenceDate;
    const allCandidates = (Array.isArray(bridge?.candidates) ? bridge.candidates.slice() : []).map((candidate) => {
      const statusMeta = evaluateRoadRateCandidateStatus(candidate, referenceDate);
      return {
        ...candidate,
        ...statusMeta,
        ...evaluateRoadRateCommercialPriority({
          ...candidate,
          ...statusMeta
        }),
        referenceDate
      };
    });
    const queryVehicle = cleanUpper(query?.vehicleType || '');
    const queryService = cleanUpper(query?.serviceType || '');
    let filtered = allCandidates.filter((candidate) => {
      if (filters.commercialOnly === 'with-tariff' && !candidate?.hasCommercialMatch && !cleanText(candidate?.tariffAmount || '')) return false;
      if (filters.matchType !== 'all' && cleanText(candidate?.matchType) !== filters.matchType) return false;
      if (filters.vehicleMode === 'exact-only' && queryVehicle && cleanUpper(candidate?.vehicleType || '') !== queryVehicle) return false;
      if (filters.serviceMode === 'exact-only' && queryService && cleanUpper(candidate?.serviceType || '') !== queryService) return false;
      if (filters.priorityMode !== 'all' && cleanText(candidate?.commercialPriorityTier || '') !== filters.priorityMode) return false;
      if (filters.activeState === 'active-only' && candidate?.active === false) return false;
      if (filters.activeState === 'inactive-only' && candidate?.active !== false) return false;
      if (filters.validityMode === 'current-only' && !candidate?.isCurrent) return false;
      if (filters.validityMode === 'current-or-undated' && !candidate?.isCurrent && !candidate?.isUndated) return false;
      if (filters.validityMode === 'expired-only' && !candidate?.isExpired) return false;
      if (filters.validityMode === 'scheduled-only' && !candidate?.isScheduled) return false;
      if (filters.validityMode === 'undated-only' && !candidate?.isUndated) return false;
      return true;
    });
    filtered.sort((left, right) => compareRoadRateCandidates(filters.sortBy, left, right));
    const limit = Math.max(1, Number(options.limit || 8));
    return {
      filters,
      allCandidates,
      filteredCandidates: filtered,
      visibleCandidates: filtered.slice(0, limit),
      totalCandidates: allCandidates.length,
      totalVisible: filtered.length,
      hiddenByFilters: Math.max(0, allCandidates.length - filtered.length)
    };
  }

  function resolveQuotationRoadSupplierName(draft = {}) {
    const headerSupplier = cleanText(draft?.supplier || '');
    if (headerSupplier) return headerSupplier;
    const rows = Array.isArray(draft?.lineItems) ? draft.lineItems : [];
    const transportRow = rows.find((row) => cleanText(row?.supplier) && String(row?.lineType || '').trim() === 'transport');
    if (transportRow) return cleanText(transportRow.supplier);
    const anySupplierRow = rows.find((row) => cleanText(row?.supplier));
    return anySupplierRow ? cleanText(anySupplierRow.supplier) : '';
  }

  function buildRoadRateQuery(draft = {}) {
    return {
      supplierName: resolveQuotationRoadSupplierName(draft),
      origin: cleanText(draft?.origin || draft?.pickupPlace || ''),
      destination: cleanText(draft?.destination || draft?.deliveryPlace || ''),
      vehicleType: cleanText(draft?.vehicleType || ''),
      serviceType: cleanText(draft?.truckMode || '')
    };
  }

  function roadRateLookupStatus(draft = {}) {
    const bridge = draft?.roadRateBridge;
    if (!bridge || typeof bridge !== 'object') return '';
    return cleanText(bridge.status || '');
  }

  function clearRoadRateBridge(draft) {
    if (!draft || typeof draft !== 'object') return;
    delete draft.roadRateBridge;
    delete draft.roadMatchedContractualKm;
    delete draft.roadMatchedOperationalKm;
    delete draft.roadMatchedDeltaKm;
    delete draft.roadMatchedTariff;
    delete draft.roadMatchedCurrency;
    delete draft.roadMatchedCommercialReference;
  }

  function summarizeRoadRateCandidate(match, query) {
    const record = match?.record || {};
    return {
      roadRateId: cleanText(record.id || ''),
      supplierName: cleanText(record.supplierName || query?.supplierName || ''),
      origin: cleanText(record.origin || query?.origin || ''),
      destination: cleanText(record.destination || query?.destination || ''),
      vehicleType: cleanText(record.vehicleType || query?.vehicleType || ''),
      serviceType: cleanText(record.serviceType || query?.serviceType || ''),
      matchType: cleanText(match?.matchType || ''),
      score: Number(match?.score || 0),
      contractualDistanceKm: cleanText(match?.contractualDistanceKm || record.resolvedContractualDistanceKm || ''),
      operationalDistanceKm: cleanText(match?.operationalDistanceKm || record.resolvedOperationalDistanceKm || ''),
      deltaKm: cleanText(match?.deltaKm || record.resolvedDeltaKm || ''),
      tariffAmount: cleanText(record.tariffAmount || ''),
      currency: cleanText(record.currency || 'EUR') || 'EUR',
      commercialReference: cleanText(record.commercialReference || ''),
      matchBasis: cleanText(record.matchBasis || ''),
      sourceType: cleanText(record.sourceType || ''),
      validityFrom: cleanText(record.validityFrom || ''),
      validityTo: cleanText(record.validityTo || ''),
      updatedAt: cleanText(record.updatedAt || ''),
      hasCommercialMatch: match?.commercialMatch === true || Boolean(cleanText(record.tariffAmount || '')),
      commercialPriorityTier: cleanText(record.commercialPriorityTier || ''),
      commercialPriorityLabel: cleanText(record.commercialPriorityLabel || ''),
      commercialPriorityScore: Number(record.commercialPriorityScore || 0)
    };
  }

  function applyRoadRateBridgeSelection(bridge, selectedRoadRateId = '') {
    if (!bridge || typeof bridge !== 'object') return bridge;
    const previousRoadRateId = cleanText(bridge.selectedRoadRateId || bridge.roadRateId || '');
    const candidates = Array.isArray(bridge.candidates) ? bridge.candidates : [];
    const selected = candidates.find((candidate) => cleanText(candidate?.roadRateId) === cleanText(selectedRoadRateId)) || candidates[0] || null;
    if (!selected) return bridge;
    bridge.selectedRoadRateId = cleanText(selected.roadRateId || '');
    bridge.supplierName = cleanText(selected.supplierName || bridge.supplierName || '');
    bridge.origin = cleanText(selected.origin || bridge.origin || '');
    bridge.destination = cleanText(selected.destination || bridge.destination || '');
    bridge.vehicleType = cleanText(selected.vehicleType || bridge.vehicleType || '');
    bridge.serviceType = cleanText(selected.serviceType || bridge.serviceType || '');
    bridge.matchType = cleanText(selected.matchType || '');
    bridge.score = Number(selected.score || 0);
    bridge.contractualDistanceKm = cleanText(selected.contractualDistanceKm || '');
    bridge.operationalDistanceKm = cleanText(selected.operationalDistanceKm || '');
    bridge.deltaKm = cleanText(selected.deltaKm || '');
    bridge.tariffAmount = cleanText(selected.tariffAmount || '');
    bridge.currency = cleanText(selected.currency || 'EUR') || 'EUR';
    bridge.commercialReference = cleanText(selected.commercialReference || '');
    bridge.matchBasis = cleanText(selected.matchBasis || '');
    bridge.sourceType = cleanText(selected.sourceType || '');
    bridge.roadRateId = cleanText(selected.roadRateId || '');
    bridge.hasCommercialMatch = selected.hasCommercialMatch === true;
    bridge.active = selected.active !== false;
    bridge.validityStatus = cleanText(selected.validityStatus || '');
    bridge.validityLabel = cleanText(selected.validityLabel || '');
    bridge.validityWindowLabel = cleanText(selected.validityWindowLabel || '');
    bridge.referenceDate = cleanText(selected.referenceDate || bridge.referenceDate || normalizeRoadRateReferenceDate(''));
    bridge.commercialPriorityTier = cleanText(selected.commercialPriorityTier || '');
    bridge.commercialPriorityLabel = cleanText(selected.commercialPriorityLabel || '');
    bridge.commercialPriorityScore = Number(selected.commercialPriorityScore || 0);
    if (previousRoadRateId !== cleanText(bridge.selectedRoadRateId || '')) {
      delete bridge.applyAcknowledgedForKey;
    }
    syncRoadRatePreferenceEditor(bridge);
    return bridge;
  }

  function buildRoadRateApplyWarnings(bridge) {
    if (!bridge || typeof bridge !== 'object') return [];
    const warnings = [];
    if (bridge.active === false) {
      warnings.push({
        code: 'inactive',
        badge: 'Tratta inattiva',
        severity: 'critical',
        requiresConfirmation: true,
        message: 'La tratta selezionata è marcata come inattiva nel listino del vettore.'
      });
    }
    switch (cleanText(bridge.validityStatus || '')) {
      case 'expired':
        warnings.push({
          code: 'expired',
          badge: 'Tariffa scaduta',
          severity: 'critical',
          requiresConfirmation: true,
          message: 'La tratta selezionata risulta scaduta rispetto alla data di riferimento impostata.'
        });
        break;
      case 'scheduled':
        warnings.push({
          code: 'scheduled',
          badge: 'Tariffa futura',
          severity: 'warning',
          requiresConfirmation: true,
          message: 'La tratta selezionata non è ancora valida alla data di riferimento impostata.'
        });
        break;
      case 'undated':
        warnings.push({
          code: 'undated',
          badge: 'Senza date',
          severity: 'info',
          requiresConfirmation: false,
          message: 'La tratta selezionata non ha una finestra di validità: verifica commercialmente se è ancora utilizzabile.'
        });
        break;
      default:
        break;
    }
    return warnings;
  }

  function roadRateApplyAcknowledgementKey(bridge) {
    if (!bridge || typeof bridge !== 'object') return '';
    return [
      cleanText(bridge.selectedRoadRateId || bridge.roadRateId || ''),
      bridge.active === false ? 'inactive' : 'active',
      cleanText(bridge.validityStatus || ''),
      cleanText(bridge.referenceDate || '')
    ].join('|');
  }

  function roadRateApplyAcknowledgedForSelection(bridge) {
    return cleanText(bridge?.applyAcknowledgedForKey || '') && cleanText(bridge?.applyAcknowledgedForKey || '') === roadRateApplyAcknowledgementKey(bridge);
  }

  function roadRateApplyWarningsRequireConfirmation(warnings = []) {
    return warnings.some((warning) => warning?.requiresConfirmation);
  }

  function roadRateApplyWarningFeedbackMessage(warnings = []) {
    const messages = warnings.filter((warning) => warning?.requiresConfirmation).map((warning) => cleanText(warning?.badge || warning?.message || '')).filter(Boolean);
    if (!messages.length) return 'Verifica gli avvisi della tratta selezionata prima di applicarla.';
    return `${messages.join(' · ')}. Premi di nuovo per applicarla comunque alla riga trasporto.`;
  }

  function selectRoadRateCandidate(draft, selectedRoadRateId = '') {
    if (!draft || typeof draft !== 'object') return false;
    if (!draft.roadRateBridge || typeof draft.roadRateBridge !== 'object') return false;
    if (String(draft.roadRateBridge.status || '').trim() !== 'matched') return false;
    applyRoadRateBridgeSelection(draft.roadRateBridge, selectedRoadRateId);
    draft.roadMatchedContractualKm = cleanText(draft.roadRateBridge.contractualDistanceKm || '');
    draft.roadMatchedOperationalKm = cleanText(draft.roadRateBridge.operationalDistanceKm || '');
    draft.roadMatchedDeltaKm = cleanText(draft.roadRateBridge.deltaKm || '');
    draft.roadMatchedTariff = cleanText(draft.roadRateBridge.tariffAmount || '');
    draft.roadMatchedCurrency = cleanText(draft.roadRateBridge.currency || 'EUR');
    draft.roadMatchedCommercialReference = cleanText(draft.roadRateBridge.commercialReference || '');
    return true;
  }

  function renderRoadRateBridgeCard(draft) {
    if (String(draft?.serviceProfile || '').trim() !== 'road') return '';
    const query = buildRoadRateQuery(draft);
    const status = roadRateLookupStatus(draft);
    const bridge = draft?.roadRateBridge || {};
    const queryTags = [
      ['Fornitore', query.supplierName || '—'],
      ['Origine', query.origin || '—'],
      ['Destinazione', query.destination || '—'],
      ['Servizio', query.serviceType || '—'],
      ['Mezzo', query.vehicleType || '—']
    ];
    const filterView = status === 'matched' ? getRoadRateBridgeCandidateView(bridge, query, { limit: 8 }) : null;
    const candidates = filterView?.visibleCandidates || [];
    if (status === 'matched' && candidates.length && !candidates.some((candidate) => cleanText(candidate.roadRateId) === cleanText(bridge.selectedRoadRateId || bridge.roadRateId || ''))) {
      applyRoadRateBridgeSelection(bridge, cleanText(candidates[0]?.roadRateId || ''));
    }
    const canLookup = query.supplierName && query.origin && query.destination;
    const canApply = status === 'matched' && candidates.length && cleanText(bridge.tariffAmount || '');
    const selectedWarnings = status === 'matched' && candidates.length ? buildRoadRateApplyWarnings(bridge) : [];
    const applyNeedsConfirmation = roadRateApplyWarningsRequireConfirmation(selectedWarnings);
    const applyAcknowledged = roadRateApplyAcknowledgedForSelection(bridge);
    const preferenceSaved = Boolean(bridge?.savedPreferenceScopeKey && bridge?.savedPreferenceSelectedId && bridge?.savedPreferenceSelectedId === bridge?.selectedRoadRateId);
    const preferenceScopeLabel = cleanText(bridge?.savedPreferenceScopeLabel || 'fornitore/percorso');
    const savedManualPriorityLabel = roadRateManualPreferenceLabel(bridge?.savedPreferenceManualPriority || '');
    const savedPreferenceOperatorLabel = cleanText(bridge?.savedPreferenceOperator || '') || 'Non indicato';
    const savedPreferenceModifiedLabel = formatRoadRateTimestampLabel(bridge?.savedPreferenceModifiedAt || '');
    const preferenceHistory = getRoadRatePreferenceHistory(draft, query, { limit: 5 });
    const preferenceRestoreInfo = bridge?.preferenceMatched
      ? `<div class="quotation-static-note">Preferenza commerciale ripristinata automaticamente ${bridge?.preferenceFallbackUsed ? `tramite fallback ${U.escapeHtml(preferenceScopeLabel)}` : `per ${U.escapeHtml(preferenceScopeLabel)}`}: ${U.escapeHtml(bridge.savedPreferenceLabel || 'tratta preferita')}.</div>`
      : bridge?.savedPreferenceScopeKey
        ? `<div class="quotation-static-note">Esiste una preferenza salvata per ${U.escapeHtml(preferenceScopeLabel)}${bridge?.savedPreferenceLabel ? ` (${U.escapeHtml(bridge.savedPreferenceLabel)})` : ''}.${bridge?.preferenceSelectionAvailable === false ? ' La tratta preferita salvata non è più disponibile tra le corrispondenze correnti: il ponte sta usando il miglior fallback disponibile.' : ' La tratta selezionata attuale è diversa: puoi aggiornarla o cancellarla.'}</div>`
        : '';
    const savedPreferenceMeta = bridge?.savedPreferenceScopeKey
      ? `<div class="quotation-static-note">Preferenza salvata${bridge?.savedPreferenceSelectedId === bridge?.selectedRoadRateId ? ' sulla tratta selezionata' : ''}: priorità ${U.escapeHtml(savedManualPriorityLabel)}${bridge?.savedPreferenceInternalNote ? ` · nota ${U.escapeHtml(bridge.savedPreferenceInternalNote)}` : ''} · operatore ${U.escapeHtml(savedPreferenceOperatorLabel)} · ultima modifica ${U.escapeHtml(savedPreferenceModifiedLabel)}.</div>`
      : '';
    const applyLabel = applyNeedsConfirmation
      ? (applyAcknowledged ? 'Applica comunque a riga trasporto' : 'Conferma avvisi prima di applicare')
      : 'Applica a riga trasporto';
    const actionRow = `<div class="action-row"><button class="btn secondary" type="button" data-quotation-road-rate-lookup ${canLookup ? '' : 'disabled'}>Leggi tratte commerciali compatibili</button>${status === 'matched' && bridge?.selectedRoadRateId ? `<button class="btn secondary" type="button" data-quotation-road-rate-save-preference>${preferenceSaved ? 'Aggiorna preferenza' : 'Salva preferenza'}</button>` : ''}${status === 'matched' && bridge?.savedPreferenceScopeKey ? `<button class="btn secondary" type="button" data-quotation-road-rate-clear-preference>Cancella preferenza</button>` : ''}${canApply ? `<button class="btn ${applyNeedsConfirmation && !applyAcknowledged ? 'secondary' : ''}" type="button" data-quotation-road-rate-apply>${U.escapeHtml(applyLabel)}</button>` : ''}</div>`;
    const preferenceEditorPriorityLabel = roadRateManualPreferenceLabel(bridge?.preferenceEditorPriority || '');
    const selectedSummary = status === 'matched' && candidates.length
      ? `<div class="tag-grid quotation-summary-grid">
          <div class="stack-item"><strong>Match selezionato</strong><span>${U.escapeHtml(bridge.matchType || 'exact')} · score ${U.escapeHtml(String(bridge.score || ''))}</span></div>
          <div class="stack-item"><strong>Tariffa</strong><span>${U.escapeHtml([bridge.tariffAmount || '', bridge.currency || 'EUR'].filter(Boolean).join(' ') || 'Non presente')}</span></div>
          <div class="stack-item"><strong>Km contrattuali</strong><span>${U.escapeHtml(bridge.contractualDistanceKm || '—')}</span></div>
          <div class="stack-item"><strong>Km operativi</strong><span>${U.escapeHtml(bridge.operationalDistanceKm || '—')}</span></div>
          <div class="stack-item"><strong>Delta km</strong><span>${U.escapeHtml(bridge.deltaKm || '0')}</span></div>
          <div class="stack-item"><strong>Rif. commerciale</strong><span>${U.escapeHtml(bridge.commercialReference || bridge.matchBasis || '—')}</span></div>
          <div class="stack-item"><strong>Priorità commerciale</strong><span>${U.escapeHtml(bridge.commercialPriorityLabel || 'Da verificare')} · score ${U.escapeHtml(String(bridge.commercialPriorityScore || 0))}</span></div>
          <div class="stack-item"><strong>Stato tratta</strong><span>${U.escapeHtml(bridge.active === false ? 'Inattiva' : 'Attiva')} · ${U.escapeHtml(bridge.validityLabel || '—')}</span></div>
          <div class="stack-item"><strong>Finestra validità</strong><span>${U.escapeHtml(bridge.validityWindowLabel || 'Nessuna finestra')}</span></div>
          <div class="stack-item"><strong>Priorità manuale preferenza</strong><span>${U.escapeHtml(preferenceEditorPriorityLabel)}</span></div>
          <div class="stack-item"><strong>Nota interna preferenza</strong><span>${U.escapeHtml(bridge.preferenceEditorNote || '—')}</span></div>
          <div class="stack-item"><strong>Operatore interno</strong><span>${U.escapeHtml(bridge.preferenceEditorOperator || bridge.savedPreferenceOperator || '—')}</span></div>
          <div class="stack-item"><strong>Ultima modifica preferenza</strong><span>${U.escapeHtml(savedPreferenceModifiedLabel)}</span></div>
        </div>
        <div class="form-grid two">
          <div class="field quotation-field quotation-field-md"><label for="quotation-road-rate-preference-priority">Priorità manuale preferenza</label><select id="quotation-road-rate-preference-priority" data-quotation-road-rate-preference-field="priority"><option value=""${cleanText(bridge?.preferenceEditorPriority || '') === '' ? ' selected' : ''}>Standard</option><option value="preferred"${cleanText(bridge?.preferenceEditorPriority || '') === 'preferred' ? ' selected' : ''}>Preferenza forte</option><option value="backup"${cleanText(bridge?.preferenceEditorPriority || '') === 'backup' ? ' selected' : ''}>Backup</option><option value="avoid"${cleanText(bridge?.preferenceEditorPriority || '') === 'avoid' ? ' selected' : ''}>Evita salvo eccezioni</option></select></div>
          <div class="field quotation-field quotation-field-md"><label for="quotation-road-rate-preference-operator">Operatore interno</label><input id="quotation-road-rate-preference-operator" type="text" placeholder="Nome operatore" value="${U.escapeHtml(bridge.preferenceEditorOperator || '')}" data-quotation-road-rate-preference-field="operator"></div>
          <div class="field quotation-field quotation-field-lg"><label for="quotation-road-rate-preference-note">Nota interna preferenza</label><textarea id="quotation-road-rate-preference-note" rows="2" placeholder="Nota interna su questa tratta preferita" data-quotation-road-rate-preference-field="note">${U.escapeHtml(bridge.preferenceEditorNote || '')}</textarea></div>
        </div>`
      : '';
    const filterControls = status === 'matched'
      ? `<div class="form-grid three">
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-commercialOnly"><label for="quotation-road-rate-filter-commercialOnly">Solo tratte con tariffa</label><select id="quotation-road-rate-filter-commercialOnly" data-quotation-road-rate-filter="commercialOnly"><option value="all"${filterView.filters.commercialOnly === 'all' ? ' selected' : ''}>Tutte</option><option value="with-tariff"${filterView.filters.commercialOnly === 'with-tariff' ? ' selected' : ''}>Solo con tariffa</option></select></div>
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-matchType"><label for="quotation-road-rate-filter-matchType">Tipo match</label><select id="quotation-road-rate-filter-matchType" data-quotation-road-rate-filter="matchType"><option value="all"${filterView.filters.matchType === 'all' ? ' selected' : ''}>Tutti</option><option value="exact"${filterView.filters.matchType === 'exact' ? ' selected' : ''}>Esatto</option><option value="reverse"${filterView.filters.matchType === 'reverse' ? ' selected' : ''}>Inverso</option><option value="partial"${filterView.filters.matchType === 'partial' ? ' selected' : ''}>Parziale</option></select></div>
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-vehicleMode"><label for="quotation-road-rate-filter-vehicleMode">Mezzo</label><select id="quotation-road-rate-filter-vehicleMode" data-quotation-road-rate-filter="vehicleMode"><option value="all"${filterView.filters.vehicleMode === 'all' ? ' selected' : ''}>Tutti</option><option value="exact-only"${filterView.filters.vehicleMode === 'exact-only' ? ' selected' : ''}>Solo stesso mezzo</option></select></div>
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-serviceMode"><label for="quotation-road-rate-filter-serviceMode">Servizio</label><select id="quotation-road-rate-filter-serviceMode" data-quotation-road-rate-filter="serviceMode"><option value="all"${filterView.filters.serviceMode === 'all' ? ' selected' : ''}>Tutti</option><option value="exact-only"${filterView.filters.serviceMode === 'exact-only' ? ' selected' : ''}>Solo stesso servizio</option></select></div>
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-priorityMode"><label for="quotation-road-rate-filter-priorityMode">Priorità</label><select id="quotation-road-rate-filter-priorityMode" data-quotation-road-rate-filter="priorityMode"><option value="all"${filterView.filters.priorityMode === 'all' ? ' selected' : ''}>Tutte</option><option value="recommended"${filterView.filters.priorityMode === 'recommended' ? ' selected' : ''}>Solo consigliate</option><option value="usable"${filterView.filters.priorityMode === 'usable' ? ' selected' : ''}>Solo utilizzabili</option><option value="review"${filterView.filters.priorityMode === 'review' ? ' selected' : ''}>Solo da verificare</option><option value="attention"${filterView.filters.priorityMode === 'attention' ? ' selected' : ''}>Solo critiche</option></select></div>
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-activeState"><label for="quotation-road-rate-filter-activeState">Stato tratta</label><select id="quotation-road-rate-filter-activeState" data-quotation-road-rate-filter="activeState"><option value="all"${filterView.filters.activeState === 'all' ? ' selected' : ''}>Tutte</option><option value="active-only"${filterView.filters.activeState === 'active-only' ? ' selected' : ''}>Solo attive</option><option value="inactive-only"${filterView.filters.activeState === 'inactive-only' ? ' selected' : ''}>Solo inattive</option></select></div>
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-validityMode"><label for="quotation-road-rate-filter-validityMode">Validità</label><select id="quotation-road-rate-filter-validityMode" data-quotation-road-rate-filter="validityMode"><option value="all"${filterView.filters.validityMode === 'all' ? ' selected' : ''}>Tutte</option><option value="current-or-undated"${filterView.filters.validityMode === 'current-or-undated' ? ' selected' : ''}>Valide oggi o senza date</option><option value="current-only"${filterView.filters.validityMode === 'current-only' ? ' selected' : ''}>Solo valide oggi</option><option value="expired-only"${filterView.filters.validityMode === 'expired-only' ? ' selected' : ''}>Solo scadute</option><option value="scheduled-only"${filterView.filters.validityMode === 'scheduled-only' ? ' selected' : ''}>Solo future</option><option value="undated-only"${filterView.filters.validityMode === 'undated-only' ? ' selected' : ''}>Solo senza date</option></select></div>
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-referenceDate"><label for="quotation-road-rate-filter-referenceDate">Data riferimento</label><input id="quotation-road-rate-filter-referenceDate" type="date" value="${U.escapeHtml(filterView.filters.referenceDate || normalizeRoadRateReferenceDate(''))}" data-quotation-road-rate-filter="referenceDate"></div>
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-sortBy"><label for="quotation-road-rate-filter-sortBy">Ordina per</label><select id="quotation-road-rate-filter-sortBy" data-quotation-road-rate-filter="sortBy"><option value="commercial-priority"${filterView.filters.sortBy === 'commercial-priority' ? ' selected' : ''}>Priorità commerciale</option><option value="best-score"${filterView.filters.sortBy === 'best-score' ? ' selected' : ''}>Miglior score</option><option value="lowest-tariff"${filterView.filters.sortBy === 'lowest-tariff' ? ' selected' : ''}>Tariffa minore</option><option value="shortest-contractual-km"${filterView.filters.sortBy === 'shortest-contractual-km' ? ' selected' : ''}>Km contrattuali minori</option><option value="shortest-operational-km"${filterView.filters.sortBy === 'shortest-operational-km' ? ' selected' : ''}>Km operativi minori</option><option value="newest"${filterView.filters.sortBy === 'newest' ? ' selected' : ''}>Più recente</option><option value="earliest-expiry"${filterView.filters.sortBy === 'earliest-expiry' ? ' selected' : ''}>Scadenza più vicina</option></select></div>
          <div class="field quotation-field quotation-field-md quotation-road-rate-filter-reset"><label>&nbsp;</label><button class="btn secondary" type="button" data-quotation-road-rate-filters-reset>Azzera filtri</button></div>
        </div>`
      : '';
    const warningHtml = status === 'matched' && selectedWarnings.length
      ? `<div class="stack-list">${selectedWarnings.map((warning) => `<div class="quotation-static-note"><strong>${U.escapeHtml(warning.badge || 'Avviso commerciale')}</strong><div>${U.escapeHtml(warning.message || '')}</div></div>`).join('')}</div>`
      : status === 'matched' && candidates.length
        ? '<div class="quotation-static-note">La tratta selezionata è pronta per l’applicazione commerciale alla riga trasporto.</div>'
        : '';
    const confirmationHtml = status === 'matched' && applyNeedsConfirmation && !applyAcknowledged && candidates.length
      ? '<div class="quotation-static-note">Prima dell’applicazione il sistema richiede una conferma esplicita perché la tratta selezionata presenta avvisi commerciali bloccanti.</div>'
      : '';
    const confirmedHtml = status === 'matched' && applyNeedsConfirmation && applyAcknowledged && candidates.length
      ? '<div class="quotation-static-note">Conferma registrata per la tratta selezionata. Un nuovo cambio tratta o un nuovo lookup richiederanno una nuova conferma.</div>'
      : '';
    const alternativesHtml = status === 'matched' && candidates.length
      ? `<div class="stack-list">${candidates.map((candidate, index) => {
          const isSelected = cleanText(candidate.roadRateId) === cleanText(bridge.selectedRoadRateId || bridge.roadRateId || '');
          const routeLabel = [candidate.origin, candidate.destination].filter(Boolean).join(' → ') || 'Tratta senza etichetta';
          const tariffLabel = [candidate.tariffAmount || '', candidate.currency || 'EUR'].filter(Boolean).join(' ').trim() || 'Tariffa non presente';
          const summary = [
            `#${index + 1}`,
            candidate.commercialPriorityLabel || 'Da verificare',
            candidate.matchType ? `match ${candidate.matchType}` : '',
            `score ${candidate.score || 0}`,
            candidate.active === false ? 'inattiva' : 'attiva',
            candidate.validityLabel || '',
            candidate.contractualDistanceKm ? `km c. ${candidate.contractualDistanceKm}` : '',
            candidate.operationalDistanceKm ? `km o. ${candidate.operationalDistanceKm}` : '',
            candidate.deltaKm ? `Δ ${candidate.deltaKm}` : '',
            candidate.commercialReference ? `rif. ${candidate.commercialReference}` : '',
            cleanText(bridge?.savedPreferenceSelectedId || '') === cleanText(candidate.roadRateId || '') && cleanText(bridge?.savedPreferenceManualPriority || '') ? `pref. ${roadRateManualPreferenceLabel(bridge.savedPreferenceManualPriority)}` : ''
          ].filter(Boolean).join(' · ');
          return `<div class="quotation-static-note">
              <div><strong>${U.escapeHtml(routeLabel)}</strong></div>
              <div>${U.escapeHtml(summary)}</div>
              <div>${U.escapeHtml(tariffLabel)}</div>
              <div>${U.escapeHtml(candidate.validityWindowLabel || 'Nessuna finestra')}</div>
              <div class="action-row"><button class="btn ${isSelected ? '' : 'secondary'}" type="button" data-quotation-road-rate-select="${U.escapeHtml(candidate.roadRateId || '')}">${isSelected ? 'Tratta selezionata' : 'Usa questa tratta'}</button></div>
            </div>`;
        }).join('')}</div>`
      : '';
    const historyHtml = preferenceHistory.length
      ? `<div class="stack-list">${preferenceHistory.map((entry) => `<div class="quotation-static-note"><div><strong>${U.escapeHtml(roadRatePreferenceHistoryActionLabel(entry.action))}</strong>${entry.selectedRouteLabel ? ` · ${U.escapeHtml(entry.selectedRouteLabel)}` : ''}</div><div>${U.escapeHtml([entry.sameLane ? 'stessa tratta' : 'stesso fornitore', entry.scopeLabel || 'contesto commerciale', cleanText(entry.modifiedBy || '') || 'Operatore non indicato', formatRoadRateTimestampLabel(entry.modifiedAt || '')].filter(Boolean).join(' · '))}</div><div>${U.escapeHtml([entry.manualPriority ? `priorità ${roadRateManualPreferenceLabel(entry.manualPriority)}` : '', entry.internalNote ? `nota ${entry.internalNote}` : '', entry.commercialReference ? `rif. ${entry.commercialReference}` : ''].filter(Boolean).join(' · ') || 'Nessun metadato aggiuntivo')}</div></div>`).join('')}</div>`
      : '';
    let resultHtml = '';
    if (status === 'matched') {
      const totalMatches = Number(bridge.totalMatches || filterView.totalCandidates || 0);
      const totalCommercialMatches = Number(bridge.totalCommercialMatches || filterView.allCandidates.filter((candidate) => candidate.hasCommercialMatch).length || 0);
      const visibleMatches = Number(filterView.totalVisible || candidates.length || 0);
      const topRecommended = candidates.find((candidate) => cleanText(candidate.commercialPriorityTier || '') === 'recommended') || null;
      const summaryNote = totalMatches > 1
        ? `Sono state trovate ${totalMatches} tratte compatibili (${totalCommercialMatches || 0} con tariffa commerciale). Con i filtri correnti ne stai visualizzando ${visibleMatches}.${topRecommended ? ` Priorità automatica: ${topRecommended.origin} → ${topRecommended.destination} (${topRecommended.commercialPriorityLabel}).` : ''}`
        : `Fonte tratta letta dal fornitore stradale: ${U.escapeHtml(bridge.supplierName || query.supplierName || '')}. Puoi applicare il costo a una riga trasporto della quotazione.`;
      const tariffWarning = canApply || !candidates.length ? '' : '<div class="quotation-static-note">La tratta selezionata non ha ancora una tariffa commerciale valorizzata: puoi leggerla e confrontarla, ma non applicarla alla riga trasporto finché il costo non è compilato.</div>';
      const filteredEmpty = !candidates.length
        ? '<div class="quotation-static-note">Con i filtri correnti non resta visibile nessuna tratta. Allenta uno o più filtri oppure premi Azzera filtri.</div>'
        : '';
      const hiddenInfo = filterView.hiddenByFilters > 0 && candidates.length
        ? `<div class="quotation-static-note">${U.escapeHtml(String(filterView.hiddenByFilters))} tratte compatibili sono state nascoste dai filtri avanzati.</div>`
        : '';
      const validityInfo = `<div class="quotation-static-note">Data di riferimento filtri validità: ${U.escapeHtml(filterView.filters.referenceDate || normalizeRoadRateReferenceDate(''))}.</div>`;
      resultHtml = `${selectedSummary}${preferenceRestoreInfo}${savedPreferenceMeta}${warningHtml}${confirmationHtml}${confirmedHtml}${filterControls}<div class="quotation-static-note">${summaryNote}</div>${validityInfo}${hiddenInfo}${tariffWarning}${filteredEmpty}${alternativesHtml}`;
    } else if (status === 'error') {
      const reason = cleanText(bridge.reason || '');
      const guidance = reason === 'no-rates'
        ? 'Per questo fornitore non risultano ancora tratte commerciali caricate. Vai in Anagrafiche > Fornitori > tratte/km foundation e inserisci o importa almeno una matrice CSV/Excel.'
        : reason === 'no-match'
          ? 'Il fornitore ha tratte caricate, ma nessuna corrisponde ai criteri correnti. Verifica origine, destinazione, servizio e mezzo oppure carica tratte aggiuntive.'
          : 'Compila fornitore, origine e destinazione e poi rileggi le tratte compatibili.';
      resultHtml = `<div class="quotation-static-note">${U.escapeHtml(bridge.message || 'Nessuna tratta commerciale disponibile con i criteri correnti.')}</div><div class="quotation-static-note">${U.escapeHtml(guidance)}</div>`;
    } else {
      resultHtml = '<div class="quotation-static-note">Usa questo ponte per leggere dal fornitore stradale le tratte commerciali compatibili in base a fornitore, origine, destinazione, servizio e mezzo. Se esistono più corrispondenze, potrai scegliere quale usare e applicare filtri avanzati.</div>';
    }
    return `
      <section class="quotation-service-card quotation-road-rate-bridge-card">
        <div class="quotation-service-card-head"><h4>Ponte listino vettore</h4><p>Legge le tratte commerciali compatibili dal listino chilometrico del fornitore stradale già censito in Anagrafiche.</p></div>
        <div class="tag-grid quotation-summary-grid">${queryTags.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>
        ${resultHtml}
        ${historyHtml ? `<div class="quotation-static-note"><strong>Storico preferenze commerciali</strong></div>${historyHtml}` : ''}
        ${actionRow}
      </section>`;
  }

  function buildRoadRateBridgeSuccess(result, query, draft = null) {
    const candidates = (Array.isArray(result?.matches) ? result.matches : [])
      .map((match) => summarizeRoadRateCandidate(match, query))
      .filter((candidate) => cleanText(candidate.roadRateId || candidate.origin || candidate.destination));
    const storedPreference = resolveRoadRatePreference(draft, query, candidates);
    const bridge = {
      status: 'matched',
      lookedUpAt: new Date().toISOString(),
      supplierName: cleanText(query?.supplierName || ''),
      origin: cleanText(query?.origin || ''),
      destination: cleanText(query?.destination || ''),
      vehicleType: cleanText(query?.vehicleType || ''),
      serviceType: cleanText(query?.serviceType || ''),
      filters: storedPreference?.filters ? { ...defaultRoadRateBridgeFilters(), ...storedPreference.filters } : defaultRoadRateBridgeFilters(),
      candidates,
      totalMatches: Number(result?.totalMatches || candidates.length || 0),
      totalCommercialMatches: Number(result?.totalCommercialMatches || candidates.filter((candidate) => candidate.hasCommercialMatch).length || 0),
      savedPreferenceScopeKey: cleanText(storedPreference?.resolvedScopeKey || storedPreference?.scopeKey || ''),
      savedPreferenceSelectedId: cleanText(storedPreference?.selectedRoadRateId || ''),
      savedPreferenceLabel: cleanText(storedPreference?.selectedRouteLabel || ''),
      savedPreferenceScopeLevel: cleanText(storedPreference?.resolvedScopeLevel || storedPreference?.scopeLevel || ''),
      savedPreferenceScopeLabel: cleanText(storedPreference?.resolvedScopeLabel || storedPreference?.scopeLabel || ''),
      savedPreferenceManualPriority: cleanText(storedPreference?.manualPriority || ''),
      savedPreferenceInternalNote: cleanText(storedPreference?.internalNote || ''),
      savedPreferenceOperator: cleanText(storedPreference?.modifiedBy || ''),
      savedPreferenceModifiedAt: cleanText(storedPreference?.modifiedAt || storedPreference?.savedAt || ''),
      preferenceFallbackUsed: Boolean(storedPreference?.fallbackUsed),
      preferenceSelectionAvailable: storedPreference ? storedPreference.selectionAvailable !== false : null
    };
    const preferredView = getRoadRateBridgeCandidateView(bridge, query, { limit: 1 });
    const hasStoredSelection = Boolean(bridge.savedPreferenceSelectedId && bridge.preferenceSelectionAvailable !== false && candidates.some((candidate) => cleanText(candidate?.roadRateId || '') === bridge.savedPreferenceSelectedId));
    const preferredCandidateId = cleanText((hasStoredSelection ? bridge.savedPreferenceSelectedId : '') || preferredView?.visibleCandidates?.[0]?.roadRateId || candidates[0]?.roadRateId || '');
    bridge.preferenceMatched = Boolean(hasStoredSelection && preferredCandidateId === bridge.savedPreferenceSelectedId);
    return applyRoadRateBridgeSelection(bridge, preferredCandidateId);
  }

  function buildRoadRateBridgeError(query, message, reason = '') {
    return {
      status: 'error',
      lookedUpAt: new Date().toISOString(),
      supplierName: cleanText(query.supplierName || ''),
      origin: cleanText(query.origin || ''),
      destination: cleanText(query.destination || ''),
      vehicleType: cleanText(query.vehicleType || ''),
      serviceType: cleanText(query.serviceType || ''),
      reason: cleanText(reason || ''),
      message: cleanText(message || 'Nessuna tratta commerciale disponibile con i criteri correnti.')
    };
  }

  function applyRoadRateMatchToDraft(draft) {
    if (!draft || typeof draft !== 'object') return { ok: false, reason: 'missing-draft' };
    const bridge = draft.roadRateBridge;
    if (!bridge || String(bridge.status || '').trim() !== 'matched') return { ok: false, reason: 'missing-match' };
    if (!cleanText(bridge.tariffAmount || '')) return { ok: false, reason: 'missing-tariff' };
    if (!Array.isArray(draft.lineItems)) draft.lineItems = [];
    let targetLine = draft.lineItems.find((row) => String(row?.lineType || '').trim() === 'transport' && !cleanText(row?.cost));
    if (!targetLine) targetLine = draft.lineItems.find((row) => String(row?.lineType || '').trim() === 'transport');
    if (!targetLine) {
      targetLine = Workspace?.defaultLineItem?.({
        lineType: 'transport',
        code: cleanText(bridge.commercialReference || 'ROAD-TR') || 'ROAD-TR',
        description: `Trasporto stradale ${[bridge.origin, bridge.destination].filter(Boolean).join(' → ')}`.trim(),
        unit: cleanText(draft.truckMode || '') || 'viaggio',
        quantity: '1',
        currency: cleanText(bridge.currency || draft.currency || 'EUR') || 'EUR'
      }) || { id: `qli-${Date.now()}`, lineType: 'transport' };
      draft.lineItems.push(targetLine);
    }
    targetLine.supplier = cleanText(bridge.supplierName || draft.supplier || '');
    targetLine.cost = cleanText(bridge.tariffAmount || '');
    targetLine.currency = cleanText(bridge.currency || targetLine.currency || draft.currency || 'EUR') || 'EUR';
    if (!cleanText(targetLine.description)) targetLine.description = `Trasporto stradale ${[bridge.origin, bridge.destination].filter(Boolean).join(' → ')}`.trim();
    if (!cleanText(targetLine.code)) targetLine.code = cleanText(bridge.commercialReference || 'ROAD-TR') || 'ROAD-TR';
    const bridgeNotes = [
      bridge.contractualDistanceKm ? `Km contrattuali: ${bridge.contractualDistanceKm}` : '',
      bridge.operationalDistanceKm ? `Km operativi: ${bridge.operationalDistanceKm}` : '',
      bridge.deltaKm ? `Delta km: ${bridge.deltaKm}` : '',
      bridge.commercialReference ? `Rif. commerciale: ${bridge.commercialReference}` : '',
      bridge.preferenceEditorPriority ? `Priorità preferenza: ${roadRateManualPreferenceLabel(bridge.preferenceEditorPriority)}` : '',
      bridge.preferenceEditorNote ? `Nota interna: ${bridge.preferenceEditorNote}` : '',
      bridge.preferenceEditorOperator ? `Operatore preferenza: ${bridge.preferenceEditorOperator}` : ''
    ].filter(Boolean).join(' · ');
    targetLine.notes = [cleanText(targetLine.notes || ''), bridgeNotes].filter(Boolean).join('\n');
    draft.roadMatchedContractualKm = cleanText(bridge.contractualDistanceKm || '');
    draft.roadMatchedOperationalKm = cleanText(bridge.operationalDistanceKm || '');
    draft.roadMatchedDeltaKm = cleanText(bridge.deltaKm || '');
    draft.roadMatchedTariff = cleanText(bridge.tariffAmount || '');
    draft.roadMatchedCurrency = cleanText(bridge.currency || 'EUR');
    draft.roadMatchedCommercialReference = cleanText(bridge.commercialReference || '');
    return { ok: true, line: targetLine };
  }


  function packagingOptions() {
    return [
      { value: '', label: 'Seleziona' },
      { value: 'container', label: 'Container' },
      { value: 'pallet', label: 'Pallet' },
      { value: 'cartoni', label: 'Cartoni' },
      { value: 'casse', label: 'Casse' },
      { value: 'big-bag', label: 'Big bag' },
      { value: 'fusti', label: 'Fusti' },
      { value: 'bobine', label: 'Bobine / rotoli' },
      { value: 'sfuso', label: 'Sfuso' },
      { value: 'altro', label: 'Altro' }
    ];
  }

  function lineTypeOptions() {
    return [
      { value: 'service', label: 'Voce di servizio' },
      { value: 'container-20', label: 'Container 20 box' },
      { value: 'container-40', label: 'Container 40 box' },
      { value: 'transport', label: 'Trasporto' },
      { value: 'customs', label: 'Operazione doganale' },
      { value: 'warehouse', label: 'Movimentazione magazzino' },
      { value: 'handling', label: 'Handling / terminal' },
      { value: 'assistance', label: 'Assistenza / pratica' },
      { value: 'documentation', label: 'Documentazione' },
      { value: 'surcharge', label: 'Extra / surcharge' },
      { value: 'other', label: 'Altro' }
    ];
  }

  function lineTypeLabel(value) {
    const key = String(value || '').trim();
    const found = lineTypeOptions().find((item) => item.value === key);
    return found ? found.label : 'Voce di servizio';
  }

  function lineDescriptionFallback(row) {
    const explicit = String(row?.description || '').trim();
    if (explicit) return explicit;
    return lineTypeLabel(row?.lineType);
  }

  function intelligentLinePresets(profile, draft = {}) {
    const serviceProfile = String(profile || 'generic').trim() || 'generic';
    const seaPackaging = String(draft?.packagingType || '').trim();
    const seaContainerType = String(draft?.containerType || '').trim();
    const seaContainerSize = String(draft?.containerSize || '').trim();
    const seaContainerLabel = [seaPackaging || 'Container', seaContainerSize || '20'].filter(Boolean).join(' ');
    const seaLineType = ['40', '40HC', '45HC'].includes(seaContainerSize) ? 'container-40' : 'container-20';
    const seaLineCode = seaContainerSize ? `MARE-${seaContainerSize}` : 'MARE-BOX';
    const seaDescription = (seaContainerType || seaPackaging)
      ? `Nolo marittimo ${(seaPackaging || 'container')} ${seaContainerSize}`.trim()
      : 'Nolo marittimo container';
    const roadUnit = String(draft?.truckMode || '').trim() || 'viaggio';
    const warehouseStorageUnit = String(draft?.palletCount || '').trim() ? 'pallet' : 'giorno';
    const maps = {
      generic: [
        { key: 'generic-service', label: 'Voce servizio', lineType: 'service', code: 'SERV', description: 'Voce di servizio', unit: 'flat' },
        { key: 'generic-transport', label: 'Trasporto', lineType: 'transport', code: 'TRASP', description: 'Trasporto', unit: 'servizio' },
        { key: 'generic-customs', label: 'Dogana', lineType: 'customs', code: 'DOG', description: 'Operazione doganale', unit: 'operazione' },
        { key: 'generic-warehouse', label: 'Magazzino', lineType: 'warehouse', code: 'WH', description: 'Movimentazione magazzino', unit: 'mov.' },
        { key: 'generic-assistance', label: 'Assistenza', lineType: 'assistance', code: 'ASS', description: 'Assistenza pratica', unit: 'pratica' }
      ],
      sea: [
        { key: 'sea-box-main', label: seaContainerLabel, lineType: seaLineType, code: seaLineCode, description: seaDescription, unit: seaPackaging === 'container' || !seaPackaging ? 'container' : 'collo' },
        { key: 'sea-customs', label: 'Dogana', lineType: 'customs', code: 'DOG-MARE', description: 'Operazione doganale marittima', unit: 'operazione' },
        { key: 'sea-handling', label: 'Handling', lineType: 'handling', code: 'HAND-MARE', description: 'Handling / terminal portuale', unit: 'mov.' },
        { key: 'sea-warehouse', label: 'Magazzino', lineType: 'warehouse', code: 'WH-MARE', description: 'Spostamento / magazzino', unit: 'mov.' },
        { key: 'sea-docs', label: 'Documenti', lineType: 'documentation', code: 'DOC-MARE', description: 'Documentazione export/import mare', unit: 'set' },
        { key: 'sea-assistance', label: 'Assistenza', lineType: 'assistance', code: 'ASS-MARE', description: 'Assistenza operativa spedizione mare', unit: 'pratica' }
      ],
      air: [
        { key: 'air-freight', label: 'Nolo aereo', lineType: 'transport', code: 'AIR-FRT', description: 'Nolo aereo', unit: 'kg tass.' },
        { key: 'air-awb', label: 'AWB / docs', lineType: 'documentation', code: 'AIR-DOC', description: 'Emissione AWB / documentazione', unit: 'set' },
        { key: 'air-customs', label: 'Dogana', lineType: 'customs', code: 'DOG-AIR', description: 'Operazione doganale aerea', unit: 'operazione' },
        { key: 'air-delivery', label: 'Trasporto finale', lineType: 'transport', code: 'AIR-DEL', description: 'Trasporto finale / first-last mile', unit: 'servizio' },
        { key: 'air-assistance', label: 'Assistenza', lineType: 'assistance', code: 'ASS-AIR', description: 'Assistenza operativa spedizione aerea', unit: 'pratica' }
      ],
      road: [
        { key: 'road-linehaul', label: 'Linea strada', lineType: 'transport', code: 'ROAD-TR', description: 'Trasporto stradale', unit: roadUnit },
        { key: 'road-pickup', label: 'Ritiro', lineType: 'transport', code: 'ROAD-PICK', description: 'Ritiro merce', unit: 'servizio' },
        { key: 'road-customs', label: 'Dogana', lineType: 'customs', code: 'DOG-ROAD', description: 'Operazione doganale', unit: 'operazione' },
        { key: 'road-warehouse', label: 'Magazzino', lineType: 'warehouse', code: 'WH-ROAD', description: 'Sosta / magazzino / cross docking', unit: 'mov.' },
        { key: 'road-assistance', label: 'Assistenza', lineType: 'assistance', code: 'ASS-ROAD', description: 'Assistenza operativa trasporto terra', unit: 'pratica' }
      ],
      rail: [
        { key: 'rail-main', label: 'Trasporto rail', lineType: 'transport', code: 'RAIL-TR', description: 'Trasporto ferroviario', unit: 'unità' },
        { key: 'rail-terminal', label: 'Terminal', lineType: 'handling', code: 'RAIL-TERM', description: 'Handling terminal ferroviario', unit: 'mov.' },
        { key: 'rail-customs', label: 'Dogana', lineType: 'customs', code: 'DOG-RAIL', description: 'Operazione doganale rail', unit: 'operazione' },
        { key: 'rail-docs', label: 'Documenti', lineType: 'documentation', code: 'DOC-RAIL', description: 'Documentazione ferroviaria', unit: 'set' }
      ],
      agency: [
        { key: 'agency-customs', label: 'Operazione doganale', lineType: 'customs', code: 'DOG-AG', description: 'Operazione doganale', unit: 'operazione' },
        { key: 'agency-docs', label: 'Documentazione', lineType: 'documentation', code: 'DOC-AG', description: 'Gestione documentale', unit: 'set' },
        { key: 'agency-booking', label: 'Booking', lineType: 'service', code: 'BOOK-AG', description: 'Gestione booking / coordinamento', unit: 'pratica' },
        { key: 'agency-assistance', label: 'Assistenza', lineType: 'assistance', code: 'ASS-AG', description: 'Assistenza agenzia', unit: 'pratica' }
      ],
      warehouse: [
        { key: 'warehouse-inbound', label: 'Ingresso', lineType: 'warehouse', code: 'WH-IN', description: 'Ricevimento / inbound', unit: 'mov.' },
        { key: 'warehouse-storage', label: 'Giacenza', lineType: 'warehouse', code: 'WH-STO', description: 'Giacenza magazzino', unit: warehouseStorageUnit },
        { key: 'warehouse-picking', label: 'Picking', lineType: 'warehouse', code: 'WH-PICK', description: 'Picking / preparazione ordine', unit: 'operazione' },
        { key: 'warehouse-outbound', label: 'Uscita', lineType: 'warehouse', code: 'WH-OUT', description: 'Outbound / caricazione', unit: 'mov.' },
        { key: 'warehouse-transport', label: 'Trasporto', lineType: 'transport', code: 'WH-TR', description: 'Trasporto da/per deposito', unit: 'servizio' }
      ]
    };
    return maps[serviceProfile] || maps.generic;
  }

  function presetBundleByProfile(profile) {
    const bundles = {
      sea: ['sea-box-main', 'sea-customs', 'sea-handling', 'sea-assistance'],
      air: ['air-freight', 'air-awb', 'air-customs', 'air-assistance'],
      road: ['road-linehaul', 'road-pickup', 'road-assistance'],
      rail: ['rail-main', 'rail-terminal', 'rail-docs'],
      agency: ['agency-customs', 'agency-docs', 'agency-assistance'],
      warehouse: ['warehouse-inbound', 'warehouse-storage', 'warehouse-outbound'],
      generic: ['generic-service', 'generic-transport', 'generic-assistance']
    };
    const serviceProfile = String(profile || 'generic').trim() || 'generic';
    return bundles[serviceProfile] || bundles.generic;
  }

  function presetByKey(profile, presetKey, draft = {}) {
    return intelligentLinePresets(profile, draft).find((item) => String(item?.key || '') === String(presetKey || '')) || null;
  }

  function buildLineFromPreset(profile, presetKey, draft = {}) {
    const preset = presetByKey(profile, presetKey, draft);
    if (!preset) return Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` };
    return Workspace?.defaultLineItem?.({
      lineType: preset.lineType || 'service',
      code: preset.code || '',
      description: preset.description || preset.label || '',
      calcType: preset.calcType || 'fixed',
      quantity: preset.quantity || '1',
      unit: preset.unit || 'flat',
      supplier: preset.supplier || '',
      currency: preset.currency || draft.currency || 'EUR',
      vat: preset.vat || '22',
      packagingType: String(draft?.packagingType || '').trim()
    }) || { id: `qli-${Date.now()}` };
  }

  function maybeHydrateLineFromPreset(line, draft) {
    const currentType = String(line?.lineType || '').trim();
    if (!currentType) return line;
    const preset = intelligentLinePresets(draft?.serviceProfile, draft).find((item) => String(item?.lineType || '') === currentType);
    if (!preset) return line;
    if (!String(line.code || '').trim()) line.code = preset.code || '';
    if (!String(line.description || '').trim()) line.description = preset.description || preset.label || '';
    if (!String(line.unit || '').trim()) line.unit = preset.unit || 'flat';
    if (!String(line.currency || '').trim()) line.currency = draft?.currency || preset.currency || 'EUR';
    return line;
  }

  function crmFeedbackConfig(state) {
    return state?.companyConfig?.crmAutomation?.quotationFeedback || {
      enabled: true,
      defaultDelayDays: 5,
      defaultTemplateKey: 'quotation-feedback-standard',
      templates: []
    };
  }

  function crmFeedbackTemplates(state) {
    const templates = crmFeedbackConfig(state).templates;
    return Array.isArray(templates) ? templates : [];
  }

  function crmFeedbackTemplateOptions(state) {
    return crmFeedbackTemplates(state).map((template) => ({
      value: String(template?.key || '').trim(),
      label: String(template?.name || template?.key || '').trim()
    })).filter((item) => item.value && item.label);
  }

  function getFeedbackTemplate(state, templateKey) {
    const key = String(templateKey || '').trim();
    return crmFeedbackTemplates(state).find((template) => String(template?.key || '').trim() === key) || null;
  }

  function followUpStatusLabel(value) {
    return String(value || '').trim() === 'disabled' ? 'Disattivato' : 'Attivo';
  }

  function emptySpecificProfile(profile) {
    return {
      containerType: '',
      containerSize: '',
      containerCount: '',
      vesselName: '',
      voyageNumber: '',
      freeDays: '',
      airportOrigin: '',
      airportDestination: '',
      awbMode: '',
      mawb: '',
      hawb: '',
      truckMode: '',
      vehicleType: '',
      transitDays: '',
      warehouseSite: '',
      storageDays: '',
      palletCount: '',
      agencyScope: '',
      customsOffice: '',
      customsSection: '',
      railTerminalOrigin: '',
      railTerminalDestination: '',
      wagonType: '',
      scheduleNote: '',
      ...(profile === 'sea' ? { awbMode: '' } : {})
    };
  }

  function createEmptyDraft(state, overrides = {}) {
    const quotationNumber = Workspace?.nextQuotationNumber?.(state) || `Q-${new Date().getFullYear()}-0001`;
    const base = {
      editingRecordId: '',
      quotationNumber,
      serviceProfile: 'generic',
      status: 'draft',
      title: '',
      code: '',
      validFrom: today(),
      validTo: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      client: '',
      clientId: '',
      prospect: '',
      contactPerson: '',
      payer: '',
      paymentTerms: '',
      incoterm: '',
      pickupPlace: '',
      deliveryPlace: '',
      origin: '',
      destination: '',
      loadingPort: '',
      unloadingPort: '',
      carrier: '',
      supplier: '',
      goodsType: '',
      packagingType: '',
      dangerousGoods: 'NO',
      pieces: '',
      dimensions: '',
      grossWeight: '',
      netWeight: '',
      volume: '',
      chargeableWeight: '',
      valueAmount: '',
      currency: 'EUR',
      note: '',
      internalNote: '',
      crmFollowUpEnabled: crmFeedbackConfig(state).enabled ? 'scheduled' : 'disabled',
      crmFollowUpDelayDays: String(crmFeedbackConfig(state).defaultDelayDays || 5),
      crmFollowUpTemplateKey: String(crmFeedbackConfig(state).defaultTemplateKey || ''),
      operatorName: currentOperatorName(state),
      lineItems: [Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` }],
      attachments: [],
      linkedEntities: {},
      ...emptySpecificProfile('generic')
    };
    const merged = { ...base, ...overrides };
    return normalizeQuotationDraft(state, safeClone({ ...merged, ...emptySpecificProfile(String(merged.serviceProfile || 'generic').trim()) , ...merged }));
  }

  function detectProfile(rawValue) {
    const value = String(rawValue || '').toLowerCase();
    if (/air|aereo/.test(value)) return 'air';
    if (/sea|mare/.test(value)) return 'sea';
    if (/road|terra|truck/.test(value)) return 'road';
    if (/rail|ferro/.test(value)) return 'rail';
    if (/ware|magazz/.test(value)) return 'warehouse';
    if (/agenzia|agency|customs/.test(value)) return 'agency';
    return 'generic';
  }

  function buildDraftFromPractice(state, practice, profile = '') {
    const dynamic = practice?.dynamicData || {};
    const serviceProfile = profile || detectProfile(practice?.mode || practice?.practiceType || dynamic.mode || dynamic.serviceProfile);
    const base = createEmptyDraft(state, {
      serviceProfile,
      title: String(practice?.reference || '').trim(),
      practiceId: String(practice?.id || '').trim(),
      practiceReference: String(practice?.reference || '').trim(),
      practiceType: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
      client: String(practice?.clientName || practice?.client || '').trim(),
      clientId: String(practice?.clientId || practice?.linkedClientId || '').trim(),
      prospect: String(dynamic.prospect || '').trim(),
      contactPerson: String(dynamic.attentionTo || '').trim(),
      payer: String(dynamic.payer || '').trim(),
      paymentTerms: String(dynamic.paymentTerms || '').trim(),
      incoterm: String(dynamic.incoterm || '').trim(),
      pickupPlace: String(dynamic.pickupPlace || dynamic.pickupLocation || '').trim(),
      deliveryPlace: String(dynamic.deliveryPlace || dynamic.deliveryLocation || '').trim(),
      origin: String(dynamic.origin || dynamic.originNode || '').trim(),
      destination: String(dynamic.destination || dynamic.destinationNode || '').trim(),
      loadingPort: String(dynamic.loadingPort || dynamic.originPort || '').trim(),
      unloadingPort: String(dynamic.unloadingPort || dynamic.destinationPort || '').trim(),
      carrier: String(dynamic.carrier || dynamic.shippingCompany || '').trim(),
      supplier: String(dynamic.supplier || '').trim(),
      goodsType: String(dynamic.goodsType || dynamic.goodsDescription || '').trim(),
      packagingType: String(dynamic.packagingType || dynamic.packaging || dynamic.transportUnitType || '').trim(),
      dangerousGoods: String(dynamic.dangerousGoods || 'NO').trim() || 'NO',
      pieces: String(dynamic.packages || dynamic.pieces || practice?.packageCount || '').trim(),
      dimensions: String(dynamic.dimensions || '').trim(),
      grossWeight: String(dynamic.grossWeight || practice?.grossWeight || '').trim(),
      netWeight: String(dynamic.netWeight || '').trim(),
      volume: String(dynamic.volume || '').trim(),
      chargeableWeight: String(dynamic.chargeableWeight || '').trim(),
      valueAmount: String(dynamic.invoiceAmount || '').trim(),
      currency: String(dynamic.currency || dynamic.invoiceCurrency || 'EUR').trim() || 'EUR',
      note: String(dynamic.customerInstructions || '').trim(),
      internalNote: String(dynamic.internalNotes || '').trim(),
      containerType: String(dynamic.transportUnitType || dynamic.containerType || '').trim(),
      containerSize: String(dynamic.containerSize || '').trim(),
      containerCount: String(dynamic.containerCount || '').trim(),
      vesselName: String(dynamic.vessel || '').trim(),
      voyageNumber: String(dynamic.voyage || '').trim(),
      airportOrigin: String(dynamic.originAirport || '').trim(),
      airportDestination: String(dynamic.destinationAirport || '').trim(),
      mawb: String(dynamic.mawb || '').trim(),
      hawb: String(dynamic.hawb || dynamic.hawbReference || '').trim(),
      truckMode: String(dynamic.truckMode || '').trim(),
      vehicleType: String(dynamic.vehicleType || '').trim(),
      warehouseSite: String(dynamic.deposit || dynamic.warehouseSite || '').trim(),
      customsOffice: String(dynamic.customsOffice || '').trim(),
      customsSection: String(dynamic.customsSection || '').trim(),
      railTerminalOrigin: String(dynamic.railTerminalOrigin || '').trim(),
      railTerminalDestination: String(dynamic.railTerminalDestination || '').trim()
    });
    return base;
  }

  function filteredRecords(state) {
    const filters = state?.quotationFilters || {};
    const quick = String(filters.quick || '').trim().toLowerCase();
    const profile = String(filters.serviceProfile || 'all').trim();
    const status = String(filters.status || 'all').trim();
    return (state?.quotationRecords || []).filter((record) => {
      if (profile !== 'all' && String(record?.serviceProfile || '').trim() !== profile) return false;
      if (status !== 'all' && String(record?.status || '').trim() !== status) return false;
      if (!quick) return true;
      const haystack = [record?.quotationNumber, record?.title, record?.client, record?.practiceReference, record?.serviceProfile].join(' ').toLowerCase();
      return haystack.includes(quick);
    });
  }

  function quotationKpis(state) {
    const records = Array.isArray(state?.quotationRecords) ? state.quotationRecords : [];
    const sessions = Workspace?.listSessions?.(state) || [];
    const queued = Array.isArray(state?.quotationDispatchQueue) ? state.quotationDispatchQueue.filter((entry) => String(entry?.moduleKey || '') === 'quotations').length : 0;
    return {
      records: records.length,
      openMasks: sessions.length,
      queued
    };
  }

  function recentPractices(state) {
    return (state?.practices || [])
      .slice()
      .sort((a, b) => String(b?.practiceDate || '').localeCompare(String(a?.practiceDate || '')))
      .slice(0, 12);
  }

  function fieldClass(name, options = {}) {
    const sizeMap = { xs: 'quotation-field-xs', sm: 'quotation-field-sm', md: 'quotation-field-md', lg: 'quotation-field-lg', xl: 'quotation-field-xl', full: 'quotation-field-full' };
    const size = String(options.size || 'md').trim();
    const extras = Array.isArray(options.extraClass) ? options.extraClass : [];
    return ['field', 'quotation-field', sizeMap[size] || sizeMap.md, `quotation-field-${String(name || '').trim()}`, ...extras].join(' ');
  }

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const list = Array.isArray(options.list) ? options.list.filter(Boolean) : [];
    const datalistId = list.length ? `quotation-list-${String(name || '').trim()}` : '';
    const attrs = [`data-quotation-field="${U.escapeHtml(name)}"`, `id="quotation-${U.escapeHtml(name)}"`];
    if (datalistId) attrs.push(`list="${U.escapeHtml(datalistId)}"`);
    if (options.placeholder) attrs.push(`placeholder="${U.escapeHtml(options.placeholder)}"`);
    const wrapClass = fieldClass(name, options);
    if (type === 'textarea') {
      return `<div class="${wrapClass}"><label for="quotation-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><textarea ${attrs.join(' ')} rows="${Number(options.rows || 3)}">${U.escapeHtml(value || '')}</textarea></div>`;
    }
    if (type === 'select') {
      const items = Array.isArray(options.items) ? options.items : [];
      return `<div class="${wrapClass}"><label for="quotation-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><select ${attrs.join(' ')}>${items.map((item) => {
        const itemValue = String(item?.value ?? '');
        const selected = itemValue === String(value ?? '') ? ' selected' : '';
        return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
      }).join('')}</select></div>`;
    }
    return `<div class="${wrapClass}"><label for="quotation-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><input ${attrs.join(' ')} type="${U.escapeHtml(type)}" value="${U.escapeHtml(value || '')}">${datalistId ? `<datalist id="${U.escapeHtml(datalistId)}">${list.map((item) => `<option value="${U.escapeHtml(typeof item === 'string' ? item : item?.label || item?.value || '')}"></option>`).join('')}</datalist>` : ''}</div>`;
  }

  function profileButtons(activeProfile) {
    const items = [
      ['generic', 'Generica'],
      ['sea', 'Mare'],
      ['air', 'Aerea'],
      ['rail', 'Ferrovia'],
      ['road', 'Terra'],
      ['agency', 'Agenzia'],
      ['warehouse', 'Magazzino']
    ];
    return `<div class="quotation-profile-strip">${items.map(([value, label]) => `<button type="button" class="quotation-profile-chip${value === activeProfile ? ' active' : ''}" data-quotation-profile="${U.escapeHtml(value)}">${U.escapeHtml(label)}</button>`).join('')}</div>`;
  }

  function renderLauncher(state, i18n, selectedPractice) {
    const kpis = quotationKpis(state);
    return `
      <section class="panel quotations-launcher-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.quotations', 'Quotazioni'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationsModuleHint', 'Preventivi multi-servizio con profili differenziati, dettaglio economico e documenti collegati.'))}</p>
          </div>
        </div>
        <div class="quotations-kpi-grid">
          <article class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Quotazioni salvate'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.records))}</div></article>
          <article class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.openMasks))}</div></article>
          <article class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.queuedDispatches', 'Invii in coda'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.queued))}</div></article>
          <article class="stack-item"><span>Profili</span><div class="summary-value">7</div></article>
        </div>
        <div class="quotations-launcher-grid">
          <div class="quotation-side-card">
            <div class="quotation-side-card-title">Azioni rapide</div>
            <div class="quotation-filter-stack">
              <button class="btn" type="button" data-quotation-new>Nuova quotazione</button>
              ${selectedPractice ? `<button class="btn secondary" type="button" data-quotation-open-active>Usa pratica attiva</button>` : ''}
              ${renderField('Ricerca rapida', 'filterQuick', state?.quotationFilters?.quick || '', { size: 'full' })}
              ${renderField('Stato', 'filterStatus', state?.quotationFilters?.status || 'all', { type: 'select', size: 'full', items: [{ value: 'all', label: 'Tutti' }, { value: 'draft', label: 'Bozza' }, { value: 'sent', label: 'Inviata' }, { value: 'approved', label: 'Confermata' }, { value: 'expired', label: 'Scaduta' }] })}
              ${renderField('Profilo', 'filterProfile', state?.quotationFilters?.serviceProfile || 'all', { type: 'select', size: 'full', items: [{ value: 'all', label: 'Tutti i profili' }, { value: 'generic', label: 'Generica' }, { value: 'sea', label: 'Mare' }, { value: 'air', label: 'Aerea' }, { value: 'rail', label: 'Ferrovia' }, { value: 'road', label: 'Terra' }, { value: 'agency', label: 'Agenzia' }, { value: 'warehouse', label: 'Magazzino' }] })}
            </div>
          </div>
          <div class="quotation-main-card">
            <div class="quotation-side-card-title">Pratiche recenti</div>
            <div class="quotation-practice-chip-grid">
              ${recentPractices(state).map((practice) => `<button class="stack-item quotation-practice-chip" type="button" data-quotation-open-practice="${U.escapeHtml(practice.id)}"><strong>${U.escapeHtml(practice.reference || '—')}</strong><span>${U.escapeHtml(practice.clientName || practice.client || '')}</span><span>${U.escapeHtml(practice.practiceTypeLabel || practice.practiceType || '')}</span></button>`).join('')}
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderSavedRecords(state, i18n) {
    const records = filteredRecords(state);
    return `
      <section class="panel quotations-records-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Quotazioni salvate'))}</h3></div></div>
        ${records.length ? `<div class="quotation-record-list">${records.map((record) => `<article class="quotation-record-card"><div><strong>${U.escapeHtml(record.quotationNumber || '—')}</strong><span>${U.escapeHtml(record.client || '—')}</span><em>${U.escapeHtml(serviceProfileLabel(record.serviceProfile))} · ${U.escapeHtml(record.practiceReference || record.title || '—')}</em></div><div class="action-row"><button type="button" class="btn secondary" data-quotation-open-record="${U.escapeHtml(record.id)}">${U.escapeHtml(i18n?.t('ui.open', 'Apri'))}</button><button type="button" class="btn secondary" data-quotation-duplicate-record="${U.escapeHtml(record.id)}">${U.escapeHtml(i18n?.t('ui.duplicate', 'Duplica'))}</button></div></article>`).join('')}</div>` : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noQuotationsYet', 'Nessuna quotazione salvata.'))}</div>`}
      </section>`;
  }

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions?.(state) || [];
    const activeId = String(state?.quotationsWorkspace?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel quotations-session-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</h3></div></div>
        <div class="quotation-session-strip">${sessions.map((session) => {
          const draft = session.draft || {};
          const active = session.id === activeId ? ' active' : '';
          return `<div class="quotation-session-chip${active}"><button type="button" class="quotation-session-main" data-quotation-session-switch="${U.escapeHtml(session.id)}"><strong>${U.escapeHtml(draft.quotationNumber || 'Nuova')}</strong><span>${U.escapeHtml(draft.client || '—')}</span><span>${U.escapeHtml(serviceProfileLabel(draft.serviceProfile))}</span></button><button type="button" class="quotation-session-close" data-quotation-session-close="${U.escapeHtml(session.id)}">×</button></div>`;
        }).join('')}</div>
      </section>`;
  }

  function renderQuotationClientField(state, draft, i18n) {
    const entries = quotationClientEntries(state);
    const unresolvedClient = cleanText(draft?.client || '') && !cleanText(draft?.clientId || '');
    const items = [{ value: '', label: unresolvedClient ? `Cliente legacy non allineato: ${cleanText(draft?.client || '')}` : (i18n?.t('ui.selectClient', 'Seleziona cliente') || 'Seleziona cliente') }].concat(entries.map((entry) => {
      const secondary = cleanText(entry?.secondary || '');
      const tertiary = cleanText(entry?.tertiary || '');
      const detail = [secondary !== '—' ? secondary : '', tertiary !== '—' ? tertiary : ''].filter(Boolean).join(' · ');
      return {
        value: cleanText(entry?.id || ''),
        label: detail ? `${cleanText(entry?.primary || entry?.value || '')} — ${detail}` : cleanText(entry?.primary || entry?.value || '')
      };
    }));
    const selectedValue = unresolvedClient ? '' : String(draft?.clientId || '');
    const wrapClass = fieldClass('client', { size: 'lg' });
    return `<div class="${wrapClass}"><label for="quotation-client-selector">${U.escapeHtml(i18n?.t('ui.clientRequired', 'Cliente') || 'Cliente')}</label><select id="quotation-client-selector" data-quotation-client-id>${items.map((item) => {
      const itemValue = String(item?.value ?? '');
      const selected = itemValue === selectedValue ? ' selected' : '';
      return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
    }).join('')}</select></div>`;
  }

  function renderSummary(draft) {
    const items = [
      ['Numero', draft.quotationNumber || '—'],
      ['Cliente', draft.client || '—'],
      ['Profilo', serviceProfileLabel(draft.serviceProfile)],
      ['Valida dal', draft.validFrom || '—']
    ];
    return `<div class="tag-grid quotation-summary-grid">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderCollapsibleCard(title, subtitle, body, options = {}) {
    const openAttr = options.open ? ' open' : '';
    const compactClass = options.compact ? ' is-compact' : '';
    return `
      <details class="quotation-collapsible${compactClass}"${openAttr}>
        <summary>
          <div class="quotation-collapsible-head">
            <strong>${U.escapeHtml(title || '')}</strong>
            ${subtitle ? `<span>${U.escapeHtml(subtitle)}</span>` : ''}
          </div>
        </summary>
        <div class="quotation-collapsible-body">${body || ''}</div>
      </details>`;
  }

  function ensureQuotationUiStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('kedrix-quotations-ui-style')) return;
    const style = document.createElement('style');
    style.id = 'kedrix-quotations-ui-style';
    style.textContent = `
      .quotation-header-stack{display:grid;gap:12px}
      .quotation-operational-stack{display:grid;gap:12px;margin-top:12px}
      .quotation-collapsible{border:1px solid var(--border-subtle, #d7e2ec);border-radius:14px;background:var(--surface-raised, #fff);overflow:hidden}
      .quotation-collapsible + .quotation-collapsible{margin-top:12px}
      .quotation-collapsible summary{list-style:none;cursor:pointer;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .quotation-collapsible summary::-webkit-details-marker{display:none}
      .quotation-collapsible summary::after{content:'▸';font-size:12px;color:var(--text-secondary, #64748b);transition:transform .18s ease}
      .quotation-collapsible[open] summary::after{transform:rotate(90deg)}
      .quotation-collapsible-head{display:grid;gap:2px}
      .quotation-collapsible-head strong{font-size:13px;color:var(--text-primary, #0f172a)}
      .quotation-collapsible-head span{font-size:12px;color:var(--text-secondary, #64748b)}
      .quotation-collapsible-body{padding:0 14px 14px}
      .quotation-collapsible.is-compact .quotation-collapsible-body{padding-top:2px}
      .quotation-header-banner{margin-top:4px}
      .quotation-common-card .quotation-service-card-head p{max-width:720px}
      .quotation-service-card.is-inline{margin-top:0}
      .quotation-secondary-stack{display:grid;gap:12px}
    `;
    document.head.appendChild(style);
  }

  function renderQuotationIncotermField(state, draft, i18n) {
    const entries = quotationIncotermEntries(state, draft);
    const linkedValue = cleanText(draft?.linkedEntities?.incoterm?.recordId || draft?.linkedEntities?.incoterm?.value || '');
    const unresolvedIncoterm = cleanText(draft?.incoterm || '') && !linkedValue;
    const items = [{ value: '', label: unresolvedIncoterm ? `Resa legacy non allineata: ${cleanText(draft?.incoterm || '')}` : (i18n?.t('ui.selectIncoterm', 'Seleziona resa') || 'Seleziona resa') }].concat(entries.map((entry) => ({
      value: String(entry?.value || '').trim(),
      label: String(entry?.displayValue || entry?.label || entry?.value || '').trim() || String(entry?.value || '').trim()
    })));
    const selectedValue = unresolvedIncoterm ? '' : cleanText(draft?.incoterm || linkedValue);
    const wrapClass = fieldClass('incoterm', { size: 'sm' });
    return `<div class="${wrapClass}"><label for="quotation-incoterm-selector">${U.escapeHtml(i18n?.t('ui.incoterm', 'Resa') || 'Resa')}</label><select id="quotation-incoterm-selector" data-quotation-incoterm="true">${items.map((item) => {
      const itemValue = String(item?.value || '');
      const selected = itemValue === selectedValue ? ' selected' : '';
      return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label || itemValue)}</option>`;
    }).join('')}</select></div>`;
  }

  function renderCommonFields(state, draft, dirs, i18n) {
    const seaPorts = (dirs.seaPortLocodes || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name).filter(Boolean);
    const airports = (dirs.airports || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name || entry).filter(Boolean);
    const companies = [].concat(dirs.shippingCompanies || [], dirs.airlines || [], dirs.carriers || []);
    return `
      <section class="quotation-service-card quotation-common-card">
        <div class="quotation-service-card-head">
          <h4>Dati operativi principali</h4>
          <p>Campi condivisi della testata commerciale e logistica, portati subito in alto per lavorare senza scorrere blocchi secondari.</p>
        </div>
        <div class="quotation-grid">
          ${renderField(i18n?.t('ui.description', 'Descrizione'), 'title', draft.title, { size: 'xl' })}
          ${renderField('Codice', 'code', draft.code, { size: 'sm' })}
          ${renderField(i18n?.t('ui.validFrom', 'Valida dal'), 'validFrom', draft.validFrom, { type: 'date', size: 'sm' })}
          ${renderField(i18n?.t('ui.validTo', 'Valida a'), 'validTo', draft.validTo, { type: 'date', size: 'sm' })}
          ${renderQuotationClientField(state, draft, i18n)}
          ${renderField('Prospect', 'prospect', draft.prospect, { size: 'md' })}
          ${renderField(i18n?.t('ui.contactPerson', 'Contatto'), 'contactPerson', draft.contactPerson, { size: 'md' })}
          ${renderField(i18n?.t('ui.payer', 'Pagatore'), 'payer', draft.payer, { size: 'md' })}
          ${renderField(i18n?.t('ui.paymentTerms', 'Condizioni pagamento'), 'paymentTerms', draft.paymentTerms, { size: 'md' })}
          ${renderQuotationIncotermField(state, draft, i18n)}
          ${renderField(i18n?.t('ui.pickup', 'Ritiro'), 'pickupPlace', draft.pickupPlace, { size: 'md', list: dirs.logisticsLocations || [] })}
          ${renderField(i18n?.t('ui.delivery', 'Consegna'), 'deliveryPlace', draft.deliveryPlace, { size: 'md', list: dirs.logisticsLocations || [] })}
          ${renderField(i18n?.t('ui.origin', 'Origine'), 'origin', draft.origin, { size: 'md', list: dirs.originDirectories || [] })}
          ${renderField(i18n?.t('ui.destination', 'Destinazione'), 'destination', draft.destination, { size: 'md', list: dirs.destinationDirectories || [] })}
          ${renderField(i18n?.t('ui.loadingPort', 'Porto imbarco'), 'loadingPort', draft.loadingPort, { size: 'md', list: seaPorts.length ? seaPorts : airports })}
          ${renderField(i18n?.t('ui.unloadingPort', 'Porto sbarco'), 'unloadingPort', draft.unloadingPort, { size: 'md', list: seaPorts.length ? seaPorts : airports })}
          ${renderField(i18n?.t('ui.carrier', 'Compagnia / vettore'), 'carrier', draft.carrier, { size: 'md', list: companies })}
          ${renderField(i18n?.t('ui.supplier', 'Fornitore'), 'supplier', draft.supplier, { size: 'md', list: dirs.suppliers || [] })}
          ${renderField(i18n?.t('ui.goodsType', 'Tipologia merce'), 'goodsType', draft.goodsType, { size: 'md' })}
          ${renderField(i18n?.t('ui.dangerousGoods', 'Merce pericolosa'), 'dangerousGoods', draft.dangerousGoods, { type: 'select', size: 'xs', items: [{ value: 'NO', label: 'NO' }, { value: 'SI', label: 'SI' }] })}
          ${renderField(i18n?.t('ui.packages', 'Colli'), 'pieces', draft.pieces, { size: 'xs' })}
          ${renderField(i18n?.t('ui.dimensions', 'Dimensioni'), 'dimensions', draft.dimensions, { size: 'sm' })}
          ${renderField(i18n?.t('ui.grossWeight', 'Peso lordo'), 'grossWeight', draft.grossWeight, { size: 'xs' })}
          ${renderField(i18n?.t('ui.netWeight', 'Peso netto'), 'netWeight', draft.netWeight, { size: 'xs' })}
          ${renderField(i18n?.t('ui.volume', 'Volume'), 'volume', draft.volume, { size: 'xs' })}
          ${renderField(i18n?.t('ui.chargeableWeight', 'Peso tassabile'), 'chargeableWeight', draft.chargeableWeight, { size: 'xs' })}
          ${renderField(i18n?.t('ui.amount', 'Valore'), 'valueAmount', draft.valueAmount, { size: 'xs' })}
          ${renderField(i18n?.t('ui.currency', 'Valuta'), 'currency', draft.currency, { type: 'select', size: 'xs', items: (dirs.currencies || ['EUR']).map((item) => ({ value: item, label: item })) })}
          ${renderField(i18n?.t('ui.customerNotes', 'Note cliente'), 'note', draft.note, { type: 'textarea', size: 'full', rows: 3 })}
          ${renderField(i18n?.t('ui.internalNotes', 'Note interne'), 'internalNote', draft.internalNote, { type: 'textarea', size: 'full', rows: 3 })}
        </div>
      </section>`;
  }

  function renderSeaFields(draft, dirs) {
    const containerSizes = ['20', '40', '40HC', '45HC', 'LCL', 'Break bulk'].map((item) => ({ value: item, label: item }));
    return `
      <section class="quotation-service-card is-sea">
        <div class="quotation-service-card-head"><h4>Profilo mare</h4><p>Sea profile con container, tipo imballo, nave e viaggio.</p></div>
        <div class="quotation-grid">
          ${renderField('Tipo di container', 'containerType', draft.containerType, { type: 'select', size: 'lg', items: [{ value: '', label: 'Seleziona tipo unità' }, ...transportUnitOptions()] })}
          ${renderField('Dimensione container', 'containerSize', draft.containerSize, { type: 'select', size: 'sm', items: [{ value: '', label: 'Seleziona' }, ...containerSizes] })}
          ${renderField('N. container / unità', 'containerCount', draft.containerCount, { size: 'xs' })}
          ${renderField('Nave', 'vesselName', draft.vesselName, { size: 'md', list: dirs.shippingCompanies || [] })}
          ${renderField('Viaggio', 'voyageNumber', draft.voyageNumber, { size: 'sm' })}
          ${renderField('Franchi / free days', 'freeDays', draft.freeDays, { size: 'sm' })}
          ${renderField('Porto imbarco', 'loadingPort', draft.loadingPort, { size: 'md', list: (dirs.seaPortLocodes || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name).filter(Boolean) })}
          ${renderField('Porto sbarco', 'unloadingPort', draft.unloadingPort, { size: 'md', list: (dirs.seaPortLocodes || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name).filter(Boolean) })}
        </div>
      </section>`;
  }

  function renderAirFields(draft, dirs) {
    const airports = (dirs.airports || []).map((entry) => entry?.displayValue || entry?.label || entry?.value || entry?.name || entry).filter(Boolean);
    return `
      <section class="quotation-service-card is-air">
        <div class="quotation-service-card-head"><h4>Profilo aereo</h4><p>Campi dedicati a aeroporto, AWB e peso tassabile.</p></div>
        <div class="quotation-grid">
          ${renderField('Aeroporto partenza', 'airportOrigin', draft.airportOrigin, { size: 'md', list: airports })}
          ${renderField('Aeroporto arrivo', 'airportDestination', draft.airportDestination, { size: 'md', list: airports })}
          ${renderField('Tipo AWB', 'awbMode', draft.awbMode, { type: 'select', size: 'sm', items: [{ value: '', label: 'Seleziona' }, { value: 'direct', label: 'Diretto' }, { value: 'console', label: 'Consolle' }, { value: 'back-to-back', label: 'Back to back' }] })}
          ${renderField('MAWB', 'mawb', draft.mawb, { size: 'sm' })}
          ${renderField('HAWB', 'hawb', draft.hawb, { size: 'sm' })}
          ${renderField('Peso tassabile', 'chargeableWeight', draft.chargeableWeight, { size: 'xs' })}
        </div>
      </section>`;
  }

  function renderRoadFields(draft, dirs) {
    return `
      <section class="quotation-service-card is-road">
        <div class="quotation-service-card-head"><h4>Profilo terra</h4><p>Campi dedicati a tipo servizio strada e mezzo.</p></div>
        <div class="quotation-grid">
          ${renderField('Servizio', 'truckMode', draft.truckMode, { type: 'select', size: 'sm', items: [{ value: '', label: 'Seleziona' }, { value: 'FTL', label: 'FTL' }, { value: 'LTL', label: 'LTL' }, { value: 'Espresso', label: 'Espresso' }, { value: 'Dedicato', label: 'Dedicato' }] })}
          ${renderField('Tipologia mezzo', 'vehicleType', draft.vehicleType, { size: 'md', list: dirs.vehicleTypes || [] })}
          ${renderField('Transit time', 'transitDays', draft.transitDays, { size: 'sm' })}
          ${renderField('Schedule / note corsa', 'scheduleNote', draft.scheduleNote, { size: 'md' })}
        </div>
      </section>
      ${renderRoadRateBridgeCard(draft)}`;
  }

  function renderRailFields(draft) {
    return `
      <section class="quotation-service-card is-rail">
        <div class="quotation-service-card-head"><h4>Profilo ferrovia</h4><p>Campi dedicati a terminal e asset ferroviari.</p></div>
        <div class="quotation-grid">
          ${renderField('Terminal origine', 'railTerminalOrigin', draft.railTerminalOrigin, { size: 'md' })}
          ${renderField('Terminal destinazione', 'railTerminalDestination', draft.railTerminalDestination, { size: 'md' })}
          ${renderField('Tipologia wagon', 'wagonType', draft.wagonType, { size: 'sm' })}
          ${renderField('Schedule / slot', 'scheduleNote', draft.scheduleNote, { size: 'md' })}
        </div>
      </section>`;
  }

  function renderAgencyFields(draft, dirs) {
    return `
      <section class="quotation-service-card is-agency">
        <div class="quotation-service-card-head"><h4>Profilo agenzia</h4><p>Campi dedicati a scope documentale e doganale.</p></div>
        <div class="quotation-grid">
          ${renderField('Ambito agenzia', 'agencyScope', draft.agencyScope, { type: 'select', size: 'sm', items: [{ value: '', label: 'Seleziona' }, { value: 'Documentale', label: 'Documentale' }, { value: 'Doganale', label: 'Doganale' }, { value: 'Rappresentanza', label: 'Rappresentanza' }, { value: 'Booking', label: 'Booking' }] })}
          ${renderField('Dogana', 'customsOffice', draft.customsOffice, { size: 'md', list: (dirs.customsOffices || []).map((entry) => entry?.label || entry?.value || entry?.name || entry).filter(Boolean) })}
          ${renderField('Sezione', 'customsSection', draft.customsSection, { size: 'sm' })}
          ${renderField('Riferimenti / note pratiche', 'scheduleNote', draft.scheduleNote, { size: 'md' })}
        </div>
      </section>`;
  }

  function renderWarehouseFields(draft, dirs) {
    return `
      <section class="quotation-service-card is-warehouse">
        <div class="quotation-service-card-head"><h4>Profilo magazzino</h4><p>Campi dedicati a deposito, giacenza e pallet.</p></div>
        <div class="quotation-grid">
          ${renderField('Sito / deposito', 'warehouseSite', draft.warehouseSite, { size: 'md', list: dirs.deposits || [] })}
          ${renderField('Giorni giacenza', 'storageDays', draft.storageDays, { size: 'sm' })}
          ${renderField('N. pallet', 'palletCount', draft.palletCount, { size: 'sm' })}
          ${renderField('Schedule / note deposito', 'scheduleNote', draft.scheduleNote, { size: 'md' })}
        </div>
      </section>`;
  }

  function renderServiceSpecificFields(draft, state) {
    const dirs = directories(state);
    switch (String(draft.serviceProfile || 'generic').trim()) {
      case 'sea': return renderSeaFields(draft, dirs);
      case 'air': return renderAirFields(draft, dirs);
      case 'rail': return renderRailFields(draft, dirs);
      case 'road': return renderRoadFields(draft, dirs);
      case 'agency': return renderAgencyFields(draft, dirs);
      case 'warehouse': return renderWarehouseFields(draft, dirs);
      default:
        return `
          <section class="quotation-service-card is-generic">
            <div class="quotation-service-card-head"><h4>Profilo generico</h4><p>Seleziona un profilo dedicato per abilitare campi specifici mare, aereo, terra, ferrovia, agenzia o magazzino.</p></div>
          </section>`;
    }
  }

  function renderTestata(draft, state, i18n) {
    const dirs = directories(state);
    const summaryBlock = renderCollapsibleCard(
      'Riepilogo rapido',
      'Numero, cliente, profilo e dati testata secondari sempre richiamabili senza occupare spazio operativo.',
      `<div class="quotation-secondary-stack">
        <div class="quotation-header-banner">${Branding?.renderBanner?.(state, { eyebrow: 'Kedrix One · Quotazioni', title: String(state?.companyConfig?.name || 'Kedrix One').trim(), subtitle: 'Header aziendale visualizzato in testata modulo e stampa', meta: companyMeta(state, draft) }) || ''}</div>
        ${renderSummary(draft)}
      </div>`,
      { open: false, compact: true }
    );
    const crmBlock = renderCollapsibleCard(
      'CRM e follow-up feedback',
      'Sezione secondaria: resta disponibile ma non blocca l’inizio del lavoro sulla quotazione.',
      renderCrmFollowUpCard(draft, state),
      { open: false }
    );
    return `
      <section class="panel quotation-editor-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(draft.quotationNumber || 'Nuova quotazione')}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationHeaderHint', 'Testata compatta con profili diversi per mare, aerea, terra, ferrovia, agenzia e magazzino.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-quotation-print>${U.escapeHtml(i18n?.t('ui.print', 'Stampa'))}</button>
            <button class="btn secondary" type="button" data-quotation-save-send>${U.escapeHtml(i18n?.t('ui.saveAndSend', 'Salva e invia'))}</button>
            <button class="btn secondary" type="button" data-quotation-save>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-quotation-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        <div class="quotation-header-stack">
          ${profileButtons(draft.serviceProfile)}
          <div class="quotation-operational-stack">
            ${renderCommonFields(state, draft, dirs, i18n)}
            ${renderServiceSpecificFields(draft, state)}
          </div>
          ${summaryBlock}
          ${crmBlock}
        </div>
      </section>`;
  }

  function renderPresetToolbar(draft) {
    const presets = intelligentLinePresets(draft?.serviceProfile, draft);
    const bundle = presetBundleByProfile(draft?.serviceProfile).map((key) => presetByKey(draft?.serviceProfile, key, draft)).filter(Boolean);
    const bundleLabel = serviceProfileLabel(draft?.serviceProfile || 'generic');
    return `
      <div class="quotation-preset-toolbar">
        <div class="quotation-preset-toolbar-copy">
          <strong>Righe intelligenti per profilo</strong>
          <span>Preset coerenti con ${U.escapeHtml(bundleLabel)} senza perdere la libertà multi-riga.</span>
        </div>
        <div class="quotation-preset-toolbar-actions">
          <button class="btn secondary" type="button" data-quotation-apply-bundle>${U.escapeHtml(`Carica set ${bundleLabel}`)}</button>
          ${bundle.map((preset) => `<button class="quotation-preset-chip is-bundle" type="button" data-quotation-add-preset="${U.escapeHtml(preset.key)}">${U.escapeHtml(preset.label)}</button>`).join('')}
        </div>
      </div>
      <div class="quotation-preset-grid">${presets.map((preset) => `<button class="quotation-preset-card" type="button" data-quotation-add-preset="${U.escapeHtml(preset.key)}"><strong>${U.escapeHtml(preset.label)}</strong><span>${U.escapeHtml(preset.description || preset.label || '')}</span><em>${U.escapeHtml(preset.code || 'Preset')}</em></button>`).join('')}</div>`;
  }

  function renderQuotationLineSupplierField(state, row, index, i18n) {
    const entries = quotationSupplierEntries(state);
    const unresolvedSupplier = cleanText(row?.supplier || '') && !cleanText(row?.supplierId || '');
    const items = [{
      value: '',
      label: unresolvedSupplier
        ? `Fornitore legacy non allineato: ${cleanText(row?.supplier || '')}`
        : (i18n?.t('ui.selectSupplier', 'Seleziona fornitore') || 'Seleziona fornitore')
    }].concat(entries.map((entry) => {
      const secondary = cleanText(entry?.secondary || '');
      const tertiary = cleanText(entry?.tertiary || '');
      const detail = [secondary !== '—' ? secondary : '', tertiary !== '—' ? tertiary : ''].filter(Boolean).join(' · ');
      return {
        value: cleanText(entry?.id || ''),
        label: detail ? `${cleanText(entry?.primary || entry?.value || '')} — ${detail}` : cleanText(entry?.primary || entry?.value || '')
      };
    }));
    const selectedValue = unresolvedSupplier ? '' : String(row?.supplierId || '');
    return `<select data-quotation-line-supplier-id data-quotation-line-index="${index}">${items.map((item) => {
      const itemValue = String(item?.value ?? '');
      const selected = itemValue === selectedValue ? ' selected' : '';
      return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
    }).join('')}</select>`;
  }

  function renderDetail(state, draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <section class="panel quotation-editor-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.detail', 'Dettaglio'))}</h3><p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationDetailHint', 'La quotazione può contenere più righe operative per qualunque profilo: container 20/40, operazioni doganali, trasporto, magazzino, assistenza e altre voci commerciali.'))}</p></div><div class="action-row"><button class="btn secondary" type="button" data-quotation-add-line>${U.escapeHtml(i18n?.t('ui.addRow', 'Aggiungi riga'))}</button></div></div>
        ${renderPresetToolbar(draft)}
        <div class="quotation-line-table-wrap">
          <table class="quotation-line-table"><thead><tr><th>Voce</th><th>Codice</th><th>Descrizione</th><th>Calc.</th><th>Q.tà</th><th>Unità</th><th>Fornitore</th><th>Costo</th><th>Prezzo cliente</th><th>Valuta</th><th>IVA</th><th>Op.</th></tr></thead><tbody>${rows.map((row, index) => `<tr>
            <td><select data-quotation-line-field="lineType" data-quotation-line-index="${index}">${lineTypeOptions().map((item) => `<option value="${U.escapeHtml(item.value)}"${String(row.lineType || 'service') === item.value ? ' selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}</select></td>
            <td><input type="text" data-quotation-line-field="code" data-quotation-line-index="${index}" value="${U.escapeHtml(row.code || '')}" placeholder="Es. MARE-20BX"></td>
            <td><input type="text" data-quotation-line-field="description" data-quotation-line-index="${index}" value="${U.escapeHtml(row.description || '')}" placeholder="Es. Trasporto container 20 box"></td>
            <td><select data-quotation-line-field="calcType" data-quotation-line-index="${index}"><option value="fixed"${String(row.calcType || 'fixed') === 'fixed' ? ' selected' : ''}>Fixed</option><option value="per-unit"${String(row.calcType || '') === 'per-unit' ? ' selected' : ''}>Per unità</option></select></td>
            <td><input type="number" step="0.01" data-quotation-line-field="quantity" data-quotation-line-index="${index}" value="${U.escapeHtml(row.quantity || '')}"></td>
            <td><input type="text" data-quotation-line-field="unit" data-quotation-line-index="${index}" value="${U.escapeHtml(row.unit || '')}" placeholder="flat / cad / pallet"></td>
            <td>${renderQuotationLineSupplierField(state, row, index, i18n)}</td>
            <td><input type="number" step="0.01" data-quotation-line-field="cost" data-quotation-line-index="${index}" value="${U.escapeHtml(row.cost || '')}"></td>
            <td><input type="number" step="0.01" data-quotation-line-field="revenue" data-quotation-line-index="${index}" value="${U.escapeHtml(row.revenue || '')}"></td>
            <td><input type="text" data-quotation-line-field="currency" data-quotation-line-index="${index}" value="${U.escapeHtml(row.currency || 'EUR')}"></td>
            <td><input type="text" data-quotation-line-field="vat" data-quotation-line-index="${index}" value="${U.escapeHtml(row.vat || '22')}"></td>
            <td><button class="btn secondary small-btn" type="button" data-quotation-remove-line="${index}">Rimuovi</button></td>
          </tr>`).join('')}</tbody></table>
        </div>
        ${renderTotals(rows)}
      </section>`;
  }

  function renderTotals(rows) {
    const totalCost = rows.reduce((sum, row) => sum + parseNumber(row.cost) * parseNumber(row.quantity || 1), 0);
    const totalRevenue = rows.reduce((sum, row) => sum + parseNumber(row.revenue) * parseNumber(row.quantity || 1), 0);
    const margin = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;
    return `
      <div class="quotation-totals-grid">
        <article class="stack-item"><span>Totale costi</span><div class="summary-value">${U.escapeHtml(money(totalCost))}</div></article>
        <article class="stack-item"><span>Totale ricavi</span><div class="summary-value">${U.escapeHtml(money(totalRevenue))}</div></article>
        <article class="stack-item"><span>Margine</span><div class="summary-value">${U.escapeHtml(money(margin))}</div></article>
        <article class="stack-item"><span>Margine %</span><div class="summary-value">${U.escapeHtml(marginPct.toFixed(2))}%</div></article>
      </div>`;
  }

  function renderDocuments(draft, i18n) {
    const items = Array.isArray(draft.attachments) ? draft.attachments : [];
    return `
      <section class="panel quotation-editor-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.documents', 'Documenti'))}</h3><p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.quotationDocumentsHint', 'Registro documenti di supporto collegati alla quotazione.'))}</p></div><div class="action-row"><button class="btn secondary" type="button" data-quotation-add-document>${U.escapeHtml(i18n?.t('ui.addDocument', 'Aggiungi documento'))}</button></div></div>
        ${items.length ? `<div class="quotation-attachments-list">${items.map((item, index) => `<article class="quotation-attachment-card"><div class="quotation-attachment-grid">${renderField('Titolo', `attachment-title-${index}`, item.title, { size: 'lg', extraClass: ['quotation-attachment-field'] }).replace('data-quotation-field', 'data-quotation-attachment-field="title" data-quotation-attachment-index')}
        </div></article>`).join('')}</div>` : `<div class="empty-text">Nessun documento allegato.</div>`}
        <div class="quotation-attachments-list">${items.map((item, index) => `<article class="quotation-attachment-card"><div class="quotation-attachment-grid">
          <div class="quotation-field quotation-field-lg"><label>Titolo</label><input type="text" data-quotation-attachment-field="title" data-quotation-attachment-index="${index}" value="${U.escapeHtml(item.title || '')}"></div>
          <div class="quotation-field quotation-field-sm"><label>Categoria</label><input type="text" data-quotation-attachment-field="category" data-quotation-attachment-index="${index}" value="${U.escapeHtml(item.category || 'quotation')}"></div>
          <div class="quotation-field quotation-field-lg"><label>File</label><input type="text" data-quotation-attachment-field="fileName" data-quotation-attachment-index="${index}" value="${U.escapeHtml(item.fileName || '')}"></div>
          <div class="quotation-field quotation-field-full"><label>Nota</label><textarea rows="2" data-quotation-attachment-field="note" data-quotation-attachment-index="${index}">${U.escapeHtml(item.note || '')}</textarea></div>
          <div class="quotation-field quotation-field-sm"><label>&nbsp;</label><button class="btn secondary" type="button" data-quotation-remove-document="${index}">Rimuovi</button></div>
        </div></article>`).join('')}</div>
      </section>`;
  }

  function renderCrmFollowUpCard(draft, state) {
    const config = crmFeedbackConfig(state);
    const templateOptions = crmFeedbackTemplateOptions(state);
    return `
      <section class="quotation-service-card quotation-crm-card">
        <div class="quotation-service-card-head"><h4>CRM e follow-up feedback</h4><p>Preparazione del collegamento CRM: dopo l'invio, il sistema potrà schedulare la richiesta feedback con template preimpostato.</p></div>
        <div class="quotation-grid">
          ${renderField('Follow-up automatico', 'crmFollowUpEnabled', draft.crmFollowUpEnabled, { type: 'select', size: 'sm', items: [{ value: 'scheduled', label: 'Attivo' }, { value: 'disabled', label: 'Disattivato' }] })}
          ${renderField('Invia dopo (giorni)', 'crmFollowUpDelayDays', draft.crmFollowUpDelayDays || String(config.defaultDelayDays || 5), { type: 'number', size: 'sm' })}
          ${renderField('Template feedback', 'crmFollowUpTemplateKey', draft.crmFollowUpTemplateKey || String(config.defaultTemplateKey || ''), { type: 'select', size: 'lg', items: [{ value: '', label: 'Seleziona template' }, ...templateOptions] })}
          <div class="quotation-field quotation-field-full quotation-followup-hint"><label>Stato CRM</label><div class="quotation-static-note">${U.escapeHtml(followUpStatusLabel(draft.crmFollowUpEnabled))} · template ${U.escapeHtml(getFeedbackTemplate(state, draft.crmFollowUpTemplateKey)?.name || 'non definito')}</div></div>
        </div>
      </section>`;
  }

  function activeSession(state) {
    return Workspace?.getActiveSession?.(state) || null;
  }

  function activeSessionId(context) {
    return String(context?.state?.quotationsWorkspace?.activeSessionId || '').trim();
  }

  function renderEditor(state, i18n) {
    const session = activeSession(state);
    if (!session) return '';
    const draft = session.draft || {};
    const activeTab = String(session.tab || 'testata').trim() || 'testata';
    const tabs = [
      ['testata', 'Testata'],
      ['dettaglio', 'Dettaglio'],
      ['documenti', 'Documenti']
    ];
    const body = activeTab === 'dettaglio'
      ? renderDetail(state, draft, i18n)
      : activeTab === 'documenti'
        ? renderDocuments(draft, i18n)
        : renderTestata(draft, state, i18n);
    return `
      <section class="module-quotations-shell">
        <div class="quotation-tab-strip">${tabs.map(([key, label]) => `<button class="quotation-tab${activeTab === key ? ' active' : ''}" type="button" data-quotation-tab="${U.escapeHtml(key)}">${U.escapeHtml(label)}</button>`).join('')}</div>
        ${body}
      </section>`;
  }

  function render(state, options = {}) {
    const { i18n } = options;
    ensureQuotationUiStyle();
    ensureState(state);
    const selectedPractice = typeof options.getSelectedPractice === 'function' ? options.getSelectedPractice() : null;
    return `
      <div class="stack page-shell module-quotations-shell">
        <section class="hero">
          <div class="hero-meta">KEDRIX ONE · QUOTAZIONI</div>
          <h2>Quotazioni</h2>
          <p>Modulo commerciale-operativo con profili diversi per mare, aerea, terra, ferrovia, agenzia e magazzino.</p>
        </section>
        ${renderLauncher(state, i18n, selectedPractice)}
        ${renderSessionStrip(state, i18n)}
        ${renderEditor(state, i18n)}
        ${renderSavedRecords(state, i18n)}
      </div>`;
  }

  function openBlankQuotation(context, profile = 'generic') {
    const draft = createEmptyDraft(context.state, { serviceProfile: profile });
    Workspace?.openSession?.(context.state, draft, { isDirty: true, tab: 'testata' });
    context.save?.();
    context.render?.();
  }

  function openFromPractice(context, practice) {
    if (!practice) {
      context.toast?.('Seleziona una pratica valida prima di creare la quotazione.', 'warning');
      return;
    }
    const draft = normalizeQuotationDraft(context.state, buildDraftFromPractice(context.state, practice));
    Workspace?.openSession?.(context.state, draft, { isDirty: true, tab: 'testata' });
    context.save?.();
    context.render?.();
  }

  function openFromRecord(context, record, duplicate) {
    if (!record) return;
    const draft = normalizeQuotationDraft(context.state, safeClone(record.draft || {}));
    if (duplicate) {
      draft.editingRecordId = '';
      draft.quotationNumber = Workspace?.nextQuotationNumber?.(context.state) || draft.quotationNumber;
      draft.status = 'draft';
    }
    Workspace?.openSession?.(context.state, draft, { isDirty: Boolean(duplicate), tab: 'testata' });
    context.save?.();
    context.render?.();
  }

  function saveCurrent(context, closeAfterSave = false, queueSend = false) {
    const sessionId = activeSessionId(context);
    if (!sessionId) return null;
    const session = activeSession(context.state);
    if (!session) return null;
    const operator = currentOperatorName(context.state);
    normalizeQuotationDraft(context.state, session.draft);
    if (queueSend) {
      session.draft.status = 'sent';
      if (!session.draft.validFrom) session.draft.validFrom = today();
    }
    const record = Workspace?.saveRecord?.(context.state, sessionId, { updatedBy: operator }) || null;
    if (!record) return null;
    if (queueSend) {
      const dispatch = Workspace?.queueDispatch?.(context.state, record, { recipient: record.client || '' });
      let followUp = null;
      const followUpEnabled = String(record?.draft?.crmFollowUpEnabled || '').trim() !== 'disabled';
      const delayDays = Math.max(0, Number(record?.draft?.crmFollowUpDelayDays || crmFeedbackConfig(context.state).defaultDelayDays || 5));
      const template = getFeedbackTemplate(context.state, record?.draft?.crmFollowUpTemplateKey || crmFeedbackConfig(context.state).defaultTemplateKey || '');
      if (followUpEnabled && template) {
        followUp = Workspace?.scheduleFeedbackFollowUp?.(context.state, record, {
          delayDays,
          templateKey: template.key,
          templateName: template.name,
          templateSubject: template.subject,
          templateBody: template.body,
          recipient: record.client || dispatch?.recipient || ''
        });
      }
      const feedbackMessage = followUp
        ? `Quotazione inviata in staging e follow-up CRM schedulato tra ${delayDays} giorni.`
        : 'Quotazione inviata in staging e accodata al Centro invii automatici.';
      Feedback?.success?.(feedbackMessage);
    } else {
      Feedback?.success?.('Quotazione salvata correttamente.');
    }
    if (closeAfterSave) Workspace?.closeSession?.(context.state, sessionId);
    context.save?.();
    context.render?.();
    return record;
  }

  function buildPrintableHtml(context) {
    const session = activeSession(context.state);
    if (!session) return '';
    const draft = safeClone(session.draft || {});
    const logo = Branding?.logoUrl?.(context.state) || './brand/kedrix-one-mark.svg';
    const companyName = Branding?.companyName?.(context.state) || String(context.state?.companyConfig?.name || 'Kedrix One').trim();
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    const publicRows = rows.filter((row) => String(row.description || row.code || '').trim() || parseNumber(row.revenue)).map((row) => ({
      code: row.code || '',
      description: lineDescriptionFallback(row),
      quantity: row.quantity || '',
      price: money(parseNumber(row.revenue) * parseNumber(row.quantity || 1) / Math.max(parseNumber(row.quantity || 1), 1)),
      currency: row.currency || draft.currency || 'EUR'
    }));
    const totalOffered = rows.reduce((sum, row) => sum + parseNumber(row.revenue) * parseNumber(row.quantity || 1), 0);
    const modeDetails = [];
    if (draft.serviceProfile === 'sea') {
      modeDetails.push(['Tipo imballo', draft.packagingType || '—']);
      modeDetails.push(['Tipo container', draft.containerType || '—']);
      modeDetails.push(['Dimensione', draft.containerSize || '—']);
      modeDetails.push(['Nave / Viaggio', [draft.vesselName, draft.voyageNumber].filter(Boolean).join(' / ') || '—']);
    }
    if (draft.serviceProfile === 'air') {
      modeDetails.push(['Aeroporti', [draft.airportOrigin, draft.airportDestination].filter(Boolean).join(' → ') || '—']);
      modeDetails.push(['MAWB / HAWB', [draft.mawb, draft.hawb].filter(Boolean).join(' / ') || '—']);
    }
    if (draft.serviceProfile === 'road') {
      modeDetails.push(['Servizio', draft.truckMode || '—']);
      modeDetails.push(['Mezzo', draft.vehicleType || '—']);
    }
    if (draft.serviceProfile === 'warehouse') {
      modeDetails.push(['Deposito', draft.warehouseSite || '—']);
      modeDetails.push(['Giacenza', draft.storageDays || '—']);
    }
    return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>${U.escapeHtml(draft.quotationNumber || 'Quotazione')}</title>
<style>
body{font-family:Arial,sans-serif;padding:28px;color:#0f1720} 
.header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #d7e2ec;padding-bottom:16px;margin-bottom:22px;min-height:92px}
.logo{width:64px;height:64px;object-fit:contain}
.company{font-size:24px;font-weight:700}
.sub{font-size:12px;color:#4a5b6b;text-transform:uppercase;letter-spacing:.12em}
.doc-title{margin:0;font-size:26px}
.doc-meta{margin:4px 0 0;color:#516171}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:18px}
.card{border:1px solid #d7e2ec;border-radius:12px;padding:12px}
.card strong{display:block;margin-bottom:4px;color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.section{margin-top:18px}
.section h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#334155;margin:0 0 8px}
table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #d7e2ec;padding:8px;font-size:12px;text-align:left}th{background:#f2f6fa}
.total{margin-top:12px;text-align:right;font-size:15px;font-weight:700}
.note{border:1px solid #d7e2ec;border-radius:12px;padding:12px;white-space:pre-wrap}
</style></head><body>
<div class="header"><img class="logo" src="${U.escapeHtml(logo)}" alt="${U.escapeHtml(companyName)}"><div><div class="sub">Kedrix One · Quotazioni</div><div class="company">${U.escapeHtml(companyName)}</div><h1 class="doc-title">${U.escapeHtml(draft.quotationNumber || 'Quotazione')}</h1><div class="doc-meta">${U.escapeHtml(draft.title || '')}</div></div></div>
<div class="grid">
  <div class="card"><strong>Cliente</strong><div>${U.escapeHtml(draft.client || '—')}</div></div>
  <div class="card"><strong>Profilo</strong><div>${U.escapeHtml(serviceProfileLabel(draft.serviceProfile))}</div></div>
  <div class="card"><strong>Valida dal</strong><div>${U.escapeHtml(draft.validFrom || '—')}</div></div>
  <div class="card"><strong>Valida a</strong><div>${U.escapeHtml(draft.validTo || '—')}</div></div>
  <div class="card"><strong>Origine / Destinazione</strong><div>${U.escapeHtml([draft.origin, draft.destination].filter(Boolean).join(' → ') || '—')}</div></div>
  <div class="card"><strong>Resa / Pagamento</strong><div>${U.escapeHtml([draft.incoterm, draft.paymentTerms].filter(Boolean).join(' · ') || '—')}</div></div>
  ${modeDetails.map(([label, value]) => `<div class="card"><strong>${U.escapeHtml(label)}</strong><div>${U.escapeHtml(value)}</div></div>`).join('')}
</div>
<div class="section"><h2>Dettaglio offerta</h2><table><thead><tr><th>Codice</th><th>Descrizione</th><th>Q.tà</th><th>Prezzo offerto</th><th>Valuta</th></tr></thead><tbody>${publicRows.map((row) => `<tr><td>${U.escapeHtml(row.code)}</td><td>${U.escapeHtml(row.description)}</td><td>${U.escapeHtml(row.quantity)}</td><td>${U.escapeHtml(row.price)}</td><td>${U.escapeHtml(row.currency)}</td></tr>`).join('')}</tbody></table><div class="total">Totale offerta: ${U.escapeHtml(money(totalOffered))} ${U.escapeHtml(draft.currency || 'EUR')}</div></div>
${draft.note ? `<div class="section"><h2>Note</h2><div class="note">${U.escapeHtml(draft.note)}</div></div>` : ''}
</body></html>`;
  }

  function printCurrent(context) {
    const html = buildPrintableHtml(context);
    if (!html) return;
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.position = 'fixed';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    document.body.appendChild(frame);
    const doc = frame.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 800);
    };
  }

  async function maybeCloseDirtySession(context, sessionId) {
    const session = Workspace?.getSession?.(context.state, sessionId) || null;
    if (!session || !session.isDirty) return true;
    const confirmed = Feedback && typeof Feedback.confirm === 'function'
      ? await Feedback.confirm({ title: 'Chiudere la maschera?', message: 'Questa quotazione contiene modifiche non salvate.', confirmLabel: 'Chiudi', cancelLabel: 'Annulla', tone: 'warning' })
      : window.confirm('Questa quotazione contiene modifiche non salvate. Chiudere la maschera?');
    return Boolean(confirmed);
  }

  function bind(context) {
    const root = context.root;
    if (!root || root.dataset.quotationBound === '1') return;
    root.dataset.quotationBound = '1';

    root.addEventListener('click', async (event) => {
      const newButton = event.target.closest('[data-quotation-new]');
      if (newButton) return openBlankQuotation(context);

      const activeButton = event.target.closest('[data-quotation-open-active]');
      if (activeButton) {
        const practice = typeof context.getSelectedPractice === 'function' ? context.getSelectedPractice() : null;
        return openFromPractice(context, practice);
      }

      const practiceButton = event.target.closest('[data-quotation-open-practice]');
      if (practiceButton) {
        const practiceId = String(practiceButton.dataset.quotationOpenPractice || '').trim();
        const practice = (context.state?.practices || []).find((entry) => String(entry?.id || '').trim() === practiceId) || null;
        return openFromPractice(context, practice);
      }

      const openRecordButton = event.target.closest('[data-quotation-open-record]');
      if (openRecordButton) {
        const recordId = String(openRecordButton.dataset.quotationOpenRecord || '').trim();
        const record = (context.state?.quotationRecords || []).find((entry) => String(entry?.id || '').trim() === recordId) || null;
        return openFromRecord(context, record, false);
      }

      const duplicateRecordButton = event.target.closest('[data-quotation-duplicate-record]');
      if (duplicateRecordButton) {
        const recordId = String(duplicateRecordButton.dataset.quotationDuplicateRecord || '').trim();
        const record = (context.state?.quotationRecords || []).find((entry) => String(entry?.id || '').trim() === recordId) || null;
        return openFromRecord(context, record, true);
      }

      const switchButton = event.target.closest('[data-quotation-session-switch]');
      if (switchButton) {
        Workspace?.switchSession?.(context.state, switchButton.dataset.quotationSessionSwitch || '');
        context.save?.();
        context.render?.();
        return;
      }

      const closeButton = event.target.closest('[data-quotation-session-close]');
      if (closeButton) {
        const sessionId = String(closeButton.dataset.quotationSessionClose || '').trim();
        if (await maybeCloseDirtySession(context, sessionId)) {
          Workspace?.closeSession?.(context.state, sessionId);
          context.save?.();
          context.render?.();
        }
        return;
      }

      const tabButton = event.target.closest('[data-quotation-tab]');
      if (tabButton) {
        Workspace?.setTab?.(context.state, activeSessionId(context), tabButton.dataset.quotationTab || 'testata');
        context.save?.();
        context.render?.();
        return;
      }

      const profileButton = event.target.closest('[data-quotation-profile]');
      if (profileButton) {
        const nextProfile = String(profileButton.dataset.quotationProfile || 'generic').trim() || 'generic';
        const session = activeSession(context.state);
        if (session) {
          const preserved = safeClone(session.draft || {});
          session.draft = safeClone({ ...emptySpecificProfile(nextProfile), ...preserved, serviceProfile: nextProfile });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const roadRateLookupButton = event.target.closest('[data-quotation-road-rate-lookup]');
      if (roadRateLookupButton) {
        const session = activeSession(context.state);
        if (session) {
          const query = buildRoadRateQuery(session.draft || {});
          if (!query.supplierName || !query.origin || !query.destination) {
            session.draft.roadRateBridge = buildRoadRateBridgeError(query, 'Compila fornitore, origine e destinazione della quotazione per leggere le tratte commerciali compatibili.', 'missing-route');
            session.isDirty = true;
            context.save?.();
            context.render?.();
            return;
          }
          const canListMatches = SupplierRoadRates && typeof SupplierRoadRates.listRouteMatches === 'function';
          const canMatchSingle = SupplierRoadRates && typeof SupplierRoadRates.matchRoute === 'function';
          if (!canListMatches && !canMatchSingle) {
            session.draft.roadRateBridge = buildRoadRateBridgeError(query, 'Motore listino vettore non disponibile in questa build.', 'engine-missing');
            session.isDirty = true;
            context.save?.();
            context.render?.();
            return;
          }
          const result = canListMatches
            ? SupplierRoadRates.listRouteMatches(context.state, { name: query.supplierName, value: query.supplierName }, query, { limit: 25 })
            : SupplierRoadRates.matchRoute(context.state, { name: query.supplierName, value: query.supplierName }, query);
          if (result && result.ok) {
            session.draft.roadRateBridge = buildRoadRateBridgeSuccess(result, query, session.draft || {});
            selectRoadRateCandidate(session.draft || {}, cleanText(session.draft?.roadRateBridge?.selectedRoadRateId || ''));
            session.isDirty = true;
            context.save?.();
            context.render?.();
            const candidateCount = Number(session.draft?.roadRateBridge?.totalMatches || (session.draft?.roadRateBridge?.candidates || []).length || 0);
            Feedback?.success?.(candidateCount > 1 ? `Trovate ${candidateCount} tratte compatibili dal listino vettore.` : 'Tratta commerciale letta dal listino vettore.');
          } else {
            const reason = String(result?.reason || '').trim();
            const reasonMap = {
              'no-rates': 'Il fornitore selezionato non ha tratte chilometriche disponibili.',
              'missing-route': 'Compila origine e destinazione prima di cercare le tratte commerciali.',
              'no-match': 'Nessuna tratta commerciale trovata con i criteri correnti.'
            };
            session.draft.roadRateBridge = buildRoadRateBridgeError(query, reasonMap[reason] || 'Nessuna tratta commerciale disponibile con i criteri correnti.', reason);
            session.isDirty = true;
            context.save?.();
            context.render?.();
            Feedback?.warning?.(reason === 'no-rates' ? 'Nessuna tratta caricata per il fornitore selezionato.' : 'Nessuna tratta commerciale trovata.');
          }
        }
        return;
      }

      const roadRateSelectButton = event.target.closest('[data-quotation-road-rate-select]');
      if (roadRateSelectButton) {
        const session = activeSession(context.state);
        if (session && selectRoadRateCandidate(session.draft || {}, roadRateSelectButton.dataset.quotationRoadRateSelect || '')) {
          session.isDirty = true;
          context.save?.();
          context.render?.();
          Feedback?.success?.('Tratta commerciale selezionata.');
        }
        return;
      }

      const roadRateSavePreferenceButton = event.target.closest('[data-quotation-road-rate-save-preference]');
      if (roadRateSavePreferenceButton) {
        const session = activeSession(context.state);
        if (session?.draft?.roadRateBridge) {
          const query = buildRoadRateQuery(session.draft || {});
          const result = saveRoadRatePreference(session.draft || {}, session.draft.roadRateBridge, query);
          if (result.ok) {
            session.draft.roadRateBridge.savedPreferenceScopeKey = cleanText(result.preference?.scopeKey || '');
            session.draft.roadRateBridge.savedPreferenceSelectedId = cleanText(result.preference?.selectedRoadRateId || '');
            session.draft.roadRateBridge.savedPreferenceLabel = cleanText(result.preference?.selectedRouteLabel || '');
            session.draft.roadRateBridge.savedPreferenceScopeLevel = cleanText(result.preference?.scopeLevel || 'exact');
            session.draft.roadRateBridge.savedPreferenceScopeLabel = cleanText(result.preference?.scopeLabel || 'fornitore/percorso/mezzo/servizio');
            session.draft.roadRateBridge.savedPreferenceManualPriority = cleanText(result.preference?.manualPriority || '');
            session.draft.roadRateBridge.savedPreferenceInternalNote = cleanText(result.preference?.internalNote || '');
            session.draft.roadRateBridge.savedPreferenceOperator = cleanText(result.preference?.modifiedBy || '');
            session.draft.roadRateBridge.savedPreferenceModifiedAt = cleanText(result.preference?.modifiedAt || result.preference?.savedAt || '');
            session.draft.roadRateBridge.preferenceFallbackUsed = false;
            session.draft.roadRateBridge.preferenceSelectionAvailable = true;
            session.draft.roadRateBridge.preferenceMatched = session.draft.roadRateBridge.savedPreferenceSelectedId === session.draft.roadRateBridge.selectedRoadRateId;
            syncRoadRatePreferenceEditor(session.draft.roadRateBridge);
            session.isDirty = true;
            context.save?.();
            context.render?.();
            Feedback?.success?.('Preferenza commerciale salvata con priorità manuale, nota interna e tracciamento operatore.');
          } else {
            Feedback?.warning?.('Seleziona prima una tratta commerciale da memorizzare come preferenza.');
          }
        }
        return;
      }

      const roadRateClearPreferenceButton = event.target.closest('[data-quotation-road-rate-clear-preference]');
      if (roadRateClearPreferenceButton) {
        const session = activeSession(context.state);
        if (session?.draft?.roadRateBridge) {
          const query = buildRoadRateQuery(session.draft || {});
          const result = clearRoadRatePreference(session.draft || {}, query, cleanText(session.draft.roadRateBridge?.savedPreferenceScopeKey || ''), cleanText(session.draft.roadRateBridge?.preferenceEditorOperator || session.draft.roadRateBridge?.savedPreferenceOperator || ''));
          if (result.ok) {
            session.draft.roadRateBridge.savedPreferenceScopeKey = '';
            session.draft.roadRateBridge.savedPreferenceSelectedId = '';
            session.draft.roadRateBridge.savedPreferenceLabel = '';
            session.draft.roadRateBridge.savedPreferenceScopeLevel = '';
            session.draft.roadRateBridge.savedPreferenceScopeLabel = '';
            session.draft.roadRateBridge.savedPreferenceManualPriority = '';
            session.draft.roadRateBridge.savedPreferenceInternalNote = '';
            session.draft.roadRateBridge.savedPreferenceOperator = '';
            session.draft.roadRateBridge.savedPreferenceModifiedAt = '';
            session.draft.roadRateBridge.preferenceFallbackUsed = false;
            session.draft.roadRateBridge.preferenceSelectionAvailable = null;
            session.draft.roadRateBridge.preferenceMatched = false;
            syncRoadRatePreferenceEditor(session.draft.roadRateBridge);
            session.isDirty = true;
            context.save?.();
            context.render?.();
            Feedback?.success?.('Preferenza commerciale rimossa.');
          } else {
            Feedback?.warning?.('Per questo fornitore/percorso non esiste una preferenza salvata.');
          }
        }
        return;
      }

      const roadRateResetFiltersButton = event.target.closest('[data-quotation-road-rate-filters-reset]');
      if (roadRateResetFiltersButton) {
        const session = activeSession(context.state);
        if (session?.draft?.roadRateBridge && typeof session.draft.roadRateBridge === 'object') {
          session.draft.roadRateBridge.filters = defaultRoadRateBridgeFilters();
          selectRoadRateCandidate(session.draft || {}, cleanText(session.draft?.roadRateBridge?.selectedRoadRateId || ''));
          session.isDirty = true;
          context.save?.();
          context.render?.();
          Feedback?.success?.('Filtri tratte commerciali azzerati.');
        }
        return;
      }

      const roadRateApplyButton = event.target.closest('[data-quotation-road-rate-apply]');
      if (roadRateApplyButton) {
        const session = activeSession(context.state);
        if (session) {
          const bridge = session.draft?.roadRateBridge;
          const warnings = buildRoadRateApplyWarnings(bridge);
          if (roadRateApplyWarningsRequireConfirmation(warnings) && !roadRateApplyAcknowledgedForSelection(bridge)) {
            if (bridge && typeof bridge === 'object') {
              bridge.applyAcknowledgedForKey = roadRateApplyAcknowledgementKey(bridge);
            }
            session.isDirty = true;
            context.save?.();
            context.render?.();
            Feedback?.warning?.(roadRateApplyWarningFeedbackMessage(warnings));
            return;
          }
          const result = applyRoadRateMatchToDraft(session.draft || {});
          if (result.ok) {
            session.isDirty = true;
            Workspace?.setTab?.(context.state, activeSessionId(context), 'dettaglio');
            context.save?.();
            context.render?.();
            Feedback?.success?.('Costo fornitore applicato alla riga trasporto della quotazione.');
          } else {
            Feedback?.warning?.(result.reason === 'missing-tariff' ? 'La tratta selezionata non ha una tariffa commerciale valorizzata.' : 'Leggi prima una tratta commerciale valida dal listino vettore.');
          }
        }
        return;
      }

      const addLineButton = event.target.closest('[data-quotation-add-line]');
      if (addLineButton) {
        const session = activeSession(context.state);
        if (session) {
          session.draft.lineItems.push(Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const addPresetButton = event.target.closest('[data-quotation-add-preset]');
      if (addPresetButton) {
        const session = activeSession(context.state);
        if (session) {
          const presetKey = String(addPresetButton.dataset.quotationAddPreset || '').trim();
          session.draft.lineItems.push(buildLineFromPreset(session.draft.serviceProfile, presetKey, session.draft));
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const applyBundleButton = event.target.closest('[data-quotation-apply-bundle]');
      if (applyBundleButton) {
        const session = activeSession(context.state);
        if (session) {
          const keys = presetBundleByProfile(session.draft.serviceProfile);
          const existingSingleBlank = session.draft.lineItems.length === 1 && !String(session.draft.lineItems[0]?.description || session.draft.lineItems[0]?.code || session.draft.lineItems[0]?.cost || session.draft.lineItems[0]?.revenue || '').trim();
          if (existingSingleBlank) session.draft.lineItems = [];
          keys.forEach((key) => session.draft.lineItems.push(buildLineFromPreset(session.draft.serviceProfile, key, session.draft)));
          if (!session.draft.lineItems.length) session.draft.lineItems.push(Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const removeLineButton = event.target.closest('[data-quotation-remove-line]');
      if (removeLineButton) {
        const index = Number(removeLineButton.dataset.quotationRemoveLine);
        const session = activeSession(context.state);
        if (session && Number.isInteger(index)) {
          session.draft.lineItems.splice(index, 1);
          if (!session.draft.lineItems.length) session.draft.lineItems.push(Workspace?.defaultLineItem?.() || { id: `qli-${Date.now()}` });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const addDocumentButton = event.target.closest('[data-quotation-add-document]');
      if (addDocumentButton) {
        const session = activeSession(context.state);
        if (session) {
          session.draft.attachments.push(Workspace?.defaultAttachment?.() || { id: `qad-${Date.now()}` });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const removeDocumentButton = event.target.closest('[data-quotation-remove-document]');
      if (removeDocumentButton) {
        const index = Number(removeDocumentButton.dataset.quotationRemoveDocument);
        const session = activeSession(context.state);
        if (session && Number.isInteger(index)) {
          session.draft.attachments.splice(index, 1);
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      if (event.target.closest('[data-quotation-save]')) return void saveCurrent(context, false, false);
      if (event.target.closest('[data-quotation-save-close]')) return void saveCurrent(context, true, false);
      if (event.target.closest('[data-quotation-save-send]')) return void saveCurrent(context, false, true);
      if (event.target.closest('[data-quotation-print]')) return void printCurrent(context);
    });

    root.addEventListener('input', (event) => {
      const field = event.target.closest('[data-quotation-field]');
      if (field) {
        const fieldName = String(field.dataset.quotationField || '').trim();
        if (fieldName === 'filterQuick') {
          context.state.quotationFilters.quick = field.value;
          context.save?.();
          context.render?.();
          return;
        }
        const session = activeSession(context.state);
        if (session) {
          session.draft[fieldName] = field.value;
          if (['supplier', 'origin', 'destination', 'vehicleType', 'truckMode', 'pickupPlace', 'deliveryPlace'].includes(fieldName)) {
            clearRoadRateBridge(session.draft);
          }
          session.isDirty = true;
          context.save?.();
        }
        return;
      }

      const lineField = event.target.closest('[data-quotation-line-field]');
      if (lineField) {
        const index = Number(lineField.dataset.quotationLineIndex);
        const fieldName = String(lineField.dataset.quotationLineField || '').trim();
        const session = activeSession(context.state);
        if (session && Number.isInteger(index) && session.draft.lineItems[index]) {
          session.draft.lineItems[index][fieldName] = lineField.value;
          if (fieldName === 'lineType') {
            maybeHydrateLineFromPreset(session.draft.lineItems[index], session.draft);
          }
          if (fieldName === 'supplier') {
            clearRoadRateBridge(session.draft);
          }
          session.isDirty = true;
          context.save?.();
          if (fieldName === 'lineType') context.render?.();
        }
        return;
      }

      const roadRatePreferenceField = event.target.closest('[data-quotation-road-rate-preference-field]');
      if (roadRatePreferenceField) {
        const session = activeSession(context.state);
        const fieldName = String(roadRatePreferenceField.dataset.quotationRoadRatePreferenceField || '').trim();
        if (session?.draft?.roadRateBridge && fieldName) {
          session.draft.roadRateBridge.preferenceEditorRoadRateId = cleanText(session.draft.roadRateBridge.selectedRoadRateId || session.draft.roadRateBridge.roadRateId || '');
          if (fieldName === 'priority') session.draft.roadRateBridge.preferenceEditorPriority = cleanText(roadRatePreferenceField.value || '');
          if (fieldName === 'note') session.draft.roadRateBridge.preferenceEditorNote = cleanText(roadRatePreferenceField.value || '');
          if (fieldName === 'operator') session.draft.roadRateBridge.preferenceEditorOperator = cleanText(roadRatePreferenceField.value || '');
          session.isDirty = true;
          context.save?.();
          if (fieldName === 'priority') context.render?.();
        }
        return;
      }

      const attachmentField = event.target.closest('[data-quotation-attachment-field]');
      if (attachmentField) {
        const index = Number(attachmentField.dataset.quotationAttachmentIndex);
        const fieldName = String(attachmentField.dataset.quotationAttachmentField || '').trim();
        const session = activeSession(context.state);
        if (session && Number.isInteger(index) && session.draft.attachments[index]) {
          session.draft.attachments[index][fieldName] = attachmentField.value;
          session.isDirty = true;
          context.save?.();
        }
      }
    });

    root.addEventListener('change', (event) => {
      const clientSelector = event.target.closest('[data-quotation-client-id]');
      if (clientSelector) {
        const session = activeSession(context.state);
        if (session) {
          syncQuotationClientDraft(context.state, session.draft, { clientId: clientSelector.value, client: '' });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const incotermSelector = event.target.closest('[data-quotation-incoterm]');
      if (incotermSelector) {
        const session = activeSession(context.state);
        if (session) {
          syncQuotationIncotermDraft(context.state, session.draft, { incoterm: incotermSelector.value });
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const lineSupplierSelector = event.target.closest('[data-quotation-line-supplier-id]');
      if (lineSupplierSelector) {
        const session = activeSession(context.state);
        const index = Number(lineSupplierSelector.dataset.quotationLineIndex);
        if (session && Number.isInteger(index) && session.draft.lineItems[index]) {
          syncQuotationLineSupplier(context.state, session.draft.lineItems[index], { supplierId: lineSupplierSelector.value, supplier: '' });
          clearRoadRateBridge(session.draft);
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const roadRatePreferenceField = event.target.closest('[data-quotation-road-rate-preference-field]');
      if (roadRatePreferenceField) {
        const session = activeSession(context.state);
        const fieldName = String(roadRatePreferenceField.dataset.quotationRoadRatePreferenceField || '').trim();
        if (session?.draft?.roadRateBridge && fieldName) {
          session.draft.roadRateBridge.preferenceEditorRoadRateId = cleanText(session.draft.roadRateBridge.selectedRoadRateId || session.draft.roadRateBridge.roadRateId || '');
          if (fieldName === 'priority') session.draft.roadRateBridge.preferenceEditorPriority = cleanText(roadRatePreferenceField.value || '');
          if (fieldName === 'note') session.draft.roadRateBridge.preferenceEditorNote = cleanText(roadRatePreferenceField.value || '');
          if (fieldName === 'operator') session.draft.roadRateBridge.preferenceEditorOperator = cleanText(roadRatePreferenceField.value || '');
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const roadRateFilter = event.target.closest('[data-quotation-road-rate-filter]');
      if (roadRateFilter) {
        const session = activeSession(context.state);
        const filterName = String(roadRateFilter.dataset.quotationRoadRateFilter || '').trim();
        if (session?.draft?.roadRateBridge && filterName) {
          setRoadRateBridgeFilter(session.draft.roadRateBridge, filterName, roadRateFilter.value);
          selectRoadRateCandidate(session.draft || {}, cleanText(session.draft?.roadRateBridge?.selectedRoadRateId || ''));
          session.isDirty = true;
          context.save?.();
          context.render?.();
        }
        return;
      }

      const field = event.target.closest('[data-quotation-field]');
      if (field) {
        const name = String(field.dataset.quotationField || '').trim();
        if (name === 'filterStatus') {
          context.state.quotationFilters.status = field.value;
          context.save?.();
          context.render?.();
          return;
        }
        if (name === 'filterProfile') {
          context.state.quotationFilters.serviceProfile = field.value;
          context.save?.();
          context.render?.();
        }
      }
    });
  }

  return {
    ensureState,
    render,
    bind
  };
})();
