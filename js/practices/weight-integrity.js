window.KedrixOnePracticeWeightIntegrity = (() => {
  'use strict';

  let preSaveHookRegistered = false;

  function parseNumber(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const normalized = String(value).replace(',', '.').trim();
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function isMeasureTabRelevant(practiceType) {
    return Boolean(String(practiceType || '').trim());
  }

  function analyzeWeights(draft) {
    const grossWeight = parseNumber(draft?.dynamicData?.grossWeight);
    const netWeight = parseNumber(draft?.dynamicData?.netWeight);
    const present = grossWeight !== null || netWeight !== null;
    const comparable = grossWeight !== null && netWeight !== null;
    const valid = !comparable || netWeight <= grossWeight;
    return {
      present,
      comparable,
      valid,
      grossWeight,
      netWeight,
      difference: comparable ? netWeight - grossWeight : null
    };
  }

  function buildValidationErrors(context = {}) {
    const { draft, i18n } = context;
    if (!isMeasureTabRelevant(draft?.practiceType || '')) return [];
    const analysis = analyzeWeights(draft);
    if (!analysis.comparable || analysis.valid) return [];

    const message = typeof i18n?.t === 'function'
      ? i18n.t('ui.validationNetWeightExceedsGross', 'Il peso netto non può superare il peso lordo.')
      : 'Il peso netto non può superare il peso lordo.';

    return [{
      field: 'netWeight',
      tab: 'detail',
      label: typeof i18n?.t === 'function' ? i18n.t('ui.netWeight', 'Peso netto') : 'Peso netto',
      message
    }];
  }

  function clearFieldState(root) {
    ['grossWeight', 'netWeight'].forEach((fieldName) => {
      const wrap = root?.querySelector?.(`[data-field-wrap="${fieldName}"]`);
      if (!wrap) return;
      wrap.classList.remove('is-warning');
      wrap.querySelectorAll('.field-note[data-field-note="weight-integrity"]').forEach((node) => node.remove());
    });
  }

  function applyFieldState(context = {}) {
    const { root, draft, i18n } = context;
    clearFieldState(root);
    const analysis = analyzeWeights(draft);
    if (!analysis.comparable || analysis.valid) return analysis;

    const message = typeof i18n?.t === 'function'
      ? i18n.t('ui.weightNetWarning', 'Controlla i pesi: il peso netto non può superare il peso lordo.')
      : 'Controlla i pesi: il peso netto non può superare il peso lordo.';

    ['grossWeight', 'netWeight'].forEach((fieldName) => {
      const wrap = root?.querySelector?.(`[data-field-wrap="${fieldName}"]`);
      if (!wrap) return;
      wrap.classList.add('is-warning');
      const node = document.createElement('div');
      node.className = 'field-note field-warning';
      node.dataset.fieldNote = 'weight-integrity';
      node.textContent = message;
      wrap.appendChild(node);
    });

    return analysis;
  }

  function registerPreSaveHook(savePipeline, i18n) {
    if (preSaveHookRegistered) return true;
    if (!savePipeline || typeof savePipeline.registerPreSaveHook !== 'function') return false;
    savePipeline.registerPreSaveHook((context = {}) => {
      const errors = buildValidationErrors({ draft: context.draft, i18n });
      return errors.length ? { valid: false, errors } : { valid: true };
    });
    preSaveHookRegistered = true;
    return true;
  }

  return {
    analyzeWeights,
    applyFieldState,
    buildValidationErrors,
    registerPreSaveHook
  };
})();
