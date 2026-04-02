window.KedrixOnePracticeSavePipeline = (() => {
  'use strict';

  const SeaSchemaCleanup = window.KedrixOneSeaSchemaCleanup;
  const ReferenceNormalizer = window.KedrixOnePracticeReferenceNormalizer;

  const preSaveHooks = [];

  function registerPreSaveHook(hook) {
    if (typeof hook !== 'function') return false;
    preSaveHooks.push(hook);
    return true;
  }

  function listPreSaveHooks() {
    return [...preSaveHooks];
  }

  function runPreSaveHooks(context = {}) {
    const errors = [];
    preSaveHooks.forEach((hook) => {
      try {
        const result = hook(context);
        if (!result) return;

        if (Array.isArray(result.errors)) {
          errors.push(...result.errors.filter(Boolean));
          return;
        }

        if (result.valid === false) {
          errors.push(result.error || {
            field: '',
            tab: 'identity',
            label: 'Pratica',
            message: 'Controllo pre-save non superato.'
          });
        }
      } catch (error) {
        errors.push({
          field: '',
          tab: 'identity',
          label: 'Pratica',
          message: error && error.message ? error.message : 'Errore durante il controllo pre-save.'
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function prepareNormalizedDraft(draft, normalizeSeaPortField, companyConfig) {
    if (ReferenceNormalizer && typeof ReferenceNormalizer.normalizeDraftReferences === 'function') {
      ReferenceNormalizer.normalizeDraftReferences(draft, companyConfig);
    }

    const normalizedSeaPortLoading = draft.practiceType && draft.practiceType.startsWith('sea_')
      ? normalizeSeaPortField(draft.practiceType, 'portLoading', draft.dynamicData.portLoading || '')
      : (draft.dynamicData.portLoading || draft.dynamicData.airportDeparture || '');
    const normalizedSeaPortDischarge = draft.practiceType && draft.practiceType.startsWith('sea_')
      ? normalizeSeaPortField(draft.practiceType, 'portDischarge', draft.dynamicData.portDischarge || '')
      : (draft.dynamicData.portDischarge || draft.dynamicData.airportDestination || '');

    if (normalizedSeaPortLoading && draft.practiceType && draft.practiceType.startsWith('sea_')) draft.dynamicData.portLoading = normalizedSeaPortLoading;
    if (normalizedSeaPortDischarge && draft.practiceType && draft.practiceType.startsWith('sea_')) draft.dynamicData.portDischarge = normalizedSeaPortDischarge;

    return {
      normalizedSeaPortLoading,
      normalizedSeaPortDischarge
    };
  }

  function buildRecord(options = {}) {
    const {
      state,
      draft,
      getPracticeSchema,
      buildDynamicLabelsForType,
      normalizeSeaPortField,
      companyConfig,
      practiceTypeLabel,
      buildCurrentPracticeReference,
      nextPracticeId
    } = options;

    const attachmentOwnerKey = String(draft.attachmentOwnerKey || existingRecord?.attachmentOwnerKey || draft.editingPracticeId || '').trim();
    const attachmentItems = attachmentOwnerKey && state && state.practiceAttachmentIndex && Array.isArray(state.practiceAttachmentIndex[attachmentOwnerKey])
      ? state.practiceAttachmentIndex[attachmentOwnerKey]
      : [];

    const schema = typeof getPracticeSchema === 'function' ? getPracticeSchema(draft.practiceType) : null;
    const dynamicLabels = typeof buildDynamicLabelsForType === 'function' ? buildDynamicLabelsForType(draft.practiceType) : {};
    const existingRecord = draft.editingPracticeId ? ((state && state.practices) || []).find((item) => item.id === draft.editingPracticeId) : null;
    if (SeaSchemaCleanup && typeof SeaSchemaCleanup.normalizeDraft === 'function') {
      SeaSchemaCleanup.normalizeDraft(draft);
    }
    const { normalizedSeaPortLoading, normalizedSeaPortDischarge } = prepareNormalizedDraft(draft, normalizeSeaPortField || (() => ''), companyConfig);
    const policyNumber = draft.dynamicData.policyNumber || draft.dynamicData.mbl || '';
    const customsOffice = draft.dynamicData.customsOffice || draft.dynamicData.customsOperator || '';

    return {
      existingRecord,
      record: {
        id: draft.editingPracticeId || (typeof nextPracticeId === 'function' ? nextPracticeId((state && state.practices) || []) : ''),
        reference: draft.generatedReference || (typeof buildCurrentPracticeReference === 'function' ? buildCurrentPracticeReference() : ''),
        clientId: draft.clientId || '',
        client: draft.clientName,
        clientName: draft.clientName,
        linkedClientId: draft.clientId || '',
        linkedClientName: draft.clientName,
        practiceType: draft.practiceType,
        practiceTypeLabel: typeof practiceTypeLabel === 'function' ? practiceTypeLabel(draft.practiceType) : (draft.practiceType || ''),
        schemaGroup: schema ? schema.group : '',
        category: draft.category,
        practiceDate: draft.practiceDate,
        status: draft.status || 'Operativa',
        priority: existingRecord?.priority || 'Media',
        importer: draft.dynamicData.importer || '',
        consignee: draft.dynamicData.consignee || '',
        portLoading: normalizedSeaPortLoading || draft.dynamicData.airportDeparture || draft.dynamicData.portLoading || '',
        portDischarge: normalizedSeaPortDischarge || draft.dynamicData.airportDestination || draft.dynamicData.portDischarge || '',
        containerCode: draft.dynamicData.containerCode || '',
        packageCount: draft.dynamicData.packageCount || '',
        grossWeight: draft.dynamicData.grossWeight || '',
        goodsDescription: draft.dynamicData.goodsDescription || '',
        booking: draft.dynamicData.booking || '',
        terminal: draft.dynamicData.terminal || draft.dynamicData.terminalPickup || draft.dynamicData.terminalDelivery || '',
        terminalPickup: draft.dynamicData.terminalPickup || '',
        terminalDelivery: draft.dynamicData.terminalDelivery || '',
        mbl: policyNumber,
        hbl: draft.dynamicData.hbl || '',
        mawb: draft.dynamicData.mawb || '',
        hawb: draft.dynamicData.hawb || '',
        cmr: draft.dynamicData.cmr || '',
        carrier: draft.dynamicData.carrier || '',
        transporter: draft.dynamicData.transporter || '',
        airline: draft.dynamicData.airline || '',
        deposit: draft.dynamicData.deposit || '',
        customsOffice: customsOffice,
        customsSection: '',
        policyNumber: policyNumber,
        baseQuotation: draft.dynamicData.baseQuotation || '',
        deliveryCity: draft.dynamicData.deliveryCity || '',
        additionalReference: draft.dynamicData.additionalReference || '',
        bolla: draft.dynamicData.bolla || '',
        eta: draft.dynamicData.arrivalDate || draft.dynamicData.departureDate || draft.dynamicData.deliveryDate || draft.practiceDate,
        type: draft.practiceType.includes('export') ? 'Export' : draft.practiceType.includes('import') ? 'Import' : 'Magazzino',
        port: draft.dynamicData.portDischarge || draft.dynamicData.airportDestination || draft.dynamicData.deliveryPlace || draft.dynamicData.deposit || '',
        notes: draft.dynamicData.internalNotes || '',
        billingLinkStatus: existingRecord?.billingLinkStatus || 'Da collegare',
        sourceModule: 'practices',
        dynamicData: { ...(draft.dynamicData || {}) },
        dynamicLabels,
        attachmentOwnerKey,
        attachmentCount: attachmentItems.length,
        attachmentUpdatedAt: attachmentItems.length ? attachmentItems[0].importedAt || '' : ''
      }
    };
  }

  function createDuplicateSafeDraft(record, options = {}) {
    const {
      createEmptyDraft,
      practiceDate
    } = options;

    if (!record || typeof record !== 'object') {
      return typeof createEmptyDraft === 'function' ? createEmptyDraft() : null;
    }

    const dynamicData = record.dynamicData && typeof record.dynamicData === 'object'
      ? { ...record.dynamicData }
      : {};

    const normalizedDynamicData = SeaSchemaCleanup && typeof SeaSchemaCleanup.normalizeDynamicData === 'function'
      ? SeaSchemaCleanup.normalizeDynamicData(dynamicData, record.practiceType || '')
      : dynamicData;

    return typeof createEmptyDraft === 'function'
      ? createEmptyDraft({
        editingPracticeId: '',
        practiceType: record.practiceType || '',
        clientId: record.clientId || '',
        clientName: record.clientName || record.client || '',
        practiceDate: practiceDate || new Date().toISOString().slice(0, 10),
        category: record.category || '',
        status: record.status || 'In attesa documenti',
        generatedReference: '',
        dynamicData: normalizedDynamicData
      })
      : null;
  }

  function commitRecord(options = {}) {
    const {
      state,
      draft,
      record,
      existingRecord,
      getClientById,
      commitPracticeNumber,
      nextLogId,
      nowStamp,
      logTexts,
      toast,
      save,
      render,
      loadPracticeIntoDraft,
      focusPracticeEditor
    } = options;

    const matchedClient = typeof getClientById === 'function' ? getClientById(draft.clientId) : null;
    if (matchedClient && !draft.editingPracticeId && typeof commitPracticeNumber === 'function') {
      commitPracticeNumber(matchedClient.numberingRule, draft.practiceDate);
    }

    const isEditing = Boolean(draft.editingPracticeId);
    if (isEditing) {
      const index = ((state && state.practices) || []).findIndex((item) => item.id === draft.editingPracticeId);
      if (index >= 0) state.practices[index] = record;
    } else {
      state.practices.unshift(record);
    }

    if (Array.isArray(state.operatorLogs)) {
      state.operatorLogs.unshift({
        id: typeof nextLogId === 'function' ? nextLogId(state.operatorLogs) : `${Date.now()}`,
        when: typeof nowStamp === 'function' ? nowStamp() : new Date().toISOString(),
        practiceId: record.id,
        text: isEditing ? logTexts.updated : logTexts.created
      });
    }

    if (typeof toast === 'function') toast(isEditing ? logTexts.updatedToast : logTexts.createdToast);

    state.selectedPracticeId = record.id;
    state.practiceDuplicateSource = null;
    if (typeof loadPracticeIntoDraft === 'function') loadPracticeIntoDraft(record.id);
    state.practiceOpenSource = 'save';

    if (typeof save === 'function') save();
    if (typeof render === 'function') render();
    if (typeof focusPracticeEditor === 'function') focusPracticeEditor('save', record.id);

    return {
      mode: isEditing ? 'update' : 'create',
      record
    };
  }

  function saveDraft(options = {}) {
    const {
      state,
      draft,
      i18n,
      getClientById,
      getPracticeSchema,
      buildDynamicLabelsForType,
      normalizeSeaPortField,
      companyConfig,
      practiceTypeLabel,
      buildCurrentPracticeReference,
      nextPracticeId,
      commitPracticeNumber,
      nextLogId,
      nowStamp,
      toast,
      save,
      render,
      loadPracticeIntoDraft,
      focusPracticeEditor
    } = options;

    const preSaveResult = runPreSaveHooks({ state, draft });
    if (!preSaveResult.valid) return { ok: false, errors: preSaveResult.errors };

    const { record, existingRecord } = buildRecord({
      state,
      draft,
      getPracticeSchema,
      buildDynamicLabelsForType,
      normalizeSeaPortField,
      companyConfig,
      practiceTypeLabel,
      buildCurrentPracticeReference,
      nextPracticeId
    });

    const updatedLabel = typeof i18n?.t === 'function' ? i18n.t('ui.practiceUpdated', 'Pratica aggiornata') : 'Pratica aggiornata';
    const createdLabel = typeof i18n?.t === 'function' ? i18n.t('ui.practiceSaved', 'Pratica salvata') : 'Pratica salvata';
    const updatedLogPrefix = typeof i18n?.getLanguage === 'function' && i18n.getLanguage() === 'en' ? 'Practice updated' : 'Pratica aggiornata';
    const createdLogPrefix = typeof i18n?.getLanguage === 'function' && i18n.getLanguage() === 'en' ? 'Practice created' : 'Creata pratica';

    const result = commitRecord({
      state,
      draft,
      record,
      existingRecord,
      getClientById,
      commitPracticeNumber,
      nextLogId,
      nowStamp,
      toast,
      save,
      render,
      loadPracticeIntoDraft,
      focusPracticeEditor,
      logTexts: {
        updated: `${updatedLogPrefix} ${record.reference}.`,
        created: `${createdLogPrefix} ${record.reference}.`,
        updatedToast: updatedLabel,
        createdToast: createdLabel
      }
    });

    return {
      ok: true,
      ...result
    };
  }

  return {
    buildRecord,
    commitRecord,
    createDuplicateSafeDraft,
    listPreSaveHooks,
    registerPreSaveHook,
    runPreSaveHooks,
    saveDraft
  };
})();
