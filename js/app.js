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

  const state = Storage.load(() => Data.initialState());

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

  let runtimePracticeSearchIndex = SearchIndex && typeof SearchIndex.buildIndex === 'function'
    ? SearchIndex.buildIndex(state.practices)
    : [];

  function save() {
    Storage.save(state);
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
      const okQuery = !query || [practice.reference, practice.client, practice.port, practice.id, practice.practiceType, practice.containerCode, practice.booking, practice.customsOffice, practice.goodsDescription].some((value) => Utils.normalize(value).includes(query));
      return okStatus && okQuery;
    });
  }

  function selectedPractice() {
    return state.practices.find((practice) => practice.id === state.selectedPracticeId) || null;
  }

  function rebuildPracticeSearchIndex() {
    if (!SearchIndex || typeof SearchIndex.updateIndex !== 'function') return [];
    runtimePracticeSearchIndex = SearchIndex.updateIndex(state.practices, runtimePracticeSearchIndex);
    return runtimePracticeSearchIndex;
  }

  function practiceSearchResults() {
    const query = String(state.practiceSearchQuery || '').trim();
    if (!query || !SearchIndex || typeof SearchIndex.search !== 'function') return [];
    return SearchIndex.search(query, rebuildPracticeSearchIndex());
  }

  function getClientById(clientId) {
    return (state.clients || []).find((client) => client.id === clientId) || null;
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
    return PracticeSchemas.validateDraft(draft, state.companyConfig);
  }

  function renderDynamicFieldsHTML(type, tab, draft = ensureDraftPractice()) {
    const schema = getPracticeSchema(type);
    if (!schema) {
      return `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.tabInstruction', 'Seleziona una tipologia pratica per caricare i campi corretti.'))}</div>`;
    }

    const fields = (schema.tabs && schema.tabs[tab]) ? schema.tabs[tab] : [];
    if (!fields.length) {
      return `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.noDataYet', 'Nessun dato'))}</div>`;
    }

    return `<div class="dynamic-section-grid">` + fields.map((field) => {
      const label = `${Utils.escapeHtml(I18N.t(field.labelKey, field.name))}${field.required ? ' <span class="required-mark">*</span>' : ''}`;
      const wrapClass = `field${field.full ? ' full' : ''}`;
      const wrapAttrs = `class="${wrapClass}" data-field-wrap="${Utils.escapeHtml(field.name)}" data-field-tab="${Utils.escapeHtml(tab)}"`;
      const fieldOptions = PracticeSchemas.getFieldOptions(type, field, state.companyConfig);
      const currentValue = draft.dynamicData?.[field.name];

      if (field.type === 'derived') {
        return `<div ${wrapAttrs}><label>${label}</label><div class="derived-chip">${Utils.escapeHtml(draft.clientName || I18N.t('ui.clientRequired', 'Cliente'))}</div></div>`;
      }
      if (field.type === 'select-derived') {
        return '';
      }
      if (field.type === 'textarea') {
        return `<div ${wrapAttrs}><label for="dyn_${field.name}">${label}</label><textarea id="dyn_${field.name}" name="${field.name}" rows="4">${Utils.escapeHtml(currentValue || '')}</textarea></div>`;
      }
      if (field.type === 'select') {
        return `<div ${wrapAttrs}><label for="dyn_${field.name}">${label}</label><select id="dyn_${field.name}" name="${field.name}"><option value="">—</option>${fieldOptions.map((option) => `<option value="${Utils.escapeHtml(option)}" ${currentValue === option ? 'selected' : ''}>${Utils.escapeHtml(option)}</option>`).join('')}</select></div>`;
      }
      if (field.type === 'checkbox-group') {
        const currentValues = Array.isArray(currentValue) ? currentValue : [];
        return `<div ${wrapAttrs}><label>${label}</label><div class="checkbox-group">${(field.options || []).map((option) => `<label class="checkbox-chip"><input type="checkbox" name="${field.name}" value="${Utils.escapeHtml(option)}" ${currentValues.includes(option) ? 'checked' : ''} /> ${Utils.escapeHtml(I18N.t(option, option))}</label>`).join('')}</div></div>`;
      }

      const datalistId = fieldOptions.length && field.type !== 'date' && field.type !== 'number' ? `dyn_list_${field.name}` : '';
      const datalistHtml = datalistId ? `<datalist id="${datalistId}">${fieldOptions.map((option) => `<option value="${Utils.escapeHtml(option)}"></option>`).join('')}</datalist>` : '';
      const hintHtml = fieldOptions.length && datalistId ? `<div class="field-hint">${Utils.escapeHtml(I18N.t('ui.clientRuleHint', 'Seleziona un valore coerente con la configurazione operativa.'))}</div>` : '';
      return `<div ${wrapAttrs}><label for="dyn_${field.name}">${label}</label><input id="dyn_${field.name}" name="${field.name}" value="${Utils.escapeHtml(currentValue || '')}" type="${field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}" ${field.type === 'number' ? 'step="0.01" min="0"' : ''} ${datalistId ? `list="${datalistId}"` : ''} />${datalistHtml}${hintHtml}</div>`;
    }).join('') + `</div>`;
  }

  function ensureDraftPractice() {
    if (!state.draftPractice) {
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
    }
    return state.draftPractice;
  }

  function resetPracticeDraft() {
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
  }

  function syncClientMatch(clientName) {
    const clean = String(clientName || '').trim().toUpperCase();
    const match = (state.clients || []).find((client) => String(client.name || '').trim().toUpperCase() === clean) || null;
    const draft = ensureDraftPractice();
    draft.clientId = match ? match.id : '';
    draft.clientName = clientName;
    return match;
  }

  function buildCurrentPracticeReference() {
    const draft = ensureDraftPractice();
    const matchedClient = getClientById(draft.clientId);
    if (matchedClient) return Utils.buildPracticeReference(matchedClient.numberingRule, draft.practiceDate);
    return Utils.buildFallbackPracticeReference(draft.clientName || 'PR', state.practices, draft.practiceDate);
  }

  function loadPracticeIntoDraft(practiceId) {
    const practice = state.practices.find((item) => item.id === practiceId);
    if (!practice) return;
    state.selectedPracticeId = practice.id;
    state.practiceTab = 'practice';
    state._practiceValidationErrors = [];
    state.draftPractice = {
      editingPracticeId: practice.id,
      practiceType: practice.practiceType || '',
      clientId: practice.clientId || '',
      clientName: practice.clientName || practice.client || '',
      practiceDate: practice.practiceDate || practice.eta || new Date().toISOString().slice(0, 10),
      category: practice.category || '',
      status: practice.status || 'Operativa',
      generatedReference: practice.reference || '',
      dynamicData: { ...(practice.dynamicData || {}) }
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
      draft.practiceType = practiceType?.value || '';
      draft.clientName = clientName?.value || '';
      draft.clientId = clientId?.value || '';
      draft.practiceDate = practiceDate?.value || new Date().toISOString().slice(0, 10);
      draft.category = category?.value || '';
      draft.status = practiceStatus?.value || 'In attesa documenti';
      draft.generatedReference = draft.practiceType ? buildCurrentPracticeReference() : '';
      if (generatedReference) generatedReference.value = draft.generatedReference;
      syncDerivedPreviewFields();
      save();
      if (shouldRefreshValidation) refreshValidationState();
    }

    function bindDynamicPersistence() {
      if (!dynamicFields) return;
      dynamicFields.querySelectorAll('input, select, textarea').forEach((node) => {
        if (node.dataset.boundDraft === '1') return;
        node.dataset.boundDraft = '1';
        const handler = () => {
          if (node.type === 'checkbox') {
            draft.dynamicData[node.name] = Array.from(dynamicFields.querySelectorAll(`[name="${node.name}"]:checked`)).map((item) => item.value);
          } else {
            draft.dynamicData[node.name] = node.value;
          }
          save();
          refreshValidationState();
        };
        node.addEventListener('input', handler);
        node.addEventListener('change', handler);
      });
    }

    practiceSearchQuery?.addEventListener('input', (event) => {
      state.practiceSearchQuery = event.target.value || '';
      state.practiceSearchPreviewId = '';
      save();
      rerenderPreservingInput('practiceSearchQuery', event.target.selectionStart, event.target.selectionEnd);
    });

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

      const schema = getPracticeSchema(draft.practiceType);
      const dynamicLabels = {};
      const schemaFields = schema ? PracticeSchemas.getFields(draft.practiceType) : [];
      schemaFields.forEach((field) => {
        if (field.type !== 'derived' && field.type !== 'select-derived') {
          dynamicLabels[field.name] = I18N.t(field.labelKey, field.name);
        }
      });

      const existingRecord = draft.editingPracticeId ? state.practices.find((item) => item.id === draft.editingPracticeId) : null;
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
        portLoading: draft.dynamicData.portLoading || draft.dynamicData.airportDeparture || '',
        portDischarge: draft.dynamicData.portDischarge || draft.dynamicData.airportDestination || '',
        containerCode: draft.dynamicData.containerCode || '',
        packageCount: draft.dynamicData.packageCount || '',
        grossWeight: draft.dynamicData.grossWeight || '',
        goodsDescription: draft.dynamicData.goodsDescription || '',
        booking: draft.dynamicData.booking || '',
        customsOffice: draft.dynamicData.customsOffice || draft.dynamicData.customsOperator || '',
        eta: draft.dynamicData.arrivalDate || draft.dynamicData.deliveryDate || draft.practiceDate,
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
      save();
      render();
    });

    main.querySelectorAll('[data-practice-id]').forEach((node) => {
      node.addEventListener('click', () => {
        const practiceId = node.dataset.practiceId;
        const openedFromSearch = node.classList.contains('practice-search-result');
        loadPracticeIntoDraft(practiceId);
        state._practiceValidationErrors = [];
        state.practiceSearchPreviewId = openedFromSearch ? practiceId : '';
        save();
        render();

        window.requestAnimationFrame(() => {
          const tableRow = main.querySelector(`tr[data-practice-id="${practiceId}"]`);

          if (openedFromSearch) {
            const previewCard = document.getElementById('practiceSearchPreview');
            const activeResult = main.querySelector(`.practice-search-result[data-practice-id="${practiceId}"]`);
            if (previewCard) {
              previewCard.classList.add('flash-focus');
              previewCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              window.setTimeout(() => previewCard.classList.remove('flash-focus'), 1600);
            }
            if (activeResult) {
              activeResult.classList.add('flash-focus');
              window.setTimeout(() => activeResult.classList.remove('flash-focus'), 1600);
            }
            if (tableRow) {
              tableRow.classList.add('flash-row');
              window.setTimeout(() => tableRow.classList.remove('flash-row'), 1600);
            }
            return;
          }

          const detailSection = document.getElementById('practiceDetailSection');
          if (detailSection) {
            detailSection.classList.add('flash-focus');
            detailSection.scrollIntoView({ block: 'start', behavior: 'smooth' });
            window.setTimeout(() => detailSection.classList.remove('flash-focus'), 1600);
          }
          if (tableRow) {
            tableRow.classList.add('flash-row');
            window.setTimeout(() => tableRow.classList.remove('flash-row'), 1600);
          }
        });
      });
    });

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

    if (action.dataset.action === 'reset-demo') {
      const fresh = Data.initialState();
      Object.assign(state, fresh, { practiceTab: 'practice' });
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
  state.currentRoute = safeRoute(window.location.hash || state.currentRoute);
  ensureCurrentModuleExpanded();
  save();
  render();
  syncHash(true);
})();
