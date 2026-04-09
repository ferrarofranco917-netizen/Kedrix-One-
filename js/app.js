(() => {
  'use strict';

  const Storage = window.KedrixOneStorage;
  const Data = window.KedrixOneData;
  const Utils = window.KedrixOneUtils;
  const Modules = window.KedrixOneModules;
  const Licensing = window.KedrixOneLicensing;
  const Templates = window.KedrixOneTemplates;
  const I18N = window.KedrixOneI18N || {
    t: (key, fallback) => fallback || key,
    getLanguage: () => document.documentElement.lang || 'it',
    setLanguage: (lang) => {
      document.documentElement.lang = lang || 'it';
    }
  };
  const PracticeSchemas = window.KedrixOnePracticeSchemas;
  const SearchIndex = window.KedrixOneSearchIndex;
  const PracticeVerification = window.KedrixOnePracticeVerification;
  const PracticeDraftValidator = window.KedrixOnePracticeDraftValidator;
  const PracticeFormRenderer = window.KedrixOnePracticeFormRenderer;
  const PracticeOpenEdit = window.KedrixOnePracticeOpenEdit;
  const PracticeIdentity = window.KedrixOnePracticeIdentity;
  const PracticeWorkspace = window.KedrixOnePracticeWorkspace;
  const PracticePersistence = window.KedrixOnePracticePersistence;
  const PracticeSavePipeline = window.KedrixOnePracticeSavePipeline;
  const PracticeContainerIntegrity = window.KedrixOnePracticeContainerIntegrity;
  const PracticeWeightIntegrity = window.KedrixOnePracticeWeightIntegrity;
  const PracticeFieldRelations = window.KedrixOnePracticeFieldRelations;
  const PracticeAttachments = window.KedrixOnePracticeAttachments;
  const DocumentEngine = window.KedrixOneDocumentEngine;
  const DocumentCategories = window.KedrixOneDocumentCategories;
  const DocumentPreview = window.KedrixOneDocumentPreview;
  const DocumentReferenceImportFoundation = window.KedrixOneDocumentReferenceImportFoundation || null;
  const AppFeedback = window.KedrixOneAppFeedback;
  const PracticeDocumentBridge = window.KedrixOnePracticeDocumentBridge;
  const PracticeDuplicate = window.KedrixOnePracticeDuplicate;
  const PracticeSearchUI = window.KedrixOnePracticeSearchUI;
  const PracticeListAnalytics = window.KedrixOnePracticeListAnalytics || null;
  const PracticeListBreakdowns = window.KedrixOnePracticeListBreakdowns || null;
  const PracticeListTable = window.KedrixOnePracticeListTable || null;
  const PracticeListStatusBreakdowns = window.KedrixOnePracticeListStatusBreakdowns || null;
  const PracticeListPresets = window.KedrixOnePracticeListPresets || null;
  const SeaSchemaCleanup = window.KedrixOneSeaSchemaCleanup;
  const ReferenceNormalizer = window.KedrixOnePracticeReferenceNormalizer;
  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const CustomsInstructionsWorkspace = window.KedrixOneCustomsInstructionsWorkspace || null;
  const CustomsInstructionsModule = window.KedrixOneCustomsInstructionsModule || null;

  function getMasterDataQuickAdd() {
    return window.KedrixOneMasterDataQuickAdd;
  }

  const state = Storage.load(() => Data.initialState());
  if (PracticeAttachments && typeof PracticeAttachments.normalizeAttachmentIndex === 'function') {
    PracticeAttachments.normalizeAttachmentIndex(state);
  }
  if (DocumentCategories && typeof DocumentCategories.ensureStateOptions === 'function') {
    DocumentCategories.ensureStateOptions(state, I18N);
  }
  const MasterDataQuickAdd = getMasterDataQuickAdd();
  if (MasterDataQuickAdd && typeof MasterDataQuickAdd.ensureModuleState === 'function') {
    MasterDataQuickAdd.ensureModuleState(state);
  }
  if (CustomsInstructionsModule && typeof CustomsInstructionsModule.ensureState === 'function') {
    CustomsInstructionsModule.ensureState(state);
  }

  function ensurePracticeListState() {
    const defaults = PracticeListAnalytics && typeof PracticeListAnalytics.defaultFilters === 'function'
      ? PracticeListAnalytics.defaultFilters()
      : {
          quick: '', status: 'all', draftState: 'all', direction: 'all', practiceType: '', reference: '', client: '', importer: '', exporter: '', consignee: '', container: '', booking: '', policy: '', vessel: '', origin: '', destination: '', dateFrom: '', dateTo: '', compareDateFrom: '', compareDateTo: '', sortBy: 'practiceDate', sortDirection: 'desc'
        };
    const current = state.practiceListFilters && typeof state.practiceListFilters === 'object' ? state.practiceListFilters : {};
    state.practiceListFilters = { ...defaults, ...current };
    if (!state.practiceListFilters.quick && state.filterText) state.practiceListFilters.quick = state.filterText;
    if ((!state.practiceListFilters.status || state.practiceListFilters.status === 'all') && state.statusFilter && state.statusFilter !== 'Tutti') {
      state.practiceListFilters.status = state.statusFilter;
    }
  }

  ensurePracticeListState();

  if (Utils && typeof Utils.reconcilePracticeReferenceDuplicates === 'function') {
    const reconciliation = Utils.reconcilePracticeReferenceDuplicates(state);
    if (reconciliation && reconciliation.changed) {
      if (Utils && typeof Utils.syncNumberingRuleToReference === 'function') {
        (state.practices || []).forEach((practice) => {
          const matchedClient = (state.clients || []).find((client) => String(client.id || '').trim() === String(practice.clientId || '').trim()) || null;
          if (matchedClient) {
            Utils.syncNumberingRuleToReference(matchedClient.numberingRule, practice.reference, practice.practiceDate);
          }
        });
      }
      Storage.save(state);
    }
  }

  sanitizeLegacyPortSuggestions();

  if (PracticeContainerIntegrity && typeof PracticeContainerIntegrity.registerPreSaveHook === 'function') {
    PracticeContainerIntegrity.registerPreSaveHook(PracticeSavePipeline, I18N);
  }
  if (PracticeWeightIntegrity && typeof PracticeWeightIntegrity.registerPreSaveHook === 'function') {
    PracticeWeightIntegrity.registerPreSaveHook(PracticeSavePipeline, I18N);
  }

  const main = document.getElementById('mainContent');
  const title = document.getElementById('pageTitle');
  const toastRegion = document.getElementById('toastRegion');
  if (AppFeedback && typeof AppFeedback.init === 'function') {
    AppFeedback.init({ toastRegion });
  }
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

  function resolveDefaultPracticeTab(draft = null, fallback = '') {
    const sourceDraft = draft && typeof draft === 'object' ? draft : (state.draftPractice || {});
    const explicit = String(fallback || '').trim();
    if (explicit) return explicit;
    return String(sourceDraft.editingPracticeId || '').trim() ? 'practice' : 'start';
  }

  function practiceWorkspaceSessions() {
    ensurePracticeWorkspace();
    return Array.isArray(state.practiceWorkspace?.sessions) ? state.practiceWorkspace.sessions : [];
  }

  function hasOpenPracticeWorkspace() {
    if (state && state._pendingPracticeOpen && state._pendingPracticeOpen.practiceId) return true;
    return practiceWorkspaceSessions().length > 0;
  }

  function renderPracticeStarterPanel() {
    return `
      <section class="kpi-grid compact-kpi-grid">
        <article class="kpi-card">
          <div class="kpi-label">${Utils.escapeHtml(I18N.t('ui.practiceStartStepIdentityLabel', '1 · Identità'))}</div>
          <div class="kpi-value">${Utils.escapeHtml(I18N.t('ui.practiceStartStepIdentityValue', 'Compila base'))}</div>
          <div class="kpi-hint">${Utils.escapeHtml(I18N.t('ui.practiceStartStepIdentityHint', 'Seleziona tipo pratica, cliente, data e categoria per sbloccare il resto della maschera.'))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${Utils.escapeHtml(I18N.t('ui.practiceStartStepBlocksLabel', '2 · Blocchi operativi'))}</div>
          <div class="kpi-value">${Utils.escapeHtml(I18N.t('ui.practiceStartStepBlocksValue', 'Apri quando serve'))}</div>
          <div class="kpi-hint">${Utils.escapeHtml(I18N.t('ui.practiceStartStepBlocksHint', 'Pratica, dettaglio, note e allegati restano disponibili senza sporcare l’avvio della nuova maschera.'))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${Utils.escapeHtml(I18N.t('ui.practiceStartStepSaveLabel', '3 · Controlli'))}</div>
          <div class="kpi-value">${Utils.escapeHtml(I18N.t('ui.practiceStartStepSaveValue', 'Al salvataggio'))}</div>
          <div class="kpi-hint">${Utils.escapeHtml(I18N.t('ui.practiceStartStepSaveHint', 'Le validazioni bloccanti vengono portate in evidenza solo quando provi a salvare la pratica.'))}</div>
        </article>
      </section>

      <section class="panel inset-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${Utils.escapeHtml(I18N.t('ui.practiceStartIntroTitle', 'Avvio pulito della nuova pratica'))}</h3>
            <p class="panel-subtitle">${Utils.escapeHtml(I18N.t('ui.practiceStartIntroHint', 'Questa maschera parte in modo ordinato: compila prima l’identità sopra, poi apri i blocchi operativi che ti servono.'))}</p>
          </div>
        </div>
        <div class="action-row">
          <button class="btn" type="button" data-focus-practice-tab-only="practice">${Utils.escapeHtml(I18N.t('ui.practiceStartOpenPracticeTab', 'Apri tab Pratica'))}</button>
          <button class="btn secondary" type="button" data-focus-practice-tab-only="detail">${Utils.escapeHtml(I18N.t('ui.practiceStartOpenDetailTab', 'Apri tab Dettaglio'))}</button>
          <button class="btn secondary" type="button" data-focus-practice-tab-only="attachments">${Utils.escapeHtml(I18N.t('ui.practiceStartOpenAttachmentsTab', 'Apri Allegati'))}</button>
        </div>
      </section>`;
  }

  function createEmptyPracticeDraft(overrides = {}) {
    if (PracticeIdentity && typeof PracticeIdentity.createEmptyDraft === 'function') {
      return PracticeIdentity.createEmptyDraft(overrides);
    }
    return {
      editingPracticeId: '',
      practiceType: '',
      clientId: '',
      clientName: '',
      practiceDate: new Date().toISOString().slice(0, 10),
      category: '',
      status: 'In attesa documenti',
      generatedReference: '',
      attachmentOwnerKey: overrides.attachmentOwnerKey || '',
      linkedEntities: { ...((overrides && overrides.linkedEntities) || {}) },
      dynamicData: { ...((overrides && overrides.dynamicData) || {}) },
      ...overrides
    };
  }

  function ensurePracticeWorkspace() {
    if (!PracticeWorkspace || typeof PracticeWorkspace.ensureState !== 'function') return null;
    PracticeWorkspace.ensureState(state, { createEmptyDraft: createEmptyPracticeDraft });
    PracticeWorkspace.syncActiveDraft(state, { createEmptyDraft: createEmptyPracticeDraft });
    return state.practiceWorkspace;
  }

  function buildDraftFromPractice(practiceId) {
    if (!practiceId) return null;
    if (PracticeIdentity && typeof PracticeIdentity.loadPracticeIntoDraft === 'function') {
      const tempState = {
        practices: state.practices,
        selectedPracticeId: '',
        practiceTab: 'practice',
        _practiceValidationErrors: [],
        practiceDuplicateSource: null,
        draftPractice: createEmptyPracticeDraft()
      };
      PracticeIdentity.loadPracticeIntoDraft(tempState, practiceId, { extractPracticeDynamicData });
      return tempState.draftPractice;
    }
    const practice = state.practices.find((item) => item.id === practiceId);
    if (!practice) return null;
    return createEmptyPracticeDraft({
      editingPracticeId: practice.id,
      practiceType: practice.practiceType || '',
      clientId: practice.clientId || '',
      clientName: practice.clientName || practice.client || '',
      practiceDate: practice.practiceDate || practice.eta || new Date().toISOString().slice(0, 10),
      category: practice.category || '',
      status: practice.status || 'Operativa',
      generatedReference: practice.reference || '',
      attachmentOwnerKey: practice.attachmentOwnerKey || practice.id || '',
      linkedEntities: MasterDataEntities && typeof MasterDataEntities.hydratePracticeLinkedEntities === 'function'
        ? MasterDataEntities.hydratePracticeLinkedEntities(state, practice)
        : { ...((practice && practice.linkedEntities) || {}) },
      dynamicData: extractPracticeDynamicData(practice)
    });
  }

  function openPracticeDraftSession(draft, options = {}) {
    const nextDraft = draft && typeof draft === 'object' ? draft : createEmptyPracticeDraft();
    if (PracticeWorkspace && typeof PracticeWorkspace.openDraftSession === 'function') {
      PracticeWorkspace.openDraftSession(state, {
        draft: nextDraft,
        source: options.source || 'manual',
        createEmptyDraft: createEmptyPracticeDraft,
        practiceTab: resolveDefaultPracticeTab(nextDraft, options.practiceTab),
        duplicateSource: options.duplicateSource || null
      });
      PracticeWorkspace.syncActiveDraft(state, { createEmptyDraft: createEmptyPracticeDraft });
      return state.draftPractice;
    }
    state.draftPractice = nextDraft;
    state.practiceDuplicateSource = options.duplicateSource || null;
    return state.draftPractice;
  }

  function switchPracticeDraftSession(sessionId) {
    if (!PracticeWorkspace || typeof PracticeWorkspace.switchSession !== 'function') return null;
    const session = PracticeWorkspace.switchSession(state, sessionId, { createEmptyDraft: createEmptyPracticeDraft });
    PracticeWorkspace.syncActiveDraft(state, { createEmptyDraft: createEmptyPracticeDraft });
    return session;
  }

  function closePracticeDraftSession(sessionId) {
    if (!PracticeWorkspace || typeof PracticeWorkspace.closeSession !== 'function') return null;
    const removed = PracticeWorkspace.closeSession(state, sessionId, { createEmptyDraft: createEmptyPracticeDraft });
    PracticeWorkspace.syncActiveDraft(state, { createEmptyDraft: createEmptyPracticeDraft });
    return removed;
  }

  function markActivePracticeSessionDirty(isDirty = true) {
    if (!PracticeWorkspace) return null;
    if (isDirty === false && typeof PracticeWorkspace.markActiveSessionSaved === 'function') {
      return PracticeWorkspace.markActiveSessionSaved(state, { createEmptyDraft: createEmptyPracticeDraft });
    }
    if (typeof PracticeWorkspace.setActiveDirty !== 'function') return null;
    return PracticeWorkspace.setActiveDirty(state, isDirty, { createEmptyDraft: createEmptyPracticeDraft });
  }

  function setActivePracticeSessionTab(tab = 'practice') {
    if (!PracticeWorkspace || typeof PracticeWorkspace.setActiveTab !== 'function') {
      state.practiceTab = String(tab || 'practice').trim() || 'practice';
      return null;
    }
    return PracticeWorkspace.setActiveTab(state, tab, { createEmptyDraft: createEmptyPracticeDraft });
  }

  async function confirmClosePracticeSession(sessionId) {
    if (!PracticeWorkspace || typeof PracticeWorkspace.findSession !== 'function') return true;
    const session = PracticeWorkspace.findSession(state, sessionId, { createEmptyDraft: createEmptyPracticeDraft });
    const hasUnsaved = PracticeWorkspace && typeof PracticeWorkspace.hasSessionUnsavedChanges === 'function'
      ? PracticeWorkspace.hasSessionUnsavedChanges(state, sessionId, { createEmptyDraft: createEmptyPracticeDraft })
      : Boolean(session && session.isDirty);
    if (!session || !hasUnsaved) return true;
    if (!AppFeedback || typeof AppFeedback.confirm !== 'function') return false;
    return AppFeedback.confirm({
      title: I18N.t('ui.workspaceDirtyCloseTitle', 'Chiudere la maschera con modifiche non salvate?'),
      message: I18N.t('ui.workspaceDirtyCloseMessage', 'Questa maschera contiene modifiche non salvate. Se la chiudi adesso, le modifiche andranno perse.'),
      confirmLabel: I18N.t('ui.workspaceDiscardMask', 'Chiudi senza salvare'),
      cancelLabel: I18N.t('ui.workspaceKeepMask', 'Torna alla maschera'),
      tone: 'warning'
    });
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

  function toast(text, tone = 'info') {
    if (AppFeedback) {
      if (tone === 'success' && typeof AppFeedback.success === 'function') {
        AppFeedback.success(text);
        return;
      }
      if (tone === 'warning' && typeof AppFeedback.warning === 'function') {
        AppFeedback.warning(text);
        return;
      }
      if (tone === 'error' && typeof AppFeedback.error === 'function') {
        AppFeedback.error(text);
        return;
      }
      if (tone === 'info' && typeof AppFeedback.info === 'function') {
        AppFeedback.info(text);
        return;
      }
      if (typeof AppFeedback.showToast === 'function') {
        AppFeedback.showToast(text, { tone });
        return;
      }
    }
    const el = document.createElement('div');
    el.className = `toast toast-${tone}`;
    el.textContent = text;
    toastRegion.appendChild(el);
    setTimeout(() => el.remove(), tone === 'warning' || tone === 'error' ? 3600 : 2500);
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

  function currentPracticeListFilters() {
    ensurePracticeListState();
    return state.practiceListFilters;
  }

  function filteredPractices() {
    const filters = currentPracticeListFilters();
    if (PracticeListAnalytics && typeof PracticeListAnalytics.filterPractices === 'function') {
      const filtered = PracticeListAnalytics.filterPractices(state.practices, filters);
      return PracticeListTable && typeof PracticeListTable.sortPractices === 'function'
        ? PracticeListTable.sortPractices(filtered, filters)
        : filtered;
    }
    const query = Utils.normalize(filters.quick || state.filterText);
    return state.practices.filter((practice) => {
      const okStatus = !filters.status || filters.status === 'all' || filters.status === 'Tutti' || practice.status === filters.status;
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

  function practiceListInsights() {
    const filters = currentPracticeListFilters();
    const baseMetrics = (PracticeListAnalytics && typeof PracticeListAnalytics.buildMetrics === 'function')
      ? PracticeListAnalytics.buildMetrics(state.practices, filters)
      : (() => {
          const primary = filteredPractices();
          return {
            primary,
            comparison: [],
            primaryCount: primary.length,
            compareCount: 0,
            deltaCount: primary.length,
            primaryImportCount: primary.filter((practice) => String(practice.practiceType || '').includes('import')).length,
            primaryExportCount: primary.filter((practice) => String(practice.practiceType || '').includes('export')).length,
            primaryWarehouseCount: primary.filter((practice) => String(practice.practiceType || '').includes('warehouse')).length,
            compareImportCount: 0,
            compareExportCount: 0,
            compareWarehouseCount: 0,
            compareEnabled: false,
            totalScopedCount: primary.length
          };
        })();

    if (PracticeListBreakdowns && typeof PracticeListBreakdowns.buildSubjectBreakdowns === 'function') {
      baseMetrics.subjectBreakdowns = PracticeListBreakdowns.buildSubjectBreakdowns(baseMetrics, 5);
    }
    if (PracticeListStatusBreakdowns && typeof PracticeListStatusBreakdowns.build === 'function') {
      baseMetrics.statusBreakdown = PracticeListStatusBreakdowns.build(baseMetrics);
    }

    return baseMetrics;
  }

  function selectedPractice() {
    return state.practices.find((practice) => practice.id === state.selectedPracticeId) || null;
  }

  function syncSavedPracticeSessions(record) {
    if (!record || !record.id) return [];
    const touched = PracticeWorkspace && typeof PracticeWorkspace.syncPracticeSessions === 'function'
      ? PracticeWorkspace.syncPracticeSessions(state, record.id, {
          createDraft: buildDraftFromPractice,
          createEmptyDraft: createEmptyPracticeDraft
        })
      : [];
    rebuildPracticeSearchIndex();
    return touched;
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
    const query = String(state.practiceSearchQuery || '').trim();
    let baseResults = [];

    if (PracticeSearchUI && typeof PracticeSearchUI.searchResults === 'function') {
      baseResults = PracticeSearchUI.searchResults(query, state.practices, runtimePracticeSearchIndex, (nextIndex) => {
        runtimePracticeSearchIndex = nextIndex;
      });
    } else if (query && SearchIndex && typeof SearchIndex.search === 'function') {
      baseResults = SearchIndex.search(query, rebuildPracticeSearchIndex());
    }

    if (!query) return [];
    return PracticeDocumentBridge && typeof PracticeDocumentBridge.mergePracticeResults === 'function'
      ? PracticeDocumentBridge.mergePracticeResults(query, baseResults, state, I18N)
      : baseResults;
  }


  function documentSearchResults() {
    if (!DocumentEngine || typeof DocumentEngine.searchBundles !== 'function') return [];
    return DocumentEngine.searchBundles(state.documentSearchQuery, state, I18N);
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

  function normalizeCheckboxGroupValue(rawValue) {
    if (Array.isArray(rawValue)) return rawValue.map((item) => String(item || '').trim()).filter(Boolean);
    return String(rawValue || '').split(',').map((item) => item.trim()).filter(Boolean);
  }

  function extractPracticeDynamicData(practice) {
    const base = practice && practice.dynamicData && typeof practice.dynamicData === 'object'
      ? { ...practice.dynamicData }
      : {};
    const fields = getPracticeSchemaFields(practice?.practiceType || '');
    fields.forEach((field) => {
      if (!field || field.type === 'derived' || field.type === 'select-derived') return;
      const currentValue = base[field.name];
      if (field.type === 'checkbox-group') {
        const normalizedCurrent = normalizeCheckboxGroupValue(currentValue);
        if (normalizedCurrent.length) {
          base[field.name] = normalizedCurrent;
          return;
        }
      } else if (currentValue !== undefined && currentValue !== null && String(currentValue).trim() !== '') {
        return;
      }
      const topLevelValue = practice?.[field.name];
      if (field.type === 'checkbox-group') {
        const normalizedTopLevel = normalizeCheckboxGroupValue(topLevelValue);
        if (normalizedTopLevel.length) base[field.name] = normalizedTopLevel;
        return;
      }
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

      const linkedEntities = MasterDataEntities && typeof MasterDataEntities.hydratePracticeLinkedEntities === 'function'
        ? MasterDataEntities.hydratePracticeLinkedEntities(state, { ...practice, dynamicData })
        : { ...((practice && practice.linkedEntities) || {}) };

      const next = {
        ...practice,
        dynamicData,
        linkedEntities,
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
      PracticeVerification.updateBanner(draft, { bannerId: 'practiceVerificationBanner', titleId: 'practiceVerificationBannerTitle', hintId: 'practiceVerificationBannerHint' });
    }
  }

  function openPracticeForEditing(practiceId, options = {}) {
    const normalizedPracticeId = String(practiceId || '').trim();
    const source = options.source || 'manual';
    const targetRoute = 'practices/workspace';
    if (!normalizedPracticeId) return;
    if (currentRoute() !== targetRoute && options.forceImmediate !== true) {
      state._pendingPracticeOpen = { practiceId: normalizedPracticeId, source };
      save();
      navigate(targetRoute);
      return;
    }
    if (PracticeOpenEdit && typeof PracticeOpenEdit.openForEditing === 'function') {
      PracticeOpenEdit.openForEditing(normalizedPracticeId, {
        source,
        state,
        main,
        save,
        render,
        loadPracticeIntoDraft
      });
      return;
    }
    loadPracticeIntoDraft(normalizedPracticeId);
    state._practiceValidationErrors = [];
    state.practiceSearchPreviewId = source === 'search' ? normalizedPracticeId : '';
    state.practiceOpenSource = source;
    save();
    render();
  }

  function queuePracticeOpenFromDocuments(practiceId = '') {
    const normalizedPracticeId = String(practiceId || '').trim();
    if (!normalizedPracticeId) return;
    state._pendingPracticeOpen = { practiceId: normalizedPracticeId, source: 'documents' };
    save();
    navigate('practices/workspace');
  }

  function consumePendingPracticeOpen() {
    const pending = state && state._pendingPracticeOpen && typeof state._pendingPracticeOpen === 'object'
      ? state._pendingPracticeOpen
      : null;
    const practiceId = String(pending?.practiceId || '').trim();
    if (!practiceId) return;
    state._pendingPracticeOpen = null;
    save();
    window.requestAnimationFrame(() => {
      openPracticeForEditing(practiceId, { source: pending?.source || 'documents', forceImmediate: true });
    });
  }


  function focusPracticeEditor(source = 'manual', practiceId = '') {
    if (PracticeOpenEdit && typeof PracticeOpenEdit.focusEditor === 'function') {
      PracticeOpenEdit.focusEditor({ main, source, practiceId });
    }
  }

  function duplicatePracticeDraft(practiceId = '') {
    const sourcePracticeId = practiceId || ensureDraftPractice().editingPracticeId || state.selectedPracticeId || '';
    if (!sourcePracticeId) {
      toast(I18N.t('ui.duplicateUnavailable', 'Apri prima una pratica esistente da duplicare.'), 'warning');
      return { ok: false, reason: 'missing-practice-id' };
    }

    if (PracticeDuplicate && typeof PracticeDuplicate.duplicatePracticeToDraft === 'function') {
      return PracticeDuplicate.duplicatePracticeToDraft(sourcePracticeId, {
        state,
        i18n: I18N,
        buildCurrentPracticeReference,
        createDuplicateSafeDraft: PracticeIdentity && typeof PracticeIdentity.createDuplicateSafeDraft === 'function'
          ? ((practice, duplicateOptions = {}) => PracticeIdentity.createDuplicateSafeDraft(practice, { ...duplicateOptions, state }))
          : (PracticeSavePipeline && typeof PracticeSavePipeline.createDuplicateSafeDraft === 'function'
            ? ((practice, duplicateOptions = {}) => PracticeSavePipeline.createDuplicateSafeDraft(practice, { ...duplicateOptions, state }))
            : null),
        extractPracticeDynamicData,
        openDraftSession: (nextDraft, duplicateOptions = {}) => {
          openPracticeDraftSession(nextDraft, {
            source: duplicateOptions.source || 'duplicate',
            duplicateSource: duplicateOptions.practiceDuplicateSource || null
          });
          state.practiceTab = 'practice';
          state._practiceValidationErrors = [];
          state.practiceSearchPreviewId = '';
          state.practiceDuplicateSource = duplicateOptions.practiceDuplicateSource || state.practiceDuplicateSource || null;
          state.practiceOpenSource = duplicateOptions.source || 'duplicate';
          state.selectedPracticeId = '';
        },
        save,
        render,
        toast,
        focusPracticeEditor
      });
    }

    toast(I18N.t('ui.duplicateUnavailable', 'Apri prima una pratica esistente da duplicare.'), 'warning');
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
    const baseValidation = PracticeDraftValidator && typeof PracticeDraftValidator.validateDraft === 'function'
      ? PracticeDraftValidator.validateDraft(draft, state.companyConfig)
      : PracticeSchemas.validateDraft(draft, state.companyConfig);

    const extraErrors = PracticeContainerIntegrity && typeof PracticeContainerIntegrity.buildValidationErrors === 'function'
      ? PracticeContainerIntegrity.buildValidationErrors({ state, draft, i18n: I18N })
      : [];

    const mergedErrors = [...(baseValidation.errors || []), ...extraErrors].filter(Boolean);
    const uniqueErrors = [];
    const seenErrors = new Set();
    mergedErrors.forEach((error) => {
      const key = `${error.tab || ''}|${error.field || ''}|${error.message || ''}`;
      if (seenErrors.has(key)) return;
      seenErrors.add(key);
      uniqueErrors.push(error);
    });

    return {
      valid: uniqueErrors.length === 0,
      errors: uniqueErrors
    };
  }

  function renderDynamicFieldsHTML(type, tab, draft = ensureDraftPractice()) {
    if (tab === 'start') {
      return renderPracticeStarterPanel();
    }
    if (tab === 'attachments' && PracticeAttachments && typeof PracticeAttachments.renderPanelHTML === 'function') {
      return PracticeAttachments.renderPanelHTML({ state, draft, i18n: I18N, utils: Utils });
    }
    return PracticeFormRenderer && typeof PracticeFormRenderer.renderDynamicFieldsHTML === 'function'
      ? PracticeFormRenderer.renderDynamicFieldsHTML(type, tab, draft, state.companyConfig, state)
      : `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.noDataYet', 'Nessun dato'))}</div>`;
  }

  function ensureDraftPractice() {
    if (PracticeWorkspace && typeof PracticeWorkspace.syncActiveDraft === 'function') {
      ensurePracticeWorkspace();
      return state.draftPractice;
    }
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
        linkedEntities: {},
        dynamicData: {}
      }));
  }

  function resetPracticeDraft(options = {}) {
    const overrides = options.overrides || {};
    if (PracticeWorkspace && typeof PracticeWorkspace.openDraftSession === 'function') {
      const initialPracticeTab = resolveDefaultPracticeTab(null, options.practiceTab || 'start');
      openPracticeDraftSession(createEmptyPracticeDraft(overrides), { source: options.source || 'new', practiceTab: initialPracticeTab });
      state.practiceTab = initialPracticeTab;
      setActivePracticeSessionTab(state.practiceTab);
      state._practiceValidationErrors = [];
      state.practiceSearchPreviewId = '';
      state.practiceOpenSource = '';
      state.practiceDuplicateSource = null;
      state.selectedPracticeId = '';
      return;
    }
    if (PracticeIdentity && typeof PracticeIdentity.resetDraft === 'function') {
      PracticeIdentity.resetDraft(state, { overrides, practiceTab: options.practiceTab || 'practice' });
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
      attachmentOwnerKey: PracticeAttachments && typeof PracticeAttachments.createDraftOwnerKey === 'function' ? PracticeAttachments.createDraftOwnerKey() : '',
      linkedEntities: {},
      dynamicData: {},
      ...overrides
    };
    state.practiceTab = options.practiceTab || 'practice';
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
    if (MasterDataEntities && typeof MasterDataEntities.applyLinkedRecordToDraft === 'function') {
      return MasterDataEntities.applyLinkedRecordToDraft({
        state,
        draft,
        fieldName: 'clientName',
        entityKey: 'client',
        record: match,
        value: clientName
      });
    }
    draft.clientId = match ? match.id : '';
    draft.clientName = clientName;
    return match;
  }

  function buildCurrentPracticeReference() {
    const draft = ensureDraftPractice();
    const activeSessionId = state?.practiceWorkspace?.activeSessionId || '';
    if (PracticeIdentity && typeof PracticeIdentity.buildCurrentPracticeReference === 'function') {
      return PracticeIdentity.buildCurrentPracticeReference(state, {
        getClientById,
        buildPracticeReference: Utils.buildPracticeReference,
        buildFallbackPracticeReference: Utils.buildFallbackPracticeReference,
        ensureUniquePracticeReference: Utils.ensureUniquePracticeReference,
        listTakenPracticeReferences: Utils.listTakenPracticeReferences,
        excludePracticeId: draft.editingPracticeId || '',
        excludeSessionId: activeSessionId
      });
    }
    const matchedClient = getClientById(draft.clientId);
    const baseReference = matchedClient
      ? Utils.buildPracticeReference(matchedClient.numberingRule, draft.practiceDate)
      : Utils.buildFallbackPracticeReference(draft.clientName || 'PR', state.practices, draft.practiceDate);
    if (Utils && typeof Utils.ensureUniquePracticeReference === 'function' && typeof Utils.listTakenPracticeReferences === 'function') {
      return Utils.ensureUniquePracticeReference(baseReference, {
        takenReferences: Utils.listTakenPracticeReferences(state, {
          excludePracticeId: draft.editingPracticeId || '',
          excludeSessionId: activeSessionId
        }),
        fallbackPrefix: Utils.deriveClientPrefix ? Utils.deriveClientPrefix(draft.clientName || 'PR') : 'PR',
        dateValue: draft.practiceDate
      });
    }
    return baseReference;
  }

  function loadPracticeIntoDraft(practiceId, options = {}) {
    if (PracticeWorkspace && typeof PracticeWorkspace.openPracticeSession === 'function') {
      const session = PracticeWorkspace.openPracticeSession(state, practiceId, {
        createDraft: buildDraftFromPractice,
        createEmptyDraft: createEmptyPracticeDraft,
        source: options.source || state.practiceOpenSource || 'manual',
        refreshExisting: options.refreshExisting === true,
        reuseActiveSession: Boolean(options.reuseActiveSession),
        practiceTab: options.practiceTab || ''
      });
      if (!session) return;
      state.selectedPracticeId = practiceId;
      state.practiceTab = options.practiceTab || 'practice';
      state._practiceValidationErrors = [];
      state.practiceDuplicateSource = null;
      PracticeWorkspace.syncActiveDraft(state, { createEmptyDraft: createEmptyPracticeDraft });
      return;
    }
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
      attachmentOwnerKey: practice.attachmentOwnerKey || practice.id || (PracticeAttachments && typeof PracticeAttachments.createDraftOwnerKey === 'function' ? PracticeAttachments.createDraftOwnerKey() : ''),
      linkedEntities: MasterDataEntities && typeof MasterDataEntities.hydratePracticeLinkedEntities === 'function'
        ? MasterDataEntities.hydratePracticeLinkedEntities(state, practice)
        : { ...((practice && practice.linkedEntities) || {}) },
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

    if (normalized !== 'practices' && normalized !== 'practices/workspace') {
      state.pendingPracticeFieldFocus = null;
      if (typeof state._persistActivePracticeDraft === 'function') state._persistActivePracticeDraft = null;
    }

    if (normalized !== 'master-data' && state.masterDataModule && state.masterDataModule.quickAddContext && options.preserveQuickAddContext !== true) {
      const returnRoute = String(state.masterDataModule.quickAddContext.returnRoute || 'practices').trim() || 'practices';
      if (normalized !== returnRoute) state.masterDataModule.quickAddContext = null;
    }

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

  function bindPracticeListEvents() {
    const filters = currentPracticeListFilters();
    const primaryInputIds = ['practiceListQuick', 'practiceListReference', 'practiceListClient', 'practiceListImporter', 'practiceListExporter', 'practiceListConsignee', 'practiceListContainer', 'practiceListBooking', 'practiceListPolicy', 'practiceListVessel', 'practiceListOrigin', 'practiceListDestination', 'practiceListDateFrom', 'practiceListDateTo', 'practiceListCompareDateFrom', 'practiceListCompareDateTo'];

    main.querySelectorAll('[data-practice-list-preset]').forEach((node) => {
      if (node.dataset.boundPracticeListPreset === '1') return;
      node.dataset.boundPracticeListPreset = '1';
      node.addEventListener('click', () => {
        const presetId = String(node.dataset.practiceListPreset || '').trim() || 'all';
        const nextFilters = PracticeListPresets && typeof PracticeListPresets.applyPreset === 'function'
          ? PracticeListPresets.applyPreset(currentPracticeListFilters(), presetId)
          : currentPracticeListFilters();
        state.practiceListFilters = { ...currentPracticeListFilters(), ...nextFilters };
        state.filterText = state.practiceListFilters.quick || '';
        state.statusFilter = state.practiceListFilters.status === 'all' ? 'Tutti' : (state.practiceListFilters.status || 'Tutti');
        save();
        render();
        toast(I18N.t('ui.practiceListPresetApplied', 'Vista rapida applicata'), 'info');
      });
    });

    main.querySelectorAll('[data-practice-list-filter]').forEach((node) => {
      const filterKey = String(node.dataset.practiceListFilter || '').trim();
      if (!filterKey || node.dataset.boundPracticeListFilter === '1') return;
      node.dataset.boundPracticeListFilter = '1';
      const handler = (event) => {
        filters[filterKey] = event.target.value || '';
        if (filterKey === 'quick') state.filterText = filters[filterKey];
        if (filterKey === 'status') state.statusFilter = filters[filterKey] === 'all' ? 'Tutti' : (filters[filterKey] || 'Tutti');
        save();
        const targetId = event.target.id || '';
        if (primaryInputIds.includes(targetId)) {
          rerenderPreservingInput(targetId, event.target.selectionStart, event.target.selectionEnd);
        } else {
          render();
        }
      };
      const eventName = node.tagName === 'SELECT' ? 'change' : (node.type === 'date' ? 'change' : 'input');
      node.addEventListener(eventName, handler);
    });

    if (PracticeOpenEdit && typeof PracticeOpenEdit.bindOpenTriggers === 'function') {
      PracticeOpenEdit.bindOpenTriggers({ main, openPracticeForEditing });
    } else {
      main.querySelectorAll('[data-open-practice-id]').forEach((node) => {
        node.addEventListener('click', (event) => {
          event.stopPropagation();
          const practiceId = node.dataset.openPracticeId;
          openPracticeForEditing(practiceId, { source: 'list' });
        });
      });
    }
  }

  function bindPracticeEvents() {
    const PracticeImportFoundation = window.KedrixOnePracticeImportFoundation || null;
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

    function refreshContainerIntegrityState() {
      if (!dynamicFields || !PracticeContainerIntegrity || typeof PracticeContainerIntegrity.applyFieldState !== 'function') return;
      PracticeContainerIntegrity.applyFieldState({
        root: dynamicFields,
        state,
        draft,
        i18n: I18N
      });
    }

    function refreshWeightIntegrityState() {
      if (!dynamicFields || !PracticeWeightIntegrity || typeof PracticeWeightIntegrity.applyFieldState !== 'function') return;
      PracticeWeightIntegrity.applyFieldState({
        root: dynamicFields,
        draft,
        i18n: I18N
      });
    }

    function refreshFieldRelationState() {
      if (!dynamicFields || !PracticeFieldRelations || typeof PracticeFieldRelations.applyFieldState !== 'function') return;
      PracticeFieldRelations.applyFieldState({
        root: dynamicFields,
        type: draft.practiceType || '',
        draft,
        state,
        companyConfig: state.companyConfig,
        i18n: I18N,
        utils: Utils
      });
    }

    function renderDynamicPanels() {
      if (!dynamicFields) return;
      const activeTab = state.practiceTab || 'practice';
      dynamicFields.innerHTML = renderDynamicFieldsHTML(draft.practiceType || '', activeTab, draft);
      updateVerificationBannerState(draft);
      refreshValidationState();
      if (activeTab === 'attachments') {
        if (PracticeAttachments && typeof PracticeAttachments.bind === 'function') {
          PracticeAttachments.bind({
            state,
            draft,
            root: dynamicFields,
            save,
            toast,
            feedback: AppFeedback,
            i18n: I18N,
            rerender: () => renderDynamicPanels()
          });
        }
        return;
      }
      bindDynamicPersistence();
      refreshContainerIntegrityState();
      refreshWeightIntegrityState();
      refreshFieldRelationState();
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
          refreshValidation: shouldRefreshValidation ? refreshValidationState : null,
          resolveCategoryOptions: getPracticeCategoryOptions
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
      if (options.markDirty !== false) markActivePracticeSessionDirty(true);
    }

    function normalizeDynamicFieldValue(fieldName, rawValue, node) {
      let nextValue = rawValue;
      if (draft.practiceType && typeof PracticeSchemas.getField === 'function' && typeof PracticeSchemas.normalizeSuggestedValue === 'function') {
        const field = PracticeSchemas.getField(draft.practiceType, fieldName);
        nextValue = PracticeSchemas.normalizeSuggestedValue(draft.practiceType, field, rawValue, state.companyConfig);
      }
      if (PracticeContainerIntegrity && typeof PracticeContainerIntegrity.normalizeFieldValue === 'function') {
        nextValue = PracticeContainerIntegrity.normalizeFieldValue(fieldName, nextValue, draft);
      }
      const MasterDataEntities = window.KedrixOneMasterDataEntities;
      if (MasterDataEntities && typeof MasterDataEntities.syncDraftRelationField === 'function') {
        MasterDataEntities.syncDraftRelationField({ state, draft, fieldName, value: nextValue });
      }
      if (!Array.isArray(nextValue) && node && nextValue !== node.value) node.value = nextValue;
      return nextValue;
    }

    function flushVisibleDynamicFields(options = {}) {
      if (!dynamicFields || (state.practiceTab || 'practice') === 'attachments') return;
      const normalize = options.normalize !== false;
      const processedCheckboxGroups = new Set();
      dynamicFields.querySelectorAll('input[name], select[name], textarea[name]').forEach((node) => {
        if (!node.name) return;
        if (node.type === 'checkbox') {
          if (processedCheckboxGroups.has(node.name)) return;
          processedCheckboxGroups.add(node.name);
          draft.dynamicData[node.name] = Array.from(dynamicFields.querySelectorAll(`[name="${node.name}"]:checked`)).map((item) => item.value);
          return;
        }
        const rawValue = node.value;
        draft.dynamicData[node.name] = normalize ? normalizeDynamicFieldValue(node.name, rawValue, node) : rawValue;
      });
    }

    state._persistActivePracticeDraft = (options = {}) => {
      if (state.currentRoute !== 'practices') return false;
      persistIdentity({
        refreshValidation: options.refreshValidation !== false,
        markDirty: false
      });
      flushVisibleDynamicFields({ normalize: options.normalize !== false });
      if (options.markDirty !== false) markActivePracticeSessionDirty(true);
      save();
      updateVerificationBannerState(draft);
      if (options.refreshValidation !== false) refreshValidationState();
      refreshContainerIntegrityState();
      refreshWeightIntegrityState();
      refreshFieldRelationState();
      return true;
    };

    function bindDynamicPersistence() {
      if (!dynamicFields) return;
      if (PracticePersistence && typeof PracticePersistence.bindDynamicFieldPersistence === 'function') {
        PracticePersistence.bindDynamicFieldPersistence({
          root: dynamicFields,
          draft,
          normalizeValue: normalizeDynamicFieldValue,
          save: () => {
            markActivePracticeSessionDirty(true);
            save();
            refreshValidationState();
            refreshContainerIntegrityState();
            refreshWeightIntegrityState();
            refreshFieldRelationState();
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
            if (normalize) nextValue = normalizeDynamicFieldValue(node.name, nextValue, node);
            draft.dynamicData[node.name] = nextValue;
          }
          markActivePracticeSessionDirty(true);
          save();
          updateVerificationBannerState(draft);
          refreshValidationState();
          refreshContainerIntegrityState();
          refreshWeightIntegrityState();
          refreshFieldRelationState();
        };
        node.addEventListener('input', () => persistNodeValue(false));
        node.addEventListener('change', () => persistNodeValue(true));
        node.addEventListener('blur', () => persistNodeValue(true));
      });
    }

    if (PracticeImportFoundation && typeof PracticeImportFoundation.bind === 'function') {
      PracticeImportFoundation.bind({
        state,
        root: main,
        save,
        render,
        toast,
        i18n: I18N
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
      const nextTab = String(state.practiceTab || '').trim() || resolveDefaultPracticeTab(draft);
      state.practiceTab = nextTab;
      setActivePracticeSessionTab(nextTab);
      state._practiceValidationErrors = [];
      clearValidationState();
      persistIdentity({ refreshValidation: false });
      render();
    });

    clientName?.addEventListener('input', () => {
      const match = syncClientMatch(clientName.value || '');
      if (clientId) clientId.value = match ? match.id : '';
      persistIdentity();
      refreshFieldRelationState();
    });

    practiceDate?.addEventListener('change', () => persistIdentity());
    category?.addEventListener('input', () => persistIdentity());
    category?.addEventListener('change', () => persistIdentity());
    practiceStatus?.addEventListener('change', () => persistIdentity());

    main.querySelectorAll('[data-practice-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        if (typeof state._persistActivePracticeDraft === 'function') {
          state._persistActivePracticeDraft({ markDirty: true, refreshValidation: false, normalize: true });
        }
        state.pendingPracticeFieldFocus = null;
        state.practiceTab = button.dataset.practiceTab;
        setActivePracticeSessionTab(state.practiceTab);
        save();
        render();
      });
    });

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      persistIdentity({ refreshValidation: false });
      flushVisibleDynamicFields({ normalize: true });
      save();
      updateVerificationBannerState(draft);
      refreshContainerIntegrityState();
      refreshWeightIntegrityState();
      refreshFieldRelationState();

      const validation = validatePracticeDraft(draft);
      if (!validation.valid) {
        state._practiceValidationErrors = validation.errors;
        const firstInvalid = validation.errors[0];
        if (firstInvalid && firstInvalid.tab && firstInvalid.tab !== 'identity' && firstInvalid.tab !== state.practiceTab) {
          state.practiceTab = firstInvalid.tab;
          setActivePracticeSessionTab(state.practiceTab);
          render();
        } else {
          applyValidationState(validation.errors);
          if (firstInvalid) focusField(firstInvalid.field, firstInvalid.tab);
        }

        let draftSaved = false;
        if (PracticeSavePipeline && typeof PracticeSavePipeline.saveDraft === 'function') {
          const minimumReady = typeof PracticeSavePipeline.hasMinimumIdentity === 'function'
            ? PracticeSavePipeline.hasMinimumIdentity(draft)
            : Boolean(String(draft.practiceType || '').trim() && String(draft.clientName || '').trim() && String(draft.practiceDate || '').trim());
          if (minimumReady) {
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
              syncNumberingRuleToReference: Utils.syncNumberingRuleToReference,
              nextLogId: Utils.nextLogId,
              nowStamp: Utils.nowStamp,
              toast,
              save,
              render,
              loadPracticeIntoDraft,
              focusPracticeEditor,
              syncSavedPracticeSessions,
              saveMode: 'draft',
              validationErrors: validation.errors
            });
            if (result.ok) {
              draftSaved = true;
              markActivePracticeSessionDirty(false);
              if (result.record && PracticeAttachments && typeof PracticeAttachments.syncRecordSummary === 'function') {
                PracticeAttachments.syncRecordSummary(state, result.record);
              }
            } else if (Array.isArray(result.errors) && result.errors.length) {
              state._practiceValidationErrors = result.errors;
              applyValidationState(result.errors);
            }
          }
        }
        toast(
          draftSaved
            ? I18N.t('ui.validationSavedAsDraft', 'Bozza salvata: completa i controlli evidenziati.')
            : I18N.t('ui.validationBlockedSave', 'Salvataggio bloccato: completa i controlli evidenziati.'),
          'warning'
        );
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
          syncNumberingRuleToReference: Utils.syncNumberingRuleToReference,
          nextLogId: Utils.nextLogId,
          nowStamp: Utils.nowStamp,
          toast,
          save,
          render,
          loadPracticeIntoDraft,
          focusPracticeEditor,
          syncSavedPracticeSessions,
          saveMode: 'final',
          validationErrors: []
        });
        if (!result.ok && Array.isArray(result.errors) && result.errors.length) {
          state._practiceValidationErrors = result.errors;
          applyValidationState(result.errors);
        } else if (result.ok) {
          markActivePracticeSessionDirty(false);
          if (result.record && PracticeAttachments && typeof PracticeAttachments.syncRecordSummary === 'function') {
            PracticeAttachments.syncRecordSummary(state, result.record);
          }
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

      const provisionalReference = String(draft.generatedReference || buildCurrentPracticeReference() || '').trim();
      draft.generatedReference = Utils && typeof Utils.ensureUniquePracticeReference === 'function' && typeof Utils.listTakenPracticeReferences === 'function'
        ? Utils.ensureUniquePracticeReference(provisionalReference, {
            takenReferences: Utils.listTakenPracticeReferences(state, {
              excludePracticeId: draft.editingPracticeId || '',
              excludeSessionId: state?.practiceWorkspace?.activeSessionId || ''
            }),
            fallbackPrefix: Utils.deriveClientPrefix ? Utils.deriveClientPrefix(draft.clientName || 'PR') : 'PR',
            dateValue: draft.practiceDate
          })
        : provisionalReference;

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
        transportUnitType: draft.dynamicData.transportUnitType || '',
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
        dynamicLabels,
        attachmentOwnerKey: draft.attachmentOwnerKey || draft.editingPracticeId || '',
        attachmentCount: (state.practiceAttachmentIndex?.[draft.attachmentOwnerKey || draft.editingPracticeId || ''] || []).length
      };

      const matchedClient = getClientById(draft.clientId);
      if (matchedClient && !draft.editingPracticeId) Utils.commitPracticeNumber(matchedClient.numberingRule, draft.practiceDate, record.reference);

      if (draft.editingPracticeId) {
        const index = state.practices.findIndex((item) => item.id === draft.editingPracticeId);
        if (index >= 0) state.practices[index] = record;
        state.operatorLogs.unshift({
          id: Utils.nextLogId(state.operatorLogs),
          when: Utils.nowStamp(),
          practiceId: record.id,
          text: `${I18N.getLanguage() === 'en' ? 'Practice updated' : 'Pratica aggiornata'} ${record.reference}.`
        });
        toast(I18N.t('ui.practiceUpdated', 'Pratica aggiornata correttamente'), 'success');
      } else {
        state.practices.unshift(record);
        state.operatorLogs.unshift({
          id: Utils.nextLogId(state.operatorLogs),
          when: Utils.nowStamp(),
          practiceId: record.id,
          text: `${I18N.getLanguage() === 'en' ? 'Practice created' : 'Creata pratica'} ${record.reference}.`
        });
        toast(I18N.t('ui.practiceSaved', 'Pratica salvata correttamente'), 'success');
      }

      markActivePracticeSessionDirty(false);
      if (PracticeAttachments && typeof PracticeAttachments.syncRecordSummary === 'function') {
        PracticeAttachments.syncRecordSummary(state, record);
      }
      state.selectedPracticeId = record.id;
      loadPracticeIntoDraft(record.id, { reuseActiveSession: true, source: 'save' });
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

    const pendingFocus = state.pendingPracticeFieldFocus;
    const activeSessionId = String(state.practiceWorkspace?.activeSessionId || '').trim();
    if (pendingFocus && (!pendingFocus.sessionId || pendingFocus.sessionId === activeSessionId)) {
      state.pendingPracticeFieldFocus = null;
      const targetTab = String(pendingFocus.tab || 'practice').trim() || 'practice';
      if (targetTab && targetTab !== 'identity' && targetTab !== state.practiceTab) {
        state.practiceTab = targetTab;
        setActivePracticeSessionTab(state.practiceTab);
        save();
        render();
        return;
      }
      requestAnimationFrame(() => focusField(String(pendingFocus.fieldName || '').trim(), targetTab));
    }
  }



function currentDocumentBundles() {
  if (!DocumentEngine || typeof DocumentEngine.buildBundles !== 'function') return [];
  return DocumentEngine.buildBundles(state, I18N);
}

function currentDocumentResults() {
  return documentSearchResults();
}

function activeDocumentBundle() {
  const query = String(state.documentSearchQuery || '').trim();
  const bundles = currentDocumentBundles();
  const results = query ? currentDocumentResults() : bundles;
  const activeKey = state.documentPreviewPracticeId || results[0]?.practiceId || results[0]?.bundleKey || bundles[0]?.practiceId || bundles[0]?.bundleKey || '';
  return results.find((item) => (item.practiceId || item.bundleKey) === activeKey)
    || bundles.find((item) => (item.practiceId || item.bundleKey) === activeKey)
    || null;
}

function ensureDocumentPreviewSelection() {
  const bundle = activeDocumentBundle();
  const docs = bundle ? ((bundle.matchedDocumentsCount ? bundle.matchedDocuments : bundle.documents) || []) : [];
  if (!bundle) {
    if (state.documentPreviewPracticeId || state.documentPreviewAttachmentId) {
      state.documentPreviewPracticeId = '';
      state.documentPreviewAttachmentId = '';
      save();
    }
    return;
  }
  const activeKey = bundle.practiceId || bundle.bundleKey || '';
  const validAttachment = docs.some((item) => item.id === state.documentPreviewAttachmentId);
  let changed = false;
  if (state.documentPreviewPracticeId !== activeKey) {
    state.documentPreviewPracticeId = activeKey;
    changed = true;
  }
  if (!validAttachment) {
    const nextAttachmentId = docs[0]?.id || '';
    if (state.documentPreviewAttachmentId !== nextAttachmentId) {
      state.documentPreviewAttachmentId = nextAttachmentId;
      changed = true;
    }
  }
  if (changed) save();
}

function renderDocumentPreviewPanel() {
  const host = document.getElementById('documentPreviewHost');
  if (!host) return;
  const bundle = activeDocumentBundle();
  const docs = bundle ? ((bundle.matchedDocumentsCount ? bundle.matchedDocuments : bundle.documents) || []) : [];
  const activeDoc = docs.find((item) => item.id === state.documentPreviewAttachmentId) || docs[0] || null;
  if (!activeDoc) {
    host.innerHTML = `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.selectDocumentBundle', 'Seleziona un bundle documentale dalla colonna sinistra.'))}</div>`;
    return;
  }
  if (activeDoc.isReferenceOnly) {
    if (DocumentPreview && typeof DocumentPreview.revokePreviewUrl === 'function') DocumentPreview.revokePreviewUrl();
    host.innerHTML = `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.documentReferenceOnlyHint', 'Riferimento documentale importato: allega il file binario in un secondo momento.'))}</div>`;
    return;
  }
  if (!DocumentPreview || typeof DocumentPreview.render !== 'function') return;
  DocumentPreview.render({
    host,
    attachmentId: state.documentPreviewAttachmentId,
    attachments: PracticeAttachments,
    i18n: I18N
  });
}

  function bindDocumentEvents() {
    const input = document.getElementById('documentSearchQuery');

    input?.addEventListener('input', (event) => {
      state.documentSearchQuery = event.target.value || '';
      state.documentPreviewPracticeId = '';
      state.documentPreviewAttachmentId = '';
      save();
      render();
    });

    main.querySelectorAll('[data-document-preview]').forEach((button) => {
      button.addEventListener('click', () => {
        state.documentPreviewPracticeId = button.dataset.documentPreview || '';
        state.documentPreviewAttachmentId = '';
        save();
        render();
      });
    });

    main.querySelectorAll('[data-document-preview-file]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        state.documentPreviewAttachmentId = button.dataset.documentPreviewFile || '';
        save();
        render();
      });
    });

    main.querySelectorAll('[data-document-open]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
          if (PracticeAttachments && typeof PracticeAttachments.openAttachment === 'function') {
            await PracticeAttachments.openAttachment({ attachmentId: button.dataset.documentOpen, toast });
          }
        } catch (error) {
          toast(error?.message || I18N.t('ui.attachmentOpenError', 'Unable to open the attachment'), 'warning');
        }
      });
    });

    main.querySelectorAll('[data-document-open-practice]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        queuePracticeOpenFromDocuments(button.dataset.documentOpenPractice);
      });
    });

    if (DocumentReferenceImportFoundation && typeof DocumentReferenceImportFoundation.bind === 'function') {
      DocumentReferenceImportFoundation.bind({
        state,
        root: main,
        save,
        render,
        toast,
        i18n: I18N
      });
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

    if (route !== 'documents' && DocumentPreview && typeof DocumentPreview.revokePreviewUrl === 'function') {
      DocumentPreview.revokePreviewUrl();
    }

    if (route === 'dashboard') {
      main.innerHTML = Templates.dashboard(state, Modules.summary(), licensingSummary());
      return;
    }

    if (route === 'practices') {
      ensurePracticeWorkspace();
      main.innerHTML = Templates.practicesHub(state, module);
      return;
    }

    if (route === 'practices/workspace') {
      ensurePracticeWorkspace();
      if (!hasOpenPracticeWorkspace()) {
        navigate('practices/gestione-pratiche', { replaceHash: true });
        return;
      }
      main.innerHTML = Templates.practices(state, selectedPractice(), filteredPractices(), practiceSearchResults());
      bindPracticeEvents();
      consumePendingPracticeOpen();
      return;
    }

    if (route === 'practices/gestione-pratiche') {
      try {
        main.innerHTML = Templates.practiceList(state, filteredPractices(), practiceListInsights());
        bindPracticeListEvents();
      } catch (error) {
        console.error('Gestione pratiche render error', error);
        main.innerHTML = `
          <section class="hero">
            <div class="hero-meta">HOTFIX AQ2R31 · render guard</div>
            <h2>${Utils.escapeHtml(I18N.t('ui.practiceListTitle', 'Gestione pratiche'))}</h2>
            <p>${Utils.escapeHtml(I18N.t('ui.practiceListRenderErrorHint', 'La vista Gestione pratiche ha intercettato un errore di rendering. Controlla la console e applica il delta AQ2R33.'))}</p>
          </section>
          <section class="panel">
            <div class="panel-head"><div><h3 class="panel-title">${Utils.escapeHtml(I18N.t('ui.renderError', 'Errore di rendering'))}</h3></div></div>
            <div class="empty-text">${Utils.escapeHtml(String(error && error.message ? error.message : error || 'Unknown render error'))}</div>
          </section>`;
      }
      return;
    }

    if (route === 'practices/istruzioni-di-sdoganamento') {
      if (!CustomsInstructionsModule || typeof CustomsInstructionsModule.render !== 'function') {
        main.innerHTML = Templates.submodulePlaceholder(module, routeMeta);
        return;
      }
      CustomsInstructionsModule.ensureState?.(state);
      main.innerHTML = CustomsInstructionsModule.render(state, { i18n: I18N });
      bindCustomsInstructionsEvents();
      return;
    }

    if (route === 'documents') {
      ensureDocumentPreviewSelection();
      main.innerHTML = Templates.documents(state, module, documentSearchResults());
      bindDocumentEvents();
      renderDocumentPreviewPanel();
      return;
    }

    if (route === 'master-data') {
      main.innerHTML = Templates.contacts(state, module);
      bindMasterDataEvents();
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


  async function confirmCloseCustomsInstructionSession(sessionId) {
    if (!CustomsInstructionsWorkspace || typeof CustomsInstructionsWorkspace.hasSessionUnsavedChanges !== 'function') return true;
    const hasUnsaved = CustomsInstructionsWorkspace.hasSessionUnsavedChanges(state, sessionId, {
      createEmptyDraft: () => CustomsInstructionsModule && typeof CustomsInstructionsModule.createEmptyDraft === 'function'
        ? CustomsInstructionsModule.createEmptyDraft(state)
        : {}
    });
    if (!hasUnsaved) return true;
    if (!AppFeedback || typeof AppFeedback.confirm !== 'function') return false;
    return AppFeedback.confirm({
      title: I18N.t('ui.workspaceDirtyCloseTitle', 'Chiudere la maschera con modifiche non salvate?'),
      message: I18N.t('ui.workspaceDirtyCloseMessage', 'Questa maschera contiene modifiche non salvate. Se la chiudi adesso, le modifiche andranno perse.'),
      confirmLabel: I18N.t('ui.workspaceDiscardMask', 'Chiudi senza salvare'),
      cancelLabel: I18N.t('ui.workspaceKeepMask', 'Torna alla maschera'),
      tone: 'warning'
    });
  }

  function bindCustomsInstructionsEvents() {
    if (!CustomsInstructionsModule || typeof CustomsInstructionsModule.bind !== 'function') return;
    CustomsInstructionsModule.bind({
      root: main,
      state,
      save,
      render,
      toast,
      i18n: I18N,
      getSelectedPractice: selectedPractice,
      confirmClose: confirmCloseCustomsInstructionSession
    });
  }

  function bindMasterDataEvents() {
    const MasterDataQuickAdd = getMasterDataQuickAdd();
    if (!MasterDataQuickAdd || typeof MasterDataQuickAdd.bind !== 'function') return;
    MasterDataQuickAdd.bind({
      state,
      root: main,
      save,
      render,
      navigate,
      toast,
      buildCurrentPracticeReference,
      restorePracticeContext: (context = {}) => {
        const resolved = typeof context === 'object' && context !== null
          ? context
          : { returnTab: String(context || 'practice') };
        const returnSessionId = String(resolved.returnSessionId || '').trim();
        if (returnSessionId) {
          switchPracticeDraftSession(returnSessionId);
        }
        state.practiceTab = String(resolved.returnTab || 'practice').trim() || 'practice';
        setActivePracticeSessionTab(state.practiceTab);
        const returnFocusField = String(resolved.returnFocusField || '').trim();
        if (returnFocusField) {
          state.pendingPracticeFieldFocus = {
            fieldName: returnFocusField,
            tab: String(resolved.returnFocusTab || state.practiceTab || 'practice').trim() || 'practice',
            sessionId: returnSessionId || String(state.practiceWorkspace?.activeSessionId || '').trim()
          };
        } else {
          state.pendingPracticeFieldFocus = null;
        }
      },
      markPracticeDirty: (isDirty = true) => markActivePracticeSessionDirty(isDirty),
      i18n: I18N
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
    const documentTypeOptionsEditor = document.getElementById('documentTypeOptionsEditor');
    const saveDocumentTypeOptions = document.getElementById('saveDocumentTypeOptions');
    const resetDocumentTypeOptions = document.getElementById('resetDocumentTypeOptions');

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
      toast(I18N.t('ui.settingsSaved', 'Impostazioni aggiornate correttamente'), 'success');
    });

    activeUserId?.addEventListener('change', (event) => {
      Licensing.setActiveUser(state, event.target.value || '');
      refreshSettingsStateAfterAccessChange();
      toast(I18N.t('ui.activeUserUpdated', 'Utente attivo aggiornato'), 'success');
    });

    languageSelect?.addEventListener('change', (event) => {
      state.language = event.target.value || 'it';
      I18N.setLanguage(state.language);
      normalizePracticeRecordsState();
      save();
      render();
      toast(I18N.t('ui.languageUpdated', 'Lingua aggiornata correttamente'), 'success');
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


saveDocumentTypeOptions?.addEventListener('click', () => {
  if (!DocumentCategories || typeof DocumentCategories.applyOptionsText !== 'function') return;
  DocumentCategories.applyOptionsText(state, documentTypeOptionsEditor?.value || '', I18N);
  save();
  render();
  toast(I18N.t('ui.documentCategoriesSaved', 'Categorie documentali aggiornate correttamente'), 'success');
});

resetDocumentTypeOptions?.addEventListener('click', () => {
  if (!DocumentCategories || typeof DocumentCategories.resetToDefault !== 'function') return;
  DocumentCategories.resetToDefault(state, I18N);
  save();
  render();
  toast(I18N.t('ui.documentCategoriesReset', 'Categorie documentali ripristinate correttamente'), 'success');
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
      toast(I18N.t('ui.numberingSaved', 'Regola numerazione cliente aggiornata correttamente'), 'success');
    });

    main.querySelectorAll('[data-toggle-company-module]').forEach((button) => {
      button.addEventListener('click', () => {
        Licensing.toggleCompanyModule(state, button.dataset.toggleCompanyModule);
        refreshSettingsStateAfterAccessChange();
        toast(I18N.t('ui.companyUpdated', 'Acquisti azienda aggiornati'), 'success');
      });
    });

    main.querySelectorAll('[data-toggle-user-module]').forEach((button) => {
      button.addEventListener('click', () => {
        Licensing.toggleUserModule(state, button.dataset.toggleUserModule);
        refreshSettingsStateAfterAccessChange();
        toast(I18N.t('ui.userModuleUpdated', 'Permessi modulo utente aggiornati'), 'success');
      });
    });

    main.querySelectorAll('[data-toggle-company-submodule]').forEach((button) => {
      button.addEventListener('click', () => {
        const module = Modules.getModule(state.settingsModuleKey);
        if (!module) return;
        Licensing.toggleCompanySubmodule(state, module, button.dataset.toggleCompanySubmodule);
        refreshSettingsStateAfterAccessChange();
        toast(I18N.t('ui.companySubmoduleUpdated', 'Permessi sottomodulo azienda aggiornati'), 'success');
      });
    });

    main.querySelectorAll('[data-toggle-user-submodule]').forEach((button) => {
      button.addEventListener('click', () => {
        const module = Modules.getModule(state.settingsModuleKey);
        if (!module) return;
        Licensing.toggleUserSubmodule(state, module, button.dataset.toggleUserSubmodule);
        refreshSettingsStateAfterAccessChange();
        toast(I18N.t('ui.userSubmoduleUpdated', 'Permessi sottomodulo utente aggiornati'), 'success');
      });
    });

    updateNumberingPreview();
  }

  document.addEventListener('click', async (event) => {
    const sessionSwitch = event.target.closest('[data-practice-session-switch]');
    if (sessionSwitch) {
      switchPracticeDraftSession(sessionSwitch.dataset.practiceSessionSwitch);
      save();
      render();
      focusPracticeEditor('manual', ensureDraftPractice().editingPracticeId || '');
      return;
    }

    const sessionClose = event.target.closest('[data-practice-session-close]');
    if (sessionClose) {
      event.stopPropagation();
      const shouldClose = await confirmClosePracticeSession(sessionClose.dataset.practiceSessionClose);
      if (!shouldClose) return;
      closePracticeDraftSession(sessionClose.dataset.practiceSessionClose);
      save();
      render();
      toast(I18N.t('ui.workspaceMaskClosed', 'Maschera chiusa'), 'info');
      return;
    }

    const nav = event.target.closest('[data-route]');
    if (nav) {
      navigate(nav.dataset.route);
      return;
    }

    const routeAction = event.target.closest('[data-route-action]');
    if (routeAction) {
      if (routeAction.id === 'newPracticeButton') {
        resetPracticeDraft();
        save();
        navigate(routeAction.dataset.routeAction || 'practices/workspace');
        toast(I18N.t('ui.newDraft', 'Nuova pratica'), 'info');
        return;
      }
      navigate(routeAction.dataset.routeAction);
      return;
    }

    const toggle = event.target.closest('[data-module-toggle]');
    if (toggle) {
      toggleModule(toggle.dataset.moduleToggle);
      return;
    }

    const quickAdd = event.target.closest('[data-quick-add-field]');
    const MasterDataQuickAdd = getMasterDataQuickAdd();
    if (quickAdd && MasterDataQuickAdd && typeof MasterDataQuickAdd.prepareQuickAdd === 'function') {
      if (typeof state._persistActivePracticeDraft === 'function') {
        state._persistActivePracticeDraft({ markDirty: true, refreshValidation: false, normalize: true });
      }
      const fieldName = String(quickAdd.dataset.quickAddField || '').trim();
      const quickAddContext = MasterDataQuickAdd.prepareQuickAdd(state, {
        fieldName,
        returnRoute: currentRoute(),
        returnTab: state.practiceTab || 'practice',
        returnSessionId: String(state.practiceWorkspace?.activeSessionId || '').trim(),
        returnFocusField: fieldName,
        returnFocusTab: fieldName === 'clientName' ? 'identity' : (state.practiceTab || 'practice'),
        practiceReference: String(state.draftPractice?.generatedReference || state.draftPractice?.editingPracticeId || '').trim()
      });
      if (!quickAddContext) {
        toast(I18N.t('ui.masterDataQuickAddUnavailable', 'Quick add non disponibile per questo campo.'), 'warning');
        return;
      }
      save();
      navigate('master-data', { preserveQuickAddContext: true });
      return;
    }


    const focusPracticeTabOnly = event.target.closest('[data-focus-practice-tab-only]');
    if (focusPracticeTabOnly) {
      const targetTab = String(focusPracticeTabOnly.dataset.focusPracticeTabOnly || '').trim();
      if (!targetTab) return;
      if (typeof state._persistActivePracticeDraft === 'function') {
        state._persistActivePracticeDraft({ markDirty: true, refreshValidation: false, normalize: true });
      }
      state.practiceTab = targetTab;
      setActivePracticeSessionTab(targetTab);
      delete state.pendingPracticeFieldFocus;
      save();
      render();
      return;
    }


    const focusPracticeField = event.target.closest('[data-focus-practice-field]');
    if (focusPracticeField) {
      const fieldName = String(focusPracticeField.dataset.focusPracticeField || '').trim();
      const targetTab = String(focusPracticeField.dataset.focusPracticeTab || 'practice').trim() || 'practice';
      if (!fieldName) return;
      state.practiceTab = targetTab;
      setActivePracticeSessionTab(targetTab);
      state.pendingPracticeFieldFocus = {
        fieldName,
        tab: targetTab,
        sessionId: String(state.practiceWorkspace?.activeSessionId || '').trim()
      };
      save();
      render();
      return;
    }

    const linkPracticeEntity = event.target.closest('[data-link-practice-entity-field]');
    const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const CustomsInstructionsWorkspace = window.KedrixOneCustomsInstructionsWorkspace || null;
  const CustomsInstructionsModule = window.KedrixOneCustomsInstructionsModule || null;
    if (linkPracticeEntity && MasterDataEntities && typeof MasterDataEntities.getEntityRecordById === 'function' && typeof MasterDataEntities.applyLinkedRecordToDraft === 'function') {
      if (typeof state._persistActivePracticeDraft === 'function') {
        state._persistActivePracticeDraft({ markDirty: true, refreshValidation: false, normalize: true });
      }
      const fieldName = String(linkPracticeEntity.dataset.linkPracticeEntityField || '').trim();
      const recordId = String(linkPracticeEntity.dataset.linkPracticeEntityId || '').trim();
      const entityKey = typeof MasterDataEntities.resolveEntityKeyForField === 'function'
        ? MasterDataEntities.resolveEntityKeyForField(fieldName)
        : '';
      const record = recordId && entityKey
        ? MasterDataEntities.getEntityRecordById(state, entityKey, recordId)
        : null;
      if (!fieldName || !entityKey || !record) {
        toast(I18N.t('ui.linkedPartiesBoardLinkUnavailable', 'Impossibile collegare la scheda anagrafica da questo riquadro.'), 'warning');
        return;
      }
      MasterDataEntities.applyLinkedRecordToDraft({ state, draft: state.draftPractice, fieldName, entityKey, record, value: record.name || record.value || '' });
      markActivePracticeSessionDirty(true);
      save();
      render();
      toast(I18N.t('ui.linkedPartiesBoardLinkSuccess', 'Scheda anagrafica collegata alla pratica.'), 'success');
      return;
    }

    const linkedSummaryToggle = event.target.closest('[data-linked-summary-action="toggle"]');
    if (linkedSummaryToggle) {
      const summaryCard = linkedSummaryToggle.closest('.linked-entity-summary-card');
      const details = summaryCard ? summaryCard.querySelector('.linked-entity-summary-details') : null;
      if (!summaryCard || !details) return;
      const isHidden = details.hasAttribute('hidden');
      if (isHidden) {
        details.removeAttribute('hidden');
        summaryCard.dataset.expanded = 'true';
      } else {
        details.setAttribute('hidden', 'hidden');
        delete summaryCard.dataset.expanded;
      }
      const expandLabel = String(linkedSummaryToggle.dataset.expandLabel || I18N.t('ui.linkedEntitySummaryDetailAction', 'Dettaglio')).trim();
      const collapseLabel = String(linkedSummaryToggle.dataset.collapseLabel || I18N.t('ui.linkedEntitySummaryCollapseAction', 'Nascondi')).trim();
      linkedSummaryToggle.textContent = isHidden ? collapseLabel : expandLabel;
      return;
    }

    const linkedSummaryCopy = event.target.closest('[data-linked-summary-action="copy"]');
    if (linkedSummaryCopy) {
      const LinkedEntitySummary = window.KedrixOneLinkedEntitySummary || null;
      const fieldName = String(linkedSummaryCopy.dataset.linkedSummaryField || '').trim();
      const payload = LinkedEntitySummary && typeof LinkedEntitySummary.buildCopyText === 'function'
        ? LinkedEntitySummary.buildCopyText({ state, draft: state.draftPractice, fieldName, i18n: I18N })
        : '';
      if (!payload) {
        toast(I18N.t('ui.linkedEntitySummaryCopyUnavailable', 'Nessun dato collegato da copiare per questo campo.'), 'warning');
        return;
      }
      const copyWithFallback = async () => {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(payload);
          return true;
        }
        const helper = document.createElement('textarea');
        helper.value = payload;
        helper.setAttribute('readonly', 'readonly');
        helper.style.position = 'absolute';
        helper.style.left = '-9999px';
        document.body.appendChild(helper);
        helper.select();
        const success = document.execCommand('copy');
        document.body.removeChild(helper);
        return success;
      };
      copyWithFallback()
        .then((copied) => {
          toast(copied
            ? I18N.t('ui.linkedEntitySummaryCopySuccess', 'Dati anagrafici copiati negli appunti.')
            : I18N.t('ui.linkedEntitySummaryCopyUnavailable', 'Nessun dato collegato da copiare per questo campo.'), copied ? 'success' : 'warning');
        })
        .catch(() => {
          toast(I18N.t('ui.linkedEntitySummaryCopyError', 'Impossibile copiare i dati anagrafici.'), 'warning');
        });
      return;
    }

    const openLinked = event.target.closest('[data-open-linked-field]');
    if (openLinked && MasterDataQuickAdd && typeof MasterDataQuickAdd.openLinkedRecordFromPractice === 'function') {
      if (typeof state._persistActivePracticeDraft === 'function') {
        state._persistActivePracticeDraft({ markDirty: true, refreshValidation: false, normalize: true });
      }
      const fieldName = String(openLinked.dataset.openLinkedField || '').trim();
      const openLinkedContext = MasterDataQuickAdd.openLinkedRecordFromPractice(state, {
        fieldName,
        returnRoute: currentRoute(),
        returnTab: state.practiceTab || 'practice',
        returnSessionId: String(state.practiceWorkspace?.activeSessionId || '').trim(),
        returnFocusField: fieldName,
        returnFocusTab: fieldName === 'clientName' ? 'identity' : (state.practiceTab || 'practice'),
        practiceReference: String(state.draftPractice?.generatedReference || state.draftPractice?.editingPracticeId || '').trim()
      });
      if (!openLinkedContext) {
        toast(I18N.t('ui.openLinkedRecordUnavailable', 'Nessuna anagrafica collegata da aprire per questo campo.'), 'warning');
        return;
      }
      save();
      navigate('master-data', { preserveQuickAddContext: true });
      return;
    }

    const action = event.target.closest('[data-action]');
    if (!action) return;

    if (action.dataset.action === 'save-backup') {
      save();
      toast(I18N.t('ui.backupUpdated', 'Backup locale aggiornato correttamente'), 'success');
    }

    if (action.dataset.action === 'new-practice-session') {
      resetPracticeDraft({ source: 'new-mask' });
      save();
      render();
      toast(I18N.t('ui.workspaceMaskOpened', 'Nuova maschera aperta'), 'info');
    }

    if (action.dataset.action === 'duplicate-practice-draft') {
      duplicatePracticeDraft();
    }

    if (action.dataset.action === 'reset-demo') {
      const fresh = Data.initialState();
      Object.assign(state, fresh, { practiceTab: 'start' });
      I18N.setLanguage(state.language || 'it');
      normalizePracticeRecordsState();
      state.currentRoute = safeRoute(state.currentRoute);
      ensureCurrentModuleExpanded();
      save();
      render();
      toast(I18N.t('ui.demoReset', 'Dati demo ripristinati correttamente'), 'success');
    }

    if (action.dataset.action === 'reset-practice-draft') {
      resetPracticeDraft();
      save();
      render();
      toast(I18N.t('ui.newDraft', 'Nuova pratica'), 'info');
    }

    if (action.dataset.action === 'reset-practice-list-filters') {
      const defaults = PracticeListAnalytics && typeof PracticeListAnalytics.defaultFilters === 'function'
        ? PracticeListAnalytics.defaultFilters()
        : { quick: '', status: 'all', draftState: 'all', direction: 'all', practiceType: '', reference: '', client: '', importer: '', exporter: '', consignee: '', container: '', booking: '', policy: '', vessel: '', origin: '', destination: '', dateFrom: '', dateTo: '', compareDateFrom: '', compareDateTo: '', sortBy: 'practiceDate', sortDirection: 'desc' };
      state.practiceListFilters = { ...defaults };
      state.filterText = '';
      state.statusFilter = 'Tutti';
      save();
      render();
      toast(I18N.t('ui.practiceListFiltersReset', 'Filtri elenco pratiche azzerati'), 'info');
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
  if (!String(state.draftPractice?.editingPracticeId || '').trim() && !String(state.practiceTab || '').trim()) {
    state.practiceTab = 'start';
  } else if (!String(state.draftPractice?.editingPracticeId || '').trim() && String(state.practiceTab || '').trim() === 'practice' && !hasOpenPracticeWorkspace()) {
    state.practiceTab = 'start';
  }
  I18N.setLanguage(state.language || 'it');
  const recordsNormalized = normalizePracticeRecordsState();
  state.currentRoute = safeRoute(window.location.hash || state.currentRoute);
  ensureCurrentModuleExpanded();
  save();
  render();
  syncHash(true);
})();
