window.KedrixOneDensitySystem = (() => {
  'use strict';

  const DENSITIES = ['compact', 'medium', 'wide', 'full'];

  function normalize(value, fallback = 'medium') {
    const clean = String(value || '').trim().toLowerCase();
    if (DENSITIES.includes(clean)) return clean;
    return DENSITIES.includes(fallback) ? fallback : 'medium';
  }

  function resolve(value, options = {}) {
    if (options.full) return 'full';
    return normalize(value, options.fallback || 'medium');
  }

  function className(value, options = {}) {
    return `density-${resolve(value, options)}`;
  }

  function append(baseClass, value, options = {}) {
    const base = String(baseClass || '').trim();
    return [base, className(value, options)].filter(Boolean).join(' ');
  }

  return {
    DENSITIES,
    normalize,
    resolve,
    className,
    append
  };
})();
