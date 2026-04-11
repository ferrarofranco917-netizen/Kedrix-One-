window.KedrixOneBookingEmbarkationModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneBookingEmbarkationWorkspace || null;

  const SEA_TYPES = new Set(['sea_import', 'sea_export']);
  const FREIGHT_OPTIONS = ['', 'PREPAID', 'COLLECT'];
  const POSITIONING_OPTIONS = ['', 'A nostra cura', 'A vostra cura'];
  const VGM_OPTIONS = ['', 'VGM a nostra cura', 'VGM a cura shipper', 'VGM a vostra cura'];
  const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CNY'];

  function label(it, en, i18n) {
    return i18n?.getLanguage?.() === 'en' ? en : it;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function extractCode(value = '') {
    const raw = String(value || '').trim();
    const match = raw.match(/^([A-Z0-9]{3,10})\s*[-–]/i);
    return match ? match[1].toUpperCase() : '';
  }

  function eligiblePractices(state) {
    return (state?.practices || [])
      .filter((practice) => SEA_TYPES.has(String(practice?.practiceType || '').trim()))
      .slice()
      .sort((left, right) => String(right?.practiceDate || '').localeCompare(String(left?.practiceDate || '')));
  }

  function getPracticeById(state, practiceId) {
    return eligiblePractices(state).find((practice) => String(practice?.id || '').trim() === String(practiceId || '').trim()) || null;
  }

  function recentPractices(state, limit = 10) {
    return eligiblePractices(state).slice(0, limit);
  }

  function findPracticeBySearch(state, rawTerm = '') {
    const term = String(rawTerm || '').trim().toLowerCase();
    if (!term) return { practice: null, totalMatches: 0, mode: '' };
    const matches = eligiblePractices(state).filter((practice) => {
      const dynamic = practice?.dynamicData || {};
      const haystack = [
        practice.reference,
        practice.clientName,
        practice.client,
        practice.booking,
        dynamic.booking,
        practice.containerCode,
        dynamic.containerCode,
        practice.portLoading,
        dynamic.portLoading,
        practice.portDischarge,
        dynamic.portDischarge,
        dynamic.company,
        practice.customsOffice,
        dynamic.customsOffice
      ].map((item) => String(item || '').toLowerCase());
      return haystack.some((item) => item.includes(term));
    });
    const exact = matches.find((practice) => String(practice?.reference || '').trim().toLowerCase() === term) || null;
    return {
      practice: exact || matches[0] || null,
      totalMatches: matches.length,
      mode: exact ? 'exact' : (matches.length ? 'fuzzy' : '')
    };
  }

  function ensureState(state) {
    if (!Workspace || typeof Workspace.ensureState !== 'function') return null;
    Workspace.ensureState(state, { createEmptyDraft: () => createEmptyDraft() });
    if (!Array.isArray(state.bookingEmbarkationRecords)) state.bookingEmbarkationRecords = [];
    return state.bookingEmbarkationWorkspace;
  }

  function createEmptyDraft(overrides = {}) {
    return {
      editingRecordId: '',
      documentReference: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      practiceTypeLabel: '',
      practiceDate: today(),
      copies: '',
      transitary: '',
      transitaryPreview: '',
      company: '',
      attentionTo: '',
      fax: '',
      loadPlace: '',
      loadingDate: '',
      loadingTime: '',
      portLoading: '',
      portLoadingCode: '',
      portDischarge: '',
      portDischargeCode: '',
      vessel: '',
      voyage: '',
      customsAt: '',
      positioning: '',
      positioningAt: '',
      positioningPreview: '',
      finalDestination: '',
      goods: '',
      weight: '',
      freightMode: '',
      booking: '',
      containers: '',
      ets: '',
      vgmMode: '',
      vgmCost: '',
      vgmCostCurrency: 'EUR',
      generalText: '',
      additionalText: '',
      footerText: '',
      notes: '',
      sourcePracticeSnapshot: {},
      ...overrides
    };
  }

  function buildDraftFromPractice(practice, i18n) {
    const dynamic = practice?.dynamicData || {};
    const portLoading = String(dynamic.portLoading || practice?.portLoading || '').trim();
    const portDischarge = String(dynamic.portDischarge || practice?.portDischarge || '').trim();
    return createEmptyDraft({
      practiceId: String(practice?.id || '').trim(),
      practiceReference: String(practice?.reference || '').trim(),
      practiceType: String(practice?.practiceType || '').trim(),
      practiceTypeLabel: String(practice?.practiceTypeLabel || '').trim(),
      practiceDate: String(practice?.practiceDate || '').trim() || today(),
      copies: String(dynamic.policyCopies || '').trim(),
      transitary: String(dynamic.transitary || '').trim(),
      transitaryPreview: [dynamic.transitary, dynamic.transitaryAddress, dynamic.transitaryCity].filter(Boolean).join(' · '),
      company: String(dynamic.company || practice?.carrier || '').trim(),
      attentionTo: String(dynamic.clientContact || '').trim(),
      fax: String(dynamic.clientFax || '').trim(),
      loadPlace: String(dynamic.pickupPlace || practice?.portLoading || '').trim(),
      loadingDate: String(dynamic.loadingDate || dynamic.pickupDate || '').trim(),
      loadingTime: String(dynamic.loadingTime || '').trim(),
      portLoading,
      portLoadingCode: extractCode(portLoading),
      portDischarge,
      portDischargeCode: extractCode(portDischarge),
      vessel: String(dynamic.vessel || '').trim(),
      voyage: String(dynamic.voyage || '').trim(),
      customsAt: String(dynamic.customsOffice || practice?.customsOffice || '').trim(),
      positioning: String(dynamic.positioning || '').trim(),
      positioningAt: String(dynamic.positioningAt || '').trim(),
      positioningPreview: [dynamic.positioningAt, dynamic.pickupPlace, dynamic.deliveryPlace].filter(Boolean).join(' · '),
      finalDestination: String(dynamic.deliveryPlace || dynamic.destinationRef || practice?.consignee || '').trim(),
      goods: String(practice?.goodsDescription || dynamic.goodsDescription || '').trim(),
      weight: String(practice?.grossWeight || dynamic.grossWeight || '').trim(),
      freightMode: String(dynamic.freightMode || '').trim(),
      booking: String(practice?.booking || dynamic.booking || '').trim(),
      containers: String(practice?.containerCode || dynamic.containerCode || '').trim(),
      ets: String(dynamic.ets || '').trim(),
      vgmMode: String(dynamic.vgmMode || '').trim(),
      vgmCost: String(dynamic.vgmCost || '').trim(),
      vgmCostCurrency: String(dynamic.vgmCostCurrency || 'EUR').trim() || 'EUR',
      generalText: [
        label('Gentile compagnia, si conferma il booking in imbarco secondo i dati collegati alla pratica.', 'Dear carrier, the boarding booking is confirmed according to the data linked to the mother practice.', i18n),
        label('Verificare disponibilità nave, cut-off e posizionamento.', 'Please verify vessel availability, cut-off and positioning.', i18n)
      ].join('\n'),
      additionalText: '',
      footerText: '',
      notes: String(practice?.notes || '').trim(),
      sourcePracticeSnapshot: {
        reference: String(practice?.reference || '').trim(),
        client: String(practice?.clientName || practice?.client || '').trim(),
        company: String(dynamic.company || '').trim(),
        portLoading,
        portDischarge,
        booking: String(practice?.booking || dynamic.booking || '').trim(),
        containers: String(practice?.containerCode || dynamic.containerCode || '').trim()
      }
    });
  }

  function activeSession(state) {
    return Workspace?.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft() }) || null;
  }

  function nextRecordReference(state, draft = {}) {
    const year = String((draft.practiceDate || today()).slice(0, 4) || new Date().getFullYear());
    const currentMax = (state?.bookingEmbarkationRecords || []).reduce((max, record) => {
      const match = String(record?.documentReference || '').match(/BKI-(\d{4})-(\d+)/i);
      if (!match) return max;
      if (match[1] !== year) return max;
      return Math.max(max, Number(match[2] || 0) || 0);
    }, 0);
    return `BKI-${year}-${currentMax + 1}`;
  }

  function normalizeDraftForSave(state, draft = {}) {
    const now = nowIso();
    const recordId = String(draft.editingRecordId || '').trim() || `bki-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      ...createEmptyDraft(draft),
      id: recordId,
      editingRecordId: recordId,
      documentReference: String(draft.documentReference || '').trim() || nextRecordReference(state, draft),
      updatedAt: now,
      createdAt: String(draft.createdAt || '').trim() || now,
      sourcePracticeSnapshot: draft?.sourcePracticeSnapshot && typeof draft.sourcePracticeSnapshot === 'object'
        ? { ...draft.sourcePracticeSnapshot }
        : {}
    };
  }

  function upsertRecord(state, record = {}) {
    const next = normalizeDraftForSave(state, record);
    const records = Array.isArray(state.bookingEmbarkationRecords) ? state.bookingEmbarkationRecords : [];
    const index = records.findIndex((entry) => String(entry?.id || '').trim() === String(next.id || '').trim());
    if (index === -1) {
      state.bookingEmbarkationRecords = [next, ...records];
    } else {
      state.bookingEmbarkationRecords = [
        next,
        ...records.slice(0, index),
        ...records.slice(index + 1)
      ];
    }
    return next;
  }

  function syncSessionDraft(session, record) {
    if (!session || !record) return;
    session.draft = createEmptyDraft(record);
    session.draft.editingRecordId = String(record.id || '').trim();
    session.draft.documentReference = String(record.documentReference || '').trim();
  }

  function validationErrors(draft, i18n) {
    const errors = [];
    if (!String(draft?.practiceId || '').trim()) errors.push(label('Collega una pratica madre valida prima del salvataggio.', 'Link a valid mother practice before saving.', i18n));
    if (!String(draft?.company || '').trim()) errors.push(label('Compagnia obbligatoria.', 'Carrier company is required.', i18n));
    if (!String(draft?.booking || '').trim()) errors.push(label('Booking obbligatorio.', 'Booking reference is required.', i18n));
    return errors;
  }

  function renderOption(value, current) {
    const clean = String(value || '').trim();
    return `<option value="${U.escapeHtml(clean)}"${clean === String(current || '').trim() ? ' selected' : ''}>${U.escapeHtml(clean || '—')}</option>`;
  }

  function renderField(labelText, fieldName, value, options = {}) {
    const type = options.type || 'text';
    const full = options.full ? ' full' : '';
    const readonly = options.readonly ? ' readonly' : '';
    const placeholder = U.escapeHtml(options.placeholder || '');
    const inputId = `booking-emb-${fieldName}`;
    if (type === 'textarea') {
      const rows = Number(options.rows || 4);
      return `<div class="field${full}"><label for="${U.escapeHtml(inputId)}">${U.escapeHtml(labelText)}</label><textarea id="${U.escapeHtml(inputId)}" data-booking-embarkation-field="${U.escapeHtml(fieldName)}" rows="${rows}" placeholder="${placeholder}"${readonly}>${U.escapeHtml(value || '')}</textarea>${options.hint ? `<div class="field-hint">${U.escapeHtml(options.hint)}</div>` : ''}</div>`;
    }
    if (type === 'select') {
      const items = Array.isArray(options.items) ? options.items : [];
      return `<div class="field${full}"><label for="${U.escapeHtml(inputId)}">${U.escapeHtml(labelText)}</label><select id="${U.escapeHtml(inputId)}" data-booking-embarkation-field="${U.escapeHtml(fieldName)}">${items.map((item) => renderOption(item, value)).join('')}</select>${options.hint ? `<div class="field-hint">${U.escapeHtml(options.hint)}</div>` : ''}</div>`;
    }
    return `<div class="field${full}"><label for="${U.escapeHtml(inputId)}">${U.escapeHtml(labelText)}</label><input id="${U.escapeHtml(inputId)}" type="${U.escapeHtml(type)}" value="${U.escapeHtml(value || '')}" placeholder="${placeholder}" data-booking-embarkation-field="${U.escapeHtml(fieldName)}"${readonly}>${options.hint ? `<div class="field-hint">${U.escapeHtml(options.hint)}</div>` : ''}</div>`;
  }

  function renderSummaryPills(state, i18n) {
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft() }) || [];
    const records = Array.isArray(state?.bookingEmbarkationRecords) ? state.bookingEmbarkationRecords : [];
    const linkedPractices = new Set(records.map((record) => String(record?.practiceId || '').trim()).filter(Boolean));
    return `
      <section class="kpi-grid booking-embarkation-summary-pills">
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(label('Documenti Booking d’imbarco', 'Boarding booking records', i18n))}</div><div class="kpi-value">${records.length}</div><div class="kpi-hint">${U.escapeHtml(label('Sottomodulo reale collegato alle pratiche mare.', 'Real submodule linked to sea practices.', i18n))}</div></article>
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(label('Maschere aperte', 'Open masks', i18n))}</div><div class="kpi-value">${sessions.length}</div><div class="kpi-hint">${U.escapeHtml(label('Workspace interno multi-maschera dedicato al documento.', 'Internal multi-mask workspace dedicated to the document.', i18n))}</div></article>
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(label('Pratiche collegate', 'Linked practices', i18n))}</div><div class="kpi-value">${linkedPractices.size}</div><div class="kpi-hint">${U.escapeHtml(label('Pivot relazionale verso la pratica madre.', 'Relational pivot toward the mother practice.', i18n))}</div></article>
      </section>`;
  }

  function renderLauncher(state, i18n) {
    const recents = recentPractices(state, 12);
    return `
      <section class="panel practice-workspace-panel booking-embarkation-launcher">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(label('Avvio Booking d’imbarco', 'Boarding booking launcher', i18n))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(label('Apri una nuova maschera partendo dalla pratica madre o da una ricerca mirata. Direzione logica derivata da SP1 ma resa nativa Kedrix.', 'Open a new internal mask from the mother practice or from a targeted search. Logic derived from SP1 and translated into Kedrix.', i18n))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-booking-embarkation-open-active-practice>${U.escapeHtml(label('Apri pratica attiva', 'Open active practice', i18n))}</button>
          </div>
        </div>
        <div class="booking-embarkation-launcher-grid">
          <article class="panel booking-embarkation-launcher-card">
            <div class="summary-kicker">${U.escapeHtml(label('Pratiche recenti mare', 'Recent sea practices', i18n))}</div>
            <div class="booking-embarkation-practice-picker">
              <div class="field customs-inline-field">
                <label for="bookingEmbarkationPracticePicker">${U.escapeHtml(label('Scegli pratica', 'Choose practice', i18n))}</label>
                <select id="bookingEmbarkationPracticePicker" data-booking-embarkation-practice-picker>
                  <option value="">${U.escapeHtml(label('Seleziona una pratica mare', 'Select a sea practice', i18n))}</option>
                  ${recents.map((practice) => `<option value="${U.escapeHtml(practice.id)}">${U.escapeHtml(practice.reference)} · ${U.escapeHtml(practice.clientName || practice.client || '')}</option>`).join('')}
                </select>
              </div>
              <button class="btn" type="button" data-booking-embarkation-open-picked-practice>${U.escapeHtml(label('Apri maschera', 'Open mask', i18n))}</button>
            </div>
          </article>
          <article class="panel booking-embarkation-launcher-card">
            <div class="summary-kicker">${U.escapeHtml(label('Ricerca mirata', 'Targeted search', i18n))}</div>
            <div class="booking-embarkation-practice-search">
              <div class="field customs-inline-field">
                <label for="bookingEmbarkationPracticeSearch">${U.escapeHtml(label('Cerca pratica', 'Search practice', i18n))}</label>
                <input id="bookingEmbarkationPracticeSearch" type="search" data-booking-embarkation-practice-search placeholder="${U.escapeHtml(label('Numero pratica, booking, container, cliente...', 'Practice reference, booking, container, client...', i18n))}" autocomplete="off" />
              </div>
              <button class="btn" type="button" data-booking-embarkation-open-search-practice>${U.escapeHtml(label('Apri da ricerca', 'Open from search', i18n))}</button>
            </div>
          </article>
        </div>
      </section>`;
  }

  function sessionTitle(session, i18n) {
    const draft = session?.draft || {};
    return String(draft.documentReference || draft.practiceReference || label('Nuovo Booking d’imbarco', 'New boarding booking', i18n)).trim();
  }

  function sessionSubtitle(session, i18n) {
    const draft = session?.draft || {};
    const parts = [draft.practiceReference, draft.company, draft.booking].filter(Boolean);
    return parts.length ? parts.join(' · ') : label('Documento non ancora salvato', 'Document not saved yet', i18n);
  }

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft() }) || [];
    const activeId = String(state?.bookingEmbarkationWorkspace?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel practice-workspace-panel booking-embarkation-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(label('Maschere aperte', 'Open masks', i18n))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(label('Più booking d’imbarco possono restare aperti contemporaneamente nello stesso workspace.', 'Multiple boarding bookings can stay open at the same time in the same workspace.', i18n))}</p>
          </div>
        </div>
        <div class="practice-workspace-strip">
          ${sessions.map((session) => `
            <article class="practice-workspace-mask ${session.id === activeId ? 'active' : ''}">
              <button class="practice-workspace-switch" type="button" data-booking-embarkation-session-switch="${U.escapeHtml(session.id)}">
                <div class="practice-workspace-mask-main">
                  <div class="practice-workspace-mask-title">${U.escapeHtml(sessionTitle(session, i18n))}</div>
                  <div class="practice-workspace-mask-subtitle">${U.escapeHtml(sessionSubtitle(session, i18n))}</div>
                </div>
                <div class="practice-workspace-badges">
                  ${session.isDirty ? `<span class="tag-pill">${U.escapeHtml(label('Bozza', 'Draft', i18n))}</span>` : `<span class="tag-pill success">${U.escapeHtml(label('Salvato', 'Saved', i18n))}</span>`}
                </div>
              </button>
              <button class="practice-workspace-close" type="button" data-booking-embarkation-session-close="${U.escapeHtml(session.id)}" aria-label="${U.escapeHtml(label('Chiudi maschera', 'Close mask', i18n))}">×</button>
            </article>`).join('')}
        </div>
      </section>`;
  }

  function renderRecordList(state, i18n) {
    const records = (state?.bookingEmbarkationRecords || []).slice(0, 8);
    return `
      <section class="panel booking-embarkation-records-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(label('Documenti salvati', 'Saved documents', i18n))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(label('Ultimi booking d’imbarco disponibili per riapertura rapida e controllo operativo.', 'Latest boarding bookings available for quick reopen and operational control.', i18n))}</p>
          </div>
        </div>
        ${records.length ? `<div class="booking-embarkation-records-grid">${records.map((record) => `
          <article class="panel booking-embarkation-record-card">
            <div class="summary-kicker">${U.escapeHtml(record.documentReference || '—')}</div>
            <div class="summary-value">${U.escapeHtml(record.practiceReference || '—')}</div>
            <p class="summary-text">${U.escapeHtml([record.company, record.loadPlace, record.portDischarge].filter(Boolean).join(' · ') || label('Documento operativo collegato alla pratica madre.', 'Operational document linked to the mother practice.', i18n))}</p>
            <div class="action-row"><button class="btn secondary" type="button" data-booking-embarkation-open-record="${U.escapeHtml(record.id)}">${U.escapeHtml(label('Apri documento', 'Open document', i18n))}</button></div>
          </article>`).join('')}</div>` : `<div class="empty-text">${U.escapeHtml(label('Nessun booking d’imbarco ancora salvato in questo staging.', 'No boarding booking saved yet in this staging environment.', i18n))}</div>`}
      </section>`;
  }

  function renderGeneralTab(draft, i18n) {
    return `
      <div class="form-grid three booking-embarkation-form-grid">
        ${renderField(label('Numero pratica', 'Practice reference', i18n), 'practiceReference', draft.practiceReference, { readonly: true })}
        ${renderField(label('Data pratica', 'Practice date', i18n), 'practiceDate', draft.practiceDate, { type: 'date' })}
        ${renderField(label('Copie', 'Copies', i18n), 'copies', draft.copies)}
        ${renderField(label('Transitario', 'Forwarder', i18n), 'transitary', draft.transitary)}
        ${renderField(label('Compagnia', 'Carrier company', i18n), 'company', draft.company)}
        ${renderField(label('All’attenzione di', 'Attention to', i18n), 'attentionTo', draft.attentionTo)}
        ${renderField(label('Fax', 'Fax', i18n), 'fax', draft.fax)}
        ${renderField(label('Luogo carico', 'Loading place', i18n), 'loadPlace', draft.loadPlace)}
        <div class="field booking-embarkation-inline-pair">
          <label>${U.escapeHtml(label('Data carico', 'Loading date', i18n))}</label>
          <div class="booking-embarkation-date-time-row">
            <input type="date" value="${U.escapeHtml(draft.loadingDate || '')}" data-booking-embarkation-field="loadingDate">
            <input type="time" value="${U.escapeHtml(draft.loadingTime || '')}" data-booking-embarkation-field="loadingTime">
          </div>
        </div>
        <div class="field booking-embarkation-inline-pair">
          <label>${U.escapeHtml(label('Porto carico', 'Port of loading', i18n))}</label>
          <div class="booking-embarkation-port-row">
            <input type="text" value="${U.escapeHtml(draft.portLoading || '')}" data-booking-embarkation-field="portLoading">
            <input type="text" value="${U.escapeHtml(draft.portLoadingCode || '')}" data-booking-embarkation-field="portLoadingCode" placeholder="LOCODE">
          </div>
        </div>
        <div class="field booking-embarkation-inline-pair">
          <label>${U.escapeHtml(label('Porto scarico', 'Port of discharge', i18n))}</label>
          <div class="booking-embarkation-port-row">
            <input type="text" value="${U.escapeHtml(draft.portDischarge || '')}" data-booking-embarkation-field="portDischarge">
            <input type="text" value="${U.escapeHtml(draft.portDischargeCode || '')}" data-booking-embarkation-field="portDischargeCode" placeholder="LOCODE">
          </div>
        </div>
        ${renderField(label('Nave', 'Vessel', i18n), 'vessel', draft.vessel)}
        ${renderField(label('Viaggio', 'Voyage', i18n), 'voyage', draft.voyage)}
        ${renderField(label('Dogana a', 'Customs office', i18n), 'customsAt', draft.customsAt)}
        ${renderField(label('Posizionamento', 'Positioning', i18n), 'positioning', draft.positioning, { type: 'select', items: POSITIONING_OPTIONS })}
        ${renderField(label('Posizionamento presso', 'Positioning at', i18n), 'positioningAt', draft.positioningAt)}
        ${renderField(label('Destinazione finale', 'Final destination', i18n), 'finalDestination', draft.finalDestination)}
        ${renderField(label('Merce', 'Goods', i18n), 'goods', draft.goods, { full: true })}
        ${renderField(label('Peso', 'Weight', i18n), 'weight', draft.weight)}
        ${renderField(label('Nolo', 'Freight mode', i18n), 'freightMode', draft.freightMode, { type: 'select', items: FREIGHT_OPTIONS })}
        ${renderField(label('Booking', 'Booking', i18n), 'booking', draft.booking)}
        ${renderField(label('Containers', 'Containers', i18n), 'containers', draft.containers, { full: true })}
        ${renderField(label('E.t.s.', 'ETS', i18n), 'ets', draft.ets, { type: 'date' })}
        <div class="field booking-embarkation-inline-pair full">
          <label>${U.escapeHtml(label('VGM', 'VGM', i18n))}</label>
          <div class="booking-embarkation-vgm-row">
            <select data-booking-embarkation-field="vgmMode">${VGM_OPTIONS.map((item) => renderOption(item, draft.vgmMode)).join('')}</select>
            <input type="number" step="0.01" min="0" value="${U.escapeHtml(draft.vgmCost || '')}" data-booking-embarkation-field="vgmCost" placeholder="0.00">
            <select data-booking-embarkation-field="vgmCostCurrency">${CURRENCIES.map((item) => renderOption(item, draft.vgmCostCurrency || 'EUR')).join('')}</select>
          </div>
        </div>
        ${renderField(label('Preview transitario', 'Forwarder preview', i18n), 'transitaryPreview', draft.transitaryPreview, { type: 'textarea', rows: 2, full: true })}
        ${renderField(label('Preview posizionamento', 'Positioning preview', i18n), 'positioningPreview', draft.positioningPreview, { type: 'textarea', rows: 3, full: true })}
      </div>`;
  }

  function renderTextsTab(draft, i18n) {
    return `
      <div class="form-grid two-col booking-embarkation-text-grid">
        ${renderField(label('Testo principale', 'Main text', i18n), 'generalText', draft.generalText, { type: 'textarea', rows: 8, full: true })}
        ${renderField(label('Testo aggiuntivo', 'Additional text', i18n), 'additionalText', draft.additionalText, { type: 'textarea', rows: 6, full: true })}
        ${renderField(label('Piè di documento', 'Footer text', i18n), 'footerText', draft.footerText, { type: 'textarea', rows: 4, full: true })}
        ${renderField(label('Note interne', 'Internal notes', i18n), 'notes', draft.notes, { type: 'textarea', rows: 4, full: true })}
      </div>`;
  }

  function renderEditor(state, i18n) {
    const session = activeSession(state);
    if (!session) return '';
    const draft = session.draft || createEmptyDraft();
    const currentTab = String(session?.uiState?.tab || 'general').trim() || 'general';
    return `
      <section class="booking-embarkation-editor" data-booking-embarkation-editor-anchor>
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${U.escapeHtml(sessionTitle(session, i18n))}</h3>
              <p class="panel-subtitle">${U.escapeHtml(label('Documento operativo figlio della pratica madre, con coerenza dati dedicata al booking d’imbarco.', 'Operational child document linked to the mother practice, with dedicated boarding booking coherence.', i18n))}</p>
            </div>
            <div class="action-row booking-embarkation-actions-row">
              <button class="btn secondary" type="button" data-booking-embarkation-save>${U.escapeHtml(label('Salva e continua', 'Save and continue', i18n))}</button>
              <button class="btn" type="button" data-booking-embarkation-save-close>${U.escapeHtml(label('Salva e chiudi', 'Save and close', i18n))}</button>
              <button class="btn secondary" type="button" data-booking-embarkation-close-active>${U.escapeHtml(label('Chiudi maschera', 'Close mask', i18n))}</button>
            </div>
          </div>
          <div class="customs-tab-row booking-embarkation-tab-row">
            <button class="customs-tab-button ${currentTab === 'general' ? 'active' : ''}" type="button" data-booking-embarkation-tab="general">${U.escapeHtml(label('Generale', 'General', i18n))}</button>
            <button class="customs-tab-button ${currentTab === 'texts' ? 'active' : ''}" type="button" data-booking-embarkation-tab="texts">${U.escapeHtml(label('Testi', 'Texts', i18n))}</button>
          </div>
          ${currentTab === 'general' ? renderGeneralTab(draft, i18n) : renderTextsTab(draft, i18n)}
        </div>
      </section>`;
  }

  function render(state, { i18n } = {}) {
    ensureState(state);
    return `
      <section class="hero booking-embarkation-hero">
        <div class="hero-meta">STEP AQ40 · Booking d’imbarco submodule</div>
        <h2>${U.escapeHtml(label('Booking d’imbarco', 'Boarding booking', i18n))}</h2>
        <p>${U.escapeHtml(label('Sottomodulo reale Kedrix per il documento operativo di booking imbarco, collegato alla pratica madre e progettato con logica workspace interna.', 'Real Kedrix submodule for the operational boarding booking document, linked to the mother practice and designed with internal workspace logic.', i18n))}</p>
      </section>
      ${renderSummaryPills(state, i18n)}
      ${renderLauncher(state, i18n)}
      ${renderSessionStrip(state, i18n)}
      ${renderEditor(state, i18n)}
      ${renderRecordList(state, i18n)}
    `;
  }

  function syncField(state, field) {
    const session = activeSession(state);
    if (!session || !field) return;
    const fieldName = String(field.dataset.bookingEmbarkationField || '').trim();
    if (!fieldName) return;
    session.draft[fieldName] = field.value ?? '';
    Workspace.setSessionDirty(state, session.id, true, { createEmptyDraft: () => createEmptyDraft() });
  }

  function maybeConfirmClose(helpers, sessionId) {
    if (typeof helpers?.confirmClose === 'function') return helpers.confirmClose(sessionId);
    return Promise.resolve(true);
  }

  function focusEditorStart(helpers = {}) {
    const run = () => {
      const scope = helpers.root || document;
      const editor = scope?.querySelector?.('[data-booking-embarkation-editor-anchor]');
      if (!editor || typeof editor.scrollIntoView !== 'function') return;
      editor.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    };
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(run);
      return;
    }
    setTimeout(run, 0);
  }

  function openFromPractice(state, practice, helpers = {}) {
    if (!practice) {
      helpers.toast?.(label('Seleziona prima una pratica mare valida.', 'Select a valid sea practice first.', helpers.i18n), 'warning');
      return;
    }
    const draft = buildDraftFromPractice(practice, helpers.i18n);
    Workspace.openDraftSession(state, {
      draft,
      source: 'practice',
      createEmptyDraft: () => createEmptyDraft(),
      isDirty: true,
      tab: 'general'
    });
    helpers.save?.();
    helpers.render?.();
    focusEditorStart(helpers);
    helpers.toast?.(label('Maschera Booking d’imbarco aperta.', 'Boarding booking mask opened.', helpers.i18n), 'info');
  }

  function saveActive(state, helpers = {}, closeAfterSave = false) {
    const session = activeSession(state);
    if (!session) return;
    const errors = validationErrors(session.draft, helpers.i18n);
    if (errors.length) {
      helpers.toast?.(errors[0], 'warning');
      return;
    }
    const wasEditing = Boolean(String(session.draft.editingRecordId || '').trim());
    const savedRecord = upsertRecord(state, session.draft);
    syncSessionDraft(session, savedRecord);
    session.draft.editingRecordId = String(savedRecord.id || '').trim();
    session.draft.documentReference = String(savedRecord.documentReference || '').trim();
    Workspace.markSessionSaved(state, session.id, { createEmptyDraft: () => createEmptyDraft() });
    helpers.save?.();
    if (closeAfterSave) {
      Workspace.closeSession(state, session.id, { createEmptyDraft: () => createEmptyDraft() });
      helpers.save?.();
      helpers.render?.();
      helpers.toast?.(label('Booking d’imbarco salvato e maschera chiusa.', 'Boarding booking saved and mask closed.', helpers.i18n), 'success');
      return;
    }
    helpers.render?.();
    helpers.toast?.(wasEditing
      ? label('Booking d’imbarco aggiornato correttamente.', 'Boarding booking updated successfully.', helpers.i18n)
      : label('Booking d’imbarco salvato correttamente.', 'Boarding booking saved successfully.', helpers.i18n), 'success');
  }

  function bind(helpers = {}) {
    const root = helpers.root;
    const state = helpers.state;
    if (!root || !state) return;
    ensureState(state);

    root.querySelector('[data-booking-embarkation-open-active-practice]')?.addEventListener('click', () => {
      const practice = helpers.getSelectedPractice?.() || getPracticeById(state, state.selectedPracticeId);
      openFromPractice(state, practice, helpers);
    });

    root.querySelector('[data-booking-embarkation-open-picked-practice]')?.addEventListener('click', () => {
      const picker = root.querySelector('[data-booking-embarkation-practice-picker]');
      openFromPractice(state, getPracticeById(state, picker?.value || ''), helpers);
    });

    const openFromSearch = () => {
      const input = root.querySelector('[data-booking-embarkation-practice-search]');
      const result = findPracticeBySearch(state, input?.value || '');
      if (!result.practice) {
        helpers.toast?.(label('Nessuna pratica mare trovata con questa chiave.', 'No sea practice found with this key.', helpers.i18n), 'warning');
        return;
      }
      openFromPractice(state, result.practice, helpers);
      if (result.totalMatches > 1 && result.mode === 'fuzzy') {
        helpers.toast?.(label('Trovate più pratiche: aperta automaticamente la più recente.', 'Multiple practices found: the most recent one was opened automatically.', helpers.i18n), 'info');
      }
    };

    root.querySelector('[data-booking-embarkation-open-search-practice]')?.addEventListener('click', openFromSearch);
    root.querySelector('[data-booking-embarkation-practice-search]')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      openFromSearch();
    });

    root.querySelectorAll('[data-booking-embarkation-open-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const recordId = String(button.dataset.bookingEmbarkationOpenRecord || button.dataset.bookingEmbarkationOpenRecord || button.getAttribute('data-booking-embarkation-open-record') || '').trim();
        const record = (state.bookingEmbarkationRecords || []).find((entry) => String(entry?.id || '').trim() === recordId) || null;
        if (!record) {
          helpers.toast?.(label('Documento non trovato.', 'Document not found.', helpers.i18n), 'warning');
          return;
        }
        Workspace.openRecordSession(state, record, { createEmptyDraft: () => createEmptyDraft(), tab: 'general' });
        helpers.save?.();
        helpers.render?.();
        focusEditorStart(helpers);
      });
    });

    root.querySelectorAll('[data-booking-embarkation-session-switch]').forEach((button) => {
      button.addEventListener('click', () => {
        Workspace.switchSession(state, String(button.dataset.bookingEmbarkationSessionSwitch || '').trim(), { createEmptyDraft: () => createEmptyDraft() });
        helpers.save?.();
        helpers.render?.();
        focusEditorStart(helpers);
      });
    });

    root.querySelectorAll('[data-booking-embarkation-session-close]').forEach((button) => {
      button.addEventListener('click', async () => {
        const sessionId = String(button.dataset.bookingEmbarkationSessionClose || '').trim();
        const hasUnsaved = Workspace.hasSessionUnsavedChanges(state, sessionId, { createEmptyDraft: () => createEmptyDraft() });
        if (hasUnsaved) {
          const confirmed = await maybeConfirmClose(helpers, sessionId);
          if (!confirmed) return;
        }
        Workspace.closeSession(state, sessionId, { createEmptyDraft: () => createEmptyDraft() });
        helpers.save?.();
        helpers.render?.();
      });
    });

    root.querySelector('[data-booking-embarkation-close-active]')?.addEventListener('click', async () => {
      const session = activeSession(state);
      if (!session) return;
      const hasUnsaved = Workspace.hasSessionUnsavedChanges(state, session.id, { createEmptyDraft: () => createEmptyDraft() });
      if (hasUnsaved) {
        const confirmed = await maybeConfirmClose(helpers, session.id);
        if (!confirmed) return;
      }
      Workspace.closeSession(state, session.id, { createEmptyDraft: () => createEmptyDraft() });
      helpers.save?.();
      helpers.render?.();
      helpers.toast?.(label('Maschera chiusa.', 'Mask closed.', helpers.i18n), 'info');
    });

    root.querySelector('[data-booking-embarkation-save]')?.addEventListener('click', () => saveActive(state, helpers, false));
    root.querySelector('[data-booking-embarkation-save-close]')?.addEventListener('click', () => saveActive(state, helpers, true));

    root.querySelectorAll('[data-booking-embarkation-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = activeSession(state);
        if (!session) return;
        Workspace.setSessionTab(state, session.id, String(button.dataset.bookingEmbarkationTab || 'general').trim() || 'general', { createEmptyDraft: () => createEmptyDraft() });
        helpers.save?.();
        helpers.render?.();
      });
    });

    root.querySelectorAll('[data-booking-embarkation-field]').forEach((field) => {
      const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, () => {
        syncField(state, field);
        helpers.save?.();
      });
    });
  }

  return {
    ensureState,
    render,
    bind
  };
})();
