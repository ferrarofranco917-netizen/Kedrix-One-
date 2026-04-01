window.KedrixOnePracticeSearchUI = (() => {
  'use strict';

  const SearchIndex = window.KedrixOneSearchIndex;

  function buildIndex(practices = []) {
    if (!SearchIndex || typeof SearchIndex.buildIndex !== 'function') return [];
    return SearchIndex.buildIndex(practices);
  }

  function rebuildIndex(practices = [], runtimeIndex = []) {
    if (!SearchIndex || typeof SearchIndex.updateIndex !== 'function') return [];
    return SearchIndex.updateIndex(practices, runtimeIndex);
  }

  function searchResults(query, practices = [], runtimeIndex = [], onIndexUpdate) {
    const safeQuery = String(query || '').trim();
    if (!safeQuery || !SearchIndex || typeof SearchIndex.search !== 'function') return [];
    const nextIndex = rebuildIndex(practices, runtimeIndex);
    if (typeof onIndexUpdate === 'function') onIndexUpdate(nextIndex);
    return SearchIndex.search(safeQuery, nextIndex);
  }

  function bindQueryInput(options = {}) {
    const {
      input,
      state,
      save,
      rerenderPreservingInput,
      clearPreviewOnInput = true
    } = options;

    if (!input || !state || typeof save !== 'function' || typeof rerenderPreservingInput !== 'function') return;
    if (input.dataset.boundPracticeSearchQuery === '1') return;
    input.dataset.boundPracticeSearchQuery = '1';

    input.addEventListener('input', (event) => {
      state.practiceSearchQuery = event.target.value || '';
      if (clearPreviewOnInput) state.practiceSearchPreviewId = '';
      save();
      rerenderPreservingInput('practiceSearchQuery', event.target.selectionStart, event.target.selectionEnd);
    });
  }

  return {
    bindQueryInput,
    buildIndex,
    rebuildIndex,
    searchResults
  };
})();
