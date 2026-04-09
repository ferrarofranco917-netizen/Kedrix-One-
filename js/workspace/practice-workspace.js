window.KedrixOnePracticeWorkspace = (() => {
  'use strict';

  function nowIso() {
    return new Date().toISOString();
  }

  function nextSessionId() {
    return `practice-mask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function cloneDraft(draft = {}) {
    try {
      return JSON.parse(JSON.stringify(draft || {}));
    } catch (error) {
      return {
        ...(draft || {}),
        dynamicData: { ...((draft && draft.dynamicData) || {}) }
      };
    }
  }

  function normalizeForSignature(value) {
    if (Array.isArray(value)) return value.map((item) => normalizeForSignature(item));
    if (!value || typeof value !== 'object') return value;
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        const normalized = normalizeForSignature(value[key]);
        if (typeof normalized === 'undefined') return acc;
        acc[key] = normalized;
        return acc;
      }, {});
  }

  function buildDraftSignature(draft = {}) {
    try {
      return JSON.stringify(normalizeForSignature(cloneDraft(draft || {})));
    } catch (error) {
      return '';
    }
  }

  function normalizeSession(session = {}, createEmptyDraft) {
    const fallbackDraft = typeof createEmptyDraft === 'function' ? createEmptyDraft() : { dynamicData: {} };
    const uiState = session.uiState && typeof session.uiState === 'object' ? session.uiState : {};
    const normalizedDraft = cloneDraft(session.draft && typeof session.draft === 'object' ? session.draft : fallbackDraft);
    const currentSignature = buildDraftSignature(normalizedDraft);
    const savedSignature = String(session.lastSavedDraftSignature || '').trim() || (Boolean(session.isDirty) ? '' : currentSignature);
    return {
      id: String(session.id || '').trim() || nextSessionId(),
      source: String(session.source || '').trim() || 'manual',
      openedAt: session.openedAt || nowIso(),
      lastTouchedAt: session.lastTouchedAt || session.openedAt || nowIso(),
      isDirty: Boolean(session.isDirty),
      lastSavedDraftSignature: savedSignature,
      uiState: {
        ...uiState,
        tab: String(uiState.tab || session.tab || 'practice').trim() || 'practice'
      },
      draft: normalizedDraft
    };
  }

  function createSession(options = {}) {
    const { draft, source = 'manual', createEmptyDraft, isDirty = false, uiState = {} } = options;
    const fallbackDraft = typeof createEmptyDraft === 'function' ? createEmptyDraft() : { dynamicData: {} };
    return normalizeSession({
      id: nextSessionId(),
      source,
      openedAt: nowIso(),
      lastTouchedAt: nowIso(),
      isDirty,
      uiState,
      draft: draft && typeof draft === 'object' ? draft : fallbackDraft
    }, createEmptyDraft);
  }

  function ensureState(state, options = {}) {
    if (!state || typeof state !== 'object') return null;
    const { createEmptyDraft } = options;
    if (!state.practiceWorkspace || typeof state.practiceWorkspace !== 'object') {
      state.practiceWorkspace = {
        activeSessionId: '',
        sessions: []
      };
    }

    const workspace = state.practiceWorkspace;
    workspace.sessions = Array.isArray(workspace.sessions)
      ? workspace.sessions.map((session) => normalizeSession(session, createEmptyDraft))
      : [];

    if (!workspace.sessions.length) {
      const seedDraft = state.draftPractice && typeof state.draftPractice === 'object'
        ? cloneDraft(state.draftPractice)
        : (typeof createEmptyDraft === 'function' ? createEmptyDraft() : { dynamicData: {} });
      workspace.sessions = [createSession({ draft: seedDraft, source: 'bootstrap', createEmptyDraft, uiState: { tab: String(state.practiceTab || 'practice').trim() || 'practice' } })];
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
    if (!workspace) return null;
    return workspace.sessions.find((session) => session.id === workspace.activeSessionId) || workspace.sessions[0] || null;
  }

  function touchSession(session) {
    if (!session || typeof session !== 'object') return session;
    session.lastTouchedAt = nowIso();
    return session;
  }

  function setSessionDirty(state, sessionId, dirty = true, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return null;
    session.isDirty = Boolean(dirty);
    if (!dirty && options.captureSavedSignature === true) {
      session.lastSavedDraftSignature = buildDraftSignature(session.draft);
    }
    touchSession(session);
    return session;
  }

  function setActiveDirty(state, dirty = true, options = {}) {
    const active = getActiveSession(state, options);
    if (!active) return null;
    active.isDirty = Boolean(dirty);
    if (!dirty && options.captureSavedSignature === true) {
      active.lastSavedDraftSignature = buildDraftSignature(active.draft);
    }
    touchSession(active);
    return active;
  }

  function markSessionSaved(state, sessionId, options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return null;
    session.lastSavedDraftSignature = buildDraftSignature(session.draft);
    session.isDirty = false;
    touchSession(session);
    return session;
  }

  function markActiveSessionSaved(state, options = {}) {
    const active = getActiveSession(state, options);
    if (!active) return null;
    active.lastSavedDraftSignature = buildDraftSignature(active.draft);
    active.isDirty = false;
    touchSession(active);
    return active;
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

  function setSessionTab(state, sessionId, tab = 'practice', options = {}) {
    const session = findSession(state, sessionId, options);
    if (!session) return null;
    if (!session.uiState || typeof session.uiState !== 'object') session.uiState = { tab: 'practice' };
    session.uiState.tab = String(tab || 'practice').trim() || 'practice';
    touchSession(session);
    if (state.practiceWorkspace?.activeSessionId === session.id) state.practiceTab = session.uiState.tab;
    return session;
  }

  function setActiveTab(state, tab = 'practice', options = {}) {
    const active = getActiveSession(state, options);
    if (!active) return null;
    return setSessionTab(state, active.id, tab, options);
  }

  function syncActiveDraft(state, options = {}) {
    const { createEmptyDraft } = options;
    const workspace = ensureState(state, { createEmptyDraft });
    if (!workspace) return null;
    let active = getActiveSession(state, { createEmptyDraft });
    if (!active) {
      active = createSession({ createEmptyDraft, source: 'bootstrap', uiState: { tab: String(state.practiceTab || 'practice').trim() || 'practice' } });
      workspace.sessions = [active];
      workspace.activeSessionId = active.id;
    }
    touchSession(active);
    state.draftPractice = active.draft;
    state.selectedPracticeId = String(active.draft?.editingPracticeId || '').trim();
    state.practiceTab = String(active.uiState?.tab || state.practiceTab || 'practice').trim() || 'practice';
    return active.draft;
  }

  function switchSession(state, sessionId, options = {}) {
    const { createEmptyDraft } = options;
    const workspace = ensureState(state, { createEmptyDraft });
    if (!workspace) return null;
    if (!workspace.sessions.some((session) => session.id === sessionId)) return getActiveSession(state, { createEmptyDraft });
    workspace.activeSessionId = sessionId;
    syncActiveDraft(state, { createEmptyDraft });
    return getActiveSession(state, { createEmptyDraft });
  }

  function openDraftSession(state, options = {}) {
    const { draft, source = 'manual', createEmptyDraft, isDirty = false, practiceTab = 'practice' } = options;
    const workspace = ensureState(state, { createEmptyDraft });
    if (!workspace) return null;
    const session = createSession({ draft, source, createEmptyDraft, isDirty, uiState: { tab: practiceTab } });
    workspace.sessions = [session, ...workspace.sessions];
    workspace.activeSessionId = session.id;
    syncActiveDraft(state, { createEmptyDraft });
    return session;
  }

  function openPracticeSession(state, practiceId, options = {}) {
    const {
      createDraft,
      createEmptyDraft,
      source = 'manual',
      refreshExisting = false,
      reuseActiveSession = false,
      practiceTab = ''
    } = options;

    if (!practiceId) return null;
    const workspace = ensureState(state, { createEmptyDraft });
    if (!workspace) return null;

    const builtDraft = typeof createDraft === 'function' ? createDraft(practiceId) : null;
    if (!builtDraft) return null;

    let targetSession = null;
    const activeSession = getActiveSession(state, { createEmptyDraft });
    const existingSession = workspace.sessions.find((session) => String(session.draft?.editingPracticeId || '') === String(practiceId)) || null;

    if (reuseActiveSession && activeSession) {
      targetSession = activeSession;
      targetSession.draft = cloneDraft(builtDraft);
      targetSession.isDirty = false;
      if (!targetSession.uiState || typeof targetSession.uiState !== 'object') targetSession.uiState = { tab: 'practice' };
      targetSession.uiState.tab = String(practiceTab || targetSession.uiState.tab || state.practiceTab || 'practice').trim() || 'practice';
    } else if (existingSession) {
      targetSession = existingSession;
      if (refreshExisting) {
        targetSession.draft = cloneDraft(builtDraft);
        targetSession.isDirty = false;
      }
      if (!targetSession.uiState || typeof targetSession.uiState !== 'object') targetSession.uiState = { tab: 'practice' };
      if (practiceTab) targetSession.uiState.tab = String(practiceTab).trim() || 'practice';
    } else {
      targetSession = createSession({ draft: builtDraft, source, createEmptyDraft, isDirty: false, uiState: { tab: practiceTab || state.practiceTab || 'practice' } });
      workspace.sessions = [targetSession, ...workspace.sessions];
    }

    targetSession.source = source;
    touchSession(targetSession);
    workspace.activeSessionId = targetSession.id;
    syncActiveDraft(state, { createEmptyDraft });
    return targetSession;
  }


  function syncPracticeSessions(state, practiceId, options = {}) {
    const {
      createDraft,
      createEmptyDraft,
      keepDirty = false
    } = options;

    if (!practiceId) return [];
    const workspace = ensureState(state, { createEmptyDraft });
    if (!workspace) return [];
    const rebuiltDraft = typeof createDraft === 'function' ? createDraft(practiceId) : null;
    if (!rebuiltDraft) return [];

    const touched = [];
    workspace.sessions.forEach((session) => {
      if (String(session?.draft?.editingPracticeId || '') !== String(practiceId)) return;
      const existingUiState = session.uiState && typeof session.uiState === 'object'
        ? { ...session.uiState }
        : { tab: 'practice' };
      session.draft = cloneDraft(rebuiltDraft);
      session.uiState = {
        tab: String(existingUiState.tab || 'practice').trim() || 'practice'
      };
      if (!keepDirty) {
        session.isDirty = false;
        session.lastSavedDraftSignature = buildDraftSignature(session.draft);
      }
      touchSession(session);
      touched.push(session);
    });

    if (touched.length && workspace.activeSessionId) {
      syncActiveDraft(state, { createEmptyDraft });
    }

    return touched;
  }

  function closeSession(state, sessionId, options = {}) {
    const { createEmptyDraft } = options;
    const workspace = ensureState(state, { createEmptyDraft });
    if (!workspace) return null;
    const index = workspace.sessions.findIndex((session) => session.id === sessionId);
    if (index === -1) return getActiveSession(state, { createEmptyDraft });

    const [removed] = workspace.sessions.splice(index, 1);
    if (!workspace.sessions.length) {
      workspace.sessions = [createSession({ createEmptyDraft, source: 'new' })];
    }

    if (workspace.activeSessionId === sessionId) {
      const fallback = workspace.sessions[Math.max(0, index - 1)] || workspace.sessions[0];
      workspace.activeSessionId = fallback.id;
    }

    syncActiveDraft(state, { createEmptyDraft });
    return removed;
  }

  function describeSession(session, i18n) {
    const draft = session?.draft || {};
    const currentSignature = buildDraftSignature(draft);
    const hasUnsaved = Boolean(session?.isDirty) && (!String(session?.lastSavedDraftSignature || '').trim() || String(session?.lastSavedDraftSignature || '').trim() !== currentSignature);
    const isEditing = Boolean(String(draft.editingPracticeId || '').trim());
    const reference = String(draft.generatedReference || '').trim();
    const clientName = String(draft.clientName || '').trim();
    const practiceType = String(draft.practiceType || '').trim();
    const fallbackDraft = typeof i18n?.t === 'function'
      ? i18n.t('ui.workspaceDraftMask', 'Nuova maschera')
      : 'Nuova maschera';
    const fallbackEdit = typeof i18n?.t === 'function'
      ? i18n.t('ui.workspaceEditMask', 'Maschera pratica')
      : 'Maschera pratica';
    const draftBadge = typeof i18n?.t === 'function'
      ? i18n.t('ui.workspaceDraftBadge', 'Bozza')
      : 'Bozza';
    const editBadge = typeof i18n?.t === 'function'
      ? i18n.t('ui.workspaceEditBadge', 'In modifica')
      : 'In modifica';
    const dirtyBadge = typeof i18n?.t === 'function'
      ? i18n.t('ui.workspaceDirtyBadge', 'Da salvare')
      : 'Da salvare';

    return {
      id: session?.id || '',
      label: reference || clientName || (isEditing ? fallbackEdit : fallbackDraft),
      subtitle: clientName || practiceType || '—',
      badge: isEditing ? editBadge : draftBadge,
      dirtyBadge: hasUnsaved ? dirtyBadge : '',
      isDirty: hasUnsaved,
      isEditing,
      activeTabKey: String(session?.uiState?.tab || 'practice').trim() || 'practice',
      openedAt: session?.openedAt || '',
      lastTouchedAt: session?.lastTouchedAt || ''
    };
  }

  return {
    closeSession,
    describeSession,
    ensureState,
    findSession,
    getActiveSession,
    listSessions,
    hasSessionUnsavedChanges,
    markActiveSessionSaved,
    markSessionSaved,
    openDraftSession,
    openPracticeSession,
    syncPracticeSessions,
    setActiveDirty,
    setActiveTab,
    setSessionDirty,
    setSessionTab,
    switchSession,
    syncActiveDraft
  };
})();
