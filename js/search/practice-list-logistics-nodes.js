window.KedrixOnePracticeListLogisticsNodes = (() => {
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
    const dynamic = practice && practice.dynamicData && typeof practice.dynamicData === 'object' ? practice.dynamicData : {};
    return {
      origin: String(practice?.origin || dynamic.origin || practice?.portLoading || dynamic.portLoading || '').trim(),
      destination: String(practice?.destination || dynamic.destination || practice?.port || dynamic.port || '').trim()
    };
  }

  function collect(practices = [], fieldName) {
    const bucket = new Map();
    (Array.isArray(practices) ? practices : []).forEach((practice) => {
      const values = extractValues(practice);
      const label = String(values[fieldName] || '').trim();
      if (!label) return;
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

  function buildNodeBreakdown(fieldName, metrics = {}, limit = 5) {
    const primary = Array.isArray(metrics.primary) ? metrics.primary : [];
    const comparison = Array.isArray(metrics.comparison) ? metrics.comparison : [];
    const compareEnabled = Boolean(metrics.compareEnabled);
    const primaryMap = collect(primary, fieldName);
    const comparisonMap = collect(comparison, fieldName);
    return {
      rows: buildRows(primaryMap, comparisonMap, compareEnabled, limit),
      primaryDistinctCount: primaryMap.size,
      comparisonDistinctCount: comparisonMap.size,
      compareEnabled
    };
  }

  function buildNodeBreakdowns(metrics = {}, limit = 5) {
    return {
      origin: buildNodeBreakdown('origin', metrics, limit),
      destination: buildNodeBreakdown('destination', metrics, limit)
    };
  }

  return {
    buildNodeBreakdowns
  };
})();
