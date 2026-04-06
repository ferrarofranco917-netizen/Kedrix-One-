window.KedrixOneImportDocumentReferenceCommit = (() => {
  'use strict';

  const Validator = window.KedrixOneImportDocumentReferenceValidator || null;

  function cleanText(value) {
    return String(value || '').trim();
  }

  function ensureIndex(state) {
    if (!state.practiceDocumentReferenceIndex || typeof state.practiceDocumentReferenceIndex !== 'object' || Array.isArray(state.practiceDocumentReferenceIndex)) {
      state.practiceDocumentReferenceIndex = {};
    }
    return state.practiceDocumentReferenceIndex;
  }

  function nextId(state) {
    const index = ensureIndex(state);
    const total = Object.values(index).reduce((acc, items) => acc + ((Array.isArray(items) ? items.length : 0)), 0);
    return `DOCREF-${String(total + 1).padStart(5, '0')}`;
  }

  function summarizePlannedCommit({ state, rows }) {
    const summary = {
      eligible: true,
      totalRows: 0,
      blockedRows: 0,
      warningRows: 0,
      readyRows: 0,
      creatableRows: 0,
      duplicateRows: 0
    };

    (Array.isArray(rows) ? rows : []).forEach((row) => {
      summary.totalRows += 1;
      const errors = Array.isArray(row.errors) ? row.errors : [];
      const warnings = Array.isArray(row.warnings) ? row.warnings : [];
      if (errors.length) {
        summary.blockedRows += 1;
        return;
      }
      const duplicate = warnings.some((message) => /duplicat|presente/i.test(String(message || '')));
      if (duplicate) summary.duplicateRows += 1;
      else summary.creatableRows += 1;
      if (warnings.length) summary.warningRows += 1;
      else summary.readyRows += 1;
    });

    return summary;
  }

  function commitRows({ state, rows }) {
    const summary = {
      eligible: true,
      totalRows: 0,
      attemptedRows: 0,
      created: 0,
      duplicates: 0,
      failed: 0,
      skippedErrors: 0,
      warningRowsCommitted: 0,
      readyRowsCommitted: 0,
      results: []
    };

    const index = ensureIndex(state);

    (Array.isArray(rows) ? rows : []).forEach((row) => {
      summary.totalRows += 1;
      const errors = Array.isArray(row.errors) ? row.errors : [];
      const warnings = Array.isArray(row.warnings) ? row.warnings : [];
      if (errors.length) {
        summary.skippedErrors += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'critical', outcome: 'skipped-error' });
        return;
      }

      const duplicate = warnings.some((message) => /duplicat|presente/i.test(String(message || '')));
      if (duplicate) {
        summary.duplicates += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'attention', outcome: 'duplicate', value: row.draft?.externalReference || row.draft?.documentLabel || row.draft?.practiceReference || '—' });
        return;
      }

      const ownerKey = cleanText(row.draft?.ownerKey || row.practice?.attachmentOwnerKey || row.practice?.id);
      if (!ownerKey) {
        summary.failed += 1;
        summary.results.push({ rowNumber: row.rowNumber, tone: 'critical', outcome: 'failed' });
        return;
      }

      const entry = {
        id: nextId(state),
        practiceId: cleanText(row.draft?.practiceId),
        ownerKey,
        documentType: cleanText(row.draft?.documentType),
        documentLabel: cleanText(row.draft?.documentLabel),
        documentDate: cleanText(row.draft?.documentDate),
        externalReference: cleanText(row.draft?.externalReference),
        customsMrn: cleanText(row.draft?.customsMrn),
        tags: Array.isArray(row.draft?.tags) ? row.draft.tags.slice() : [],
        notes: cleanText(row.draft?.notes),
        importedAt: new Date().toISOString(),
        source: 'reference-import'
      };

      if (!Array.isArray(index[ownerKey])) index[ownerKey] = [];
      index[ownerKey].push(entry);
      summary.attemptedRows += 1;
      summary.created += 1;
      if (warnings.length) summary.warningRowsCommitted += 1;
      else summary.readyRowsCommitted += 1;
      summary.results.push({ rowNumber: row.rowNumber, tone: warnings.length ? 'attention' : 'ready', outcome: 'created', value: entry.externalReference || entry.documentLabel || entry.documentType });
    });

    return summary;
  }

  return {
    summarizePlannedCommit,
    commitRows,
    ensureIndex
  };
})();
