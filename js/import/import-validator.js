window.KedrixOneImportValidator = (() => {
  'use strict';

  function cleanText(value) {
    return String(value || '').trim();
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function isLikelyEmail(value) {
    const clean = cleanText(value);
    if (!clean) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
  }

  function isLikelyVat(value) {
    const clean = cleanText(value).replace(/[^A-Z0-9]/gi, '');
    if (!clean) return true;
    return clean.length >= 8;
  }

  function validateRows(entityKey, rows, schema, i18n) {
    const issues = [];
    const keyIndex = new Map();
    const vatIndex = new Map();
    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;

    const inspectedRows = (Array.isArray(rows) ? rows : []).map((row) => {
      const errors = [];
      const warnings = [];
      const values = row.values || {};

      schema.forEach((field) => {
        if (field.required && !cleanText(values[field.name])) {
          errors.push(t(i18n, 'ui.importMissingRequiredField', 'Campo obbligatorio mancante') + `: ${field.label}`);
        }
      });

      if (!isLikelyEmail(values.email)) {
        warnings.push(t(i18n, 'ui.importInvalidEmailWarning', 'Email da verificare'));
      }
      if (!isLikelyVat(values.vatNumber)) {
        warnings.push(t(i18n, 'ui.importInvalidVatWarning', 'Partita IVA da verificare'));
      }

      const keyValue = cleanText(values.value || values.code || values.description).toUpperCase();
      if (keyValue) {
        if (keyIndex.has(keyValue)) {
          warnings.push(t(i18n, 'ui.importDuplicateUploadWarning', 'Possibile duplicato nello stesso file'));
        } else {
          keyIndex.set(keyValue, row.rowNumber);
        }
      }

      const vatValue = cleanText(values.vatNumber).replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (vatValue) {
        if (vatIndex.has(vatValue)) {
          warnings.push(t(i18n, 'ui.importDuplicateVatWarning', 'Partita IVA duplicata nello stesso file'));
        } else {
          vatIndex.set(vatValue, row.rowNumber);
        }
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
        errors,
        warnings,
        tone: errors.length ? 'critical' : (warnings.length ? 'attention' : 'ready')
      };
    });

    return {
      rows: inspectedRows,
      summary: {
        entityKey,
        totalRows: inspectedRows.length,
        validRows,
        warningRows,
        errorRows,
        mappedFields: schema.length
      },
      issues: issues.slice(0, 16)
    };
  }

  return {
    validateRows
  };
})();
