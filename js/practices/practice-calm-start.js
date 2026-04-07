window.KedrixOnePracticeCalmStart = (() => {
  'use strict';

  function isNewDraft(draft = {}) {
    return !String(draft && draft.editingPracticeId || '').trim();
  }

  function hasValidationAttempt(state = {}) {
    return Array.isArray(state && state._practiceValidationErrors) && state._practiceValidationErrors.length > 0;
  }

  function shouldSuppressBoards(options = {}) {
    const { state = {}, draft = {} } = options;
    return isNewDraft(draft) && !hasValidationAttempt(state);
  }

  return {
    isNewDraft,
    hasValidationAttempt,
    shouldSuppressBoards
  };
})();
