window.KedrixOneMasterDataQuickAdd = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const VatAutofill = window.KedrixOneVatAutofill || null;
  const SupplierPriceLists = window.KedrixOneSupplierPriceLists || null;
  const SupplierRoadRates = window.KedrixOneSupplierRoadRates || null;
  const CsvReader = window.KedrixOneImportCsvReader || null;
  const ExcelReader = window.KedrixOneImportExcelReader || null;

  function getImportFoundation() {
    return window.KedrixOneImportFoundation || null;
  }

  function getMasterDataOverview() {
    return window.KedrixOneMasterDataOverview || null;
  }

  function buildDefaultSupplierFilters() {
    return {
      withModes: false,
      withAreas: false,
      withPaymentTerms: false,
      classifiedOnly: false,
      preferredOnly: false,
      reliableOnly: false,
      activeOnly: false
    };
  }

  function ensureSupplierFilters(moduleState) {
    if (!moduleState.supplierFilters || typeof moduleState.supplierFilters !== 'object') {
      moduleState.supplierFilters = buildDefaultSupplierFilters();
    }
    const defaults = buildDefaultSupplierFilters();
    Object.keys(defaults).forEach((key) => {
      if (typeof moduleState.supplierFilters[key] !== 'boolean') {
        moduleState.supplierFilters[key] = defaults[key];
      }
    });
    return moduleState.supplierFilters;
  }


  function ensureSupplierPriceListDraft(moduleState, supplierRecord = null) {
    const supplierId = String(supplierRecord && supplierRecord.id || '').trim();
    const supplierName = String(supplierRecord && (supplierRecord.name || supplierRecord.value) || '').trim();
    if (!supplierId || !supplierName || !SupplierPriceLists || typeof SupplierPriceLists.createDraft !== 'function') {
      moduleState.supplierPriceListOwnerId = '';
      moduleState.supplierPriceListDraft = SupplierPriceLists && typeof SupplierPriceLists.createDraft === 'function'
        ? SupplierPriceLists.createDraft()
        : { id: '', supplierId: '', supplierName: '', serviceLabel: '', routeScope: '', validityFrom: '', validityTo: '', currency: 'EUR', unitPrice: '', unitType: '', leadTime: '', paymentTerms: '', notes: '', active: true };
      return moduleState.supplierPriceListDraft;
    }
    if (moduleState.supplierPriceListOwnerId !== supplierId || !moduleState.supplierPriceListDraft || typeof moduleState.supplierPriceListDraft !== 'object') {
      moduleState.supplierPriceListOwnerId = supplierId;
      moduleState.supplierPriceListDraft = SupplierPriceLists.createDraft(null, supplierRecord);
      return moduleState.supplierPriceListDraft;
    }
    moduleState.supplierPriceListDraft.supplierId = supplierId;
    moduleState.supplierPriceListDraft.supplierName = supplierName;
    return moduleState.supplierPriceListDraft;
  }

  function resetSupplierPriceListDraft(state, supplierRecord = null) {
    const moduleState = ensureModuleState(state);
    moduleState.supplierPriceListDraft = SupplierPriceLists && typeof SupplierPriceLists.createDraft === 'function'
      ? SupplierPriceLists.createDraft(null, supplierRecord)
      : { id: '', supplierId: '', supplierName: '', serviceLabel: '', routeScope: '', validityFrom: '', validityTo: '', currency: 'EUR', unitPrice: '', unitType: '', leadTime: '', paymentTerms: '', notes: '', active: true };
    moduleState.supplierPriceListOwnerId = String(supplierRecord && supplierRecord.id || '').trim();
    return moduleState.supplierPriceListDraft;
  }

  function syncSupplierPriceListDraftFromForm(form, draft) {
    if (!form || !draft) return draft;
    const formData = new FormData(form);
    Array.from(form.querySelectorAll('[name]')).forEach((node) => {
      if (!node.name) return;
      if (node.type === 'checkbox') draft[node.name] = Boolean(node.checked);
      else draft[node.name] = String(formData.get(node.name) || '').trim();
    });
    return draft;
  }

  function buildDefaultRoadLookupDraft() {
    return { origin: '', destination: '', vehicleType: '', serviceType: '' };
  }

  function buildDefaultRoadImportStatus() {
    return { status: 'idle', imported: 0, updated: 0, skipped: 0, fileName: '', batchId: '', message: '' };
  }

  function ensureSupplierRoadRateDraft(moduleState, supplierRecord = null) {
    const supplierId = String(supplierRecord && supplierRecord.id || '').trim();
    const supplierName = String(supplierRecord && (supplierRecord.name || supplierRecord.value) || '').trim();
    if (!supplierId || !supplierName || !SupplierRoadRates || typeof SupplierRoadRates.createDraft !== 'function') {
      moduleState.supplierRoadRateOwnerId = '';
      moduleState.supplierRoadRateDraft = SupplierRoadRates && typeof SupplierRoadRates.createDraft === 'function'
        ? SupplierRoadRates.createDraft()
        : { id: '', supplierId: '', supplierName: '', origin: '', destination: '', viaPoint: '', distanceKm: '', tariffAmount: '', currency: 'EUR', vehicleType: '', serviceType: '', validityFrom: '', validityTo: '', paymentTerms: '', tollIncluded: false, fuelIncluded: false, notes: '', active: true, sourceType: 'manual', importBatchId: '', importSourceName: '' };
      return moduleState.supplierRoadRateDraft;
    }
    if (moduleState.supplierRoadRateOwnerId !== supplierId || !moduleState.supplierRoadRateDraft || typeof moduleState.supplierRoadRateDraft !== 'object') {
      moduleState.supplierRoadRateOwnerId = supplierId;
      moduleState.supplierRoadRateDraft = SupplierRoadRates.createDraft(null, supplierRecord);
      return moduleState.supplierRoadRateDraft;
    }
    moduleState.supplierRoadRateDraft.supplierId = supplierId;
    moduleState.supplierRoadRateDraft.supplierName = supplierName;
    return moduleState.supplierRoadRateDraft;
  }

  function resetSupplierRoadRateDraft(state, supplierRecord = null) {
    const moduleState = ensureModuleState(state);
    moduleState.supplierRoadRateDraft = SupplierRoadRates && typeof SupplierRoadRates.createDraft === 'function'
      ? SupplierRoadRates.createDraft(null, supplierRecord)
      : { id: '', supplierId: '', supplierName: '', origin: '', destination: '', viaPoint: '', distanceKm: '', tariffAmount: '', currency: 'EUR', vehicleType: '', serviceType: '', validityFrom: '', validityTo: '', paymentTerms: '', tollIncluded: false, fuelIncluded: false, notes: '', active: true, sourceType: 'manual', importBatchId: '', importSourceName: '' };
    moduleState.supplierRoadRateOwnerId = String(supplierRecord && supplierRecord.id || '').trim();
    return moduleState.supplierRoadRateDraft;
  }

  function syncSupplierRoadRateDraftFromForm(form, draft) {
    if (!form || !draft) return draft;
    const formData = new FormData(form);
    Array.from(form.querySelectorAll('[name]')).forEach((node) => {
      if (!node.name) return;
      if (node.type === 'checkbox') draft[node.name] = Boolean(node.checked);
      else draft[node.name] = String(formData.get(node.name) || '').trim();
    });
    return draft;
  }

  function ensureModuleState(state) {
    if (!state || typeof state !== 'object') {
      const fallback = { activeEntity: 'client', quickAddContext: null, formDrafts: {}, selectedRecordId: '', searchQuery: '', supplierFilters: buildDefaultSupplierFilters(), supplierPriceListDraft: null, supplierPriceListOwnerId: '', supplierRoadRateDraft: null, supplierRoadRateOwnerId: '', supplierRoadLookupDraft: buildDefaultRoadLookupDraft(), supplierRoadLookupResult: null, supplierRoadImportStatus: buildDefaultRoadImportStatus() };
      return fallback;
    }
    if (!state.masterDataModule || typeof state.masterDataModule !== 'object') {
      state.masterDataModule = { activeEntity: 'client', quickAddContext: null, formDrafts: {}, selectedRecordId: '', searchQuery: '', supplierFilters: buildDefaultSupplierFilters(), supplierPriceListDraft: null, supplierPriceListOwnerId: '', supplierRoadRateDraft: null, supplierRoadRateOwnerId: '', supplierRoadLookupDraft: buildDefaultRoadLookupDraft(), supplierRoadLookupResult: null, supplierRoadImportStatus: buildDefaultRoadImportStatus() };
    }
    if (!state.masterDataModule.formDrafts || typeof state.masterDataModule.formDrafts !== 'object') {
      state.masterDataModule.formDrafts = {};
    }
    if (!state.masterDataModule.activeEntity) state.masterDataModule.activeEntity = 'client';
    if (typeof state.masterDataModule.selectedRecordId !== 'string') state.masterDataModule.selectedRecordId = '';
    if (typeof state.masterDataModule.searchQuery !== 'string') state.masterDataModule.searchQuery = '';
    ensureSupplierFilters(state.masterDataModule);
    if (!state.masterDataModule.supplierRoadLookupDraft || typeof state.masterDataModule.supplierRoadLookupDraft !== 'object') state.masterDataModule.supplierRoadLookupDraft = buildDefaultRoadLookupDraft();
    if (!state.masterDataModule.supplierRoadImportStatus || typeof state.masterDataModule.supplierRoadImportStatus !== 'object') state.masterDataModule.supplierRoadImportStatus = buildDefaultRoadImportStatus();
    return state.masterDataModule;
  }

  function getEntityDefinitions(i18n) {
    return MasterDataEntities && typeof MasterDataEntities.getEntityDefinitions === 'function'
      ? MasterDataEntities.getEntityDefinitions(i18n)
      : {};
  }

  function normalizePracticeFieldName(fieldName) {
    const clean = String(fieldName || '').trim();
    return clean === 'client' ? 'clientName' : clean;
  }

  function resolveEntityKeyForField(fieldName) {
    const normalizedFieldName = normalizePracticeFieldName(fieldName);
    return MasterDataEntities && typeof MasterDataEntities.resolveEntityKeyForField === 'function'
      ? MasterDataEntities.resolveEntityKeyForField(normalizedFieldName)
      : '';
  }

  function supportsQuickAdd(fieldName) {
    return Boolean(resolveEntityKeyForField(fieldName));
  }

  function getEntries(state, entityKey) {
    if (MasterDataEntities && typeof MasterDataEntities.listEntityRecords === 'function') {
      return MasterDataEntities.listEntityRecords(state, entityKey);
    }
    return [];
  }

  function getFormDraft(state, entityKey) {
    const moduleState = ensureModuleState(state);
    if (!moduleState.formDrafts[entityKey] || typeof moduleState.formDrafts[entityKey] !== 'object') {
      moduleState.formDrafts[entityKey] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
        ? MasterDataEntities.createFormDraft(entityKey)
        : { id: '', value: '', description: '', city: '' };
    }
    return moduleState.formDrafts[entityKey];
  }

  function resetEntityDraft(state, entityKey) {
    const moduleState = ensureModuleState(state);
    moduleState.formDrafts[entityKey] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
      ? MasterDataEntities.createFormDraft(entityKey)
      : { id: '', value: '', description: '', city: '' };
    moduleState.selectedRecordId = '';
    return moduleState.formDrafts[entityKey];
  }

  function setActiveEntity(state, entityKey) {
    const moduleState = ensureModuleState(state);
    if (!entityKey) return;
    moduleState.activeEntity = entityKey;
    moduleState.selectedRecordId = '';
    moduleState.searchQuery = '';
    moduleState.supplierFilters = buildDefaultSupplierFilters();
    moduleState.supplierRoadLookupDraft = buildDefaultRoadLookupDraft();
    moduleState.supplierRoadLookupResult = null;
    moduleState.supplierRoadImportStatus = buildDefaultRoadImportStatus();
    getFormDraft(state, entityKey);
  }

  function prepareQuickAdd(state, context = {}) {
    const normalizedFieldName = normalizePracticeFieldName(context.fieldName);
    const entityKey = context.entityKey || resolveEntityKeyForField(normalizedFieldName);
    if (!entityKey) return null;
    const moduleState = ensureModuleState(state);
    moduleState.activeEntity = entityKey;
    moduleState.selectedRecordId = '';
    moduleState.searchQuery = '';
    moduleState.formDrafts[entityKey] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
      ? MasterDataEntities.createFormDraft(entityKey)
      : { id: '', value: '', description: '', city: '' };
    moduleState.quickAddContext = {
      entityKey,
      fieldName: normalizedFieldName,
      returnRoute: String(context.returnRoute || 'practices').trim() || 'practices',
      returnTab: String(context.returnTab || 'practice').trim() || 'practice',
      returnSessionId: String(context.returnSessionId || '').trim(),
      returnFocusField: normalizePracticeFieldName(context.returnFocusField || normalizedFieldName || ''),
      returnFocusTab: String(context.returnFocusTab || context.returnTab || 'practice').trim() || 'practice',
      practiceReference: String(context.practiceReference || '').trim()
    };
    return moduleState.quickAddContext;
  }

  function clearQuickAdd(state) {
    const moduleState = ensureModuleState(state);
    moduleState.quickAddContext = null;
  }

  function applyEntryToDraft(state, context, result) {
    if (!state || !context || !result) return;
    const draft = state.draftPractice || (state.draftPractice = { dynamicData: {}, linkedEntities: {} });
    if (!draft.dynamicData || typeof draft.dynamicData !== 'object') draft.dynamicData = {};
    if (!draft.linkedEntities || typeof draft.linkedEntities !== 'object') draft.linkedEntities = {};
    const normalizedFieldName = normalizePracticeFieldName(context.fieldName);

    if (MasterDataEntities && typeof MasterDataEntities.applyLinkedRecordToDraft === 'function' && normalizedFieldName) {
      MasterDataEntities.applyLinkedRecordToDraft({
        state,
        draft,
        fieldName: normalizedFieldName,
        entityKey: context.entityKey,
        record: result.record || null,
        value: result.value || ''
      });
      return;
    }

    if (context.entityKey === 'client' || normalizedFieldName === 'clientName') {
      draft.clientName = result.value;
      draft.clientId = result.relatedId || '';
      return;
    }

    if (normalizedFieldName) {
      draft.dynamicData[normalizedFieldName] = result.value;
      if (MasterDataEntities && typeof MasterDataEntities.getRelationFieldName === 'function') {
        const relationFieldName = MasterDataEntities.getRelationFieldName(normalizedFieldName);
        if (relationFieldName) draft.dynamicData[relationFieldName] = result.relatedId || '';
      }
    }
  }

  function buildQuickAddButton(fieldName, i18n) {
    const normalizedFieldName = normalizePracticeFieldName(fieldName);
    const entityKey = resolveEntityKeyForField(normalizedFieldName);
    if (!entityKey) return '';
    const defs = getEntityDefinitions(i18n);
    const def = defs[entityKey];
    const title = i18n && typeof i18n.t === 'function'
      ? i18n.t('ui.quickAddButtonTitle', `Aggiungi rapidamente in ${def.familyLabel}`)
      : `Aggiungi rapidamente in ${def.familyLabel}`;
    return `<button type="button" class="field-inline-action quick-add-button" data-quick-add-field="${normalizedFieldName}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">+</button>`;
  }

  function buildOpenLinkedButton({ state, draft, fieldName, i18n }) {
    const normalizedFieldName = normalizePracticeFieldName(fieldName);
    const entityKey = resolveEntityKeyForField(normalizedFieldName);
    if (!entityKey || !MasterDataEntities || typeof MasterDataEntities.getLinkedRecordFromDraft !== 'function') return '';
    const linkedRecord = MasterDataEntities.getLinkedRecordFromDraft({ state, draft, fieldName: normalizedFieldName });
    if (!linkedRecord || !linkedRecord.id) return '';
    const defs = getEntityDefinitions(i18n);
    const def = defs[entityKey];
    const title = i18n && typeof i18n.t === 'function'
      ? i18n.t('ui.openLinkedRecordButtonTitle', `Apri la scheda collegata in ${def.familyLabel}`)
      : `Apri la scheda collegata in ${def.familyLabel}`;
    return `<button type="button" class="field-inline-action open-linked-button" data-open-linked-field="${normalizedFieldName}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">↗</button>`;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getSupplierOptionLabel(kind, value, t) {
    const clean = String(value || '').trim();
    if (!clean) return '';
    const maps = {
      supplierType: {
        'customs-broker': t.t('ui.masterDataSupplierTypeCustomsBroker', 'Broker doganale'),
        'road-carrier': t.t('ui.masterDataSupplierTypeRoadCarrier', 'Vettore stradale'),
        'sea-carrier': t.t('ui.masterDataSupplierTypeSeaCarrier', 'Compagnia marittima'),
        'air-carrier': t.t('ui.masterDataSupplierTypeAirCarrier', 'Compagnia aerea'),
        warehouse: t.t('ui.masterDataSupplierTypeWarehouse', 'Magazzino / deposito'),
        terminal: t.t('ui.masterDataSupplierTypeTerminal', 'Terminal'),
        insurance: t.t('ui.masterDataSupplierTypeInsurance', 'Assicurazione'),
        mixed: t.t('ui.masterDataSupplierTypeMixed', 'Multiservizio')
      },
      serviceScope: {
        customs: t.t('ui.masterDataSupplierScopeCustoms', 'Dogana'),
        sea: t.t('ui.masterDataSupplierScopeSea', 'Mare'),
        air: t.t('ui.masterDataSupplierScopeAir', 'Aereo'),
        road: t.t('ui.masterDataSupplierScopeRoad', 'Stradale'),
        warehouse: t.t('ui.masterDataSupplierScopeWarehouse', 'Magazzino'),
        multimodal: t.t('ui.masterDataSupplierScopeMultimodal', 'Multimodale'),
        'special-projects': t.t('ui.masterDataSupplierScopeSpecialProjects', 'Progetti speciali')
      },
      priorityTier: {
        strategic: t.t('ui.masterDataSupplierPriorityStrategic', 'Strategico'),
        preferred: t.t('ui.masterDataSupplierPriorityPreferred', 'Preferito'),
        standard: t.t('ui.masterDataSupplierPriorityStandard', 'Standard'),
        standby: t.t('ui.masterDataSupplierPriorityStandby', 'Stand-by')
      },
      reliabilityLevel: {
        validated: t.t('ui.masterDataSupplierReliabilityValidated', 'Validato'),
        monitored: t.t('ui.masterDataSupplierReliabilityMonitored', 'Monitorato'),
        'to-develop': t.t('ui.masterDataSupplierReliabilityToDevelop', 'Da sviluppare')
      },
      roadPricingMode: {
        manual: t.t('ui.masterDataSupplierRoadPricingManual', 'Voce manuale / spot'),
        matrix: t.t('ui.masterDataSupplierRoadPricingMatrix', 'Listino tratte / km'),
        hybrid: t.t('ui.masterDataSupplierRoadPricingHybrid', 'Ibrido')
      },
      roadDistanceSource: {
        manual: t.t('ui.masterDataSupplierRoadDistanceManual', 'Manuale'),
        'supplier-matrix': t.t('ui.masterDataSupplierRoadDistanceMatrix', 'Matrice vettore'),
        'truck-distancer': t.t('ui.masterDataSupplierRoadDistanceTruckDistancer', 'Distanziere mezzi pesanti'),
        hybrid: t.t('ui.masterDataSupplierRoadDistanceHybrid', 'Misto')
      }
    };
    return maps[kind] && maps[kind][clean] ? maps[kind][clean] : clean;
  }


  function getSupplierPriceListMetrics(priceLists = []) {
    const rows = Array.isArray(priceLists) ? priceLists : [];
    return {
      total: rows.length,
      active: rows.filter((row) => row && row.active !== false).length,
      withValidity: rows.filter((row) => String(row && (row.validityFrom || row.validityTo) || '').trim()).length,
      withPrice: rows.filter((row) => String(row && row.unitPrice || '').trim()).length
    };
  }

  function isSupplierPreferred(record) {
    const priority = String(record && record.priorityTier || '').trim();
    return priority === 'strategic' || priority === 'preferred';
  }

  function isSupplierReliable(record) {
    return String(record && record.reliabilityLevel || '').trim() === 'validated';
  }

  function isSupplierClassified(record) {
    return [record && record.supplierType, record && record.serviceScope, record && record.priorityTier, record && record.reliabilityLevel].some((value) => String(value || '').trim());
  }



  function isRoadCarrierRecord(record) {
    const supplierType = String(record && record.supplierType || '').trim();
    const serviceScope = String(record && record.serviceScope || '').trim();
    return supplierType === 'road-carrier' || serviceScope === 'road';
  }

  function getRoadRateSourceLabel(value, t) {
    const clean = String(value || '').trim();
    if (clean === 'excel-import') return 'Excel / CSV';
    if (clean === 'manual') return t.t('ui.masterDataSupplierRoadDistanceManual', 'Manuale');
    return clean || '—';
  }

  function getRoadRateMatchLabel(value, t) {
    const clean = String(value || '').trim();
    if (clean === 'exact') return t.t('ui.masterDataSupplierRoadRatesCounterExact', 'Match esatto');
    if (clean === 'reverse') return t.t('ui.masterDataSupplierRoadRatesCounterReverse', 'Match inverso');
    return t.t('ui.masterDataSupplierRoadRatesCounterPartial', 'Match parziale');
  }

  function syncDraftFromForm(form, draft) {
    if (!form || !draft) return draft;
    const formData = new FormData(form);
    Array.from(form.querySelectorAll('[name]')).forEach((node) => {
      if (!node.name) return;
      if (node.type === 'checkbox') draft[node.name] = Boolean(node.checked);
      else draft[node.name] = String(formData.get(node.name) || '').trim();
    });
    return draft;
  }

  function getFilteredEntries(entries, query, entityKey = '') {
    const clean = String(query || '').trim().toLowerCase();
    if (!clean) return entries;
    return entries.filter((entry) => {
      const baseParts = [entry.primary, entry.secondary, entry.tertiary, entry.value];
      if (entityKey === 'supplier' && entry && entry.record) {
        baseParts.push(
          entry.record.shortName,
          entry.record.code,
          entry.record.vatNumber,
          entry.record.contactPerson,
          entry.record.supplierType,
          entry.record.serviceScope,
          entry.record.priorityTier,
          entry.record.reliabilityLevel,
          entry.record.serviceModes,
          entry.record.servicedAreas,
          entry.record.paymentTerms,
          entry.record.internalOperationalNote,
          entry.record.displayValue,
          entry.record.notes
        );
      }
      return baseParts.some((part) => String(part || '').toLowerCase().includes(clean));
    });
  }

  function applySupplierOperationalFilters(entries, filters = {}) {
    const rows = Array.isArray(entries) ? entries : [];
    return rows.filter((entry) => {
      const record = entry && entry.record ? entry.record : {};
      if (filters.withModes && !String(record.serviceModes || '').trim()) return false;
      if (filters.withAreas && !String(record.servicedAreas || '').trim()) return false;
      if (filters.withPaymentTerms && !String(record.paymentTerms || '').trim()) return false;
      if (filters.classifiedOnly && !isSupplierClassified(record)) return false;
      if (filters.preferredOnly && !isSupplierPreferred(record)) return false;
      if (filters.reliableOnly && !isSupplierReliable(record)) return false;
      if (filters.activeOnly && record.active === false) return false;
      return true;
    });
  }

  function openExistingRecord(state, entityKey, recordId) {
    const moduleState = ensureModuleState(state);
    if (!recordId || !MasterDataEntities || typeof MasterDataEntities.getEntityRecordById !== 'function') {
      moduleState.selectedRecordId = '';
      resetEntityDraft(state, entityKey);
      return null;
    }
    const record = MasterDataEntities.getEntityRecordById(state, entityKey, recordId);
    if (!record) return null;
    moduleState.selectedRecordId = recordId;
    moduleState.formDrafts[entityKey] = MasterDataEntities.createFormDraft(entityKey, record);
    return record;
  }

  function renderEntryFormFields({ activeDef, formDraft, t }) {
    const structuredFields = MasterDataEntities && typeof MasterDataEntities.getFormFields === 'function'
      ? MasterDataEntities.getFormFields(activeDef.key, t)
      : [];
    if (Array.isArray(structuredFields) && structuredFields.length) {
      const blocks = structuredFields.map((field) => {
        const fieldId = `masterData_${field.name}`;
        const requiredMark = field.required ? ' <span class="required-mark">*</span>' : '';
        if (field.type === 'textarea') {
          return `<div class="field ${field.full ? 'full' : ''}"><label for="${fieldId}">${escapeHtml(field.label)}${requiredMark}</label><textarea id="${fieldId}" name="${field.name}" rows="3">${escapeHtml(formDraft[field.name] || '')}</textarea></div>`;
        }
        if (field.type === 'checkbox') {
          return `<div class="field ${field.full ? 'full' : ''}"><label class="checkbox-chip master-data-checkbox"><input id="${fieldId}" name="${field.name}" type="checkbox" ${formDraft[field.name] !== false ? 'checked' : ''} /> ${escapeHtml(field.label)}</label></div>`;
        }
        if (field.type === 'select') {
          const options = Array.isArray(field.options) ? field.options : [];
          return `<div class="field ${field.full ? 'full' : ''}"><label for="${fieldId}">${escapeHtml(field.label)}${requiredMark}</label><select id="${fieldId}" name="${field.name}">${options.map((option) => `<option value="${escapeHtml(option.value || '')}" ${String(formDraft[field.name] || '') === String(option.value || '') ? 'selected' : ''}>${escapeHtml(option.label || option.value || '')}</option>`).join('')}</select></div>`;
        }
        if (field.lookupAction === 'vat-autofill') {
          const lookupStatus = VatAutofill && typeof VatAutofill.renderLookupStatus === 'function'
            ? VatAutofill.renderLookupStatus(formDraft, t)
            : '';
          return `<div class="field ${field.full ? 'full' : ''} master-data-lookup-field"><label for="${fieldId}">${escapeHtml(field.label)}${requiredMark}</label><div class="master-data-lookup-row"><input id="${fieldId}" name="${field.name}" type="text" value="${escapeHtml(formDraft[field.name] || '')}" autocomplete="off" /><button class="btn secondary master-data-lookup-button" id="masterDataVatLookupButton" type="button">${escapeHtml(t.t('ui.masterDataVatLookupAction', 'Recupera dati'))}</button></div>${lookupStatus}</div>`;
        }
        return `<div class="field ${field.full ? 'full' : ''}"><label for="${fieldId}">${escapeHtml(field.label)}${requiredMark}</label><input id="${fieldId}" name="${field.name}" type="text" value="${escapeHtml(formDraft[field.name] || '')}" autocomplete="off" /></div>`;
      }).join('');
      return `<div class="form-grid two master-data-entity-grid">${blocks}</div>`;
    }

    const currentValue = escapeHtml(formDraft.value || '');
    const currentDescription = escapeHtml(formDraft.description || '');
    const currentCity = escapeHtml(formDraft.city || '');
    return `<div class="form-grid two"><div class="field ${activeDef.supportsDescription ? '' : (activeDef.supportsCity ? '' : 'full')}"><label for="masterDataValue">${escapeHtml(activeDef.valueLabel)}</label><input id="masterDataValue" name="value" type="text" value="${currentValue}" autocomplete="off" /></div>${activeDef.supportsDescription ? `<div class="field"><label for="masterDataDescription">${escapeHtml(t.t('ui.masterDataDescription', 'Descrizione'))}</label><input id="masterDataDescription" name="description" type="text" value="${currentDescription}" autocomplete="off" /></div>` : ''}${activeDef.supportsCity ? `<div class="field"><label for="masterDataCity">${escapeHtml(t.t('ui.city', 'Città'))}</label><input id="masterDataCity" name="city" type="text" value="${currentCity}" autocomplete="off" /></div>` : ''}</div>`;
  }

  function renderRecordMeta(formDraft, t) {
    const chips = [];
    if (formDraft.id) chips.push(`<span class="badge">${escapeHtml(t.t('ui.masterDataRecordCode', 'Codice scheda'))}: ${escapeHtml(formDraft.id)}</span>`);
    if (formDraft.vatLookupSource) chips.push(`<span class="badge info">${escapeHtml(formDraft.vatLookupSource)}</span>`);
    if (formDraft.vatLookupAt) chips.push(`<span class="badge">${escapeHtml(t.t('ui.masterDataLastLookup', 'Ultimo lookup'))}: ${escapeHtml(new Date(formDraft.vatLookupAt).toLocaleDateString('it-IT'))}</span>`);
    if (!chips.length) return '';
    return `<div class="master-data-meta-strip">${chips.join('')}</div>`;
  }

  function renderSupplierRowMeta(entry, t) {
    const record = entry && entry.record ? entry.record : null;
    if (!record) return '';
    const tags = [
      getSupplierOptionLabel('supplierType', record.supplierType, t),
      getSupplierOptionLabel('serviceScope', record.serviceScope, t),
      getSupplierOptionLabel('priorityTier', record.priorityTier, t),
      getSupplierOptionLabel('reliabilityLevel', record.reliabilityLevel, t),
      String(record.serviceModes || '').trim(),
      String(record.servicedAreas || '').trim(),
      getSupplierOptionLabel('roadPricingMode', record.roadPricingMode, t),
      getSupplierOptionLabel('roadDistanceSource', record.roadDistanceSource, t),
      String(record.truckProfiles || '').trim(),
      String(record.paymentTerms || '').trim(),
      String(record.contactPerson || '').trim()
    ].filter(Boolean).slice(0, 6);
    if (!tags.length) {
      return `<div class="master-data-row-tags"><span class="master-data-row-tag muted">${escapeHtml(t.t('ui.masterDataSupplierTagEmpty', 'profilo da completare'))}</span></div>`;
    }
    return `<div class="master-data-row-tags">${tags.map((tag) => `<span class="master-data-row-tag">${escapeHtml(tag)}</span>`).join('')}</div>`;
  }

  function renderList(entries, filteredEntries, activeRecordId, t, activeEntity = '') {
    if (!entries.length) {
      return `<div class="master-data-empty-state">${escapeHtml(t.t('ui.masterDataNoEntries', 'Nessun valore presente in questa anagrafica.'))}</div>`;
    }
    if (!filteredEntries.length) {
      return `<div class="master-data-empty-state">${escapeHtml(t.t('ui.masterDataSearchNoResults', 'Nessun risultato per questa ricerca.'))}</div>`;
    }
    return `<div class="master-data-list">${filteredEntries.map((entry) => {
      const active = String(activeRecordId || '') === String(entry.id || '');
      const supplierMeta = activeEntity === 'supplier' ? renderSupplierRowMeta(entry, t) : '';
      return `<button type="button" class="master-data-row ${active ? 'active' : ''}" data-master-record-id="${escapeHtml(entry.id || '')}"><span class="master-data-row-main"><strong>${escapeHtml(entry.primary)}</strong><small>${escapeHtml(entry.secondary || '—')}</small>${supplierMeta}</span><span class="master-data-row-side">${escapeHtml(entry.tertiary || '—')}</span></button>`;
    }).join('')}</div>`;
  }

  function renderSupplierFilterToolbar(moduleState, entries, queryFilteredEntries, t) {
    const filters = ensureSupplierFilters(moduleState);
    const suppliers = Array.isArray(entries) ? entries : [];
    const matchesModes = suppliers.filter((entry) => String(entry?.record?.serviceModes || '').trim()).length;
    const matchesAreas = suppliers.filter((entry) => String(entry?.record?.servicedAreas || '').trim()).length;
    const matchesTerms = suppliers.filter((entry) => String(entry?.record?.paymentTerms || '').trim()).length;
    const matchesClassified = suppliers.filter((entry) => isSupplierClassified(entry?.record || {})).length;
    const matchesPreferred = suppliers.filter((entry) => isSupplierPreferred(entry?.record || {})).length;
    const matchesReliable = suppliers.filter((entry) => isSupplierReliable(entry?.record || {})).length;
    const matchesActive = suppliers.filter((entry) => entry?.record?.active !== false).length;
    const activeCount = [filters.withModes, filters.withAreas, filters.withPaymentTerms, filters.classifiedOnly, filters.preferredOnly, filters.reliableOnly, filters.activeOnly].filter(Boolean).length;
    const modeButton = (key, count, label) => `<button type="button" class="master-data-filter-chip ${filters[key] ? 'active' : ''}" data-supplier-filter="${escapeHtml(key)}">${escapeHtml(label)} · ${escapeHtml(String(count))}</button>`;
    return `
      <div class="master-data-filter-toolbar supplier">
        <div class="master-data-filter-toolbar-head">
          <strong>${escapeHtml(t.t('ui.masterDataSupplierFilterTitle', 'Filtro operativo fornitori'))}</strong>
          <span>${escapeHtml(t.t('ui.masterDataSupplierFilterDetail', 'Restringi la base fornitori per servizio, tratta, condizioni e stato attivo.'))}</span>
        </div>
        <div class="master-data-filter-chip-row">
          ${modeButton('withModes', matchesModes, t.t('ui.masterDataSupplierFilterModes', 'con servizi / modalità'))}
          ${modeButton('withAreas', matchesAreas, t.t('ui.masterDataSupplierFilterAreas', 'con aree / tratte'))}
          ${modeButton('withPaymentTerms', matchesTerms, t.t('ui.masterDataSupplierFilterTerms', 'con condizioni pagamento'))}
          ${modeButton('classifiedOnly', matchesClassified, t.t('ui.masterDataSupplierFilterClassified', 'profilo classificato'))}
          ${modeButton('preferredOnly', matchesPreferred, t.t('ui.masterDataSupplierFilterPreferred', 'priorità alta'))}
          ${modeButton('reliableOnly', matchesReliable, t.t('ui.masterDataSupplierFilterReliable', 'affidabilità alta'))}
          ${modeButton('activeOnly', matchesActive, t.t('ui.masterDataSupplierFilterActive', 'solo attivi'))}
          <button type="button" class="master-data-filter-chip secondary" data-supplier-filter-reset="true">${escapeHtml(t.t('ui.masterDataSupplierFilterReset', 'Azzera filtri'))}</button>
        </div>
        <div class="master-data-filter-toolbar-meta">${escapeHtml(queryFilteredEntries.length)} ${escapeHtml(t.t('ui.masterDataSupplierFilterVisibleBefore', 'record dopo la ricerca'))} · ${escapeHtml(activeCount)} ${escapeHtml(t.t('ui.masterDataSupplierFilterActiveCount', 'filtri attivi'))}</div>
      </div>`;
  }

  function getRouteEntityMeta(state, defs) {
    const route = String(state && state.currentRoute || '').trim();
    const map = {
      'master-data/fornitori': 'supplier',
      'master-data/clienti': 'client',
      'master-data/importatori': 'importer',
      'master-data/destinatari': 'consignee',
      'master-data/mittenti': 'sender',
      'master-data/compagnie-marittime': 'shippingCompany',
      'master-data/compagnie-aeree': 'airline',
      'master-data/vettori': 'carrier',
      'master-data/navi': 'vessel',
      'master-data/taric': 'taric',
      'master-data/dogane': 'customsOffice',
      'master-data/porti': 'seaPort',
      'master-data/aeroporti': 'airport',
      'master-data/terminal': 'terminal',
      'master-data/origini': 'origin',
      'master-data/destinazioni': 'destination',
      'master-data/localita-logistiche': 'logisticsLocation',
      'master-data/depositi': 'deposit',
      'master-data/collega-a': 'warehouseLink',
      'master-data/codici-articolo': 'articleCode',
      'master-data/tipologie-unita': 'transportUnitType'
    };
    const key = map[route] || '';
    return key && defs[key] ? defs[key] : null;
  }

  function renderSupplierOperationalPanel(state, formDraft, entries, t) {
    const suppliers = Array.isArray(entries) ? entries : [];
    const withModes = suppliers.filter((entry) => String(entry?.record?.serviceModes || '').trim()).length;
    const withAreas = suppliers.filter((entry) => String(entry?.record?.servicedAreas || '').trim()).length;
    const withTerms = suppliers.filter((entry) => String(entry?.record?.paymentTerms || '').trim()).length;
    const withClassification = suppliers.filter((entry) => isSupplierClassified(entry?.record || {})).length;
    const preferredSuppliers = suppliers.filter((entry) => isSupplierPreferred(entry?.record || {})).length;
    const reliableSuppliers = suppliers.filter((entry) => isSupplierReliable(entry?.record || {})).length;
    const currentTitle = String(formDraft?.value || '').trim() || t.t('ui.masterDataSupplierProfileEmpty', 'Nessun fornitore selezionato');
    const currentType = getSupplierOptionLabel('supplierType', formDraft?.supplierType, t) || '—';
    const currentScope = getSupplierOptionLabel('serviceScope', formDraft?.serviceScope, t) || '—';
    const currentPriority = getSupplierOptionLabel('priorityTier', formDraft?.priorityTier, t) || '—';
    const currentReliability = getSupplierOptionLabel('reliabilityLevel', formDraft?.reliabilityLevel, t) || '—';
    const currentModes = String(formDraft?.serviceModes || '').trim() || '—';
    const currentAreas = String(formDraft?.servicedAreas || '').trim() || '—';
    const currentTerms = String(formDraft?.paymentTerms || '').trim() || '—';
    const currentContact = String(formDraft?.contactPerson || '').trim() || '—';
    const currentInternalNote = String(formDraft?.internalOperationalNote || '').trim() || '—';
    const currentRoadPricing = getSupplierOptionLabel('roadPricingMode', formDraft?.roadPricingMode, t) || '—';
    const currentRoadDistance = getSupplierOptionLabel('roadDistanceSource', formDraft?.roadDistanceSource, t) || '—';
    const currentTruckProfiles = String(formDraft?.truckProfiles || '').trim() || '—';
    return `
      <section class="panel master-data-supplier-panel">
        <div class="panel-head compact">
          <div>
            <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataSupplierPanelTitle', 'Fornitori · profilo operativo'))}</h3>
            <p class="panel-subtitle">${escapeHtml(t.t('ui.masterDataSupplierPanelDetail', 'Consolida i dati minimi utili per quotazioni future, CRM fornitori e ricerca per servizio o tratta.'))}</p>
          </div>
        </div>
        <div class="master-data-supplier-panel-grid">
          <article class="master-data-supplier-panel-card"><strong>${escapeHtml(String(suppliers.length))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPanelCount', 'fornitori attivi in anagrafica'))}</span></article>
          <article class="master-data-supplier-panel-card"><strong>${escapeHtml(String(withModes))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPanelModes', 'con servizi / modalità'))}</span></article>
          <article class="master-data-supplier-panel-card"><strong>${escapeHtml(String(withAreas))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPanelAreas', 'con aree / tratte'))}</span></article>
          <article class="master-data-supplier-panel-card"><strong>${escapeHtml(String(withTerms))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPanelTerms', 'con condizioni pagamento'))}</span></article>
          <article class="master-data-supplier-panel-card"><strong>${escapeHtml(String(withClassification))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPanelClassified', 'con classificazione interna'))}</span></article>
          <article class="master-data-supplier-panel-card"><strong>${escapeHtml(String(preferredSuppliers))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPanelPreferred', 'con priorità alta'))}</span></article>
          <article class="master-data-supplier-panel-card"><strong>${escapeHtml(String(reliableSuppliers))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPanelReliable', 'con affidabilità validata'))}</span></article>
        </div>
        <div class="master-data-supplier-current">
          <div class="master-data-supplier-current-head">${escapeHtml(t.t('ui.masterDataSupplierPanelCurrent', 'Scheda corrente'))}</div>
          <div class="master-data-supplier-current-title">${escapeHtml(currentTitle)}</div>
          <div class="master-data-supplier-current-grid">
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierType', 'Tipo fornitore'))}</span><strong>${escapeHtml(currentType)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierServiceScope', 'Ambito servizio'))}</span><strong>${escapeHtml(currentScope)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierPriorityTier', 'Priorità interna'))}</span><strong>${escapeHtml(currentPriority)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierReliabilityLevel', 'Affidabilità'))}</span><strong>${escapeHtml(currentReliability)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierServiceModes', 'Servizi / modalità coperte'))}</span><strong>${escapeHtml(currentModes)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierServicedAreas', 'Aree / tratte servite'))}</span><strong>${escapeHtml(currentAreas)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierPaymentTerms', 'Condizioni pagamento'))}</span><strong>${escapeHtml(currentTerms)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierContactPerson', 'Referente operativo'))}</span><strong>${escapeHtml(currentContact)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierRoadPricingMode', 'Tariffazione stradale'))}</span><strong>${escapeHtml(currentRoadPricing)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierRoadDistanceSource', 'Fonte km / distanze'))}</span><strong>${escapeHtml(currentRoadDistance)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierTruckProfiles', 'Profili mezzi coperti'))}</span><strong>${escapeHtml(currentTruckProfiles)}</strong></div>
            <div><span>${escapeHtml(t.t('ui.masterDataSupplierInternalOperationalNote', 'Nota operativa interna'))}</span><strong>${escapeHtml(currentInternalNote)}</strong></div>
          </div>
        </div>
      </section>`;
  }


  function renderSupplierPriceListsPanel(state, formDraft, t) {
    if (!SupplierPriceLists || typeof SupplierPriceLists.listForSupplier !== 'function' || typeof SupplierPriceLists.createDraft !== 'function') return '';
    const supplierRecord = formDraft && formDraft.id && formDraft.value
      ? { id: formDraft.id, name: formDraft.value, paymentTerms: formDraft.paymentTerms }
      : null;
    if (!supplierRecord) {
      return `
        <section class="panel master-data-price-list-panel">
          <div class="panel-head compact">
            <div>
              <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataSupplierPriceListsTitle', 'Fornitori · storico / listini foundation'))}</h3>
              <p class="panel-subtitle">${escapeHtml(t.t('ui.masterDataSupplierPriceListsSaveSupplierFirst', 'Salva prima la scheda fornitore: lo storico listini viene agganciato a un fornitore strutturato reale.'))}</p>
            </div>
          </div>
        </section>`;
    }
    const moduleState = ensureModuleState(state);
    const draft = ensureSupplierPriceListDraft(moduleState, supplierRecord);
    const priceLists = SupplierPriceLists.listForSupplier(state, supplierRecord);
    const metrics = getSupplierPriceListMetrics(priceLists);
    const draftTitle = String(draft && draft.id || '').trim()
      ? t.t('ui.masterDataSupplierPriceListsEditDraft', 'Modifica listino selezionato')
      : t.t('ui.masterDataSupplierPriceListsNewDraft', 'Nuovo listino fornitore');
    const cards = priceLists.length
      ? priceLists.map((item) => {
          const priceLine = [item.unitPrice, item.currency, item.unitType].filter(Boolean).join(' · ') || '—';
          const validityLine = [item.validityFrom, item.validityTo].filter(Boolean).join(' → ') || t.t('ui.masterDataSupplierPriceListsNoValidity', 'validità non definita');
          const metaLine = [item.routeScope, item.paymentTerms, item.leadTime].filter(Boolean).join(' · ');
          return `
            <article class="master-data-price-list-card ${item.active === false ? 'is-inactive' : ''}">
              <div class="master-data-price-list-card-head">
                <div>
                  <h4>${escapeHtml(item.serviceLabel || '—')}</h4>
                  <div class="master-data-price-list-card-price">${escapeHtml(priceLine)}</div>
                </div>
                <button type="button" class="btn secondary small" data-supplier-price-list-id="${escapeHtml(item.id)}">${escapeHtml(t.t('ui.masterDataSupplierPriceListsOpen', 'Apri'))}</button>
              </div>
              <div class="master-data-price-list-card-meta">${escapeHtml(validityLine)}</div>
              ${metaLine ? `<div class="master-data-price-list-card-meta">${escapeHtml(metaLine)}</div>` : ''}
              ${item.notes ? `<div class="master-data-price-list-card-note">${escapeHtml(item.notes)}</div>` : ''}
            </article>`;
        }).join('')
      : `<div class="master-data-price-list-empty">${escapeHtml(t.t('ui.masterDataSupplierPriceListsEmpty', 'Nessun listino ancora registrato per questo fornitore.'))}</div>`;

    return `
      <section class="panel master-data-price-list-panel">
        <div class="panel-head compact">
          <div>
            <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataSupplierPriceListsTitle', 'Fornitori · storico / listini foundation'))}</h3>
            <p class="panel-subtitle">${escapeHtml(t.t('ui.masterDataSupplierPriceListsDetail', 'Registra i primi listini storici del fornitore per preparare il ponte con Quotazioni e confronto costi.'))}</p>
          </div>
        </div>
        <div class="master-data-price-list-metrics">
          <article class="master-data-price-list-metric"><strong>${escapeHtml(String(metrics.total))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPriceListsMetricTotal', 'listini collegati'))}</span></article>
          <article class="master-data-price-list-metric"><strong>${escapeHtml(String(metrics.active))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPriceListsMetricActive', 'listini attivi'))}</span></article>
          <article class="master-data-price-list-metric"><strong>${escapeHtml(String(metrics.withValidity))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPriceListsMetricValidity', 'con validità'))}</span></article>
          <article class="master-data-price-list-metric"><strong>${escapeHtml(String(metrics.withPrice))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierPriceListsMetricPrice', 'con costo valorizzato'))}</span></article>
        </div>
        <div class="master-data-price-list-layout">
          <div class="master-data-price-list-history">${cards}</div>
          <div class="master-data-price-list-editor">
            <div class="master-data-price-list-editor-head">${escapeHtml(draftTitle)}</div>
            <form id="supplierPriceListForm" class="master-data-form-stack">
              <input type="hidden" name="id" value="${escapeHtml(draft.id || '')}" />
              <input type="hidden" name="supplierId" value="${escapeHtml(draft.supplierId || '')}" />
              <input type="hidden" name="supplierName" value="${escapeHtml(draft.supplierName || '')}" />
              <div class="form-grid two master-data-price-list-grid">
                <div class="field full"><label for="supplierPriceListServiceLabel">${escapeHtml(t.t('ui.masterDataSupplierPriceListsServiceLabel', 'Servizio / voce costo'))}</label><input id="supplierPriceListServiceLabel" name="serviceLabel" type="text" value="${escapeHtml(draft.serviceLabel || '')}" autocomplete="off" /></div>
                <div class="field full"><label for="supplierPriceListRouteScope">${escapeHtml(t.t('ui.masterDataSupplierPriceListsRouteScope', 'Tratta / ambito'))}</label><input id="supplierPriceListRouteScope" name="routeScope" type="text" value="${escapeHtml(draft.routeScope || '')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierPriceListValidityFrom">${escapeHtml(t.t('ui.masterDataSupplierPriceListsValidityFrom', 'Validità dal'))}</label><input id="supplierPriceListValidityFrom" name="validityFrom" type="date" value="${escapeHtml(draft.validityFrom || '')}" /></div>
                <div class="field"><label for="supplierPriceListValidityTo">${escapeHtml(t.t('ui.masterDataSupplierPriceListsValidityTo', 'Validità al'))}</label><input id="supplierPriceListValidityTo" name="validityTo" type="date" value="${escapeHtml(draft.validityTo || '')}" /></div>
                <div class="field"><label for="supplierPriceListCurrency">${escapeHtml(t.t('ui.masterDataSupplierPriceListsCurrency', 'Valuta'))}</label><input id="supplierPriceListCurrency" name="currency" type="text" value="${escapeHtml(draft.currency || 'EUR')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierPriceListUnitPrice">${escapeHtml(t.t('ui.masterDataSupplierPriceListsUnitPrice', 'Costo'))}</label><input id="supplierPriceListUnitPrice" name="unitPrice" type="text" value="${escapeHtml(draft.unitPrice || '')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierPriceListUnitType">${escapeHtml(t.t('ui.masterDataSupplierPriceListsUnitType', 'Unità / misura'))}</label><input id="supplierPriceListUnitType" name="unitType" type="text" value="${escapeHtml(draft.unitType || '')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierPriceListLeadTime">${escapeHtml(t.t('ui.masterDataSupplierPriceListsLeadTime', 'Lead time / resa'))}</label><input id="supplierPriceListLeadTime" name="leadTime" type="text" value="${escapeHtml(draft.leadTime || '')}" autocomplete="off" /></div>
                <div class="field full"><label for="supplierPriceListPaymentTerms">${escapeHtml(t.t('ui.masterDataSupplierPriceListsPaymentTerms', 'Pagamento listino'))}</label><input id="supplierPriceListPaymentTerms" name="paymentTerms" type="text" value="${escapeHtml(draft.paymentTerms || '')}" autocomplete="off" /></div>
                <div class="field full"><label for="supplierPriceListNotes">${escapeHtml(t.t('ui.masterDataSupplierPriceListsNotes', 'Note listino'))}</label><textarea id="supplierPriceListNotes" name="notes" rows="3">${escapeHtml(draft.notes || '')}</textarea></div>
                <div class="field full"><label class="checkbox-chip master-data-checkbox"><input name="active" type="checkbox" ${draft.active !== false ? 'checked' : ''} /> ${escapeHtml(t.t('ui.masterDataSupplierPriceListsActive', 'Listino attivo'))}</label></div>
              </div>
              <div class="form-actions master-data-actions">
                <button class="btn" type="submit">${escapeHtml(t.t('ui.masterDataSupplierPriceListsSave', 'Salva listino'))}</button>
                <button class="btn secondary" id="supplierPriceListResetButton" type="button">${escapeHtml(t.t('ui.masterDataSupplierPriceListsReset', 'Nuovo listino'))}</button>
              </div>
            </form>
          </div>
        </div>
      </section>`;
  }

  function renderSupplierRoadRatesPanel(state, formDraft, t) {
    if (!SupplierRoadRates || typeof SupplierRoadRates.listForSupplier !== 'function' || typeof SupplierRoadRates.createDraft !== 'function') return '';
    const supplierRecord = formDraft && formDraft.id && formDraft.value
      ? { id: formDraft.id, name: formDraft.value, paymentTerms: formDraft.paymentTerms }
      : null;
    if (!supplierRecord) {
      return `
        <section class="panel master-data-price-list-panel">
          <div class="panel-head compact">
            <div>
              <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesTitle', 'Fornitori stradali · tratte/km foundation'))}</h3>
              <p class="panel-subtitle">${escapeHtml(t.t('ui.masterDataSupplierPriceListsSaveSupplierFirst', 'Salva prima la scheda fornitore: lo storico listini viene agganciato a un fornitore strutturato reale.'))}</p>
            </div>
          </div>
        </section>`;
    }
    if (!isRoadCarrierRecord(formDraft)) {
      return `
        <section class="panel master-data-price-list-panel">
          <div class="panel-head compact">
            <div>
              <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesTitle', 'Fornitori stradali · tratte/km foundation'))}</h3>
              <p class="panel-subtitle">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesNotRoad', 'Questo blocco si attiva per fornitori classificati come vettori stradali o con ambito stradale.'))}</p>
            </div>
          </div>
        </section>`;
    }
    const moduleState = ensureModuleState(state);
    const draft = ensureSupplierRoadRateDraft(moduleState, supplierRecord);
    const rows = SupplierRoadRates.listForSupplier(state, supplierRecord);
    const metrics = typeof SupplierRoadRates.getMetrics === 'function' ? SupplierRoadRates.getMetrics(rows) : { total: rows.length, active: 0, withDistance: 0, withTariff: 0, imported: 0 };
    const importStatus = moduleState.supplierRoadImportStatus || buildDefaultRoadImportStatus();
    const lookupDraft = moduleState.supplierRoadLookupDraft || buildDefaultRoadLookupDraft();
    const lookupResult = moduleState.supplierRoadLookupResult || null;
    const draftTitle = String(draft && draft.id || '').trim()
      ? t.t('ui.masterDataSupplierRoadRatesEditDraft', 'Modifica tratta chilometrica')
      : t.t('ui.masterDataSupplierRoadRatesNewDraft', 'Nuova tratta / riga chilometrica');
    const cards = rows.length
      ? rows.map((item) => {
          const lineA = [`${item.origin} → ${item.destination}`, item.vehicleType || '', item.serviceType || ''].filter(Boolean).join(' · ');
          const lineB = [item.distanceKm ? `${item.distanceKm} km` : '', item.tariffAmount ? `${item.tariffAmount} ${item.currency || 'EUR'}` : '', item.paymentTerms || ''].filter(Boolean).join(' · ') || '—';
          const lineC = [item.validityFrom, item.validityTo].filter(Boolean).join(' → ') || '';
          return `
            <article class="master-data-price-list-card ${item.active === false ? 'is-inactive' : ''}">
              <div class="master-data-price-list-card-head">
                <div>
                  <h4>${escapeHtml(lineA)}</h4>
                  <div class="master-data-price-list-card-price">${escapeHtml(lineB)}</div>
                </div>
                <button type="button" class="btn secondary small" data-supplier-road-rate-id="${escapeHtml(item.id)}">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesOpen', 'Apri'))}</button>
              </div>
              ${lineC ? `<div class="master-data-price-list-card-meta">${escapeHtml(lineC)}</div>` : ''}
              <div class="master-data-price-list-card-meta">${escapeHtml(getRoadRateSourceLabel(item.sourceType, t))}</div>
              ${item.notes ? `<div class="master-data-price-list-card-note">${escapeHtml(item.notes)}</div>` : ''}
            </article>`;
        }).join('')
      : `<div class="master-data-price-list-empty">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesEmpty', 'Nessuna tratta chilometrica registrata per questo vettore.'))}</div>`;

    const importStatusText = importStatus.status === 'done'
      ? t.t('ui.masterDataSupplierRoadRatesImportStatusDone', 'Ultimo import: {count} righe nuove, {updated} aggiornate, {skipped} scartate.')
          .replace('{count}', String(importStatus.imported || 0))
          .replace('{updated}', String(importStatus.updated || 0))
          .replace('{skipped}', String(importStatus.skipped || 0))
      : importStatus.status === 'failed'
        ? (importStatus.message || t.t('ui.masterDataSupplierRoadRatesImportStatusFailed', 'Import non completato: controlla file e mapping colonne.'))
        : t.t('ui.masterDataSupplierRoadRatesImportStatusIdle', 'Nessun import eseguito in questa sessione.');

    const lookupHtml = lookupResult && lookupResult.ok && lookupResult.record
      ? `<div class="master-data-road-counter-result success"><strong>${escapeHtml(getRoadRateMatchLabel(lookupResult.matchType, t))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierRoadRatesCounterResultKm', 'Km stimati'))}: ${escapeHtml(String(lookupResult.record.distanceKm || '—'))}</span><span>${escapeHtml(t.t('ui.masterDataSupplierRoadRatesCounterResultTariff', 'Tariffa disponibile'))}: ${escapeHtml([lookupResult.record.tariffAmount, lookupResult.record.currency].filter(Boolean).join(' ') || '—')}</span><span>${escapeHtml(t.t('ui.masterDataSupplierRoadRatesCounterResultSource', 'Fonte'))}: ${escapeHtml(getRoadRateSourceLabel(lookupResult.record.sourceType, t))}</span></div>`
      : (lookupResult && lookupResult.ok === false
        ? `<div class="master-data-road-counter-result">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesCounterNoMatch', 'Nessuna tratta trovata nella matrice attuale del vettore.'))}</div>`
        : '');

    return `
      <section class="panel master-data-price-list-panel master-data-road-rates-panel">
        <div class="panel-head compact">
          <div>
            <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesTitle', 'Fornitori stradali · tratte/km foundation'))}</h3>
            <p class="panel-subtitle">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesDetail', 'Gestisci tratte chilometriche del vettore stradale con inserimento singolo, import CSV/Excel e distanziere interno agganciato alla matrice fornitore.'))}</p>
          </div>
        </div>
        <div class="master-data-price-list-metrics">
          <article class="master-data-price-list-metric"><strong>${escapeHtml(String(metrics.total))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierRoadRatesMetricTotal', 'tratte/km collegate'))}</span></article>
          <article class="master-data-price-list-metric"><strong>${escapeHtml(String(metrics.active))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierRoadRatesMetricActive', 'righe attive'))}</span></article>
          <article class="master-data-price-list-metric"><strong>${escapeHtml(String(metrics.withDistance))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierRoadRatesMetricDistance', 'con km valorizzati'))}</span></article>
          <article class="master-data-price-list-metric"><strong>${escapeHtml(String(metrics.withTariff))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierRoadRatesMetricTariff', 'con tariffa valorizzata'))}</span></article>
          <article class="master-data-price-list-metric"><strong>${escapeHtml(String(metrics.imported))}</strong><span>${escapeHtml(t.t('ui.masterDataSupplierRoadRatesMetricImported', 'importate da file'))}</span></article>
        </div>
        <div class="master-data-price-list-layout master-data-road-rates-layout">
          <div class="master-data-price-list-history">${cards}</div>
          <div class="master-data-price-list-editor">
            <div class="master-data-price-list-editor-head">${escapeHtml(draftTitle)}</div>
            <form id="supplierRoadRateForm" class="master-data-form-stack">
              <input type="hidden" name="id" value="${escapeHtml(draft.id || '')}" />
              <input type="hidden" name="supplierId" value="${escapeHtml(draft.supplierId || '')}" />
              <input type="hidden" name="supplierName" value="${escapeHtml(draft.supplierName || '')}" />
              <input type="hidden" name="sourceType" value="${escapeHtml(draft.sourceType || 'manual')}" />
              <div class="form-grid two master-data-price-list-grid">
                <div class="field"><label for="supplierRoadOrigin">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesOrigin', 'Origine'))}</label><input id="supplierRoadOrigin" name="origin" type="text" value="${escapeHtml(draft.origin || '')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierRoadDestination">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesDestination', 'Destinazione'))}</label><input id="supplierRoadDestination" name="destination" type="text" value="${escapeHtml(draft.destination || '')}" autocomplete="off" /></div>
                <div class="field full"><label for="supplierRoadVia">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesVia', 'Via / intermedio'))}</label><input id="supplierRoadVia" name="viaPoint" type="text" value="${escapeHtml(draft.viaPoint || '')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierRoadKm">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesDistanceKm', 'Km'))}</label><input id="supplierRoadKm" name="distanceKm" type="text" value="${escapeHtml(draft.distanceKm || '')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierRoadTariff">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesTariffAmount', 'Tariffa'))}</label><input id="supplierRoadTariff" name="tariffAmount" type="text" value="${escapeHtml(draft.tariffAmount || '')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierRoadCurrency">${escapeHtml(t.t('ui.masterDataSupplierPriceListsCurrency', 'Valuta'))}</label><input id="supplierRoadCurrency" name="currency" type="text" value="${escapeHtml(draft.currency || 'EUR')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierRoadVehicleType">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesVehicleType', 'Tipo mezzo'))}</label><input id="supplierRoadVehicleType" name="vehicleType" type="text" value="${escapeHtml(draft.vehicleType || '')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierRoadServiceType">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesServiceType', 'Servizio'))}</label><input id="supplierRoadServiceType" name="serviceType" type="text" value="${escapeHtml(draft.serviceType || '')}" autocomplete="off" /></div>
                <div class="field"><label for="supplierRoadValidityFrom">${escapeHtml(t.t('ui.masterDataSupplierPriceListsValidityFrom', 'Validità dal'))}</label><input id="supplierRoadValidityFrom" name="validityFrom" type="date" value="${escapeHtml(draft.validityFrom || '')}" /></div>
                <div class="field"><label for="supplierRoadValidityTo">${escapeHtml(t.t('ui.masterDataSupplierPriceListsValidityTo', 'Validità al'))}</label><input id="supplierRoadValidityTo" name="validityTo" type="date" value="${escapeHtml(draft.validityTo || '')}" /></div>
                <div class="field full"><label for="supplierRoadPaymentTerms">${escapeHtml(t.t('ui.masterDataSupplierPriceListsPaymentTerms', 'Pagamento listino'))}</label><input id="supplierRoadPaymentTerms" name="paymentTerms" type="text" value="${escapeHtml(draft.paymentTerms || '')}" autocomplete="off" /></div>
                <div class="field"><label class="checkbox-chip master-data-checkbox"><input name="tollIncluded" type="checkbox" ${draft.tollIncluded === true ? 'checked' : ''} /> ${escapeHtml(t.t('ui.masterDataSupplierRoadRatesTollIncluded', 'Pedaggio incluso'))}</label></div>
                <div class="field"><label class="checkbox-chip master-data-checkbox"><input name="fuelIncluded" type="checkbox" ${draft.fuelIncluded === true ? 'checked' : ''} /> ${escapeHtml(t.t('ui.masterDataSupplierRoadRatesFuelIncluded', 'Fuel incluso'))}</label></div>
                <div class="field full"><label for="supplierRoadNotes">${escapeHtml(t.t('ui.masterDataSupplierPriceListsNotes', 'Note listino'))}</label><textarea id="supplierRoadNotes" name="notes" rows="3">${escapeHtml(draft.notes || '')}</textarea></div>
                <div class="field full"><label class="checkbox-chip master-data-checkbox"><input name="active" type="checkbox" ${draft.active !== false ? 'checked' : ''} /> ${escapeHtml(t.t('ui.masterDataSupplierPriceListsActive', 'Listino attivo'))}</label></div>
              </div>
              <div class="form-actions master-data-actions">
                <button class="btn" type="submit">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesSave', 'Salva tratta'))}</button>
                <button class="btn secondary" id="supplierRoadRateResetButton" type="button">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesReset', 'Nuova tratta'))}</button>
              </div>
            </form>
            <div class="master-data-road-import-block">
              <div class="master-data-price-list-editor-head">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesImportTitle', 'Import CSV / Excel tratte chilometriche'))}</div>
              <p class="master-data-road-import-hint">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesImportHint', 'Header consigliati: origine, destinazione, km, tariffa, tipo mezzo, servizio, validità dal/al. Excel attivo con parser XLSX disponibile in build.'))}</p>
              <label class="btn secondary" for="supplierRoadImportInput">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesImportButton', 'Importa file'))}</label>
              <input id="supplierRoadImportInput" class="visually-hidden" type="file" accept=".csv,.txt,.xlsx,.xls,.xlsm" />
              <div class="master-data-road-import-status ${importStatus.status === 'failed' ? 'error' : ''}">${escapeHtml(importStatusText)}</div>
            </div>
            <div class="master-data-road-counter-block">
              <div class="master-data-price-list-editor-head">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesCounterTitle', 'Distanziere foundation interno'))}</div>
              <p class="master-data-road-import-hint">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesCounterDetail', 'Contatore agganciato alla matrice del vettore: cerca la migliore corrispondenza per origine/destinazione e restituisce km e tariffa disponibili.'))}</p>
              <form id="supplierRoadLookupForm" class="master-data-form-stack">
                <div class="form-grid two master-data-price-list-grid">
                  <div class="field"><label for="supplierRoadLookupOrigin">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesOrigin', 'Origine'))}</label><input id="supplierRoadLookupOrigin" name="origin" type="text" value="${escapeHtml(lookupDraft.origin || '')}" autocomplete="off" /></div>
                  <div class="field"><label for="supplierRoadLookupDestination">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesDestination', 'Destinazione'))}</label><input id="supplierRoadLookupDestination" name="destination" type="text" value="${escapeHtml(lookupDraft.destination || '')}" autocomplete="off" /></div>
                  <div class="field"><label for="supplierRoadLookupVehicleType">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesVehicleType', 'Tipo mezzo'))}</label><input id="supplierRoadLookupVehicleType" name="vehicleType" type="text" value="${escapeHtml(lookupDraft.vehicleType || '')}" autocomplete="off" /></div>
                  <div class="field"><label for="supplierRoadLookupServiceType">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesServiceType', 'Servizio'))}</label><input id="supplierRoadLookupServiceType" name="serviceType" type="text" value="${escapeHtml(lookupDraft.serviceType || '')}" autocomplete="off" /></div>
                </div>
                <div class="form-actions master-data-actions">
                  <button class="btn secondary" type="submit">${escapeHtml(t.t('ui.masterDataSupplierRoadRatesCounterSearch', 'Cerca tratta'))}</button>
                </div>
              </form>
              ${lookupHtml}
            </div>
          </div>
        </div>
      </section>`;
  }


  function renderPanel({ state, module, t }) {
    const defs = getEntityDefinitions(t);
    const moduleState = ensureModuleState(state);
    const quickAddContext = moduleState.quickAddContext;
    const activeEntity = quickAddContext?.entityKey || moduleState.activeEntity || 'client';
    const activeDef = defs[activeEntity] || defs.client;
    const entries = getEntries(state, activeEntity);
    const supplierFilters = ensureSupplierFilters(moduleState);
    const queryFilteredEntries = getFilteredEntries(entries, moduleState.searchQuery, activeEntity);
    const filteredEntries = activeEntity === 'supplier' && !quickAddContext
      ? applySupplierOperationalFilters(queryFilteredEntries, supplierFilters)
      : queryFilteredEntries;
    const formDraft = getFormDraft(state, activeEntity);
    const isEditing = Boolean(formDraft.id);
    const familyOptions = Object.values(defs);
    const MasterDataOverview = getMasterDataOverview();
    const ImportFoundation = getImportFoundation();
    const routeEntityMeta = getRouteEntityMeta(state, defs);
    const overviewHtml = MasterDataOverview && typeof MasterDataOverview.renderSummary === 'function'
      ? MasterDataOverview.renderSummary({ state, activeEntity, i18n: t })
      : `<section class="panel master-data-active-context"><div class="panel-head compact"><div><h3 class="panel-title">${escapeHtml(t.t('ui.masterDataOverviewFallbackTitle', 'Fondazione anagrafiche'))}</h3><p class="panel-subtitle">${escapeHtml(t.t('ui.masterDataOverviewFallbackDetail', 'Panoramica temporaneamente non disponibile: ricarica la schermata per inizializzare il riepilogo anagrafiche.'))}</p></div></div></section>`;
    const importHtml = !quickAddContext && ImportFoundation && typeof ImportFoundation.renderPanel === 'function'
      ? ImportFoundation.renderPanel({ state, activeEntity, i18n: t })
      : '';

    return `
      <section class="hero">
        <div class="hero-meta">${escapeHtml(routeEntityMeta ? 'Master data · ' + routeEntityMeta.familyLabel : 'Master data')}</div>
        <h2>${escapeHtml(routeEntityMeta ? routeEntityMeta.familyLabel : (module?.label || t.t('ui.masterDataTitle', 'Anagrafiche')))}</h2>
        <p>${escapeHtml(routeEntityMeta ? t.t('ui.masterDataSubmoduleIntro', 'Sottomodulo reale di Anagrafiche agganciato alla famiglia operativa già presente nel motore master-data.') : t.t('ui.masterDataIntro', 'Gestisci anagrafiche e directory operative condivise tra pratiche e moduli collegati.'))}</p>
      </section>

      ${overviewHtml}
      ${importHtml}

      <section class="master-data-shell two-col master-data-shell-v2">
        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataCurrentList', 'Elenco corrente'))}</h3>
              <p class="panel-subtitle">${escapeHtml(activeDef.familyLabel)}</p>
            </div>
            <button class="btn secondary" type="button" id="masterDataNewButton">${escapeHtml(t.t('ui.masterDataNewEntry', 'Nuova scheda'))}</button>
          </div>

          ${quickAddContext ? `<div class="master-data-return-banner"><span class="badge info">${escapeHtml(t.t('ui.quickAdd', 'Quick add'))}</span><span>${escapeHtml(activeDef.singleLabel)}</span>${quickAddContext.practiceReference ? `<strong>${escapeHtml(quickAddContext.practiceReference)}</strong>` : ''}</div>` : ''}

          <div class="form-grid two master-data-config-grid">
            <div class="field full">
              <label for="masterDataFamilySelect">${escapeHtml(t.t('ui.masterDataFamilyLabel', 'Famiglia anagrafica'))}</label>
              <select id="masterDataFamilySelect" ${(quickAddContext || routeEntityMeta) ? 'disabled' : ''}>
                ${familyOptions.map((item) => `<option value="${escapeHtml(item.key)}" ${item.key === activeEntity ? 'selected' : ''}>${escapeHtml(item.familyLabel)}</option>`).join('')}
              </select>
            </div>
            <div class="field full">
              <label for="masterDataSearchInput">${escapeHtml(t.t('ui.search', 'Cerca'))}</label>
              <input id="masterDataSearchInput" type="search" value="${escapeHtml(moduleState.searchQuery || '')}" placeholder="${escapeHtml(activeEntity === 'supplier' ? t.t('ui.masterDataSupplierSearchPlaceholder', 'Cerca per fornitore, referente, classificazione, servizio, tratta o pagamento') : t.t('ui.masterDataSearchPlaceholder', 'Cerca per nome, città, P.IVA o codice'))}" autocomplete="off" />
            </div>
          </div>

          ${activeEntity === 'supplier' && !quickAddContext ? renderSupplierFilterToolbar(moduleState, entries, queryFilteredEntries, t) : ''}
          <div class="master-data-list-summary">${escapeHtml(`${filteredEntries.length} / ${entries.length}`)} ${escapeHtml(t.t('ui.masterDataVisibleRecords', 'schede visibili'))}</div>
          ${renderList(entries, filteredEntries, moduleState.selectedRecordId, t, activeEntity)}
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${escapeHtml(isEditing ? t.t('ui.masterDataEditTitle', 'Scheda anagrafica') : t.t('ui.masterDataCreateTitle', 'Nuova anagrafica'))}</h3>
              <p class="panel-subtitle">${escapeHtml(isEditing ? t.t('ui.masterDataEditHint', 'Apri, modifica e salva la scheda selezionata.') : t.t('ui.masterDataCreateHint', 'Compila una nuova scheda completa per questa famiglia anagrafica.'))}</p>
            </div>
          </div>

          ${renderRecordMeta(formDraft, t)}

          <form id="masterDataEntryForm" class="master-data-form-stack">
            ${renderEntryFormFields({ activeDef, formDraft, t })}
            <div class="form-actions master-data-actions">
              <button class="btn" type="submit">${escapeHtml(isEditing ? t.t('ui.masterDataUpdateEntry', 'Salva modifiche') : t.t('ui.masterDataSaveEntry', 'Salva anagrafica'))}</button>
              ${isEditing ? `<button class="btn secondary" id="masterDataResetButton" type="button">${escapeHtml(t.t('ui.masterDataResetForm', 'Nuova scheda'))}</button>` : ''}
              ${quickAddContext ? `<button class="btn secondary" id="masterDataReturnButton" type="button">${escapeHtml(t.t('ui.masterDataBackToPractice', 'Torna alla pratica'))}</button>` : ''}
            </div>
          </form>
        </article>
      </section>

      ${activeEntity === 'supplier' && !quickAddContext ? renderSupplierOperationalPanel(state, formDraft, entries, t) : ''}
      ${activeEntity === 'supplier' && !quickAddContext ? renderSupplierPriceListsPanel(state, formDraft, t) : ''}
      ${activeEntity === 'supplier' && !quickAddContext ? renderSupplierRoadRatesPanel(state, formDraft, t) : ''}
      ${activeDef.structured && !quickAddContext && VatAutofill && typeof VatAutofill.renderConfigPanel === 'function' ? VatAutofill.renderConfigPanel(state, t) : ''}`;
  }

  function bind({ state, root, save, render, navigate, toast, buildCurrentPracticeReference, restorePracticeContext, markPracticeDirty, i18n }) {
    const moduleState = ensureModuleState(state);
    const ImportFoundation = getImportFoundation();
    const familySelect = root.querySelector('#masterDataFamilySelect');
    const searchInput = root.querySelector('#masterDataSearchInput');
    const form = root.querySelector('#masterDataEntryForm');
    const returnButton = root.querySelector('#masterDataReturnButton');
    const resetButton = root.querySelector('#masterDataResetButton');
    const newButton = root.querySelector('#masterDataNewButton');
    const vatLookupButton = root.querySelector('#masterDataVatLookupButton');
    const activeEntity = moduleState.quickAddContext?.entityKey || moduleState.activeEntity || 'client';

    familySelect?.addEventListener('change', (event) => {
      setActiveEntity(state, event.target.value || 'client');
      resetEntityDraft(state, event.target.value || 'client');
      save();
      render();
    });

    searchInput?.addEventListener('input', (event) => {
      moduleState.searchQuery = String(event.target.value || '');
      save();
      render();
    });

    root.querySelectorAll('[data-supplier-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = String(button.dataset.supplierFilter || '').trim();
        if (!key) return;
        const filters = ensureSupplierFilters(moduleState);
        filters[key] = !filters[key];
        save();
        render();
      });
    });

    root.querySelectorAll('[data-supplier-filter-reset]').forEach((button) => {
      button.addEventListener('click', () => {
        moduleState.supplierFilters = buildDefaultSupplierFilters();
        save();
        render();
      });
    });

    root.querySelectorAll('[data-master-record-id]').forEach((button) => {
      button.addEventListener('click', () => {
        openExistingRecord(state, activeEntity, button.dataset.masterRecordId || '');
        save();
        render();
      });
    });

    newButton?.addEventListener('click', () => {
      resetEntityDraft(state, activeEntity);
      save();
      render();
    });

    resetButton?.addEventListener('click', () => {
      resetEntityDraft(state, activeEntity);
      save();
      render();
    });

    returnButton?.addEventListener('click', () => {
      const context = moduleState.quickAddContext;
      if (typeof restorePracticeContext === 'function') {
        restorePracticeContext(context || { returnTab: 'practice' });
      }
      clearQuickAdd(state);
      save();
      navigate(context?.returnRoute || 'practices', { skipScrollTop: true });
    });

    if (VatAutofill && typeof VatAutofill.bindConfigPanel === 'function') {
      VatAutofill.bindConfigPanel({ state, root, save, render, toast, i18n });
    }

    if (ImportFoundation && typeof ImportFoundation.bind === 'function') {
      ImportFoundation.bind({ state, root, save, render, toast, i18n });
    }


    root.querySelectorAll('[data-supplier-price-list-id]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!SupplierPriceLists || typeof SupplierPriceLists.getById !== 'function' || typeof SupplierPriceLists.createDraft !== 'function') return;
        const supplierDraft = getFormDraft(state, activeEntity);
        const supplierRecord = supplierDraft && supplierDraft.id && supplierDraft.value
          ? { id: supplierDraft.id, name: supplierDraft.value, paymentTerms: supplierDraft.paymentTerms }
          : null;
        const selected = SupplierPriceLists.getById(state, button.dataset.supplierPriceListId || '');
        if (!selected || !supplierRecord) return;
        moduleState.supplierPriceListOwnerId = supplierRecord.id;
        moduleState.supplierPriceListDraft = SupplierPriceLists.createDraft(selected, supplierRecord);
        save();
        render();
      });
    });

    const supplierPriceListForm = root.querySelector('#supplierPriceListForm');
    const supplierPriceListResetButton = root.querySelector('#supplierPriceListResetButton');

    supplierPriceListResetButton?.addEventListener('click', () => {
      const supplierDraft = getFormDraft(state, activeEntity);
      const supplierRecord = supplierDraft && supplierDraft.id && supplierDraft.value
        ? { id: supplierDraft.id, name: supplierDraft.value, paymentTerms: supplierDraft.paymentTerms }
        : null;
      resetSupplierPriceListDraft(state, supplierRecord);
      save();
      render();
    });

    supplierPriceListForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!SupplierPriceLists || typeof SupplierPriceLists.savePriceList !== 'function') return;
      const supplierDraft = getFormDraft(state, activeEntity);
      const supplierRecord = supplierDraft && supplierDraft.id && supplierDraft.value
        ? { id: supplierDraft.id, name: supplierDraft.value, paymentTerms: supplierDraft.paymentTerms }
        : null;
      if (!supplierRecord) {
        toast(i18n.t('ui.masterDataSupplierPriceListsSaveSupplierFirst', 'Salva prima la scheda fornitore: lo storico listini viene agganciato a un fornitore strutturato reale.'), 'warning');
        return;
      }
      const draft = ensureSupplierPriceListDraft(moduleState, supplierRecord);
      syncSupplierPriceListDraftFromForm(supplierPriceListForm, draft);
      const result = SupplierPriceLists.savePriceList(state, draft);
      if (!result.ok) {
        toast(i18n.t('ui.masterDataSupplierPriceListsMissingValue', 'Compila almeno servizio / voce costo e fornitore collegato.'), 'warning');
        return;
      }
      resetSupplierPriceListDraft(state, supplierRecord);
      save();
      render();
      toast(
        result.updated
          ? i18n.t('ui.masterDataSupplierPriceListsUpdated', 'Listino fornitore aggiornato correttamente.')
          : i18n.t('ui.masterDataSupplierPriceListsSaved', 'Listino fornitore salvato correttamente.'),
        'success'
      );
    });

    root.querySelectorAll('[data-supplier-road-rate-id]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!SupplierRoadRates || typeof SupplierRoadRates.getById !== 'function' || typeof SupplierRoadRates.createDraft !== 'function') return;
        const supplierDraft = getFormDraft(state, activeEntity);
        const supplierRecord = supplierDraft && supplierDraft.id && supplierDraft.value
          ? { id: supplierDraft.id, name: supplierDraft.value, paymentTerms: supplierDraft.paymentTerms }
          : null;
        const selected = SupplierRoadRates.getById(state, button.dataset.supplierRoadRateId || '');
        if (!selected || !supplierRecord) return;
        moduleState.supplierRoadRateOwnerId = supplierRecord.id;
        moduleState.supplierRoadRateDraft = SupplierRoadRates.createDraft(selected, supplierRecord);
        save();
        render();
      });
    });

    const supplierRoadRateForm = root.querySelector('#supplierRoadRateForm');
    const supplierRoadRateResetButton = root.querySelector('#supplierRoadRateResetButton');
    const supplierRoadImportInput = root.querySelector('#supplierRoadImportInput');
    const supplierRoadLookupForm = root.querySelector('#supplierRoadLookupForm');

    supplierRoadRateResetButton?.addEventListener('click', () => {
      const supplierDraft = getFormDraft(state, activeEntity);
      const supplierRecord = supplierDraft && supplierDraft.id && supplierDraft.value
        ? { id: supplierDraft.id, name: supplierDraft.value, paymentTerms: supplierDraft.paymentTerms }
        : null;
      resetSupplierRoadRateDraft(state, supplierRecord);
      save();
      render();
    });

    supplierRoadRateForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!SupplierRoadRates || typeof SupplierRoadRates.saveRoadRate !== 'function') return;
      const supplierDraft = getFormDraft(state, activeEntity);
      const supplierRecord = supplierDraft && supplierDraft.id && supplierDraft.value
        ? { id: supplierDraft.id, name: supplierDraft.value, paymentTerms: supplierDraft.paymentTerms }
        : null;
      if (!supplierRecord) {
        toast(i18n.t('ui.masterDataSupplierPriceListsSaveSupplierFirst', 'Salva prima la scheda fornitore: lo storico listini viene agganciato a un fornitore strutturato reale.'), 'warning');
        return;
      }
      const draft = ensureSupplierRoadRateDraft(moduleState, supplierRecord);
      syncSupplierRoadRateDraftFromForm(supplierRoadRateForm, draft);
      const result = SupplierRoadRates.saveRoadRate(state, draft);
      if (!result.ok) {
        toast(i18n.t('ui.masterDataSupplierRoadRatesMissingValue', 'Compila almeno origine, destinazione e vettore collegato.'), 'warning');
        return;
      }
      resetSupplierRoadRateDraft(state, supplierRecord);
      save();
      render();
      toast(
        result.updated
          ? i18n.t('ui.masterDataSupplierRoadRatesUpdated', 'Tratta chilometrica aggiornata correttamente.')
          : i18n.t('ui.masterDataSupplierRoadRatesSaved', 'Tratta chilometrica salvata correttamente.'),
        'success'
      );
    });

    supplierRoadImportInput?.addEventListener('change', async (event) => {
      const file = event.target && event.target.files ? event.target.files[0] : null;
      if (!file) return;
      const supplierDraft = getFormDraft(state, activeEntity);
      const supplierRecord = supplierDraft && supplierDraft.id && supplierDraft.value
        ? { id: supplierDraft.id, name: supplierDraft.value, paymentTerms: supplierDraft.paymentTerms }
        : null;
      if (!supplierRecord) {
        toast(i18n.t('ui.masterDataSupplierPriceListsSaveSupplierFirst', 'Salva prima la scheda fornitore: lo storico listini viene agganciato a un fornitore strutturato reale.'), 'warning');
        event.target.value = '';
        return;
      }
      const extension = String(file.name || '').split('.').pop().toLowerCase();
      let parsed = { ok: false };
      if (['csv', 'txt'].includes(extension)) {
        parsed = CsvReader && typeof CsvReader.readCsvFile === 'function' ? await CsvReader.readCsvFile(file) : { ok: false, reason: 'csv-engine-missing' };
      } else if (['xlsx', 'xls', 'xlsm'].includes(extension)) {
        parsed = ExcelReader && typeof ExcelReader.readWorkbook === 'function' ? await ExcelReader.readWorkbook(file) : { ok: false, reason: 'excel-engine-missing' };
      } else {
        parsed = { ok: false, reason: 'unsupported-format' };
      }
      if (!parsed.ok || !Array.isArray(parsed.matrix)) {
        moduleState.supplierRoadImportStatus = {
          status: 'failed',
          imported: 0,
          updated: 0,
          skipped: 0,
          fileName: file.name || '',
          batchId: '',
          message: parsed.reason === 'missing-columns'
            ? i18n.t('ui.masterDataSupplierRoadRatesImportMissingColumns', 'Colonne minime mancanti: servono almeno origine e destinazione.')
            : (parsed.messageFallback || i18n.t('ui.masterDataSupplierRoadRatesImportError', 'Import tratte non riuscito.'))
        };
        save();
        render();
        toast(moduleState.supplierRoadImportStatus.message, 'warning');
        event.target.value = '';
        return;
      }
      const imported = SupplierRoadRates && typeof SupplierRoadRates.importRoadRates === 'function'
        ? SupplierRoadRates.importRoadRates(state, supplierRecord, parsed.matrix, { sourceFormat: parsed.sourceFormat || extension, fileName: file.name || '' })
        : { ok: false, reason: 'importer-missing' };
      if (!imported.ok) {
        moduleState.supplierRoadImportStatus = {
          status: 'failed',
          imported: 0,
          updated: 0,
          skipped: 0,
          fileName: file.name || '',
          batchId: '',
          message: imported.reason === 'missing-columns'
            ? i18n.t('ui.masterDataSupplierRoadRatesImportMissingColumns', 'Colonne minime mancanti: servono almeno origine e destinazione.')
            : i18n.t('ui.masterDataSupplierRoadRatesImportError', 'Import tratte non riuscito.')
        };
        save();
        render();
        toast(moduleState.supplierRoadImportStatus.message, 'warning');
        event.target.value = '';
        return;
      }
      moduleState.supplierRoadImportStatus = {
        status: 'done',
        imported: imported.imported || 0,
        updated: imported.updated || 0,
        skipped: imported.skipped || 0,
        fileName: file.name || '',
        batchId: imported.batchId || '',
        message: ''
      };
      save();
      render();
      toast(i18n.t('ui.masterDataSupplierRoadRatesImportSuccess', 'Import tratte completato.'), 'success');
      event.target.value = '';
    });

    supplierRoadLookupForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const supplierDraft = getFormDraft(state, activeEntity);
      const supplierRecord = supplierDraft && supplierDraft.id && supplierDraft.value
        ? { id: supplierDraft.id, name: supplierDraft.value, paymentTerms: supplierDraft.paymentTerms }
        : null;
      const lookupDraft = moduleState.supplierRoadLookupDraft || buildDefaultRoadLookupDraft();
      const formData = new FormData(supplierRoadLookupForm);
      lookupDraft.origin = String(formData.get('origin') || '').trim();
      lookupDraft.destination = String(formData.get('destination') || '').trim();
      lookupDraft.vehicleType = String(formData.get('vehicleType') || '').trim();
      lookupDraft.serviceType = String(formData.get('serviceType') || '').trim();
      moduleState.supplierRoadLookupResult = SupplierRoadRates && typeof SupplierRoadRates.matchRoute === 'function' && supplierRecord
        ? SupplierRoadRates.matchRoute(state, supplierRecord, lookupDraft)
        : { ok: false, reason: 'no-match' };
      save();
      render();
    });



    const supplierReactivePanelFields = new Set(['supplierType', 'serviceScope', 'roadPricingMode', 'roadDistanceSource', 'truckProfiles', 'paymentTerms', 'value']);

    form?.addEventListener('change', (event) => {
      if (activeEntity !== 'supplier') return;
      const target = event.target;
      if (!target || !target.name || !supplierReactivePanelFields.has(String(target.name || '').trim())) return;
      const currentDraft = getFormDraft(state, activeEntity);
      syncDraftFromForm(form, currentDraft);
      save();
      render();
    });

    vatLookupButton?.addEventListener('click', async () => {
      const targetEntity = moduleState.quickAddContext?.entityKey || activeEntity;
      const currentDraft = getFormDraft(state, targetEntity);
      syncDraftFromForm(form, currentDraft);
      vatLookupButton.disabled = true;
      vatLookupButton.classList.add('is-loading');
      const result = VatAutofill && typeof VatAutofill.lookupByVatNumber === 'function'
        ? await VatAutofill.lookupByVatNumber({ state, entityKey: targetEntity, vatNumber: currentDraft.vatNumber || '' })
        : { ok: false, lookupStatus: 'lookup-error' };

      if (result && result.ok && result.found && VatAutofill && typeof VatAutofill.applyLookupToDraft === 'function') {
        const config = VatAutofill.ensureConfig(state);
        VatAutofill.applyLookupToDraft(currentDraft, result, config);
      } else if (VatAutofill && typeof VatAutofill.setDraftLookupMeta === 'function') {
        VatAutofill.setDraftLookupMeta(currentDraft, {
          vatLookupStatus: result.lookupStatus || 'lookup-error',
          vatLookupSource: result.source || '',
          vatLookupAt: new Date().toISOString(),
          vatLookupVat: result.normalizedVat ? result.normalizedVat.formatted : String(currentDraft.vatNumber || '').trim()
        });
      }

      save();
      render();
      toast(
        VatAutofill && typeof VatAutofill.messageForLookupResult === 'function' ? VatAutofill.messageForLookupResult(result, i18n) : i18n.t('ui.masterDataVatLookupError', 'Recupero dati non riuscito.'),
        VatAutofill && typeof VatAutofill.toneForLookupResult === 'function' ? VatAutofill.toneForLookupResult(result) : 'warning'
      );
    });

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const targetEntity = moduleState.quickAddContext?.entityKey || activeEntity;
      const currentDraft = getFormDraft(state, targetEntity);
      syncDraftFromForm(form, currentDraft);

      const defs = getEntityDefinitions(i18n);
      const def = defs[targetEntity];
      const payload = { ...currentDraft };
      const result = def && def.structured && MasterDataEntities && typeof MasterDataEntities.saveBusinessEntity === 'function'
        ? MasterDataEntities.saveBusinessEntity(state, targetEntity, payload, i18n)
        : (MasterDataEntities && typeof MasterDataEntities.saveDirectoryEntity === 'function'
          ? MasterDataEntities.saveDirectoryEntity(state, targetEntity, payload, i18n)
          : { ok: false, reason: 'invalid-entity' });

      if (!result.ok) {
        toast(i18n.t('ui.masterDataMissingValue', 'Compila il valore da inserire.'), 'warning');
        return;
      }

      const context = moduleState.quickAddContext;
      if (context) {
        applyEntryToDraft(state, context, result);
        if (typeof markPracticeDirty === 'function') markPracticeDirty(true);
        if (context.entityKey === 'client' && typeof buildCurrentPracticeReference === 'function' && state.draftPractice) {
          state.draftPractice.generatedReference = buildCurrentPracticeReference();
        }
        if (typeof restorePracticeContext === 'function') {
          restorePracticeContext(context);
        }
        clearQuickAdd(state);
        moduleState.selectedRecordId = result.relatedId || '';
        moduleState.formDrafts[targetEntity] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
          ? MasterDataEntities.createFormDraft(targetEntity, result.record || null)
          : { id: '', value: '', description: '', city: '' };
        save();
        navigate(context.returnRoute || 'practices', { skipScrollTop: true });
        toast(
          result.updated
            ? i18n.t('ui.masterDataQuickAddUpdated', 'Anagrafica aggiornata e riportata nella pratica.')
            : (result.created
              ? i18n.t('ui.masterDataQuickAddSaved', 'Anagrafica salvata e riportata nella pratica.')
              : i18n.t('ui.masterDataQuickAddSelected', 'Valore già presente: selezionato nella pratica.')),
          result.updated || result.created ? 'success' : 'info'
        );
        return;
      }

      moduleState.selectedRecordId = result.relatedId || '';
      moduleState.formDrafts[targetEntity] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
        ? MasterDataEntities.createFormDraft(targetEntity, result.record || null)
        : { id: '', value: '', description: '', city: '' };

      save();
      render();
      toast(
        result.updated
          ? i18n.t('ui.masterDataUpdated', 'Anagrafica aggiornata correttamente.')
          : (result.created
            ? i18n.t('ui.masterDataSaved', 'Anagrafica salvata correttamente.')
            : i18n.t('ui.masterDataAlreadyPresent', 'Valore già presente in anagrafica.')),
        result.updated || result.created ? 'success' : 'info'
      );
    });
  }


  function openLinkedRecordFromPractice(state, context = {}) {
    const normalizedFieldName = normalizePracticeFieldName(context.fieldName);
    const entityKey = context.entityKey || resolveEntityKeyForField(normalizedFieldName);
    if (!entityKey || !MasterDataEntities || typeof MasterDataEntities.getLinkedRecordFromDraft !== 'function') return null;
    const draft = state && state.draftPractice ? state.draftPractice : null;
    const linkedRecord = MasterDataEntities.getLinkedRecordFromDraft({ state, draft, fieldName: normalizedFieldName });
    if (!linkedRecord || !linkedRecord.id) return null;
    const moduleState = ensureModuleState(state);
    moduleState.activeEntity = entityKey;
    moduleState.searchQuery = '';
    moduleState.selectedRecordId = String(linkedRecord.id || '').trim();
    moduleState.formDrafts[entityKey] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
      ? MasterDataEntities.createFormDraft(entityKey, linkedRecord)
      : { id: '', value: '', description: '', city: '' };
    moduleState.quickAddContext = {
      entityKey,
      fieldName: normalizedFieldName,
      returnRoute: String(context.returnRoute || 'practices').trim() || 'practices',
      returnTab: String(context.returnTab || 'practice').trim() || 'practice',
      returnSessionId: String(context.returnSessionId || '').trim(),
      returnFocusField: normalizePracticeFieldName(context.returnFocusField || normalizedFieldName || ''),
      returnFocusTab: String(context.returnFocusTab || context.returnTab || 'practice').trim() || 'practice',
      practiceReference: String(context.practiceReference || '').trim()
    };
    return moduleState.quickAddContext;
  }

  return {
    ensureModuleState,
    resolveEntityKeyForField,
    supportsQuickAdd,
    buildQuickAddButton,
    buildOpenLinkedButton,
    prepareQuickAdd,
    openLinkedRecordFromPractice,
    clearQuickAdd,
    renderPanel,
    bind
  };
})();
