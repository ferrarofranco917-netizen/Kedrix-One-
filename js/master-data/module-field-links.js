window.KedrixOneModuleFieldLinks = (() => {
  'use strict';

  const MasterData = window.KedrixOneMasterDataEntities || null;

  const MODULE_PREFIX = {
    arrivalNotice: 'arrival-notice',
    departureNotice: 'departure-notice',
    remittanceDocuments: 'remittance',
    customsInstructions: 'customs'
  };

  const MODULE_FIELDS = {
    arrivalNotice: {
      client: { entityKey: 'client' },
      sender: { entityKey: 'sender' },
      destinationDepot: { entityKey: 'deposit' },
      importer: { entityKey: 'importer' },
      consignee: { entityKey: 'consignee' },
      notifyParty: { entityKey: 'consignee' },
      loadingPort: { entityKey: 'seaPort' },
      unloadingPort: { entityKey: 'seaPort' },
      vessel: { entityKey: 'vessel' }
    },
    departureNotice: {
      client: { entityKey: 'client' },
      sender: { entityKey: 'sender' },
      destinationDepot: { entityKey: 'deposit' },
      importer: { entityKey: 'importer' },
      consignee: { entityKey: 'consignee' },
      notifyParty: { entityKey: 'consignee' },
      loadingPort: { entityKey: 'seaPort' },
      unloadingPort: { entityKey: 'seaPort' },
      vessel: { entityKey: 'vessel' }
    },
    remittanceDocuments: {
      client: { entityKey: 'client' },
      sender: { entityKey: 'sender' },
      consignee: { entityKey: 'consignee' },
      loadingPort: { entityKey: 'seaPort' },
      unloadingPort: { entityKey: 'seaPort' },
      vessel: { entityKey: 'vessel' }
    },
    customsInstructions: {
      senderParty: { entityKey: 'sender' },
      receiverParty: { entityKey: 'consignee' },
      originNode: {
        entityKey: (draft) => {
          const mode = String(draft?.mode || '').toLowerCase();
          if (mode === 'air') return 'airport';
          if (mode === 'sea') return 'seaPort';
          return 'logisticsLocation';
        }
      },
      destinationNode: {
        entityKey: (draft) => {
          const mode = String(draft?.mode || '').toLowerCase();
          if (mode === 'air') return 'airport';
          if (mode === 'sea') return 'seaPort';
          return 'logisticsLocation';
        }
      }
    }
  };

  function text(value) {
    return String(value || '').trim();
  }

  function upper(value) {
    return text(value).toUpperCase();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getModuleConfig(moduleKey) {
    return MODULE_FIELDS[moduleKey] || null;
  }

  function resolveFieldConfig(moduleKey, fieldName, draft) {
    const moduleConfig = getModuleConfig(moduleKey);
    if (!moduleConfig) return null;
    const base = moduleConfig[fieldName];
    if (!base) return null;
    const entityKey = typeof base.entityKey === 'function' ? text(base.entityKey(draft || {})) : text(base.entityKey);
    return entityKey ? { ...base, entityKey } : null;
  }

  function buildOptionFromRecord(record, entityKey) {
    if (!record || !entityKey) return null;
    const value = text(record.value || record.name || record.label || record.displayValue);
    if (!value) return null;
    const displayValue = text(record.displayValue || record.name || record.value || value);
    const aliases = Array.from(new Set([
      value,
      text(record.displayValue),
      text(record.name),
      text(record.shortName),
      text(record.code),
      text(record.vatNumber),
      text(record.city),
      text(record.description)
    ].filter(Boolean)));
    return {
      value,
      displayValue,
      aliases,
      entityKey,
      recordId: text(record.id)
    };
  }

  function listEntityOptions(state, entityKey) {
    if (!MasterData || typeof MasterData.listEntityRecords !== 'function' || !entityKey) return [];
    return MasterData.listEntityRecords(state, entityKey).map((record) => buildOptionFromRecord(record, entityKey)).filter(Boolean);
  }

  function findOptionByValue(options, value) {
    const clean = upper(value);
    if (!clean) return null;
    return options.find((option) => {
      if (upper(option.value) === clean) return true;
      if (upper(option.displayValue) === clean) return true;
      return Array.isArray(option.aliases) && option.aliases.some((alias) => upper(alias) === clean);
    }) || null;
  }

  function syncDraftField({ state, moduleKey, draft, fieldName, value }) {
    if (!draft || !fieldName || !MasterData) return null;
    const config = resolveFieldConfig(moduleKey, fieldName, draft);
    if (!config || !config.entityKey) return null;
    if (!draft.linkedEntities || typeof draft.linkedEntities !== 'object') draft.linkedEntities = {};
    const clean = text(value != null ? value : draft[fieldName]);
    if (!clean) {
      delete draft.linkedEntities[fieldName];
      return null;
    }
    const options = listEntityOptions(state, config.entityKey);
    const matched = findOptionByValue(options, clean);
    if (!matched) {
      delete draft.linkedEntities[fieldName];
      return null;
    }
    const record = MasterData.getEntityRecordById ? MasterData.getEntityRecordById(state, config.entityKey, matched.recordId) : null;
    const snapshot = MasterData.buildRelationSnapshot
      ? MasterData.buildRelationSnapshot(config.entityKey, record || { value: matched.value, displayValue: matched.displayValue, id: matched.recordId }, fieldName)
      : { fieldName, entityKey: config.entityKey, value: matched.value, displayValue: matched.displayValue, recordId: matched.recordId };
    draft.linkedEntities[fieldName] = snapshot;
    return snapshot;
  }

  function seedDraftLinks({ state, moduleKey, draft }) {
    if (!draft) return draft;
    const moduleConfig = getModuleConfig(moduleKey);
    if (!moduleConfig) return draft;
    Object.keys(moduleConfig).forEach((fieldName) => {
      syncDraftField({ state, moduleKey, draft, fieldName, value: draft[fieldName] });
    });
    return draft;
  }

  function dataAttributeSelector(moduleKey, fieldName) {
    const prefix = MODULE_PREFIX[moduleKey];
    if (!prefix || !fieldName) return '';
    return `[data-${prefix}-field="${fieldName}"]`;
  }

  function ensureListHost(root, moduleKey) {
    const prefix = MODULE_PREFIX[moduleKey];
    if (!root || !prefix) return null;
    let host = root.querySelector(`[data-${prefix}-link-host]`);
    if (host) return host;
    host = document.createElement('div');
    host.setAttribute(`data-${prefix}-link-host`, 'true');
    host.hidden = true;
    root.appendChild(host);
    return host;
  }

  function renderOptionTags(options) {
    return options.map((option) => {
      const label = option.displayValue && option.displayValue !== option.value ? `${option.value} · ${option.displayValue}` : option.value;
      return `<option value="${escapeHtml(option.value)}" label="${escapeHtml(label)}"></option>`;
    }).join('');
  }

  function enhanceFields({ root, state, moduleKey, draft }) {
    if (!root || !state || !MasterData) return;
    const moduleConfig = getModuleConfig(moduleKey);
    if (!moduleConfig) return;
    const host = ensureListHost(root, moduleKey);
    if (!host) return;

    Object.keys(moduleConfig).forEach((fieldName) => {
      const input = root.querySelector(dataAttributeSelector(moduleKey, fieldName));
      if (!input || input.tagName !== 'INPUT') return;
      const config = resolveFieldConfig(moduleKey, fieldName, draft || {});
      if (!config || !config.entityKey) return;
      const options = listEntityOptions(state, config.entityKey);
      if (!options.length) {
        input.removeAttribute('list');
        input.classList.remove('module-masterdata-linked');
        input.removeAttribute('title');
        return;
      }
      const listId = `kedrix-${MODULE_PREFIX[moduleKey]}-${fieldName}-list`;
      input.setAttribute('list', listId);
      let datalist = host.querySelector(`#${listId}`);
      if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = listId;
        host.appendChild(datalist);
      }
      datalist.innerHTML = renderOptionTags(options);
      const snapshot = draft?.linkedEntities && typeof draft.linkedEntities === 'object' ? draft.linkedEntities[fieldName] : null;
      const isLinked = Boolean(snapshot && text(snapshot.recordId || snapshot.value));
      input.classList.toggle('module-masterdata-linked', isLinked);
      if (isLinked) {
        const detail = text(snapshot.displayValue || snapshot.value || input.value);
        input.setAttribute('title', `Collegato ad anagrafica condivisa: ${detail}`);
      } else {
        input.removeAttribute('title');
      }
    });
  }

  return {
    enhanceFields,
    syncDraftField,
    seedDraftLinks
  };
})();
