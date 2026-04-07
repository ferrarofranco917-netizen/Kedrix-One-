window.KedrixOnePracticePersistence = (() => {
  'use strict';

  function persistIdentity(options = {}) {
    const {
      draft,
      practiceType,
      clientName,
      clientId,
      practiceDate,
      category,
      practiceStatus,
      generatedReference,
      buildCurrentPracticeReference,
      save,
      updateVerificationBannerState,
      refreshValidation,
      resolveCategoryOptions,
      defaultStatus = 'In attesa documenti'
    } = options;

    if (!draft) return null;

    const nextPracticeType = practiceType?.value || draft.practiceType || '';
    const nextCategoryValue = String(category?.value || '').trim();
    const allowedCategories = typeof resolveCategoryOptions === 'function'
      ? resolveCategoryOptions(nextPracticeType)
      : [];

    draft.practiceType = nextPracticeType;
    draft.clientName = clientName?.value || '';
    draft.clientId = clientId?.value || '';
    draft.practiceDate = practiceDate?.value || new Date().toISOString().slice(0, 10);
    if (nextCategoryValue) {
      draft.category = nextCategoryValue;
    } else if (!String(draft.category || '').trim()) {
      draft.category = '';
    } else if (Array.isArray(allowedCategories) && allowedCategories.length && !allowedCategories.includes(draft.category)) {
      draft.category = '';
    }
    if (category && draft.category && category.value !== draft.category) category.value = draft.category;
    draft.status = practiceStatus?.value || defaultStatus;
    draft.generatedReference = draft.practiceType && typeof buildCurrentPracticeReference === 'function'
      ? buildCurrentPracticeReference()
      : '';

    if (generatedReference) generatedReference.value = draft.generatedReference;
    if (typeof save === 'function') save();
    if (typeof updateVerificationBannerState === 'function') updateVerificationBannerState(draft);
    if (typeof refreshValidation === 'function') refreshValidation();
    return draft;
  }

  function readNodeValue(node, scopeRoot) {
    if (!node) return '';
    if (node.type === 'checkbox') {
      const root = scopeRoot || node.closest('form') || document;
      return Array.from(root.querySelectorAll(`[name="${node.name}"]:checked`)).map((item) => item.value);
    }
    return node.value;
  }

  function persistDynamicField(options = {}) {
    const {
      draft,
      node,
      scopeRoot,
      normalizeValue,
      save,
      updateVerificationBannerState
    } = options;

    if (!draft || !node || !node.name) return draft;

    const rawValue = readNodeValue(node, scopeRoot);
    const nextValue = typeof normalizeValue === 'function'
      ? normalizeValue(node.name, rawValue, node)
      : rawValue;

    if (!draft.dynamicData || typeof draft.dynamicData !== 'object') draft.dynamicData = {};
    draft.dynamicData[node.name] = nextValue;

    if (typeof save === 'function') save();
    if (typeof updateVerificationBannerState === 'function') updateVerificationBannerState(draft);
    return draft;
  }

  function bindDynamicFieldPersistence(options = {}) {
    const {
      root,
      draft,
      normalizeValue,
      save,
      updateVerificationBannerState
    } = options;

    if (!root || !draft) return;

    root.querySelectorAll('[name]').forEach((node) => {
      if (node.dataset.practicePersistenceBound === '1') return;
      node.dataset.practicePersistenceBound = '1';

      const persist = (shouldNormalize = false) => persistDynamicField({
        draft,
        node,
        scopeRoot: root,
        normalizeValue: shouldNormalize ? normalizeValue : undefined,
        save,
        updateVerificationBannerState
      });

      node.addEventListener('input', () => persist(false));
      node.addEventListener('change', () => persist(true));
      node.addEventListener('blur', () => persist(true));
    });
  }

  return {
    bindDynamicFieldPersistence,
    persistDynamicField,
    persistIdentity,
    readNodeValue
  };
})();
