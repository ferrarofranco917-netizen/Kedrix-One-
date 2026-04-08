window.KedrixOnePracticeListShippingProfiles = (() => {
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

  function extractShippingValues(practice) {
    const dynamic = extractDynamic(practice);
    const shippingCompany = String(firstFilled(
      practice?.shippingCompany,
      dynamic.shippingCompany,
      practice?.company,
      dynamic.company,
      practice?.shippingLine,
      dynamic.shippingLine
    )).trim();
    const vesselVoyage = String(firstFilled(
      practice?.vesselVoyage,
      dynamic.vesselVoyage,
      practice?.vessel,
      dynamic.vessel,
      dynamic.vesselTrip,
      practice?.voyage,
      dynamic.voyage
    )).trim();
    const seaProfile = [shippingCompany, vesselVoyage].filter(Boolean).join(' · ');
    return { shippingCompany, vesselVoyage, seaProfile };
  }

  function collect(practices = [], keyName) {
    const bucket = new Map();
    (Array.isArray(practices) ? practices : []).forEach((practice) => {
      const values = extractShippingValues(practice);
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

  function buildShippingProfileBreakdowns(metrics = {}, limit = 5) {
    return {
      shippingCompany: buildBreakdown(metrics, 'shippingCompany', limit),
      vesselVoyage: buildBreakdown(metrics, 'vesselVoyage', limit),
      seaProfile: buildBreakdown(metrics, 'seaProfile', limit)
    };
  }

  return {
    buildShippingProfileBreakdowns
  };
})();
