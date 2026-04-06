window.KedrixOneImportPracticeCommit = (() => {
  'use strict';

  const PracticeSavePipeline = window.KedrixOnePracticeSavePipeline || null;
  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;
  const ReferenceNormalizer = window.KedrixOnePracticeReferenceNormalizer || null;
  const Utils = window.KedrixOneUtils || null;
  const PracticeValidator = window.KedrixOneImportPracticeValidator || null;

  const ELIGIBLE_TARGETS = ['sea_import', 'sea_export', 'air_import', 'air_export', 'road_import', 'road_export', 'warehouse'];

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanUpper(value) {
    return cleanText(value).toUpperCase();
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function canCommitTarget(entityKey) {
    return ELIGIBLE_TARGETS.includes(cleanText(entityKey));
  }

  function buildDynamicLabelsForType(type, i18n) {
    const labels = {};
    const fields = PracticeSchemas && typeof PracticeSchemas.getFields === 'function' ? PracticeSchemas.getFields(type) : [];
    fields.forEach((field) => {
      if (!field || field.type === 'derived' || field.type === 'select-derived') return;
      labels[field.name] = t(i18n, field.labelKey, field.name || '');
    });
    return labels;
  }

  function practiceTypeLabel(type, i18n) {
    const mapping = {
      sea_import: t(i18n, 'ui.typeSeaImport', 'Mare Import'),
      sea_export: t(i18n, 'ui.typeSeaExport', 'Mare Export'),
      air_import: t(i18n, 'ui.typeAirImport', 'Aerea Import'),
      air_export: t(i18n, 'ui.typeAirExport', 'Aerea Export'),
      road_import: t(i18n, 'ui.typeRoadImport', 'Terra Import'),
      road_export: t(i18n, 'ui.typeRoadExport', 'Terra Export'),
      warehouse: t(i18n, 'ui.typeWarehouse', 'Magazzino')
    };
    return mapping[type] || type || '—';
  }

  function normalizeSeaPortField(practiceType, fieldName, rawValue, companyConfig) {
    if (ReferenceNormalizer && typeof ReferenceNormalizer.normalizeFieldValue === 'function') {
      return ReferenceNormalizer.normalizeFieldValue(practiceType, fieldName, rawValue, companyConfig);
    }
    return cleanText(rawValue);
  }

  function findExistingPractice(state, draft) {
    return PracticeValidator && typeof PracticeValidator.findExistingPractice === 'function'
      ? PracticeValidator.findExistingPractice(state, draft)
      : null;
  }

  function buildReference(state, draft) {
    const importedReference = cleanText(draft.generatedReference || '');
    if (importedReference) return importedReference;
    const client = Array.isArray(state?.clients)
      ? state.clients.find((item) => cleanText(item.id) === cleanText(draft.clientId || ''))
      : null;
    if (client && client.numberingRule && Utils && typeof Utils.buildPracticeReference === 'function') {
      return Utils.buildPracticeReference(client.numberingRule, draft.practiceDate);
    }
    return Utils && typeof Utils.buildFallbackPracticeReference === 'function'
      ? Utils.buildFallbackPracticeReference(draft.clientName || draft.practiceType || 'PR', state?.practices || [], draft.practiceDate)
      : importedReference;
  }

  function summarizePlannedCommit({ state, entityKey, rows }) {
    const plan = {
      eligible: canCommitTarget(entityKey),
      totalRows: 0,
      blockedRows: 0,
      warningRows: 0,
      readyRows: 0,
      creatableRows: 0,
      duplicateRows: 0
    };
    if (!plan.eligible) return plan;

    (Array.isArray(rows) ? rows : []).forEach((row) => {
      plan.totalRows += 1;
      const errors = Array.isArray(row.errors) ? row.errors : [];
      const warnings = Array.isArray(row.warnings) ? row.warnings : [];
      if (errors.length) {
        plan.blockedRows += 1;
        return;
      }
      if (warnings.length) plan.warningRows += 1;
      else plan.readyRows += 1;
      const draft = row.draft || null;
      if (!draft || !cleanText(draft.clientName) || !cleanText(draft.practiceDate)) {
        plan.blockedRows += 1;
        return;
      }
      const existing = findExistingPractice(state, draft);
      if (existing) plan.duplicateRows += 1;
      else plan.creatableRows += 1;
    });

    return plan;
  }

  function commitRows({ state, entityKey, rows, i18n }) {
    const summary = {
      eligible: canCommitTarget(entityKey),
      totalRows: 0,
      attemptedRows: 0,
      created: 0,
      updated: 0,
      duplicates: 0,
      failed: 0,
      skippedErrors: 0,
      warningRowsCommitted: 0,
      readyRowsCommitted: 0,
      results: []
    };

    if (!summary.eligible || !PracticeSavePipeline || typeof PracticeSavePipeline.buildRecord !== 'function' || !Utils) {
      return summary;
    }

    const basePractices = Array.isArray(state?.practices) ? state.practices : [];

    (Array.isArray(rows) ? rows : []).forEach((row) => {
      summary.totalRows += 1;
      const errors = Array.isArray(row.errors) ? row.errors : [];
      const warnings = Array.isArray(row.warnings) ? row.warnings : [];
      if (errors.length) {
        summary.skippedErrors += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'critical', outcome: 'skipped-error' });
        return;
      }

      const draft = row.draft && typeof row.draft === 'object'
        ? JSON.parse(JSON.stringify(row.draft))
        : null;
      if (!draft || !cleanText(draft.clientName) || !cleanText(draft.practiceDate)) {
        summary.skippedErrors += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'critical', outcome: 'skipped-empty' });
        return;
      }

      const existing = findExistingPractice(state, draft);
      if (existing) {
        summary.duplicates += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'attention', outcome: 'duplicate', value: existing.reference || draft.generatedReference || draft.clientName });
        return;
      }

      draft.generatedReference = buildReference(state, draft);
      summary.attemptedRows += 1;

      try {
        const built = PracticeSavePipeline.buildRecord({
          state,
          draft,
          getPracticeSchema: (practiceType) => PracticeSchemas && typeof PracticeSchemas.getSchema === 'function' ? PracticeSchemas.getSchema(practiceType) : null,
          buildDynamicLabelsForType: (practiceType) => buildDynamicLabelsForType(practiceType, i18n),
          normalizeSeaPortField: (practiceType, fieldName, rawValue) => normalizeSeaPortField(practiceType, fieldName, rawValue, state?.companyConfig),
          companyConfig: state?.companyConfig,
          practiceTypeLabel: (practiceType) => practiceTypeLabel(practiceType, i18n),
          buildCurrentPracticeReference: () => draft.generatedReference,
          nextPracticeId: Utils.nextPracticeId
        });
        if (!built || !built.record) throw new Error('record-not-built');
        basePractices.push(built.record);
        summary.created += 1;
        if (warnings.length) summary.warningRowsCommitted += 1;
        else summary.readyRowsCommitted += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: warnings.length ? 'attention' : 'ready', outcome: 'created', value: built.record.reference || draft.generatedReference });
      } catch (error) {
        summary.failed += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'critical', outcome: 'failed', value: draft.generatedReference || draft.clientName });
      }
    });

    state.practices = basePractices;
    return summary;
  }

  return {
    canCommitTarget,
    summarizePlannedCommit,
    commitRows
  };
})();
