window.KedrixOnePracticeReferenceNormalizer = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas;

  function cleanText(value) {
    return String(value || '').trim();
  }

  function normalizeFieldValue(practiceType, fieldName, rawValue, companyConfig) {
    const clean = cleanText(rawValue);
    if (!clean || !PracticeSchemas || typeof PracticeSchemas.getField !== 'function' || typeof PracticeSchemas.normalizeSuggestedValue !== 'function') {
      return clean;
    }
    const field = PracticeSchemas.getField(practiceType, fieldName);
    if (!field) return clean;
    return PracticeSchemas.normalizeSuggestedValue(practiceType, field, clean, companyConfig);
  }

  function getReferenceFieldNames(practiceType) {
    const type = cleanText(practiceType).toLowerCase();
    if (type.startsWith('sea_')) return ['portLoading', 'portDischarge', 'customsOffice'];
    if (type.startsWith('air_')) return ['airportDeparture', 'airportDestination', 'customsOffice'];
    if (type === 'warehouse') return ['customsOffice'];
    return [];
  }

  function normalizeDynamicData(practiceType, dynamicData, companyConfig) {
    const next = { ...(dynamicData || {}) };
    getReferenceFieldNames(practiceType).forEach((fieldName) => {
      if (!Object.prototype.hasOwnProperty.call(next, fieldName)) return;
      const normalized = normalizeFieldValue(practiceType, fieldName, next[fieldName], companyConfig);
      if (normalized) next[fieldName] = normalized;
    });
    return next;
  }

  function normalizeDraftReferences(draft, companyConfig) {
    if (!draft || typeof draft !== 'object') return draft;
    draft.dynamicData = normalizeDynamicData(draft.practiceType || '', draft.dynamicData || {}, companyConfig);
    return draft;
  }

  return {
    getReferenceFieldNames,
    normalizeDraftReferences,
    normalizeDynamicData,
    normalizeFieldValue
  };
})();
