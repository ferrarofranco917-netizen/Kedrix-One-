window.KedrixOnePracticeIdentity = (() => {
  'use strict';

  const SeaSchemaCleanup = window.KedrixOneSeaSchemaCleanup;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function createAttachmentOwnerKey() {
    return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function resolveAttachmentOwnerKey(overrides = {}) {
    const explicitOwnerKey = String(overrides.attachmentOwnerKey || '').trim();
    if (explicitOwnerKey) return explicitOwnerKey;
    const editingPracticeId = String(overrides.editingPracticeId || '').trim();
    if (editingPracticeId) return editingPracticeId;
    return createAttachmentOwnerKey();
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
      attachmentOwnerKey: resolveAttachmentOwnerKey(overrides),
      dynamicData: {},
      ...overrides,
      attachmentOwnerKey: resolveAttachmentOwnerKey(overrides),
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
    state.practiceDuplicateSource = null;
    state.selectedPracticeId = '';
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
    state.practiceDuplicateSource = null;
    state.draftPractice = createEmptyDraft({
      editingPracticeId: practice.id,
      practiceType: practice.practiceType || '',
      clientId: practice.clientId || '',
      clientName: practice.clientName || practice.client || '',
      practiceDate: practice.practiceDate || practice.eta || today(),
      category: practice.category || '',
      status: practice.status || 'Operativa',
      generatedReference: practice.reference || '',
      attachmentOwnerKey: practice.attachmentOwnerKey || practice.id || createAttachmentOwnerKey(),
      dynamicData: typeof extractPracticeDynamicData === 'function' ? extractPracticeDynamicData(practice) : { ...((practice && practice.dynamicData) || {}) }
    });

    if (SeaSchemaCleanup && typeof SeaSchemaCleanup.normalizeDraft === 'function') {
      SeaSchemaCleanup.normalizeDraft(state.draftPractice);
    }

    return state.draftPractice;
  }

  function createDuplicateSafeDraft(practice, options = {}) {
    if (!practice || typeof practice !== 'object') return createEmptyDraft();

    const { extractPracticeDynamicData, practiceDate } = options;
    const draft = createEmptyDraft({
      editingPracticeId: '',
      practiceType: practice.practiceType || '',
      clientId: practice.clientId || '',
      clientName: practice.clientName || practice.client || '',
      practiceDate: practiceDate || today(),
      category: practice.category || '',
      status: practice.status || 'In attesa documenti',
      generatedReference: '',
      attachmentOwnerKey: createAttachmentOwnerKey(),
      dynamicData: typeof extractPracticeDynamicData === 'function' ? extractPracticeDynamicData(practice) : { ...((practice && practice.dynamicData) || {}) }
    });

    if (SeaSchemaCleanup && typeof SeaSchemaCleanup.normalizeDraft === 'function') {
      SeaSchemaCleanup.normalizeDraft(draft);
    }

    return draft;
  }

  return {
    buildCurrentPracticeReference,
    createAttachmentOwnerKey,
    createDuplicateSafeDraft,
    createEmptyDraft,
    ensureDraft,
    loadPracticeIntoDraft,
    resetDraft,
    syncClientMatch
  };
})();
