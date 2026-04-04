window.KedrixOneMasterDataEntities = (() => {
  'use strict';

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanUpper(value) {
    return cleanText(value).toUpperCase();
  }

  function nextSequentialId(prefix, items) {
    const max = (Array.isArray(items) ? items : []).reduce((acc, item) => {
      const raw = String(item && item.id ? item.id : '');
      const numeric = Number(raw.replace(/[^0-9]/g, ''));
      return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  function getEntityDefinitions(i18n) {
    return {
      client: {
        key: 'client',
        familyLabel: t(i18n, 'ui.masterDataFamilyClients', 'Clienti'),
        singleLabel: t(i18n, 'ui.client', 'Cliente'),
        valueLabel: t(i18n, 'ui.masterDataClientName', 'Ragione sociale'),
        storageType: 'clients',
        fieldNames: ['clientName'],
        suggestionKeys: [],
        idPrefix: 'CL-',
        structured: true
      },
      importer: {
        key: 'importer',
        familyLabel: t(i18n, 'ui.masterDataFamilyImporters', 'Importatori'),
        singleLabel: t(i18n, 'ui.importer', 'Importatore'),
        valueLabel: t(i18n, 'ui.importer', 'Importatore'),
        storageType: 'records',
        recordStoreKey: 'importers',
        directoryKey: 'importers',
        fieldNames: ['importer'],
        suggestionKeys: ['importers'],
        idPrefix: 'IMP-',
        structured: true
      },
      consignee: {
        key: 'consignee',
        familyLabel: t(i18n, 'ui.masterDataFamilyConsignees', 'Destinatari'),
        singleLabel: t(i18n, 'ui.consignee', 'Destinatario'),
        valueLabel: t(i18n, 'ui.consignee', 'Destinatario'),
        storageType: 'records',
        recordStoreKey: 'consignees',
        directoryKey: 'consignees',
        fieldNames: ['consignee'],
        suggestionKeys: ['consignees'],
        idPrefix: 'CON-',
        structured: true
      },
      vessel: {
        key: 'vessel',
        familyLabel: t(i18n, 'ui.masterDataFamilyVessels', 'Navi'),
        singleLabel: t(i18n, 'ui.masterDataVesselSingle', 'Nave'),
        valueLabel: t(i18n, 'ui.masterDataVesselSingle', 'Nave'),
        storageType: 'directory',
        directoryKey: 'vessels',
        fieldNames: ['vesselVoyage'],
        suggestionKeys: ['vessels']
      },
      sender: {
        key: 'sender',
        familyLabel: t(i18n, 'ui.masterDataFamilySenders', 'Mittenti'),
        singleLabel: t(i18n, 'ui.masterDataSenderSingle', 'Mittente'),
        valueLabel: t(i18n, 'ui.masterDataSenderSingle', 'Mittente'),
        storageType: 'records',
        recordStoreKey: 'senders',
        directoryKey: 'shippers',
        fieldNames: ['shipper', 'sender'],
        suggestionKeys: ['shippers'],
        idPrefix: 'SHP-',
        structured: true
      },
      taric: {
        key: 'taric',
        familyLabel: t(i18n, 'ui.masterDataFamilyTaric', 'TARIC'),
        singleLabel: t(i18n, 'ui.taric', 'TARIC'),
        valueLabel: t(i18n, 'ui.masterDataTaricCode', 'Codice TARIC'),
        storageType: 'directory',
        directoryKey: 'taricCodes',
        fieldNames: ['taric'],
        suggestionKeys: ['taricCodes'],
        supportsDescription: true
      },
      customsOffice: {
        key: 'customsOffice',
        familyLabel: t(i18n, 'ui.masterDataFamilyCustomsOffices', 'Dogane'),
        singleLabel: t(i18n, 'ui.customsOffice', 'Dogana'),
        valueLabel: t(i18n, 'ui.customsOffice', 'Dogana'),
        storageType: 'directory',
        directoryKey: 'customsOffices',
        fieldNames: ['customsOffice'],
        suggestionKeys: ['customsOffices']
      },
      origin: {
        key: 'origin',
        familyLabel: t(i18n, 'ui.masterDataFamilyOrigins', 'Origini'),
        singleLabel: t(i18n, 'ui.originRef', 'Origine'),
        valueLabel: t(i18n, 'ui.originRef', 'Origine'),
        storageType: 'directory',
        directoryKey: 'originDirectories',
        fieldNames: ['originRef'],
        suggestionKeys: ['originDirectories']
      },
      destination: {
        key: 'destination',
        familyLabel: t(i18n, 'ui.masterDataFamilyDestinations', 'Destinazioni'),
        singleLabel: t(i18n, 'ui.destinationRef', 'Destinazione'),
        valueLabel: t(i18n, 'ui.destinationRef', 'Destinazione'),
        storageType: 'directory',
        directoryKey: 'destinationDirectories',
        fieldNames: ['destinationRef'],
        suggestionKeys: ['destinationDirectories']
      },
      articleCode: {
        key: 'articleCode',
        familyLabel: t(i18n, 'ui.masterDataFamilyArticleCodes', 'Codici articolo'),
        singleLabel: t(i18n, 'ui.articleCode', 'Codice articolo'),
        valueLabel: t(i18n, 'ui.articleCode', 'Codice articolo'),
        storageType: 'directory',
        directoryKey: 'articleCodes',
        fieldNames: ['articleCode'],
        suggestionKeys: ['articleCodes']
      },
      shippingCompany: {
        key: 'shippingCompany',
        familyLabel: t(i18n, 'ui.masterDataFamilyShippingCompanies', 'Compagnie marittime'),
        singleLabel: t(i18n, 'ui.shippingCompany', 'Compagnia marittima'),
        valueLabel: t(i18n, 'ui.shippingCompany', 'Compagnia marittima'),
        storageType: 'directory',
        directoryKey: 'shippingCompanies',
        fieldNames: ['company'],
        suggestionKeys: ['shippingCompanies']
      },
      airline: {
        key: 'airline',
        familyLabel: t(i18n, 'ui.masterDataFamilyAirlines', 'Compagnie aeree'),
        singleLabel: t(i18n, 'ui.airline', 'Compagnia aerea'),
        valueLabel: t(i18n, 'ui.airline', 'Compagnia aerea'),
        storageType: 'directory',
        directoryKey: 'airlines',
        fieldNames: ['airline'],
        suggestionKeys: ['airlines']
      },
      carrier: {
        key: 'carrier',
        familyLabel: t(i18n, 'ui.masterDataFamilyCarriers', 'Vettori'),
        singleLabel: t(i18n, 'ui.carrier', 'Vettore'),
        valueLabel: t(i18n, 'ui.carrier', 'Vettore'),
        storageType: 'records',
        recordStoreKey: 'carriers',
        directoryKey: 'carriers',
        fieldNames: ['carrier', 'transporter'],
        suggestionKeys: ['carriers'],
        idPrefix: 'CAR-',
        structured: true
      },
      transportUnitType: {
        key: 'transportUnitType',
        familyLabel: t(i18n, 'ui.masterDataFamilyTransportUnitTypes', 'Tipologie unità'),
        singleLabel: t(i18n, 'ui.transportUnitType', 'Tipologia unità/trasporto'),
        valueLabel: t(i18n, 'ui.transportUnitType', 'Tipologia unità/trasporto'),
        storageType: 'directory',
        directoryKey: 'transportUnitTypes',
        fieldNames: ['transportUnitType'],
        suggestionKeys: ['transportUnitTypes']
      }
    };
  }

  function allDefinitions() {
    return getEntityDefinitions(null);
  }

  function resolveEntityKeyForField(fieldName) {
    const clean = cleanText(fieldName);
    const defs = allDefinitions();
    return Object.values(defs).find((def) => Array.isArray(def.fieldNames) && def.fieldNames.includes(clean))?.key || '';
  }

  function resolveEntityKeyForSuggestion(suggestionKey) {
    const clean = cleanText(suggestionKey);
    const defs = allDefinitions();
    return Object.values(defs).find((def) => Array.isArray(def.suggestionKeys) && def.suggestionKeys.includes(clean))?.key || '';
  }

  function getRelationFieldName(fieldName) {
    const clean = cleanText(fieldName);
    if (!clean || clean === 'clientName') return '';
    return `${clean}EntityId`;
  }

  function ensurePracticeConfig(companyConfig) {
    if (!companyConfig || typeof companyConfig !== 'object') return { directories: {}, masterDataRecords: {} };
    if (!companyConfig.practiceConfig || typeof companyConfig.practiceConfig !== 'object') {
      companyConfig.practiceConfig = { directories: {} };
    }
    if (!companyConfig.practiceConfig.directories || typeof companyConfig.practiceConfig.directories !== 'object') {
      companyConfig.practiceConfig.directories = {};
    }
    if (!companyConfig.masterDataRecords || typeof companyConfig.masterDataRecords !== 'object') {
      companyConfig.masterDataRecords = {};
    }
    return companyConfig.practiceConfig;
  }

  function ensureRecordStore(stateOrConfig, entityKey) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def || !def.recordStoreKey) return [];
    const companyConfig = stateOrConfig && stateOrConfig.companyConfig ? stateOrConfig.companyConfig : stateOrConfig;
    ensurePracticeConfig(companyConfig);
    if (!Array.isArray(companyConfig.masterDataRecords[def.recordStoreKey])) {
      companyConfig.masterDataRecords[def.recordStoreKey] = [];
    }
    return companyConfig.masterDataRecords[def.recordStoreKey];
  }

  function ensureDirectory(stateOrConfig, directoryKey) {
    const companyConfig = stateOrConfig && stateOrConfig.companyConfig ? stateOrConfig.companyConfig : stateOrConfig;
    ensurePracticeConfig(companyConfig);
    if (!Array.isArray(companyConfig.practiceConfig.directories[directoryKey])) {
      companyConfig.practiceConfig.directories[directoryKey] = [];
    }
    return companyConfig.practiceConfig.directories[directoryKey];
  }

  function buildEntityDisplayValue(record) {
    const name = cleanText(record.name || record.value || record.label || '');
    const city = cleanText(record.city || '');
    const vatNumber = cleanText(record.vatNumber || record.vat || '');
    return [name, city, vatNumber].filter(Boolean).join(' · ') || name;
  }

  function normalizeBusinessRecord(record) {
    if (!record || typeof record !== 'object') return null;
    const name = cleanText(record.name || record.value || '');
    if (!name) return null;
    return {
      id: cleanText(record.id || ''),
      name,
      shortName: cleanText(record.shortName || ''),
      code: cleanText(record.code || ''),
      vatNumber: cleanText(record.vatNumber || record.vat || ''),
      taxCode: cleanText(record.taxCode || ''),
      address: cleanText(record.address || ''),
      zipCode: cleanText(record.zipCode || ''),
      city: cleanText(record.city || ''),
      province: cleanText(record.province || ''),
      country: cleanText(record.country || ''),
      email: cleanText(record.email || ''),
      phone: cleanText(record.phone || ''),
      pec: cleanText(record.pec || ''),
      sdiCode: cleanText(record.sdiCode || ''),
      notes: cleanText(record.notes || ''),
      active: record.active !== false,
      numberingRule: record.numberingRule && typeof record.numberingRule === 'object' ? { ...record.numberingRule } : undefined,
      displayValue: cleanText(record.displayValue || buildEntityDisplayValue(record))
    };
  }

  function seedStructuredEntityRecords(state, entityKey) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def || !def.structured) return;

    if (entityKey === 'client') {
      state.clients = Array.isArray(state.clients) ? state.clients : [];
      return;
    }

    const store = ensureRecordStore(state, entityKey);
    if (store.length) return;
    const directory = ensureDirectory(state, def.directoryKey);
    directory.forEach((entry, index) => {
      const value = cleanText(entry && typeof entry === 'object' ? (entry.value || entry.name || entry.label || entry.displayValue || '') : entry);
      if (!value) return;
      const city = cleanText(entry && typeof entry === 'object' ? entry.city : '');
      store.push({
        id: `${def.idPrefix}${String(index + 1).padStart(3, '0')}`,
        name: value,
        city,
        active: true,
        displayValue: buildEntityDisplayValue({ name: value, city })
      });
    });
  }

  function buildBusinessDraft() {
    return {
      value: '',
      shortName: '',
      code: '',
      vatNumber: '',
      taxCode: '',
      address: '',
      zipCode: '',
      city: '',
      province: '',
      country: '',
      email: '',
      phone: '',
      pec: '',
      sdiCode: '',
      notes: '',
      active: true
    };
  }

  function createFormDraft(entityKey) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def) return { value: '', description: '', city: '' };
    return def.structured ? buildBusinessDraft() : { value: '', description: '', city: '' };
  }

  function getFormFields(entityKey, i18n) {
    const defs = getEntityDefinitions(i18n);
    const def = defs[entityKey];
    if (!def || !def.structured) return [];

    const companyLabel = def.valueLabel || t(i18n, 'ui.masterDataClientName', 'Ragione sociale');
    return [
      { name: 'value', label: companyLabel, required: true, full: true },
      { name: 'shortName', label: t(i18n, 'ui.masterDataShortName', 'Nome breve') },
      { name: 'code', label: t(i18n, 'ui.masterDataInternalCode', 'Codice interno') },
      { name: 'vatNumber', label: t(i18n, 'ui.masterDataVatNumber', 'Partita IVA') },
      { name: 'taxCode', label: t(i18n, 'ui.masterDataTaxCode', 'Codice fiscale') },
      { name: 'address', label: t(i18n, 'ui.masterDataAddress', 'Indirizzo'), full: true },
      { name: 'zipCode', label: t(i18n, 'ui.masterDataZipCode', 'CAP') },
      { name: 'city', label: t(i18n, 'ui.city', 'Città') },
      { name: 'province', label: t(i18n, 'ui.masterDataProvince', 'Provincia') },
      { name: 'country', label: t(i18n, 'ui.masterDataCountry', 'Nazione') },
      { name: 'email', label: t(i18n, 'ui.email', 'Email') },
      { name: 'phone', label: t(i18n, 'ui.phone', 'Telefono') },
      { name: 'pec', label: t(i18n, 'ui.masterDataPec', 'PEC') },
      { name: 'sdiCode', label: t(i18n, 'ui.masterDataSdi', 'Codice SDI') },
      { name: 'notes', label: t(i18n, 'ui.notes', 'Note'), full: true, type: 'textarea' },
      { name: 'active', label: t(i18n, 'ui.masterDataActiveEntity', 'Entità attiva'), type: 'checkbox', full: true }
    ];
  }

  function findStructuredRecord(records, payload) {
    const name = cleanUpper(payload.value || payload.name || '');
    const vatNumber = cleanUpper(payload.vatNumber || '');
    return (Array.isArray(records) ? records : []).find((record) => {
      if (!record) return false;
      if (vatNumber && cleanUpper(record.vatNumber || '') === vatNumber) return true;
      return name && cleanUpper(record.name || '') === name;
    }) || null;
  }

  function upsertDirectoryFromRecord(state, entityKey, record) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def || !def.directoryKey) return;
    const directory = ensureDirectory(state, def.directoryKey);
    const value = cleanText(record.name || record.value || '');
    if (!value) return;
    const existingIndex = directory.findIndex((entry) => {
      const candidate = cleanText(entry && typeof entry === 'object' ? (entry.value || entry.name || entry.label || '') : entry);
      return cleanUpper(candidate) === cleanUpper(value);
    });
    const nextEntry = {
      value,
      label: value,
      city: cleanText(record.city || ''),
      description: cleanText(record.vatNumber || record.description || ''),
      displayValue: buildEntityDisplayValue(record)
    };
    if (existingIndex >= 0) directory[existingIndex] = { ...directory[existingIndex], ...nextEntry };
    else directory.push(nextEntry);
  }

  function saveBusinessEntity(state, entityKey, payload = {}) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def) return { ok: false, reason: 'invalid-entity' };

    const normalized = normalizeBusinessRecord({
      name: payload.value,
      shortName: payload.shortName,
      code: payload.code,
      vatNumber: payload.vatNumber,
      taxCode: payload.taxCode,
      address: payload.address,
      zipCode: payload.zipCode,
      city: payload.city,
      province: payload.province,
      country: payload.country,
      email: payload.email,
      phone: payload.phone,
      pec: payload.pec,
      sdiCode: payload.sdiCode,
      notes: payload.notes,
      active: payload.active !== false
    });
    if (!normalized || !normalized.name) return { ok: false, reason: 'missing-value' };

    if (entityKey === 'client') {
      state.clients = Array.isArray(state.clients) ? state.clients : [];
      state.contacts = Array.isArray(state.contacts) ? state.contacts : [];
      const existingClient = findStructuredRecord(state.clients.map((item) => normalizeBusinessRecord(item)).filter(Boolean), normalized);
      if (existingClient) {
        return { ok: true, created: false, value: existingClient.name, relatedId: existingClient.id, record: existingClient };
      }
      const client = {
        id: nextSequentialId(def.idPrefix, state.clients),
        name: normalized.name,
        shortName: normalized.shortName,
        code: normalized.code,
        vatNumber: normalized.vatNumber,
        taxCode: normalized.taxCode,
        address: normalized.address,
        zipCode: normalized.zipCode,
        city: normalized.city,
        province: normalized.province,
        country: normalized.country,
        email: normalized.email,
        phone: normalized.phone,
        pec: normalized.pec,
        sdiCode: normalized.sdiCode,
        notes: normalized.notes,
        active: normalized.active,
        numberingRule: {
          prefix: normalized.code || '',
          separator: '-',
          includeYear: true,
          resetEveryYear: true,
          nextNumber: 1,
          lastYear: new Date().getFullYear()
        }
      };
      state.clients.push(client);
      const contactExists = state.contacts.some((item) => cleanUpper(item.name || '') === cleanUpper(client.name));
      if (!contactExists) {
        state.contacts.push({ id: nextSequentialId('CNT-', state.contacts), name: client.name, type: 'Cliente', city: client.city, email: client.email, phone: client.phone });
      }
      return { ok: true, created: true, value: client.name, relatedId: client.id, record: normalizeBusinessRecord(client) };
    }

    seedStructuredEntityRecords(state, entityKey);
    const store = ensureRecordStore(state, entityKey);
    const existing = findStructuredRecord(store, normalized);
    if (existing) {
      return { ok: true, created: false, value: existing.name, relatedId: existing.id, record: normalizeBusinessRecord(existing) };
    }

    const record = {
      id: nextSequentialId(def.idPrefix, store),
      name: normalized.name,
      shortName: normalized.shortName,
      code: normalized.code,
      vatNumber: normalized.vatNumber,
      taxCode: normalized.taxCode,
      address: normalized.address,
      zipCode: normalized.zipCode,
      city: normalized.city,
      province: normalized.province,
      country: normalized.country,
      email: normalized.email,
      phone: normalized.phone,
      pec: normalized.pec,
      sdiCode: normalized.sdiCode,
      notes: normalized.notes,
      active: normalized.active,
      displayValue: buildEntityDisplayValue(normalized)
    };
    store.push(record);
    upsertDirectoryFromRecord(state, entityKey, record);
    return { ok: true, created: true, value: record.name, relatedId: record.id, record: normalizeBusinessRecord(record) };
  }

  function listEntityRecords(state, entityKey) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def) return [];

    if (entityKey === 'client') {
      return (Array.isArray(state.clients) ? state.clients : [])
        .map((item) => normalizeBusinessRecord(item))
        .filter(Boolean)
        .map((record) => ({
          id: record.id || record.name,
          primary: record.name,
          secondary: [record.city, record.country].filter(Boolean).join(' · ') || '—',
          tertiary: record.vatNumber || '—',
          value: record.name,
          record
        }));
    }

    if (def.structured) {
      seedStructuredEntityRecords(state, entityKey);
      return ensureRecordStore(state, entityKey)
        .map((item) => normalizeBusinessRecord(item))
        .filter(Boolean)
        .map((record) => ({
          id: record.id || record.name,
          primary: record.name,
          secondary: [record.city, record.country].filter(Boolean).join(' · ') || '—',
          tertiary: record.vatNumber || '—',
          value: record.name,
          record
        }));
    }

    if (def.storageType === 'directory') {
      const raw = ensureDirectory(state, def.directoryKey);
      return raw.map((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const value = cleanText(item.value || item.code || item.name || item.label || '');
          const primary = cleanText(item.displayValue || item.label || value);
          const secondary = cleanText(item.description || item.city || item.code || '') || '—';
          return { id: `${entityKey}-${index}`, primary, secondary, tertiary: '—', value: value || primary, record: item };
        }
        const value = cleanText(item);
        return { id: `${entityKey}-${index}`, primary: value, secondary: '—', tertiary: '—', value, record: { value } };
      }).filter((item) => item.primary);
    }

    return [];
  }

  function buildOptionEntryFromRecord(record) {
    const normalized = normalizeBusinessRecord(record);
    if (!normalized) return null;
    const aliases = Array.from(new Set([
      normalized.name,
      normalized.shortName,
      normalized.code,
      normalized.vatNumber,
      normalized.taxCode,
      normalized.city,
      normalized.country,
      buildEntityDisplayValue(normalized)
    ].filter(Boolean)));
    return {
      value: normalized.name,
      label: normalized.name,
      displayValue: buildEntityDisplayValue(normalized),
      description: normalized.vatNumber || normalized.city || '',
      aliases
    };
  }

  function getSuggestionOptions(companyConfig, suggestionKey) {
    const entityKey = resolveEntityKeyForSuggestion(suggestionKey);
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def || !def.structured || entityKey === 'client') return null;
    const store = ensureRecordStore(companyConfig, entityKey);
    if (!store.length) return null;
    return store.map((record) => buildOptionEntryFromRecord(record)).filter(Boolean);
  }

  function findStructuredEntityRecordByValue(stateOrConfig, entityKey, value) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def || !def.structured) return null;
    const clean = cleanUpper(value);
    if (!clean) return null;

    if (entityKey === 'client') {
      const records = Array.isArray((stateOrConfig || {}).clients) ? stateOrConfig.clients : [];
      return records.map((record) => normalizeBusinessRecord(record)).filter(Boolean).find((record) => {
        return [record.name, record.shortName, record.code, record.vatNumber, record.taxCode, record.displayValue].some((candidate) => cleanUpper(candidate) === clean);
      }) || null;
    }

    const store = ensureRecordStore(stateOrConfig, entityKey);
    return store.map((record) => normalizeBusinessRecord(record)).filter(Boolean).find((record) => {
      return [record.name, record.shortName, record.code, record.vatNumber, record.taxCode, record.displayValue].some((candidate) => cleanUpper(candidate) === clean);
    }) || null;
  }

  function syncDraftRelationField({ state, draft, fieldName, value }) {
    const entityKey = resolveEntityKeyForField(fieldName);
    if (!entityKey || !draft) return null;

    if (entityKey === 'client' || fieldName === 'clientName') {
      const record = findStructuredEntityRecordByValue(state, 'client', value);
      draft.clientId = record ? record.id : '';
      draft.clientName = cleanText(value);
      return record;
    }

    if (!draft.dynamicData || typeof draft.dynamicData !== 'object') draft.dynamicData = {};
    const relationField = getRelationFieldName(fieldName);
    if (!relationField) return null;
    const record = findStructuredEntityRecordByValue(state, entityKey, value);
    draft.dynamicData[relationField] = record ? record.id : '';
    return record;
  }

  function getLinkedRecordFromDraft({ state, draft, fieldName }) {
    if (!draft) return null;
    const entityKey = resolveEntityKeyForField(fieldName);
    if (!entityKey) return null;
    if (entityKey === 'client' || fieldName === 'clientName') {
      return findStructuredEntityRecordByValue(state, 'client', draft.clientName || '') || null;
    }
    const relationField = getRelationFieldName(fieldName);
    const relationId = relationField && draft.dynamicData ? cleanText(draft.dynamicData[relationField]) : '';
    if (!relationId) return null;
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def || !def.structured) return null;
    const records = ensureRecordStore(state, entityKey).map((record) => normalizeBusinessRecord(record)).filter(Boolean);
    return records.find((record) => cleanText(record.id) === relationId) || null;
  }

  return {
    getEntityDefinitions,
    resolveEntityKeyForField,
    resolveEntityKeyForSuggestion,
    getRelationFieldName,
    createFormDraft,
    getFormFields,
    listEntityRecords,
    getSuggestionOptions,
    saveBusinessEntity,
    syncDraftRelationField,
    getLinkedRecordFromDraft,
    buildEntityDisplayValue
  };
})();
