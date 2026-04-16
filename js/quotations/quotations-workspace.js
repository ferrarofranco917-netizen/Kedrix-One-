window.KedrixOneQuotationsWorkspace = (() => {
  'use strict';

  function nowIso() {
    return new Date().toISOString();
  }

  function nextSessionId() {
    return `qt-session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function nextEntityId(prefix = 'qt') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function defaultLineItem(overrides = {}) {
    return {
      id: nextEntityId('qt-line'),
      code: '',
      description: '',
      calculationType: 'fixed',
      quantity: '1',
      unit: 'lot',
      supplier: '',
      costAmount: '',
      sellAmount: '',
      currency: 'EUR',
      vat: '22',
      note: '',
      ...overrides
    };
  }

  function defaultDocument(overrides = {}) {
    return {
      id: nextEntityId('qt-doc'),
      title: '',
      category: 'quotation',
      fileName: '',
      fileSize: '',
      uploadedAt: nowIso(),
      note: '',
      ...overrides
    };
  }

  function cloneDraft(draft = {}) {
    return {
      editingRecordId: '',
      quoteNumber: '',
      linkedPracticeId: '',
      linkedPracticeReference: '',
      linkedPracticeType: '',
      status: 'draft',
      serviceProfile: 'generic',
      movementType: 'export',
      description: '',
      code: '',
      issueDate: new Date().toISOString().slice(0, 10),
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: '',
      clientId: '',
      clientName: '',
      prospect: '',
      contactPerson: '',
      importerExporter: '',
      carrier: '',
      paymentTerms: '',
      incoterm: '',
      origin: '',
      destination: '',
      loadingPort: '',
      dischargePort: '',
      pickupLocation: '',
      deliveryLocation: '',
      goodsType: '',
      dangerousGoods: 'no',
      packageCount: '',
      packageType: '',
      dimensions: '',
      stackable: 'yes',
      grossWeight: '',
      netWeight: '',
      volume: '',
      chargeableWeight: '',
      cargoValue: '',
      currency: 'EUR',
      customerNotes: '',
      internalNotes: '',
      lineItems: [defaultLineItem()],
      documents: [],
      createdAt: '',
      updatedAt: '',
      ...draft,
      lineItems: Array.isArray(draft?.lineItems) && draft.lineItems.length
        ? draft.lineItems.map((item) => defaultLineItem(item))
        : [defaultLineItem()],
      documents: Array.isArray(draft?.documents)
        ? draft.documents.map((item) => defaultDocument(item))
        : []
    };
  }

  function signatureOf(draft = {}) {
    try {
      return JSON.stringify(cloneDraft(draft));
    } catch (error) {
      return '';
    }
  }

  function normalizeSession(session = {}, createEmptyDraft) {
    const draft = cloneDraft(session?.draft && typeof session.draft === 'object'
      ? session.draft
      : (typeof createEmptyDraft === 'function' ? createEmptyDraft() : {}));
    const currentSignature = signatureOf(draft);
    const savedSignature = String(session?.lastSavedDraftSignature || '').trim() || (Boolean(session?.isDirty) ? '' : currentSignature);
    return {
      id: String(session?.id || '').trim() || nextSessionId(),
      source: String(session?.source || '').trim() || 'manual',
      openedAt: session?.openedAt || nowIso(),
      lastTouchedAt: session?.lastTouchedAt || session?.openedAt || nowIso(),
      isDirty: Boolean(session?.isDirty),
      lastSavedDraftSignature: savedSignature,
      uiState: {
        tab: String(session?.uiState?.tab || 'header').trim() || 'header'
      },
      draft
    };
  }

  function ensureState(state, options = {}) {
    if (!state || typeof state !== 'object') return null;
    const { createEmptyDraft } = options;
    if (!state.quotationsWorkspace || typeof state.quotationsWorkspace !== 'object') {
      state.quotationsWorkspace = { activeSessionId: '', sessions: [] };
    }
    if (!Array.isArray(state.quotationRecords)) state.quotationRecords = [];
    if (!state.quotationsModule || typeof state.quotationsModule !== 'object') {
      state.quotationsModule = {
        quickFilter: '',
        statusFilter: 'all',
        profileFilter: 'all',
        clientFilter: '',
        validOn: ''
      };
    }
    const workspace = state.quotationsWorkspace;
    workspace.sessions = Array.isArray(workspace.sessions)
      ? workspace.sessions.map((session) => normalizeSession(session, createEmptyDraft))
      : [];
    if (!workspace.sessions.length) {
      workspace.activeSessionId = '';
      return workspace;
    }
    const activeExists = workspace.sessions.some((session) => session.id === workspace.activeSessionId);
    if (!activeExists) workspace.activeSessionId = workspace.sessions[0].id;
    return workspace;
  }

  function listSessions(state, options = {}) {
    const workspace = ensureState(state, options);
    return workspace ? [...workspace.sessions] : [];
  }

  function getActiveSession(state, options = {}) {
    const workspace = ensureState(state, options);
    if (!workspace) return null;
    if (!workspace.activeSessionId) return workspace.sessions[0] || null;
    return workspace.sessions.find((session) => session.id === workspace.activeSessionId) || workspace.sessions[0] || null;
  }

  function findSession(state, sessionId, options = {}) {
    const workspace = ensureState(state, options);
    if (!workspace || !sessionId) return null;
    return workspace.sessions.find((session) => session.id === sessionId) || null;
  }

  function touchSession(session) {
    if (!session) return session;
    session.lastTouchedAt = nowIso();
    return session;
  }

  function openDraftSession(state, options = {}) {
    const { draft, source = 'manual', createEmptyDraft, isDirty = true, tab = 'header' } = options;
    const workspace = ensureState(state, { createEmptyDraft });
    if (!workspace) return null;
    const session = normalizeSession({
      id: nextSessionId(),
      source,
      openedAt: nowIso(),
      lastTouchedAt: nowIso(),
      isDirty,
      uiState: { tab },
      draft: draft && typeof draft === 'object' ? draft : (typeof createEmptyDraft === 'function' ? createEmptyDraft() : {})
    }, createEmptyDraft);
    workspace.sessions = [session, ...workspace.sessions];
    workspace.activeSessionId = session.id;
    return session;
  }

  function openRecordSession(state, record, options = {}) {
    const { createEmptyDraft, tab = 'header' } = options;
    if (!record || typeof record !== 'object') return null;
    const workspace = ensureState(state, { createEmptyDraft });
    if (!workspace) return null;
    const recordId = String(record.id || '').trim();
    const existing = workspace.sessions.find((session) => String(session?.draft?.editingRecordId || '').trim() === recordId) || null;
    if (existing) {
      existing.draft = cloneDraft(record);
      existing.isDirty = false;
      existing.lastSavedDraftSignature = signatureOf(existing.draft);
      existing.uiState = { ...(existing.uiState || {}), tab };
      workspace.activeSessionId = existing.id;
      touchSession(existing);
      return existing;
    }
    return openDraftSession(state, {
      draft: cloneDraft(record),
      source: 'record',
      createEmptyDraft,
      isDirty: false,
      tab
    });
  }

  function switchSession(state, sessionId, options = {}) {
    const workspace = ensureState(state, options);
    if (!workspace) return null;
    if (!workspace.sessions.some((session) => session.id === sessionId)) return getActiveSession(state, options);
    workspace.activeSessionId = sessionId;
    return getActiveSession(state, options);
  }

  function setSessionField(state, sessionId, fieldName, value, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return null;
    session.draft = cloneDraft({ ...session.draft, [fieldName]: value });
    session.isDirty = true;
    touchSession(session);
    return session;
  }

  function updateSessionDraft(state, sessionId, updater, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session || typeof updater !== 'function') return null;
    const nextDraft = updater(cloneDraft(session.draft));
    session.draft = cloneDraft(nextDraft);
    session.isDirty = true;
    touchSession(session);
    return session;
  }

  function hasSessionUnsavedChanges(state, sessionId, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return false;
    if (!session.isDirty) return false;
    const currentSignature = signatureOf(session.draft);
    const savedSignature = String(session.lastSavedDraftSignature || '').trim();
    if (savedSignature && currentSignature === savedSignature) {
      session.isDirty = false;
      touchSession(session);
      return false;
    }
    return true;
  }

  function setSessionTab(state, sessionId, tab, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return null;
    session.uiState = { ...(session.uiState || {}), tab: String(tab || 'header').trim() || 'header' };
    touchSession(session);
    return session;
  }

  function markSessionSaved(state, sessionId, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return null;
    session.lastSavedDraftSignature = signatureOf(session.draft);
    session.isDirty = false;
    touchSession(session);
    return session;
  }

  function closeSession(state, sessionId, options = {}) {
    const workspace = ensureState(state, options);
    if (!workspace) return false;
    const before = workspace.sessions.length;
    workspace.sessions = workspace.sessions.filter((session) => session.id !== sessionId);
    if (workspace.activeSessionId === sessionId) {
      workspace.activeSessionId = workspace.sessions[0]?.id || '';
    }
    return workspace.sessions.length !== before;
  }

  return {
    defaultLineItem,
    defaultDocument,
    cloneDraft,
    ensureState,
    listSessions,
    getActiveSession,
    findSession,
    openDraftSession,
    openRecordSession,
    switchSession,
    setSessionField,
    updateSessionDraft,
    hasSessionUnsavedChanges,
    setSessionTab,
    markSessionSaved,
    closeSession
  };
})();
