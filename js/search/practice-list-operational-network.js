window.KedrixOnePracticeListOperationalNetwork = (() => {
  'use strict';

  const Utils = window.KedrixOneUtils || {
    normalize: (value) => String(value || '').trim().toUpperCase()
  };

  function normalize(value) {
    return Utils.normalize ? Utils.normalize(value) : String(value || '').trim().toUpperCase();
  }

  function extractDynamic(practice) {
    return practice && practice.dynamicData && typeof practice.dynamicData === 'object'
      ? practice.dynamicData
      : {};
  }

  function firstFilled() {
    for (const value of arguments) {
      if (Array.isArray(value) && value.length) return value;
      if (String(value || '').trim()) return value;
    }
    return '';
  }

  function extractNetworkValues(practice) {
    const dynamic = extractDynamic(practice);
    return {
      carrier: String(firstFilled(practice?.carrier, dynamic.carrier, practice?.company, dynamic.company)).trim(),
      customsOffice: String(firstFilled(practice?.customsOffice, dynamic.customsOffice, dynamic.customsOperator)).trim(),
      terminal: String(firstFilled(practice?.terminal, dynamic.terminal, practice?.terminalPickup, dynamic.terminalPickup, practice?.terminalDelivery, dynamic.terminalDelivery)).trim()
    };
  }

  function collect(practices = [], keyName) {
    const bucket = new Map();
    (Array.isArray(practices) ? practices : []).forEach((practice) => {
      const values = extractNetworkValues(practice);
      const label = String(values[keyName] || '').trim();
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

  function buildBreakdown(metrics = {}, keyName, limit = 5) {
    const primary = Array.isArray(metrics.primary) ? metrics.primary : [];
    const comparison = Array.isArray(metrics.comparison) ? metrics.comparison : [];
    const compareEnabled = Boolean(metrics.compareEnabled);
    const primaryMap = collect(primary, keyName);
    const comparisonMap = collect(comparison, keyName);
    return {
      rows: buildRows(primaryMap, comparisonMap, compareEnabled, limit),
      primaryDistinctCount: primaryMap.size,
      comparisonDistinctCount: comparisonMap.size,
      compareEnabled
    };
  }

  function buildOperationalNetworkBreakdowns(metrics = {}, limit = 5) {
    return {
      carrier: buildBreakdown(metrics, 'carrier', limit),
      customsOffice: buildBreakdown(metrics, 'customsOffice', limit),
      terminal: buildBreakdown(metrics, 'terminal', limit)
    };
  }

  return {
    buildOperationalNetworkBreakdowns
  };
})();
