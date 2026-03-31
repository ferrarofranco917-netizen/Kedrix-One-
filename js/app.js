(() => {
  'use strict';

  const Storage = window.KedrixOneStorage;
  const Data = window.KedrixOneData;
  const Utils = window.KedrixOneUtils;
  const Templates = window.KedrixOneTemplates;

  const state = Storage.load(() => Data.initialState());

  const main = document.getElementById('mainContent');
  const title = document.getElementById('pageTitle');
  const toastRegion = document.getElementById('toastRegion');

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

  function filteredPractices() {
    const query = Utils.normalize(state.filterText);

    return state.practices.filter((practice) => {
      const okStatus = state.statusFilter === 'Tutti' || practice.status === state.statusFilter;
      const okQuery =
        !query ||
        [practice.reference, practice.client, practice.port, practice.id]
          .some((value) => Utils.normalize(value).includes(query));

      return okStatus && okQuery;
    });
  }

  function selectedPractice() {
    return state.practices.find((practice) => practice.id === state.selectedPracticeId) || null;
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
        toast('Compila i campi obbligatori.');
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
      toast('Pratica salvata');
    });

    main.querySelectorAll('tbody tr[data-practice-id]').forEach((row) => {
      row.addEventListener('click', () => {
        state.selectedPracticeId = row.dataset.practiceId;
        save();
        render();
      });
    });
  }

  function render() {
    document.querySelectorAll('.nav-tab').forEach((button) => {
      button.classList.toggle('active', button.dataset.route === state.currentRoute);
    });

    if (state.currentRoute === 'dashboard') {
      title.textContent = 'Dashboard';
      main.innerHTML = Templates.dashboard(state);
    } else if (state.currentRoute === 'practices') {
      title.textContent = 'Pratiche';
      main.innerHTML = Templates.practices(state, selectedPractice(), filteredPractices());
      bindPracticeEvents();
    } else if (state.currentRoute === 'contacts') {
      title.textContent = 'Anagrafiche';
      main.innerHTML = Templates.contacts(state);
    } else {
      title.textContent = state.currentRoute.charAt(0).toUpperCase() + state.currentRoute.slice(1);
      main.innerHTML = Templates.placeholder(title.textContent);
    }
  }

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('.nav-tab');
    if (nav) {
      state.currentRoute = nav.dataset.route;
      save();
      render();
      return;
    }

    const routeAction = event.target.closest('[data-route-action]');
    if (routeAction) {
      state.currentRoute = routeAction.dataset.routeAction;
      save();
      render();
      return;
    }

    const action = event.target.closest('[data-action]');
    if (!action) return;

    if (action.dataset.action === 'save-backup') {
      save();
      toast('Backup locale aggiornato');
    }

    if (action.dataset.action === 'reset-demo') {
      const fresh = Data.initialState();
      Object.assign(state, fresh);
      save();
      render();
      toast('Dati demo ripristinati');
    }
  });

  render();
})();
