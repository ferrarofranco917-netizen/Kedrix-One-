window.KedrixOneRemittanceDocumentsWorkspace = (() => {
  'use strict';

  function nowIso() {
    return new Date().toISOString();
  }

  function nextSessionId() {
    return `rd-session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function defaultLineItem(overrides = {}) {
    return {
      id: `rd-line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      documentType: '',
      documentReference: '',
      copies: '',
      note: '',
      ...overrides
    };
  }

  function cloneDraft(draft = {}) {
    return {
      editingRecordId: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      status: 'draft',
      hawbReference: '',
      client: '',
      sender: '',
      destination: '',
      reference: '',
      attentionTo: '',
      documentDate: new Date().toISOString().slice(0, 10),
      loadingPort: '',
      unloadingPort: '',
      supplierInvoice: '',
      supplierInvoiceDate: '',
      amount: '',
      amountCurrency: 'EUR',
      courierName: '',
      voyage: '',
      vessel: '',
      deliveryConditions: '',
      internalText: '',
      customerText: '',
      detailNotes: '',
      sourcePracticeSnapshot: {},
      lineItems: [defaultLineItem()],
      ...draft,
      lineItems: Array.isArray(draft?.lineItems) && draft.lineItems.length
        ? draft.lineItems.map((item) => defaultLineItem(item))
        : [defaultLineItem()]
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
        tab: String(session?.uiState?.tab || 'general').trim() || 'general'
      },
      draft
    };
  }

  function ensureState(state, options = {}) {
    if (!state || typeof state !== 'object') return null;
    const { createEmptyDraft } = options;
    if (!state.remittanceDocumentsWorkspace || typeof state.remittanceDocumentsWorkspace !== 'object') {
      state.remittanceDocumentsWorkspace = { activeSessionId: '', sessions: [] };
    }
    const workspace = state.remittanceDocumentsWorkspace;
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
    const { draft, source = 'manual', createEmptyDraft, isDirty = true, tab = 'general' } = options;
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
    const { createEmptyDraft, tab = 'general' } = options;
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
    session.uiState = { ...(session.uiState || {}), tab: String(tab || 'general').trim() || 'general' };
    touchSession(session);
    return session;
  }

  function markSessionSaved(state, sessionId, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return null;
    session.isDirty = false;
    session.lastSavedDraftSignature = signatureOf(session.draft);
    touchSession(session);
    return session;
  }

  function closeSession(state, sessionId, options = {}) {
    const workspace = ensureState(state, options);
    if (!workspace) return null;
    const index = workspace.sessions.findIndex((session) => session.id === sessionId);
    if (index === -1) return null;
    const [removed] = workspace.sessions.splice(index, 1);
    if (!workspace.sessions.length) {
      workspace.activeSessionId = '';
    } else if (workspace.activeSessionId === sessionId) {
      workspace.activeSessionId = workspace.sessions[Math.max(0, index - 1)].id;
    }
    return removed;
  }

  return {
    ensureState,
    listSessions,
    getActiveSession,
    findSession,
    openDraftSession,
    openRecordSession,
    switchSession,
    setSessionField,
    updateSessionDraft,
    setSessionTab,
    markSessionSaved,
    closeSession,
    hasSessionUnsavedChanges,
    cloneDraft,
    defaultLineItem
  };
})();
