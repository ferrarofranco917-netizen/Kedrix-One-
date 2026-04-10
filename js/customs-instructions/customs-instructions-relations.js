window.KedrixOneCustomsInstructionsRelations = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;

  const FIELD_CONFIG = {
    customsOffice: {
      draftField: 'customsOffice',
      fallbackType: 'sea_import',
      suggestionKey: 'customsOffices',
      entityKey: 'customsOffice'
    },
    carrierCompany: {
      draftField: 'carrierCompany',
      fallbackType: 'sea_import',
      entityKey: 'carrier',
      suggestionByMode: {
        sea: 'shippingCompanies',
        air: 'airlines',
        road: 'carriers'
      }
    },
    incoterm: {
      draftField: 'incoterm',
      fallbackType: 'sea_import',
      optionSource: 'incoterms',
      entityKey: 'incoterm'
    }
  };

  function text(value) {
    return String(value || '').trim();
  }

  function normalize(value) {
    return text(value).toUpperCase();
  }

  function typeFromDraft(draft = {}) {
    const mode = text(draft.mode).toLowerCase();
    const direction = text(draft.direction).toLowerCase() || 'import';
    if (!mode) return 'sea_import';
    if (['sea', 'air', 'road'].includes(mode)) return `${mode}_${direction === 'export' ? 'export' : 'import'}`;
    return 'sea_import';
  }

  function fieldDefinition(fieldKey, draft = {}) {
    const base = FIELD_CONFIG[fieldKey];
    if (!base) return null;
    const suggestionKey = base.suggestionByMode ? base.suggestionByMode[text(draft.mode).toLowerCase()] || '' : base.suggestionKey || '';
    return {
      name: fieldKey,
      suggestionKey,
      optionSource: base.optionSource || ''
    };
  }

  function listOptions(fieldKey, draft = {}, companyConfig = null) {
    const definition = fieldDefinition(fieldKey, draft);
    if (!definition || !PracticeSchemas || typeof PracticeSchemas.getFieldOptionEntries !== 'function') return [];
    const type = typeFromDraft(draft);
    return PracticeSchemas.getFieldOptionEntries(type, definition, companyConfig)
      .map((entry) => ({
        value: text(entry.value),
        label: text(entry.label) || text(entry.value),
        displayValue: text(entry.displayValue) || text(entry.label) || text(entry.value),
        aliases: Array.isArray(entry.aliases) ? entry.aliases.map((alias) => text(alias)).filter(Boolean) : []
      }))
      .filter((entry) => entry.value);
  }

  function resolveOption(fieldKey, draft = {}, rawValue = '', companyConfig = null) {
    const clean = text(rawValue);
    if (!clean) return null;
    const upper = normalize(clean);
    return listOptions(fieldKey, draft, companyConfig).find((entry) => {
      const aliases = new Set([entry.value, entry.label, entry.displayValue, ...(entry.aliases || [])].map((item) => normalize(item)).filter(Boolean));
      return aliases.has(upper);
    }) || null;
  }

  function buildPayload(fieldKey, draft = {}, rawValue = '', companyConfig = null) {
    const clean = text(rawValue);
    const matched = resolveOption(fieldKey, draft, clean, companyConfig);
    if (!clean) {
      return {
        field: fieldKey,
        value: '',
        displayValue: '',
        source: '',
        entityKey: FIELD_CONFIG[fieldKey]?.entityKey || '',
        updatedAt: new Date().toISOString()
      };
    }
    if (matched) {
      return {
        field: fieldKey,
        value: matched.value,
        displayValue: matched.displayValue || matched.label || matched.value,
        source: 'controlled',
        entityKey: FIELD_CONFIG[fieldKey]?.entityKey || '',
        updatedAt: new Date().toISOString()
      };
    }
    return {
      field: fieldKey,
      value: clean,
      displayValue: clean,
      source: 'manual',
      entityKey: FIELD_CONFIG[fieldKey]?.entityKey || '',
      updatedAt: new Date().toISOString()
    };
  }

  function ensurePayloadShape(fieldKey, payload, fallbackValue = '') {
    if (!payload || typeof payload !== 'object') {
      return buildPayload(fieldKey, {}, fallbackValue, null);
    }
    return {
      field: fieldKey,
      value: text(payload.value || fallbackValue),
      displayValue: text(payload.displayValue || payload.value || fallbackValue),
      source: text(payload.source),
      entityKey: text(payload.entityKey || FIELD_CONFIG[fieldKey]?.entityKey || ''),
      updatedAt: text(payload.updatedAt || '')
    };
  }

  function ensureDraftRelations(draft = {}, companyConfig = null) {
    const next = draft;
    if (!next || typeof next !== 'object') return next;
    if (!next.relations || typeof next.relations !== 'object') next.relations = {};
    Object.keys(FIELD_CONFIG).forEach((fieldKey) => {
      const draftField = FIELD_CONFIG[fieldKey].draftField;
      const fallbackValue = text(next[draftField]);
      const existing = ensurePayloadShape(fieldKey, next.relations[fieldKey], fallbackValue);
      if (!existing.value && fallbackValue) {
        next.relations[fieldKey] = buildPayload(fieldKey, next, fallbackValue, companyConfig);
        return;
      }
      next.relations[fieldKey] = existing;
    });
    return next;
  }

  function applyFieldValue(draft = {}, fieldKey, value, companyConfig = null) {
    const next = draft;
    if (!next || typeof next !== 'object' || !FIELD_CONFIG[fieldKey]) return next;
    ensureDraftRelations(next, companyConfig);
    const payload = buildPayload(fieldKey, next, value, companyConfig);
    next[FIELD_CONFIG[fieldKey].draftField] = payload.value;
    next.relations[fieldKey] = payload;
    return next;
  }

  function relationMeta(draft = {}, fieldKey) {
    const payload = draft?.relations?.[fieldKey] || null;
    if (!payload || !text(payload.value)) return null;
    if (text(payload.source) === 'manual') {
      return { tone: 'default', kind: 'manual' };
    }
    return { tone: 'success', kind: 'controlled' };
  }

  return {
    ensureDraftRelations,
    applyFieldValue,
    listOptions,
    relationMeta
  };
})();
