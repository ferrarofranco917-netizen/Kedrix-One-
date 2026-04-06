window.KedrixOneImportLogisticsCommit = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const ELIGIBLE_TARGETS = ['seaPort', 'airport', 'terminal', 'origin', 'destination', 'logisticsLocation', 'deposit', 'warehouseLink', 'transportUnitType'];

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanUpper(value) {
    return cleanText(value).toUpperCase();
  }

  function canCommitTarget(entityKey) {
    return ELIGIBLE_TARGETS.includes(cleanText(entityKey));
  }

  function buildPayload(values = {}) {
    return {
      id: cleanText(values.id || ''),
      value: cleanText(values.value || values.name || values.code || ''),
      description: cleanText(values.description || values.code || ''),
      city: cleanText(values.city || '')
    };
  }

  function findExisting(state, entityKey, payload) {
    if (!MasterDataEntities || typeof MasterDataEntities.listEntityRecords !== 'function') return null;
    const candidate = cleanUpper(payload.value || '');
    if (!candidate) return null;
    const records = MasterDataEntities.listEntityRecords(state, entityKey);
    return (Array.isArray(records) ? records : []).find((entry) => cleanUpper(entry && entry.value ? entry.value : '') == candidate)?.record || null;
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
      const payload = buildPayload(row.values || {});
      if (!cleanText(payload.value)) {
        plan.blockedRows += 1;
        return;
      }
      const existing = findExisting(state, entityKey, payload);
      if (existing) plan.duplicateRows += 1;
      else plan.creatableRows += 1;
    });

    return plan;
  }

  function commitRows({ state, entityKey, rows }) {
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

    if (!summary.eligible || !MasterDataEntities || typeof MasterDataEntities.saveDirectoryEntity !== 'function') return summary;

    (Array.isArray(rows) ? rows : []).forEach((row) => {
      summary.totalRows += 1;
      const errors = Array.isArray(row.errors) ? row.errors : [];
      const warnings = Array.isArray(row.warnings) ? row.warnings : [];
      if (errors.length) {
        summary.skippedErrors += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'critical', outcome: 'skipped-error' });
        return;
      }
      const payload = buildPayload(row.values || {});
      if (!cleanText(payload.value)) {
        summary.skippedErrors += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'critical', outcome: 'skipped-empty' });
        return;
      }
      summary.attemptedRows += 1;
      const result = MasterDataEntities.saveDirectoryEntity(state, entityKey, payload);
      if (result && result.created) {
        summary.created += 1;
        if (warnings.length) summary.warningRowsCommitted += 1;
        else summary.readyRowsCommitted += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: warnings.length ? 'attention' : 'ready', outcome: 'created', value: result.value || payload.value });
        return;
      }
      if (result && result.updated) {
        summary.updated += 1;
        if (warnings.length) summary.warningRowsCommitted += 1;
        else summary.readyRowsCommitted += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: warnings.length ? 'attention' : 'ready', outcome: 'updated', value: result.value || payload.value });
        return;
      }
      if (result && result.duplicate) {
        summary.duplicates += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'attention', outcome: 'duplicate', value: result.value || payload.value });
        return;
      }
      summary.failed += 1;
      summary.results.push({ rowNumber: row.rowNumber, tone: 'critical', outcome: 'failed', value: payload.value });
    });

    return summary;
  }

  return {
    canCommitTarget,
    summarizePlannedCommit,
    commitRows
  };
})();
