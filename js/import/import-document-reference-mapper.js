window.KedrixOneImportDocumentReferenceMapper = (() => {
  'use strict';

  const ImportMapper = window.KedrixOneImportMapper || null;
  const DocumentCategories = window.KedrixOneDocumentCategories || null;

  const FIELD_DEFS = [
    { name: 'practiceReference', labelFallback: 'Practice reference', required: false, aliases: ['practice reference', 'numero pratica', 'pratica', 'reference', 'rif pratica', 'practice no', 'practice number'] },
    { name: 'practiceId', labelFallback: 'Practice ID', required: false, aliases: ['practice id', 'id pratica', 'id'] },
    { name: 'attachmentOwnerKey', labelFallback: 'Owner key', required: false, aliases: ['owner key', 'attachment owner key', 'chiave owner', 'owner'] },
    { name: 'documentType', labelFallback: 'Document type', required: true, aliases: ['document type', 'tipo documento', 'tipo', 'category', 'categoria documento'] },
    { name: 'documentLabel', labelFallback: 'Document label', required: false, aliases: ['document label', 'nome documento', 'titolo documento', 'label', 'file name', 'nome file'] },
    { name: 'documentDate', labelFallback: 'Document date', required: false, aliases: ['document date', 'data documento', 'date'] },
    { name: 'externalReference', labelFallback: 'Document reference', required: false, aliases: ['document reference', 'rif documento', 'external reference', 'invoice number', 'packing list', 'reference number'] },
    { name: 'customsMrn', labelFallback: 'MRN / customs ref.', required: false, aliases: ['mrn', 'customs mrn', 'rif doganale', 'customs ref', 'customs reference'] },
    { name: 'tags', labelFallback: 'Tags', required: false, aliases: ['tags', 'tag', 'labels', 'etichette'] },
    { name: 'notes', labelFallback: 'Notes', required: false, aliases: ['notes', 'note', 'remarks', 'remark'] }
  ];

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

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

  function buildSchema(i18n) {
    return FIELD_DEFS.map((field) => ({
      ...field,
      label: t(i18n, `ui.importDocRefField${field.name.charAt(0).toUpperCase()}${field.name.slice(1)}`, field.labelFallback)
    }));
  }

  function buildDocumentTypeAliases(state, i18n) {
    const options = DocumentCategories && typeof DocumentCategories.getOptions === 'function'
      ? DocumentCategories.getOptions(state || {}, i18n)
      : [];
    const aliasMap = {};
    options.forEach((option) => {
      if (!option || !option.value) return;
      aliasMap[option.value] = [option.value, option.label];
    });
    return aliasMap;
  }

  function enrichSchema(schema, state, i18n) {
    const aliasMap = buildDocumentTypeAliases(state, i18n);
    return schema.map((field) => {
      if (field.name !== 'documentType') return field;
      const optionAliases = Object.values(aliasMap).flat();
      return {
        ...field,
        aliases: [...(field.aliases || []), ...optionAliases]
      };
    });
  }

  function buildRowsFromMatrix(matrix, headerRow) {
    return ImportMapper && typeof ImportMapper.buildRowsFromMatrix === 'function'
      ? ImportMapper.buildRowsFromMatrix(matrix, headerRow)
      : { headers: [], rows: [] };
  }

  function suggestMapping(headers, schema) {
    return ImportMapper && typeof ImportMapper.suggestMapping === 'function'
      ? ImportMapper.suggestMapping(headers, schema)
      : {};
  }

  function normalizeMappedRows(rawRows, schema, mapping) {
    return ImportMapper && typeof ImportMapper.normalizeMappedRows === 'function'
      ? ImportMapper.normalizeMappedRows(rawRows, schema, mapping)
      : [];
  }

  function canonicalizeDocumentType(rawValue, state, i18n) {
    const options = DocumentCategories && typeof DocumentCategories.getOptions === 'function'
      ? DocumentCategories.getOptions(state || {}, i18n)
      : [];
    const normalizedValue = normalizeToken(rawValue);
    const matched = options.find((option) => {
      const aliases = [option.value, option.label].map(normalizeToken).filter(Boolean);
      return aliases.includes(normalizedValue);
    });
    return matched ? matched.value : cleanText(rawValue);
  }

  return {
    buildSchema,
    enrichSchema,
    buildRowsFromMatrix,
    suggestMapping,
    normalizeMappedRows,
    canonicalizeDocumentType
  };
})();
