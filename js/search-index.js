window.KedrixOneSearchIndex = (() => {
  'use strict';

  const Utils = window.KedrixOneUtils;

  const BASE_FIELD_DEFS = [
    { key: 'reference', label: 'Numero pratica', weight: 140, getter: (practice) => practice.reference },
    { key: 'id', label: 'ID', weight: 95, getter: (practice) => practice.id },
    { key: 'clientName', label: 'Cliente', weight: 135, getter: (practice) => practice.clientName || practice.client },
    { key: 'containerCode', label: 'Container', weight: 125, getter: (practice) => practice.containerCode },
    { key: 'booking', label: 'Booking', weight: 120, getter: (practice) => practice.booking },
    { key: 'mbl', label: 'MBL', weight: 118, getter: (practice) => practice.mbl },
    { key: 'hbl', label: 'HBL', weight: 118, getter: (practice) => practice.hbl },
    { key: 'mawb', label: 'MAWB', weight: 118, getter: (practice) => practice.mawb },
    { key: 'hawb', label: 'HAWB', weight: 118, getter: (practice) => practice.hawb },
    { key: 'cmr', label: 'CMR', weight: 118, getter: (practice) => practice.cmr },
    { key: 'terminal', label: 'Terminal', weight: 85, getter: (practice) => practice.terminal },
    { key: 'goodsDescription', label: 'Merce', weight: 60, getter: (practice) => practice.goodsDescription },
    { key: 'portLoading', label: 'Partenza', weight: 70, getter: (practice) => practice.portLoading },
    { key: 'portDischarge', label: 'Arrivo', weight: 75, getter: (practice) => practice.portDischarge },
    { key: 'customsOffice', label: 'Dogana', weight: 70, getter: (practice) => practice.customsOffice }
  ];

  const DYNAMIC_FIELD_LABELS = {
    bl: 'BL',
    hbl: 'HBL',
    mbl: 'MBL',
    billOfLading: 'BL',
    awb: 'AWB',
    mawb: 'MAWB',
    hawb: 'HAWB',
    cmr: 'CMR',
    cmrNumber: 'CMR',
    booking: 'Booking',
    containerCode: 'Container',
    pickupPlace: 'Ritiro',
    deliveryPlace: 'Consegna',
    terminal: 'Terminal',
    terminalPickup: 'Terminal ritiro',
    terminalDelivery: 'Terminal consegna',
    deposit: 'Deposito',
    movementDirection: 'Movimento',
    airportDeparture: 'Aeroporto partenza',
    airportDestination: 'Aeroporto arrivo',
    portLoading: 'Porto imbarco',
    portDischarge: 'Porto sbarco',
    consignee: 'Destinatario',
    importer: 'Importatore',
    shipper: 'Speditore',
    customsOffice: 'Dogana',
    customsSection: 'Sezione doganale',
    baseQuotation: 'Quotazione',
    policyNumber: 'Polizza',
    transporter: 'Trasportatore',
    bolla: 'Bolla',
    foreignInvoice: 'Fatt. estera',
    invoiceAmount: 'Importo fattura',
    additionalReference: 'Rif. aggiuntivo',
    deliveryCity: 'Città consegna',
    tags: 'Tags',
    originRef: 'Origine',
    destinationRef: 'Destinazione'
  };

  const DYNAMIC_FIELD_REGEX = /(booking|container|bl|bill|lading|awb|mawb|hawb|cmr|client|consignee|shipper|sender|importer|port|terminal|airport|deposit|pickup|delivery|customs|reference|quotation|policy|origin|destination|lot|vehicle|carrier|transport|movement|invoice|bolla|city|fumig|tag)/i;

  function normalize(value) {
    return Utils && typeof Utils.normalize === 'function'
      ? Utils.normalize(value)
      : String(value || '').trim().toUpperCase();
  }

  function makeField(key, label, value, weight) {
    const text = String(value || '').trim();
    if (!text) return null;
    return {
      key,
      label,
      value: text,
      normalized: normalize(text),
      weight: Number(weight || 50)
    };
  }

  function collectDynamicFields(practice) {
    const dynamicData = practice && practice.dynamicData && typeof practice.dynamicData === 'object'
      ? practice.dynamicData
      : {};

    return Object.entries(dynamicData).flatMap(([key, value]) => {
      if (!DYNAMIC_FIELD_REGEX.test(key)) return [];
      if (Array.isArray(value)) value = value.join(', ');
      const text = String(value || '').trim();
      if (!text) return [];
      const label = DYNAMIC_FIELD_LABELS[key] || key;
      return [makeField(key, label, text, 80)];
    }).filter(Boolean);
  }

  function buildEntry(practice) {
    const baseFields = BASE_FIELD_DEFS
      .map((definition) => makeField(definition.key, definition.label, definition.getter(practice), definition.weight))
      .filter(Boolean);

    const dynamicFields = collectDynamicFields(practice);
    const fieldMap = new Map();

    [...baseFields, ...dynamicFields].forEach((field) => {
      const dedupeKey = `${field.key}:${field.normalized}`;
      if (!fieldMap.has(dedupeKey)) fieldMap.set(dedupeKey, field);
    });

    const fields = Array.from(fieldMap.values());
    const searchableText = fields.map((field) => field.normalized).join(' ');

    return {
      practiceId: practice.id,
      reference: practice.reference || practice.id || '—',
      clientName: practice.clientName || practice.client || '—',
      practiceType: practice.practiceType || '',
      practiceTypeLabel: practice.practiceTypeLabel || practice.practiceType || '—',
      status: practice.status || '—',
      category: practice.category || '—',
      practiceDate: practice.practiceDate || practice.eta || '',
      fields,
      searchableText
    };
  }

  function buildIndex(practices) {
    return Array.isArray(practices) ? practices.map(buildEntry) : [];
  }

  function updateIndex(practices) {
    return buildIndex(practices);
  }

  function computeFieldScore(field, tokens, normalizedQuery) {
    let score = 0;
    const matches = [];

    if (normalizedQuery && field.normalized.includes(normalizedQuery)) {
      score += field.weight + 35;
      matches.push(normalizedQuery);
    }

    tokens.forEach((token) => {
      if (!token) return;
      if (field.normalized === token) {
        score += field.weight + 30;
        matches.push(token);
      } else if (field.normalized.startsWith(token)) {
        score += field.weight + 18;
        matches.push(token);
      } else if (field.normalized.includes(token)) {
        score += field.weight + 10;
        matches.push(token);
      }
    });

    return { score, matches: Array.from(new Set(matches)) };
  }

  function parseDateWeight(value) {
    const parsed = Date.parse(value || '');
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function search(query, index) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const workingIndex = Array.isArray(index) ? index : [];

    return workingIndex.map((entry) => {
      if (!tokens.every((token) => entry.searchableText.includes(token))) return null;

      const rankedFields = entry.fields.map((field) => {
        const ranking = computeFieldScore(field, tokens, normalizedQuery);
        return { ...field, score: ranking.score, matchedTokens: ranking.matches };
      }).filter((field) => field.score > 0);

      if (!rankedFields.length) return null;

      rankedFields.sort((left, right) => right.score - left.score || right.weight - left.weight || left.label.localeCompare(right.label));
      const score = rankedFields.reduce((acc, field) => acc + field.score, 0);

      return {
        practiceId: entry.practiceId,
        reference: entry.reference,
        clientName: entry.clientName,
        practiceType: entry.practiceType,
        practiceTypeLabel: entry.practiceTypeLabel,
        status: entry.status,
        category: entry.category,
        practiceDate: entry.practiceDate,
        score,
        matches: rankedFields.slice(0, 4).map((field) => ({
          label: field.label,
          value: field.value,
          score: field.score
        }))
      };
    }).filter(Boolean).sort((left, right) => right.score - left.score || parseDateWeight(right.practiceDate) - parseDateWeight(left.practiceDate));
  }

  return {
    buildIndex,
    updateIndex,
    search
  };
})();
