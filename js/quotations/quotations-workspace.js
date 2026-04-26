window.KedrixOneQuotationsWorkspace = (() => {
  'use strict';

  function clone(value) {
    if (typeof window !== 'undefined' && typeof window.structuredClone === 'function') {
      return window.structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function buildSessionId() {
    return `quot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function defaultLineItem(overrides = {}) {
    return {
      id: `qli-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      lineType: 'service',
      code: '',
      description: '',
      calcType: 'fixed',
      quantity: '1',
      unit: 'flat',
      supplier: '',
      cost: '',
      revenue: '',
      currency: 'EUR',
      vat: '22',
      notes: '',
      packagingType: '',
      ...overrides
    };
  }

  function defaultAttachment(overrides = {}) {
    return {
      id: `qad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: '',
      category: 'quotation',
      fileName: '',
      note: '',
      ...overrides
    };
  }

  function cloneDraft(draft) {
    return clone(draft || {});
  }

  function ensureState(state, options = {}) {
    if (!state.quotationsWorkspace || typeof state.quotationsWorkspace !== 'object') {
      state.quotationsWorkspace = { activeSessionId: '', sessions: [] };
    }
    if (!Array.isArray(state.quotationsWorkspace.sessions)) state.quotationsWorkspace.sessions = [];
    if (!Array.isArray(state.quotationRecords)) state.quotationRecords = [];
    if (!state.quotationFilters || typeof state.quotationFilters !== 'object') {
      state.quotationFilters = { quick: '', serviceProfile: 'all', status: 'all' };
    }
    if (!state.quotationDispatchQueue || !Array.isArray(state.quotationDispatchQueue)) {
      state.quotationDispatchQueue = [];
    }
    if (!state.quotationFeedbackFollowUps || !Array.isArray(state.quotationFeedbackFollowUps)) {
      state.quotationFeedbackFollowUps = [];
    }
    if (!state.quotationsWorkspace.activeSessionId && state.quotationsWorkspace.sessions.length) {
      state.quotationsWorkspace.activeSessionId = String(state.quotationsWorkspace.sessions[0].id || '').trim();
    }
    return state.quotationsWorkspace;
  }

  function listSessions(state) {
    ensureState(state);
    return state.quotationsWorkspace.sessions;
  }

  function getSession(state, sessionId = '') {
    ensureState(state);
    const target = String(sessionId || state.quotationsWorkspace.activeSessionId || '').trim();
    return state.quotationsWorkspace.sessions.find((entry) => String(entry?.id || '').trim() === target) || null;
  }

  function getActiveSession(state) {
    return getSession(state, state?.quotationsWorkspace?.activeSessionId || '');
  }

  function openSession(state, draft, options = {}) {
    ensureState(state);
    const id = String(options.id || buildSessionId()).trim();
    const session = {
      id,
      tab: String(options.tab || 'testata').trim() || 'testata',
      isDirty: Boolean(options.isDirty),
      draft: cloneDraft(draft)
    };
    state.quotationsWorkspace.sessions.unshift(session);
    state.quotationsWorkspace.activeSessionId = id;
    return session;
  }

  function switchSession(state, sessionId) {
    ensureState(state);
    const target = String(sessionId || '').trim();
    const exists = state.quotationsWorkspace.sessions.some((entry) => String(entry?.id || '').trim() == target);
    if (exists) state.quotationsWorkspace.activeSessionId = target;
    return getActiveSession(state);
  }

  function closeSession(state, sessionId) {
    ensureState(state);
    const target = String(sessionId || '').trim();
    state.quotationsWorkspace.sessions = state.quotationsWorkspace.sessions.filter((entry) => String(entry?.id || '').trim() !== target);
    if (String(state.quotationsWorkspace.activeSessionId || '').trim() === target) {
      state.quotationsWorkspace.activeSessionId = state.quotationsWorkspace.sessions[0] ? String(state.quotationsWorkspace.sessions[0].id || '').trim() : '';
    }
  }

  function replaceSessionDraft(state, sessionId, draft, options = {}) {
    const session = getSession(state, sessionId);
    if (!session) return null;
    session.draft = cloneDraft(draft);
    if (Object.prototype.hasOwnProperty.call(options, 'isDirty')) {
      session.isDirty = Boolean(options.isDirty);
    }
    if (options.tab) session.tab = String(options.tab).trim() || session.tab;
    return session;
  }

  function updateField(state, sessionId, fieldName, value) {
    const session = getSession(state, sessionId);
    if (!session) return null;
    session.draft[fieldName] = value;
    session.isDirty = true;
    return session.draft;
  }

  function setTab(state, sessionId, tabKey) {
    const session = getSession(state, sessionId);
    if (!session) return null;
    session.tab = String(tabKey || 'testata').trim() || 'testata';
    return session.tab;
  }

  function nextQuotationNumber(state) {
    ensureState(state);
    const year = new Date().getFullYear();
    let maxNumber = 0;
    state.quotationRecords.forEach((record) => {
      const match = String(record?.quotationNumber || '').match(/Q-(\d{4})-(\d{4})/);
      if (match && Number(match[1]) === year) {
        maxNumber = Math.max(maxNumber, Number(match[2] || 0));
      }
    });
    return `Q-${year}-${String(maxNumber + 1).padStart(4, '0')}`;
  }

  function saveRecord(state, sessionId, meta = {}) {
    ensureState(state);
    const session = getSession(state, sessionId);
    if (!session) return null;
    const draft = cloneDraft(session.draft || {});
    const now = new Date().toISOString();
    const recordId = String(draft.editingRecordId || '').trim() || `QREC-${Date.now()}`;
    if (!draft.quotationNumber) {
      draft.quotationNumber = nextQuotationNumber(state);
    }
    const existingIndex = state.quotationRecords.findIndex((entry) => String(entry?.id || '').trim() === recordId);
    const createdAt = existingIndex >= 0
      ? state.quotationRecords[existingIndex].createdAt
      : now;
    const record = {
      id: recordId,
      quotationNumber: String(draft.quotationNumber || '').trim(),
      status: String(draft.status || 'draft').trim() || 'draft',
      serviceProfile: String(draft.serviceProfile || 'generic').trim() || 'generic',
      title: String(draft.title || '').trim(),
      client: String(draft.client || '').trim(),
      clientId: String(draft.clientId || '').trim(),
      payer: String(draft.payer || '').trim(),
      payerId: String(draft.payerId || '').trim(),
      supplier: String(draft.supplier || '').trim(),
      supplierId: String(draft.supplierId || '').trim(),
      carrier: String(draft.carrier || '').trim(),
      carrierId: String(draft.carrierId || '').trim(),
      carrierEntityKey: String(draft.carrierEntityKey || '').trim(),
      linkedEntities: clone(draft.linkedEntities || {}),
      validFrom: String(draft.validFrom || '').trim(),
      validTo: String(draft.validTo || '').trim(),
      practiceId: String(draft.practiceId || '').trim(),
      practiceReference: String(draft.practiceReference || '').trim(),
      createdAt,
      updatedAt: now,
      updatedBy: String(meta.updatedBy || '').trim(),
      draft
    };
    if (existingIndex >= 0) state.quotationRecords[existingIndex] = record;
    else state.quotationRecords.unshift(record);
    session.draft.editingRecordId = recordId;
    session.draft.quotationNumber = record.quotationNumber;
    session.isDirty = false;
    return record;
  }

  function queueDispatch(state, record, options = {}) {
    ensureState(state);
    const entry = {
      id: `QDIS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      moduleKey: 'quotations',
      recordId: String(record?.id || '').trim(),
      quotationNumber: String(record?.quotationNumber || '').trim(),
      recipient: String(options.recipient || record?.client || '').trim(),
      status: 'queued',
      queuedAt: new Date().toISOString()
    };
    state.quotationDispatchQueue.unshift(entry);
    return entry;
  }


  function scheduleFeedbackFollowUp(state, record, options = {}) {
    ensureState(state);
    const delayDays = Math.max(0, Number(options.delayDays || 0));
    const dueAtDate = new Date();
    dueAtDate.setDate(dueAtDate.getDate() + delayDays);
    const entry = {
      id: `QFU-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      moduleKey: 'quotations',
      recordId: String(record?.id || '').trim(),
      quotationNumber: String(record?.quotationNumber || '').trim(),
      client: String(record?.client || '').trim(),
      status: 'scheduled',
      scheduledAt: new Date().toISOString(),
      dueAt: dueAtDate.toISOString(),
      delayDays,
      templateKey: String(options.templateKey || '').trim(),
      templateName: String(options.templateName || '').trim(),
      templateSubject: String(options.templateSubject || '').trim(),
      templateBody: String(options.templateBody || '').trim(),
      recipient: String(options.recipient || record?.client || '').trim()
    };
    state.quotationFeedbackFollowUps.unshift(entry);
    return entry;
  }

  return {
    cloneDraft,
    defaultLineItem,
    defaultAttachment,
    ensureState,
    listSessions,
    getSession,
    getActiveSession,
    openSession,
    switchSession,
    closeSession,
    replaceSessionDraft,
    updateField,
    setTab,
    nextQuotationNumber,
    saveRecord,
    queueDispatch,
    scheduleFeedbackFollowUp,
    today
  };
})();
