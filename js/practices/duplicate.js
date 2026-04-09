window.KedrixOnePracticeDuplicate = (() => {
  'use strict';

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
      ? createDuplicateSafeDraft(practice, { extractPracticeDynamicData, practiceDate, state: options.state || null })
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

  function buildSourceRecordFromDraft(activeDraft, fallbackRecord = null) {
    if (!activeDraft || typeof activeDraft !== 'object') return fallbackRecord;
    const editingPracticeId = String(activeDraft.editingPracticeId || '').trim();
    if (!editingPracticeId) return fallbackRecord;

    return {
      ...(fallbackRecord || {}),
      ...activeDraft,
      id: editingPracticeId,
      reference: String(activeDraft.generatedReference || fallbackRecord?.reference || '').trim(),
      client: activeDraft.clientName || fallbackRecord?.client || '',
      clientName: activeDraft.clientName || fallbackRecord?.clientName || '',
      linkedEntities: {
        ...((fallbackRecord && fallbackRecord.linkedEntities) || {}),
        ...((activeDraft && activeDraft.linkedEntities) || {})
      },
      dynamicData: {
        ...((fallbackRecord && fallbackRecord.dynamicData) || {}),
        ...((activeDraft && activeDraft.dynamicData) || {})
      }
    };
  }

  function resolveSourceRecord(practiceId, state) {
    const normalizedPracticeId = String(practiceId || '').trim();
    if (!normalizedPracticeId || !state) return null;

    const sourcePractice = ((state && state.practices) || []).find((item) => String(item.id || '') === normalizedPracticeId) || null;
    const activeDraft = state.draftPractice && typeof state.draftPractice === 'object'
      ? state.draftPractice
      : null;

    if (activeDraft && String(activeDraft.editingPracticeId || '').trim() === normalizedPracticeId) {
      return buildSourceRecordFromDraft(activeDraft, sourcePractice);
    }

    return sourcePractice;
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

    if (!state) return { ok: false, reason: 'missing-state' };

    const activeDraft = state.draftPractice && typeof state.draftPractice === 'object'
      ? state.draftPractice
      : null;
    const sourcePracticeId = String(practiceId || activeDraft?.editingPracticeId || state.selectedPracticeId || '').trim();
    if (!sourcePracticeId) return { ok: false, reason: 'missing-practice-id' };

    const sourceRecord = resolveSourceRecord(sourcePracticeId, state);
    if (!sourceRecord) return { ok: false, reason: 'practice-not-found' };

    const nextDraft = buildDuplicateDraft(sourceRecord, {
      createDuplicateSafeDraft,
      extractPracticeDynamicData,
      state
    });

    if (!nextDraft) return { ok: false, reason: 'duplicate-draft-build-failed' };

    const duplicateContext = {
      id: sourceRecord.id,
      reference: sourceRecord.reference || '',
      clientName: sourceRecord.clientName || sourceRecord.client || '',
      practiceType: sourceRecord.practiceType || '',
      practiceTypeLabel: sourceRecord.practiceTypeLabel || sourceRecord.practiceType || ''
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
      state.draftPractice.generatedReference = buildCurrentPracticeReference() || '';
    }

    if (typeof save === 'function') save();
    if (typeof render === 'function') render();
    if (typeof focusPracticeEditor === 'function') focusPracticeEditor(source, '');
    if (typeof toast === 'function') {
      const duplicatedReference = String(state?.draftPractice?.generatedReference || '').trim();
      const fallbackToast = duplicatedReference
        ? `Pratica duplicata: ${duplicatedReference}`
        : 'Pratica duplicata: nuova bozza pronta';
      const toastLabel = typeof i18n?.t === 'function'
        ? i18n.t('ui.practiceDuplicatedToast', fallbackToast)
        : fallbackToast;
      toast(toastLabel, 'success');
    }

    return {
      ok: true,
      draft: state.draftPractice,
      sourcePractice: sourceRecord
    };
  }

  function listResetFields() {
    return [...RESET_DYNAMIC_FIELDS, ...RESET_FLAG_FIELDS];
  }

  return {
    buildDuplicateDraft,
    buildSourceRecordFromDraft,
    duplicatePracticeToDraft,
    listResetFields,
    resolveSourceRecord,
    sanitizeDuplicatedDynamicData
  };
})();
