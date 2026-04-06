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
      supplier: {
        key: 'supplier',
        familyLabel: t(i18n, 'ui.masterDataFamilySuppliers', 'Fornitori'),
        singleLabel: t(i18n, 'ui.masterDataSupplierSingle', 'Fornitore'),
        valueLabel: t(i18n, 'ui.masterDataSupplierSingle', 'Fornitore'),
        storageType: 'records',
        recordStoreKey: 'suppliers',
        directoryKey: 'suppliers',
        fieldNames: ['supplier'],
        suggestionKeys: ['suppliers'],
        idPrefix: 'SUP-',
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
        suggestionKeys: ['customsOffices'],
        supportsDescription: true,
        supportsCity: true
      },
      origin: {
        key: 'origin',
        familyLabel: t(i18n, 'ui.masterDataFamilyOrigins', 'Origini'),
        singleLabel: t(i18n, 'ui.originRef', 'Origine'),
        valueLabel: t(i18n, 'ui.originRef', 'Origine'),
        storageType: 'directory',
        directoryKey: 'originDirectories',
        fieldNames: ['originRef'],
        suggestionKeys: ['originDirectories'],
        supportsDescription: true
      },
      destination: {
        key: 'destination',
        familyLabel: t(i18n, 'ui.masterDataFamilyDestinations', 'Destinazioni'),
        singleLabel: t(i18n, 'ui.destinationRef', 'Destinazione'),
        valueLabel: t(i18n, 'ui.destinationRef', 'Destinazione'),
        storageType: 'directory',
        directoryKey: 'destinationDirectories',
        fieldNames: ['destinationRef'],
        suggestionKeys: ['destinationDirectories'],
        supportsDescription: true
      },
      articleCode: {
        key: 'articleCode',
        familyLabel: t(i18n, 'ui.masterDataFamilyArticleCodes', 'Codici articolo'),
        singleLabel: t(i18n, 'ui.articleCode', 'Codice articolo'),
        valueLabel: t(i18n, 'ui.articleCode', 'Codice articolo'),
        storageType: 'directory',
        directoryKey: 'articleCodes',
        fieldNames: ['articleCode'],
        suggestionKeys: ['articleCodes'],
        supportsDescription: true
      },
      shippingCompany: {
        key: 'shippingCompany',
        familyLabel: t(i18n, 'ui.masterDataFamilyShippingCompanies', 'Compagnie marittime'),
        singleLabel: t(i18n, 'ui.shippingCompany', 'Compagnia marittima'),
        valueLabel: t(i18n, 'ui.shippingCompany', 'Compagnia marittima'),
        storageType: 'records',
        recordStoreKey: 'shippingCompanies',
        directoryKey: 'shippingCompanies',
        fieldNames: ['company'],
        suggestionKeys: ['shippingCompanies'],
        idPrefix: 'SCO-',
        structured: true
      },
      airline: {
        key: 'airline',
        familyLabel: t(i18n, 'ui.masterDataFamilyAirlines', 'Compagnie aeree'),
        singleLabel: t(i18n, 'ui.airline', 'Compagnia aerea'),
        valueLabel: t(i18n, 'ui.airline', 'Compagnia aerea'),
        storageType: 'records',
        recordStoreKey: 'airlines',
        directoryKey: 'airlines',
        fieldNames: ['airline'],
        suggestionKeys: ['airlines'],
        idPrefix: 'AIR-',
        structured: true
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
        suggestionKeys: ['transportUnitTypes'],
        supportsDescription: true
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

  function ensureDraftLinkedEntities(draft) {
    if (!draft || typeof draft !== 'object') return {};
    if (!draft.linkedEntities || typeof draft.linkedEntities !== 'object' || Array.isArray(draft.linkedEntities)) {
      draft.linkedEntities = {};
    }
    return draft.linkedEntities;
  }

  function sanitizeRelationSnapshot(raw, fallback = {}) {
    if (!raw || typeof raw !== 'object') return null;
    const snapshot = {
      fieldName: cleanText(raw.fieldName || fallback.fieldName || ''),
      entityKey: cleanText(raw.entityKey || fallback.entityKey || ''),
      recordId: cleanText(raw.recordId || raw.entityId || raw.id || fallback.recordId || ''),
      value: cleanText(raw.value || raw.name || raw.label || raw.displayValue || fallback.value || ''),
      displayValue: cleanText(raw.displayValue || fallback.displayValue || ''),
      city: cleanText(raw.city || fallback.city || ''),
      vatNumber: cleanText(raw.vatNumber || fallback.vatNumber || ''),
      code: cleanText(raw.code || fallback.code || ''),
      taxCode: cleanText(raw.taxCode || fallback.taxCode || ''),
      description: cleanText(raw.description || fallback.description || ''),
      country: cleanText(raw.country || fallback.country || ''),
      shortName: cleanText(raw.shortName || fallback.shortName || ''),
      active: raw.active !== undefined ? Boolean(raw.active) : (fallback.active !== undefined ? Boolean(fallback.active) : true)
    };
    if (!snapshot.displayValue) {
      snapshot.displayValue = [snapshot.value, snapshot.city || snapshot.vatNumber || snapshot.code || snapshot.description].filter(Boolean).join(' · ') || snapshot.value;
    }
    if (!snapshot.value && !snapshot.displayValue && !snapshot.recordId) return null;
    return snapshot;
  }

  function isStructuredEntityKey(entityKey) {
    const defs = allDefinitions();
    return Boolean(defs[entityKey] && defs[entityKey].structured);
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
    if (!companyConfig || typeof companyConfig !== 'object') return [];
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
      vatNumber: cleanText(record.vatNumber || ''),
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
      vatLookupSource: cleanText(record.vatLookupSource || ''),
      vatLookupStatus: cleanText(record.vatLookupStatus || ''),
      vatLookupAt: cleanText(record.vatLookupAt || ''),
      vatLookupVat: cleanText(record.vatLookupVat || ''),
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
      id: '',
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
      active: true,
      vatLookupSource: '',
      vatLookupStatus: '',
      vatLookupAt: '',
      vatLookupVat: ''
    };
  }

  function buildSimpleDraft() {
    return { id: '', value: '', description: '', city: '' };
  }

  function normalizeDirectoryRecord(entityKey, raw, recordId = '') {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string') {
      const value = cleanText(raw);
      if (!value) return null;
      return { id: recordId, value, description: '', city: '', displayValue: value };
    }
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const value = cleanText(raw.value || raw.code || raw.name || raw.label || raw.displayValue || '');
      if (!value) return null;
      const description = cleanText(raw.description || raw.code || raw.vatNumber || '');
      const city = cleanText(raw.city || raw.locality || '');
      return {
        id: recordId,
        value,
        description,
        city,
        displayValue: cleanText(raw.displayValue || raw.label || [value, description || city].filter(Boolean).join(' · ') || value)
      };
    }
    return null;
  }

  function buildDirectoryStoredEntry(def, draft) {
    const value = cleanText(draft.value);
    const description = cleanText(draft.description);
    const city = cleanText(draft.city);
    if (!value) return null;
    if (!def.supportsDescription && !def.supportsCity && !description && !city) return value;
    return {
      value,
      label: value,
      description,
      city,
      displayValue: [value, description || city].filter(Boolean).join(' · ') || value
    };
  }

  function buildDraftFromStructuredRecord(record) {
    const normalized = normalizeBusinessRecord(record);
    if (!normalized) return buildBusinessDraft();
    return {
      id: normalized.id || '',
      value: normalized.name,
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
      vatLookupSource: normalized.vatLookupSource,
      vatLookupStatus: normalized.vatLookupStatus,
      vatLookupAt: normalized.vatLookupAt,
      vatLookupVat: normalized.vatLookupVat
    };
  }

  function buildDraftFromDirectoryRecord(record) {
    const normalized = normalizeDirectoryRecord('', record, record && record.id ? record.id : '');
    if (!normalized) return buildSimpleDraft();
    return {
      id: normalized.id || '',
      value: normalized.value,
      description: normalized.description,
      city: normalized.city
    };
  }

  function createFormDraft(entityKey, sourceRecord = null) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def) return buildSimpleDraft();
    if (!sourceRecord) return def.structured ? buildBusinessDraft() : buildSimpleDraft();
    return def.structured ? buildDraftFromStructuredRecord(sourceRecord) : buildDraftFromDirectoryRecord(sourceRecord);
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
      { name: 'vatNumber', label: t(i18n, 'ui.masterDataVatNumber', 'Partita IVA'), lookupAction: 'vat-autofill' },
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

  function findStructuredRecord(records, payload, currentId = '') {
    const name = cleanUpper(payload.value || payload.name || '');
    const vatNumber = cleanUpper(payload.vatNumber || '');
    return (Array.isArray(records) ? records : []).find((record) => {
      if (!record) return false;
      if (currentId && cleanText(record.id) === cleanText(currentId)) return false;
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
      displayValue: buildEntityDisplayValue(record),
      entityId: cleanText(record.id || '')
    };
    if (existingIndex >= 0) directory[existingIndex] = { ...(typeof directory[existingIndex] === 'object' ? directory[existingIndex] : {}), ...nextEntry };
    else directory.push(nextEntry);
  }

  function saveBusinessEntity(state, entityKey, payload = {}) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def) return { ok: false, reason: 'invalid-entity' };

    const normalized = normalizeBusinessRecord({
      id: payload.id,
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
      active: payload.active !== false,
      vatLookupSource: payload.vatLookupSource,
      vatLookupStatus: payload.vatLookupStatus,
      vatLookupAt: payload.vatLookupAt,
      vatLookupVat: payload.vatLookupVat
    });
    if (!normalized || !normalized.name) return { ok: false, reason: 'missing-value' };

    if (entityKey === 'client') {
      state.clients = Array.isArray(state.clients) ? state.clients : [];
      state.contacts = Array.isArray(state.contacts) ? state.contacts : [];
      const existingClient = findStructuredRecord(state.clients.map((item) => normalizeBusinessRecord(item)).filter(Boolean), normalized, normalized.id);
      if (existingClient) {
        return { ok: true, created: false, updated: false, value: existingClient.name, relatedId: existingClient.id, record: existingClient, duplicate: true };
      }
      const currentIndex = normalized.id ? state.clients.findIndex((item) => cleanText(item.id) === normalized.id) : -1;
      const previous = currentIndex >= 0 ? normalizeBusinessRecord(state.clients[currentIndex]) : null;
      const client = {
        id: normalized.id || nextSequentialId(def.idPrefix, state.clients),
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
        vatLookupSource: normalized.vatLookupSource,
        vatLookupStatus: normalized.vatLookupStatus,
        vatLookupAt: normalized.vatLookupAt,
        vatLookupVat: normalized.vatLookupVat,
        numberingRule: previous && previous.numberingRule ? { ...previous.numberingRule } : {
          prefix: normalized.code || '',
          separator: '-',
          includeYear: true,
          resetEveryYear: true,
          nextNumber: 1,
          lastYear: new Date().getFullYear()
        }
      };
      if (currentIndex >= 0) state.clients[currentIndex] = client;
      else state.clients.push(client);

      const contactIndex = state.contacts.findIndex((item) => item && (cleanText(item.id) === cleanText(client.id) || cleanUpper(item.name || '') === cleanUpper(previous?.name || client.name)));
      const contactPayload = { id: client.id, name: client.name, type: 'Cliente', city: client.city, email: client.email, phone: client.phone };
      if (contactIndex >= 0) state.contacts[contactIndex] = { ...state.contacts[contactIndex], ...contactPayload };
      else state.contacts.push(contactPayload);

      return { ok: true, created: currentIndex < 0, updated: currentIndex >= 0, value: client.name, relatedId: client.id, record: normalizeBusinessRecord(client) };
    }

    seedStructuredEntityRecords(state, entityKey);
    const store = ensureRecordStore(state, entityKey);
    const existing = findStructuredRecord(store, normalized, normalized.id);
    if (existing) {
      return { ok: true, created: false, updated: false, value: existing.name, relatedId: existing.id, record: normalizeBusinessRecord(existing), duplicate: true };
    }

    const currentIndex = normalized.id ? store.findIndex((item) => cleanText(item.id) === normalized.id) : -1;
    const record = {
      id: normalized.id || nextSequentialId(def.idPrefix, store),
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
      vatLookupSource: normalized.vatLookupSource,
      vatLookupStatus: normalized.vatLookupStatus,
      vatLookupAt: normalized.vatLookupAt,
      vatLookupVat: normalized.vatLookupVat,
      displayValue: buildEntityDisplayValue(normalized)
    };
    if (currentIndex >= 0) store[currentIndex] = record;
    else store.push(record);
    upsertDirectoryFromRecord(state, entityKey, record);
    return { ok: true, created: currentIndex < 0, updated: currentIndex >= 0, value: record.name, relatedId: record.id, record: normalizeBusinessRecord(record) };
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
          tertiary: record.vatNumber || record.code || '—',
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
          tertiary: record.vatNumber || record.code || '—',
          value: record.name,
          record
        }));
    }

    if (def.storageType === 'directory') {
      const raw = ensureDirectory(state, def.directoryKey);
      return raw.map((item, index) => {
        const normalized = normalizeDirectoryRecord(entityKey, item, `${entityKey}-${index}`);
        if (!normalized) return null;
        return {
          id: normalized.id,
          primary: normalized.value,
          secondary: normalized.description || normalized.city || '—',
          tertiary: normalized.city || '—',
          value: normalized.value,
          record: normalized
        };
      }).filter(Boolean);
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
      aliases,
      entityId: normalized.id || ''
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

  function findStructuredEntityRecordByVat(stateOrConfig, vatNumber, entityKey = '') {
    const cleanVat = cleanUpper(String(vatNumber || '').replace(/[^A-Z0-9]/g, ''));
    if (!cleanVat) return null;
    const defs = allDefinitions();
    const keys = entityKey ? [entityKey] : Object.values(defs).filter((def) => def && def.structured).map((def) => def.key);
    for (const key of keys) {
      const record = findStructuredEntityRecordByValue(stateOrConfig, key, cleanVat);
      if (record && cleanUpper(String(record.vatNumber || '').replace(/[^A-Z0-9]/g, '')) === cleanVat) return record;
    }
    return null;
  }

  function buildRelationSnapshot(entityKey, record, fieldName = '') {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def) return null;

    if (def.structured) {
      const normalized = normalizeBusinessRecord(record);
      if (!normalized) return null;
      return sanitizeRelationSnapshot({
        fieldName,
        entityKey,
        recordId: normalized.id || '',
        value: normalized.name,
        displayValue: normalized.displayValue || buildEntityDisplayValue(normalized),
        city: normalized.city,
        vatNumber: normalized.vatNumber,
        code: normalized.code,
        taxCode: normalized.taxCode,
        country: normalized.country,
        shortName: normalized.shortName,
        active: normalized.active
      });
    }

    const normalizedDirectory = normalizeDirectoryRecord(entityKey, record, record && record.id ? record.id : '');
    if (!normalizedDirectory) return null;
    return sanitizeRelationSnapshot({
      fieldName,
      entityKey,
      recordId: normalizedDirectory.id || '',
      value: normalizedDirectory.value,
      displayValue: normalizedDirectory.displayValue || normalizedDirectory.value,
      city: normalizedDirectory.city,
      description: normalizedDirectory.description
    });
  }

  function getLinkedSnapshotFromDraft({ draft, fieldName }) {
    if (!draft || !fieldName) return null;
    const linkedEntities = draft.linkedEntities && typeof draft.linkedEntities === 'object' ? draft.linkedEntities : null;
    if (!linkedEntities) return null;
    return sanitizeRelationSnapshot(linkedEntities[fieldName], { fieldName, entityKey: resolveEntityKeyForField(fieldName) });
  }

  function applyLinkedRecordToDraft({ state, draft, fieldName, entityKey = '', record = null, value = '' }) {
    const resolvedField = cleanText(fieldName);
    const resolvedEntityKey = entityKey || resolveEntityKeyForField(resolvedField);
    if (!draft || !resolvedEntityKey) return null;

    const defs = allDefinitions();
    const def = defs[resolvedEntityKey];
    const rawValue = cleanText(value || (record && (record.name || record.value || record.label || '')) || '');
    let linkedRecord = record;

    if (!linkedRecord && def && def.structured) {
      linkedRecord = findStructuredEntityRecordByValue(state, resolvedEntityKey, rawValue);
    }

    const linkedEntities = ensureDraftLinkedEntities(draft);

    if (resolvedEntityKey === 'client' || resolvedField === 'clientName') {
      draft.clientName = rawValue || cleanText(draft.clientName);
      draft.clientId = def && def.structured && linkedRecord ? cleanText(linkedRecord.id) : '';
      if (linkedRecord && def && def.structured) linkedEntities.clientName = buildRelationSnapshot('client', linkedRecord, 'clientName');
      else delete linkedEntities.clientName;
      return linkedRecord;
    }

    if (!draft.dynamicData || typeof draft.dynamicData !== 'object') draft.dynamicData = {};
    if (resolvedField) draft.dynamicData[resolvedField] = rawValue;

    const relationField = getRelationFieldName(resolvedField);
    if (def && def.structured && linkedRecord) {
      if (relationField) draft.dynamicData[relationField] = cleanText(linkedRecord.id);
      linkedEntities[resolvedField] = buildRelationSnapshot(resolvedEntityKey, linkedRecord, resolvedField);
      return linkedRecord;
    }

    if (relationField) draft.dynamicData[relationField] = '';
    delete linkedEntities[resolvedField];
    return null;
  }

  function hydratePracticeLinkedEntities(state, source) {
    const practice = source && typeof source === 'object' ? source : {};
    const linked = {};
    const dynamicData = practice.dynamicData && typeof practice.dynamicData === 'object' ? practice.dynamicData : {};
    const existing = practice.linkedEntities && typeof practice.linkedEntities === 'object' ? practice.linkedEntities : {};
    const defs = allDefinitions();

    Object.values(defs).forEach((def) => {
      if (!def || !def.structured) return;
      (def.fieldNames || []).forEach((fieldName) => {
        const relationField = getRelationFieldName(fieldName);
        const relationId = fieldName === 'clientName'
          ? cleanText(practice.clientId || practice.linkedClientId || existing.clientName?.recordId || '')
          : cleanText(dynamicData[relationField] || practice[relationField] || existing[fieldName]?.recordId || '');
        const fieldValue = fieldName === 'clientName'
          ? cleanText(practice.clientName || practice.client || existing.clientName?.value || '')
          : cleanText(dynamicData[fieldName] || practice[fieldName] || existing[fieldName]?.value || '');

        let snapshot = null;
        if (relationId) {
          const record = getEntityRecordById(state, def.key, relationId);
          if (record) snapshot = buildRelationSnapshot(def.key, record, fieldName);
        }
        if (!snapshot && fieldValue) {
          const record = findStructuredEntityRecordByValue(state, def.key, fieldValue);
          if (record) snapshot = buildRelationSnapshot(def.key, record, fieldName);
        }
        if (!snapshot) {
          snapshot = sanitizeRelationSnapshot(existing[fieldName], { fieldName, entityKey: def.key, value: fieldValue, recordId: relationId });
        }
        if (snapshot) linked[fieldName] = snapshot;
      });
    });

    return linked;
  }

  function getEntityRecordById(state, entityKey, recordId) {
    if (!recordId) return null;
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def) return null;

    if (entityKey === 'client') {
      const match = (Array.isArray(state.clients) ? state.clients : []).find((item) => cleanText(item.id) === cleanText(recordId));
      return match ? normalizeBusinessRecord(match) : null;
    }

    if (def.structured) {
      seedStructuredEntityRecords(state, entityKey);
      const match = ensureRecordStore(state, entityKey).find((item) => cleanText(item.id) === cleanText(recordId));
      return match ? normalizeBusinessRecord(match) : null;
    }

    const entries = listEntityRecords(state, entityKey);
    return entries.find((entry) => cleanText(entry.id) === cleanText(recordId))?.record || null;
  }

  function saveDirectoryEntity(state, entityKey, payload = {}) {
    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def || def.storageType !== 'directory') return { ok: false, reason: 'invalid-entity' };
    const value = cleanText(entityKey === 'taric' ? String(payload.value || '').replace(/\s+/g, '') : payload.value);
    if (!value) return { ok: false, reason: 'missing-value' };
    const draft = { id: cleanText(payload.id), value, description: cleanText(payload.description), city: cleanText(payload.city) };
    const directory = ensureDirectory(state, def.directoryKey);
    const currentIndex = draft.id ? directory.findIndex((_, index) => `${entityKey}-${index}` === draft.id) : -1;
    const duplicateIndex = directory.findIndex((entry, index) => {
      if (index === currentIndex) return false;
      const candidate = normalizeDirectoryRecord(entityKey, entry, `${entityKey}-${index}`);
      return candidate && cleanUpper(candidate.value) === cleanUpper(draft.value);
    });
    if (duplicateIndex >= 0) {
      const existing = normalizeDirectoryRecord(entityKey, directory[duplicateIndex], `${entityKey}-${duplicateIndex}`);
      return { ok: true, created: false, updated: false, duplicate: true, value: existing.value, relatedId: existing.id, record: existing };
    }

    const storedEntry = buildDirectoryStoredEntry(def, draft);
    if (!storedEntry) return { ok: false, reason: 'missing-value' };
    if (currentIndex >= 0) directory[currentIndex] = storedEntry;
    else directory.push(storedEntry);
    const finalIndex = currentIndex >= 0 ? currentIndex : directory.length - 1;
    const record = normalizeDirectoryRecord(entityKey, directory[finalIndex], `${entityKey}-${finalIndex}`);
    return { ok: true, created: currentIndex < 0, updated: currentIndex >= 0, value: record.value, relatedId: record.id, record };
  }

  function syncDraftRelationField({ state, draft, fieldName, value }) {
    const entityKey = resolveEntityKeyForField(fieldName);
    if (!entityKey || !draft) return null;
    return applyLinkedRecordToDraft({ state, draft, fieldName, entityKey, value });
  }

  function getLinkedRecordFromDraft({ state, draft, fieldName }) {
    if (!draft) return null;
    const entityKey = resolveEntityKeyForField(fieldName);
    if (!entityKey) return null;

    if (entityKey === 'client' || fieldName === 'clientName') {
      const relationId = cleanText(draft.clientId || draft.linkedClientId || '');
      if (relationId) {
        const record = getEntityRecordById(state, 'client', relationId);
        if (record) return record;
      }
      const snapshot = getLinkedSnapshotFromDraft({ draft, fieldName: 'clientName' });
      if (snapshot) return snapshot;
      return findStructuredEntityRecordByValue(state, 'client', draft.clientName || '') || null;
    }

    const relationField = getRelationFieldName(fieldName);
    const relationId = relationField && draft.dynamicData ? cleanText(draft.dynamicData[relationField]) : '';
    if (relationId) {
      const record = getEntityRecordById(state, entityKey, relationId);
      if (record) return record;
    }

    const snapshot = getLinkedSnapshotFromDraft({ draft, fieldName });
    if (snapshot) return snapshot;

    const defs = allDefinitions();
    const def = defs[entityKey];
    if (!def || !def.structured) return null;
    const fieldValue = draft.dynamicData && typeof draft.dynamicData === 'object' ? draft.dynamicData[fieldName] : '';
    return findStructuredEntityRecordByValue(state, entityKey, fieldValue || '') || null;
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
    getEntityRecordById,
    saveBusinessEntity,
    saveDirectoryEntity,
    syncDraftRelationField,
    getLinkedRecordFromDraft,
    getLinkedSnapshotFromDraft,
    applyLinkedRecordToDraft,
    buildRelationSnapshot,
    hydratePracticeLinkedEntities,
    buildEntityDisplayValue,
    normalizeBusinessRecord,
    findStructuredEntityRecordByValue,
    findStructuredEntityRecordByVat,
    isStructuredEntityKey
  };
})();
