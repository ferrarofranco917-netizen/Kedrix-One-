window.KedrixOneImportMapper = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

  const TARGET_KEYS = [
    'client',
    'importer',
    'consignee',
    'sender',
    'supplier',
    'carrier',
    'shippingCompany',
    'airline',
    'seaPort',
    'airport',
    'terminal',
    'origin',
    'destination',
    'logisticsLocation',
    'deposit',
    'warehouseLink',
    'customsOffice',
    'transportUnitType'
  ];

  const ALIASES = {
    value: ['ragione sociale', 'company', 'company name', 'cliente', 'client', 'name', 'nome', 'supplier', 'fornitore', 'carrier', 'vettore', 'port', 'porto', 'airport', 'aeroporto', 'terminal', 'origine', 'origin', 'destination', 'destinazione', 'location', 'localita', 'località', 'deposito', 'warehouse link', 'collega a', 'dogana', 'customs office', 'transport unit', 'tipo unita'],
    shortName: ['nome breve', 'short name', 'alias'],
    code: ['codice', 'internal code', 'customer code', 'supplier code', 'codice interno'],
    vatNumber: ['partita iva', 'p iva', 'p.iva', 'vat', 'vat number', 'iva'],
    taxCode: ['codice fiscale', 'tax code'],
    address: ['indirizzo', 'address', 'street'],
    zipCode: ['cap', 'zip', 'zip code', 'postal code'],
    city: ['citta', 'città', 'city', 'locality'],
    province: ['provincia', 'province', 'state'],
    country: ['nazione', 'paese', 'country'],
    email: ['email', 'mail', 'e-mail'],
    phone: ['telefono', 'phone', 'mobile'],
    pec: ['pec'],
    sdiCode: ['sdi', 'codice sdi', 'sdi code'],
    notes: ['note', 'notes', 'remark', 'remarks'],
    active: ['attivo', 'active', 'enabled'],
    description: ['descrizione', 'description', 'desc']
  };

  function cleanText(value) {
    return String(value || '').trim();
  }

  function normalizeToken(value) {
    return cleanText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function getTargetOptions(i18n) {
    if (!MasterDataEntities || typeof MasterDataEntities.getEntityDefinitions !== 'function') return [];
    const defs = MasterDataEntities.getEntityDefinitions(i18n);
    return TARGET_KEYS
      .map((key) => defs[key])
      .filter(Boolean)
      .map((def) => ({
        key: def.key,
        label: def.familyLabel || def.key,
        structured: Boolean(def.structured),
        storageType: def.storageType || 'directory'
      }));
  }

  function buildDirectorySchema(def, i18n) {
    const fields = [
      {
        name: 'value',
        label: def.valueLabel || def.singleLabel || t(i18n, 'ui.importValueField', 'Valore'),
        required: true,
        aliases: [def.valueLabel, def.singleLabel, ...(ALIASES.value || [])]
      }
    ];
    if (def.supportsDescription) {
      fields.push({ name: 'description', label: t(i18n, 'ui.masterDataDescription', 'Descrizione'), required: false, aliases: ALIASES.description || [] });
    }
    if (def.supportsCity) {
      fields.push({ name: 'city', label: t(i18n, 'ui.city', 'Città'), required: false, aliases: ALIASES.city || [] });
    }
    return fields;
  }

  function buildSchema(entityKey, i18n) {
    if (!MasterDataEntities || typeof MasterDataEntities.getEntityDefinitions !== 'function') return [];
    const defs = MasterDataEntities.getEntityDefinitions(i18n);
    const def = defs[entityKey];
    if (!def) return [];
    if (def.structured && typeof MasterDataEntities.getFormFields === 'function') {
      return MasterDataEntities.getFormFields(entityKey, i18n).map((field) => ({
        ...field,
        aliases: [field.label, ...(ALIASES[field.name] || [])]
      }));
    }
    return buildDirectorySchema(def, i18n);
  }

  function buildRowsFromMatrix(matrix, headerRow) {
    const normalizedMatrix = Array.isArray(matrix) ? matrix.filter((row) => Array.isArray(row)) : [];
    const rowIndex = Math.max(0, Number(headerRow || 1) - 1);
    const headers = (normalizedMatrix[rowIndex] || []).map((value, index) => cleanText(value) || `column_${index + 1}`);
    const rows = normalizedMatrix.slice(rowIndex + 1)
      .map((row, offset) => {
        const cells = headers.reduce((acc, header, index) => {
          acc[header] = cleanText(row[index]);
          return acc;
        }, {});
        const hasValue = Object.values(cells).some((value) => cleanText(value));
        return hasValue ? { rowNumber: rowIndex + offset + 2, cells } : null;
      })
      .filter(Boolean);
    return { headers, rows };
  }

  function suggestMapping(headers, schema) {
    const availableHeaders = Array.isArray(headers) ? headers.slice() : [];
    const usedHeaders = new Set();
    const mapping = {};
    schema.forEach((field) => {
      const fieldTokens = [field.name, field.label, ...(field.aliases || [])].map(normalizeToken).filter(Boolean);
      let matchedHeader = '';
      availableHeaders.some((header) => {
        const headerToken = normalizeToken(header);
        if (!headerToken || usedHeaders.has(header)) return false;
        const exact = fieldTokens.some((token) => token === headerToken);
        const contains = fieldTokens.some((token) => token && (headerToken.includes(token) || token.includes(headerToken)));
        if (exact || contains) {
          matchedHeader = header;
          return true;
        }
        return false;
      });
      if (matchedHeader) {
        mapping[field.name] = matchedHeader;
        usedHeaders.add(matchedHeader);
      }
    });
    return mapping;
  }

  function normalizeBoolean(value) {
    const normalized = normalizeToken(value);
    if (!normalized) return true;
    return !['0', 'false', 'no', 'non', 'inactive', 'disabled'].includes(normalized);
  }

  function normalizeMappedRows(rawRows, schema, mapping) {
    return (Array.isArray(rawRows) ? rawRows : []).map((row) => {
      const normalized = schema.reduce((acc, field) => {
        const sourceHeader = mapping[field.name] || '';
        const rawValue = sourceHeader ? row.cells?.[sourceHeader] : '';
        acc[field.name] = field.type === 'checkbox' ? normalizeBoolean(rawValue) : cleanText(rawValue);
        return acc;
      }, {});
      return {
        rowNumber: row.rowNumber,
        values: normalized,
        source: row.cells || {}
      };
    });
  }

  return {
    getTargetOptions,
    buildSchema,
    buildRowsFromMatrix,
    suggestMapping,
    normalizeMappedRows
  };
})();
