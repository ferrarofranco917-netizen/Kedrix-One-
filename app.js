(() => {
  'use strict';

  const STORAGE_KEY = 'logiwise.step1.data';
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
          notes: 'Packing list aggiornata da richiedere al fornitore.'
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
          notes: 'Verificare ritiro e conferma mezzo.'
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
          notes: 'Container duplicato su altra pratica, verificare allineamento dati.'
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
      toast('Backup locale aggiornato', 'I dati demo e le pratiche inserite sono stati salvati nello storage locale.');
      return;
    }

    const resetDemoBtn = event.target.closest('[data-action="reset-demo"]');
    if (resetDemoBtn) {
      resetToDemoData();
      return;
    }
  }

  function onSubmit(event) {
    const form = event.target.closest('#practiceForm');
    if (!form) return;
    event.preventDefault();
    savePractice(form);
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
    const upcoming = [...state.data.practices].sort((a, b) => a.eta.localeCompare(b.eta)).slice(0, 5);

    return `
      <section class="view-stack">
        <section class="hero-panel">
          <div class="hero-content">
            <span class="eyebrow">Operational control</span>
            <h2 class="hero-title">Una dashboard riposante, leggibile e pronta a diventare SaaS.</h2>
            <p class="hero-text">
              LogiWise nasce come strumento di lavoro quotidiano: ordine visivo, segnali chiari,
              nessun popup di sistema e struttura dati già pronta per passare dal backup locale al cloud.
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
              <span class="stat-hint">Controlli non bloccanti su dati demo e pratiche inserite.</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Storage mode</span>
              <span class="stat-value">Local</span>
              <span class="stat-hint">Struttura pronta per evoluzione cloud senza sporcare il progetto.</span>
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
                <p class="panel-subtitle">Controlli iniziali: duplicati, documenti mancanti, ETA vicine e coerenza minima dati.</p>
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
                <p class="panel-subtitle">Pratiche con ETA più vicina o alta priorità.</p>
              </div>
            </div>
            <div class="activity-list">
              ${upcoming.map(practice => `
                <div class="activity-item">
                  <div class="activity-top">
                    <span class="activity-title">${escapeHtml(practice.client)}</span>
                    <span class="badge ${badgeSeverityForStatus(practice.status)}">${escapeHtml(practice.status)}</span>
                  </div>
                  <div class="activity-text">${escapeHtml(practice.reference)} · ${escapeHtml(practice.port)} · ETA ${formatDate(practice.eta)}</div>
                </div>
              `).join('')}
            </div>
          </article>
        </section>

        <section class="table-panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">Snapshot pratiche</h3>
              <p class="panel-subtitle">Vista sintetica della base operativa corrente.</p>
            </div>
            <button class="secondary-button" type="button" data-action-route="practices">Gestisci pratiche</button>
          </div>

          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Riferimento</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Container</th>
                  <th>Porto</th>
                  <th>ETA</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.practices.map(p => `
                  <tr>
                    <td>${escapeHtml(p.id)}</td>
                    <td>${escapeHtml(p.reference)}</td>
                    <td>${escapeHtml(p.client)}</td>
                    <td>${escapeHtml(p.type)}</td>
                    <td>${escapeHtml(p.container || '—')}</td>
                    <td>${escapeHtml(p.port)}</td>
                    <td>${escapeHtml(formatDate(p.eta))}</td>
                    <td><span class="badge ${badgeSeverityForStatus(p.status)}">${escapeHtml(p.status)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    `;
  }

  function renderPractices() {
    const sorted = [...state.data.practices].sort((a, b) => a.eta.localeCompare(b.eta));
    const alerts = computeAlerts().slice(0, 4);

    return `
      <section class="view-stack">
        <section class="hero-panel">
          <div class="hero-content">
            <span class="eyebrow">Practice module</span>
            <h2 class="hero-title">Modulo pratiche base, già predisposto per backup locale e futuro cloud.</h2>
            <p class="hero-text">
              Inserisci pratiche senza popup di sistema. Tutti i feedback appartengono all'app,
              con focus states chiari e navigazione da tastiera coerente.
            </p>
            <div class="action-row">
              <button class="primary-button" type="button" data-action="prefill-practice">Prefill demo</button>
              <button class="secondary-button" type="button" data-action="save-local-backup">Salva backup locale</button>
              <button class="secondary-button" type="button" data-action="reset-demo">Reset dati demo</button>
            </div>
          </div>
          <div class="hero-side">
            <div class="stat-card">
              <span class="stat-label">Records</span>
              <span class="stat-value">${state.data.practices.length}</span>
              <span class="stat-hint">Pratiche persistite nello storage locale del browser.</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Quick QA</span>
              <span class="stat-value">${alerts.length}</span>
              <span class="stat-hint">Segnali principali visibili anche qui.</span>
            </div>
          </div>
        </section>

        <section class="two-col">
          <article class="form-panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">Nuova pratica</h3>
                <p class="panel-subtitle">Salvataggio locale, struttura dati pulita, nessun codice sporco.</p>
              </div>
            </div>

            <form id="practiceForm" novalidate>
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
              <p class="meta-note">Usa il tasto Tab per muoverti nel form: tutti i controlli hanno focus state visibile.</p>
            </form>
          </article>

          <article class="panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">Controllo rapido</h3>
                <p class="panel-subtitle">Stesse regole WiseMind, visibili senza interrompere il flusso.</p>
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
        </section>

        <section class="table-panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">Elenco pratiche</h3>
              <p class="panel-subtitle">Vista ordinata per ETA, pronta per evoluzione tabellare più avanzata.</p>
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
                ${sorted.map(p => `
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
        </section>
      </section>
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
    const practice = {
      id: nextPracticeId(),
      reference: val(data.get('reference')),
      client: val(data.get('client')),
      type: val(data.get('type')),
      mode: val(data.get('mode')),
      container: val(data.get('container')).toUpperCase(),
      port: val(data.get('port')),
      eta: val(data.get('eta')),
      priority: val(data.get('priority')),
      status: val(data.get('status')),
      notes: val(data.get('notes')),
      docs: docsByStatus(val(data.get('status')))
    };

    if (!practice.reference || !practice.client || !practice.port || !practice.eta) {
      toast('Campi obbligatori mancanti', 'Compila riferimento, cliente, porto ed ETA prima del salvataggio.', 'warning');
      return;
    }

    state.data.practices.unshift(practice);
    state.data.logs.unshift({
      type: 'practice_created',
      practiceId: practice.id,
      at: new Date().toISOString()
    });
    saveState();

    form.reset();
    render();
    toast('Pratica salvata', `La pratica ${practice.reference} è stata salvata nel backup locale.`, 'success');
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
    const fields = {
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
    if (!fields.reference) return;
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
    state.data = fresh.data;
    render();
    toast('Dati demo ripristinati', 'Lo storage locale è stato riportato allo stato iniziale del progetto.', 'success');
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(initialState));
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data || !Array.isArray(parsed.data.practices)) {
        return JSON.parse(JSON.stringify(initialState));
      }
      return {
        currentRoute: parsed.currentRoute && ROUTES[parsed.currentRoute] ? parsed.currentRoute : 'dashboard',
        sidebarOpen: false,
        data: parsed.data
      };
    } catch (error) {
      return JSON.parse(JSON.stringify(initialState));
    }
  }

  function saveState() {
    const payload = {
      currentRoute: state.currentRoute,
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
