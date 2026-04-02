(() => {
  'use strict';

  const Storage = window.KedrixOneStorage;
  const Data = window.KedrixOneData;
  const Utils = window.KedrixOneUtils;
  const Modules = window.KedrixOneModules;
  const Licensing = window.KedrixOneLicensing;
  const Templates = window.KedrixOneTemplates;
  const I18N = window.KedrixOneI18N;
  const PracticeSchemas = window.KedrixOnePracticeSchemas;
  const SearchIndex = window.KedrixOneSearchIndex;
  const PracticeVerification = window.KedrixOnePracticeVerification;
  const PracticeDraftValidator = window.KedrixOnePracticeDraftValidator;
  const PracticeFormRenderer = window.KedrixOnePracticeFormRenderer;
  const PracticeOpenEdit = window.KedrixOnePracticeOpenEdit;
  const PracticeIdentity = window.KedrixOnePracticeIdentity;
  const PracticePersistence = window.KedrixOnePracticePersistence;
  const PracticeSavePipeline = window.KedrixOnePracticeSavePipeline;
  const PracticeDuplicate = window.KedrixOnePracticeDuplicate;
  const PracticeSearchUI = window.KedrixOnePracticeSearchUI;
  const SeaSchemaCleanup = window.KedrixOneSeaSchemaCleanup;
  const ReferenceNormalizer = window.KedrixOnePracticeReferenceNormalizer;

  const state = Storage.load(() => Data.initialState());

  sanitizeLegacyPortSuggestions();

  const main = document.getElementById('mainContent');
  const title = document.getElementById('pageTitle');
  const toastRegion = document.getElementById('toastRegion');
  const sidebarNav = document.getElementById('sidebarNav');
  const brandCompany = document.getElementById('brandCompany');
  const brandProduct = document.getElementById('brandProduct');
  const brandSubtitle = document.getElementById('brandSubtitle');
  const pageEyebrow = document.getElementById('pageEyebrow');
  const saveBackupButton = document.getElementById('saveBackupButton');
  const newPracticeButton = document.getElementById('newPracticeButton');

  let runtimePracticeSearchIndex = PracticeSearchUI && typeof PracticeSearchUI.buildIndex === 'function'
    ? PracticeSearchUI.buildIndex(state.practices)
    : (SearchIndex && typeof SearchIndex.buildIndex === 'function' ? SearchIndex.buildIndex(state.practices) : []);

  function save() {
    Storage.save(state);
  }

  function resolveOptionText(source, fallback = '') {
    return PracticeFormRenderer && typeof PracticeFormRenderer.resolveOptionText === 'function'
      ? PracticeFormRenderer.resolveOptionText(source, fallback)
      : String(fallback || '').trim();
  }

  function sanitizeOptionEntryForRender(entry) {
    return PracticeFormRenderer && typeof PracticeFormRenderer.sanitizeOptionEntryForRender === 'function'
      ? PracticeFormRenderer.sanitizeOptionEntryForRender(entry)
      : null;
  }

  function sanitizeLegacyPortSuggestions() {
    if (!PracticeSchemas || typeof PracticeSchemas.getFieldOptionEntries !== 'function') return;
    const directories = state.companyConfig?.practiceConfig?.directories;
    if (!directories) return;
    const normalized = PracticeSchemas.getFieldOptionEntries('sea_import', { suggestionKey: 'seaPortLocodes' }, state.companyConfig)
      .map((entry) => sanitizeOptionEntryForRender(entry))
      .filter(Boolean);
    if (!normalized.length) return;
    const current = Array.isArray(directories.seaPortLocodes) ? directories.seaPortLocodes : [];
    const currentSerialized = JSON.stringify(current);
    const normalizedSerialized = JSON.stringify(normalized);
    if (currentSerialized === normalizedSerialized) return;
    directories.seaPortLocodes = normalized;
    save();
  }

  function toast(text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    toastRegion.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  function updateStaticLabels() {
    document.documentElement.lang = I18N.getLanguage();
    document.title = I18N.t('brand.product', 'Kedrix One');
    if (brandCompany) brandCompany.textContent = I18N.t('brand.company', 'Kedrix');
    if (brandProduct) brandProduct.textContent = I18N.t('brand.product', 'Kedrix One');
    if (brandSubtitle) brandSubtitle.textContent = I18N.t('brand.subtitle', 'Operational Workspace');
    if (pageEyebrow) pageEyebrow.textContent = I18N.t('brand.eyebrow', 'Kedrix One');
    if (saveBackupButton) saveBackupButton.textContent = I18N.t('ui.saveBackup', 'Salva backup locale');
    if (newPracticeButton) newPracticeButton.textContent = I18N.t('ui.newPractice', 'Nuova pratica');
  }

  function filteredPractices() {
    const query = Utils.normalize(state.filterText);
    return state.practices.filter((practice) => {
      const okStatus = state.statusFilter === 'Tutti' || practice.status === state.statusFilter;
      const dynamicData = extractPracticeDynamicData(practice);
      const searchableValues = [
        practice.reference,
        practice.client,
        practice.clientName,
        practice.port,
        practice.id,
        practice.practiceType,
        practice.containerCode,
        practice.booking,
        practice.customsOffice,
        practice.goodsDescription,
        practice.terminal,
        practice.policyNumber,
        practice.mbl,
        practice.hbl,
        practice.mawb,
        practice.hawb,
        practice.cmr,
        practice.carrier,
        practice.airline,
        practice.deposit,
        ...Object.values(dynamicData || {})
      ];
      const okQuery = !query || searchableValues.some((value) => {
        if (Array.isArray(value)) return value.some((item) => Utils.normalize(item).includes(query));
        return Utils.normalize(value).includes(query);
      });
      return okStatus && okQuery;
    });
  }

  function selectedPractice() {
    return state.practices.find((practice) => practice.id === state.selectedPracticeId) || null;
  }

  function rebuildPracticeSearchIndex() {
    if (PracticeSearchUI && typeof PracticeSearchUI.rebuildIndex === 'function') {
      runtimePracticeSearchIndex = PracticeSearchUI.rebuildIndex(state.practices, runtimePracticeSearchIndex);
      return runtimePracticeSearchIndex;
    }
    if (!SearchIndex || typeof SearchIndex.updateIndex !== 'function') return [];
    runtimePracticeSearchIndex = SearchIndex.updateIndex(state.practices, runtimePracticeSearchIndex);
    return runtimePracticeSearchIndex;
  }

  function practiceSearchResults() {
    if (PracticeSearchUI && typeof PracticeSearchUI.searchResults === 'function') {
      return PracticeSearchUI.searchResults(state.practiceSearchQuery, state.practices, runtimePracticeSearchIndex, (nextIndex) => {
        runtimePracticeSearchIndex = nextIndex;
      });
    }
    const query = String(state.practiceSearchQuery || '').trim();
    if (!query || !SearchIndex || typeof SearchIndex.search !== 'function') return [];
    return SearchIndex.search(query, rebuildPracticeSearchIndex());
  }

  function getClientById(clientId) {
    return (state.clients || []).find((client) => client.id === clientId) || null;
  }

  function getPracticeSchemaFields(type) {
    return PracticeSchemas && typeof PracticeSchemas.getFields === 'function'
      ? PracticeSchemas.getFields(type)
      : [];
  }

  function buildDynamicLabelsForType(type) {
    const labels = {};
    getPracticeSchemaFields(type).forEach((field) => {
      if (!field || field.type === 'derived' || field.type === 'select-derived') return;
      labels[field.name] = I18N.t(field.labelKey, field.name);
    });
    return labels;
  }

  function extractPracticeDynamicData(practice) {
    const base = practice && practice.dynamicData && typeof practice.dynamicData === 'object'
      ? { ...practice.dynamicData }
      : {};
    const fields = getPracticeSchemaFields(practice?.practiceType || '');
    fields.forEach((field) => {
      if (!field || field.type === 'derived' || field.type === 'select-derived') return;
      if (base[field.name] !== undefined && base[field.name] !== null && String(base[field.name]).trim() !== '') return;
      const topLevelValue = practice?.[field.name];
      if (Array.isArray(topLevelValue) ? topLevelValue.length : String(topLevelValue || '').trim()) {
        base[field.name] = Array.isArray(topLevelValue) ? [...topLevelValue] : topLevelValue;
      }
    });

    if (SeaSchemaCleanup && typeof SeaSchemaCleanup.isSeaPracticeType === 'function' && SeaSchemaCleanup.isSeaPracticeType(practice?.practiceType || '')) {
      if (!String(base.policyNumber || '').trim() && String(practice?.policyNumber || practice?.mbl || '').trim()) {
        base.policyNumber = practice.policyNumber || practice.mbl || '';
      }
      if (String(practice?.customsSection || '').trim() || String(practice?.customsOffice || '').trim()) {
        base.customsOffice = SeaSchemaCleanup.mergeCustomsOffice(base.customsOffice || practice?.customsOffice || '', practice?.customsSection || '');
      }
      return SeaSchemaCleanup.normalizeDynamicData(base, practice?.practiceType || '');
    }

    return base;
  }


  function normalizeSuggestedField(practiceType, fieldName, rawValue) {
    if (ReferenceNormalizer && typeof ReferenceNormalizer.normalizeFieldValue === 'function') {
      return ReferenceNormalizer.normalizeFieldValue(practiceType, fieldName, rawValue, state.companyConfig);
    }
    if (!rawValue || !PracticeSchemas || typeof PracticeSchemas.getField !== 'function' || typeof PracticeSchemas.normalizeSuggestedValue !== 'function') {
      return rawValue || '';
    }
    const field = PracticeSchemas.getField(practiceType, fieldName);
    return PracticeSchemas.normalizeSuggestedValue(practiceType, field, rawValue, state.companyConfig);
  }

  function normalizeSeaPortField(practiceType, fieldName, rawValue) {
    return normalizeSuggestedField(practiceType, fieldName, rawValue);
  }

  function normalizePracticeRecordsState() {
    let changed = false;
    state.practices = (state.practices || []).map((practice) => {
      const dynamicData = ReferenceNormalizer && typeof ReferenceNormalizer.normalizeDynamicData === 'function'
        ? ReferenceNormalizer.normalizeDynamicData(practice.practiceType, extractPracticeDynamicData(practice), state.companyConfig)
        : extractPracticeDynamicData(practice);
      const dynamicLabels = {
        ...buildDynamicLabelsForType(practice.practiceType),
        ...(practice.dynamicLabels || {})
      };

      const normalizedPortLoading = String(practice.practiceType || '').startsWith('sea_')
        ? normalizeSeaPortField(practice.practiceType, 'portLoading', dynamicData.portLoading || practice.portLoading || '')
        : (practice.portLoading || dynamicData.portLoading || dynamicData.airportDeparture || '');
      const normalizedPortDischarge = String(practice.practiceType || '').startsWith('sea_')
        ? normalizeSeaPortField(practice.practiceType, 'portDischarge', dynamicData.portDischarge || practice.portDischarge || '')
        : (practice.portDischarge || dynamicData.portDischarge || dynamicData.airportDestination || '');
      const normalizedCustomsOffice = normalizeSuggestedField(practice.practiceType, 'customsOffice', dynamicData.customsOffice || practice.customsOffice || '');

      if (normalizedPortLoading && String(practice.practiceType || '').startsWith('sea_')) dynamicData.portLoading = normalizedPortLoading;
      if (normalizedPortDischarge && String(practice.practiceType || '').startsWith('sea_')) dynamicData.portDischarge = normalizedPortDischarge;
      if (normalizedCustomsOffice) dynamicData.customsOffice = normalizedCustomsOffice;

      const next = {
        ...practice,
        dynamicData,
        dynamicLabels,
        portLoading: normalizedPortLoading,
        portDischarge: normalizedPortDischarge,
        port: normalizedPortDischarge || practice.port || '',
        terminal: practice.terminal || dynamicData.terminal || dynamicData.terminalPickup || dynamicData.terminalDelivery || '',
        terminalPickup: practice.terminalPickup || dynamicData.terminalPickup || '',
        terminalDelivery: practice.terminalDelivery || dynamicData.terminalDelivery || '',
        mbl: dynamicData.policyNumber || practice.policyNumber || practice.mbl || '',
        hbl: practice.hbl || dynamicData.hbl || '',
        mawb: practice.mawb || dynamicData.mawb || '',
        hawb: practice.hawb || dynamicData.hawb || '',
        cmr: practice.cmr || dynamicData.cmr || '',
        carrier: practice.carrier || dynamicData.carrier || '',
        transporter: practice.transporter || dynamicData.transporter || '',
        airline: practice.airline || dynamicData.airline || '',
        deposit: practice.deposit || dynamicData.deposit || '',
        customsOffice: normalizedCustomsOffice || practice.customsOffice || dynamicData.customsOffice || '',
        customsSection: '',
        baseQuotation: practice.baseQuotation || dynamicData.baseQuotation || '',
        policyNumber: dynamicData.policyNumber || practice.policyNumber || practice.mbl || '',
        deliveryCity: practice.deliveryCity || dynamicData.deliveryCity || '',
        additionalReference: practice.additionalReference || dynamicData.additionalReference || '',
        bolla: practice.bolla || dynamicData.bolla || ''
      };

      if (JSON.stringify(next) !== JSON.stringify(practice)) changed = true;
      return next;
    });
    return changed;
  }

  function getDraftVerificationKeys(draft = ensureDraftPractice()) {
    return PracticeVerification && typeof PracticeVerification.collectKeys === 'function'
      ? PracticeVerification.collectKeys(draft)
      : [];
  }

  function updateVerificationBannerState(draft = ensureDraftPractice()) {
    if (PracticeVerification && typeof PracticeVerification.updateBanner === 'function') {
      PracticeVerification.updateBanner(draft, { bannerId: 'practiceVerificationBanner', titleId: 'practiceVerificationBannerTitle' });
    }
  }

  function openPracticeForEditing(practiceId, options = {}) {
    if (PracticeOpenEdit && typeof PracticeOpenEdit.openForEditing === 'function') {
      PracticeOpenEdit.openForEditing(practiceId, {
        source: options.source || 'manual',
        state,
        main,
        save,
        render,
        loadPracticeIntoDraft
      });
      return;
    }
    if (!practiceId) return;
    loadPracticeIntoDraft(practiceId);
    state._practiceValidationErrors = [];
    state.practiceSearchPreviewId = options.source === 'search' ? practiceId : '';
    state.practiceOpenSource = options.source || 'manual';
    save();
    render();
  }

  function focusPracticeEditor(source = 'manual', practiceId = '') {
    if (PracticeOpenEdit && typeof PracticeOpenEdit.focusEditor === 'function') {
      PracticeOpenEdit.focusEditor({ main, source, practiceId });
    }
  }

  function duplicatePracticeDraft(practiceId = '') {
    const sourcePracticeId = practiceId || ensureDraftPractice().editingPracticeId || state.selectedPracticeId || '';
    if (!sourcePracticeId) {
      toast(I18N.t('ui.duplicateUnavailable', 'Apri prima una pratica esistente da duplicare.'));
      return { ok: false, reason: 'missing-practice-id' };
    }

    if (PracticeDuplicate && typeof PracticeDuplicate.duplicatePracticeToDraft === 'function') {
      return PracticeDuplicate.duplicatePracticeToDraft(sourcePracticeId, {
        state,
        i18n: I18N,
        buildCurrentPracticeReference,
        createDuplicateSafeDraft: PracticeIdentity && typeof PracticeIdentity.createDuplicateSafeDraft === 'function'
          ? PracticeIdentity.createDuplicateSafeDraft
          : (PracticeSavePipeline && typeof PracticeSavePipeline.createDuplicateSafeDraft === 'function'
            ? PracticeSavePipeline.createDuplicateSafeDraft
            : null),
        extractPracticeDynamicData,
        save,
        render,
        toast,
        focusPracticeEditor
      });
    }

    toast(I18N.t('ui.duplicateUnavailable', 'Apri prima una pratica esistente da duplicare.'));
    return { ok: false, reason: 'duplicate-module-unavailable' };
  }

  function practiceTypeLabel(value) {
    const map = {
      sea_import: I18N.t('ui.typeSeaImport', 'Mare Import'),
      sea_export: I18N.t('ui.typeSeaExport', 'Mare Export'),
      air_import: I18N.t('ui.typeAirImport', 'Aerea Import'),
      air_export: I18N.t('ui.typeAirExport', 'Aerea Export'),
      road_import: I18N.t('ui.typeRoadImport', 'Terra Import'),
      road_export: I18N.t('ui.typeRoadExport', 'Terra Export'),
      warehouse: I18N.t('ui.typeWarehouse', 'Magazzino')
    };
    return map[value] || value || '—';
  }

  function getPracticeSchema(type) {
    return PracticeSchemas.getSchema(type);
  }

  function getPracticeCategoryOptions(type) {
    return PracticeSchemas.getCategoryOptions(type, state.companyConfig);
  }

  function validatePracticeDraft(draft) {
    return PracticeDraftValidator && typeof PracticeDraftValidator.validateDraft === 'function'
      ? PracticeDraftValidator.validateDraft(draft, state.companyConfig)
      : PracticeSchemas.validateDraft(draft, state.companyConfig);
  }

  function renderDynamicFieldsHTML(type, tab, draft = ensureDraftPractice()) {
    return PracticeFormRenderer && typeof PracticeFormRenderer.renderDynamicFieldsHTML === 'function'
      ? PracticeFormRenderer.renderDynamicFieldsHTML(type, tab, draft, state.companyConfig)
      : `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.noDataYet', 'Nessun dato'))}</div>`;
  }

  function ensureDraftPractice() {
    return PracticeIdentity && typeof PracticeIdentity.ensureDraft === 'function'
      ? PracticeIdentity.ensureDraft(state)
      : (state.draftPractice || (state.draftPractice = {
        editingPracticeId: '',
        practiceType: '',
        clientId: '',
        clientName: '',
        practiceDate: new Date().toISOString().slice(0, 10),
        category: '',
        status: 'In attesa documenti',
        generatedReference: '',
        dynamicData: {}
      }));
  }

  function resetPracticeDraft() {
    if (PracticeIdentity && typeof PracticeIdentity.resetDraft === 'function') {
      PracticeIdentity.resetDraft(state);
      return;
    }
    state.draftPractice = {
      editingPracticeId: '',
      practiceType: '',
      clientId: '',
      clientName: '',
      practiceDate: new Date().toISOString().slice(0, 10),
      category: '',
      status: 'In attesa documenti',
      generatedReference: '',
      dynamicData: {}
    };
    state.practiceTab = 'practice';
    state._practiceValidationErrors = [];
    state.practiceSearchPreviewId = '';
    state.practiceOpenSource = '';
    state.practiceDuplicateSource = null;
    state.selectedPracticeId = '';
  }

  function syncClientMatch(clientName) {
    if (PracticeIdentity && typeof PracticeIdentity.syncClientMatch === 'function') {
      return PracticeIdentity.syncClientMatch(state, clientName);
    }
    const clean = String(clientName || '').trim().toUpperCase();
    const match = (state.clients || []).find((client) => String(client.name || '').trim().toUpperCase() === clean) || null;
    const draft = ensureDraftPractice();
    draft.clientId = match ? match.id : '';
    draft.clientName = clientName;
    return match;
  }

  function buildCurrentPracticeReference() {
    if (PracticeIdentity && typeof PracticeIdentity.buildCurrentPracticeReference === 'function') {
      return PracticeIdentity.buildCurrentPracticeReference(state, {
        getClientById,
        buildPracticeReference: Utils.buildPracticeReference,
        buildFallbackPracticeReference: Utils.buildFallbackPracticeReference
      });
    }
    const draft = ensureDraftPractice();
    const matchedClient = getClientById(draft.clientId);
    if (matchedClient) return Utils.buildPracticeReference(matchedClient.numberingRule, draft.practiceDate);
    return Utils.buildFallbackPracticeReference(draft.clientName || 'PR', state.practices, draft.practiceDate);
  }

  function loadPracticeIntoDraft(practiceId) {
    if (PracticeIdentity && typeof PracticeIdentity.loadPracticeIntoDraft === 'function') {
      PracticeIdentity.loadPracticeIntoDraft(state, practiceId, { extractPracticeDynamicData });
      return;
    }
    const practice = state.practices.find((item) => item.id === practiceId);
    if (!practice) return;
    state.selectedPracticeId = practice.id;
    state.practiceTab = 'practice';
    state._practiceValidationErrors = [];
    state.practiceDuplicateSource = null;
    state.draftPractice = {
      editingPracticeId: practice.id,
      practiceType: practice.practiceType || '',
      clientId: practice.clientId || '',
      clientName: practice.clientName || practice.client || '',
      practiceDate: practice.practiceDate || practice.eta || new Date().toISOString().slice(0, 10),
      category: practice.category || '',
      status: practice.status || 'Operativa',
      generatedReference: practice.reference || '',
      dynamicData: extractPracticeDynamicData(practice)
    };
  }


  function currentRoute() {
    return Modules.normalizeRoute(state.currentRoute);
  }

  function currentRouteMeta() {
    return Modules.getRouteMeta(currentRoute());
  }

  function expandedModules() {
    return Array.isArray(state.expandedModules) ? [...state.expandedModules] : [];
  }

  function ensureCurrentModuleExpanded() {
    const moduleKey = Modules.getModuleKeyFromRoute(currentRoute());
    if (!moduleKey) return;
    const current = new Set(Array.isArray(state.expandedModules) ? state.expandedModules : []);
    if (!current.has(moduleKey)) {
      current.add(moduleKey);
      state.expandedModules = Array.from(current);
    }
  }

  function syncHash(replace = false) {
    const target = `#/${currentRoute()}`;
    if (window.location.hash === target) return;
    if (replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.location.hash = target;
    }
  }

  function safeRoute(route) {
    const normalized = Modules.normalizeRoute(route);
    if (!Licensing.routeAllowed(normalized, Modules, state)) return 'dashboard';
    return normalized;
  }

  function navigate(route, options = {}) {
    const normalized = safeRoute(route);
    const changed = normalized !== state.currentRoute;
    state.currentRoute = normalized;
    ensureCurrentModuleExpanded();
    save();
    render();

    if (options.syncHash !== false) syncHash(Boolean(options.replaceHash));
    if (changed) {
      main.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function toggleModule(moduleKey) {
    const current = new Set(Array.isArray(state.expandedModules) ? state.expandedModules : []);
    if (current.has(moduleKey)) current.delete(moduleKey); else current.add(moduleKey);
    state.expandedModules = Array.from(current);
    save();
    renderSidebar();
  }

  function licensingSummary() {
    const visible = Licensing.visibleModules(Modules.list(), state);
    return {
      visibleModules: visible.length,
      visibleSubmodules: visible.reduce((acc, module) => acc + module.submodules.length, 0),
      hiddenSubmodules: Modules.summary().totalSubmodules - visible.reduce((acc, module) => acc + module.submodules.length, 0)
    };
  }

  function bindPracticeEvents() {
    const draft = ensureDraftPractice();
    const form = document.getElementById('practiceForm');
    const filter = document.getElementById('filterText');
    const practiceSearchQuery = document.getElementById('practiceSearchQuery');
    const status = document.getElementById('statusFilter');
    const practiceType = document.getElementById('practiceType');
    const clientName = document.getElementById('clientName');
    const clientId = document.getElementById('clientId');
    const practiceDate = document.getElementById('practiceDate');
    const category = document.getElementById('category');
    const practiceStatus = document.getElementById('status');
    const generatedReference = document.getElementById('generatedReference');
    const lockedBanner = document.getElementById('practiceLockedBanner');
    const dynamicFields = document.getElementById('practiceDynamicFields');
    const validationSummary = document.getElementById('practiceValidationSummary');
    const dependentFields = Array.from(main.querySelectorAll('[data-practice-dependent]')).flatMap((node) => {
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(node.tagName)) return [node];
      return Array.from(node.querySelectorAll('input, select, textarea, button'));
    });

    function focusField(fieldName, tab) {
      const selector = tab === 'identity' ? `#${fieldName}` : `[name="${fieldName}"]`;
      const node = main.querySelector(selector);
      if (node && typeof node.focus === 'function') {
        node.focus({ preventScroll: false });
        node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }

    function clearValidationState() {
      main.querySelectorAll('.field.is-invalid').forEach((node) => node.classList.remove('is-invalid'));
      main.querySelectorAll('.field-error').forEach((node) => node.remove());
      main.querySelectorAll('.practice-tab.has-error').forEach((node) => node.classList.remove('has-error'));
      if (validationSummary) {
        validationSummary.hidden = true;
        validationSummary.innerHTML = '';
      }
    }

    function applyValidationState(errors) {
      clearValidationState();
      if (!Array.isArray(errors) || !errors.length) return;

      const tabsWithErrors = new Set(errors.filter((error) => error.tab && error.tab !== 'identity').map((error) => error.tab));
      main.querySelectorAll('[data-practice-tab]').forEach((button) => {
        button.classList.toggle('has-error', tabsWithErrors.has(button.dataset.practiceTab));
      });

      if (validationSummary) {
        validationSummary.hidden = false;
        validationSummary.innerHTML = `
          <div class="validation-summary-title">${Utils.escapeHtml(I18N.t('ui.validationSummaryTitle', 'Controlli da completare prima del salvataggio'))}</div>
          <div class="validation-summary-hint">${Utils.escapeHtml(I18N.t('ui.validationSummaryHint', 'Sistema i campi evidenziati: la tab con errori viene segnalata automaticamente.'))}</div>
          <ul class="validation-summary-list">
            ${errors.map((error) => `<li><strong>${Utils.escapeHtml(error.label || error.field)}</strong> — ${Utils.escapeHtml(error.message || '')}</li>`).join('')}
          </ul>`;
      }

      errors.forEach((error) => {
        const fieldWrap = main.querySelector(`[data-field-wrap="${error.field}"]`);
        if (!fieldWrap) return;
        fieldWrap.classList.add('is-invalid');
        if (!fieldWrap.querySelector('.field-error')) {
          const errorNode = document.createElement('div');
          errorNode.className = 'field-error';
          errorNode.textContent = error.message || '';
          fieldWrap.appendChild(errorNode);
        }
      });
    }

    function refreshValidationState() {
      if (!Array.isArray(state._practiceValidationErrors) || !state._practiceValidationErrors.length) return;
      const validation = validatePracticeDraft(draft);
      state._practiceValidationErrors = validation.errors;
      if (validation.errors.length) applyValidationState(validation.errors);
      else clearValidationState();
    }

    function syncCategoryOptions() {
      if (!category) return;
      const options = getPracticeCategoryOptions(draft.practiceType);
      if (draft.category && !options.includes(draft.category)) draft.category = '';
      if (!draft.category && options.length === 1) draft.category = options[0];
      category.innerHTML = `<option value="">—</option>${options.map((option) => `<option value="${Utils.escapeHtml(option)}" ${draft.category === option ? 'selected' : ''}>${Utils.escapeHtml(option)}</option>`).join('')}`;
      category.disabled = !draft.practiceType;
    }

    function renderDynamicPanels() {
      if (!dynamicFields) return;
      dynamicFields.innerHTML = renderDynamicFieldsHTML(draft.practiceType || '', state.practiceTab || 'practice', draft);
      bindDynamicPersistence();
      updateVerificationBannerState(draft);
      refreshValidationState();
    }

    function syncPracticeLock() {
      const unlocked = Boolean(draft.practiceType);
      dependentFields.forEach((field) => {
        if (field.id === 'practiceType' || field.type === 'hidden' || field.readOnly) return;
        field.disabled = !unlocked;
      });
      syncCategoryOptions();
      if (lockedBanner) lockedBanner.style.display = unlocked ? 'none' : 'block';
      if (!unlocked) {
        draft.generatedReference = '';
        if (generatedReference) generatedReference.value = '';
      } else {
        draft.generatedReference = buildCurrentPracticeReference();
        if (generatedReference) generatedReference.value = draft.generatedReference;
      }
      renderDynamicPanels();
    }

    function syncDerivedPreviewFields() {
      const currentClientLabel = draft.clientName || I18N.t('ui.clientRequired', 'Cliente');
      main.querySelectorAll('[data-field-wrap="client"] .derived-chip').forEach((node) => {
        node.textContent = currentClientLabel;
      });
    }

    function persistIdentity(options = {}) {
      const shouldRefreshValidation = options.refreshValidation !== false;
      if (PracticePersistence && typeof PracticePersistence.persistIdentity === 'function') {
        PracticePersistence.persistIdentity({
          draft,
          practiceType,
          clientName,
          clientId,
          practiceDate,
          category,
          practiceStatus,
          generatedReference,
          buildCurrentPracticeReference,
          save,
          updateVerificationBannerState,
          refreshValidation: shouldRefreshValidation ? refreshValidationState : null
        });
      } else {
        draft.practiceType = practiceType?.value || '';
        draft.clientName = clientName?.value || '';
        draft.clientId = clientId?.value || '';
        draft.practiceDate = practiceDate?.value || new Date().toISOString().slice(0, 10);
        draft.category = category?.value || '';
        draft.status = practiceStatus?.value || 'In attesa documenti';
        draft.generatedReference = draft.practiceType ? buildCurrentPracticeReference() : '';
        if (generatedReference) generatedReference.value = draft.generatedReference;
        save();
        updateVerificationBannerState(draft);
        if (shouldRefreshValidation) refreshValidationState();
      }
      syncDerivedPreviewFields();
    }

    function bindDynamicPersistence() {
      if (!dynamicFields) return;
      if (PracticePersistence && typeof PracticePersistence.bindDynamicFieldPersistence === 'function') {
        PracticePersistence.bindDynamicFieldPersistence({
          root: dynamicFields,
          draft,
          normalizeValue: (fieldName, rawValue, node) => {
            let nextValue = rawValue;
            if (draft.practiceType && typeof PracticeSchemas.getField === 'function' && typeof PracticeSchemas.normalizeSuggestedValue === 'function') {
              const field = PracticeSchemas.getField(draft.practiceType, fieldName);
              nextValue = PracticeSchemas.normalizeSuggestedValue(draft.practiceType, field, rawValue, state.companyConfig);
              if (!Array.isArray(nextValue) && node && nextValue !== node.value) node.value = nextValue;
            }
            return nextValue;
          },
          save: () => {
            save();
            refreshValidationState();
          },
          updateVerificationBannerState
        });
        return;
      }
      dynamicFields.querySelectorAll('input, select, textarea').forEach((node) => {
        if (node.dataset.boundDraft === '1') return;
        node.dataset.boundDraft = '1';
        const persistNodeValue = (normalize = false) => {
          if (node.type === 'checkbox') {
            draft.dynamicData[node.name] = Array.from(dynamicFields.querySelectorAll(`[name="${node.name}"]:checked`)).map((item) => item.value);
          } else {
            let nextValue = node.value;
            if (normalize && draft.practiceType && typeof PracticeSchemas.getField === 'function' && typeof PracticeSchemas.normalizeSuggestedValue === 'function') {
              const field = PracticeSchemas.getField(draft.practiceType, node.name);
              nextValue = PracticeSchemas.normalizeSuggestedValue(draft.practiceType, field, nextValue, state.companyConfig);
              if (nextValue !== node.value) node.value = nextValue;
            }
            draft.dynamicData[node.name] = nextValue;
          }
          save();
          updateVerificationBannerState(draft);
          refreshValidationState();
        };
        node.addEventListener('input', () => persistNodeValue(false));
        node.addEventListener('change', () => persistNodeValue(true));
        node.addEventListener('blur', () => persistNodeValue(true));
      });
    }

    if (PracticeSearchUI && typeof PracticeSearchUI.bindQueryInput === 'function') {
      PracticeSearchUI.bindQueryInput({
        input: practiceSearchQuery,
        state,
        save,
        rerenderPreservingInput,
        clearPreviewOnInput: true
      });
    } else {
      practiceSearchQuery?.addEventListener('input', (event) => {
        state.practiceSearchQuery = event.target.value || '';
        state.practiceSearchPreviewId = '';
        save();
        rerenderPreservingInput('practiceSearchQuery', event.target.selectionStart, event.target.selectionEnd);
      });
    }

    filter?.addEventListener('input', (event) => {
      state.filterText = event.target.value || '';
      save();
      rerenderPreservingInput('filterText', event.target.selectionStart, event.target.selectionEnd);
    });

    status?.addEventListener('change', (event) => {
      state.statusFilter = event.target.value || 'Tutti';
      save();
      render();
    });

    practiceType?.addEventListener('change', () => {
      draft.practiceType = practiceType.value || '';
      draft.dynamicData = {};
      draft.category = '';
      state.practiceTab = 'practice';
      state._practiceValidationErrors = [];
      clearValidationState();
      persistIdentity({ refreshValidation: false });
      render();
    });

    clientName?.addEventListener('input', () => {
      const match = syncClientMatch(clientName.value || '');
      if (clientId) clientId.value = match ? match.id : '';
      persistIdentity();
    });

    practiceDate?.addEventListener('change', () => persistIdentity());
    category?.addEventListener('change', () => persistIdentity());
    practiceStatus?.addEventListener('change', () => persistIdentity());

    main.querySelectorAll('[data-practice-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        state.practiceTab = button.dataset.practiceTab;
        save();
        render();
      });
    });

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      persistIdentity({ refreshValidation: false });

      const validation = validatePracticeDraft(draft);
      if (!validation.valid) {
        state._practiceValidationErrors = validation.errors;
        const firstInvalid = validation.errors[0];
        if (firstInvalid && firstInvalid.tab && firstInvalid.tab !== 'identity' && firstInvalid.tab !== state.practiceTab) {
          state.practiceTab = firstInvalid.tab;
          render();
        } else {
          applyValidationState(validation.errors);
          if (firstInvalid) focusField(firstInvalid.field, firstInvalid.tab);
        }
        toast(I18N.t('ui.validationBlockedSave', 'Salvataggio bloccato: completa i controlli evidenziati.'));
        return;
      }

      state._practiceValidationErrors = [];
      clearValidationState();

      if (PracticeSavePipeline && typeof PracticeSavePipeline.saveDraft === 'function') {
        const result = PracticeSavePipeline.saveDraft({
          state,
          draft,
          i18n: I18N,
          getClientById,
          getPracticeSchema,
          buildDynamicLabelsForType,
          normalizeSeaPortField,
          companyConfig: state.companyConfig,
          practiceTypeLabel,
          buildCurrentPracticeReference,
          nextPracticeId: Utils.nextPracticeId,
          commitPracticeNumber: Utils.commitPracticeNumber,
          nextLogId: Utils.nextLogId,
          nowStamp: Utils.nowStamp,
          toast,
          save,
          render,
          loadPracticeIntoDraft,
          focusPracticeEditor
        });
        if (!result.ok && Array.isArray(result.errors) && result.errors.length) {
          state._practiceValidationErrors = result.errors;
          applyValidationState(result.errors);
        }
        return;
      }

      const schema = getPracticeSchema(draft.practiceType);
      const dynamicLabels = buildDynamicLabelsForType(draft.practiceType);

      const existingRecord = draft.editingPracticeId ? state.practices.find((item) => item.id === draft.editingPracticeId) : null;
      const normalizedSeaPortLoading = draft.practiceType && draft.practiceType.startsWith('sea_')
        ? normalizeSeaPortField(draft.practiceType, 'portLoading', draft.dynamicData.portLoading || '')
        : (draft.dynamicData.portLoading || '');
      const normalizedSeaPortDischarge = draft.practiceType && draft.practiceType.startsWith('sea_')
        ? normalizeSeaPortField(draft.practiceType, 'portDischarge', draft.dynamicData.portDischarge || '')
        : (draft.dynamicData.portDischarge || '');
      if (normalizedSeaPortLoading) draft.dynamicData.portLoading = normalizedSeaPortLoading;
      if (normalizedSeaPortDischarge) draft.dynamicData.portDischarge = normalizedSeaPortDischarge;

      const record = {
        id: draft.editingPracticeId || Utils.nextPracticeId(state.practices),
        reference: draft.generatedReference || buildCurrentPracticeReference(),
        clientId: draft.clientId || '',
        client: draft.clientName,
        clientName: draft.clientName,
        linkedClientId: draft.clientId || '',
        linkedClientName: draft.clientName,
        practiceType: draft.practiceType,
        practiceTypeLabel: practiceTypeLabel(draft.practiceType),
        schemaGroup: schema ? schema.group : '',
        category: draft.category,
        practiceDate: draft.practiceDate,
        status: draft.status || 'Operativa',
        priority: existingRecord?.priority || 'Media',
        importer: draft.dynamicData.importer || '',
        consignee: draft.dynamicData.consignee || '',
        portLoading: normalizedSeaPortLoading || draft.dynamicData.airportDeparture || draft.dynamicData.portLoading || '',
        portDischarge: normalizedSeaPortDischarge || draft.dynamicData.airportDestination || draft.dynamicData.portDischarge || '',
        containerCode: draft.dynamicData.containerCode || '',
        packageCount: draft.dynamicData.packageCount || '',
        grossWeight: draft.dynamicData.grossWeight || '',
        goodsDescription: draft.dynamicData.goodsDescription || '',
        booking: draft.dynamicData.booking || '',
        terminal: draft.dynamicData.terminal || draft.dynamicData.terminalPickup || draft.dynamicData.terminalDelivery || '',
        terminalPickup: draft.dynamicData.terminalPickup || '',
        terminalDelivery: draft.dynamicData.terminalDelivery || '',
        mbl: draft.dynamicData.policyNumber || draft.dynamicData.mbl || '',
        hbl: draft.dynamicData.hbl || '',
        mawb: draft.dynamicData.mawb || '',
        hawb: draft.dynamicData.hawb || '',
        cmr: draft.dynamicData.cmr || '',
        carrier: draft.dynamicData.carrier || '',
        transporter: draft.dynamicData.transporter || '',
        airline: draft.dynamicData.airline || '',
        deposit: draft.dynamicData.deposit || '',
        customsOffice: draft.dynamicData.customsOffice || draft.dynamicData.customsOperator || '',
        customsSection: '',
        policyNumber: draft.dynamicData.policyNumber || draft.dynamicData.mbl || '',
        baseQuotation: draft.dynamicData.baseQuotation || '',
        deliveryCity: draft.dynamicData.deliveryCity || '',
        additionalReference: draft.dynamicData.additionalReference || '',
        bolla: draft.dynamicData.bolla || '',
        eta: draft.dynamicData.arrivalDate || draft.dynamicData.departureDate || draft.dynamicData.deliveryDate || draft.practiceDate,
        type: draft.practiceType.includes('export') ? 'Export' : draft.practiceType.includes('import') ? 'Import' : 'Magazzino',
        port: draft.dynamicData.portDischarge || draft.dynamicData.airportDestination || draft.dynamicData.deliveryPlace || draft.dynamicData.deposit || '',
        notes: draft.dynamicData.internalNotes || '',
        billingLinkStatus: existingRecord?.billingLinkStatus || I18N.t('ui.billingLinkPending', 'Da collegare'),
        sourceModule: 'practices',
        dynamicData: { ...(draft.dynamicData || {}) },
        dynamicLabels
      };

      const matchedClient = getClientById(draft.clientId);
      if (matchedClient && !draft.editingPracticeId) Utils.commitPracticeNumber(matchedClient.numberingRule, draft.practiceDate);

      if (draft.editingPracticeId) {
        const index = state.practices.findIndex((item) => item.id === draft.editingPracticeId);
        if (index >= 0) state.practices[index] = record;
        state.operatorLogs.unshift({
          id: Utils.nextLogId(state.operatorLogs),
          when: Utils.nowStamp(),
          practiceId: record.id,
          text: `${I18N.getLanguage() === 'en' ? 'Practice updated' : 'Pratica aggiornata'} ${record.reference}.`
        });
        toast(I18N.t('ui.practiceUpdated', 'Pratica aggiornata'));
      } else {
        state.practices.unshift(record);
        state.operatorLogs.unshift({
          id: Utils.nextLogId(state.operatorLogs),
          when: Utils.nowStamp(),
          practiceId: record.id,
          text: `${I18N.getLanguage() === 'en' ? 'Practice created' : 'Creata pratica'} ${record.reference}.`
        });
        toast(I18N.t('ui.practiceSaved', 'Pratica salvata'));
      }

      state.selectedPracticeId = record.id;
      loadPracticeIntoDraft(record.id);
      state.practiceOpenSource = 'save';
      save();
      render();
      focusPracticeEditor('save', record.id);
    });

    if (PracticeOpenEdit && typeof PracticeOpenEdit.bindOpenTriggers === 'function') {
      PracticeOpenEdit.bindOpenTriggers({ main, openPracticeForEditing });
    } else {
      main.querySelectorAll('[data-practice-id]').forEach((node) => {
        node.addEventListener('click', () => {
          const practiceId = node.dataset.practiceId;
          const source = node.classList.contains('practice-search-result') ? 'search' : 'list';
          openPracticeForEditing(practiceId, { source });
        });
      });

      main.querySelectorAll('[data-open-practice-id]').forEach((node) => {
        node.addEventListener('click', (event) => {
          event.stopPropagation();
          const practiceId = node.dataset.openPracticeId;
          openPracticeForEditing(practiceId, { source: 'search' });
        });
      });
    }

    syncPracticeLock();
    if (Array.isArray(state._practiceValidationErrors) && state._practiceValidationErrors.length) {
      applyValidationState(state._practiceValidationErrors);
    }
  }

  function renderSidebar() {
    const visibleModules = Licensing.visibleModules(Modules.list(), state);
    sidebarNav.innerHTML = Templates.sidebar(visibleModules, currentRoute(), expandedModules());
  }

  function renderMain() {
    const route = currentRoute();
    const routeMeta = currentRouteMeta();
    const module = Modules.getModule(routeMeta.moduleKey);

    title.textContent = routeMeta.fullTitle;

    if (route === 'dashboard') {
      main.innerHTML = Templates.dashboard(state, Modules.summary(), licensingSummary());
      return;
    }

    if (route === 'practices' || route === 'practices/elenco-pratiche') {
      main.innerHTML = Templates.practices(state, selectedPractice(), filteredPractices(), practiceSearchResults());
      bindPracticeEvents();
      return;
    }

    if (route === 'master-data') {
      main.innerHTML = Templates.contacts(state, module);
      return;
    }

    if (route === 'settings') {
      main.innerHTML = Templates.settings(state, Modules.list(), Licensing.getActiveUser(state));
      bindSettingsEvents();
      return;
    }

    if (routeMeta.type === 'module') {
      main.innerHTML = Templates.moduleOverview(module, state);
      return;
    }

    main.innerHTML = Templates.submodulePlaceholder(module, routeMeta);
  }

  function render() {
    updateStaticLabels();
    renderSidebar();
    renderMain();
  }

  function rerenderPreservingInput(inputId, selectionStart = null, selectionEnd = null) {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    render();
    window.requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      const field = document.getElementById(inputId);
      if (!field || typeof field.focus !== 'function') return;
      field.focus({ preventScroll: true });
      if (typeof field.setSelectionRange === 'function' && selectionStart !== null && selectionEnd !== null) {
        try {
          field.setSelectionRange(selectionStart, selectionEnd);
        } catch (error) {
          // ignore selection restore errors on unsupported input types
        }
      }
    });
  }

  function bindSettingsEvents() {
    const companyPlan = document.getElementById('companyPlan');
    const activeUserId = document.getElementById('activeUserId');
    const languageSelect = document.getElementById('languageSelect');
    const settingsModuleKey = document.getElementById('settingsModuleKey');
    const numberingClientId = document.getElementById('numberingClientId');
    const numberingPrefix = document.getElementById('numberingPrefix');
    const numberingSeparator = document.getElementById('numberingSeparator');
    const numberingNextNumber = document.getElementById('numberingNextNumber');
    const numberingIncludeYear = document.getElementById('numberingIncludeYear');
    const numberingPreview = document.getElementById('numberingPreview');
    const saveNumberingRule = document.getElementById('saveNumberingRule');

    function refreshSettingsStateAfterAccessChange() {
      state.currentRoute = safeRoute(state.currentRoute);
      ensureCurrentModuleExpanded();
      save();
      render();
    }

    function updateNumberingPreview() {
      if (!numberingPreview) return;
      const prefix = String(numberingPrefix?.value || '').trim().toUpperCase();
      const separator = String(numberingSeparator?.value || '-');
      const nextNumber = Math.max(1, Number(numberingNextNumber?.value || 1) || 1);
      const includeYear = Boolean(numberingIncludeYear?.checked);
      const year = new Date().getFullYear();
      const parts = [];
      if (prefix) parts.push(prefix);
      if (includeYear) parts.push(String(year));
      parts.push(String(nextNumber));
      numberingPreview.value = parts.join(separator);
    }

    companyPlan?.addEventListener('change', (event) => {
      Licensing.setCompanyPlan(state, event.target.value || 'base');
      refreshSettingsStateAfterAccessChange();
      toast(I18N.t('ui.settingsSaved', 'Impostazioni aggiornate'));
    });

    activeUserId?.addEventListener('change', (event) => {
      Licensing.setActiveUser(state, event.target.value || '');
      refreshSettingsStateAfterAccessChange();
      toast(I18N.t('ui.settingsSaved', 'Impostazioni aggiornate'));
    });

    languageSelect?.addEventListener('change', (event) => {
      state.language = event.target.value || 'it';
      I18N.setLanguage(state.language);
      normalizePracticeRecordsState();
      save();
      render();
      toast(I18N.t('ui.languageUpdated', 'Language updated'));
    });

    settingsModuleKey?.addEventListener('change', (event) => {
      state.settingsModuleKey = event.target.value || 'practices';
      save();
      render();
    });

    numberingClientId?.addEventListener('change', (event) => {
      state.settingsClientId = event.target.value || '';
      save();
      render();
    });

    [numberingPrefix, numberingSeparator, numberingNextNumber, numberingIncludeYear].forEach((field) => {
      if (!field) return;
      field.addEventListener(field.type === 'checkbox' ? 'change' : 'input', updateNumberingPreview);
    });

    saveNumberingRule?.addEventListener('click', () => {
      const client = getClientById(state.settingsClientId);
      if (!client) return;
      client.numberingRule = {
        ...(client.numberingRule || {}),
        prefix: String(numberingPrefix?.value || '').trim().toUpperCase(),
        separator: String(numberingSeparator?.value || '-'),
        includeYear: Boolean(numberingIncludeYear?.checked),
        resetEveryYear: true,
        nextNumber: Math.max(1, Number(numberingNextNumber?.value || 1) || 1),
        lastYear: Number(client.numberingRule?.lastYear || new Date().getFullYear())
      };
      save();
      render();
      toast(I18N.t('ui.settingsSaved', 'Impostazioni aggiornate'));
    });

    main.querySelectorAll('[data-toggle-company-module]').forEach((button) => {
      button.addEventListener('click', () => {
        Licensing.toggleCompanyModule(state, button.dataset.toggleCompanyModule);
        refreshSettingsStateAfterAccessChange();
      });
    });

    main.querySelectorAll('[data-toggle-user-module]').forEach((button) => {
      button.addEventListener('click', () => {
        Licensing.toggleUserModule(state, button.dataset.toggleUserModule);
        refreshSettingsStateAfterAccessChange();
      });
    });

    main.querySelectorAll('[data-toggle-company-submodule]').forEach((button) => {
      button.addEventListener('click', () => {
        const module = Modules.getModule(state.settingsModuleKey);
        if (!module) return;
        Licensing.toggleCompanySubmodule(state, module, button.dataset.toggleCompanySubmodule);
        refreshSettingsStateAfterAccessChange();
      });
    });

    main.querySelectorAll('[data-toggle-user-submodule]').forEach((button) => {
      button.addEventListener('click', () => {
        const module = Modules.getModule(state.settingsModuleKey);
        if (!module) return;
        Licensing.toggleUserSubmodule(state, module, button.dataset.toggleUserSubmodule);
        refreshSettingsStateAfterAccessChange();
      });
    });

    updateNumberingPreview();
  }

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-route]');
    if (nav) {
      navigate(nav.dataset.route);
      return;
    }

    const routeAction = event.target.closest('[data-route-action]');
    if (routeAction) {
      navigate(routeAction.dataset.routeAction);
      return;
    }

    const toggle = event.target.closest('[data-module-toggle]');
    if (toggle) {
      toggleModule(toggle.dataset.moduleToggle);
      return;
    }

    const action = event.target.closest('[data-action]');
    if (!action) return;

    if (action.dataset.action === 'save-backup') {
      save();
      toast(I18N.t('ui.backupUpdated', 'Backup locale aggiornato'));
    }

    if (action.dataset.action === 'duplicate-practice-draft') {
      duplicatePracticeDraft();
    }

    if (action.dataset.action === 'reset-demo') {
      const fresh = Data.initialState();
      Object.assign(state, fresh, { practiceTab: 'practice' });
      I18N.setLanguage(state.language || 'it');
      normalizePracticeRecordsState();
      state.currentRoute = safeRoute(state.currentRoute);
      ensureCurrentModuleExpanded();
      save();
      render();
      toast(I18N.t('ui.demoReset', 'Dati demo ripristinati'));
    }

    if (action.dataset.action === 'reset-practice-draft') {
      resetPracticeDraft();
      save();
      render();
      toast(I18N.t('ui.newDraft', 'Nuova pratica'));
    }
  });

  window.addEventListener('hashchange', () => {
    const routeFromHash = safeRoute(window.location.hash || state.currentRoute);
    if (routeFromHash === currentRoute()) return;
    state.currentRoute = routeFromHash;
    ensureCurrentModuleExpanded();
    save();
    render();
  });

  ensureDraftPractice();
  I18N.setLanguage(state.language || 'it');
  const recordsNormalized = normalizePracticeRecordsState();
  state.currentRoute = safeRoute(window.location.hash || state.currentRoute);
  ensureCurrentModuleExpanded();
  save();
  render();
  syncHash(true);
})();
