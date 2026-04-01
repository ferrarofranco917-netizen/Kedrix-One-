(() => {
  'use strict';

  const Storage = window.KedrixOneStorage;
  const Data = window.KedrixOneData;
  const Utils = window.KedrixOneUtils;
  const Modules = window.KedrixOneModules;
  const Licensing = window.KedrixOneLicensing;
  const Templates = window.KedrixOneTemplates;
  const I18N = window.KedrixOneI18N;

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
      const okQuery = !query || [practice.reference, practice.client, practice.port, practice.id].some((value) => Utils.normalize(value).includes(query));
      return okStatus && okQuery;
    });
  }

  function selectedPractice() {
    return state.practices.find((practice) => practice.id === state.selectedPracticeId) || null;
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
    const form = document.getElementById('practiceForm');
    const filter = document.getElementById('filterText');
    const status = document.getElementById('statusFilter');

    filter?.addEventListener('input', (event) => {
      state.filterText = event.target.value || '';
      save();
      render();
    });

    status?.addEventListener('change', (event) => {
      state.statusFilter = event.target.value || 'Tutti';
      save();
      render();
    });

    form?.addEventListener('submit', (event) => {
      event.preventDefault();

      const fd = new FormData(form);
      const practice = {
        id: Utils.nextPracticeId(state.practices),
        reference: String(fd.get('reference') || '').trim(),
        client: String(fd.get('client') || '').trim(),
        type: String(fd.get('type') || '').trim(),
        port: String(fd.get('port') || '').trim(),
        eta: String(fd.get('eta') || '').trim(),
        priority: String(fd.get('priority') || '').trim(),
        status: String(fd.get('status') || '').trim(),
        notes: String(fd.get('notes') || '').trim()
      };

      if (!practice.reference || !practice.client || !practice.port || !practice.eta) {
        toast(I18N.t('ui.search', 'Compila i campi obbligatori.'));
        return;
      }

      state.practices.unshift(practice);
      state.selectedPracticeId = practice.id;
      state.operatorLogs.unshift({
        id: Utils.nextLogId(state.operatorLogs),
        when: Utils.nowStamp(),
        practiceId: practice.id,
        text: `Creata pratica ${practice.reference}.`
      });

      save();
      render();
      toast(I18N.getLanguage() === 'en' ? 'Practice saved' : 'Pratica salvata');
    });

    main.querySelectorAll('tbody tr[data-practice-id]').forEach((row) => {
      row.addEventListener('click', () => {
        state.selectedPracticeId = row.dataset.practiceId;
        save();
        render();
      });
    });
  }

  function bindSettingsEvents() {
    const plan = document.getElementById('companyPlan');
    const activeUser = document.getElementById('activeUserId');
    const settingsModule = document.getElementById('settingsModuleKey');
    const languageSelect = document.getElementById('languageSelect');

    plan?.addEventListener('change', (event) => {
      Licensing.setCompanyPlan(state, event.target.value);
      state.currentRoute = safeRoute(currentRoute());
      save();
      render();
      toast(`${I18N.t('ui.companyPlan', 'Piano azienda')}: ${String(event.target.value).toUpperCase()}`);
    });

    activeUser?.addEventListener('change', (event) => {
      Licensing.setActiveUser(state, event.target.value);
      state.currentRoute = safeRoute(currentRoute());
      save();
      render();
      toast(I18N.t('ui.activeUserUpdated', 'Utente attivo aggiornato'));
    });

    settingsModule?.addEventListener('change', (event) => {
      state.settingsModuleKey = event.target.value;
      save();
      render();
    });

    languageSelect?.addEventListener('change', (event) => {
      state.language = event.target.value;
      I18N.setLanguage(state.language);
      save();
      render();
      toast(I18N.t('ui.languageUpdated', 'Lingua aggiornata'));
    });

    main.querySelectorAll('[data-toggle-company-module]').forEach((button) => {
      button.addEventListener('click', () => {
        Licensing.toggleCompanyModule(state, button.dataset.toggleCompanyModule);
        state.currentRoute = safeRoute(currentRoute());
        save();
        render();
        toast(I18N.t('ui.companyUpdated', 'Acquisti azienda aggiornati'));
      });
    });

    main.querySelectorAll('[data-toggle-user-module]').forEach((button) => {
      button.addEventListener('click', () => {
        Licensing.toggleUserModule(state, button.dataset.toggleUserModule);
        state.currentRoute = safeRoute(currentRoute());
        save();
        render();
        toast(I18N.t('ui.userModuleUpdated', 'Permessi modulo utente aggiornati'));
      });
    });

    const selectedModule = Modules.getModule(state.settingsModuleKey);
    main.querySelectorAll('[data-toggle-company-submodule]').forEach((button) => {
      button.addEventListener('click', () => {
        Licensing.toggleCompanySubmodule(state, selectedModule, button.dataset.toggleCompanySubmodule);
        state.currentRoute = safeRoute(currentRoute());
        save();
        render();
        toast(I18N.t('ui.companySubmoduleUpdated', 'Permessi sottomodulo azienda aggiornati'));
      });
    });

    main.querySelectorAll('[data-toggle-user-submodule]').forEach((button) => {
      button.addEventListener('click', () => {
        Licensing.toggleUserSubmodule(state, selectedModule, button.dataset.toggleUserSubmodule);
        state.currentRoute = safeRoute(currentRoute());
        save();
        render();
        toast(I18N.t('ui.userSubmoduleUpdated', 'Permessi sottomodulo utente aggiornati'));
      });
    });
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
      main.innerHTML = Templates.practices(state, selectedPractice(), filteredPractices());
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
      Object.assign(state, fresh);
      state.currentRoute = safeRoute(state.currentRoute);
      ensureCurrentModuleExpanded();
      save();
      render();
      toast(I18N.t('ui.demoReset', 'Dati demo ripristinati'));
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

  I18N.setLanguage(state.language || 'it');
  state.currentRoute = safeRoute(window.location.hash || state.currentRoute);
  ensureCurrentModuleExpanded();
  save();
  render();
  syncHash(true);
})();