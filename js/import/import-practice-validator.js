window.KedrixOneImportPracticeValidator = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;
  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

  const STRUCTURED_RELATION_FIELDS = ['clientName', 'importer', 'consignee', 'shipper', 'sender', 'carrier', 'company', 'airline'];

  function cleanText(value) {
    return String(value || '').trim();
  }

  function normalizeUpper(value) {
    return cleanText(value).toUpperCase();
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function buildDraft({ targetType, row, state }) {
    const values = row && row.values ? row.values : {};
    const draft = {
      editingPracticeId: '',
      practiceType: targetType,
      clientId: '',
      clientName: cleanText(values.clientName),
      practiceDate: cleanText(values.practiceDate),
      category: cleanText(values.category),
      status: cleanText(values.status) || 'Operativa',
      generatedReference: cleanText(values.reference),
      linkedEntities: {},
      dynamicData: {}
    };

    if (MasterDataEntities && typeof MasterDataEntities.applyLinkedRecordToDraft === 'function') {
      MasterDataEntities.applyLinkedRecordToDraft({ state, draft, fieldName: 'clientName', value: draft.clientName });
    }

    const fields = PracticeSchemas && typeof PracticeSchemas.getFields === 'function'
      ? PracticeSchemas.getFields(targetType)
      : [];

    fields.forEach((field) => {
      if (!field || field.type === 'derived' || field.type === 'select-derived') return;
      let nextValue = values[field.name];
      if (field.type === 'checkbox-group') {
        nextValue = Array.isArray(nextValue)
          ? nextValue.map((item) => cleanText(item)).filter(Boolean)
          : [];
      } else {
        nextValue = cleanText(nextValue);
      }

      if (MasterDataEntities && typeof MasterDataEntities.applyLinkedRecordToDraft === 'function' && STRUCTURED_RELATION_FIELDS.includes(field.name)) {
        MasterDataEntities.applyLinkedRecordToDraft({ state, draft, fieldName: field.name, value: nextValue });
      } else {
        draft.dynamicData[field.name] = nextValue;
      }
    });

    return draft;
  }

  function findExistingPractice(state, draft) {
    const practices = Array.isArray(state?.practices) ? state.practices : [];
    const importedReference = normalizeUpper(draft.generatedReference || '');
    if (importedReference) {
      return practices.find((practice) => normalizeUpper(practice.reference || '') === importedReference) || null;
    }

    const clientName = normalizeUpper(draft.clientName || '');
    const booking = normalizeUpper(draft.dynamicData?.booking || '');
    const policyNumber = normalizeUpper(draft.dynamicData?.policyNumber || draft.dynamicData?.mbl || '');
    const hbl = normalizeUpper(draft.dynamicData?.hbl || '');
    const mawb = normalizeUpper(draft.dynamicData?.mawb || '');
    const hawb = normalizeUpper(draft.dynamicData?.hawb || '');
    const cmr = normalizeUpper(draft.dynamicData?.cmr || '');
    const containerCode = normalizeUpper(draft.dynamicData?.containerCode || '');

    return practices.find((practice) => {
      if (normalizeUpper(practice.practiceType || '') !== normalizeUpper(draft.practiceType || '')) return false;
      if (clientName && normalizeUpper(practice.clientName || practice.client || '') !== clientName) return false;
      const dynamic = practice.dynamicData || {};
      if (booking && normalizeUpper(dynamic.booking || practice.booking || '') === booking) return true;
      if (policyNumber && normalizeUpper(dynamic.policyNumber || practice.policyNumber || practice.mbl || '') === policyNumber) return true;
      if (hbl && normalizeUpper(dynamic.hbl || practice.hbl || '') === hbl) return true;
      if (mawb && normalizeUpper(dynamic.mawb || practice.mawb || '') === mawb) return true;
      if (hawb && normalizeUpper(dynamic.hawb || practice.hawb || '') === hawb) return true;
      if (cmr && normalizeUpper(dynamic.cmr || practice.cmr || '') === cmr) return true;
      if (containerCode && normalizeUpper(dynamic.containerCode || practice.containerCode || '') === containerCode) return true;
      return false;
    }) || null;
  }

  function validateRows({ targetType, rows, schema, i18n, state }) {
    const issues = [];
    const referenceIndex = new Map();
    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;

    const inspectedRows = (Array.isArray(rows) ? rows : []).map((row) => {
      const warnings = [];
      const draft = buildDraft({ targetType, row, state });
      const validation = PracticeSchemas && typeof PracticeSchemas.validateDraft === 'function'
        ? PracticeSchemas.validateDraft(draft, state?.companyConfig)
        : { valid: true, errors: [] };
      const errors = Array.isArray(validation.errors) ? validation.errors.map((error) => error.message || '') : [];

      const importedReference = normalizeUpper(draft.generatedReference || '');
      if (importedReference) {
        if (referenceIndex.has(importedReference)) {
          warnings.push(t(i18n, 'ui.importPracticeDuplicateReferenceInFile', 'Riferimento pratica duplicato nello stesso file'));
        } else {
          referenceIndex.set(importedReference, row.rowNumber);
        }
      }

      if (cleanText(draft.clientName) && !cleanText(draft.clientId)) {
        warnings.push(t(i18n, 'ui.importPracticeClientNotLinkedWarning', 'Cliente non collegato ad anagrafica strutturata: la pratica verrà importata con valore manuale.'));
      }

      const structuredFields = ['importer', 'consignee', 'shipper', 'sender', 'carrier', 'company', 'airline'];
      structuredFields.forEach((fieldName) => {
        const rawValue = cleanText(draft.dynamicData?.[fieldName] || '');
        if (!rawValue) return;
        const linked = draft.linkedEntities && draft.linkedEntities[fieldName];
        if (!linked || !linked.recordId) {
          warnings.push(t(i18n, 'ui.importPracticeStructuredFieldManualWarning', 'Uno o più soggetti restano manuali: verifica i collegamenti con Anagrafiche.'));
        }
      });

      const existing = findExistingPractice(state, draft);
      if (existing) {
        warnings.push(t(i18n, 'ui.importPracticeDuplicateExistingWarning', 'Possibile pratica già presente nel sistema'));
      }

      if (errors.length) errorRows += 1;
      else if (warnings.length) warningRows += 1;
      else validRows += 1;

      if (errors.length || warnings.length) {
        issues.push({
          rowNumber: row.rowNumber,
          tone: errors.length ? 'critical' : 'attention',
          message: [...errors, ...warnings].join(' · ')
        });
      }

      return {
        ...row,
        draft,
        duplicateExisting: Boolean(existing),
        errors,
        warnings,
        tone: errors.length ? 'critical' : (warnings.length ? 'attention' : 'ready')
      };
    });

    return {
      rows: inspectedRows,
      summary: {
        entityKey: targetType,
        totalRows: inspectedRows.length,
        validRows,
        warningRows,
        errorRows,
        mappedFields: Array.isArray(schema) ? schema.length : 0
      },
      issues: issues.slice(0, 18)
    };
  }

  return {
    buildDraft,
    findExistingPractice,
    validateRows
  };
})();
