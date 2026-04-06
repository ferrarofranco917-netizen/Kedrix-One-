window.KedrixOneImportDocumentReferenceValidator = (() => {
  'use strict';

  const Mapper = window.KedrixOneImportDocumentReferenceMapper || null;
  const DocumentEngine = window.KedrixOneDocumentEngine || null;

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function cleanText(value) {
    return String(value || '').trim();
  }

  function normalizeToken(value) {
    return cleanText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .trim();
  }

  function normalizeTags(value) {
    return cleanText(value)
      .split(',')
      .map((item) => cleanText(item))
      .filter(Boolean);
  }

  function findPractice(state, values) {
    const practices = Array.isArray(state?.practices) ? state.practices : [];
    const practiceId = cleanText(values.practiceId);
    const ownerKey = cleanText(values.attachmentOwnerKey);
    const practiceReference = normalizeToken(values.practiceReference);
    return practices.find((practice) => cleanText(practice.id) === practiceId)
      || practices.find((practice) => cleanText(practice.attachmentOwnerKey) === ownerKey)
      || practices.find((practice) => normalizeToken(practice.reference) === practiceReference)
      || null;
  }

  function documentFingerprint(payload = {}) {
    return [
      cleanText(payload.practiceId),
      cleanText(payload.documentType).toLowerCase(),
      cleanText(payload.documentLabel).toLowerCase(),
      cleanText(payload.externalReference).toLowerCase(),
      cleanText(payload.customsMrn).toLowerCase(),
      cleanText(payload.documentDate)
    ].join('||');
  }

  function existingFingerprints(state, i18n) {
    const documents = DocumentEngine && typeof DocumentEngine.listDocuments === 'function'
      ? DocumentEngine.listDocuments(state || {}, i18n)
      : [];
    return new Set(documents.map((item) => documentFingerprint(item)));
  }

  function validateRows({ rows, state, i18n }) {
    const issues = [];
    const seenFingerprints = new Set();
    const existing = existingFingerprints(state, i18n);

    const normalizedRows = (Array.isArray(rows) ? rows : []).map((row) => {
      const values = { ...(row.values || {}) };
      values.documentType = Mapper && typeof Mapper.canonicalizeDocumentType === 'function'
        ? Mapper.canonicalizeDocumentType(values.documentType, state, i18n)
        : cleanText(values.documentType);
      values.tags = normalizeTags(values.tags);

      const errors = [];
      const warnings = [];
      const practice = findPractice(state, values);

      if (!practice) {
        errors.push(t(i18n, 'ui.importDocRefPracticeNotFound', 'Pratica non trovata: usa ID, riferimento pratica o owner key validi.'));
      }
      if (!cleanText(values.documentType)) {
        errors.push(t(i18n, 'ui.importDocRefMissingType', 'Tipo documento mancante.'));
      }
      if (!cleanText(values.externalReference) && !cleanText(values.customsMrn) && !cleanText(values.documentLabel)) {
        warnings.push(t(i18n, 'ui.importDocRefWeakIdentityWarning', 'Riferimento documento poco identificabile: aggiungi almeno label, riferimento o MRN.'));
      }

      const draft = {
        practiceId: practice?.id || '',
        ownerKey: cleanText(practice?.attachmentOwnerKey || practice?.id || values.attachmentOwnerKey),
        practiceReference: cleanText(practice?.reference || values.practiceReference),
        clientName: cleanText(practice?.clientName || practice?.client),
        documentType: cleanText(values.documentType),
        documentLabel: cleanText(values.documentLabel),
        documentDate: cleanText(values.documentDate),
        externalReference: cleanText(values.externalReference),
        customsMrn: cleanText(values.customsMrn),
        tags: values.tags,
        notes: cleanText(values.notes)
      };

      const fingerprint = documentFingerprint(draft);
      if (fingerprint && existing.has(fingerprint)) {
        warnings.push(t(i18n, 'ui.importDocRefDuplicateExistingWarning', 'Possibile riferimento documentale già presente nel sistema.'));
      }
      if (fingerprint && seenFingerprints.has(fingerprint)) {
        warnings.push(t(i18n, 'ui.importDocRefDuplicateInFileWarning', 'Possibile riferimento documentale duplicato nello stesso file.'));
      }
      if (fingerprint) seenFingerprints.add(fingerprint);

      const tone = errors.length ? 'critical' : (warnings.length ? 'attention' : 'ready');
      errors.forEach((message) => issues.push({ rowNumber: row.rowNumber, tone: 'critical', message }));
      warnings.forEach((message) => issues.push({ rowNumber: row.rowNumber, tone: 'attention', message }));

      return {
        ...row,
        values,
        draft,
        errors,
        warnings,
        tone,
        practice
      };
    });

    const summary = {
      totalRows: normalizedRows.length,
      validRows: normalizedRows.filter((row) => !row.errors.length).length,
      warningRows: normalizedRows.filter((row) => !row.errors.length && row.warnings.length).length,
      blockedRows: normalizedRows.filter((row) => row.errors.length).length,
      mappedFields: Object.keys(rows[0]?.values || {}).filter((key) => rows.some((item) => cleanText(item.values?.[key]))).length
    };

    return {
      rows: normalizedRows,
      summary,
      issues
    };
  }

  return {
    validateRows,
    findPractice,
    documentFingerprint
  };
})();
