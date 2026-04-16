window.KedrixOneModuleFieldLinks = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

  const MODULE_FIELDS = {
    arrivalNotice: {
      client: 'client',
      sender: 'sender',
      destinationDepot: 'deposit',
      importer: 'importer',
      consignee: 'consignee',
      loadingPort: 'seaPort',
      unloadingPort: 'seaPort',
      vessel: 'vessel'
    },
    departureNotice: {
      client: 'client',
      sender: 'sender',
      destinationDepot: 'deposit',
      importer: 'importer',
      consignee: 'consignee',
      loadingPort: 'seaPort',
      unloadingPort: 'seaPort',
      vessel: 'vessel'
    },
    remittanceDocuments: {
      client: 'client',
      sender: 'sender',
      consignee: 'consignee',
      originNode: 'origin',
      destinationNode: 'destination',
      carrier: 'carrier',
      loadingPort: 'seaPort',
      dischargePort: 'seaPort'
    },
    quotations: {
      clientName: 'client',
      contactPerson: 'client',
      carrier: 'carrier',
      origin: 'origin',
      destination: 'destination',
      loadingPort: 'seaPort',
      dischargePort: 'seaPort',
      pickupLocation: 'logisticsLocation',
      deliveryLocation: 'logisticsLocation'
    }
  };

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanUpper(value) {
    return cleanText(value).toUpperCase();
  }

  function resolveEntityKey(moduleKey, fieldName) {
    return MODULE_FIELDS?.[moduleKey]?.[fieldName] || '';
  }

  function listOptions(state, moduleKey, fieldName) {
    const entityKey = resolveEntityKey(moduleKey, fieldName);
    if (!entityKey || !MasterDataEntities || typeof MasterDataEntities.listEntityRecords !== 'function') return [];
    return MasterDataEntities.listEntityRecords(state, entityKey).map((entry) => ({
      entityKey,
      id: cleanText(entry?.id || ''),
      value: cleanText(entry?.value || entry?.primary || ''),
      displayValue: cleanText([entry?.primary, entry?.secondary].filter(Boolean).join(' · ')),
      primary: cleanText(entry?.primary || entry?.value || ''),
      secondary: cleanText(entry?.secondary || ''),
      tertiary: cleanText(entry?.tertiary || '')
    })).filter((entry) => entry.value);
  }

  function getBinding(options = {}) {
    const { state = null, moduleKey = '', fieldName = '' } = options;
    const rows = listOptions(state, moduleKey, fieldName);
    if (!rows.length) return null;
    return {
      listId: `${moduleKey}-${fieldName}-master-data-list`,
      options: rows
    };
  }

  function renderDatalist(binding) {
    if (!binding || !Array.isArray(binding.options) || !binding.options.length) return '';
    return `<datalist id="${escapeHtml(binding.listId)}">${binding.options.map((option) => `<option value="${escapeHtml(option.value)}" label="${escapeHtml(option.displayValue || option.value)}"></option>`).join('')}</datalist>`;
  }

  function buildSnapshot(entityKey, match) {
    if (!entityKey || !match) return null;
    return {
      entityKey,
      recordId: cleanText(match.id || ''),
      value: cleanText(match.value || match.primary || ''),
      displayValue: cleanText(match.displayValue || match.primary || match.value || ''),
      secondary: cleanText(match.secondary || ''),
      tertiary: cleanText(match.tertiary || '')
    };
  }

  function syncDraftField(options = {}) {
    const { state = null, draft = null, moduleKey = '', fieldName = '', value = '' } = options;
    if (!draft || typeof draft !== 'object') return null;
    const entityKey = resolveEntityKey(moduleKey, fieldName);
    if (!entityKey) return null;
    const rows = listOptions(state, moduleKey, fieldName);
    const clean = cleanUpper(value);
    if (!draft.linkedEntities || typeof draft.linkedEntities !== 'object' || Array.isArray(draft.linkedEntities)) {
      draft.linkedEntities = {};
    }
    const match = rows.find((row) => {
      return [row.value, row.primary, row.displayValue, row.secondary, row.tertiary].some((candidate) => cleanUpper(candidate) === clean);
    }) || null;
    if (!clean || !match) {
      delete draft.linkedEntities[fieldName];
      if (fieldName === 'clientName' || fieldName === 'client') draft.clientId = '';
      return null;
    }
    const snapshot = buildSnapshot(entityKey, match);
    draft.linkedEntities[fieldName] = snapshot;
    if (fieldName === 'clientName' || fieldName === 'client') draft.clientId = snapshot.recordId || '';
    return snapshot;
  }

  return {
    getBinding,
    renderDatalist,
    syncDraftField,
    resolveEntityKey
  };
})();
