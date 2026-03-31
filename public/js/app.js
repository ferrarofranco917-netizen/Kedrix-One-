
(() => {
  'use strict';

  const Storage = window.KedrixOneStorage;
  const Data = window.KedrixOneData;
  const Templates = window.KedrixOneTemplates;
  const state = Storage.load(() => Data.initialState());

  const main = document.getElementById('mainContent');
  const pageTitle = document.getElementById('pageTitle');

  function save(){ Storage.save(state); }

  function toast(title){
    const region = document.getElementById('appToastRegion');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = title;
    region.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  function render(){
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === state.currentRoute);
    });

    pageTitle.textContent = state.currentRoute === 'practices' ? 'Pratiche' : 'Dashboard';

    if(state.currentRoute === 'practices'){
      main.innerHTML = Templates.practices(state);
      bindPracticeView();
    } else {
      main.innerHTML = Templates.dashboard(state);
    }
  }

  function bindPracticeView(){
    const form = document.getElementById('practiceForm');
    const saveBtn = document.getElementById('demoSaveBtn');
    const resetBtn = document.getElementById('demoResetBtn');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      state.practices.unshift({
        id: 'PR-2026-' + String(state.practices.length + 1).padStart(3, '0'),
        reference: String(fd.get('reference') || '').trim(),
        client: String(fd.get('client') || '').trim(),
        type: String(fd.get('type') || '').trim(),
        port: String(fd.get('port') || '').trim(),
        eta: String(fd.get('eta') || '').trim(),
        status: String(fd.get('status') || '').trim()
      });
      save();
      render();
      toast('Pratica salvata');
    });

    saveBtn.addEventListener('click', () => {
      save();
      toast('Backup locale aggiornato');
    });

    resetBtn.addEventListener('click', () => {
      const fresh = Data.initialState();
      state.currentRoute = fresh.currentRoute;
      state.practices = fresh.practices;
      save();
      render();
      toast('Dati demo ripristinati');
    });
  }

  document.addEventListener('click', (e) => {
    const nav = e.target.closest('.nav-tab');
    if(!nav) return;
    state.currentRoute = nav.dataset.route;
    save();
    render();
  });

  render();
})();
