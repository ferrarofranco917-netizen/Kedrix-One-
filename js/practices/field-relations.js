window.KedrixOnePracticeFieldRelations = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas;
  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

  const relationalSuggestionKeys = new Set([
    'importers',
    'consignees',
    'shippers',
    'vessels',
    'taricCodes',
    'customsOffices',
    'originDirectories',
    'destinationDirectories',
    'articleCodes',
    'shippingCompanies',
    'airlines',
    'carriers',
    'transportUnitTypes'
  ]);

  function text(source, fallback = '') {
    if (source === null || source === undefined) return String(fallback || '').trim();
    if (typeof source === 'string' || typeof source === 'number' || typeof source === 'boolean') return String(source).trim();
    if (Array.isArray(source)) {
      for (const item of source) {
        const resolved = text(item, '');
        if (resolved) return resolved;
      }
      return String(fallback || '').trim();
    }
    if (typeof source === 'object') {
      const candidates = [source.displayValue, source.label, source.value, source.code, source.city, source.name, source.id];
      for (const candidate of candidates) {
        const resolved = text(candidate, '');
        if (resolved) return resolved;
      }
    }
    return String(fallback || '').trim();
  }

  function normalize(value) {
    return String(value || '').trim().toUpperCase();
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function isRelationalField(field) {
    if (!field || typeof field !== 'object') return false;
    if (field.type === 'derived' && field.name === 'client') return true;
    return Boolean(field.suggestionKey && relationalSuggestionKeys.has(field.suggestionKey));
  }

  function matchEntry(type, field, rawValue, companyConfig) {
    if (!field || !field.suggestionKey || !PracticeSchemas || typeof PracticeSchemas.getFieldOptionEntries !== 'function') return null;
    const clean = normalize(rawValue);
    if (!clean) return null;
    const entries = PracticeSchemas.getFieldOptionEntries(type, field, companyConfig);
    return entries.find((entry) => (entry.aliases || []).some((alias) => normalize(alias) === clean)) || null;
  }

  function linkedStructuredRecord(state, draft, field) {
    if (!MasterDataEntities || typeof MasterDataEntities.getLinkedRecordFromDraft !== 'function') return null;
    return MasterDataEntities.getLinkedRecordFromDraft({ state, draft, fieldName: field?.type === 'derived' ? 'clientName' : field?.name }) || null;
  }

  function linkedDetail(record) {
    if (!record || typeof record !== 'object') return '';
    return record.displayValue || [record.name, record.city, record.vatNumber].filter(Boolean).join(' · ') || record.name || '';
  }

  function getFieldRelationMeta(options = {}) {
    const { state = null, type = '', field = null, draft = {}, companyConfig = null, i18n = null } = options;
    if (!isRelationalField(field)) return null;

    if (field.type === 'derived' && field.name === 'client') {
      const clientName = String(draft.clientName || '').trim();
      if (!clientName) return null;
      if (String(draft.clientId || '').trim()) {
        const linkedRecord = linkedStructuredRecord(state, draft, field);
        return {
          kind: 'linked',
          badgeLabel: t(i18n, 'ui.fieldRelationClientLinked', 'Cliente collegato'),
          detailLabel: linkedDetail(linkedRecord) || clientName
        };
      }
      return {
        kind: 'manual',
        badgeLabel: t(i18n, 'ui.fieldRelationManual', 'Valore manuale'),
        detailLabel: t(i18n, 'ui.fieldRelationClientManualHint', 'Cliente non presente nell’anagrafica clienti')
      };
    }

    const rawValue = draft && draft.dynamicData && typeof draft.dynamicData === 'object' ? draft.dynamicData[field.name] : '';
    const currentValue = text(rawValue, '');
    if (!currentValue) return null;

    const linkedRecord = linkedStructuredRecord(state, draft, field);
    if (linkedRecord) {
      return {
        kind: 'linked',
        badgeLabel: t(i18n, 'ui.fieldRelationLinkedEntity', 'Entità collegata'),
        detailLabel: linkedDetail(linkedRecord)
      };
    }

    const matched = matchEntry(type, field, currentValue, companyConfig);
    if (matched) {
      return {
        kind: 'linked',
        badgeLabel: t(i18n, 'ui.fieldRelationLinked', 'Directory attiva'),
        detailLabel: text(matched.displayValue, '') || text(matched.label, '') || text(matched.value, currentValue)
      };
    }

    return {
      kind: 'manual',
      badgeLabel: t(i18n, 'ui.fieldRelationManual', 'Valore manuale'),
      detailLabel: t(i18n, 'ui.fieldRelationMissingHint', 'Valore non presente nella directory operativa attiva')
    };
  }

  function renderFieldRelationMeta(options = {}) {
    const { utils } = options;
    const meta = getFieldRelationMeta(options);
    if (!meta) return '';
    const escape = utils && typeof utils.escapeHtml === 'function' ? utils.escapeHtml : (value) => String(value || '');
    const pillClass = meta.kind === 'linked' ? 'success' : 'default';
    return `<div class="field-relation-row"><span class="field-relation-pill ${pillClass}">${escape(meta.badgeLabel)}</span><span class="field-relation-text">${escape(meta.detailLabel)}</span></div>`;
  }

  function buildCoverageSummary(options = {}) {
    const { state = null, type = '', draft = {}, companyConfig = null } = options;
    if (!type || !PracticeSchemas || typeof PracticeSchemas.getSchema !== 'function') return null;
    const schema = PracticeSchemas.getSchema(type);
    if (!schema || !schema.tabs || !Array.isArray(schema.tabs.practice)) return null;

    const relationalFields = schema.tabs.practice.filter((field) => isRelationalField(field));
    if (!relationalFields.length) return null;

    const summary = { total: relationalFields.length, linked: 0, manual: 0, empty: 0 };
    relationalFields.forEach((field) => {
      const meta = getFieldRelationMeta({ state, type, field, draft, companyConfig });
      if (!meta) {
        summary.empty += 1;
        return;
      }
      if (meta.kind === 'linked') summary.linked += 1;
      else summary.manual += 1;
    });
    return summary;
  }

  function applyFieldState(options = {}) {
    const { root, state = null, type = '', draft = {}, companyConfig = null, i18n = null, utils = null } = options;
    if (!root || !type || !PracticeSchemas || typeof PracticeSchemas.getField !== 'function') return;

    root.querySelectorAll('[data-field-wrap]').forEach((wrap) => {
      const fieldName = String(wrap.dataset.fieldWrap || '').trim();
      if (!fieldName) return;
      const field = PracticeSchemas.getField(type, fieldName);
      if (!field || !isRelationalField(field)) return;

      const html = renderFieldRelationMeta({ state, type, field, draft, companyConfig, i18n, utils });
      const existing = wrap.querySelector('.field-relation-row');
      if (!html) {
        if (existing) existing.remove();
        return;
      }
      if (existing) existing.remove();
      wrap.insertAdjacentHTML('beforeend', html);
    });
  }

  return {
    isRelationalField,
    getFieldRelationMeta,
    renderFieldRelationMeta,
    buildCoverageSummary,
    applyFieldState
  };
})();
