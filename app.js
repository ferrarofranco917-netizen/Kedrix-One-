
(() => {
  'use strict';

  const STORAGE_KEY = 'logiwise.step2.data';
  const ROUTES = {
    dashboard: 'Dashboard',
    practices: 'Pratiche',
    quotes: 'Quotazioni',
    warehouse: 'Magazzino',
    contacts: 'Anagrafiche',
    documents: 'Documenti',
    tracking: 'Tracking',
    reports: 'Report',
    settings: 'Impostazioni'
  };

  const initialState = {
    currentRoute: 'dashboard',
    sidebarOpen: false,
    ui: {
      selectedPracticeId: null,
      practiceFilter: '',
      practiceStatusFilter: 'Tutti',
      practiceSort: 'eta_asc'
    },
    data: {
      practices: [
        {
          id: 'PR-2026-001',
          reference: 'KX-IMP-0001',
          client: 'Michelin Italia',
          type: 'Import',
          mode: 'Sea',
          container: 'MSCU1234567',
          port: 'Genova',
          eta: '2026-04-01',
          priority: 'Alta',
          status: 'In attesa documenti',
          docs: { invoice: true, packingList: false, customsMandate: true, bl: true },
          notes: 'Packing list aggiornata da richiedere al fornitore.',
          timeline: [
            { when: '2026-03-28 09:20', text: 'Pratica creata' },
            { when: '2026-03-29 14:10', text: 'Documentazione iniziale ricevuta' }
          ]
        },
        {
          id: 'PR-2026-002',
          reference: 'KX-EXP-0002',
          client: 'Monge & C. S.p.A.',
          type: 'Export',
          mode: 'Road',
          container: '',
          port: 'Fossano',
          eta: '2026-04-03',
          priority: 'Media',
          status: 'Operativa',
          docs: { invoice: true, packingList: true, customsMandate: true, bl: false },
          notes: 'Verificare ritiro e conferma mezzo.',
          timeline: [
            { when: '2026-03-29 10:00', text: 'Ritiro pianificato' }
          ]
        },
        {
          id: 'PR-2026-003',
          reference: 'KX-IMP-0003',
          client: 'Aprica S.p.A.',
          type: 'Import',
          mode: 'Sea',
          container: 'MSCU1234567',
          port: 'La Spezia',
          eta: '2026-03-31',
          priority: 'Alta',
          status: 'Sdoganamento',
          docs: { invoice: true, packingList: true, customsMandate: false, bl: true },
          notes: 'Container duplicato su altra pratica, verificare allineamento dati.',
          timeline: [
            { when: '2026-03-30 08:45', text: 'Documenti doganali in verifica' }
          ]
        }
      ],
      logs: []
    }
  };

  const state = loadState();
  const dom = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    bindEvents();
    if (!state.ui.selectedPracticeId && state.data.practices.length) {
      state.ui.selectedPracticeId = state.data.practices[0].id;
    }
    render();
    registerServiceWorker();
  }

  function cacheDom() {
    dom.sidebar = document.getElementById('sidebar');
    dom.sidebarBackdrop = document.getElementById('sidebarBackdrop');
    dom.sidebarOpenBtn = document.getElementById('sidebarOpenBtn');
    dom.sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    dom.mainContent = document.getElementById('mainContent');
    dom.pageTitle = document.getElementById('pageTitle');
    dom.quickAddBtn = document.getElementById('quickAddBtn');
    dom.toastRegion = document.getElementById('appToastRegion');
    dom.emptyModuleTemplate = document.getElementById('emptyModuleTemplate');
  }

  function bindEvents() {
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);
  }

  function onClick(event) {
    const nav = event.target.closest('.nav-tab');
    if (nav) {
      setRoute(nav.dataset.route);
      return;
    }

    if (event.target.closest('#sidebarOpenBtn')) {
      openSidebar();
      return;
    }

    if (event.target.closest('#sidebarCloseBtn') || event.target.closest('#sidebarBackdrop')) {
      closeSidebar();
      return;
    }

    const routeBtn = event.target.closest('[data-action-route]');
    if (routeBtn) {
      setRoute(routeBtn.dataset.actionRoute);
      return;
    }

    if (event.target.closest('#quickAddBtn')) {
      setRoute('practices');
      requestAnimationFrame(() => {
        const reference = document.getElementById('practiceReference');
        if (reference) reference.focus();
      });
      return;
    }

    const fillBtn = event.target.closest('[data-action="prefill-practice"]');
    if (fillBtn) {
      prefillPracticeForm();
      return;
    }

    const saveBackupBtn = event.target.closest('[data-action="save-local-backup"]');
    if (saveBackupBtn) {
      saveState();
      toast('Backup locale aggiornato', 'I dati correnti sono stati salvati nello storage locale.', 'success');
      return;
    }

    const resetDemoBtn = event.target.closest('[data-action="reset-demo"]');
    if (resetDemoBtn) {
      resetToDemoData();
      return;
    }

    const practiceRow = event.target.closest('[data-practice-select]');
    if (practiceRow) {
      selectPractice(practiceRow.dataset.practiceSelect);
      return;
    }

    const editBtn = event.target.closest('[data-action="load-selected-into-form"]');
    if (editBtn) {
      loadSelectedPracticeIntoForm();
      return;
    }

    const addTimelineBtn = event.target.closest('[data-action="add-timeline-note"]');
    if (addTimelineBtn) {
      addTimelineNote();
      return;
    }

    const nextStatusBtn = event.target.closest('[data-action="advance-status"]');
    if (nextStatusBtn) {
      advanceSelectedPracticeStatus();
      return;
    }
  }

  function onSubmit(event) {
    const form = event.target.closest('#practiceForm');
    if (!form) return;
    event.preventDefault();
    savePractice(form);
  }

  function onInput(event) {
    if (event.target.id === 'practiceSearch') {
      state.ui.practiceFilter = event.target.value || '';
      render();
      return;
    }
  }

  function onChange(event) {
    if (event.target.id === 'practiceStatusFilter') {
      state.ui.practiceStatusFilter = event.target.value || 'Tutti';
      render();
      return;
    }
    if (event.target.id === 'practiceSort') {
      state.ui.practiceSort = event.target.value || 'eta_asc';
      render();
      return;
    }
  }

  function onResize() {
    if (window.innerWidth > 980) closeSidebar(true);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      closeSidebar();
    }
  }

  function render() {
    updateNavState();
    dom.pageTitle.textContent = ROUTES[state.currentRoute] || 'LogiWise';

    switch (state.currentRoute) {
      case 'dashboard':
        dom.mainContent.innerHTML = renderDashboard();
        break;
      case 'practices':
        dom.mainContent.innerHTML = renderPractices();
        break;
      default:
        dom.mainContent.innerHTML = renderPlaceholder(state.currentRoute);
        break;
    }

    dom.mainContent.focus({ preventScroll: true });
  }

  function renderDashboard() {
    const alerts = computeAlerts();
    const kpi = computeKpi();
    const upcoming = getVisiblePractices().slice(0, 5);
    const selected = getSelectedPractice();

    return `
      <section class="view-stack">
        <section class="hero-panel">
          <div class="hero-content">
            <span class="eyebrow">Operational control</span>
            <h2 class="hero-title">Base approvata di STEP 1, ora resa più operativa senza toccare la grafica.</h2>
            <p class="hero-text">
              Lo stile rimane congelato. In STEP 2 aggiungiamo selezione pratica, stato operativo,
              timeline e strumenti reali per lavorare senza regressioni visive.
            </p>
            <div class="action-row">
              <button class="primary-button" type="button" data-action-route="practices">Apri pratiche</button>
              <button class="secondary-button" type="button" data-action="save-local-backup">Salva backup locale</button>
            </div>
          </div>

          <div class="hero-side">
            <div class="stat-card">
              <span class="stat-label">WiseMind alerts</span>
              <span class="stat-value">${alerts.length}</span>
              <span class="stat-hint">Segnalazioni raggruppate per operatività, documenti e duplicati.</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Pratica selezionata</span>
              <span class="stat-value">${selected ? escapeHtml(selected.reference) : '—'}</span>
              <span class="stat-hint">${selected ? escapeHtml(selected.client) : 'Nessuna pratica selezionata'}</span>
            </div>
          </div>
        </section>

        <section class="stat-grid" aria-label="KPI">
          <article class="stat-card">
            <span class="stat-label">Totale pratiche</span>
            <span class="stat-value">${kpi.total}</span>
            <span class="stat-hint">Dataset operativo attuale.</span>
          </article>
          <article class="stat-card">
            <span class="stat-label">Import / Export</span>
            <span class="stat-value">${kpi.importExport}</span>
            <span class="stat-hint">Distribuzione flussi.</span>
          </article>
          <article class="stat-card">
            <span class="stat-label">Documenti mancanti</span>
            <span class="stat-value">${kpi.missingDocs}</span>
            <span class="stat-hint">Da completare senza bloccare il lavoro.</span>
          </article>
          <article class="stat-card">
            <span class="stat-label">ETA entro 72h</span>
            <span class="stat-value">${kpi.etaSoon}</span>
            <span class="stat-hint">Priorità operative ravvicinate.</span>
          </article>
        </section>

        <section class="two-col">
          <article class="panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">WiseMind™ · Alert operativi</h3>
                <p class="panel-subtitle">Base STEP 1 mantenuta, con ordinamento logico e stessa UX approvata.</p>
              </div>
            </div>
            <div class="alert-list">
              ${alerts.length ? alerts.map(renderAlert).join('') : `
                <div class="alert-item success">
                  <div class="alert-top"><span class="alert-title">Nessuna criticità</span><span class="badge success">OK</span></div>
                  <div class="alert-text">I dati attuali non mostrano anomalie rilevanti.</div>
                </div>
              `}
            </div>
          </article>

          <article class="panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">Agenda operativa</h3>
                <p class="panel-subtitle">Seleziona una pratica per vederne il dettaglio nello step operativo.</p>
              </div>
            </div>
            <div class="activity-list">
              ${upcoming.map(practice => `
                <button class="activity-item practice-card-button ${state.ui.selectedPracticeId === practice.id ? 'is-selected' : ''}" type="button" data-practice-select="${escapeHtml(practice.id)}">
                  <div class="activity-top">
                    <span class="activity-title">${escapeHtml(practice.client)}</span>
                    <span class="badge ${badgeSeverityForStatus(practice.status)}">${escapeHtml(practice.status)}</span>
                  </div>
                  <div class="activity-text">${escapeHtml(practice.reference)} · ${escapeHtml(practice.port)} · ETA ${formatDate(practice.eta)}</div>
                </button>
              `).join('')}
            </div>
          </article>
        </section>
      </section>
    `;
  }

  function renderPractices() {
    const alerts = computeAlerts().slice(0, 4);
    const visiblePractices = getVisiblePractices();
    const selected = getSelectedPractice();

    return `
      <section class="view-stack">
        <section class="hero-panel">
          <div class="hero-content">
            <span class="eyebrow">Practice module</span>
            <h2 class="hero-title">Più operatività, stessa grafica blindata di STEP 1.</h2>
            <p class="hero-text">
              Aggiungiamo ricerca, filtro, ordinamento, selezione pratica, editing veloce e timeline minima,
              senza alterare il design approvato.
            </p>
            <div class="action-row">
              <button class="primary-button" type="button" data-action="prefill-practice">Prefill demo</button>
              <button class="secondary-button" type="button" data-action="save-local-backup">Salva backup locale</button>
              <button class="secondary-button" type="button" data-action="reset-demo">Reset dati demo</button>
            </div>
          </div>
          <div class="hero-side">
            <div class="stat-card">
              <span class="stat-label">Records visibili</span>
              <span class="stat-value">${visiblePractices.length}</span>
              <span class="stat-hint">Filtro e ordinamento attivi senza refresh pagina.</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Pratica attiva</span>
              <span class="stat-value">${selected ? escapeHtml(selected.id) : '—'}</span>
              <span class="stat-hint">${selected ? escapeHtml(selected.client) : 'Nessuna pratica selezionata'}</span>
            </div>
          </div>
        </section>

        <section class="toolbar-panel">
          <div class="toolbar-grid">
            <div class="field">
              <label for="practiceSearch">Ricerca pratica</label>
              <input id="practiceSearch" type="text" value="${escapeHtml(state.ui.practiceFilter)}" placeholder="Cliente, riferimento, porto, container..." />
            </div>
            <div class="field">
              <label for="practiceStatusFilter">Filtro stato</label>
              <select id="practiceStatusFilter">
                ${['Tutti','In attesa documenti','Operativa','Pianificata','Sdoganamento','Chiusa'].map(option => `
                  <option value="${escapeHtml(option)}" ${state.ui.practiceStatusFilter === option ? 'selected' : ''}>${escapeHtml(option)}</option>
                `).join('')}
              </select>
            </div>
            <div class="field">
              <label for="practiceSort">Ordinamento</label>
              <select id="practiceSort">
                <option value="eta_asc" ${state.ui.practiceSort === 'eta_asc' ? 'selected' : ''}>ETA più vicina</option>
                <option value="eta_desc" ${state.ui.practiceSort === 'eta_desc' ? 'selected' : ''}>ETA più lontana</option>
                <option value="client_asc" ${state.ui.practiceSort === 'client_asc' ? 'selected' : ''}>Cliente A-Z</option>
                <option value="priority_desc" ${state.ui.practiceSort === 'priority_desc' ? 'selected' : ''}>Priorità alta prima</option>
              </select>
            </div>
          </div>
        </section>

        <section class="three-col">
          <article class="panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">Nuova / Modifica pratica</h3>
                <p class="panel-subtitle">Seleziona una pratica e caricala nel form, oppure creane una nuova.</p>
              </div>
              <button class="secondary-button" type="button" data-action="load-selected-into-form">Carica selezionata</button>
            </div>

            <form id="practiceForm" novalidate>
              <input type="hidden" id="practiceEditId" name="editId" value="" />
              <div class="form-grid">
                <div class="field">
                  <label for="practiceReference">Riferimento pratica</label>
                  <input id="practiceReference" name="reference" type="text" placeholder="Es. KX-IMP-0004" required />
                </div>
                <div class="field">
                  <label for="practiceClient">Cliente</label>
                  <input id="practiceClient" name="client" type="text" placeholder="Es. Cliente S.r.l." required />
                </div>

                <div class="field">
                  <label for="practiceType">Tipo</label>
                  <select id="practiceType" name="type" required>
                    <option>Import</option>
                    <option>Export</option>
                    <option>Warehouse</option>
                    <option>Road</option>
                  </select>
                </div>
                <div class="field">
                  <label for="practiceMode">Modalità</label>
                  <select id="practiceMode" name="mode" required>
                    <option>Sea</option>
                    <option>Road</option>
                    <option>Rail</option>
                    <option>Air</option>
                    <option>Yard</option>
                  </select>
                </div>

                <div class="field">
                  <label for="practiceContainer">Container</label>
                  <input id="practiceContainer" name="container" type="text" placeholder="Es. MSCU1234567" />
                </div>
                <div class="field">
                  <label for="practicePort">Porto / Hub</label>
                  <input id="practicePort" name="port" type="text" placeholder="Es. Genova" required />
                </div>

                <div class="field">
                  <label for="practiceEta">ETA</label>
                  <input id="practiceEta" name="eta" type="date" required />
                </div>
                <div class="field">
                  <label for="practicePriority">Priorità</label>
                  <select id="practicePriority" name="priority" required>
                    <option>Alta</option>
                    <option>Media</option>
                    <option>Bassa</option>
                  </select>
                </div>

                <div class="field">
                  <label for="practiceStatus">Stato</label>
                  <select id="practiceStatus" name="status" required>
                    <option>In attesa documenti</option>
                    <option>Operativa</option>
                    <option>Pianificata</option>
                    <option>Sdoganamento</option>
                    <option>Chiusa</option>
                  </select>
                </div>

                <div class="field full">
                  <label for="practiceNotes">Note operative</label>
                  <textarea id="practiceNotes" name="notes" placeholder="Indicazioni operative, vincoli, priorità..."></textarea>
                </div>
              </div>

              <div class="action-row" style="margin-top:16px;">
                <button class="primary-button" type="submit">Salva pratica</button>
                <button class="secondary-button" type="reset">Reset</button>
              </div>
              <p class="meta-note">Il salvataggio aggiorna il backup locale e mantiene la pratica selezionata.</p>
            </form>
          </article>

          <article class="panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">Elenco pratiche</h3>
                <p class="panel-subtitle">Selezione singola, filtri live e ordinamento senza regressioni grafiche.</p>
              </div>
            </div>

            <div class="list-scroll">
              ${visiblePractices.map(practice => `
                <button class="activity-item practice-card-button ${state.ui.selectedPracticeId === practice.id ? 'is-selected' : ''}" type="button" data-practice-select="${escapeHtml(practice.id)}">
                  <div class="activity-top">
                    <span class="activity-title">${escapeHtml(practice.reference)}</span>
                    <span class="badge ${badgeSeverityForStatus(practice.status)}">${escapeHtml(practice.status)}</span>
                  </div>
                  <div class="activity-text">${escapeHtml(practice.client)} · ${escapeHtml(practice.port)} · ETA ${formatDate(practice.eta)}</div>
                </button>
              `).join('') || `
                <div class="alert-item info">
                  <div class="alert-top"><span class="alert-title">Nessun risultato</span><span class="badge info">INFO</span></div>
                  <div class="alert-text">Nessuna pratica corrisponde ai filtri selezionati.</div>
                </div>
              `}
            </div>
          </article>

          <article class="panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">Dettaglio pratica</h3>
                <p class="panel-subtitle">Vista rapida per lavorare senza aprire popup o finestre esterne.</p>
              </div>
              <div class="action-row">
                <button class="secondary-button" type="button" data-action="advance-status">Avanza stato</button>
                <button class="secondary-button" type="button" data-action="add-timeline-note">Log rapido</button>
              </div>
            </div>
            ${selected ? renderPracticeDetail(selected) : `
              <div class="alert-item info">
                <div class="alert-top"><span class="alert-title">Nessuna pratica selezionata</span><span class="badge info">INFO</span></div>
                <div class="alert-text">Seleziona una pratica dalla colonna centrale.</div>
              </div>
            `}
          </article>
        </section>

        <section class="two-col">
          <article class="panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">Controllo rapido WiseMind</h3>
                <p class="panel-subtitle">Stesse regole di STEP 1, rese più utili per il lavoro quotidiano.</p>
              </div>
            </div>
            <div class="alert-list">
              ${alerts.length ? alerts.map(renderAlert).join('') : `
                <div class="alert-item success">
                  <div class="alert-top"><span class="alert-title">Nessun alert</span><span class="badge success">OK</span></div>
                  <div class="alert-text">Non risultano anomalie critiche nelle pratiche presenti.</div>
                </div>
              `}
            </div>
          </article>

          <article class="table-panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">Vista tabellare</h3>
                <p class="panel-subtitle">Snapshot professionale coerente con la lista selezionabile.</p>
              </div>
            </div>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Riferimento</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Modalità</th>
                    <th>Container</th>
                    <th>Porto</th>
                    <th>ETA</th>
                    <th>Priorità</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  ${visiblePractices.map(p => `
                    <tr>
                      <td>${escapeHtml(p.id)}</td>
                      <td>${escapeHtml(p.reference)}</td>
                      <td>${escapeHtml(p.client)}</td>
                      <td>${escapeHtml(p.type)}</td>
                      <td>${escapeHtml(p.mode)}</td>
                      <td>${escapeHtml(p.container || '—')}</td>
                      <td>${escapeHtml(p.port)}</td>
                      <td>${escapeHtml(formatDate(p.eta))}</td>
                      <td>${escapeHtml(p.priority)}</td>
                      <td><span class="badge ${badgeSeverityForStatus(p.status)}">${escapeHtml(p.status)}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </section>
    `;
  }

  function renderPracticeDetail(practice) {
    return `
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Cliente</span><span class="detail-value">${escapeHtml(practice.client)}</span></div>
        <div class="detail-row"><span class="detail-label">Riferimento</span><span class="detail-value">${escapeHtml(practice.reference)}</span></div>
        <div class="detail-row"><span class="detail-label">Container</span><span class="detail-value">${escapeHtml(practice.container || '—')}</span></div>
        <div class="detail-row"><span class="detail-label">Porto</span><span class="detail-value">${escapeHtml(practice.port)}</span></div>
        <div class="detail-row"><span class="detail-label">ETA</span><span class="detail-value">${escapeHtml(formatDate(practice.eta))}</span></div>
        <div class="detail-row"><span class="detail-label">Priorità</span><span class="detail-value">${escapeHtml(practice.priority)}</span></div>
        <div class="detail-row"><span class="detail-label">Stato</span><span class="detail-value"><span class="badge ${badgeSeverityForStatus(practice.status)}">${escapeHtml(practice.status)}</span></span></div>
      </div>

      <div class="doc-grid">
        ${[
          ['Invoice', practice.docs?.invoice],
          ['Packing List', practice.docs?.packingList],
          ['Mandato Doganale', practice.docs?.customsMandate],
          ['B/L', practice.docs?.bl]
        ].map(([label, ok]) => `
          <div class="doc-card ${ok ? 'doc-ok' : 'doc-missing'}">
            <span>${escapeHtml(label)}</span>
            <span class="badge ${ok ? 'success' : 'warning'}">${ok ? 'OK' : 'Mancante'}</span>
          </div>
        `).join('')}
      </div>

      <div class="panel-subsection">
        <div class="panel-subtitle" style="margin:0 0 10px;">Note operative</div>
        <div class="notes-box">${escapeHtml(practice.notes || 'Nessuna nota')}</div>
      </div>

      <div class="panel-subsection">
        <div class="panel-subtitle" style="margin:0 0 10px;">Timeline</div>
        <div class="timeline-list">
          ${(practice.timeline || []).map(item => `
            <div class="timeline-item">
              <div class="timeline-when">${escapeHtml(item.when)}</div>
              <div class="timeline-text">${escapeHtml(item.text)}</div>
            </div>
          `).join('') || '<div class="timeline-item"><div class="timeline-text">Nessun evento registrato.</div></div>'}
        </div>
      </div>
    `;
  }

  function renderPlaceholder(route) {
    const container = document.createElement('div');
    container.appendChild(dom.emptyModuleTemplate.content.cloneNode(true));
    container.querySelector('.hero-title').textContent = ROUTES[route] || 'Modulo';
    return container.innerHTML;
  }

  function savePractice(form) {
    const data = new FormData(form);
    const editId = val(data.get('editId'));
    const payload = {
      reference: val(data.get('reference')),
      client: val(data.get('client')),
      type: val(data.get('type')),
      mode: val(data.get('mode')),
      container: val(data.get('container')).toUpperCase(),
      port: val(data.get('port')),
      eta: val(data.get('eta')),
      priority: val(data.get('priority')),
      status: val(data.get('status')),
      notes: val(data.get('notes'))
    };

    if (!payload.reference || !payload.client || !payload.port || !payload.eta) {
      toast('Campi obbligatori mancanti', 'Compila riferimento, cliente, porto ed ETA prima del salvataggio.', 'warning');
      return;
    }

    if (editId) {
      const existing = state.data.practices.find(item => item.id === editId);
      if (!existing) {
        toast('Pratica non trovata', 'La pratica selezionata non è più disponibile.', 'danger');
        return;
      }
      existing.reference = payload.reference;
      existing.client = payload.client;
      existing.type = payload.type;
      existing.mode = payload.mode;
      existing.container = payload.container;
      existing.port = payload.port;
      existing.eta = payload.eta;
      existing.priority = payload.priority;
      existing.status = payload.status;
      existing.notes = payload.notes;
      existing.docs = mergeDocsWithStatus(existing.docs, payload.status);
      existing.timeline = existing.timeline || [];
      existing.timeline.unshift({
        when: timestampNow(),
        text: 'Pratica aggiornata manualmente'
      });
      state.ui.selectedPracticeId = existing.id;
      toast('Pratica aggiornata', `La pratica ${existing.reference} è stata aggiornata.`, 'success');
    } else {
      const practice = {
        id: nextPracticeId(),
        reference: payload.reference,
        client: payload.client,
        type: payload.type,
        mode: payload.mode,
        container: payload.container,
        port: payload.port,
        eta: payload.eta,
        priority: payload.priority,
        status: payload.status,
        notes: payload.notes,
        docs: docsByStatus(payload.status),
        timeline: [
          { when: timestampNow(), text: 'Pratica creata manualmente' }
        ]
      };
      state.data.practices.unshift(practice);
      state.ui.selectedPracticeId = practice.id;
      toast('Pratica salvata', `La pratica ${practice.reference} è stata salvata nel backup locale.`, 'success');
    }

    state.data.logs.unshift({
      type: editId ? 'practice_updated' : 'practice_created',
      practiceId: state.ui.selectedPracticeId,
      at: new Date().toISOString()
    });

    saveState();
    form.reset();
    const editField = document.getElementById('practiceEditId');
    if (editField) editField.value = '';
    render();
  }

  function mergeDocsWithStatus(existingDocs, status) {
    const docs = { ...(existingDocs || {}) };
    if (status === 'Chiusa') {
      docs.invoice = true;
      docs.packingList = true;
      docs.customsMandate = true;
      docs.bl = true;
      return docs;
    }
    return {
      invoice: Boolean(docs.invoice),
      packingList: Boolean(docs.packingList),
      customsMandate: Boolean(docs.customsMandate),
      bl: Boolean(docs.bl)
    };
  }

  function computeKpi() {
    const total = state.data.practices.length;
    const imports = state.data.practices.filter(p => p.type === 'Import').length;
    const exportsN = state.data.practices.filter(p => p.type === 'Export').length;
    const missingDocs = state.data.practices.reduce((sum, p) => sum + missingDocCount(p), 0);
    const etaSoon = state.data.practices.filter(p => isEtaWithinDays(p.eta, 3)).length;
    return {
      total,
      importExport: `${imports} / ${exportsN}`,
      missingDocs,
      etaSoon
    };
  }

  function computeAlerts() {
    const alerts = [];
    const containerMap = new Map();

    state.data.practices.forEach(practice => {
      const container = normalize(practice.container);
      if (container) {
        if (!containerMap.has(container)) containerMap.set(container, []);
        containerMap.get(container).push(practice.id);
      }

      const missing = missingDocCount(practice);
      if (missing > 0) {
        alerts.push({
          severity: missing >= 2 ? 'warning' : 'info',
          title: `Documenti incompleti · ${practice.id}`,
          text: `${practice.client}: ${missing} documento/i mancanti sulla pratica ${practice.reference}.`,
          badge: missing >= 2 ? 'Da completare' : 'Verifica'
        });
      }

      if (isEtaWithinDays(practice.eta, 2) && practice.status !== 'Chiusa') {
        alerts.push({
          severity: 'warning',
          title: `ETA ravvicinata · ${practice.id}`,
          text: `ETA prevista per ${formatDate(practice.eta)} su ${practice.port}. Verificare readiness operativa.`,
          badge: 'ETA < 48h'
        });
      }

      if (!practice.client || !practice.reference || !practice.port || !practice.eta) {
        alerts.push({
          severity: 'danger',
          title: `Campi critici mancanti · ${practice.id}`,
          text: `La pratica contiene campi essenziali non valorizzati.`,
          badge: 'Incomplete'
        });
      }
    });

    containerMap.forEach((ids, container) => {
      if (ids.length > 1) {
        alerts.push({
          severity: 'danger',
          title: `Container duplicato · ${container}`,
          text: `Il container ${container} compare in ${ids.length} pratiche (${ids.join(', ')}).`,
          badge: 'Duplicato'
        });
      }
    });

    return uniqueAlerts(alerts);
  }

  function uniqueAlerts(list) {
    const seen = new Set();
    return list.filter(item => {
      const key = `${item.severity}|${item.title}|${item.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function renderAlert(alert) {
    return `
      <div class="alert-item ${escapeHtml(alert.severity)}">
        <div class="alert-top">
          <span class="alert-title">${escapeHtml(alert.title)}</span>
          <span class="badge ${escapeHtml(alert.severity)}">${escapeHtml(alert.badge)}</span>
        </div>
        <div class="alert-text">${escapeHtml(alert.text)}</div>
      </div>
    `;
  }

  function docsByStatus(status) {
    if (status === 'Operativa' || status === 'Sdoganamento') {
      return { invoice: true, packingList: false, customsMandate: true, bl: true };
    }
    if (status === 'Chiusa') {
      return { invoice: true, packingList: true, customsMandate: true, bl: true };
    }
    return { invoice: false, packingList: false, customsMandate: false, bl: false };
  }

  function missingDocCount(practice) {
    if (!practice.docs) return 0;
    return Object.values(practice.docs).filter(v => !v).length;
  }

  function isEtaWithinDays(dateString, days) {
    if (!dateString) return false;
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const eta = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(eta.getTime())) return false;
    const etaUtc = Date.UTC(eta.getFullYear(), eta.getMonth(), eta.getDate());
    const diff = Math.floor((etaUtc - today) / 86400000);
    return diff >= 0 && diff <= days;
  }

  function formatDate(dateString) {
    if (!dateString) return '—';
    const d = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  }

  function prefillPracticeForm() {
    const fields = getPracticeFormFields();
    if (!fields.reference) return;
    fields.editId.value = '';
    fields.reference.value = `KX-IMP-${String(state.data.practices.length + 1).padStart(4, '0')}`;
    fields.client.value = 'Nuovo Cliente Demo';
    fields.type.value = 'Import';
    fields.mode.value = 'Sea';
    fields.container.value = 'TEMU5566778';
    fields.port.value = 'Vado Ligure';
    fields.eta.value = futureDate(4);
    fields.priority.value = 'Alta';
    fields.status.value = 'In attesa documenti';
    fields.notes.value = 'Verificare documentazione pre-arrival e disponibilità terminal.';
    fields.reference.focus();
    toast('Form precompilato', 'Il form è stato popolato con valori demo modificabili.', 'info');
  }

  function getPracticeFormFields() {
    return {
      editId: document.getElementById('practiceEditId'),
      reference: document.getElementById('practiceReference'),
      client: document.getElementById('practiceClient'),
      type: document.getElementById('practiceType'),
      mode: document.getElementById('practiceMode'),
      container: document.getElementById('practiceContainer'),
      port: document.getElementById('practicePort'),
      eta: document.getElementById('practiceEta'),
      priority: document.getElementById('practicePriority'),
      status: document.getElementById('practiceStatus'),
      notes: document.getElementById('practiceNotes')
    };
  }

  function loadSelectedPracticeIntoForm() {
    const selected = getSelectedPractice();
    if (!selected) {
      toast('Nessuna pratica selezionata', 'Seleziona prima una pratica dalla lista.', 'warning');
      return;
    }
    const fields = getPracticeFormFields();
    if (!fields.reference) return;
    fields.editId.value = selected.id;
    fields.reference.value = selected.reference;
    fields.client.value = selected.client;
    fields.type.value = selected.type;
    fields.mode.value = selected.mode;
    fields.container.value = selected.container || '';
    fields.port.value = selected.port;
    fields.eta.value = selected.eta;
    fields.priority.value = selected.priority;
    fields.status.value = selected.status;
    fields.notes.value = selected.notes || '';
    fields.reference.focus();
    toast('Pratica caricata nel form', `Ora puoi modificare ${selected.reference}.`, 'info');
  }

  function addTimelineNote() {
    const selected = getSelectedPractice();
    if (!selected) {
      toast('Nessuna pratica selezionata', 'Seleziona una pratica prima di aggiungere un log rapido.', 'warning');
      return;
    }
    selected.timeline = selected.timeline || [];
    selected.timeline.unshift({
      when: timestampNow(),
      text: 'Log rapido inserito dall’operatore'
    });
    state.data.logs.unshift({
      type: 'timeline_added',
      practiceId: selected.id,
      at: new Date().toISOString()
    });
    saveState();
    render();
    toast('Log rapido aggiunto', `Timeline aggiornata per ${selected.reference}.`, 'success');
  }

  function advanceSelectedPracticeStatus() {
    const selected = getSelectedPractice();
    if (!selected) {
      toast('Nessuna pratica selezionata', 'Seleziona una pratica prima di avanzare lo stato.', 'warning');
      return;
    }
    const flow = ['In attesa documenti', 'Pianificata', 'Operativa', 'Sdoganamento', 'Chiusa'];
    const currentIndex = flow.indexOf(selected.status);
    const nextStatus = flow[currentIndex + 1] || flow[0];
    selected.status = nextStatus;
    selected.docs = mergeDocsWithStatus(selected.docs, nextStatus);
    selected.timeline = selected.timeline || [];
    selected.timeline.unshift({
      when: timestampNow(),
      text: `Stato avanzato a "${nextStatus}"`
    });
    saveState();
    render();
    toast('Stato aggiornato', `${selected.reference} ora è in stato "${nextStatus}".`, 'success');
  }

  function futureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function nextPracticeId() {
    const max = state.data.practices.reduce((acc, item) => {
      const match = String(item.id).match(/PR-\d{4}-(\d+)/);
      return Math.max(acc, match ? Number(match[1]) : 0);
    }, 0);
    return `PR-2026-${String(max + 1).padStart(3, '0')}`;
  }

  function badgeSeverityForStatus(status) {
    if (status === 'Chiusa') return 'success';
    if (status === 'In attesa documenti' || status === 'Pianificata') return 'warning';
    if (status === 'Operativa' || status === 'Sdoganamento') return 'info';
    return 'danger';
  }

  function getVisiblePractices() {
    const query = normalize(state.ui.practiceFilter);
    const statusFilter = state.ui.practiceStatusFilter;
    const sort = state.ui.practiceSort;

    const list = state.data.practices.filter(practice => {
      const matchesQuery = !query || [
        practice.id,
        practice.reference,
        practice.client,
        practice.port,
        practice.container,
        practice.type
      ].some(value => normalize(value).includes(query));

      const matchesStatus = statusFilter === 'Tutti' || practice.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    list.sort((a, b) => {
      if (sort === 'eta_desc') return b.eta.localeCompare(a.eta);
      if (sort === 'client_asc') return a.client.localeCompare(b.client, 'it');
      if (sort === 'priority_desc') return priorityRank(b.priority) - priorityRank(a.priority);
      return a.eta.localeCompare(b.eta);
    });

    return list;
  }

  function priorityRank(value) {
    if (value === 'Alta') return 3;
    if (value === 'Media') return 2;
    return 1;
  }

  function getSelectedPractice() {
    return state.data.practices.find(item => item.id === state.ui.selectedPracticeId) || null;
  }

  function selectPractice(id) {
    state.ui.selectedPracticeId = id;
    saveState();
    render();
  }

  function setRoute(route) {
    if (!ROUTES[route]) return;
    state.currentRoute = route;
    render();
    closeSidebar();
  }

  function updateNavState() {
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === state.currentRoute);
    });
  }

  function openSidebar() {
    if (window.innerWidth > 980) return;
    state.sidebarOpen = true;
    dom.sidebar.classList.add('open');
    dom.sidebarBackdrop.hidden = false;
  }

  function closeSidebar(force = false) {
    if (window.innerWidth > 980 && !force) return;
    state.sidebarOpen = false;
    dom.sidebar.classList.remove('open');
    dom.sidebarBackdrop.hidden = true;
  }

  function toast(title, text, severity = 'info') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `
      <div class="alert-top">
        <span class="toast-title">${escapeHtml(title)}</span>
        <span class="badge ${escapeHtml(severity)}">${escapeHtml(severity.toUpperCase())}</span>
      </div>
      <div class="toast-text">${escapeHtml(text)}</div>
    `;
    dom.toastRegion.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 3600);
  }

  function resetToDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = JSON.parse(JSON.stringify(initialState));
    state.currentRoute = fresh.currentRoute;
    state.sidebarOpen = false;
    state.ui = fresh.ui;
    state.data = fresh.data;
    state.ui.selectedPracticeId = state.data.practices[0]?.id || null;
    render();
    toast('Dati demo ripristinati', 'Lo storage locale è stato riportato allo stato iniziale di STEP 2.', 'success');
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return hydrateFromInitial();
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data || !Array.isArray(parsed.data.practices)) {
        return hydrateFromInitial();
      }
      return {
        currentRoute: parsed.currentRoute && ROUTES[parsed.currentRoute] ? parsed.currentRoute : 'dashboard',
        sidebarOpen: false,
        ui: {
          selectedPracticeId: parsed.ui?.selectedPracticeId || null,
          practiceFilter: parsed.ui?.practiceFilter || '',
          practiceStatusFilter: parsed.ui?.practiceStatusFilter || 'Tutti',
          practiceSort: parsed.ui?.practiceSort || 'eta_asc'
        },
        data: parsed.data
      };
    } catch (error) {
      return hydrateFromInitial();
    }
  }

  function hydrateFromInitial() {
    return JSON.parse(JSON.stringify(initialState));
  }

  function saveState() {
    const payload = {
      currentRoute: state.currentRoute,
      ui: state.ui,
      data: state.data
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  function timestampNow() {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
  }

  function normalize(v) {
    return String(v || '').trim().toUpperCase();
  }

  function val(v) {
    return String(v || '').trim();
  }

  function escapeHtml(v) {
    return String(v)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
})();
