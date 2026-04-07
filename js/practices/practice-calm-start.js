window.KedrixOnePracticeCalmStart = (() => {
  'use strict';

  function getActiveSession(state) {
    const workspace = state && state.practiceWorkspace && typeof state.practiceWorkspace === 'object'
      ? state.practiceWorkspace
      : null;
    const sessions = Array.isArray(workspace?.sessions) ? workspace.sessions : [];
    const activeId = String(workspace?.activeSessionId || '').trim();
    return sessions.find((session) => String(session?.id || '').trim() === activeId) || sessions[0] || null;
  }

  function ensureUiState(session) {
    if (!session || typeof session !== 'object') return null;
    if (!session.uiState || typeof session.uiState !== 'object') session.uiState = {};
    if (!String(session.uiState.tab || '').trim()) session.uiState.tab = 'practice';
    return session.uiState;
  }

  function isUnsavedDraft(draft) {
    return !String(draft?.editingPracticeId || '').trim();
  }

  function markSaveAttempted(state) {
    const session = getActiveSession(state);
    const uiState = ensureUiState(session);
    if (!uiState) return false;
    uiState.saveAttempted = true;
    return true;
  }

  function clearSaveAttempted(state) {
    const session = getActiveSession(state);
    const uiState = ensureUiState(session);
    if (!uiState) return false;
    delete uiState.saveAttempted;
    return true;
  }

  function hasSaveAttempted(state) {
    const session = getActiveSession(state);
    return Boolean(session?.uiState?.saveAttempted);
  }

  function shouldSuppressOverviewBoards(options = {}) {
    const { state, draft } = options;
    if (!isUnsavedDraft(draft)) return false;
    return !hasSaveAttempted(state);
  }

  function shouldStayOnStartAfterTypeSelection(options = {}) {
    const { state, draft } = options;
    if (!isUnsavedDraft(draft)) return false;
    return String(state?.practiceTab || '').trim() === 'start' && !hasSaveAttempted(state);
  }

  return {
    clearSaveAttempted,
    getActiveSession,
    hasSaveAttempted,
    isUnsavedDraft,
    markSaveAttempted,
    shouldStayOnStartAfterTypeSelection,
    shouldSuppressOverviewBoards
  };
})();
