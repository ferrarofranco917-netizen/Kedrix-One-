window.KedrixOnePracticeOverview = (() => {
  'use strict';

  const PracticeFieldRelations = window.KedrixOnePracticeFieldRelations;
  const LinkedPartiesBoard = window.KedrixOneLinkedPartiesBoard;
  const PracticeReadinessBoard = window.KedrixOnePracticeReadinessBoard;
  const PracticeDocumentReadinessBoard = window.KedrixOnePracticeDocumentReadinessBoard;

  function escape(utils, value) {
    return utils && typeof utils.escapeHtml === 'function'
      ? utils.escapeHtml(String(value || ''))
      : String(value || '');
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function getDynamicValue(draft, fieldNames = []) {
    const dynamicData = draft && draft.dynamicData && typeof draft.dynamicData === 'object' ? draft.dynamicData : {};
    for (const fieldName of fieldNames) {
      const value = dynamicData[fieldName];
      if (Array.isArray(value) && value.length) return value.join(', ');
      if (value && typeof value === 'object') {
        const nested = [value.displayValue, value.label, value.value, value.name, value.code].find((entry) => String(entry || '').trim());
        if (nested) return nested;
      }
      if (String(value || '').trim()) return value;
    }
    return '';
  }

  function joinParts(parts = [], separator = ' · ') {
    return parts.map((item) => String(item || '').trim()).filter(Boolean).join(separator);
  }

  function buildSummaryCards(state, draft, type, companyConfig, i18n) {
    const practiceType = String(draft?.practiceType || '').trim();
    const relationSummary = PracticeFieldRelations && typeof PracticeFieldRelations.buildCoverageSummary === 'function'
      ? PracticeFieldRelations.buildCoverageSummary({ state, type: type || practiceType, draft, companyConfig })
      : null;

    const relationValue = relationSummary
      ? `${relationSummary.linked}/${relationSummary.total} ${t(i18n, 'ui.practiceOverviewRelationsLinked', 'collegati')} · ${relationSummary.manual} ${t(i18n, 'ui.practiceOverviewRelationsManual', 'manuali')}`
      : '';

    const cards = [
      {
        key: 'parties',
        label: t(i18n, 'ui.practiceOverviewParties', 'Soggetti collegati'),
        value: joinParts([
          getDynamicValue(draft, ['importer', 'shipper', 'client']),
          getDynamicValue(draft, ['consignee']),
          getDynamicValue(draft, ['sender', 'correspondent'])
        ])
      },
      {
        key: 'route',
        label: t(i18n, 'ui.practiceOverviewRoute', 'Nodi logistici'),
        value: joinParts([
          getDynamicValue(draft, ['portLoading', 'airportDeparture', 'originRef', 'pickupPlace']),
          getDynamicValue(draft, ['portDischarge', 'airportDestination', 'destinationRef', 'deliveryPlace'])
        ], ' → ')
      },
      {
        key: 'transport',
        label: t(i18n, 'ui.practiceOverviewTransport', 'Trasporto / unità'),
        value: joinParts([
          getDynamicValue(draft, ['containerCode']),
          getDynamicValue(draft, ['transportUnitType']),
          getDynamicValue(draft, ['vesselVoyage', 'airline', 'carrier', 'vehicleType'])
        ])
      },
      {
        key: 'customsEconomics',
        label: t(i18n, 'ui.practiceOverviewCustomsEconomics', 'Dogana + economico'),
        value: joinParts([
          getDynamicValue(draft, ['customsOffice']),
          getDynamicValue(draft, ['incoterm']),
          getDynamicValue(draft, ['invoiceAmount', 'freightAmount'])
        ])
      },
      {
        key: 'documents',
        label: t(i18n, 'ui.practiceOverviewDocuments', 'Rif. documentali'),
        value: joinParts([
          getDynamicValue(draft, ['booking']),
          getDynamicValue(draft, ['policyNumber', 'mawb', 'cmr']),
          getDynamicValue(draft, ['hbl', 'hawb'])
        ])
      },
      {
        key: 'notes',
        label: t(i18n, 'ui.practiceOverviewNotes', 'Nota rapida'),
        value: String(getDynamicValue(draft, ['internalNotes', 'additionalReference', 'tags']) || '').trim()
      },
      {
        key: 'relations',
        label: t(i18n, 'ui.practiceOverviewRelations', 'Campi relazionali'),
        value: relationValue
      }
    ];

    return cards
      .map((card) => ({
        ...card,
        value: String(card.value || '').trim() || t(i18n, 'ui.practiceOverviewNoData', 'Nessun dato rilevante ancora inserito')
      }))
      .filter((card) => card.value || practiceType);
  }


  function practiceTypeLabel(practiceType, i18n) {
    const keyMap = {
      sea_import: ['ui.typeSeaImport', 'Sea Import'],
      sea_export: ['ui.typeSeaExport', 'Sea Export'],
      air_import: ['ui.typeAirImport', 'Air Import'],
      air_export: ['ui.typeAirExport', 'Air Export'],
      road_import: ['ui.typeRoadImport', 'Road Import'],
      road_export: ['ui.typeRoadExport', 'Road Export'],
      warehouse: ['ui.typeWarehouse', 'Warehouse']
    };
    const entry = keyMap[String(practiceType || '').trim()] || null;
    return entry ? t(i18n, entry[0], entry[1]) : String(practiceType || '').trim();
  }

  function buildBadges(draft, i18n) {
    return [
      draft?.status ? { kind: 'info', value: draft.status } : null,
      draft?.practiceType ? { kind: 'info', value: practiceTypeLabel(draft.practiceType, i18n) } : null,
      draft?.category ? { kind: 'default', value: draft.category } : null,
      draft?.practiceDate ? { kind: 'default', value: draft.practiceDate } : null
    ].filter(Boolean);
  }

  function render(options = {}) {
    const { draft = {}, i18n, utils } = options;
    if (!draft || !String(draft.practiceType || '').trim()) return '';

    const reference = String(draft.generatedReference || '').trim() || '—';
    const clientName = String(draft.clientName || '').trim() || t(i18n, 'ui.clientRequired', 'Cliente');
    const cards = buildSummaryCards(options.state || null, draft, options.type, options.companyConfig, i18n);
    const badges = buildBadges(draft, i18n);
    const readinessBoardHtml = PracticeReadinessBoard && typeof PracticeReadinessBoard.render === 'function'
      ? PracticeReadinessBoard.render({ state: options.state || null, draft, type: options.type, companyConfig: options.companyConfig, i18n, utils })
      : '';
    const practiceDocumentReadinessHtml = PracticeDocumentReadinessBoard && typeof PracticeDocumentReadinessBoard.render === 'function'
      ? PracticeDocumentReadinessBoard.render({ state: options.state || null, draft, type: options.type, companyConfig: options.companyConfig, i18n, utils })
      : '';
    const linkedPartiesBoardHtml = LinkedPartiesBoard && typeof LinkedPartiesBoard.render === 'function'
      ? LinkedPartiesBoard.render({ state: options.state || null, draft, type: options.type, companyConfig: options.companyConfig, i18n, utils })
      : '';

    return `
      <section class="practice-overview-shell" data-practice-overview>
        <div class="practice-overview-head">
          <div>
            <div class="practice-overview-kicker">${escape(utils, t(i18n, 'ui.practiceOverviewKicker', 'Overview operativa'))}</div>
            <h4 class="practice-overview-title">${escape(utils, reference)}</h4>
            <p class="practice-overview-subtitle">${escape(utils, clientName)}</p>
          </div>
          <div class="practice-overview-badges">
            ${badges.map((badge) => `<span class="badge ${badge.kind === 'info' ? 'info' : ''}">${escape(utils, badge.value)}</span>`).join('')}
          </div>
        </div>
        ${readinessBoardHtml}
        ${practiceDocumentReadinessHtml}
        ${linkedPartiesBoardHtml}
        <div class="practice-overview-grid">
          ${cards.map((card) => `
            <article class="practice-overview-card" data-overview-key="${escape(utils, card.key)}">
              <div class="practice-overview-card-label">${escape(utils, card.label)}</div>
              <div class="practice-overview-card-value">${escape(utils, card.value)}</div>
            </article>`).join('')}
        </div>
      </section>`;
  }

  return {
    render
  };
})();
