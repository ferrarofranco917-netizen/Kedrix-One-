window.KedrixOnePracticeCalmStart = (() => {
  'use strict';

  function isNewDraft(draft = {}) {
    return !String((draft && draft.editingPracticeId) || '').trim();
  }

  function getActiveSessionId(state = {}) {
    return String(state?.practiceWorkspace?.activeSessionId || '').trim();
  }

  function hasSaveAttempt(state = {}) {
    const key = getActiveSessionId(state) || 'global';
    const map = state?.practiceUi?.saveAttemptsBySession;
    if (map && typeof map === 'object' && Object.prototype.hasOwnProperty.call(map, key)) {
      return Boolean(map[key]);
    }
    return Boolean(Array.isArray(state?._practiceValidationErrors) && state._practiceValidationErrors.length);
  }

  function shouldSuppressBoards(options = {}) {
    const { state = {}, draft = {} } = options;
    return isNewDraft(draft) && !hasSaveAttempt(state);
  }

  return {
    isNewDraft,
    hasSaveAttempt,
    shouldSuppressBoards
  };
})();
