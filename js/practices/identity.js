window.KedrixOnePracticeIdentity = (() => {
  'use strict';

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function createEmptyDraft(overrides = {}) {
    return {
      editingPracticeId: '',
      practiceType: '',
      clientId: '',
      clientName: '',
      practiceDate: today(),
      category: '',
      status: 'In attesa documenti',
      generatedReference: '',
      dynamicData: {},
      ...overrides,
      dynamicData: {
        ...((overrides && overrides.dynamicData) || {})
      }
    };
  }

  function ensureDraft(state) {
    if (!state || typeof state !== 'object') return createEmptyDraft();
    if (!state.draftPractice || typeof state.draftPractice !== 'object') {
      state.draftPractice = createEmptyDraft();
      return state.draftPractice;
    }

    const normalized = createEmptyDraft(state.draftPractice);
    if (JSON.stringify(normalized) !== JSON.stringify(state.draftPractice)) {
      state.draftPractice = normalized;
    }
    return state.draftPractice;
  }

  function resetDraft(state, options = {}) {
    if (!state || typeof state !== 'object') return createEmptyDraft();

    state.draftPractice = createEmptyDraft(options.overrides || {});
    state.practiceTab = options.practiceTab || 'practice';
    state._practiceValidationErrors = [];
    state.practiceSearchPreviewId = '';
    state.practiceOpenSource = '';
    return state.draftPractice;
  }

  function syncClientMatch(state, clientName) {
    const clean = String(clientName || '').trim().toUpperCase();
    const match = ((state && state.clients) || []).find((client) => String(client.name || '').trim().toUpperCase() === clean) || null;
    const draft = ensureDraft(state);
    draft.clientId = match ? match.id : '';
    draft.clientName = clientName;
    return match;
  }

  function buildCurrentPracticeReference(state, options = {}) {
    const {
      getClientById,
      buildPracticeReference,
      buildFallbackPracticeReference
    } = options;

    const draft = ensureDraft(state);
    const matchedClient = typeof getClientById === 'function' ? getClientById(draft.clientId) : null;
    if (matchedClient && typeof buildPracticeReference === 'function') {
      return buildPracticeReference(matchedClient.numberingRule, draft.practiceDate);
    }
    return typeof buildFallbackPracticeReference === 'function'
      ? buildFallbackPracticeReference(draft.clientName || 'PR', (state && state.practices) || [], draft.practiceDate)
      : '';
  }

  function loadPracticeIntoDraft(state, practiceId, options = {}) {
    if (!state || !practiceId) return null;

    const { extractPracticeDynamicData } = options;
    const practice = ((state && state.practices) || []).find((item) => item.id === practiceId) || null;
    if (!practice) return null;

    state.selectedPracticeId = practice.id;
    state.practiceTab = 'practice';
    state._practiceValidationErrors = [];
    state.draftPractice = createEmptyDraft({
      editingPracticeId: practice.id,
      practiceType: practice.practiceType || '',
      clientId: practice.clientId || '',
      clientName: practice.clientName || practice.client || '',
      practiceDate: practice.practiceDate || practice.eta || today(),
      category: practice.category || '',
      status: practice.status || 'Operativa',
      generatedReference: practice.reference || '',
      dynamicData: typeof extractPracticeDynamicData === 'function' ? extractPracticeDynamicData(practice) : { ...((practice && practice.dynamicData) || {}) }
    });

    return state.draftPractice;
  }

  function createDuplicateSafeDraft(practice, options = {}) {
    if (!practice || typeof practice !== 'object') return createEmptyDraft();

    const { extractPracticeDynamicData, practiceDate } = options;
    return createEmptyDraft({
      editingPracticeId: '',
      practiceType: practice.practiceType || '',
      clientId: practice.clientId || '',
      clientName: practice.clientName || practice.client || '',
      practiceDate: practiceDate || today(),
      category: practice.category || '',
      status: practice.status || 'In attesa documenti',
      generatedReference: '',
      dynamicData: typeof extractPracticeDynamicData === 'function' ? extractPracticeDynamicData(practice) : { ...((practice && practice.dynamicData) || {}) }
    });
  }

  return {
    buildCurrentPracticeReference,
    createDuplicateSafeDraft,
    createEmptyDraft,
    ensureDraft,
    loadPracticeIntoDraft,
    resetDraft,
    syncClientMatch
  };
})();
