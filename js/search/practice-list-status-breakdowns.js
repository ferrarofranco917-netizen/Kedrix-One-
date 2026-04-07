window.KedrixOnePracticeListStatusBreakdowns = (() => {
  'use strict';

  const Analytics = window.KedrixOnePracticeListAnalytics || null;
  const Utils = window.KedrixOneUtils || {
    normalize: (value) => String(value || '').trim().toUpperCase()
  };

  const KNOWN_STATUS_ORDER = [
    'IN ATTESA DOCUMENTI',
    'OPERATIVA',
    'SDOGANAMENTO',
    'CHIUSA'
  ];

  function normalize(value) {
    return Utils.normalize ? Utils.normalize(value) : String(value || '').trim().toUpperCase();
  }

  function statusOf(practice) {
    if (Analytics && typeof Analytics.extractValues === 'function') {
      const extracted = Analytics.extractValues(practice);
      return String(extracted.status || '').trim();
    }
    return String(practice?.status || '').trim();
  }

  function collect(practices = []) {
    const bucket = new Map();
    (Array.isArray(practices) ? practices : []).forEach((practice) => {
      const status = statusOf(practice);
      const label = status || '—';
      const key = normalize(label || '—');
      const current = bucket.get(key) || { key, label, count: 0 };
      current.count += 1;
      bucket.set(key, current);
    });
    return bucket;
  }

  function orderWeight(key) {
    const knownIndex = KNOWN_STATUS_ORDER.indexOf(key);
    return knownIndex >= 0 ? knownIndex : KNOWN_STATUS_ORDER.length + 1;
  }

  function buildRows(primaryMap, comparisonMap, compareEnabled) {
    const keys = Array.from(new Set([...primaryMap.keys(), ...comparisonMap.keys()]));
    const rows = keys.map((key) => {
      const primary = primaryMap.get(key);
      const comparison = comparisonMap.get(key);
      const active = primary ? primary.count : 0;
      const compare = comparison ? comparison.count : 0;
      return {
        key,
        label: (primary && primary.label) || (comparison && comparison.label) || key,
        active,
        compare,
        delta: compareEnabled ? active - compare : null,
        totalWeight: active + compare,
        orderWeight: orderWeight(key)
      };
    });
    rows.sort((a, b) => {
      if (a.orderWeight != b.orderWeight) return a.orderWeight - b.orderWeight;
      if (b.totalWeight != a.totalWeight) return b.totalWeight - a.totalWeight;
      return a.label.localeCompare(b.label, 'it');
    });
    return rows;
  }

  function build(metrics = {}) {
    const primary = Array.isArray(metrics.primary) ? metrics.primary : [];
    const comparison = Array.isArray(metrics.comparison) ? metrics.comparison : [];
    const compareEnabled = Boolean(metrics.compareEnabled);
    const primaryMap = collect(primary);
    const comparisonMap = collect(comparison);
    const rows = buildRows(primaryMap, comparisonMap, compareEnabled);
    return {
      compareEnabled,
      primaryDistinctCount: primaryMap.size,
      comparisonDistinctCount: comparisonMap.size,
      rows,
      activeOpenCount: rows.filter((row) => normalize(row.key) !== 'CHIUSA').reduce((sum, row) => sum + Number(row.active || 0), 0),
      compareOpenCount: rows.filter((row) => normalize(row.key) !== 'CHIUSA').reduce((sum, row) => sum + Number(row.compare || 0), 0)
    };
  }

  return {
    build
  };
})();
