window.KedrixOneCustomsInstructionsRelations = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;
  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

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
    const inheritedValue = text(draft?.inheritedRelations?.[fieldKey]);
    const inherited = inheritedValue && normalize(inheritedValue) === normalize(clean);
    const entityKey = FIELD_CONFIG[fieldKey]?.entityKey || '';
    const linkedEntity = resolveLinkedEntity(fieldKey, draft, clean, matched, companyConfig);
    if (!clean) {
      return {
        field: fieldKey,
        value: '',
        displayValue: '',
        source: '',
        sourceMode: '',
        relationId: '',
        entityKey,
        linkedEntity: null,
        updatedAt: new Date().toISOString()
      };
    }
    if (linkedEntity) {
      return {
        field: fieldKey,
        value: linkedEntity.value,
        displayValue: linkedEntity.displayValue || linkedEntity.value,
        source: inherited ? 'inherited' : 'linked',
        sourceMode: inherited ? 'inherited' : 'linked',
        relationId: linkedEntity.recordId || linkedEntity.value || '',
        entityKey,
        linkedEntity,
        updatedAt: new Date().toISOString()
      };
    }
    if (matched) {
      return {
        field: fieldKey,
        value: matched.value,
        displayValue: matched.displayValue || matched.label || matched.value,
        source: inherited ? 'inherited' : 'linked',
        sourceMode: inherited ? 'inherited' : 'linked',
        relationId: matched.value,
        entityKey,
        linkedEntity: buildDirectorySnapshot(fieldKey, matched),
        updatedAt: new Date().toISOString()
      };
    }
    return {
      field: fieldKey,
      value: clean,
      displayValue: clean,
      source: 'manual',
      sourceMode: inherited ? 'inherited-manual' : 'manual',
      relationId: '',
      entityKey,
      linkedEntity: null,
      updatedAt: new Date().toISOString()
    };
  }

  function resolveCarrierEntityKey(draft = {}) {
    const mode = text(draft.mode).toLowerCase();
    if (mode === 'sea') return 'shippingCompany';
    if (mode === 'air') return 'airline';
    return 'carrier';
  }

  function sanitizeSnapshot(raw = {}, fallback = {}) {
    return {
      fieldName: text(raw.fieldName || fallback.fieldName),
      entityKey: text(raw.entityKey || fallback.entityKey),
      recordId: text(raw.recordId || raw.entityId || raw.id || fallback.recordId),
      value: text(raw.value || raw.name || raw.label || fallback.value),
      displayValue: text(raw.displayValue || fallback.displayValue || raw.value || raw.name || ''),
      city: text(raw.city || fallback.city),
      vatNumber: text(raw.vatNumber || fallback.vatNumber),
      code: text(raw.code || fallback.code),
      taxCode: text(raw.taxCode || fallback.taxCode),
      description: text(raw.description || fallback.description),
      country: text(raw.country || fallback.country),
      shortName: text(raw.shortName || fallback.shortName),
      active: raw.active !== false
    };
  }

  function buildDirectorySnapshot(fieldKey, matched) {
    const value = text(matched?.value);
    if (!value) return null;
    return sanitizeSnapshot({
      fieldName: fieldKey,
      entityKey: FIELD_CONFIG[fieldKey]?.entityKey || '',
      recordId: value,
      value,
      displayValue: text(matched?.displayValue || matched?.label || value),
      code: text(matched?.code || ''),
      description: text(matched?.label || '')
    }, { fieldName: fieldKey });
  }

  function resolveLinkedEntity(fieldKey, draft = {}, cleanValue = '', matched = null, companyConfig = null) {
    if (!MasterDataEntities || typeof MasterDataEntities.findStructuredEntityRecordByValue !== 'function') return null;
    const entityKey = fieldKey === 'carrierCompany' ? resolveCarrierEntityKey(draft) : FIELD_CONFIG[fieldKey]?.entityKey || '';
    if (!entityKey) return null;
    const lookupValue = cleanValue || text(matched?.value || '');
    if (!lookupValue) return null;
    const linkedRecord = MasterDataEntities.findStructuredEntityRecordByValue(companyConfig || {}, entityKey, lookupValue);
    if (!linkedRecord) return null;
    return sanitizeSnapshot({
      fieldName: fieldKey,
      entityKey,
      recordId: linkedRecord.id || '',
      value: linkedRecord.name || lookupValue,
      displayValue: linkedRecord.displayValue || linkedRecord.name || lookupValue,
      city: linkedRecord.city || '',
      vatNumber: linkedRecord.vatNumber || '',
      code: linkedRecord.code || '',
      taxCode: linkedRecord.taxCode || '',
      country: linkedRecord.country || '',
      shortName: linkedRecord.shortName || '',
      active: linkedRecord.active !== false
    }, { fieldName: fieldKey, entityKey });
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
      sourceMode: text(payload.sourceMode || payload.source),
      relationId: text(payload.relationId || payload.linkedEntityId || payload.entityId || ''),
      entityKey: text(payload.entityKey || FIELD_CONFIG[fieldKey]?.entityKey || ''),
      linkedEntity: payload.linkedEntity && typeof payload.linkedEntity === 'object'
        ? sanitizeSnapshot(payload.linkedEntity, { fieldName: fieldKey, entityKey: payload.entityKey || FIELD_CONFIG[fieldKey]?.entityKey || '', value: payload.value || fallbackValue, recordId: payload.relationId || '' })
        : null,
      updatedAt: text(payload.updatedAt || '')
    };
  }

  function ensureDraftLinkedEntities(draft = {}) {
    if (!draft || typeof draft !== 'object') return {};
    if (!draft.linkedEntities || typeof draft.linkedEntities !== 'object' || Array.isArray(draft.linkedEntities)) draft.linkedEntities = {};
    return draft.linkedEntities;
  }

  function syncLinkedEntities(draft = {}) {
    const linkedEntities = ensureDraftLinkedEntities(draft);
    Object.keys(FIELD_CONFIG).forEach((fieldKey) => {
      const payload = ensurePayloadShape(fieldKey, draft?.relations?.[fieldKey], draft?.[FIELD_CONFIG[fieldKey].draftField]);
      const linked = payload.linkedEntity && text(payload.linkedEntity.value)
        ? sanitizeSnapshot(payload.linkedEntity, { fieldName: fieldKey, entityKey: payload.entityKey, value: payload.value, displayValue: payload.displayValue, recordId: payload.relationId })
        : null;
      if (linked) linkedEntities[fieldKey] = linked;
      else delete linkedEntities[fieldKey];
    });
  }

  function normalizeCustomsSectionForOffice(draft = {}, fieldKey, payload) {
    if (fieldKey !== 'customsOffice') return;
    const section = text(draft.customsSection);
    const inheritedSection = text(draft?.inheritedRelations?.customsSection);
    if (section && normalize(section) !== normalize(inheritedSection || '')) return;
    if (!text(payload?.value)) {
      draft.customsSection = inheritedSection || '';
      return;
    }
    const next = text(draft.direction).toLowerCase() === 'export' ? 'Export' : 'Import';
    draft.customsSection = next;
  }

  function ensureDraftRelations(draft = {}, companyConfig = null) {
    const next = draft;
    if (!next || typeof next !== 'object') return next;
    if (!next.relations || typeof next.relations !== 'object') next.relations = {};
    ensureDraftLinkedEntities(next);
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
    syncLinkedEntities(next);
    return next;
  }

  function applyFieldValue(draft = {}, fieldKey, value, companyConfig = null) {
    const next = draft;
    if (!next || typeof next !== 'object' || !FIELD_CONFIG[fieldKey]) return next;
    ensureDraftRelations(next, companyConfig);
    const payload = buildPayload(fieldKey, next, value, companyConfig);
    next[FIELD_CONFIG[fieldKey].draftField] = payload.value;
    next.relations[fieldKey] = payload;
    normalizeCustomsSectionForOffice(next, fieldKey, payload);
    syncLinkedEntities(next);
    return next;
  }

  function relationMeta(draft = {}, fieldKey) {
    const payload = draft?.relations?.[fieldKey] || null;
    if (!payload || !text(payload.value)) return null;
    if (text(payload.source) === 'manual') {
      return { tone: 'default', kind: 'manual' };
    }
    if (text(payload.source) === 'inherited') return { tone: 'muted', kind: 'inherited' };
    return { tone: 'success', kind: 'linked' };
  }

  function customsSectionSuggestions(draft = {}) {
    const base = ['Import', 'Export', 'Transito'];
    const officePayload = ensurePayloadShape('customsOffice', draft?.relations?.customsOffice, draft?.customsOffice || '');
    const detail = normalize(text(officePayload?.displayValue || officePayload?.value));
    if (detail.includes('PORTO')) base.push('Porto');
    if (detail.includes('AEROPORTO')) base.push('Aeroporto');
    if (detail.includes('OPERATIVA')) base.push('Operativa');
    return Array.from(new Set(base));
  }

  return {
    ensureDraftRelations,
    applyFieldValue,
    listOptions,
    relationMeta,
    customsSectionSuggestions
  };
})();
