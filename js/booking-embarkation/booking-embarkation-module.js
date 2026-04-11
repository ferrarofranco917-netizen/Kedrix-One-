window.KedrixOneBookingEmbarkationModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneBookingEmbarkationWorkspace || null;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function ensureState(state) {
    if (!Workspace || typeof Workspace.ensureState !== 'function') return null;
    Workspace.ensureState(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!Array.isArray(state.bookingEmbarkationRecords)) state.bookingEmbarkationRecords = [];
    return state.bookingEmbarkationWorkspace;
  }

  function currentOperatorName(state) {
    const activeUserId = String(state?.activeUserId || '').trim();
    const user = (state?.users || []).find((entry) => String(entry?.id || '').trim() === activeUserId) || null;
    return String(user?.name || '').trim();
  }

  function createEmptyDraft(state, overrides = {}) {
    return Workspace.cloneDraft({
      editingRecordId: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      status: 'draft',
      documentDate: today(),
      copies: '1',
      transitary: '',
      company: '',
      attentionTo: '',
      email: '',
      loadingPlace: '',
      loadingDate: '',
      loadingPort: '',
      unloadingPort: '',
      vessel: '',
      voyage: '',
      customsTo: '',
      positioning: '',
      positioningAt: '',
      finalDestination: '',
      goods: '',
      weight: '',
      freightMode: 'PREPAID',
      bookingReference: '',
      containers: '',
      ets: '',
      vgmReason: '',
      vgmCost: '',
      vgmCurrency: 'EUR',
      internalText: '',
      customerText: '',
      operatorName: currentOperatorName(state),
      sourcePracticeSnapshot: {},
      ...overrides
    });
  }

  function buildDraftFromPractice(state, practice) {
    const dynamic = practice?.dynamicData || {};
    return createEmptyDraft(state, {
      practiceId: String(practice?.id || '').trim(),
      practiceReference: String(practice?.reference || '').trim(),
      practiceType: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
      documentDate: String(practice?.practiceDate || today()).trim() || today(),
      copies: String(dynamic.originalCopies || dynamic.copies || '1').trim() || '1',
      transitary: String(practice?.clientName || practice?.client || '').trim(),
      company: String(dynamic.shippingCompany || dynamic.company || '').trim(),
      attentionTo: String(dynamic.attentionTo || '').trim(),
      email: String(dynamic.email || dynamic.contactEmail || '').trim(),
      loadingPlace: String(dynamic.loadingPlace || dynamic.pickupLocation || '').trim(),
      loadingDate: String(dynamic.loadingDate || dynamic.pickupDate || '').trim(),
      loadingPort: String(dynamic.loadingPort || dynamic.portOfLoading || dynamic.originPort || '').trim(),
      unloadingPort: String(dynamic.unloadingPort || dynamic.portOfDischarge || dynamic.destinationPort || '').trim(),
      vessel: String(dynamic.vessel || '').trim(),
      voyage: String(dynamic.voyage || '').trim(),
      customsTo: String(dynamic.customsOffice || dynamic.customsTo || '').trim(),
      positioning: String(dynamic.positioning || '').trim(),
      positioningAt: String(dynamic.positioningAt || dynamic.depot || '').trim(),
      finalDestination: String(dynamic.finalDestination || dynamic.destination || '').trim(),
      goods: String(practice?.goodsDescription || dynamic.goodsDescription || '').trim(),
      weight: String(practice?.grossWeight || dynamic.grossWeight || '').trim(),
      freightMode: String(dynamic.freightMode || dynamic.nolo || 'PREPAID').trim() || 'PREPAID',
      bookingReference: String(practice?.booking || dynamic.booking || '').trim(),
      containers: String(practice?.containerCode || dynamic.containerCode || dynamic.containers || '').trim(),
      ets: String(dynamic.ets || '').trim(),
      vgmReason: String(dynamic.vgmReason || '').trim(),
      vgmCost: String(dynamic.vgmCost || '').trim(),
      vgmCurrency: String(dynamic.vgmCurrency || 'EUR').trim() || 'EUR',
      sourcePracticeSnapshot: {
        id: String(practice?.id || '').trim(),
        reference: String(practice?.reference || '').trim(),
        type: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
        status: String(practice?.status || '').trim()
      }
    });
  }

  function seaPractices(state) {
    return (state?.practices || []).filter((practice) => String(practice?.practiceType || '').includes('sea'));
  }

  function buildKpis(state) {
    const records = Array.isArray(state?.bookingEmbarkationRecords) ? state.bookingEmbarkationRecords : [];
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const linkedPractices = new Set(records.map((record) => String(record?.practiceId || '').trim()).filter(Boolean));
    return {
      records: records.length,
      openMasks: sessions.length,
      linkedPractices: linkedPractices.size
    };
  }

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const rows = Number(options.rows || 4);
    const items = Array.isArray(options.items) ? options.items : [];
    const fullClass = options.full ? ' full' : '';
    const disabled = options.disabled ? ' disabled' : '';
    const placeholder = U.escapeHtml(options.placeholder || '');
    const baseAttrs = `id="be-${U.escapeHtml(name)}" data-booking-embarkation-field="${U.escapeHtml(name)}"${disabled}`;
    if (type === 'textarea') {
      return `<div class="field${fullClass}"><label for="be-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><textarea ${baseAttrs} rows="${rows}" placeholder="${placeholder}">${U.escapeHtml(value || '')}</textarea></div>`;
    }
    if (type === 'select') {
      return `<div class="field${fullClass}"><label for="be-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><select ${baseAttrs}>${items.map((item) => {
        const itemValue = String(item?.value ?? '');
        const selected = itemValue === String(value ?? '') ? ' selected' : '';
        return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
      }).join('')}</select></div>`;
    }
    return `<div class="field${fullClass}"><label for="be-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><input ${baseAttrs} type="${U.escapeHtml(type)}" value="${U.escapeHtml(value || '')}" placeholder="${placeholder}"></div>`;
  }

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const activeId = String(state?.bookingEmbarkationWorkspace?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel practice-workspace-panel booking-embarkation-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.bookingEmbarkationMasksHint', 'Più booking d’imbarco possono restare aperti contemporaneamente.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-booking-embarkation-new-session>${U.escapeHtml(i18n?.t('ui.newMask', 'Nuova maschera'))}</button></div>
        </div>
        <div class="practice-session-strip">
          ${sessions.map((session) => {
            const draft = session?.draft || {};
            const title = String(draft.practiceReference || i18n?.t('ui.bookingEmbarkationUntitled', 'Nuovo booking d’imbarco') || 'Nuovo booking d’imbarco').trim();
            const meta = [draft.practiceType, draft.bookingReference].filter(Boolean).join(' · ');
            const active = session.id === activeId;
            return `
              <button class="practice-session-chip${active ? ' active' : ''}" type="button" data-booking-embarkation-session-switch="${U.escapeHtml(session.id)}">
                <strong>${U.escapeHtml(title)}</strong>
                <span>${U.escapeHtml(meta || '—')}</span>
                ${session.isDirty ? '<em>•</em>' : ''}
              </button>`;
          }).join('')}
        </div>
      </section>`;
  }

  function renderLauncher(state, i18n, selectedPractice) {
    const available = seaPractices(state);
    const selectedSea = selectedPractice && String(selectedPractice.practiceType || '').includes('sea') ? selectedPractice : null;
    return `
      <section class="panel booking-embarkation-launcher-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.bookingEmbarkationLauncherTitle', 'Apri o crea booking d’imbarco'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.bookingEmbarkationLauncherHint', 'Apri il documento dalla pratica mare attiva o scegli una pratica dall’elenco.'))}</p>
          </div>
          <div class="action-row">
            ${selectedSea ? `<button class="btn" type="button" data-booking-embarkation-open-active>${U.escapeHtml(i18n?.t('ui.useCurrentPractice', 'Usa pratica attiva'))}</button>` : ''}
            <button class="btn secondary" type="button" data-booking-embarkation-new-session>${U.escapeHtml(i18n?.t('ui.newBlankDocument', 'Nuovo documento vuoto'))}</button>
          </div>
        </div>
        <div class="form-grid three booking-embarkation-practice-grid">
          ${available.slice(0, 18).map((practice) => `
            <button class="stack-item booking-embarkation-practice-chip" type="button" data-booking-embarkation-open-practice="${U.escapeHtml(practice.id)}">
              <strong>${U.escapeHtml(practice.reference || '—')}</strong>
              <span>${U.escapeHtml(practice.clientName || practice.client || '')}</span>
              <span>${U.escapeHtml(practice.practiceTypeLabel || practice.practiceType || '')}</span>
            </button>`).join('')}
        </div>
      </section>`;
  }

  function renderSummaryPills(draft, i18n) {
    const items = [
      [i18n?.t('ui.generatedNumber', 'Numero pratica'), draft.practiceReference || '—'],
      [i18n?.t('ui.practiceType', 'Tipo pratica'), draft.practiceType || '—'],
      [i18n?.t('ui.bookingWord', 'Booking'), draft.bookingReference || '—'],
      [i18n?.t('ui.company', 'Compagnia'), draft.company || '—']
    ];
    return `<div class="tag-grid booking-embarkation-summary-pills">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderGeneralTab(draft, i18n) {
    return `
      ${renderSummaryPills(draft, i18n)}
      <div class="form-grid three booking-embarkation-form-grid">
        ${renderField(i18n?.t('ui.date', 'Data pratica'), 'documentDate', draft.documentDate, { type: 'date' })}
        ${renderField(i18n?.t('ui.copies', 'Copie'), 'copies', draft.copies)}
        ${renderField(i18n?.t('ui.transitary', 'Transitario'), 'transitary', draft.transitary)}
        ${renderField(i18n?.t('ui.company', 'Compagnia'), 'company', draft.company)}
        ${renderField(i18n?.t('ui.bookingEmbarkationAttentionTo', 'All’attenzione di'), 'attentionTo', draft.attentionTo)}
        ${renderField(i18n?.t('ui.email', 'Email'), 'email', draft.email, { type: 'email' })}
        ${renderField(i18n?.t('ui.bookingEmbarkationLoadingPlace', 'Luogo carico'), 'loadingPlace', draft.loadingPlace)}
        ${renderField(i18n?.t('ui.bookingEmbarkationLoadingDate', 'Data carico'), 'loadingDate', draft.loadingDate, { type: 'date' })}
        ${renderField(i18n?.t('ui.bookingEmbarkationLoadingPort', 'Porto carico'), 'loadingPort', draft.loadingPort)}
        ${renderField(i18n?.t('ui.bookingEmbarkationUnloadingPort', 'Porto scarico'), 'unloadingPort', draft.unloadingPort)}
        ${renderField(i18n?.t('ui.vessel', 'Nave'), 'vessel', draft.vessel)}
        ${renderField(i18n?.t('ui.voyage', 'Viaggio'), 'voyage', draft.voyage)}
        ${renderField(i18n?.t('ui.bookingEmbarkationCustomsTo', 'Dogana a'), 'customsTo', draft.customsTo)}
        ${renderField(i18n?.t('ui.bookingEmbarkationPositioning', 'Posizionamento'), 'positioning', draft.positioning)}
        ${renderField(i18n?.t('ui.bookingEmbarkationPositioningAt', 'Posizionamento presso'), 'positioningAt', draft.positioningAt)}
        ${renderField(i18n?.t('ui.bookingEmbarkationFinalDestination', 'Destinazione finale'), 'finalDestination', draft.finalDestination)}
        ${renderField(i18n?.t('ui.goods', 'Merce'), 'goods', draft.goods, { type: 'textarea', rows: 4, full: true })}
        ${renderField(i18n?.t('ui.weight', 'Peso'), 'weight', draft.weight)}
        ${renderField(i18n?.t('ui.freight', 'Nolo'), 'freightMode', draft.freightMode, { type: 'select', items: [{ value: 'PREPAID', label: 'PREPAID' }, { value: 'COLLECT', label: 'COLLECT' }] })}
        ${renderField(i18n?.t('ui.bookingWord', 'Booking'), 'bookingReference', draft.bookingReference)}
        ${renderField(i18n?.t('ui.container', 'Containers'), 'containers', draft.containers)}
        ${renderField(i18n?.t('ui.bookingEmbarkationEts', 'E.T.S.'), 'ets', draft.ets, { type: 'date' })}
        ${renderField(i18n?.t('ui.bookingEmbarkationVgmReason', 'VGM causale'), 'vgmReason', draft.vgmReason)}
        ${renderField(i18n?.t('ui.bookingEmbarkationVgmCost', 'VGM costo'), 'vgmCost', draft.vgmCost)}
        ${renderField(i18n?.t('ui.currency', 'Valuta'), 'vgmCurrency', draft.vgmCurrency, { type: 'select', items: [{ value: 'EUR', label: 'EUR' }, { value: 'USD', label: 'USD' }] })}
      </div>`;
  }

  function renderTextsTab(draft, i18n) {
    return `
      <div class="form-grid two booking-embarkation-form-grid">
        ${renderField(i18n?.t('ui.bookingEmbarkationInternalText', 'Testo interno'), 'internalText', draft.internalText, { type: 'textarea', rows: 10, full: true })}
        ${renderField(i18n?.t('ui.bookingEmbarkationCustomerText', 'Testo cliente'), 'customerText', draft.customerText, { type: 'textarea', rows: 10, full: true })}
      </div>`;
  }

  function renderEditor(state, i18n) {
    const session = Workspace?.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) }) || null;
    if (!session) return '';
    const draft = session.draft || createEmptyDraft(state);
    const activeTab = String(session?.uiState?.tab || 'general').trim() || 'general';
    return `
      <section class="panel booking-embarkation-editor-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.bookingEmbarkationTitle', 'Booking d’imbarco'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.bookingEmbarkationEditorHint', 'Documento operativo collegato alla pratica madre, con dati generali e testi pronti per stampa o invio.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-booking-embarkation-save-continue>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-booking-embarkation-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        <div class="tab-row booking-embarkation-tabs">
          <button class="tab-chip${activeTab === 'general' ? ' active' : ''}" type="button" data-booking-embarkation-tab="general">${U.escapeHtml(i18n?.t('ui.general', 'Generale'))}</button>
          <button class="tab-chip${activeTab === 'texts' ? ' active' : ''}" type="button" data-booking-embarkation-tab="texts">${U.escapeHtml(i18n?.t('ui.texts', 'Testi'))}</button>
        </div>
        ${activeTab === 'texts' ? renderTextsTab(draft, i18n) : renderGeneralTab(draft, i18n)}
      </section>`;
  }

  function renderSavedRecords(state, i18n) {
    const records = Array.isArray(state?.bookingEmbarkationRecords) ? state.bookingEmbarkationRecords : [];
    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.bookingEmbarkationSavedHint', 'Riapri rapidamente i booking d’imbarco già generati.'))}</p>
          </div>
        </div>
        <div class="module-card-grid booking-embarkation-records-grid">
          ${records.length ? records.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).map((record) => `
            <button class="module-card booking-embarkation-record-card" type="button" data-booking-embarkation-open-record="${U.escapeHtml(record.id)}">
              <div><strong>${U.escapeHtml(record.practiceReference || '—')}</strong><div class="module-card-meta">${U.escapeHtml(record.practiceType || '—')}</div></div>
              <div class="module-card-meta">${U.escapeHtml(record.bookingReference || '—')}</div>
              <div class="module-card-meta">${U.escapeHtml(record.company || '—')}</div>
            </button>`).join('') : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noSavedDocuments', 'Nessun documento salvato.'))}</div>`}
        </div>
      </section>`;
  }

  function render(state, options = {}) {
    const { i18n } = options;
    ensureState(state);
    const kpis = buildKpis(state);
    const selectedPractice = typeof options.getSelectedPractice === 'function' ? options.getSelectedPractice() : null;
    return `
      <section class="hero">
        <div class="hero-meta">${U.escapeHtml(i18n?.t('ui.bookingEmbarkationEyebrow', 'PRATICHE · BOOKING D’IMBARCO'))}</div>
        <h2>${U.escapeHtml(i18n?.t('practices/booking-d-imbarco', 'Booking d’imbarco'))}</h2>
        <p>${U.escapeHtml(i18n?.t('ui.bookingEmbarkationIntro', 'Sottomodulo operativo dedicato ai booking di imbarco collegati alla pratica madre.'))}</p>
      </section>
      <section class="three-col">
        <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.records))}</div></div>
        <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.openMasks))}</div></div>
        <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.linkedPractices', 'Pratiche collegate'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.linkedPractices))}</div></div>
      </section>
      ${renderLauncher(state, i18n, selectedPractice)}
      ${renderSessionStrip(state, i18n)}
      ${renderEditor(state, i18n)}
      ${renderSavedRecords(state, i18n)}
    `;
  }

  function upsertRecord(state, session) {
    if (!session || !session.draft) return null;
    if (!Array.isArray(state.bookingEmbarkationRecords)) state.bookingEmbarkationRecords = [];
    const draft = Workspace.cloneDraft(session.draft);
    const now = new Date().toISOString();
    const next = {
      id: String(draft.editingRecordId || '').trim() || `be-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      ...draft,
      editingRecordId: String(draft.editingRecordId || '').trim() || '',
      createdAt: String(draft.createdAt || now),
      updatedAt: now
    };
    next.editingRecordId = next.id;
    const index = state.bookingEmbarkationRecords.findIndex((record) => String(record?.id || '').trim() === next.id);
    if (index === -1) state.bookingEmbarkationRecords.unshift(next);
    else state.bookingEmbarkationRecords.splice(index, 1, next);
    session.draft = Workspace.cloneDraft(next);
    Workspace.markSessionSaved(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
    return next;
  }

  function findRecord(state, recordId) {
    return (state?.bookingEmbarkationRecords || []).find((record) => String(record?.id || '').trim() === String(recordId || '').trim()) || null;
  }

  function bind(context = {}) {
    const { root, state, save, render, toast, i18n, getSelectedPractice, confirmClose } = context;
    if (!root || !state || !Workspace) return;

    root.querySelectorAll('[data-booking-embarkation-new-session]').forEach((button) => {
      button.addEventListener('click', () => {
        ensureState(state);
        Workspace.openDraftSession(state, { createEmptyDraft: () => createEmptyDraft(state), draft: createEmptyDraft(state), source: 'manual', isDirty: true });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-booking-embarkation-open-active]').forEach((button) => {
      button.addEventListener('click', () => {
        const practice = typeof getSelectedPractice === 'function' ? getSelectedPractice() : null;
        if (!practice) return;
        Workspace.openDraftSession(state, {
          createEmptyDraft: () => createEmptyDraft(state),
          draft: buildDraftFromPractice(state, practice),
          source: 'practice',
          isDirty: true
        });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-booking-embarkation-open-practice]').forEach((button) => {
      button.addEventListener('click', () => {
        const practiceId = button.dataset.bookingEmbarkationOpenPractice;
        const practice = (state.practices || []).find((entry) => String(entry?.id || '').trim() === String(practiceId || '').trim()) || null;
        if (!practice) return;
        Workspace.openDraftSession(state, {
          createEmptyDraft: () => createEmptyDraft(state),
          draft: buildDraftFromPractice(state, practice),
          source: 'practice',
          isDirty: true
        });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-booking-embarkation-open-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = findRecord(state, button.dataset.bookingEmbarkationOpenRecord);
        if (!record) return;
        Workspace.openRecordSession(state, record, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-booking-embarkation-session-switch]').forEach((button) => {
      button.addEventListener('click', () => {
        Workspace.switchSession(state, button.dataset.bookingEmbarkationSessionSwitch, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-booking-embarkation-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionTab(state, session.id, button.dataset.bookingEmbarkationTab, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-booking-embarkation-field]').forEach((field) => {
      const handler = () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionField(state, session.id, field.dataset.bookingEmbarkationField, field.value, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
      };
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    root.querySelectorAll('[data-booking-embarkation-save-continue]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        save?.();
        render?.();
        toast?.(i18n?.t('ui.bookingEmbarkationSaved', 'Booking d’imbarco salvato'), 'success');
      });
    });

    root.querySelectorAll('[data-booking-embarkation-save-close]').forEach((button) => {
      button.addEventListener('click', async () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        Workspace.closeSession(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
        toast?.(i18n?.t('ui.bookingEmbarkationSaved', 'Booking d’imbarco salvato'), 'success');
      });
    });
  }

  return {
    ensureState,
    createEmptyDraft,
    render,
    bind
  };
})();
