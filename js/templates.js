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

  function practices(state, selected, filtered, searchResults = []) {
    const PracticeSchemas = window.KedrixOnePracticeSchemas;
    const clients = state.clients || [];
    const draft = state.draftPractice || {};
    const practiceTypes = [
      { value: 'sea_import', label: T.t('ui.typeSeaImport', 'Mare Import') },
      { value: 'sea_export', label: T.t('ui.typeSeaExport', 'Mare Export') },
      { value: 'air_import', label: T.t('ui.typeAirImport', 'Aerea Import') },
      { value: 'air_export', label: T.t('ui.typeAirExport', 'Aerea Export') },
      { value: 'road_import', label: T.t('ui.typeRoadImport', 'Terra Import') },
      { value: 'road_export', label: T.t('ui.typeRoadExport', 'Terra Export') },
      { value: 'warehouse', label: T.t('ui.typeWarehouse', 'Magazzino') }
    ];
    const tabs = [
      { key: 'practice', label: T.t('ui.tabPractice', 'Pratica') },
      { key: 'detail', label: T.t('ui.tabDetail', 'Dettaglio') },
      { key: 'notes', label: T.t('ui.tabNotes', 'Note') }
    ];
    const currentTabKey = state.practiceTab || 'practice';
    const currentTab = tabs.find((tab) => tab.key === currentTabKey) || tabs[0];
    const selectedType = practiceTypes.find((item) => item.value === draft.practiceType) || null;
    const categoryOptions = draft.practiceType ? PracticeSchemas.getCategoryOptions(draft.practiceType) : [];
    const searchQuery = state.practiceSearchQuery || '';
    const statusOptions = ['Tutti', 'In attesa documenti', 'Operativa', 'Sdoganamento', 'Chiusa'];
    const activeSearchPreviewId = state.practiceSearchPreviewId || '';
    const activeSearchPreview = searchQuery && activeSearchPreviewId && searchResults.some((result) => result.practiceId === activeSearchPreviewId)
      ? (state.practices || []).find((practice) => practice.id === activeSearchPreviewId) || null
      : null;
    const activeSearchPreviewResult = activeSearchPreview ? searchResults.find((result) => result.practiceId === activeSearchPreviewId) || null : null;
    const activeSearchPreviewEntries = activeSearchPreview
      ? Object.entries(activeSearchPreview.dynamicData || {}).filter(([, value]) => {
          if (Array.isArray(value)) return value.length;
          return String(value || '').trim();
        }).slice(0, 8)
      : [];

    return `
      <section class="hero">
        <div class="hero-meta">STEP 5D · ${U.escapeHtml(T.t('ui.practiceSearchEngineReady', 'Pratiche consolidate + motore ricerca trasversale'))}</div>
        <h2>${U.escapeHtml(T.moduleLabel('practices', 'Pratiche'))}</h2>
        <p>${U.escapeHtml(T.t('ui.step5cIntro', ''))}</p>
      </section>

      <section class="kpi-grid compact-kpi-grid">
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.practiceType', 'Tipo pratica'))}</div>
          <div class="kpi-value">${U.escapeHtml(selectedType ? selectedType.label : '—')}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.dynamicSchemaIntro', ''))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.currentTab', 'Tab attiva'))}</div>
          <div class="kpi-value">${U.escapeHtml(currentTab.label)}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.tabInstruction', ''))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(draft.editingPracticeId ? T.t('ui.editPractice', 'Modifica pratica') : T.t('ui.newDraft', 'Nuova pratica'))}</div>
          <div class="kpi-value">${U.escapeHtml(draft.generatedReference || '—')}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.clientSuggestionHint', ''))}</div>
        </article>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceIdentity', 'Identità pratica'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(T.t('ui.practiceMandatoryGate', ''))}</p>
          </div>
        </div>

        <form id="practiceForm">
          <div class="practice-form-stack">
            <div class="form-grid three">
              <div class="field" data-field-wrap="practiceType">
                <label for="practiceType">${U.escapeHtml(T.t('ui.practiceType', 'Tipo pratica'))} <span class="required-mark">*</span></label>
                <select id="practiceType" name="practiceType" required>
                  <option value="">—</option>
                  ${practiceTypes.map((item) => `<option value="${item.value}" ${draft.practiceType === item.value ? 'selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}
                </select>
              </div>

              <div class="field" data-practice-dependent data-field-wrap="clientName">
                <label for="clientName">${U.escapeHtml(T.t('ui.clientEditable', 'Cliente (editabile)'))} <span class="required-mark">*</span></label>
                <input id="clientName" name="clientName" list="clientSuggestions" value="${U.escapeHtml(draft.clientName || '')}" autocomplete="off" ${draft.practiceType ? '' : 'disabled'} />
                <datalist id="clientSuggestions">
                  ${clients.map((client) => `<option value="${U.escapeHtml(client.name)}"></option>`).join('')}
                </datalist>
                <div class="field-hint">${U.escapeHtml(T.t('ui.clientSuggestionHint', ''))}</div>
                <input id="clientId" name="clientId" type="hidden" value="${U.escapeHtml(draft.clientId || '')}" />
              </div>

              <div class="field" data-practice-dependent data-field-wrap="practiceDate">
                <label for="practiceDate">${U.escapeHtml(T.t('ui.practiceDate', 'Data pratica'))} <span class="required-mark">*</span></label>
                <input id="practiceDate" name="practiceDate" type="date" value="${U.escapeHtml(draft.practiceDate || new Date().toISOString().slice(0, 10))}" ${draft.practiceType ? '' : 'disabled'} required />
              </div>

              <div class="field" data-practice-dependent data-field-wrap="generatedReference">
                <label for="generatedReference">${U.escapeHtml(T.t('ui.generatedNumber', 'Numero pratica'))}</label>
                <input id="generatedReference" name="generatedReference" readonly value="${U.escapeHtml(draft.generatedReference || '')}" ${draft.practiceType ? '' : 'disabled'} />
                <div class="field-hint">${U.escapeHtml(T.t('ui.profileByClient', 'Numero progressivo generato in base al cliente selezionato.'))}</div>
              </div>

              <div class="field" data-practice-dependent data-field-wrap="category">
                <label for="category">${U.escapeHtml(T.t('ui.categoryLabel', 'Categoria'))} <span class="required-mark">*</span></label>
                <select id="category" name="category" ${draft.practiceType ? '' : 'disabled'}>
                  <option value="">—</option>
                  ${categoryOptions.map((option) => `<option value="${U.escapeHtml(option)}" ${draft.category === option ? 'selected' : ''}>${U.escapeHtml(option)}</option>`).join('')}
                </select>
                <div class="field-hint">${U.escapeHtml(T.t('ui.categoryHint', 'La categoria viene filtrata in base al tipo pratica selezionato.'))}</div>
              </div>

              <div class="field" data-practice-dependent data-field-wrap="status">
                <label for="status">${U.escapeHtml(T.t('ui.status', 'Stato'))}</label>
                <select id="status" name="status" ${draft.practiceType ? '' : 'disabled'}>
                  ${['In attesa documenti', 'Operativa', 'Sdoganamento', 'Chiusa'].map((option) => `<option value="${U.escapeHtml(option)}" ${draft.status === option ? 'selected' : ''}>${U.escapeHtml(option)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="locked-banner" id="practiceLockedBanner">${U.escapeHtml(T.t('ui.typeBlockedHint', ''))}</div>

            <div id="practiceValidationSummary" class="validation-summary" hidden></div>

            <div class="practice-helper-row" data-practice-dependent>
              <span class="helper-pill">${U.escapeHtml(T.t('ui.validationCoverage', 'Validazione per tipo pratica'))}</span>
              <span class="helper-pill">${U.escapeHtml(T.t('ui.incotermConfigHint', 'Incoterms dinamici da configurazione aziendale'))}</span>
              <span class="helper-pill">${U.escapeHtml(T.t('ui.mappingHint', 'Mapping operativo coerente per mare / aerea / terra / magazzino'))}</span>
            </div>

            <div class="practice-tab-row" id="practiceTabRow">
              ${tabs.map((tab) => `<button class="practice-tab ${currentTabKey === tab.key ? 'active' : ''}" type="button" data-practice-tab="${tab.key}">${U.escapeHtml(tab.label)}</button>`).join('')}
            </div>

            <div class="panel inset-panel practice-dynamic-panel" data-practice-dependent>
              <div class="panel-head">
                <div>
                  <h3 class="panel-title">${U.escapeHtml(T.t('ui.dynamicPreview', 'Anteprima schema'))}</h3>
                  <p class="panel-subtitle">${U.escapeHtml(T.t('ui.dynamicSchemaIntro', ''))}</p>
                </div>
              </div>
              <div id="practiceDynamicFields"></div>
            </div>

            <div class="action-row">
              <button class="btn" type="submit">${U.escapeHtml(draft.editingPracticeId ? T.t('ui.updatePractice', 'Aggiorna pratica') : T.t('ui.saveAndGenerate', 'Salva pratica'))}</button>
              <button class="btn secondary" type="button" data-action="reset-practice-draft">${U.escapeHtml(T.t('ui.newDraft', 'Nuova pratica'))}</button>
              <button class="btn secondary" type="button" data-action="reset-demo">${U.escapeHtml(T.t('ui.resetDemo', 'Reset demo'))}</button>
            </div>
          </div>
        </form>

      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceSearchEngineTitle', 'Motore ricerca pratiche'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(T.t('ui.practiceSearchEngineHint', 'Indicizzazione trasversale su numero pratica, cliente, container, booking, BL/AWB/CMR e riferimenti operativi.'))}</p>
          </div>
        </div>

        <div class="practice-search-stack">
          <div class="form-grid three practice-search-grid">
            <div class="field full">
              <label for="practiceSearchQuery">${U.escapeHtml(T.t('ui.searchLabel', 'Ricerca'))}</label>
              <input id="practiceSearchQuery" name="practiceSearchQuery" type="search" value="${U.escapeHtml(searchQuery)}" placeholder="${U.escapeHtml(T.t('ui.practiceSearchPlaceholder', 'Cerca per cliente, numero pratica, container, booking, BL, MAWB, HAWB, CMR...'))}" autocomplete="off" />
              <div class="field-hint">${U.escapeHtml(T.t('ui.practiceSearchLiveHint', 'Ricerca live ordinata per rilevanza operativa.'))}</div>
            </div>
          </div>

          <div class="practice-search-meta-row">
            <div class="search-meta-pill">${U.escapeHtml(T.t('ui.indexedFieldsHint', 'Campi indicizzati'))}: ${U.escapeHtml(T.t('ui.indexedFieldsList', 'pratiche · cliente · container · booking · BL/AWB/CMR'))}</div>
            <div class="search-meta-pill">${searchQuery ? `${searchResults.length} ${U.escapeHtml(T.t('ui.searchResults', 'risultati'))}` : U.escapeHtml(T.t('ui.searchReady', 'Ricerca pronta'))}</div>
          </div>

          ${searchQuery ? `
            ${activeSearchPreview ? `
              <article class="panel inset-panel search-preview-card" id="practiceSearchPreview">
                <div class="panel-head search-preview-head">
                  <div>
                    <div class="summary-kicker">${U.escapeHtml(T.t('ui.searchPreviewKicker', 'Anteprima risultato selezionato'))}</div>
                    <h4 class="panel-title">${U.escapeHtml(activeSearchPreview.clientName || activeSearchPreview.client || '—')}</h4>
                    <p class="panel-subtitle">${U.escapeHtml(T.t('ui.searchPreviewHint', 'Preview immediata: la pratica è già caricata in modifica anche nel form principale.'))}</p>
                  </div>
                  <div class="search-preview-badges">
                    <span class="badge info">${U.escapeHtml(activeSearchPreview.practiceTypeLabel || activeSearchPreview.practiceType || '—')}</span>
                    <span class="badge ${activeSearchPreview.status === 'In attesa documenti' ? 'warning' : 'info'}">${U.escapeHtml(activeSearchPreview.status || '—')}</span>
                  </div>
                </div>
                <div class="search-preview-grid">
                  <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.generatedNumber', 'Numero pratica'))}</div><div>${U.escapeHtml(activeSearchPreview.reference || '—')}</div></div>
                  <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.clientRequired', 'Cliente'))}</div><div>${U.escapeHtml(activeSearchPreview.clientName || activeSearchPreview.client || '—')}</div></div>
                  <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.categoryLabel', 'Categoria'))}</div><div>${U.escapeHtml(activeSearchPreview.category || '—')}</div></div>
                  <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.practiceDate', 'Data pratica'))}</div><div>${U.escapeHtml(activeSearchPreview.practiceDate || activeSearchPreview.eta || '—')}</div></div>
                  ${activeSearchPreviewEntries.map(([key, value]) => `<div class="detail-row"><div class="detail-label">${U.escapeHtml(activeSearchPreview.dynamicLabels?.[key] || key)}</div><div>${U.escapeHtml(Array.isArray(value) ? value.join(', ') : (value || '—'))}</div></div>`).join('')}
                </div>
                ${activeSearchPreviewResult && activeSearchPreviewResult.matches?.length ? `
                  <div class="practice-search-match-list">
                    ${activeSearchPreviewResult.matches.map((match) => `<span class="match-chip"><strong>${U.escapeHtml(match.label)}:</strong> ${U.escapeHtml(match.value)}</span>`).join('')}
                  </div>` : ''}
              </article>` : ''}
            <div class="practice-search-results">
              ${searchResults.length ? searchResults.slice(0, 8).map((result) => `
                <button class="practice-search-result ${activeSearchPreviewId === result.practiceId ? 'is-active' : ''}" type="button" data-practice-id="${U.escapeHtml(result.practiceId)}">
                  <div class="practice-search-result-head">
                    <div>
                      <div class="summary-kicker">${U.escapeHtml(result.reference)}</div>
                      <div class="panel-title practice-search-result-title">${U.escapeHtml(result.clientName)}</div>
                    </div>
                    <span class="badge info">${U.escapeHtml(result.practiceTypeLabel || '—')}</span>
                  </div>
                  <div class="practice-search-result-meta">
                    <span>${U.escapeHtml(T.t('ui.status', 'Stato'))}: ${U.escapeHtml(result.status || '—')}</span>
                    <span>${U.escapeHtml(T.t('ui.categoryLabel', 'Categoria'))}: ${U.escapeHtml(result.category || '—')}</span>
                    <span>${U.escapeHtml(T.t('ui.practiceDate', 'Data pratica'))}: ${U.escapeHtml(result.practiceDate || '—')}</span>
                  </div>
                  <div class="practice-search-match-list">
                    ${result.matches.map((match) => `<span class="match-chip"><strong>${U.escapeHtml(match.label)}:</strong> ${U.escapeHtml(match.value)}</span>`).join('')}
                  </div>
                </button>`).join('') : `
                <div class="empty-state-inline">${U.escapeHtml(T.t('ui.noSearchResults', 'Nessun risultato coerente con la ricerca inserita.'))}</div>`}
            </div>` : `
            <div class="empty-state-inline">${U.escapeHtml(T.t('ui.searchPrompt', 'Digita almeno un riferimento operativo per interrogare l’indice trasversale.'))}</div>`}
        </div>
      </section>

      <section class="table-panel" id="practiceListSection">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceList', 'Elenco pratiche'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(T.t('ui.reopenHint', 'Clicca una riga per riaprire la pratica in modifica.'))}</p>
          </div>
        </div>
        <div class="table-toolbar">
          <div class="field">
            <label for="filterText">${U.escapeHtml(T.t('ui.quickFilter', 'Filtro rapido elenco'))}</label>
            <input id="filterText" name="filterText" type="search" value="${U.escapeHtml(state.filterText || '')}" placeholder="${U.escapeHtml(T.t('ui.quickFilterPlaceholder', 'Cliente, numero pratica, porto, merce...'))}" autocomplete="off" />
          </div>
          <div class="field">
            <label for="statusFilter">${U.escapeHtml(T.t('ui.statusFilter', 'Filtro stato'))}</label>
            <select id="statusFilter" name="statusFilter">
              ${statusOptions.map((option) => `<option value="${U.escapeHtml(option)}" ${state.statusFilter === option ? 'selected' : ''}>${U.escapeHtml(option)}</option>`).join('')}
            </select>
          </div>
          <div class="table-toolbar-summary">${filtered.length} ${U.escapeHtml(T.t('ui.visiblePractices', 'pratiche visibili'))}</div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>${U.escapeHtml(T.t('ui.id', 'ID'))}</th>
                <th>${U.escapeHtml(T.t('ui.generatedNumber', 'Numero pratica'))}</th>
                <th>${U.escapeHtml(T.t('ui.practiceTypeDisplay', 'Tipologia'))}</th>
                <th>${U.escapeHtml(T.t('ui.clientRequired', 'Cliente'))}</th>
                <th>${U.escapeHtml(T.t('ui.containerCode', 'Container / telaio'))}</th>
                <th>${U.escapeHtml(T.t('ui.packageCount', 'Colli'))}</th>
                <th>${U.escapeHtml(T.t('ui.grossWeight', 'Peso lordo'))}</th>
                <th>${U.escapeHtml(T.t('ui.status', 'Stato'))}</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((practice) => `
                <tr data-practice-id="${U.escapeHtml(practice.id)}">
                  <td>${U.escapeHtml(practice.id)}</td>
                  <td>${U.escapeHtml(practice.reference)}</td>
                  <td>${U.escapeHtml(practice.practiceTypeLabel || practice.practiceType || '—')}</td>
                  <td>${U.escapeHtml(practice.clientName || practice.client || '—')}</td>
                  <td>${U.escapeHtml(practice.containerCode || '—')}</td>
                  <td>${U.escapeHtml(practice.packageCount || '—')}</td>
                  <td>${U.escapeHtml(practice.grossWeight || '—')}</td>
                  <td><span class="badge ${practice.status === 'In attesa documenti' ? 'warning' : 'info'}">${U.escapeHtml(practice.status)}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel" id="practiceDetailSection">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceDetail', 'Dettaglio pratica'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(T.t('ui.selectPractice', 'Seleziona una pratica dalla tabella.'))}</p>
          </div>
        </div>
        ${selected ? `
          <div class="detail-grid detail-grid-large">
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.generatedNumber', 'Numero pratica'))}</div><div>${U.escapeHtml(selected.reference)}</div></div>
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.practiceTypeDisplay', 'Tipologia'))}</div><div>${U.escapeHtml(selected.practiceTypeLabel || selected.practiceType || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.clientRequired', 'Cliente'))}</div><div>${U.escapeHtml(selected.clientName || selected.client || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.schemaGroup', 'Schema'))}</div><div>${U.escapeHtml(selected.schemaGroup || '—')}</div></div>
            ${Object.entries(selected.dynamicData || {}).map(([key, value]) => `
              <div class="detail-row"><div class="detail-label">${U.escapeHtml(selected.dynamicLabels?.[key] || key)}</div><div>${U.escapeHtml(Array.isArray(value) ? value.join(', ') : (value || '—'))}</div></div>
            `).join('')}
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.billingLinkStatus', 'Stato collegamento fatturazione'))}</div><div>${U.escapeHtml(selected.billingLinkStatus || T.t('ui.billingLinkPending', 'Da collegare'))}</div></div>
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.notes', 'Note'))}</div><div>${U.escapeHtml(selected.notes || '—')}</div></div>
          </div>` : `<div class="empty-text">${U.escapeHtml(T.t('ui.noSelection', 'Nessuna pratica selezionata.'))}</div>`}
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
    const settingsClient = (state.clients || []).find((client) => client.id === state.settingsClientId) || (state.clients || [])[0];
    const rule = settingsClient ? settingsClient.numberingRule : null;

    return `
      <section class="hero">
        <div class="hero-meta">${U.escapeHtml(T.t('ui.licensingControlPanel', 'Licensing control panel'))}</div>
        <h2>${U.escapeHtml(T.t('ui.settingsTitle', 'Impostazioni / Moduli'))}</h2>
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
        <div class="toolbar-grid four">
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

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(T.t('ui.numberingRules', 'Numerazione pratiche per cliente'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(T.t('ui.numberingIntro', ''))}</p>
          </div>
        </div>
        <div class="toolbar-grid four">
          <div class="field">
            <label for="numberingClientId">${U.escapeHtml(T.t('ui.numberingClient', 'Cliente da configurare'))}</label>
            <select id="numberingClientId">
              ${(state.clients || []).map((client) => `<option value="${client.id}" ${state.settingsClientId === client.id ? 'selected' : ''}>${U.escapeHtml(client.name)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="numberingPrefix">${U.escapeHtml(T.t('ui.numberingPrefix', 'Prefisso'))}</label>
            <input id="numberingPrefix" value="${U.escapeHtml(rule ? rule.prefix : '')}" />
          </div>
          <div class="field">
            <label for="numberingSeparator">${U.escapeHtml(T.t('ui.numberingSeparator', 'Separatore'))}</label>
            <input id="numberingSeparator" value="${U.escapeHtml(rule ? rule.separator : '-')}" />
          </div>
          <div class="field">
            <label for="numberingNextNumber">${U.escapeHtml(T.t('ui.numberingNext', 'Prossimo numero'))}</label>
            <input id="numberingNextNumber" type="number" min="1" value="${U.escapeHtml(String(rule ? rule.nextNumber : 1))}" />
          </div>
          <div class="field checkbox-field">
            <label><input id="numberingIncludeYear" type="checkbox" ${rule && rule.includeYear !== false ? 'checked' : ''} /> ${U.escapeHtml(T.t('ui.numberingIncludeYear', 'Includi anno'))}</label>
          </div>
          <div class="field full">
            <label for="numberingPreview">${U.escapeHtml(T.t('ui.numberingPreview', 'Anteprima'))}</label>
            <input id="numberingPreview" readonly value="${U.escapeHtml(settingsClient ? `${rule.prefix}${rule.separator}${rule.includeYear !== false ? '2026' + rule.separator : ''}${rule.nextNumber}` : '')}" />
          </div>
        </div>
        <div class="action-row">
          <button class="btn" type="button" id="saveNumberingRule">${U.escapeHtml(T.t('ui.numberingSave', 'Salva regola numerazione'))}</button>
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
