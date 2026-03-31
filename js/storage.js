window.KedrixOneStorage = (() => {
  'use strict';

  const KEY = 'kedrix-one.repo.complete';

  function load(fallbackFactory) {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fallbackFactory();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.practices)) return fallbackFactory();
      return parsed;
    } catch {
      return fallbackFactory();
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
