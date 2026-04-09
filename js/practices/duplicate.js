window.KedrixOnePracticeDuplicate = (() => {
  'use strict';

  const Utils = window.KedrixOneUtils || null;

  const RESET_DYNAMIC_FIELDS = [
    'booking',
    'containerCode',
    'mbl',
    'hbl',
    'mawb',
    'hawb',
    'cmr',
    'bolla',
    'policyNumber',
    'pickupDate',
    'deliveryDate',
    'departureDate',
    'arrivalDate',
    'effectiveDate',
    'dischargeDate',
    'customsDate'
  ];

  const RESET_FLAG_FIELDS = [
    'inspectionFlags',
    'warehouseFlag',
    'verificationFlags'
  ];

  function clearDuplicatedValue(value) {
    return Array.isArray(value) ? [] : '';
  }

  function sanitizeDuplicatedDynamicData(dynamicData = {}) {
    const next = { ...(dynamicData || {}) };
    [...RESET_DYNAMIC_FIELDS, ...RESET_FLAG_FIELDS].forEach((fieldName) => {
      if (!(fieldName in next)) return;
      next[fieldName] = clearDuplicatedValue(next[fieldName]);
    });
    return next;
  }

  function buildDuplicateDraft(practice, options = {}) {
    const {
      createDuplicateSafeDraft,
      extractPracticeDynamicData,
      practiceDate,
      defaultStatus = 'In attesa documenti'
    } = options;

    if (!practice || typeof practice !== 'object') return null;

    const baseDraft = typeof createDuplicateSafeDraft === 'function'
      ? createDuplicateSafeDraft(practice, { extractPracticeDynamicData, practiceDate })
      : null;

    const nextDraft = baseDraft || {
      editingPracticeId: '',
      practiceType: practice.practiceType || '',
      clientId: practice.clientId || '',
      clientName: practice.clientName || practice.client || '',
      practiceDate: practiceDate || new Date().toISOString().slice(0, 10),
      category: practice.category || '',
      status: defaultStatus,
      generatedReference: '',
      dynamicData: typeof extractPracticeDynamicData === 'function'
        ? extractPracticeDynamicData(practice)
        : { ...((practice && practice.dynamicData) || {}) }
    };

    nextDraft.editingPracticeId = '';
    nextDraft.generatedReference = '';
    nextDraft.practiceDate = practiceDate || nextDraft.practiceDate || new Date().toISOString().slice(0, 10);
    nextDraft.status = defaultStatus;
    nextDraft.dynamicData = sanitizeDuplicatedDynamicData(nextDraft.dynamicData || {});

    return nextDraft;
  }

  function duplicatePracticeToDraft(practiceId, options = {}) {
    const {
      state,
      i18n,
      buildCurrentPracticeReference,
      createDuplicateSafeDraft,
      extractPracticeDynamicData,
      openDraftSession,
      save,
      render,
      toast,
      focusPracticeEditor,
      source = 'duplicate'
    } = options;

    if (!state || !practiceId) return { ok: false, reason: 'missing-practice-id' };

    const sourcePractice = ((state && state.practices) || []).find((item) => item.id === practiceId) || null;
    if (!sourcePractice) return { ok: false, reason: 'practice-not-found' };

    const nextDraft = buildDuplicateDraft(sourcePractice, {
      createDuplicateSafeDraft,
      extractPracticeDynamicData
    });

    if (!nextDraft) return { ok: false, reason: 'duplicate-draft-build-failed' };

    const duplicateContext = {
      id: sourcePractice.id,
      reference: sourcePractice.reference || '',
      clientName: sourcePractice.clientName || sourcePractice.client || '',
      practiceType: sourcePractice.practiceType || '',
      practiceTypeLabel: sourcePractice.practiceTypeLabel || sourcePractice.practiceType || ''
    };

    if (typeof openDraftSession === 'function') {
      openDraftSession(nextDraft, {
        source,
        practiceDuplicateSource: duplicateContext
      });
    } else {
      state.draftPractice = nextDraft;
      state.practiceTab = 'practice';
      state._practiceValidationErrors = [];
      state.practiceSearchPreviewId = '';
      state.practiceOpenSource = source;
      state.practiceDuplicateSource = duplicateContext;
      state.selectedPracticeId = '';
    }

    state.practiceOpenSource = source;
    state.practiceDuplicateSource = duplicateContext;
    state.selectedPracticeId = '';

    if (typeof buildCurrentPracticeReference === 'function') {
      const baseReference = buildCurrentPracticeReference() || '';
      if (Utils && typeof Utils.ensureUniquePracticeReference === 'function' && typeof Utils.listTakenPracticeReferences === 'function') {
        const takenReferences = Utils.listTakenPracticeReferences(state, {
          excludePracticeId: '',
          excludeSessionId: ''
        });
        state.draftPractice.generatedReference = Utils.ensureUniquePracticeReference(baseReference, {
          takenReferences,
          fallbackPrefix: Utils.deriveClientPrefix ? Utils.deriveClientPrefix(state.draftPractice.clientName || sourcePractice.clientName || sourcePractice.client || 'PR') : 'PR',
          dateValue: state.draftPractice.practiceDate
        });
      } else {
        state.draftPractice.generatedReference = baseReference;
      }
    }

    if (typeof save === 'function') save();
    if (typeof render === 'function') render();
    if (typeof focusPracticeEditor === 'function') focusPracticeEditor(source, '');
    if (typeof toast === 'function') {
      const toastLabel = typeof i18n?.t === 'function'
        ? i18n.t('ui.practiceDuplicatedDraftReady', 'Copia pratica pronta')
        : 'Copia pratica pronta';
      toast(toastLabel);
    }

    return {
      ok: true,
      draft: state.draftPractice,
      sourcePractice
    };
  }

  function listResetFields() {
    return [...RESET_DYNAMIC_FIELDS, ...RESET_FLAG_FIELDS];
  }

  return {
    buildDuplicateDraft,
    duplicatePracticeToDraft,
    listResetFields,
    sanitizeDuplicatedDynamicData
  };
})();
