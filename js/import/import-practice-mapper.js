window.KedrixOneImportPracticeMapper = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;

  const PRACTICE_TYPES = [
    { key: 'sea_import', labelKey: 'ui.typeSeaImport', fallback: 'Mare Import' },
    { key: 'sea_export', labelKey: 'ui.typeSeaExport', fallback: 'Mare Export' },
    { key: 'air_import', labelKey: 'ui.typeAirImport', fallback: 'Aerea Import' },
    { key: 'air_export', labelKey: 'ui.typeAirExport', fallback: 'Aerea Export' },
    { key: 'road_import', labelKey: 'ui.typeRoadImport', fallback: 'Terra Import' },
    { key: 'road_export', labelKey: 'ui.typeRoadExport', fallback: 'Terra Export' },
    { key: 'warehouse', labelKey: 'ui.typeWarehouse', fallback: 'Magazzino' }
  ];

  function cleanText(value) {
    return String(value || '').trim();
  }

  function normalizeToken(value) {
    return cleanText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function buildAliases(field, i18n) {
    const label = i18n && typeof i18n.t === 'function'
      ? i18n.t(field.labelKey || '', field.label || field.name || '')
      : (field.label || field.name || '');
    const aliases = [
      field.name,
      label,
      ...(Array.isArray(field.aliases) ? field.aliases : [])
    ];
    return aliases.map(normalizeToken).filter(Boolean);
  }

  function getTargetOptions(i18n) {
    return PRACTICE_TYPES.map((item) => ({
      key: item.key,
      label: i18n && typeof i18n.t === 'function' ? i18n.t(item.labelKey, item.fallback) : item.fallback
    }));
  }

  function buildBaseSchema(i18n) {
    return [
      {
        name: 'reference',
        label: i18n && typeof i18n.t === 'function' ? i18n.t('ui.importPracticeReference', 'Riferimento pratica') : 'Riferimento pratica',
        required: false,
        type: 'text',
        tab: 'identity',
        aliases: ['reference', 'riferimento', 'practice reference', 'ref', 'numero pratica']
      },
      {
        name: 'clientName',
        label: i18n && typeof i18n.t === 'function' ? i18n.t('ui.clientEditable', 'Cliente') : 'Cliente',
        required: true,
        type: 'text',
        tab: 'identity',
        aliases: ['cliente', 'client', 'customer', 'ragione sociale cliente']
      },
      {
        name: 'practiceDate',
        label: i18n && typeof i18n.t === 'function' ? i18n.t('ui.practiceDate', 'Data pratica') : 'Data pratica',
        required: true,
        type: 'date',
        tab: 'identity',
        aliases: ['data pratica', 'practice date', 'date', 'created at']
      },
      {
        name: 'category',
        label: i18n && typeof i18n.t === 'function' ? i18n.t('ui.categoryLabel', 'Categoria') : 'Categoria',
        required: true,
        type: 'select',
        tab: 'identity',
        aliases: ['categoria', 'category', 'flow category']
      },
      {
        name: 'status',
        label: i18n && typeof i18n.t === 'function' ? i18n.t('ui.status', 'Stato') : 'Stato',
        required: false,
        type: 'select',
        tab: 'identity',
        aliases: ['stato', 'status', 'practice status']
      }
    ];
  }

  function buildSchema(targetType, i18n) {
    const baseSchema = buildBaseSchema(i18n);
    const fields = PracticeSchemas && typeof PracticeSchemas.getFields === 'function'
      ? PracticeSchemas.getFields(targetType)
      : [];

    const dynamicFields = fields
      .filter((field) => field && field.type !== 'derived' && field.type !== 'select-derived')
      .map((field) => ({
        name: field.name,
        label: i18n && typeof i18n.t === 'function' ? i18n.t(field.labelKey, field.name || '') : (field.name || ''),
        required: Boolean(field.required),
        type: field.type || 'text',
        tab: field.tab || 'practice',
        field,
        aliases: [field.name]
      }));

    return [...baseSchema, ...dynamicFields];
  }

  function buildRowsFromMatrix(matrix, headerRowNumber = 1) {
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const headerIndex = Math.max(0, Number(headerRowNumber || 1) - 1);
    const headers = (safeMatrix[headerIndex] || []).map((value, index) => cleanText(value) || `Column ${index + 1}`);
    const rows = safeMatrix.slice(headerIndex + 1)
      .map((cells, rowOffset) => ({
        rowNumber: headerIndex + rowOffset + 2,
        cells: headers.reduce((acc, header, cellIndex) => {
          acc[header] = cleanText((cells || [])[cellIndex]);
          return acc;
        }, {})
      }))
      .filter((row) => Object.values(row.cells).some((value) => cleanText(value)));

    return { headers, rows };
  }

  function suggestMapping(headers, schema, i18n) {
    const usedHeaders = new Set();
    const mapping = {};
    const normalizedHeaders = headers.map((header) => ({ header, token: normalizeToken(header) }));

    schema.forEach((field) => {
      const fieldTokens = buildAliases(field, i18n);
      let matchedHeader = '';
      normalizedHeaders.some(({ header, token }) => {
        if (usedHeaders.has(header) || !token) return false;
        const exact = fieldTokens.some((fieldToken) => fieldToken === token);
        const contains = fieldTokens.some((fieldToken) => fieldToken && (token.includes(fieldToken) || fieldToken.includes(token)));
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

  function normalizeCellValue(field, rawValue) {
    const value = cleanText(rawValue);
    if (!field) return value;
    if (field.type === 'checkbox-group') {
      return value
        ? value.split(/[,;|]/).map((item) => cleanText(item)).filter(Boolean)
        : [];
    }
    return value;
  }

  function normalizeMappedRows(rawRows, schema, mapping) {
    return (Array.isArray(rawRows) ? rawRows : []).map((row) => {
      const values = schema.reduce((acc, field) => {
        const sourceHeader = mapping[field.name] || '';
        const rawValue = sourceHeader ? row.cells?.[sourceHeader] : '';
        acc[field.name] = normalizeCellValue(field, rawValue);
        return acc;
      }, {});
      return {
        rowNumber: row.rowNumber,
        values,
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
