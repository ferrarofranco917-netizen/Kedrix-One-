window.KedrixOnePracticeListTopClients = (() => {
  'use strict';

  const Analytics = window.KedrixOnePracticeListAnalytics || null;
  const Utils = window.KedrixOneUtils || {
    normalize: (value) => String(value || '').trim().toUpperCase()
  };

  function normalize(value) {
    return Utils.normalize ? Utils.normalize(value) : String(value || '').trim().toUpperCase();
  }

  function extractValues(practice) {
    if (Analytics && typeof Analytics.extractValues === 'function') return Analytics.extractValues(practice);
    return {
      client: String(practice?.clientName || practice?.client || '').trim(),
      direction: String(practice?.practiceType || '').toLowerCase().includes('export')
        ? 'export'
        : String(practice?.practiceType || '').toLowerCase().includes('warehouse')
          ? 'warehouse'
          : 'import'
    };
  }

  function collect(practices = [], direction = 'all') {
    const bucket = new Map();
    (Array.isArray(practices) ? practices : []).forEach((practice) => {
      const values = extractValues(practice);
      const label = String(values.client || '').trim();
      if (!label) return;
      if (direction !== 'all' && String(values.direction || '').toLowerCase() !== direction) return;
      const key = normalize(label);
      const current = bucket.get(key) || { key, label, count: 0 };
      current.count += 1;
      if (label.length > current.label.length) current.label = label;
      bucket.set(key, current);
    });
    return bucket;
  }

  function buildRows(primaryMap, comparisonMap, compareEnabled, limit = 5) {
    const keys = Array.from(new Set([...primaryMap.keys(), ...comparisonMap.keys()]));
    const rows = keys.map((key) => {
      const primary = primaryMap.get(key);
      const comparison = comparisonMap.get(key);
      const primaryCount = primary ? primary.count : 0;
      const comparisonCount = comparison ? comparison.count : 0;
      return {
        key,
        label: (primary && primary.label) || (comparison && comparison.label) || key,
        primaryCount,
        comparisonCount,
        deltaCount: compareEnabled ? primaryCount - comparisonCount : null,
        totalWeight: primaryCount + comparisonCount
      };
    });
    rows.sort((a, b) => {
      if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight;
      if (b.primaryCount !== a.primaryCount) return b.primaryCount - a.primaryCount;
      return a.label.localeCompare(b.label, 'it');
    });
    return rows.slice(0, limit);
  }

  function buildBreakdown(metrics = {}, direction = 'all', limit = 5) {
    const primary = Array.isArray(metrics.primary) ? metrics.primary : [];
    const comparison = Array.isArray(metrics.comparison) ? metrics.comparison : [];
    const compareEnabled = Boolean(metrics.compareEnabled);
    const primaryMap = collect(primary, direction);
    const comparisonMap = collect(comparison, direction);
    return {
      rows: buildRows(primaryMap, comparisonMap, compareEnabled, limit),
      primaryDistinctCount: primaryMap.size,
      comparisonDistinctCount: comparisonMap.size,
      compareEnabled
    };
  }

  function buildTopClientBreakdowns(metrics = {}, limit = 5) {
    return {
      all: buildBreakdown(metrics, 'all', limit),
      import: buildBreakdown(metrics, 'import', limit),
      export: buildBreakdown(metrics, 'export', limit)
    };
  }

  return {
    buildTopClientBreakdowns
  };
})();
