window.KedrixOneTemplates = (() => {
  'use strict';

  const U = window.KedrixOneUtils;

  function fallbackByLanguage() {
    const args = Array.from(arguments);
    if (args.length >= 3 && args[0] && typeof args[0] === 'object' && typeof args[0].getLanguage === 'function') {
      const i18n = args[0];
      const itText = args[1];
      const enText = args[2];
      return i18n.getLanguage() === 'en' ? enText : itText;
    }
    const itText = args[0];
    const enText = args[1];
    return T && typeof T.getLanguage === 'function' && T.getLanguage() === 'en' ? enText : itText;
  }
  const W = window.KedrixOneWiseMind;
  const L = window.KedrixOneLicensing;
  const T = window.KedrixOneI18N;
  const PracticeVerification = window.KedrixOnePracticeVerification;
  const DocumentEngine = window.KedrixOneDocumentEngine;
  const DocumentCompleteness = window.KedrixOneDocumentCompleteness || null;
  const DocumentCategories = window.KedrixOneDocumentCategories;
  const PracticeListAnalytics = window.KedrixOnePracticeListAnalytics || null;
  const PracticeListBreakdowns = window.KedrixOnePracticeListBreakdowns || null;
  const PracticeListTable = window.KedrixOnePracticeListTable || null;
  const PracticeListStatusBreakdowns = window.KedrixOnePracticeListStatusBreakdowns || null;
  const PracticeListPresets = window.KedrixOnePracticeListPresets || null;
  const PracticeListOperationalGaps = window.KedrixOnePracticeListOperationalGaps || null;
  const PracticeListLanes = window.KedrixOnePracticeListLanes || null;
  const PracticeListLogisticsNodes = window.KedrixOnePracticeListLogisticsNodes || null;
  const PracticeListTransportReferences = window.KedrixOnePracticeListTransportReferences || null;
  const PracticeListTopClients = window.KedrixOnePracticeListTopClients || null;
  const PracticeListOperationalNetwork = window.KedrixOnePracticeListOperationalNetwork || null;
  const PracticeListShippingProfiles = window.KedrixOnePracticeListShippingProfiles || null;
  const PracticeListCustomsProfiles = window.KedrixOnePracticeListCustomsProfiles || null;
  const PracticeListPartyPairs = window.KedrixOnePracticeListPartyPairs || null;
  const PracticeListPartyGaps = window.KedrixOnePracticeListPartyGaps || null;

  function getMasterDataQuickAdd() {
    return window.KedrixOneMasterDataQuickAdd;
  }

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
    const hasStarterTab = !String(draft.editingPracticeId || '').trim() && !state.practiceDuplicateSource;
    const tabs = [
      ...(hasStarterTab ? [{ key: 'start', label: T.t('ui.practiceStartTab', fallbackByLanguage('Avvio', 'Start')) }] : []),
      { key: 'practice', label: T.t('ui.tabPractice', 'Pratica') },
      { key: 'detail', label: T.t('ui.tabDetail', 'Dettaglio') },
      { key: 'notes', label: T.t('ui.tabNotes', 'Note') },
      { key: 'attachments', label: T.t('ui.tabAttachments', fallbackByLanguage('Allegati', 'Attachments')) }
    ];
    const PracticeWorkspace = window.KedrixOnePracticeWorkspace;
    const workspaceSessions = PracticeWorkspace && typeof PracticeWorkspace.listSessions === 'function'
      ? PracticeWorkspace.listSessions(state).map((session) => ({
          session,
          summary: typeof PracticeWorkspace.describeSession === 'function'
            ? PracticeWorkspace.describeSession(session, T)
            : {
                id: session.id,
                label: session?.draft?.generatedReference || session?.draft?.clientName || T.t('ui.workspaceDraftMask', fallbackByLanguage('Nuova maschera', 'New mask')),
                subtitle: session?.draft?.clientName || session?.draft?.practiceType || '—',
                badge: session?.draft?.editingPracticeId ? T.t('ui.workspaceEditBadge', fallbackByLanguage('In modifica', 'Editing')) : T.t('ui.workspaceDraftBadge', fallbackByLanguage('Bozza', 'Draft'))
              }
        }))
      : [];
    const activeWorkspaceSessionId = state.practiceWorkspace?.activeSessionId || workspaceSessions[0]?.summary?.id || '';
    workspaceSessions.forEach((entry) => {
      const tabKey = entry.summary?.activeTabKey || 'practice';
      const tabMeta = tabs.find((tab) => tab.key === tabKey) || tabs[0];
      entry.summary.activeTabLabel = tabMeta.label;
    });
    const currentTabKey = state.practiceTab || 'practice';
    const currentTab = tabs.find((tab) => tab.key === currentTabKey) || tabs[0];
    const dynamicPanelTitle = currentTabKey === 'attachments'
      ? T.t('ui.attachmentsPanelShellTitle', fallbackByLanguage('Gestione allegati', 'Attachment management'))
      : currentTabKey === 'practice'
        ? T.t('ui.practiceArchitectureTitle', fallbackByLanguage('Architettura operativa pratica', 'Practice operational architecture'))
        : currentTabKey === 'detail'
          ? T.t('ui.practiceDetailArchitectureTitle', fallbackByLanguage('Dettaglio specialistico', 'Specialist detail'))
          : T.t('ui.practiceNotesArchitectureTitle', fallbackByLanguage('Note pratica', 'Practice notes'));
    const dynamicPanelSubtitle = currentTabKey === 'attachments'
      ? T.t('ui.attachmentsPanelShellSubtitle', fallbackByLanguage('Import, elenco, apertura e rimozione controllata degli allegati collegati alla pratica.', 'Import, list, open and remove attachments linked to the current practice in a controlled way.'))
      : currentTabKey === 'practice'
        ? T.t('ui.practiceArchitectureHint', fallbackByLanguage('Overview operativa a blocchi: identità, soggetti collegati, trasporto, nodi logistici, dogana ed elementi economici essenziali.', 'Block-based operational overview: identity, linked parties, transport, logistics nodes, customs and essential economics.'))
        : currentTabKey === 'detail'
          ? T.t('ui.practiceDetailArchitectureHint', fallbackByLanguage("Campi tecnici e specialistici separati dall'overview della pratica per mantenere ordine e leggibilità.", 'Technical and specialist fields separated from the main practice overview to preserve order and readability.'))
          : T.t('ui.practiceNotesArchitectureHint', fallbackByLanguage('Area dedicata alle note operative della pratica, mantenuta separata ma sempre coerente con il record attivo.', 'Dedicated area for practice operational notes, kept separate but aligned with the active record.'));
    const selectedType = practiceTypes.find((item) => item.value === draft.practiceType) || null;
    const categoryOptions = draft.practiceType ? PracticeSchemas.getCategoryOptions(draft.practiceType) : [];
    const searchQuery = state.practiceSearchQuery || '';
    const statusOptions = ['Tutti', 'In attesa documenti', 'Operativa', 'Sdoganamento', 'Chiusa'];
    const activeSearchPreviewId = state.practiceSearchPreviewId || '';
    const activeSearchPreview = searchQuery && activeSearchPreviewId && searchResults.some((result) => result.practiceId === activeSearchPreviewId)
      ? (state.practices || []).find((practice) => practice.id === activeSearchPreviewId) || null
      : null;
    const activeSearchPreviewResult = activeSearchPreview ? searchResults.find((result) => result.practiceId === activeSearchPreviewId) || null : null;
    const PracticeImport = window.KedrixOnePracticeImportFoundation || null;
    const practiceImportHtml = PracticeImport && typeof PracticeImport.renderPanel === 'function'
      ? PracticeImport.renderPanel({ state, draftPractice: draft, i18n: T })
      : '';
    const activeSearchPreviewEntries = activeSearchPreview
      ? Object.entries(activeSearchPreview.dynamicData || {}).filter(([, value]) => {
          if (Array.isArray(value)) return value.length;
          return String(value || '').trim();
        }).slice(0, 8)
      : [];
    const verificationLabels = PracticeVerification && typeof PracticeVerification.collectLabels === 'function'
      ? PracticeVerification.collectLabels(draft)
      : [];
    const verificationHint = PracticeVerification && typeof PracticeVerification.formatTypesHint === 'function'
      ? PracticeVerification.formatTypesHint(verificationLabels)
      : (verificationLabels.length ? `${T.t('ui.customsVerificationTypePrefix', 'Tipo:')} ${verificationLabels.join(' · ')}` : T.t('ui.verificationBannerHint', 'Verifiche doganali attive sulla unità.'));
    const isEditing = Boolean(draft.editingPracticeId);
    const duplicateSource = state.practiceDuplicateSource || null;
    const editSourceLabel = state.practiceOpenSource === 'search'
      ? T.t('ui.openedFromSearch', 'Aperta da ricerca')
      : state.practiceOpenSource === 'list'
        ? T.t('ui.openedFromList', 'Aperta da elenco')
        : state.practiceOpenSource === 'documents'
          ? T.t('ui.openedFromDocuments', 'Aperta da documenti')
          : state.practiceOpenSource === 'save'
            ? T.t('ui.openedAfterSave', 'Pratica attiva')
            : '';

    return `
      <section class="hero">
        <div class="hero-meta">STEP 5C.1 / 5D · ${U.escapeHtml(T.t('ui.practiceSearchEngineReady', 'Pratiche consolidate + motore ricerca trasversale'))}</div>
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

      <section class="panel practice-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(T.t('ui.workspaceMasksTitle', 'Maschere aperte'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(T.t('ui.workspaceMasksHint', 'Base multi-maschera attiva per Pratiche: puoi tenere aperte più maschere e passare da una all\'altra senza perdere il contesto.'))}</p>
          </div>
        </div>
        <div class="practice-workspace-strip">
          ${workspaceSessions.map(({ summary }) => `
            <div class="practice-workspace-mask ${summary.id === activeWorkspaceSessionId ? 'active' : ''}">
              <button class="practice-workspace-switch" type="button" data-practice-session-switch="${U.escapeHtml(summary.id)}">
                <span class="practice-workspace-mask-main">
                  <span class="practice-workspace-mask-title">${U.escapeHtml(summary.label || '—')}</span>
                  <span class="practice-workspace-mask-subtitle">${U.escapeHtml(summary.subtitle || '—')}</span>
                </span>
                <span class="practice-workspace-badges">
                  <span class="badge">${U.escapeHtml(summary.activeTabLabel || currentTab.label)}</span>
                  ${summary.isDirty ? `<span class="badge warning">${U.escapeHtml(summary.dirtyBadge || '')}</span>` : ''}
                  <span class="badge info">${U.escapeHtml(summary.badge || '')}</span>
                </span>
              </button>
              <button class="practice-workspace-close" type="button" data-practice-session-close="${U.escapeHtml(summary.id)}" aria-label="${U.escapeHtml(T.t('ui.workspaceCloseMask', 'Chiudi maschera'))}">×</button>
            </div>`).join('')}
        </div>
      </section>


      <section class="panel" id="practiceEditorSection">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceIdentity', 'Identità pratica'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(T.t('ui.practiceMandatoryGate', ''))}</p>
          </div>
        </div>

        <form id="practiceForm">
          <div class="practice-form-stack">
            ${isEditing ? `
              <div class="edit-session-banner" id="practiceEditBanner">
                <div>
                  <div class="summary-kicker">${U.escapeHtml(T.t('ui.editingPracticeBannerKicker', 'Pratica aperta in modifica'))}</div>
                  <div class="edit-session-title">${U.escapeHtml(draft.generatedReference || '—')}</div>
                  <div class="edit-session-subtitle">${U.escapeHtml(draft.clientName || '—')}</div>
                </div>
                <div class="edit-session-meta">
                  ${editSourceLabel ? `<span class="badge info">${U.escapeHtml(editSourceLabel)}</span>` : ''}
                  <span class="badge info">${U.escapeHtml(T.t('ui.editingReady', 'Modificabile subito'))}</span>
                </div>
              </div>` : duplicateSource ? `
              <div class="edit-session-banner" id="practiceEditBanner">
                <div>
                  <div class="summary-kicker">${U.escapeHtml(T.t('ui.duplicatePracticeBannerKicker', 'Copia generata da pratica esistente'))}</div>
                  <div class="edit-session-title">${U.escapeHtml(draft.generatedReference || '—')}</div>
                  <div class="edit-session-subtitle">${U.escapeHtml(draft.clientName || duplicateSource.clientName || '—')}</div>
                </div>
                <div class="edit-session-meta">
                  <span class="badge info">${U.escapeHtml(T.t('ui.duplicateDraftReady', 'Copia pronta da personalizzare'))}</span>
                  <span class="badge info">${U.escapeHtml(T.t('ui.duplicateSourceReferenceBadge', 'Copiata da'))} ${U.escapeHtml(duplicateSource.reference || '—')}</span>
                </div>
              </div>` : ''}
            <div class="form-grid three">
              <div class="field" data-field-wrap="practiceType">
                <label for="practiceType">${U.escapeHtml(T.t('ui.practiceType', 'Tipo pratica'))} <span class="required-mark">*</span></label>
                <select id="practiceType" name="practiceType" required>
                  <option value="">—</option>
                  ${practiceTypes.map((item) => `<option value="${item.value}" ${draft.practiceType === item.value ? 'selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}
                </select>
              </div>

              <div class="field" data-field-wrap="clientName">
                <div class="field-label-row">
                  <label for="clientName">${U.escapeHtml(T.t('ui.clientEditable', 'Cliente (editabile)'))} <span class="required-mark">*</span></label>
                  ${(() => {
                    const MasterDataQuickAdd = getMasterDataQuickAdd();
                    if (!MasterDataQuickAdd) return '';
                    const openLinkedButton = typeof MasterDataQuickAdd.buildOpenLinkedButton === 'function'
                      ? MasterDataQuickAdd.buildOpenLinkedButton({ state, draft, fieldName: 'clientName', i18n: T })
                      : '';
                    const quickAddButton = typeof MasterDataQuickAdd.buildQuickAddButton === 'function'
                      ? MasterDataQuickAdd.buildQuickAddButton('clientName', T)
                      : '';
                    const fieldActionsHtml = [openLinkedButton, quickAddButton].filter(Boolean).join('');
                    return fieldActionsHtml ? `<div class="field-label-actions">${fieldActionsHtml}</div>` : '';
                  })()}
                </div>
                <input id="clientName" name="clientName" list="clientSuggestions" value="${U.escapeHtml(draft.clientName || '')}" autocomplete="off" ${draft.practiceType ? '' : 'disabled'} />
                <datalist id="clientSuggestions">
                  ${clients.map((client) => `<option value="${U.escapeHtml(client.name)}"></option>`).join('')}
                </datalist>
                <div class="field-hint">${U.escapeHtml(T.t('ui.clientSuggestionHint', ''))}</div>
                <input id="clientId" name="clientId" type="hidden" value="${U.escapeHtml(draft.clientId || '')}" />
              </div>

              <div class="field" data-field-wrap="practiceDate">
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

              <div class="field" data-field-wrap="status">
                <label for="status">${U.escapeHtml(T.t('ui.status', 'Stato'))}</label>
                <select id="status" name="status" ${draft.practiceType ? '' : 'disabled'}>
                  ${['In attesa documenti', 'Operativa', 'Sdoganamento', 'Chiusa'].map((option) => `<option value="${U.escapeHtml(option)}" ${draft.status === option ? 'selected' : ''}>${U.escapeHtml(option)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="locked-banner" id="practiceLockedBanner">${U.escapeHtml(T.t('ui.typeBlockedHint', ''))}</div>

            <div class="verification-sticky-banner ${verificationLabels.length ? '' : 'is-hidden'}" id="practiceVerificationBanner" ${verificationLabels.length ? '' : 'hidden'}>
              <div class="verification-banner-kicker">${U.escapeHtml(T.t('ui.inVerification', 'IN VERIFICA'))}</div>
              <div class="verification-banner-title" id="practiceVerificationBannerTitle">${U.escapeHtml(verificationLabels.length ? T.t('ui.customsVerificationAlertTitle', 'Attenzione unità sottoposta a verifica') : '')}</div>
              <div class="verification-banner-hint" id="practiceVerificationBannerHint">${U.escapeHtml(verificationHint)}</div>
            </div>

            <div id="practiceValidationSummary" class="validation-summary" hidden></div>

            <div class="practice-helper-row" data-practice-dependent>
              <span class="helper-pill">${U.escapeHtml(T.t('ui.validationCoverage', 'Validazione per tipo pratica'))}</span>
              <span class="helper-pill">${U.escapeHtml(T.t('ui.directoryConfigHint', 'Suggerimenti operativi da directory aziendale'))}</span>
              <span class="helper-pill">${U.escapeHtml(T.t('ui.mappingHint', 'Mapping operativo coerente per mare / aerea / terra / magazzino'))}</span>
            </div>

            <div class="practice-tab-row" id="practiceTabRow">
              ${tabs.map((tab) => `<button class="practice-tab ${currentTabKey === tab.key ? 'active' : ''}" type="button" data-practice-tab="${tab.key}">${U.escapeHtml(tab.label)}</button>`).join('')}
            </div>

            <div class="panel inset-panel practice-dynamic-panel" data-practice-dependent>
              <div class="panel-head">
                <div>
                  <h3 class="panel-title">${U.escapeHtml(dynamicPanelTitle)}</h3>
                  <p class="panel-subtitle">${U.escapeHtml(dynamicPanelSubtitle)}</p>
                </div>
              </div>
              <div id="practiceDynamicFields"></div>
            </div>

            <div class="action-row">
              <button class="btn" type="submit">${U.escapeHtml(draft.editingPracticeId ? T.t('ui.updatePractice', 'Aggiorna pratica') : T.t('ui.saveAndGenerate', 'Salva pratica'))}</button>
              ${isEditing ? `<button class="btn secondary" type="button" data-action="duplicate-practice-draft">${U.escapeHtml(T.t('ui.duplicatePractice', 'Duplica pratica'))}</button>` : ''}
              <button class="btn secondary" type="button" data-action="reset-demo">${U.escapeHtml(T.t('ui.resetDemo', 'Reset demo'))}</button>
            </div>
          </div>
        </form>

      </section>`;
  }
  function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(T.getLanguage() === 'en' ? 'en-GB' : 'it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }


function documents(state, module, searchResults = []) {
  const summary = DocumentEngine && typeof DocumentEngine.summary === 'function'
    ? DocumentEngine.summary(state, T)
    : { totalDocuments: 0, totalBundles: 0, latestImportedAt: '', typedCounts: {} };
  const bundles = DocumentEngine && typeof DocumentEngine.buildBundles === 'function'
    ? DocumentEngine.buildBundles(state, T)
    : [];
  const query = String(state.documentSearchQuery || '').trim();
  const list = query ? searchResults : bundles;
  const activePracticeId = state.documentPreviewPracticeId || searchResults[0]?.practiceId || searchResults[0]?.bundleKey || bundles[0]?.practiceId || bundles[0]?.bundleKey || '';
  const activeBundle = searchResults.find((item) => (item.practiceId || item.bundleKey) === activePracticeId)
    || bundles.find((item) => (item.practiceId || item.bundleKey) === activePracticeId)
    || null;
  const activeDocuments = (activeBundle ? (activeBundle.matchedDocumentsCount ? activeBundle.matchedDocuments : activeBundle.documents) : []) || [];
  const activeAttachmentId = state.documentPreviewAttachmentId || activeDocuments[0]?.id || '';
  const configuredTypes = DocumentCategories && typeof DocumentCategories.getOptions === 'function'
    ? DocumentCategories.getOptions(state, T)
    : [];
  const topTypeEntry = Object.entries(summary.typedCounts || {}).sort((left, right) => right[1] - left[1])[0] || null;
  const DocumentReferenceImport = window.KedrixOneDocumentReferenceImportFoundation || null;
  const documentReferenceImportHtml = DocumentReferenceImport && typeof DocumentReferenceImport.renderPanel === 'function'
    ? DocumentReferenceImport.renderPanel({ state, i18n: T })
    : '';
  const relationFoundation = summary.relationFoundation || { bundlesWithSubjects: 0, bundlesWithOperationalRefs: 0, bundlesWithReferenceOnlyDocs: 0 };
  const completenessFoundation = DocumentCompleteness && typeof DocumentCompleteness.buildFoundationSummary === 'function'
    ? DocumentCompleteness.buildFoundationSummary(bundles, T)
    : { bundlesReady: 0, bundlesAttention: 0, bundlesCritical: 0, bundlesWithReferenceCoverage: 0 };
  const activeBundleCompleteness = activeBundle && DocumentCompleteness && typeof DocumentCompleteness.summarizeBundle === 'function'
    ? DocumentCompleteness.summarizeBundle(activeBundle, T)
    : null;

  return `
    <section class="hero">
      <div class="hero-meta">STEP 6B / 5E · ${U.escapeHtml(T.t('ui.documentEngineReady', 'Document Engine + ricerca relazionale documentale'))}</div>
      <h2>${U.escapeHtml(module?.label || T.moduleLabel('documents', 'Documenti'))}</h2>
      <p>${U.escapeHtml(T.t('ui.documentEngineIntro', 'Hub documentale operativo collegato alle pratiche: ricerca relazionale, bundle per pratica e accesso diretto agli allegati.'))}</p>
    </section>

    <section class="kpi-grid compact-kpi-grid">
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.totalDocumentsCount', 'Documenti collegati'))}</div>
        <div class="kpi-value">${summary.totalDocuments}</div>
        <div class="kpi-hint">${U.escapeHtml(T.t('ui.documentEngineCountHint', 'Archivio allegati collegato alle pratiche'))}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.documentBundlesCount', 'Bundle pratica/documenti'))}</div>
        <div class="kpi-value">${summary.totalBundles}</div>
        <div class="kpi-hint">${U.escapeHtml(T.t('ui.documentBundlesHint', 'Ogni bundle raccoglie pratica madre + documenti collegati'))}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.latestDocumentImport', 'Ultima importazione'))}</div>
        <div class="kpi-value">${U.escapeHtml(formatDateTime(summary.latestImportedAt))}</div>
        <div class="kpi-hint">${U.escapeHtml(T.t('ui.appFeedbackHint', 'Conferme gestite dall’app, non dal browser'))}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.topDocumentType', 'Tipo documento prevalente'))}</div>
        <div class="kpi-value">${U.escapeHtml(topTypeEntry ? topTypeEntry[0] : '—')}</div>
        <div class="kpi-hint">${U.escapeHtml(topTypeEntry ? `${topTypeEntry[1]} ${T.t('ui.documentsWord', 'documenti')}` : T.t('ui.noDocumentsAvailable', 'Nessun documento disponibile'))}</div>
      </article>
    </section>

    ${documentReferenceImportHtml}

    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${U.escapeHtml(T.t('ui.documentRelationsFoundationTitle', 'Fondazione relazionale documenti'))}</h3>
          <p class="panel-subtitle">${U.escapeHtml(T.t('ui.documentRelationsFoundationHint', 'Ogni bundle legge soggetti collegati, riferimenti operativi e mix documentale per preparare la ricerca relazionale completa.'))}</p>
        </div>
      </div>
      <div class="kpi-grid compact-kpi-grid">
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.documentBundlesWithSubjects', 'Bundle con soggetti collegati'))}</div>
          <div class="kpi-value">${relationFoundation.bundlesWithSubjects || 0}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.documentBundlesWithSubjectsHint', 'Cliente, importatore, destinatario, mittente o vettore leggibili dal bundle.'))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.documentBundlesWithOperationalRefs', 'Bundle con riferimenti operativi'))}</div>
          <div class="kpi-value">${relationFoundation.bundlesWithOperationalRefs || 0}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.documentBundlesWithOperationalRefsHint', 'Container, booking, polizza, dogana o nodi logistici già leggibili.'))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.documentBundlesWithReferenceOnlyDocs', 'Bundle con soli riferimenti'))}</div>
          <div class="kpi-value">${relationFoundation.bundlesWithReferenceOnlyDocs || 0}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.documentBundlesWithReferenceOnlyDocsHint', 'Metadata importati senza file binario, utili per completare il fascicolo dopo.'))}</div>
        </article>
      </div>

    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${U.escapeHtml(T.t('ui.documentCompletenessFoundationTitle', 'Completezza documentale intelligente'))}</h3>
          <p class="panel-subtitle">${U.escapeHtml(T.t('ui.documentCompletenessFoundationHint', 'Leggi per tipo pratica quali documenti essenziali sono allegati, quali sono solo referenziati e quali mancano ancora nel fascicolo.'))}</p>
        </div>
      </div>
      <div class="kpi-grid compact-kpi-grid">
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.documentBundlesReady', 'Bundle pronti'))}</div>
          <div class="kpi-value">${completenessFoundation.bundlesReady || 0}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.documentBundlesReadyHint', 'Tutti i documenti essenziali risultano già allegati come file binari.'))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.documentBundlesAttention', 'Bundle da allegare'))}</div>
          <div class="kpi-value">${completenessFoundation.bundlesAttention || 0}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.documentBundlesAttentionHint', 'I documenti essenziali sono almeno referenziati, ma alcuni vanno ancora allegati.'))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.documentBundlesCritical', 'Bundle incompleti'))}</div>
          <div class="kpi-value">${completenessFoundation.bundlesCritical || 0}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.documentBundlesCriticalHint', 'Manca ancora almeno un documento essenziale per il profilo pratica.'))}</div>
        </article>
        <article class="kpi-card">
          <div class="kpi-label">${U.escapeHtml(T.t('ui.documentBundlesWithReferenceCoverage', 'Copertura solo riferimenti'))}</div>
          <div class="kpi-value">${completenessFoundation.bundlesWithReferenceCoverage || 0}</div>
          <div class="kpi-hint">${U.escapeHtml(T.t('ui.documentBundlesWithReferenceCoverageHint', 'Bundle con documenti referenziati ma non ancora presenti come allegati binari.'))}</div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${U.escapeHtml(T.t('ui.documentRelationalSearch', 'Ricerca relazionale documentale'))}</h3>
          <p class="panel-subtitle">${U.escapeHtml(T.t('ui.documentRelationalSearchHint', 'Cerca per numero pratica, cliente, container, booking, dogana, nome file o tipo documento e ottieni il bundle collegato.'))}</p>
        </div>
      </div>
      <div class="table-toolbar">
        <div class="field full">
          <label for="documentSearchQuery">${U.escapeHtml(T.t('ui.search', 'Ricerca'))}</label>
          <input id="documentSearchQuery" type="search" value="${U.escapeHtml(query)}" placeholder="${U.escapeHtml(T.t('ui.documentSearchPlaceholder', 'Numero pratica, cliente, container, booking, dogana, nome file...'))}" autocomplete="off" />
        </div>
        <div class="table-toolbar-summary">${query ? `${searchResults.length} ${U.escapeHtml(T.t('ui.bundlesFound', 'bundle trovati'))}` : `${bundles.length} ${U.escapeHtml(T.t('ui.availableBundles', 'bundle disponibili'))}`}</div>
      </div>
      <div class="document-config-strip">
        <div>
          <div class="summary-kicker">${U.escapeHtml(T.t('ui.documentCategoriesConfigured', 'Categorie documentali attive'))}</div>
          <div class="document-config-count">${configuredTypes.length}</div>
        </div>
        <div class="tag-grid compact-tag-grid">
          ${configuredTypes.slice(0, 8).map((item) => `<span class="tag-pill">${U.escapeHtml(item.label)}</span>`).join('')}
        </div>
      </div>
    </section>

    <section class="two-col documents-two-col">
      <article class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(query ? T.t('ui.searchResults', 'Risultati ricerca') : T.t('ui.documentBundlesRecent', 'Bundle recenti'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(query ? T.t('ui.documentSearchResultsHint', 'Il bundle resta centrato sulla pratica madre ma mostra anche i documenti corrispondenti.') : T.t('ui.documentBundlesRecentHint', 'Ultime pratiche con documenti collegati disponibili nel browser locale.'))}</p>
          </div>
        </div>
        <div class="document-bundle-list">
          ${list.length ? list.map((bundle) => `
            <button type="button" class="document-bundle-card ${(activeBundle && (activeBundle.practiceId || activeBundle.bundleKey) === (bundle.practiceId || bundle.bundleKey)) ? 'active' : ''}" data-document-preview="${U.escapeHtml(bundle.practiceId || bundle.bundleKey)}">
              <div class="document-bundle-head">
                <div>
                  <div class="summary-kicker">${U.escapeHtml(bundle.reference || '—')}</div>
                  <div class="panel-title document-bundle-title">${U.escapeHtml(bundle.clientName || '—')}</div>
                </div>
                <span class="badge info">${U.escapeHtml(bundle.practiceTypeLabel || '—')}</span>
              </div>
              ${(() => { const completeness = DocumentCompleteness && typeof DocumentCompleteness.summarizeBundle === 'function' ? DocumentCompleteness.summarizeBundle(bundle, T) : null; return `<div class="document-bundle-meta">
                <span>${U.escapeHtml(T.t('ui.status', 'Stato'))}: ${U.escapeHtml(bundle.practiceStatus || '—')}</span>
                <span>${U.escapeHtml(T.t('ui.documentsWord', 'Documenti'))}: ${bundle.documentsCount || bundle.documents?.length || 0}</span>
                ${bundle.matchedDocumentsCount ? `<span>${U.escapeHtml(T.t('ui.documentMatches', 'Match documento'))}: ${bundle.matchedDocumentsCount}</span>` : ''}
                ${completeness ? `<span class="badge ${completeness.tone === 'critical' ? 'warning' : completeness.tone === 'attention' ? 'info' : ''}">${U.escapeHtml(completeness.tone === 'critical' ? T.t('ui.documentCompletenessStatusCritical', 'Incompleto') : completeness.tone === 'attention' ? T.t('ui.documentCompletenessStatusAttention', 'Solo riferimenti') : T.t('ui.documentCompletenessStatusReady', 'Pronto'))}</span>` : ''}
              </div>${completeness ? `<div class="document-completeness-inline-hint">${U.escapeHtml(T.t('ui.documentCompletenessCoverage', 'Essenziali'))}: ${U.escapeHtml(`${completeness.counts.essentialReady}/${completeness.counts.essentialTotal}`)}${completeness.counts.essentialReferenceOnly ? ` · ${U.escapeHtml(T.t('ui.documentCompletenessReferenceOnlyShort', 'solo rif.'))}: ${U.escapeHtml(completeness.counts.essentialReferenceOnly)}` : ''}</div>` : ''}`; })()}
              ${(bundle.practiceMatches || []).length ? `<div class="practice-search-match-list">${bundle.practiceMatches.map((match) => `<span class="match-chip"><strong>${U.escapeHtml(match.label)}:</strong> ${U.escapeHtml(match.value)}</span>`).join('')}</div>` : ''}
              ${bundle.relationSummary?.subjectChips?.length ? `<div class="document-relation-chip-set">${bundle.relationSummary.subjectChips.map((entry) => `<span class="match-chip"><strong>${U.escapeHtml(entry.label)}:</strong> ${U.escapeHtml(entry.value)}</span>`).join('')}</div>` : ''}
              ${bundle.relationSummary?.referenceChips?.length ? `<div class="document-relation-chip-set">${bundle.relationSummary.referenceChips.map((entry) => `<span class="match-chip"><strong>${U.escapeHtml(entry.label)}:</strong> ${U.escapeHtml(entry.value)}</span>`).join('')}</div>` : ''}
            </button>`).join('') : `<div class="empty-state-inline">${U.escapeHtml(query ? T.t('ui.noDocumentSearchResults', 'Nessun bundle documentale coerente con la ricerca.') : T.t('ui.noDocumentsAvailable', 'Nessun documento disponibile'))}</div>`}
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(T.t('ui.documentBundleDetail', 'Bundle documentale'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(T.t('ui.documentBundleDetailHint', 'Apri la pratica madre oppure apri direttamente gli allegati collegati.'))}</p>
          </div>
        </div>
        ${activeBundle ? `
          <div class="detail-grid detail-grid-large">
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.generatedNumber', 'Numero pratica'))}</div><div>${U.escapeHtml(activeBundle.reference || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.client', 'Cliente'))}</div><div>${U.escapeHtml(activeBundle.clientName || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.practiceTypeDisplay', 'Tipologia'))}</div><div>${U.escapeHtml(activeBundle.practiceTypeLabel || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">${U.escapeHtml(T.t('ui.status', 'Stato'))}</div><div>${U.escapeHtml(activeBundle.practiceStatus || '—')}</div></div>
          </div>
          <div class="action-row">
            <button class="btn" type="button" data-document-open-practice="${U.escapeHtml(activeBundle.practiceId || '')}">${U.escapeHtml(T.t('ui.openPractice', 'Apri pratica'))}</button>
          </div>
          ${activeBundle.relationSummary ? `<section class="document-bundle-relations">
            <div class="panel-head compact-head">
              <div>
                <h4 class="panel-title">${U.escapeHtml(T.t('ui.documentBundleRelationsTitle', 'Relazioni del bundle'))}</h4>
                <p class="panel-subtitle">${U.escapeHtml(T.t('ui.documentBundleRelationsHint', 'Lettura rapida di soggetti collegati, riferimenti operativi e mix documentale del fascicolo.'))}</p>
              </div>
            </div>
            <div class="kpi-grid compact-kpi-grid document-bundle-relation-kpis">
              <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.documentLinkedSubjects', 'Soggetti collegati'))}</div><div class="kpi-value">${activeBundle.relationSummary.subjectCount || 0}</div></article>
              <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.documentOperationalReferences', 'Riferimenti operativi'))}</div><div class="kpi-value">${activeBundle.relationSummary.referenceCount || 0}</div></article>
              <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.documentDocumentMix', 'Mix documentale'))}</div><div class="kpi-value">${U.escapeHtml(`${activeBundle.relationSummary.binaryCount || 0}/${activeBundle.relationSummary.referenceOnlyCount || 0}`)}</div><div class="kpi-hint">${U.escapeHtml(T.t('ui.documentDocumentMixHint', 'File binari / solo riferimenti'))}</div></article>
            </div>
            <div class="document-bundle-relations-grid">
              <div class="document-relation-block">
                <div class="summary-kicker">${U.escapeHtml(T.t('ui.documentLinkedSubjects', 'Soggetti collegati'))}</div>
                ${activeBundle.relationSummary.subjects?.length ? `<div class="document-relation-chip-set">${activeBundle.relationSummary.subjects.map((entry) => `<span class="match-chip"><strong>${U.escapeHtml(entry.label)}:</strong> ${U.escapeHtml(entry.value)}</span>`).join('')}</div>` : `<div class="empty-state-inline">${U.escapeHtml(T.t('ui.documentNoLinkedSubjects', 'Nessun soggetto collegato leggibile da questo bundle.'))}</div>`}
              </div>
              <div class="document-relation-block">
                <div class="summary-kicker">${U.escapeHtml(T.t('ui.documentOperationalReferences', 'Riferimenti operativi'))}</div>
                ${activeBundle.relationSummary.references?.length ? `<div class="document-relation-chip-set">${activeBundle.relationSummary.references.map((entry) => `<span class="match-chip"><strong>${U.escapeHtml(entry.label)}:</strong> ${U.escapeHtml(entry.value)}</span>`).join('')}</div>` : `<div class="empty-state-inline">${U.escapeHtml(T.t('ui.documentNoOperationalReferences', 'Nessun riferimento operativo leggibile da questo bundle.'))}</div>`}
              </div>
              <div class="document-relation-block">
                <div class="summary-kicker">${U.escapeHtml(T.t('ui.topDocumentType', 'Tipo documento prevalente'))}</div>
                ${activeBundle.relationSummary.typeLabels?.length ? `<div class="tag-grid compact-tag-grid">${activeBundle.relationSummary.typeLabels.map((entry) => `<span class="tag-pill">${U.escapeHtml(entry)}</span>`).join('')}</div>` : `<div class="empty-state-inline">${U.escapeHtml(T.t('ui.noDocumentsAvailable', 'Nessun documento disponibile'))}</div>`}
              </div>
            </div>
          </section>` : ''}
          ${activeBundleCompleteness ? `<section class="document-bundle-completeness">
            <div class="panel-head compact-head">
              <div>
                <h4 class="panel-title">${U.escapeHtml(T.t('ui.documentBundleCompletenessTitle', 'Completezza documentale'))}</h4>
                <p class="panel-subtitle">${U.escapeHtml(T.t('ui.documentBundleCompletenessHint', 'Controlla subito quali documenti essenziali risultano allegati, solo referenziati o ancora mancanti per questo tipo pratica.'))}</p>
              </div>
            </div>
            <div class="kpi-grid compact-kpi-grid document-bundle-relation-kpis">
              <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.documentCompletenessProfile', 'Profilo'))}</div><div class="kpi-value text-sm">${U.escapeHtml(activeBundleCompleteness.profileLabel || '—')}</div></article>
              <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.documentCompletenessCoverage', 'Essenziali'))}</div><div class="kpi-value">${U.escapeHtml(`${activeBundleCompleteness.counts.essentialReady}/${activeBundleCompleteness.counts.essentialTotal}`)}</div></article>
              <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.documentCompletenessStatusAttention', 'Solo riferimenti'))}</div><div class="kpi-value">${activeBundleCompleteness.counts.essentialReferenceOnly || 0}</div></article>
              <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(T.t('ui.documentCompletenessStatusCritical', 'Mancanti'))}</div><div class="kpi-value">${activeBundleCompleteness.counts.essentialMissing || 0}</div></article>
            </div>
            <div class="practice-readiness-overview ${U.escapeHtml(activeBundleCompleteness.tone === 'critical' ? 'danger' : activeBundleCompleteness.tone === 'attention' ? 'warning' : 'success')}">
              <div>
                <div class="practice-readiness-overview-title">${U.escapeHtml(activeBundleCompleteness.title || '—')}</div>
                <div class="practice-readiness-overview-detail">${U.escapeHtml(activeBundleCompleteness.detail || '—')}</div>
              </div>
              <div class="practice-readiness-overview-side">${activeBundleCompleteness.nextAction ? `<span class="helper-pill">${U.escapeHtml(activeBundleCompleteness.nextAction)}</span>` : ''}</div>
            </div>
            <div class="document-completeness-grid">
              <div class="document-completeness-block">
                <div class="summary-kicker">${U.escapeHtml(T.t('ui.documentCompletenessEssentialDocs', 'Documenti essenziali'))}</div>
                ${activeBundleCompleteness.essentialRows.length ? activeBundleCompleteness.essentialRows.map((row) => `<article class="document-completeness-item" data-tone="${U.escapeHtml(row.tone)}"><div><div class="panel-title document-completeness-item-title">${U.escapeHtml(row.label)}</div><div class="panel-subtitle">${U.escapeHtml(row.helper)}</div></div><div class="document-completeness-item-side"><span class="badge ${row.tone === 'critical' ? 'warning' : row.tone === 'attention' ? 'info' : ''}">${U.escapeHtml(row.status === 'ready' ? T.t('ui.documentCompletenessRowReady', 'Allegato') : row.status === 'reference-only' ? T.t('ui.documentCompletenessRowReferenceOnly', 'Solo riferimento') : T.t('ui.documentCompletenessRowMissing', 'Mancante'))}</span></div></article>`).join('') : `<div class="empty-state-inline">${U.escapeHtml(T.t('ui.noDocumentsAvailable', 'Nessun documento disponibile'))}</div>`}
              </div>
              <div class="document-completeness-block">
                <div class="summary-kicker">${U.escapeHtml(T.t('ui.documentCompletenessOptionalDocs', 'Documenti opzionali / supporto'))}</div>
                ${activeBundleCompleteness.optionalRows.length ? activeBundleCompleteness.optionalRows.map((row) => `<article class="document-completeness-item" data-tone="${U.escapeHtml(row.tone)}"><div><div class="panel-title document-completeness-item-title">${U.escapeHtml(row.label)}</div><div class="panel-subtitle">${U.escapeHtml(row.helper)}</div></div><div class="document-completeness-item-side"><span class="badge ${row.tone === 'info' ? 'info' : ''}">${U.escapeHtml(row.status === 'ready' ? T.t('ui.documentCompletenessRowReady', 'Allegato') : row.status === 'reference-only' ? T.t('ui.documentCompletenessRowReferenceOnly', 'Solo riferimento') : T.t('ui.documentCompletenessRowOptionalMissing', 'Opzionale'))}</span></div></article>`).join('') : `<div class="empty-state-inline">${U.escapeHtml(T.t('ui.documentCompletenessNoOptionalDocs', 'Nessun documento opzionale previsto per questo profilo.'))}</div>`}
              </div>
            </div>
          </section>` : ''}
          <div class="attachments-list document-engine-list">
            ${activeDocuments.length ? activeDocuments.map((document) => `
              <article class="attachment-card document-engine-card ${(activeAttachmentId === document.id) ? 'document-engine-card-active' : ''}">
                <div class="attachment-main">
                  <div class="attachment-file-name">${U.escapeHtml(document.fileName || '—')}</div>
                  <div class="attachment-file-meta">${U.escapeHtml(document.documentTypeLabel || '—')} · ${U.escapeHtml(formatDateTime(document.importedAt))}${document.isReferenceOnly ? ` · ${U.escapeHtml(T.t('ui.documentReferenceOnlyBadge', 'Solo riferimento'))}` : ''}</div>
                  ${document.metadataSummary?.length ? `<div class="attachment-metadata-summary">${document.metadataSummary.map((entry) => `<span class="match-chip"><strong>${U.escapeHtml(entry.label)}:</strong> ${U.escapeHtml(entry.value)}</span>`).join('')}</div>` : ''}
                </div>
                <div class="document-engine-meta">
                  ${(document.matches || []).length ? `<div class="practice-search-match-list">${document.matches.map((match) => `<span class="match-chip"><strong>${U.escapeHtml(match.label)}:</strong> ${U.escapeHtml(match.value)}</span>`).join('')}</div>` : `<div class="attachment-file-meta">${U.escapeHtml(document.isReferenceOnly ? T.t('ui.documentReferenceOnlyHint', 'Riferimento documentale importato: allega il file binario in un secondo momento.') : T.t('ui.documentPreviewHint', 'Usa Anteprima per controllare il contenuto senza uscire dal modulo.'))}</div>`}
                </div>
                <div class="attachment-actions">
                  ${document.isReferenceOnly ? `<span class="helper-pill">${U.escapeHtml(T.t('ui.documentReferenceOnlyBadge', 'Solo riferimento'))}</span>` : `<button class="btn secondary small-btn" type="button" data-document-preview-file="${U.escapeHtml(document.id)}">${U.escapeHtml(T.t('ui.preview', 'Anteprima'))}</button><button class="btn secondary small-btn" type="button" data-document-open="${U.escapeHtml(document.id)}">${U.escapeHtml(T.t('ui.openAttachment', 'Apri'))}</button>`}
                </div>
              </article>`).join('') : `<div class="empty-text">${U.escapeHtml(T.t('ui.noDocumentsInBundle', 'Nessun documento collegato nel bundle selezionato.'))}</div>`}
          </div>
          <section class="document-preview-panel panel nested-panel">
            <div class="panel-head compact-head">
              <div>
                <h4 class="panel-title">${U.escapeHtml(T.t('ui.documentPreviewTitle', 'Anteprima documento'))}</h4>
                <p class="panel-subtitle">${U.escapeHtml(T.t('ui.documentPreviewIntro', 'PDF, immagini e testi vengono mostrati direttamente nell’app quando possibile.'))}</p>
              </div>
            </div>
            <div id="documentPreviewHost" data-document-preview-host="1" data-document-preview-id="${U.escapeHtml(activeAttachmentId)}"></div>
          </section>` : `<div class="empty-text">${U.escapeHtml(T.t('ui.selectDocumentBundle', 'Seleziona un bundle documentale dalla colonna sinistra.'))}</div>`}
      </article>
    </section>`;
}



function practicesHub(state, module) {
  const workspace = state.practiceWorkspace || { sessions: [] };
  const openMasks = Array.isArray(workspace.sessions) ? workspace.sessions.length : 0;
  const draftCount = (workspace.sessions || []).filter((session) => !String(session?.draft?.editingPracticeId || '').trim()).length;
  const practiceCount = Array.isArray(state.practices) ? state.practices.length : 0;
  const workspaceActionRoute = openMasks > 0 ? 'practices/workspace' : 'practices/gestione-pratiche';
  const workspaceActionLabel = openMasks > 0
    ? T.t('ui.openPracticeWorkspace', 'Apri workspace pratiche')
    : T.t('ui.openPracticeList', 'Apri elenco pratiche');
  const workspaceDetail = openMasks > 0
    ? T.t('ui.practiceHubWorkspaceDetail', 'Dall’apertura al salvataggio, la pratica vive in uno spazio interno all’app separato dall’elenco.')
    : T.t('ui.practiceHubWorkspaceWaitingDetail', 'Il workspace interno si attiva quando apri una pratica esistente o ne crei una nuova da Gestione pratiche.');
  const workspaceTitle = openMasks > 0
    ? T.t('ui.practiceHubWorkspaceTitle', 'Lavorazione in maschera dedicata')
    : T.t('ui.practiceHubWorkspaceWaitingTitle', 'Workspace pronto quando serve');
  return `
    <section class="hero">
      <div class="hero-meta">${U.escapeHtml(T.t('ui.practiceHubKicker', 'Pratiche padre · hub operativo'))}</div>
      <h2>${U.escapeHtml(module?.label || T.moduleLabel('practices', 'Pratiche'))}</h2>
      <p>${U.escapeHtml(T.t('ui.practiceHubIntro', 'Il tab padre Pratiche resta il cockpit del dominio: qui orienti l’accesso a elenco, workspace dedicato e prossimi monitor operativi senza sporcare la lista.'))}</p>
    </section>

    <section class="kpi-grid compact-kpi-grid">
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.practiceHubTotal', 'Pratiche archiviate'))}</div>
        <div class="kpi-value">${U.escapeHtml(String(practiceCount))}</div>
        <div class="kpi-hint">${U.escapeHtml(T.t('ui.practiceHubTotalHint', 'Base attuale disponibile per ricerca, confronti periodali e future analisi CRM.'))}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.practiceHubOpenMasks', 'Workspace aperti'))}</div>
        <div class="kpi-value">${U.escapeHtml(String(openMasks))}</div>
        <div class="kpi-hint">${U.escapeHtml(T.t('ui.practiceHubOpenMasksHint', 'Maschere pratica già attive nel workspace interno all’app.'))}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.practiceHubDraftMasks', 'Bozze aperte'))}</div>
        <div class="kpi-value">${U.escapeHtml(String(draftCount))}</div>
        <div class="kpi-hint">${U.escapeHtml(T.t('ui.practiceHubDraftMasksHint', 'Nuove pratiche ancora senza record definitivo salvato.'))}</div>
      </article>
    </section>

    <section class="module-card-grid practice-hub-grid">
      <article class="module-card practice-hub-card">
        <div>
          <div class="summary-kicker">${U.escapeHtml(T.t('submodules.practices/gestione-pratiche', 'Gestione pratiche'))}</div>
          <div class="module-card-title">${U.escapeHtml(T.t('ui.practiceHubListTitle', 'Lista pulita + ricerca avanzata'))}</div>
          <div class="module-card-meta">${U.escapeHtml(T.t('ui.practiceHubListDetail', 'Filtri per campo, range date, confronto periodale e pulsante “Apri nuova pratica” solo qui.'))}</div>
        </div>
        <div class="action-row"><button class="btn" type="button" data-route-action="practices/gestione-pratiche">${U.escapeHtml(T.t('ui.openPracticeList', 'Apri elenco pratiche'))}</button></div>
      </article>
      <article class="module-card practice-hub-card">
        <div>
          <div class="summary-kicker">${U.escapeHtml(T.t('ui.practiceWorkspaceTitle', 'Workspace pratica'))}</div>
          <div class="module-card-title">${U.escapeHtml(workspaceTitle)}</div>
          <div class="module-card-meta">${U.escapeHtml(workspaceDetail)}</div>
        </div>
        <div class="action-row"><button class="btn secondary" type="button" data-route-action="${U.escapeHtml(workspaceActionRoute)}">${U.escapeHtml(workspaceActionLabel)}</button></div>
      </article>
    </section>`;
}

function renderPracticeListBreakdownCard(title, breakdown, options = {}) {
  const compareEnabled = Boolean(breakdown && breakdown.compareEnabled);
  const rows = Array.isArray(breakdown && breakdown.rows) ? breakdown.rows : [];
  const emptyText = options.emptyText || T.t('ui.practiceListNoEntityRows', 'Nessun soggetto coerente con i filtri attivi.');
  const primaryDistinct = breakdown && Number.isFinite(breakdown.primaryDistinctCount) ? breakdown.primaryDistinctCount : 0;
  const comparisonDistinct = breakdown && Number.isFinite(breakdown.comparisonDistinctCount) ? breakdown.comparisonDistinctCount : 0;

  return `
    <article class="entity-breakdown-card">
      <div class="entity-breakdown-head">
        <div>
          <h4>${U.escapeHtml(title)}</h4>
          <div class="entity-breakdown-meta">${U.escapeHtml(T.t('ui.practiceListDistinctSubjects', 'Soggetti distinti'))}: ${U.escapeHtml(String(primaryDistinct))}${compareEnabled ? ` · ${U.escapeHtml(T.t('ui.practiceListCompareShort', 'Confronto'))}: ${U.escapeHtml(String(comparisonDistinct))}` : ''}</div>
        </div>
        <span class="badge info">Top ${U.escapeHtml(String(rows.length || 5))}</span>
      </div>
      <div class="entity-breakdown-grid">
        <div class="entity-breakdown-row head">
          <span>${U.escapeHtml(T.t('ui.practiceListEntityLabel', 'Soggetto'))}</span>
          <span>${U.escapeHtml(T.t('ui.practiceListActiveShort', 'Attivo'))}</span>
          <span>${U.escapeHtml(T.t('ui.practiceListCompareShort', 'Confronto'))}</span>
          <span>${U.escapeHtml(T.t('ui.practiceListDeltaShort', 'Delta'))}</span>
        </div>
        ${rows.length ? rows.map((row) => `
          <div class="entity-breakdown-row">
            <span class="entity-breakdown-label" title="${U.escapeHtml(row.label)}">${U.escapeHtml(row.label)}</span>
            <span>${U.escapeHtml(String(row.primaryCount || 0))}</span>
            <span>${compareEnabled ? U.escapeHtml(String(row.comparisonCount || 0)) : '—'}</span>
            <span>${compareEnabled ? `${row.deltaCount > 0 ? '+' : ''}${U.escapeHtml(String(row.deltaCount || 0))}` : '—'}</span>
          </div>`).join('') : `<div class="entity-breakdown-empty">${U.escapeHtml(emptyText)}</div>`}
      </div>
    </article>`;
}


function renderPracticeStatusBreakdown(statusBreakdown) {
  const breakdown = statusBreakdown || {};
  const rows = Array.isArray(breakdown.rows) ? breakdown.rows : [];
  const compareEnabled = Boolean(breakdown.compareEnabled);
  const activeOpen = Number(breakdown.activeOpenCount || 0);
  const compareOpen = Number(breakdown.compareOpenCount || 0);
  const openDelta = activeOpen - compareOpen;

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceListStatusTitle', 'Distribuzione per stato'))}</h3>
          <p class="panel-subtitle">${U.escapeHtml(T.t('ui.practiceListStatusHint', 'Leggi quanto pesa ogni stato nel range attivo e nel confronto, con focus immediato sulle pratiche ancora aperte.'))}</p>
        </div>
        <div class="practice-status-summary">
          <span class="badge info">${U.escapeHtml(T.t('ui.practiceListOpenStatuses', 'Pratiche aperte'))}</span>
          <span class="practice-status-summary-value">${U.escapeHtml(String(activeOpen))}</span>
          <span class="table-meta-cell">${compareEnabled ? `${U.escapeHtml(T.t('ui.practiceListCompareShort', 'Confronto'))}: ${U.escapeHtml(String(compareOpen))} · ${U.escapeHtml(T.t('ui.practiceListDeltaShort', 'Delta'))}: ${openDelta > 0 ? '+' : ''}${U.escapeHtml(String(openDelta))}` : U.escapeHtml(T.t('ui.practiceListNoComparisonRange', 'Nessun confronto impostato'))}</span>
        </div>
      </div>
      <div class="practice-compare-grid practice-status-grid">
        <div class="practice-compare-row head">
          <span>${U.escapeHtml(T.t('ui.status', 'Stato'))}</span>
          <span>${U.escapeHtml(T.t('ui.practiceListActiveShort', 'Attivo'))}</span>
          <span>${U.escapeHtml(T.t('ui.practiceListCompareShort', 'Confronto'))}</span>
          <span>${U.escapeHtml(T.t('ui.practiceListDeltaShort', 'Delta'))}</span>
        </div>
        ${rows.length ? rows.map((row) => `<div class="practice-compare-row">
          <span class="practice-compare-label">${U.escapeHtml(row.label || '—')}</span>
          <span>${U.escapeHtml(String(row.active || 0))}</span>
          <span>${compareEnabled ? U.escapeHtml(String(row.compare || 0)) : '—'}</span>
          <span>${compareEnabled ? `<span class="badge ${row.delta > 0 ? '' : row.delta < 0 ? 'warning' : 'info'}">${row.delta > 0 ? '+' : ''}${U.escapeHtml(String(row.delta || 0))}</span>` : '—'}</span>
        </div>`).join('') : `<div class="entity-breakdown-empty">${U.escapeHtml(T.t('ui.practiceListNoStatusRows', 'Nessuno stato coerente con i filtri attivi.'))}</div>`}
      </div>
    </section>`;
}

function practiceList(state, filtered = [], insights = {}) {
  const filters = state.practiceListFilters || {};
  const practiceTypes = [
    { value: '', label: T.t('ui.allPracticeTypes', 'Tutte le tipologie') },
    { value: 'sea_import', label: T.t('ui.typeSeaImport', 'Mare Import') },
    { value: 'sea_export', label: T.t('ui.typeSeaExport', 'Mare Export') },
    { value: 'air_import', label: T.t('ui.typeAirImport', 'Aerea Import') },
    { value: 'air_export', label: T.t('ui.typeAirExport', 'Aerea Export') },
    { value: 'road_import', label: T.t('ui.typeRoadImport', 'Terra Import') },
    { value: 'road_export', label: T.t('ui.typeRoadExport', 'Terra Export') },
    { value: 'warehouse', label: T.t('ui.typeWarehouse', 'Magazzino') }
  ];
  const directionOptions = [
    { value: 'all', label: T.t('ui.allDirections', 'Tutti') },
    { value: 'import', label: T.t('ui.importWord', 'Import') },
    { value: 'export', label: T.t('ui.exportWord', 'Export') },
    { value: 'warehouse', label: T.t('ui.typeWarehouse', 'Magazzino') }
  ];
  const statusOptions = [
    { value: 'all', label: T.t('ui.allStatuses', 'Tutti gli stati') },
    { value: 'In attesa documenti', label: 'In attesa documenti' },
    { value: 'Operativa', label: 'Operativa' },
    { value: 'Sdoganamento', label: 'Sdoganamento' },
    { value: 'Chiusa', label: 'Chiusa' }
  ];
  const primaryLabel = filters.dateFrom || filters.dateTo
    ? `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}`
    : T.t('ui.practiceListNoPrimaryRange', 'Nessun range impostato');
  const comparisonLabel = filters.compareDateFrom || filters.compareDateTo
    ? `${filters.compareDateFrom || '…'} → ${filters.compareDateTo || '…'}`
    : T.t('ui.practiceListNoComparisonRange', 'Nessun confronto impostato');
  const deltaTone = insights.deltaCount > 0 ? 'success' : insights.deltaCount < 0 ? 'warning' : 'info';
  const helper = PracticeListAnalytics && typeof PracticeListAnalytics.extractValues === 'function'
    ? PracticeListAnalytics
    : { extractValues: (practice) => ({ importer: practice.importer || '', exporter: practice.shipper || '', destination: practice.port || '', container: practice.containerCode || '', booking: practice.booking || '', policy: practice.policyNumber || practice.mbl || practice.mawb || '', practiceDate: practice.practiceDate || '' }) };
  const subjectBreakdowns = insights.subjectBreakdowns || (PracticeListBreakdowns && typeof PracticeListBreakdowns.buildSubjectBreakdowns === 'function'
    ? PracticeListBreakdowns.buildSubjectBreakdowns(insights, 5)
    : {});
  const sortDefaults = PracticeListTable && typeof PracticeListTable.defaultSort === 'function'
    ? PracticeListTable.defaultSort()
    : { sortBy: 'practiceDate', sortDirection: 'desc' };
  const sortOptions = PracticeListTable && typeof PracticeListTable.sortOptions === 'function'
    ? PracticeListTable.sortOptions(T)
    : [
        { value: 'practiceDate', label: T.t('ui.practiceListSortByDate', 'Data pratica') },
        { value: 'reference', label: T.t('ui.practiceListSortByReference', 'Numero pratica') },
        { value: 'client', label: T.t('ui.practiceListSortByClient', 'Cliente') }
      ];
  const sortDirectionOptions = PracticeListTable && typeof PracticeListTable.directionOptions === 'function'
    ? PracticeListTable.directionOptions(T)
    : [
        { value: 'desc', label: T.t('ui.sortDirectionDesc', 'Discendente') },
        { value: 'asc', label: T.t('ui.sortDirectionAsc', 'Ascendente') }
      ];
  const activeSortBy = filters.sortBy || sortDefaults.sortBy || 'practiceDate';
  const activeSortDirection = filters.sortDirection || sortDefaults.sortDirection || 'desc';
  const directionRows = PracticeListTable && typeof PracticeListTable.buildDirectionRows === 'function'
    ? PracticeListTable.buildDirectionRows(insights)
    : [
        { key: 'import', labelKey: 'ui.importWord', fallback: 'Import', active: Number(insights.primaryImportCount || 0), compare: Number(insights.compareImportCount || 0), delta: Number(insights.primaryImportCount || 0) - Number(insights.compareImportCount || 0) },
        { key: 'export', labelKey: 'ui.exportWord', fallback: 'Export', active: Number(insights.primaryExportCount || 0), compare: Number(insights.compareExportCount || 0), delta: Number(insights.primaryExportCount || 0) - Number(insights.compareExportCount || 0) },
        { key: 'warehouse', labelKey: 'ui.typeWarehouse', fallback: 'Magazzino', active: Number(insights.primaryWarehouseCount || 0), compare: Number(insights.compareWarehouseCount || 0), delta: Number(insights.primaryWarehouseCount || 0) - Number(insights.compareWarehouseCount || 0) }
      ];
  const presetItems = PracticeListPresets && typeof PracticeListPresets.list === 'function'
    ? PracticeListPresets.list((key, fallback) => T.t(key, fallback))
    : [];
  const activePreset = PracticeListPresets && typeof PracticeListPresets.detectActivePreset === 'function'
    ? PracticeListPresets.detectActivePreset(filters)
    : '';

  return `
    <section class="hero">
      <div class="hero-meta">${U.escapeHtml(T.t('ui.practiceListKicker', 'Gestione pratiche · lista e ricerca avanzata'))}</div>
      <h2>${U.escapeHtml(T.t('ui.practiceListTitle', 'Gestione pratiche'))}</h2>
      <p>${U.escapeHtml(T.t('ui.practiceListIntro', 'Questa vista resta dedicata solo a ricerca, filtri per campo, confronto periodale e apertura della pratica nel workspace interno.'))}</p>
    </section>

    <section class="kpi-grid compact-kpi-grid">
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.practiceListCurrentRange', 'Range attivo'))}</div>
        <div class="kpi-value">${U.escapeHtml(String(insights.primaryCount || 0))}</div>
        <div class="kpi-hint">${U.escapeHtml(primaryLabel)}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.importWord', 'Import'))}</div>
        <div class="kpi-value">${U.escapeHtml(String(insights.primaryImportCount || 0))}</div>
        <div class="kpi-hint">${U.escapeHtml(T.t('ui.practiceListImportHint', 'Conteggio pratiche import nel range filtrato.'))}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.exportWord', 'Export'))}</div>
        <div class="kpi-value">${U.escapeHtml(String(insights.primaryExportCount || 0))}</div>
        <div class="kpi-hint">${U.escapeHtml(T.t('ui.practiceListExportHint', 'Conteggio pratiche export nel range filtrato.'))}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.practiceListComparison', 'Confronto periodo'))}</div>
        <div class="kpi-value">${U.escapeHtml(String(insights.compareCount || 0))}</div>
        <div class="kpi-hint">${U.escapeHtml(comparisonLabel)}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.practiceListDelta', 'Delta'))}</div>
        <div class="kpi-value">${insights.deltaCount > 0 ? '+' : ''}${U.escapeHtml(String(insights.deltaCount || 0))}</div>
        <div class="kpi-hint"><span class="badge ${deltaTone === 'success' ? '' : deltaTone === 'warning' ? 'warning' : 'info'}">${U.escapeHtml(deltaTone === 'success' ? T.t('ui.practiceListGrowing', 'In crescita') : deltaTone === 'warning' ? T.t('ui.practiceListDecreasing', 'In calo') : T.t('ui.practiceListStable', 'Stabile'))}</span></div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">${U.escapeHtml(T.t('ui.practiceListScopedTotal', 'Perimetro filtrato'))}</div>
        <div class="kpi-value">${U.escapeHtml(String(insights.totalScopedCount || filtered.length || 0))}</div>
        <div class="kpi-hint">${U.escapeHtml(T.t('ui.practiceListScopedTotalHint', 'Record coerenti con i filtri non temporali applicati.'))}</div>
      </article>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceListQuickViewsTitle', 'Viste rapide operative'))}</h3>
          <p class="panel-subtitle">${U.escapeHtml(T.t('ui.practiceListQuickViewsHint', 'Applica in un click i focus più usati senza sporcare date, confronto periodo e ordinamento attivo.'))}</p>
        </div>
      </div>
      <div class="practice-list-presets">
        ${presetItems.map((item) => `<button class="btn ${activePreset === item.id ? '' : 'secondary'} practice-list-preset-btn" type="button" data-practice-list-preset="${U.escapeHtml(item.id)}" title="${U.escapeHtml(item.description || '')}">${U.escapeHtml(item.label)}</button>`).join('')}
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceListFiltersTitle', 'Ricerca avanzata per campi'))}</h3>
          <p class="panel-subtitle">${U.escapeHtml(T.t('ui.practiceListFiltersHint', 'Filtra per soggetti, riferimenti logistici e range date per leggere il periodo attivo e confrontarlo con un secondo intervallo.'))}</p>
        </div>
        <div class="action-row">
          <button id="newPracticeButton" class="btn" type="button" data-route-action="practices/workspace">${U.escapeHtml(T.t('ui.newPractice', 'Nuova pratica'))}</button>
          <button class="btn secondary" type="button" data-action="reset-practice-list-filters">${U.escapeHtml(T.t('ui.resetPracticeListFilters', 'Reset filtri'))}</button>
        </div>
      </div>
      <div class="form-grid three practice-list-filter-grid">
        <div class="field"><label for="practiceListQuick">${U.escapeHtml(T.t('ui.quickFilter', 'Filtro rapido elenco'))}</label><input id="practiceListQuick" type="search" data-practice-list-filter="quick" value="${U.escapeHtml(filters.quick || '')}" placeholder="${U.escapeHtml(T.t('ui.practiceListQuickPlaceholder', 'Cliente, numero pratica, booking, container...'))}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListStatus">${U.escapeHtml(T.t('ui.statusFilter', 'Filtro stato'))}</label><select id="practiceListStatus" data-practice-list-filter="status">${statusOptions.map((item) => `<option value="${U.escapeHtml(item.value)}" ${filters.status === item.value ? 'selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}</select></div>
        <div class="field"><label for="practiceListDirection">${U.escapeHtml(T.t('ui.direction', 'Direzione'))}</label><select id="practiceListDirection" data-practice-list-filter="direction">${directionOptions.map((item) => `<option value="${U.escapeHtml(item.value)}" ${filters.direction === item.value ? 'selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}</select></div>
        <div class="field"><label for="practiceListType">${U.escapeHtml(T.t('ui.practiceType', 'Tipo pratica'))}</label><select id="practiceListType" data-practice-list-filter="practiceType">${practiceTypes.map((item) => `<option value="${U.escapeHtml(item.value)}" ${filters.practiceType === item.value ? 'selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}</select></div>
        <div class="field"><label for="practiceListReference">${U.escapeHtml(T.t('ui.generatedNumber', 'Numero pratica'))}</label><input id="practiceListReference" type="search" data-practice-list-filter="reference" value="${U.escapeHtml(filters.reference || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListClient">${U.escapeHtml(T.t('ui.clientRequired', 'Cliente'))}</label><input id="practiceListClient" type="search" data-practice-list-filter="client" value="${U.escapeHtml(filters.client || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListImporter">${U.escapeHtml(T.t('ui.importer', 'Importatore'))}</label><input id="practiceListImporter" type="search" data-practice-list-filter="importer" value="${U.escapeHtml(filters.importer || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListExporter">${U.escapeHtml(T.t('ui.shipper', 'Mittente / esportatore'))}</label><input id="practiceListExporter" type="search" data-practice-list-filter="exporter" value="${U.escapeHtml(filters.exporter || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListConsignee">${U.escapeHtml(T.t('ui.consignee', 'Destinatario'))}</label><input id="practiceListConsignee" type="search" data-practice-list-filter="consignee" value="${U.escapeHtml(filters.consignee || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListContainer">${U.escapeHtml(T.t('ui.containerCode', 'Container / telaio'))}</label><input id="practiceListContainer" type="search" data-practice-list-filter="container" value="${U.escapeHtml(filters.container || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListBooking">${U.escapeHtml(T.t('ui.bookingWord', 'Booking'))}</label><input id="practiceListBooking" type="search" data-practice-list-filter="booking" value="${U.escapeHtml(filters.booking || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListPolicy">${U.escapeHtml(T.t('ui.policyNumber', 'Polizza / BL / AWB'))}</label><input id="practiceListPolicy" type="search" data-practice-list-filter="policy" value="${U.escapeHtml(filters.policy || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListVessel">${U.escapeHtml(T.t('ui.vesselVoyage', 'Nave / viaggio'))}</label><input id="practiceListVessel" type="search" data-practice-list-filter="vessel" value="${U.escapeHtml(filters.vessel || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListOrigin">${U.escapeHtml(T.t('ui.originDirectory', 'Origine'))}</label><input id="practiceListOrigin" type="search" data-practice-list-filter="origin" value="${U.escapeHtml(filters.origin || '')}" autocomplete="off" /></div>
        <div class="field"><label for="practiceListDestination">${U.escapeHtml(T.t('ui.destinationDirectory', 'Destinazione'))}</label><input id="practiceListDestination" type="search" data-practice-list-filter="destination" value="${U.escapeHtml(filters.destination || '')}" autocomplete="off" /></div>
      </div>
      <div class="form-grid four practice-list-filter-grid compact-date-grid">
        <div class="field"><label for="practiceListDateFrom">${U.escapeHtml(T.t('ui.dateFrom', 'Data da'))}</label><input id="practiceListDateFrom" type="date" data-practice-list-filter="dateFrom" value="${U.escapeHtml(filters.dateFrom || '')}" /></div>
        <div class="field"><label for="practiceListDateTo">${U.escapeHtml(T.t('ui.dateTo', 'Data a'))}</label><input id="practiceListDateTo" type="date" data-practice-list-filter="dateTo" value="${U.escapeHtml(filters.dateTo || '')}" /></div>
        <div class="field"><label for="practiceListCompareDateFrom">${U.escapeHtml(T.t('ui.compareDateFrom', 'Confronta da'))}</label><input id="practiceListCompareDateFrom" type="date" data-practice-list-filter="compareDateFrom" value="${U.escapeHtml(filters.compareDateFrom || '')}" /></div>
        <div class="field"><label for="practiceListCompareDateTo">${U.escapeHtml(T.t('ui.compareDateTo', 'Confronta a'))}</label><input id="practiceListCompareDateTo" type="date" data-practice-list-filter="compareDateTo" value="${U.escapeHtml(filters.compareDateTo || '')}" /></div>
      </div>
      <div class="practice-list-toolbar-row">
        <div class="practice-list-toolbar-left">
          <span class="badge info">${U.escapeHtml(T.t('ui.practiceListSortBadge', 'Lettura elenco'))}</span>
          <span class="table-meta-cell">${U.escapeHtml(T.t('ui.practiceListSortHint', 'Ordina l’elenco e leggi subito il confronto attivo vs periodo confronto senza cambiare vista.'))}</span>
        </div>
        <div class="practice-list-toolbar-right">
          <div class="field compact">
            <label for="practiceListSortBy">${U.escapeHtml(T.t('ui.practiceListSortBy', 'Ordina per'))}</label>
            <select id="practiceListSortBy" data-practice-list-filter="sortBy">${sortOptions.map((item) => `<option value="${U.escapeHtml(item.value)}" ${activeSortBy === item.value ? 'selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}</select>
          </div>
          <div class="field compact">
            <label for="practiceListSortDirection">${U.escapeHtml(T.t('ui.practiceListSortDirection', 'Verso'))}</label>
            <select id="practiceListSortDirection" data-practice-list-filter="sortDirection">${sortDirectionOptions.map((item) => `<option value="${U.escapeHtml(item.value)}" ${activeSortDirection === item.value ? 'selected' : ''}>${U.escapeHtml(item.label)}</option>`).join('')}</select>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceListDirectionCompareTitle', 'Confronto per direzione'))}</h3>
          <p class="panel-subtitle">${U.escapeHtml(T.t('ui.practiceListDirectionCompareHint', 'Import, export e magazzino letti in parallelo tra range attivo e periodo di confronto.'))}</p>
        </div>
      </div>
      <div class="practice-compare-grid">
        <div class="practice-compare-row head">
          <span>${U.escapeHtml(T.t('ui.direction', 'Direzione'))}</span>
          <span>${U.escapeHtml(T.t('ui.practiceListActiveShort', 'Attivo'))}</span>
          <span>${U.escapeHtml(T.t('ui.practiceListCompareShort', 'Confronto'))}</span>
          <span>${U.escapeHtml(T.t('ui.practiceListDeltaShort', 'Delta'))}</span>
        </div>
        ${directionRows.map((row) => `<div class="practice-compare-row">
          <span class="practice-compare-label">${U.escapeHtml(T.t(row.labelKey, row.fallback))}</span>
          <span>${U.escapeHtml(String(row.active || 0))}</span>
          <span>${U.escapeHtml(String(row.compare || 0))}</span>
          <span><span class="badge ${row.delta > 0 ? '' : row.delta < 0 ? 'warning' : 'info'}">${row.delta > 0 ? '+' : ''}${U.escapeHtml(String(row.delta || 0))}</span></span>
        </div>`).join('')}
      </div>
    </section>

    ${renderPracticeStatusBreakdown(insights.statusBreakdown)}

    <section class="panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceListSubjectsTitle', 'Distribuzione per soggetti'))}</h3>
          <p class="panel-subtitle">${U.escapeHtml(T.t('ui.practiceListSubjectsHint', 'Leggi subito quante pratiche hai per cliente, importatore e mittente/esportatore nel range attivo e, se impostato, nel periodo di confronto.'))}</p>
        </div>
      </div>
      <div class="practice-subject-breakdown-grid">
        ${renderPracticeListBreakdownCard(T.t('ui.practiceListClientsBreakdown', 'Clienti'), subjectBreakdowns.client, { emptyText: T.t('ui.practiceListNoEntityRows', 'Nessun soggetto coerente con i filtri attivi.') })}
        ${renderPracticeListBreakdownCard(T.t('ui.practiceListImportersBreakdown', 'Importatori'), subjectBreakdowns.importer, { emptyText: T.t('ui.practiceListNoEntityRows', 'Nessun soggetto coerente con i filtri attivi.') })}
        ${renderPracticeListBreakdownCard(T.t('ui.practiceListExportersBreakdown', 'Mittenti / esportatori'), subjectBreakdowns.exporter, { emptyText: T.t('ui.practiceListNoEntityRows', 'Nessun soggetto coerente con i filtri attivi.') })}
      </div>
    </section>

    <section class="table-panel" id="practiceListSection">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">${U.escapeHtml(T.t('ui.practiceListResultsTitle', 'Risultati gestione pratiche'))}</h3>
          <p class="panel-subtitle">${U.escapeHtml(T.t('ui.practiceListResultsHint', 'Apri una pratica nel workspace interno all’app per lavorarla e salvarla senza sporcare la lista.'))}</p>
        </div>
        <div class="table-toolbar-summary">${U.escapeHtml(String(filtered.length))} ${U.escapeHtml(T.t('ui.visiblePractices', 'pratiche visibili'))}</div>
      </div>
      <div class="table-wrap">
        <table class="table practice-list-table">
          <thead>
            <tr>
              <th>${U.escapeHtml(T.t('ui.generatedNumber', 'Numero pratica'))}</th>
              <th>${U.escapeHtml(T.t('ui.practiceDate', 'Data pratica'))}</th>
              <th>${U.escapeHtml(T.t('ui.practiceTypeDisplay', 'Tipologia'))}</th>
              <th>${U.escapeHtml(T.t('ui.clientRequired', 'Cliente'))}</th>
              <th>${U.escapeHtml(T.t('ui.importer', 'Importatore'))}</th>
              <th>${U.escapeHtml(T.t('ui.destinationDirectory', 'Destinazione'))}</th>
              <th>${U.escapeHtml(T.t('ui.practiceListTransportRefs', 'Riferimenti trasporto'))}</th>
              <th>${U.escapeHtml(T.t('ui.status', 'Stato'))}</th>
              <th>${U.escapeHtml(T.t('ui.companyAction', 'Azione'))}</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map((practice) => {
              const values = helper.extractValues(practice);
              const draftTone = practice.draftIncomplete ? 'warning' : 'info';
              const draftLabel = practice.draftIncomplete
                ? T.t('ui.practiceListDraftIncomplete', 'Bozza incompleta')
                : T.t('ui.practiceListDraftComplete', 'Completa');
              const refs = [values.container, values.booking, values.policy].filter((item) => String(item || '').trim());
              return `<tr>
                <td>
                  <div class="table-title-cell">${U.escapeHtml(practice.reference || '—')}</div>
                  <div class="table-meta-cell">${U.escapeHtml(practice.category || '—')}</div>
                </td>
                <td>${U.escapeHtml(U.formatDate ? U.formatDate(values.practiceDate || practice.practiceDate || '') : (values.practiceDate || practice.practiceDate || '—'))}</td>
                <td>
                  <div class="table-title-cell">${U.escapeHtml(practice.practiceTypeLabel || practice.practiceType || '—')}</div>
                  <div class="table-meta-cell">${U.escapeHtml(values.exporter || '—')}</div>
                </td>
                <td>${U.escapeHtml(practice.clientName || practice.client || '—')}</td>
                <td>${U.escapeHtml(values.importer || '—')}</td>
                <td>${U.escapeHtml(values.destination || '—')}</td>
                <td>
                  <div class="practice-list-ref-stack">
                    ${refs.length ? refs.map((item) => `<span class="tag-pill practice-list-ref-pill">${U.escapeHtml(item)}</span>`).join('') : `<span class="table-meta-cell">${U.escapeHtml(T.t('ui.practiceListNoTransportRefs', 'Nessun riferimento'))}</span>`}
                  </div>
                </td>
                <td>
                  <div class="practice-list-status-stack">
                    <span class="badge ${practice.status === 'In attesa documenti' ? 'warning' : 'info'}">${U.escapeHtml(practice.status || '—')}</span>
                    <span class="badge ${draftTone}">${U.escapeHtml(draftLabel)}</span>
                  </div>
                </td>
                <td><button class="btn secondary small-btn" type="button" data-open-practice-id="${U.escapeHtml(practice.id)}">${U.escapeHtml(T.t('ui.openPracticeWorkspaceAction', 'Apri workspace'))}</button></td>
              </tr>`;
            }).join('') : `<tr><td colspan="9"><div class="empty-text">${U.escapeHtml(T.t('ui.noSearchResults', 'Nessun risultato coerente con la ricerca inserita.'))}</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;;
}

function contacts(state, module) {
  const MasterDataQuickAdd = getMasterDataQuickAdd();
  if (MasterDataQuickAdd && typeof MasterDataQuickAdd.renderPanel === 'function') {
    return MasterDataQuickAdd.renderPanel({ state, module, t: T, u: U });
  }
  return `
    <section class="hero">
      <div class="hero-meta">Master data</div>
      <h2>${U.escapeHtml(module.label)}</h2>
      <p>${U.escapeHtml(module.description)}</p>
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
    const configuredDocumentTypes = DocumentCategories && typeof DocumentCategories.getOptions === 'function'
      ? DocumentCategories.getOptions(state, T)
      : [];
    const documentTypeEditorValue = DocumentCategories && typeof DocumentCategories.serializeOptions === 'function'
      ? DocumentCategories.serializeOptions(state, T)
      : configuredDocumentTypes.map((item) => `${item.value}|${item.label}`).join('\n');

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


<section class="panel">
  <div class="panel-head">
    <div>
      <h3 class="panel-title">${U.escapeHtml(T.t('ui.documentCategoriesConfigTitle', 'Categorie documentali configurabili'))}</h3>
      <p class="panel-subtitle">${U.escapeHtml(T.t('ui.documentCategoriesConfigHint', 'Una riga per categoria nel formato valore|etichetta. Queste categorie alimentano Allegati pratica e Document Engine.'))}</p>
    </div>
  </div>
  <div class="toolbar-grid two">
    <div class="field full">
      <label for="documentTypeOptionsEditor">${U.escapeHtml(T.t('ui.documentCategoriesEditorLabel', 'Categorie documento'))}</label>
      <textarea id="documentTypeOptionsEditor" class="settings-code-editor" rows="10">${U.escapeHtml(documentTypeEditorValue)}</textarea>
      <div class="field-hint">${U.escapeHtml(T.t('ui.documentCategoriesEditorHint', 'Esempio: customsDocs|Documenti doganali'))}</div>
    </div>
    <div class="field full">
      <label>${U.escapeHtml(T.t('ui.documentCategoriesActiveList', 'Categorie attive'))}</label>
      <div class="tag-grid compact-tag-grid">
        ${configuredDocumentTypes.map((item) => `<span class="tag-pill">${U.escapeHtml(item.label)}</span>`).join('')}
      </div>
    </div>
  </div>
  <div class="action-row">
    <button class="btn" type="button" id="saveDocumentTypeOptions">${U.escapeHtml(T.t('ui.saveDocumentCategories', 'Salva categorie documentali'))}</button>
    <button class="btn secondary" type="button" id="resetDocumentTypeOptions">${U.escapeHtml(T.t('ui.resetDocumentCategories', 'Ripristina categorie default'))}</button>
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
    practicesHub,
    practiceList,
    documents,
    contacts,
    settings,
    moduleOverview,
    submodulePlaceholder
  };
})();
