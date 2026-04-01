window.KedrixOneTemplates = (() => {
  'use strict';

  const U = window.KedrixOneUtils;
  const W = window.KedrixOneWiseMind;
  const L = window.KedrixOneLicensing;
  const T = window.KedrixOneI18N;

  function sidebar(modules, activeRoute, expandedModules) {
    const expanded = new Set(expandedModules || []);
    const activeRoot = activeRoute.split('/')[0];

    return modules.map((module) => {
      const isRootActive = activeRoot === module.key;
      const isExpanded = expanded.has(module.key);
      const hasSubmodules = module.submodules.length > 0;

      return `
        <section class="nav-section">
          <div class="nav-module-row">
            <button class="nav-tab nav-module ${isRootActive ? 'active' : ''}" data-route="${U.escapeHtml(module.route)}" type="button">
              <span>${U.escapeHtml(module.label)}</span>
              ${hasSubmodules ? `<span class="nav-count">${module.submodules.length}</span>` : ''}
            </button>
            ${hasSubmodules ? `<button class="nav-toggle" type="button" data-module-toggle="${U.escapeHtml(module.key)}" aria-expanded="${isExpanded ? 'true' : 'false'}">${isExpanded ? '−' : '+'}</button>` : ''}
          </div>
          ${hasSubmodules ? `
            <div class="subnav-grid ${isExpanded ? 'open' : ''}">
              ${module.submodules.map((submodule) => `
                <button class="subnav-link ${activeRoute === submodule.route ? 'active' : ''}" data-route="${U.escapeHtml(submodule.route)}" type="button">
                  ${U.escapeHtml(submodule.label)}
                </button>`).join('')}
            </div>` : ''}
        </section>`;
    }).join('');
  }

  function dashboard(state, modulesSummary, licensingSummary) {
    const alerts = W.alerts(state.practices);
    const activeUser = L.getActiveUser(state);

    return `
      <section class="hero">
        <div class="hero-meta">STEP 4D · IT / EN + founder controlled naming</div>
        <h2>${U.escapeHtml(T.t('brand.product', 'Kedrix One'))}</h2>
        <p>${U.escapeHtml(T.t('ui.dashboardDescription', ''))}</p>
      </section>

      <section class="kpi-grid">
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.totalModules', 'Moduli totali'))}</div>
          <div class="kpi-value">${modulesSummary.totalModules}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.activeModulesHint', ''))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.totalSubmodules', 'Sottomoduli'))}</div>
          <div class="kpi-value">${modulesSummary.totalSubmodules}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.granPermissions', ''))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.visibleModules', 'Moduli visibili'))}</div>
          <div class="kpi-value">${licensingSummary.visibleModules}</div>
          <div class="kpi-hint">${U.escapeHtml(activeUser ? activeUser.name : '—')}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.totalVisibleSubmodules', 'Sottomoduli visibili'))}</div>
          <div class="kpi-value">${licensingSummary.visibleSubmodules}</div>
          <div class="kpi-hint">${licensingSummary.hiddenSubmodules} ${U.escapeHtml(T.t('ui.hiddenSubmodulesHint', ''))}</div>
        </article>
      </section>

      <section class="three-col compact-grid">
        <article class="panel">
          <div class="summary-kicker">${U.escapeHtml(T.t('ui.language', 'Lingua'))}</div>
          <div class="summary-value">${U.escapeHtml(T.getLanguage().toUpperCase())}</div>
          <p class="summary-text">${U.escapeHtml(T.t('ui.founderNamingNote', ''))}</p>
        </article>
        <article class="panel">
          <div class="summary-kicker">${U.escapeHtml(T.t('ui.moduleBusinessModel', 'Modello business'))}</div>
          <div class="summary-value">${U.escapeHtml(T.t('ui.granular', 'granulare'))}</div>
          <p class="summary-text">${U.escapeHtml(T.t('ui.pricingHint', ''))}</p>
        </article>
        <article class="panel">
          <div class="summary-kicker">${U.escapeHtml(T.t('ui.nextFocus', 'Prossimo focus'))}</div>
          <div class="summary-value">STEP 5</div>
          <p class="summary-text">${U.escapeHtml(T.t('ui.nextFocusHint', ''))}</p>
        </article>
      </section>

      <section class="two-col">
        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${U.escapeHtml(T.t('ui.wisemind', 'WiseMind'))}</h3>
              <p class="panel-subtitle">${U.escapeHtml(T.t('ui.operationalSignals', ''))}</p>
            </div>
          </div>
          <div class="alert-list">
            ${alerts.length ? alerts.map((alert) => `
              <div class="alert-item ${alert.severity}">
                <div class="panel-title" style="font-size:15px">${U.escapeHtml(alert.title)}</div>
                <div class="alert-text">${U.escapeHtml(alert.text)}</div>
                <div class="log-meta">${U.escapeHtml(alert.hint)}</div>
              </div>`).join('') : `
              <div class="alert-item success">
                <div class="panel-title" style="font-size:15px">${U.escapeHtml(T.t('ui.noCriticality', ''))}</div>
                <div class="alert-text">${U.escapeHtml(T.t('ui.noActiveAlerts', ''))}</div>
              </div>`}
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${U.escapeHtml(T.t('ui.activeUserPanel', 'Utente attivo'))}</h3>
              <p class="panel-subtitle">${U.escapeHtml(T.t('ui.currentUserContext', ''))}</p>
            </div>
          </div>
          <div class="stack-list">
            <div class="stack-item"><strong>${U.escapeHtml(T.t('ui.activeUser', 'Utente attivo'))}</strong><span>${U.escapeHtml(activeUser ? activeUser.name : '—')}</span></div>
            <div class="stack-item"><strong>Role</strong><span>${U.escapeHtml(activeUser ? activeUser.role : '—')}</span></div>
            <div class="stack-item"><strong>${U.escapeHtml(T.t('ui.language', 'Lingua'))}</strong><span>${U.escapeHtml(T.getLanguage().toUpperCase())}</span></div>
          </div>
        </article>
      </section>
    `;
  }

  function practices(state, selected, filtered) {
    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(T.t('ui.search', 'Ricerca'))} ${U.escapeHtml(T.moduleLabel('practices', 'Pratiche'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(T.t('ui.searchAndFilter', ''))}</p>
          </div>
        </div>
        <div class="toolbar-grid">
          <div class="field">
            <label for="filterText">${U.escapeHtml(T.t('ui.search', 'Ricerca'))}</label>
            <input id="filterText" value="${U.escapeHtml(state.filterText)}" placeholder="${U.escapeHtml(T.t('ui.search', 'Ricerca'))}..." />
          </div>
          <div class="field">
            <label for="statusFilter">${U.escapeHtml(T.t('ui.statusFilter', 'Filtro stato'))}</label>
            <select id="statusFilter">
              ${['Tutti', 'In attesa documenti', 'Operativa', 'Sdoganamento'].map((option) => `<option ${state.statusFilter === option ? 'selected' : ''}>${option}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>&nbsp;</label>
            <div class="action-row">
              <button class="btn secondary" type="button" data-action="reset-demo">${U.escapeHtml(T.t('ui.resetDemo', 'Reset demo'))}</button>
              <button class="btn secondary" type="button" data-route-action="practices/elenco-pratiche">${U.escapeHtml(T.t('ui.practiceList', 'Elenco pratiche'))}</button>
            </div>
          </div>
        </div>
      </section>

      <section class="practice-layout">
        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${U.escapeHtml(T.t('ui.newPracticePanel', 'Nuova pratica'))}</h3>
              <p class="panel-subtitle">${U.escapeHtml(T.t('ui.immediateRender', ''))}</p>
            </div>
          </div>
          <form id="practiceForm">
            <div class="form-grid two">
              <div class="field"><label for="reference">${U.escapeHtml(T.t('ui.reference', 'Rif.'))}</label><input id="reference" name="reference" required placeholder="Es. KX-IMP-0004" /></div>
              <div class="field"><label for="client">${U.escapeHtml(T.t('ui.client', 'Cliente'))}</label><input id="client" name="client" required placeholder="Es. Cliente S.r.l." /></div>
              <div class="field"><label for="type">${U.escapeHtml(T.t('ui.type', 'Tipo'))}</label><select id="type" name="type"><option>Import</option><option>Export</option></select></div>
              <div class="field"><label for="port">${U.escapeHtml(T.t('ui.port', 'Porto'))}</label><input id="port" name="port" required placeholder="Es. Genova" /></div>
              <div class="field"><label for="eta">${U.escapeHtml(T.t('ui.eta', 'ETA'))}</label><input id="eta" name="eta" type="date" required /></div>
              <div class="field"><label for="priority">${U.escapeHtml(T.t('ui.priority', 'Priorità'))}</label><select id="priority" name="priority"><option>Alta</option><option>Media</option><option>Bassa</option></select></div>
              <div class="field"><label for="status">${U.escapeHtml(T.t('ui.status', 'Stato'))}</label><select id="status" name="status"><option>In attesa documenti</option><option>Operativa</option><option>Sdoganamento</option></select></div>
              <div class="field full"><label for="notes">${U.escapeHtml(T.t('ui.notesOperational', 'Note operative'))}</label><textarea id="notes" name="notes" placeholder="..."></textarea></div>
            </div>
            <div class="action-row" style="margin-top:14px"><button class="btn" type="submit">${U.escapeHtml(T.t('ui.savePractice', 'Salva pratica'))}</button></div>
          </form>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceDetail', 'Dettaglio pratica'))}</h3>
              <p class="panel-subtitle">${U.escapeHtml(T.t('ui.selectPractice', ''))}</p>
            </div>
          </div>
          ${selected ? `
            <div class="detail-grid">
              <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.id', 'ID'))}</div><div>${U.escapeHtml(selected.id)}</div></div>
              <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.reference', 'Rif.'))}</div><div>${U.escapeHtml(selected.reference)}</div></div>
              <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.client', 'Cliente'))}</div><div>${U.escapeHtml(selected.client)}</div></div>
              <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.port', 'Porto'))}</div><div>${U.escapeHtml(selected.port)}</div></div>
              <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.eta', 'ETA'))}</div><div>${U.formatDate(selected.eta)}</div></div>
              <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.status', 'Stato'))}</div><div><span class="badge ${selected.status === 'In attesa documenti' ? 'warning' : 'info'}">${U.escapeHtml(selected.status)}</span></div></div>
              <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.notes', 'Note'))}</div><div>${U.escapeHtml(selected.notes || '—')}</div></div>
            </div>` : `<div class="empty-text">${U.escapeHtml(T.t('ui.noSelection', ''))}</div>`}
        </article>
      </section>

      <section class="table-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceList', 'Elenco pratiche'))}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.clickRow', ''))}</p></div></div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>${U.escapeHtml(T.t('ui.id', 'ID'))}</th><th>${U.escapeHtml(T.t('ui.reference', 'Rif.'))}</th><th>${U.escapeHtml(T.t('ui.client', 'Cliente'))}</th><th>${U.escapeHtml(T.t('ui.type', 'Tipo'))}</th><th>${U.escapeHtml(T.t('ui.port', 'Porto'))}</th><th>${U.escapeHtml(T.t('ui.eta', 'ETA'))}</th><th>${U.escapeHtml(T.t('ui.priority', 'Priorità'))}</th><th>${U.escapeHtml(T.t('ui.status', 'Stato'))}</th></tr></thead>
            <tbody>
              ${filtered.map((practice) => `
                <tr data-practice-id="${U.escapeHtml(practice.id)}">
                  <td>${U.escapeHtml(practice.id)}</td>
                  <td>${U.escapeHtml(practice.reference)}</td>
                  <td>${U.escapeHtml(practice.client)}</td>
                  <td>${U.escapeHtml(practice.type)}</td>
                  <td>${U.escapeHtml(practice.port)}</td>
                  <td>${U.formatDate(practice.eta)}</td>
                  <td>${U.escapeHtml(practice.priority)}</td>
                  <td><span class="badge ${practice.status === 'In attesa documenti' ? 'warning' : 'info'}">${U.escapeHtml(practice.status)}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function contacts(state, module) {
    return `
      <section class="hero">
        <div class="hero-meta">Master data</div>
        <h2>${U.escapeHtml(module.label)}</h2>
        <p>${U.escapeHtml(module.description)}</p>
      </section>

      <section class="kpi-grid compact-kpi-grid">
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.moduleFamiliesPlanned', 'Famiglie previste'))}</div><div class="kpi-value">${module.submodules.length}</div><div class="kpi-hint">Master data</div></article>
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.baseContacts', 'Base contatti'))}</div><div class="kpi-value">${state.contacts.length}</div><div class="kpi-hint">Preserved</div></article>
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.nextStep', 'STEP successivo'))}</div><div class="kpi-value">STEP 5</div><div class="kpi-hint">Master data reali</div></article>
      </section>

      <section class="table-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.currentBase', 'Base attuale'))}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.founderNamingNote', ''))}</p></div></div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>${U.escapeHtml(T.t('ui.id', 'ID'))}</th><th>${U.escapeHtml(T.t('ui.client', 'Cliente'))}</th><th>${U.escapeHtml(T.t('ui.type', 'Tipo'))}</th><th>City</th></tr></thead>
            <tbody>${state.contacts.map((contact) => `<tr><td>${U.escapeHtml(contact.id)}</td><td>${U.escapeHtml(contact.name)}</td><td>${U.escapeHtml(contact.type)}</td><td>${U.escapeHtml(contact.city)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.plannedFamilies', 'Famiglie previste'))}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.nextImplementation', ''))}</p></div></div>
        <div class="tag-grid">${module.submodules.map((submodule) => `<span class="tag-pill">${U.escapeHtml(submodule.label)}</span>`).join('')}</div>
      </section>`;
  }

  function settings(state, modules, activeUser) {
    const company = state.companyConfig || {};
    const companyEntitlements = L.getCompanyEntitlements(state);
    const userEntitlements = L.getUserEntitlements(state);
    const settingsModule = modules.find((module) => module.key === state.settingsModuleKey) || modules[0];
    const visibleModules = L.visibleModules(modules, state);
    const visibleSubmodules = visibleModules.reduce((acc, module) => acc + module.submodules.length, 0);
    const totalSubmodules = modules.reduce((acc, module) => acc + module.submodules.length, 0);

    return `
      <section class="hero">
        <div class="hero-meta">${U.escapeHtml(T.t('ui.licensingControlPanel', ''))}</div>
        <h2>${U.escapeHtml(T.t('ui.settingsTitle', ''))}</h2>
        <p>${U.escapeHtml(T.t('ui.moduleSettingsDescription', ''))}</p>
      </section>

      <section class="kpi-grid compact-kpi-grid">
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.company', 'Azienda'))}</div><div class="kpi-value">${U.escapeHtml(company.name || '—')}</div><div class="kpi-hint">${U.escapeHtml(T.t('ui.currentCustomer', ''))}</div></article>
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.plan', 'Piano'))}</div><div class="kpi-value">${U.escapeHtml(String(company.plan || 'base').toUpperCase())}</div><div class="kpi-hint">${companyEntitlements.size} modules</div></article>
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.activeUser', 'Utente attivo'))}</div><div class="kpi-value">${U.escapeHtml(activeUser ? activeUser.name : '—')}</div><div class="kpi-hint">${userEntitlements.size} modules</div></article>
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.totalVisibleSubmodules', 'Sottomoduli visibili'))}</div><div class="kpi-value">${visibleSubmodules}</div><div class="kpi-hint">${totalSubmodules - visibleSubmodules} ${U.escapeHtml(T.t('ui.hidden', 'nascosti'))}</div></article>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.quickConfig', 'Configurazione rapida'))}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.founderNamingNote', ''))}</p></div></div>
        <div class="toolbar-grid">
          <div class="field">
            <label for="companyPlan">${U.escapeHtml(T.t('ui.companyPlan', 'Piano azienda'))}</label>
            <select id="companyPlan">
              ${['base', 'pro', 'enterprise'].map((plan) => `<option value="${plan}" ${company.plan === plan ? 'selected' : ''}>${plan.toUpperCase()}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="activeUserId">${U.escapeHtml(T.t('ui.activeUser', 'Utente attivo'))}</label>
            <select id="activeUserId">
              ${(state.users || []).map((user) => `<option value="${user.id}" ${state.activeUserId === user.id ? 'selected' : ''}>${U.escapeHtml(user.name)} · ${U.escapeHtml(user.role)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="languageSelect">${U.escapeHtml(T.t('ui.language', 'Lingua'))}</label>
            <select id="languageSelect">
              <option value="it" ${state.language === 'it' ? 'selected' : ''}>Italiano</option>
              <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
            </select>
          </div>
          <div class="field">
            <label for="settingsModuleKey">${U.escapeHtml(T.t('ui.focusModule', 'Modulo da configurare'))}</label>
            <select id="settingsModuleKey">
              ${modules.map((module) => `<option value="${module.key}" ${state.settingsModuleKey === module.key ? 'selected' : ''}>${U.escapeHtml(module.label)}</option>`).join('')}
            </select>
          </div>
        </div>
      </section>

      <section class="table-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.companyMatrix', 'Matrice moduli'))}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.companyModulesHint', ''))}</p></div></div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>${U.escapeHtml(T.t('ui.module', 'Modulo'))}</th><th>${U.escapeHtml(T.t('ui.tier', 'Tier'))}</th><th>${U.escapeHtml(T.t('ui.companyAction', 'Azienda'))}</th><th>${U.escapeHtml(T.t('ui.userAction', 'Utente'))}</th><th>${U.escapeHtml(T.t('ui.result', 'Esito'))}</th></tr></thead>
            <tbody>
              ${modules.map((module) => {
                const status = L.moduleStatus(module, state);
                const companyButton = status.isBaseIncluded
                  ? `<span class="tag-pill muted">${U.escapeHtml(T.t('ui.includedInPlan', ''))}</span>`
                  : `<button class="btn secondary small-btn" type="button" data-toggle-company-module="${U.escapeHtml(module.key)}">${status.isCompanyPurchased ? U.escapeHtml(T.t('ui.removePurchase', '')) : U.escapeHtml(T.t('ui.buyModule', ''))}</button>`;

                let userButton = '';
                if (!status.isCompanyVisible && !status.isBaseIncluded) {
                  userButton = `<span class="tag-pill muted">${U.escapeHtml(T.t('ui.notPurchased', ''))}</span>`;
                } else if (status.isBaseIncluded) {
                  userButton = `<button class="btn secondary small-btn" type="button" data-toggle-user-module="${U.escapeHtml(module.key)}">${status.isExplicitUserBlocked ? U.escapeHtml(T.t('ui.reenableUser', '')) : U.escapeHtml(T.t('ui.blockForUser', ''))}</button>`;
                } else {
                  userButton = `<button class="btn secondary small-btn" type="button" data-toggle-user-module="${U.escapeHtml(module.key)}">${status.isExplicitUserExtra ? U.escapeHtml(T.t('ui.removeUserExtra', '')) : U.escapeHtml(T.t('ui.enableForUser', ''))}</button>`;
                }

                return `<tr>
                  <td><div class="table-title-cell">${U.escapeHtml(module.label)}</div><div class="table-meta-cell">${module.submodules.length} submodules</div></td>
                  <td><span class="badge ${module.tierHint === 'base' ? 'success' : 'info'}">${U.escapeHtml(module.tierHint)}</span></td>
                  <td>${companyButton}</td>
                  <td>${userButton}</td>
                  <td><span class="badge ${status.isUserEnabled ? 'success' : 'warning'}">${status.isUserEnabled ? U.escapeHtml(T.t('ui.visible', '')) : U.escapeHtml(T.t('ui.hiddenLabel', ''))}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="table-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.submoduleMatrix', 'Matrice sottomoduli'))} · ${U.escapeHtml(settingsModule.label)}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.submoduleGranularityHint', ''))}</p></div></div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>${U.escapeHtml(T.t('ui.submodule', 'Sottomodulo'))}</th><th>${U.escapeHtml(T.t('ui.companyAction', 'Azienda'))}</th><th>${U.escapeHtml(T.t('ui.userAction', 'Utente'))}</th><th>${U.escapeHtml(T.t('ui.result', 'Esito'))}</th></tr></thead>
            <tbody>
              ${settingsModule.submodules.map((submodule) => {
                const status = L.submoduleStatus(settingsModule, submodule, state);
                const companyButton = status.isCompanyIncluded
                  ? `<button class="btn secondary small-btn" type="button" data-toggle-company-submodule="${U.escapeHtml(submodule.route)}">${status.isCompanyVisible ? U.escapeHtml(T.t('ui.disableForCompany', '')) : U.escapeHtml(T.t('ui.reenableForCompany', ''))}</button>`
                  : `<button class="btn secondary small-btn" type="button" data-toggle-company-submodule="${U.escapeHtml(submodule.route)}">${status.isCompanyPurchased ? U.escapeHtml(T.t('ui.removeSubPurchase', '')) : U.escapeHtml(T.t('ui.buySubmodule', ''))}</button>`;

                let userButton = '';
                if (!status.isModuleEnabled) {
                  userButton = `<span class="tag-pill muted">${U.escapeHtml(T.t('ui.parentOff', ''))}</span>`;
                } else if (status.isCompanyVisible) {
                  userButton = `<button class="btn secondary small-btn" type="button" data-toggle-user-submodule="${U.escapeHtml(submodule.route)}">${status.isExplicitUserBlocked ? U.escapeHtml(T.t('ui.reenableUser', '')) : U.escapeHtml(T.t('ui.blockForUser', ''))}</button>`;
                } else {
                  userButton = `<button class="btn secondary small-btn" type="button" data-toggle-user-submodule="${U.escapeHtml(submodule.route)}">${status.isExplicitUserExtra ? U.escapeHtml(T.t('ui.removeUserExtra', '')) : U.escapeHtml(T.t('ui.enableForUser', ''))}</button>`;
                }

                return `<tr>
                  <td><div class="table-title-cell">${U.escapeHtml(submodule.label)}</div><div class="table-meta-cell">${U.escapeHtml(submodule.route)}</div></td>
                  <td>${companyButton}</td>
                  <td>${userButton}</td>
                  <td><span class="badge ${status.isUserEnabled ? 'success' : 'warning'}">${status.isUserEnabled ? U.escapeHtml(T.t('ui.visible', '')) : U.escapeHtml(T.t('ui.hiddenLabel', ''))}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function moduleOverview(module, state) {
    const status = L.moduleStatus(module, state);
    return `
      <section class="hero">
        <div class="hero-meta">${U.escapeHtml(T.t('ui.module', 'Modulo'))}</div>
        <h2>${U.escapeHtml(module.label)}</h2>
        <p>${U.escapeHtml(module.description)}</p>
      </section>

      <section class="three-col compact-grid">
        <article class="panel"><div class="summary-kicker">${U.escapeHtml(T.t('ui.status', 'Stato'))}</div><div class="summary-value">STEP 4D</div><p class="summary-text">${U.escapeHtml(T.t('ui.noDeadLinks', ''))}</p></article>
        <article class="panel"><div class="summary-kicker">${U.escapeHtml(T.t('ui.tier', 'Tier'))}</div><div class="summary-value">${U.escapeHtml(module.tierHint)}</div><p class="summary-text">${U.escapeHtml(T.t('ui.pricingHint', ''))}</p></article>
        <article class="panel"><div class="summary-kicker">${U.escapeHtml(T.t('ui.language', 'Lingua'))}</div><div class="summary-value">${U.escapeHtml(T.getLanguage().toUpperCase())}</div><p class="summary-text">${status.isUserEnabled ? U.escapeHtml(T.t('ui.visible', '')) : U.escapeHtml(T.t('ui.hiddenLabel', ''))}</p></article>
      </section>

      ${module.submodules.length ? `
        <section class="panel">
          <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.plannedFamilies', 'Sottomoduli previsti'))}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.enterpriseNavigation', ''))}</p></div></div>
          <div class="module-card-grid">
            ${module.submodules.map((submodule) => `
              <article class="module-card">
                <div><div class="module-card-title">${U.escapeHtml(submodule.label)}</div><div class="module-card-meta">${U.escapeHtml(module.label)}</div></div>
                <div class="action-row"><button class="btn secondary" type="button" data-route-action="${U.escapeHtml(submodule.route)}">Open</button></div>
              </article>`).join('')}
          </div>
        </section>` : `
        <section class="panel"><div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.modulePrepared', ''))}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.noExplicitSubmodules', ''))}</p></div></div></section>`}
    `;
  }

  function submodulePlaceholder(module, meta) {
    const siblings = module.submodules.filter((item) => item.route !== meta.route).slice(0, 8);
    return `
      <section class="hero">
        <div class="hero-meta">${U.escapeHtml(T.t('ui.submodule', 'Sottomodulo'))}</div>
        <h2>${U.escapeHtml(meta.submoduleLabel)}</h2>
        <p>${U.escapeHtml(meta.fullTitle)} · ${U.escapeHtml(T.t('ui.routeReady', ''))}</p>
      </section>

      <section class="three-col compact-grid">
        <article class="panel"><div class="summary-kicker">${U.escapeHtml(T.t('ui.parentModule', ''))}</div><div class="summary-value">${U.escapeHtml(module.label)}</div><p class="summary-text">${U.escapeHtml(T.t('ui.enterpriseNavigation', ''))}</p></article>
        <article class="panel"><div class="summary-kicker">${U.escapeHtml(T.t('ui.licensingReadiness', ''))}</div><div class="summary-value">${U.escapeHtml(T.t('ui.granular', 'granulare'))}</div><p class="summary-text">${U.escapeHtml(T.t('ui.pricingHint', ''))}</p></article>
        <article class="panel"><div class="summary-kicker">${U.escapeHtml(T.t('ui.status', 'Stato'))}</div><div class="summary-value">${U.escapeHtml(T.t('ui.placeholder', 'placeholder'))}</div><p class="summary-text">${U.escapeHtml(T.t('ui.nextFocusHint', ''))}</p></article>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.objectiveSubmodule', ''))}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.routeReady', ''))}</p></div></div>
        <div class="placeholder-box">
          <div class="placeholder-line"><strong>${U.escapeHtml(T.t('ui.routeActive', ''))}:</strong> ${U.escapeHtml(meta.route)}</div>
          <div class="placeholder-line"><strong>${U.escapeHtml(T.t('ui.category', ''))}:</strong> ${U.escapeHtml(module.category)}</div>
          <div class="placeholder-line"><strong>${U.escapeHtml(T.t('ui.tier', 'Tier'))}:</strong> ${U.escapeHtml(module.tierHint)}</div>
          <div class="placeholder-line"><strong>${U.escapeHtml(T.t('ui.nextImplementation', ''))}:</strong> UI reale + data model + azioni modulo-specifiche.</div>
        </div>
      </section>

      ${siblings.length ? `
        <section class="panel">
          <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(T.t('ui.relatedSubmodules', ''))}</h3><p class="panel-subtitle">${U.escapeHtml(T.t('ui.enterpriseNavigation', ''))}</p></div></div>
          <div class="tag-grid">
            ${siblings.map((item) => `<button class="tag-pill action-chip" type="button" data-route-action="${U.escapeHtml(item.route)}">${U.escapeHtml(item.label)}</button>`).join('')}
          </div>
        </section>` : ''}
    `;
  }

  return {
    sidebar,
    dashboard,
    practices,
    contacts,
    settings,
    moduleOverview,
    submodulePlaceholder
  };
})();