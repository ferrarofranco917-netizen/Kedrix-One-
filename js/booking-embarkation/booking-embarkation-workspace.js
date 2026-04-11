window.KedrixOneBookingEmbarkationWorkspace = (() => {
  'use strict';

  function nowIso() {
    return new Date().toISOString();
  }

  function nextSessionId() {
    return `bki-session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function cloneDraft(draft = {}) {
    return {
      editingRecordId: '',
      documentReference: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      practiceTypeLabel: '',
      practiceDate: '',
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
      ...draft,
      sourcePracticeSnapshot: draft?.sourcePracticeSnapshot && typeof draft.sourcePracticeSnapshot === 'object'
        ? { ...draft.sourcePracticeSnapshot }
        : {}
    };
  }

  function buildDraftSignature(draft = {}) {
    try {
      return JSON.stringify(cloneDraft(draft || {}));
    } catch (error) {
      return '';
    }
  }

  function normalizeSession(session = {}, createEmptyDraft) {
    const draft = cloneDraft(session?.draft && typeof session.draft === 'object'
      ? session.draft
      : (typeof createEmptyDraft === 'function' ? createEmptyDraft() : {}));
    const currentSignature = buildDraftSignature(draft);
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

  function createSession(options = {}) {
    const { draft, source = 'manual', createEmptyDraft, isDirty = false, uiState = {} } = options;
    return normalizeSession({
      id: nextSessionId(),
      source,
      openedAt: nowIso(),
      lastTouchedAt: nowIso(),
      isDirty,
      uiState,
      draft: draft && typeof draft === 'object' ? draft : (typeof createEmptyDraft === 'function' ? createEmptyDraft() : {})
    }, createEmptyDraft);
  }

  function ensureState(state, options = {}) {
    if (!state || typeof state !== 'object') return null;
    const { createEmptyDraft } = options;
    if (!state.bookingEmbarkationWorkspace || typeof state.bookingEmbarkationWorkspace !== 'object') {
      state.bookingEmbarkationWorkspace = { activeSessionId: '', sessions: [] };
    }
    const workspace = state.bookingEmbarkationWorkspace;
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

  function findSession(state, sessionId, options = {}) {
    const workspace = ensureState(state, options);
    if (!workspace || !sessionId) return null;
    return workspace.sessions.find((session) => session.id === sessionId) || null;
  }

  function getActiveSession(state, options = {}) {
    const workspace = ensureState(state, options);
    if (!workspace || !workspace.activeSessionId) return workspace?.sessions?.[0] || null;
    return workspace.sessions.find((session) => session.id === workspace.activeSessionId) || workspace.sessions[0] || null;
  }

  function touchSession(session) {
    if (!session || typeof session !== 'object') return session;
    session.lastTouchedAt = nowIso();
    return session;
  }

  function switchSession(state, sessionId, options = {}) {
    const workspace = ensureState(state, options);
    if (!workspace) return null;
    const exists = workspace.sessions.some((session) => session.id === sessionId);
    if (!exists) return getActiveSession(state, options);
    workspace.activeSessionId = sessionId;
    return getActiveSession(state, options);
  }

  function openDraftSession(state, options = {}) {
    const { draft, source = 'manual', createEmptyDraft, isDirty = true, tab = 'general' } = options;
    const workspace = ensureState(state, { createEmptyDraft });
    if (!workspace) return null;
    const session = createSession({ draft, source, createEmptyDraft, isDirty, uiState: { tab } });
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
      existing.lastSavedDraftSignature = buildDraftSignature(existing.draft);
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

  function setSessionDirty(state, sessionId, dirty = true, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return null;
    session.isDirty = Boolean(dirty);
    if (!dirty) session.lastSavedDraftSignature = buildDraftSignature(session.draft);
    touchSession(session);
    return session;
  }

  function markSessionSaved(state, sessionId, options = {}) {
    return setSessionDirty(state, sessionId, false, options);
  }

  function hasSessionUnsavedChanges(state, sessionId, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return false;
    if (!session.isDirty) return false;
    const currentSignature = buildDraftSignature(session.draft);
    const savedSignature = String(session.lastSavedDraftSignature || '').trim();
    if (savedSignature && currentSignature === savedSignature) {
      session.isDirty = false;
      touchSession(session);
      return false;
    }
    return true;
  }

  function setSessionTab(state, sessionId, tab = 'general', options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return null;
    session.uiState = { ...(session.uiState || {}), tab: String(tab || 'general').trim() || 'general' };
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
      return removed;
    }
    if (workspace.activeSessionId === sessionId) {
      const fallback = workspace.sessions[Math.max(0, index - 1)] || workspace.sessions[0];
      workspace.activeSessionId = fallback.id;
    }
    return removed;
  }

  return {
    cloneDraft,
    ensureState,
    listSessions,
    findSession,
    getActiveSession,
    switchSession,
    openDraftSession,
    openRecordSession,
    setSessionDirty,
    markSessionSaved,
    hasSessionUnsavedChanges,
    setSessionTab,
    closeSession
  };
})();
