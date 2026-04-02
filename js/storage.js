window.KedrixOneStorage = (() => {
  'use strict';

  const KEY = 'kedrix-one.repo.complete';

  function normalizeExpandedModules(value) {
    return Array.isArray(value)
      ? value.filter((item) => typeof item === 'string' && item.trim())
      : [];
  }

  function normalizePracticeAttachmentIndex(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).map(([ownerKey, items]) => [
        String(ownerKey || '').trim(),
        Array.isArray(items) ? items.filter((item) => item && typeof item === 'object') : []
      ]).filter(([ownerKey]) => ownerKey)
    );
  }

  function load(fallbackFactory) {
    const fallback = fallbackFactory();

    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fallback;

      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.practices)) return fallback;

      return {
        ...fallback,
        ...parsed,
        practices: Array.isArray(parsed.practices) ? parsed.practices : fallback.practices,
        operatorLogs: Array.isArray(parsed.operatorLogs) ? parsed.operatorLogs : fallback.operatorLogs,
        contacts: Array.isArray(parsed.contacts) ? parsed.contacts : fallback.contacts,
        expandedModules: normalizeExpandedModules(parsed.expandedModules),
        practiceAttachmentIndex: normalizePracticeAttachmentIndex(parsed.practiceAttachmentIndex)
      };
    } catch {
      return fallback;
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  return { load, save, reset, key: KEY };
})();
