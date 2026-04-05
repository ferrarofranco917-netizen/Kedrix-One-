window.KedrixOnePracticeReadinessBoard = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function escape(utils, value) {
    return utils && typeof utils.escapeHtml === 'function'
      ? utils.escapeHtml(String(value || ''))
      : String(value || '');
  }

  function text(value, fallback = '') {
    if (value === null || value === undefined) return String(fallback || '').trim();
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
    if (Array.isArray(value)) {
      return value.map((item) => text(item, '')).filter(Boolean).join(', ');
    }
    if (typeof value === 'object') {
      const candidates = [
        value.displayValue,
        value.label,
        value.value,
        value.name,
        value.shortName,
        value.code,
        value.city,
        value.id
      ];
      for (const candidate of candidates) {
        const resolved = text(candidate, '');
        if (resolved) return resolved;
      }
    }
    return String(fallback || '').trim();
  }

  function getSchemaFieldNames(type) {
    if (!PracticeSchemas || typeof PracticeSchemas.getSchema !== 'function') return new Set();
    const schema = PracticeSchemas.getSchema(type);
    const fields = Array.isArray(schema?.tabs?.practice) ? schema.tabs.practice : [];
    return new Set(fields.map((field) => String(field?.name || '').trim()).filter(Boolean));
  }

  function getValue(draft, fieldName) {
    if (!draft || !fieldName) return '';
    if (fieldName === 'client') {
      return text(draft?.dynamicData?.client, '') || text(draft.clientName, '');
    }
    if (fieldName === 'clientName') return text(draft.clientName, '');
    return text(draft?.dynamicData?.[fieldName], '');
  }

  function buildDefinitions(type) {
    const map = {
      sea_import: [
        {
          key: 'parties',
          titleKey: 'ui.practiceReadinessSectionParties',
          titleFallback: 'Soggetti essenziali',
          groups: [
            { labelKey: 'ui.clientRequired', labelFallback: 'Cliente', fieldNames: ['client', 'clientName'], required: true },
            { labelKey: 'ui.importer', labelFallback: 'Importatore', fieldNames: ['importer'], required: true },
            { labelKey: 'ui.consignee', labelFallback: 'Destinatario', fieldNames: ['consignee'], required: true },
            { labelKey: 'ui.sender', labelFallback: 'Mittente', fieldNames: ['sender', 'correspondent'], required: false }
          ]
        },
        {
          key: 'route',
          titleKey: 'ui.practiceReadinessSectionRoute',
          titleFallback: 'Nodi logistici',
          groups: [
            { labelKey: 'ui.portLoading', labelFallback: 'Origine', fieldNames: ['portLoading', 'originRef'], required: true },
            { labelKey: 'ui.portDischarge', labelFallback: 'Destinazione', fieldNames: ['portDischarge', 'destinationRef'], required: true },
            { labelKey: 'ui.terminal', labelFallback: 'Terminal', fieldNames: ['terminal'], required: false },
            { labelKey: 'ui.deposit', labelFallback: 'Deposito', fieldNames: ['deposit'], required: false }
          ]
        },
        {
          key: 'transport',
          titleKey: 'ui.practiceReadinessSectionTransport',
          titleFallback: 'Trasporto / tempi',
          groups: [
            { labelKey: 'ui.transportUnitType', labelFallback: 'Tipologia unità / trasporto', fieldNames: ['transportUnitType', 'containerCode'], required: true },
            { labelKey: 'ui.vesselVoyage', labelFallback: 'Nave / Viaggio', fieldNames: ['vesselVoyage'], required: true },
            { labelKey: 'ui.arrivalDate', labelFallback: 'Data arrivo', fieldNames: ['arrivalDate'], required: true },
            { labelKey: 'ui.containerCode', labelFallback: 'Container', fieldNames: ['containerCode'], required: false }
          ]
        },
        {
          key: 'documents',
          titleKey: 'ui.practiceReadinessSectionDocuments',
          titleFallback: 'Documenti / dogana',
          groups: [
            { labelKey: 'ui.booking', labelFallback: 'Booking', fieldNames: ['booking'], required: true },
            { labelKey: 'ui.policyNumber', labelFallback: 'Polizza', fieldNames: ['policyNumber', 'hbl'], required: true },
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ]
        }
      ],
      sea_export: [
        {
          key: 'parties',
          titleKey: 'ui.practiceReadinessSectionParties',
          titleFallback: 'Soggetti essenziali',
          groups: [
            { labelKey: 'ui.clientRequired', labelFallback: 'Cliente', fieldNames: ['client', 'clientName'], required: true },
            { labelKey: 'ui.shipper', labelFallback: 'Shipper', fieldNames: ['shipper'], required: true },
            { labelKey: 'ui.consignee', labelFallback: 'Destinatario', fieldNames: ['consignee'], required: true },
            { labelKey: 'ui.company', labelFallback: 'Compagnia', fieldNames: ['company'], required: false }
          ]
        },
        {
          key: 'route',
          titleKey: 'ui.practiceReadinessSectionRoute',
          titleFallback: 'Nodi logistici',
          groups: [
            { labelKey: 'ui.portLoading', labelFallback: 'Origine', fieldNames: ['portLoading', 'originRef'], required: true },
            { labelKey: 'ui.portDischarge', labelFallback: 'Destinazione', fieldNames: ['portDischarge', 'destinationRef'], required: true },
            { labelKey: 'ui.terminal', labelFallback: 'Terminal', fieldNames: ['terminal'], required: false },
            { labelKey: 'ui.deposit', labelFallback: 'Deposito', fieldNames: ['deposit'], required: false }
          ]
        },
        {
          key: 'transport',
          titleKey: 'ui.practiceReadinessSectionTransport',
          titleFallback: 'Trasporto / tempi',
          groups: [
            { labelKey: 'ui.transportUnitType', labelFallback: 'Tipologia unità / trasporto', fieldNames: ['transportUnitType', 'containerCode'], required: true },
            { labelKey: 'ui.vesselVoyage', labelFallback: 'Nave / Viaggio', fieldNames: ['vesselVoyage'], required: true },
            { labelKey: 'ui.departureDate', labelFallback: 'Data partenza', fieldNames: ['departureDate'], required: true },
            { labelKey: 'ui.containerCode', labelFallback: 'Container', fieldNames: ['containerCode'], required: false }
          ]
        },
        {
          key: 'documents',
          titleKey: 'ui.practiceReadinessSectionDocuments',
          titleFallback: 'Documenti / dogana',
          groups: [
            { labelKey: 'ui.booking', labelFallback: 'Booking', fieldNames: ['booking'], required: true },
            { labelKey: 'ui.policyNumber', labelFallback: 'Polizza', fieldNames: ['policyNumber', 'hbl'], required: true },
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ]
        }
      ],
      air_import: [
        {
          key: 'parties',
          titleKey: 'ui.practiceReadinessSectionParties',
          titleFallback: 'Soggetti essenziali',
          groups: [
            { labelKey: 'ui.clientRequired', labelFallback: 'Cliente', fieldNames: ['client', 'clientName'], required: true },
            { labelKey: 'ui.importer', labelFallback: 'Importatore', fieldNames: ['importer'], required: true },
            { labelKey: 'ui.consignee', labelFallback: 'Destinatario', fieldNames: ['consignee'], required: true },
            { labelKey: 'ui.airline', labelFallback: 'Compagnia aerea', fieldNames: ['airline'], required: false }
          ]
        },
        {
          key: 'route',
          titleKey: 'ui.practiceReadinessSectionRoute',
          titleFallback: 'Nodi logistici',
          groups: [
            { labelKey: 'ui.airportDeparture', labelFallback: 'Aeroporto partenza', fieldNames: ['airportDeparture'], required: true },
            { labelKey: 'ui.airportDestination', labelFallback: 'Aeroporto destinazione', fieldNames: ['airportDestination'], required: true }
          ]
        },
        {
          key: 'transport',
          titleKey: 'ui.practiceReadinessSectionTransport',
          titleFallback: 'Trasporto / tempi',
          groups: [
            { labelKey: 'ui.airline', labelFallback: 'Compagnia aerea', fieldNames: ['airline'], required: true },
            { labelKey: 'ui.arrivalDate', labelFallback: 'Data arrivo', fieldNames: ['arrivalDate'], required: true },
            { labelKey: 'ui.booking', labelFallback: 'Booking', fieldNames: ['booking'], required: false }
          ]
        },
        {
          key: 'documents',
          titleKey: 'ui.practiceReadinessSectionDocuments',
          titleFallback: 'Documenti / dogana',
          groups: [
            { labelKey: 'ui.mawb', labelFallback: 'MAWB', fieldNames: ['mawb'], required: true },
            { labelKey: 'ui.hawb', labelFallback: 'HAWB', fieldNames: ['hawb'], required: true },
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ]
        }
      ],
      air_export: [
        {
          key: 'parties',
          titleKey: 'ui.practiceReadinessSectionParties',
          titleFallback: 'Soggetti essenziali',
          groups: [
            { labelKey: 'ui.clientRequired', labelFallback: 'Cliente', fieldNames: ['client', 'clientName'], required: true },
            { labelKey: 'ui.shipper', labelFallback: 'Shipper', fieldNames: ['shipper'], required: true },
            { labelKey: 'ui.consignee', labelFallback: 'Destinatario', fieldNames: ['consignee'], required: true },
            { labelKey: 'ui.airline', labelFallback: 'Compagnia aerea', fieldNames: ['airline'], required: false }
          ]
        },
        {
          key: 'route',
          titleKey: 'ui.practiceReadinessSectionRoute',
          titleFallback: 'Nodi logistici',
          groups: [
            { labelKey: 'ui.airportDeparture', labelFallback: 'Aeroporto partenza', fieldNames: ['airportDeparture'], required: true },
            { labelKey: 'ui.airportDestination', labelFallback: 'Aeroporto destinazione', fieldNames: ['airportDestination'], required: true }
          ]
        },
        {
          key: 'transport',
          titleKey: 'ui.practiceReadinessSectionTransport',
          titleFallback: 'Trasporto / tempi',
          groups: [
            { labelKey: 'ui.airline', labelFallback: 'Compagnia aerea', fieldNames: ['airline'], required: true },
            { labelKey: 'ui.departureDate', labelFallback: 'Data partenza', fieldNames: ['departureDate'], required: true },
            { labelKey: 'ui.booking', labelFallback: 'Booking', fieldNames: ['booking'], required: false }
          ]
        },
        {
          key: 'documents',
          titleKey: 'ui.practiceReadinessSectionDocuments',
          titleFallback: 'Documenti / dogana',
          groups: [
            { labelKey: 'ui.mawb', labelFallback: 'MAWB', fieldNames: ['mawb'], required: true },
            { labelKey: 'ui.hawb', labelFallback: 'HAWB', fieldNames: ['hawb'], required: true },
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ]
        }
      ],
      road_import: [
        {
          key: 'parties',
          titleKey: 'ui.practiceReadinessSectionParties',
          titleFallback: 'Soggetti essenziali',
          groups: [
            { labelKey: 'ui.clientRequired', labelFallback: 'Cliente', fieldNames: ['client', 'clientName'], required: true },
            { labelKey: 'ui.shipper', labelFallback: 'Shipper', fieldNames: ['shipper'], required: true },
            { labelKey: 'ui.consignee', labelFallback: 'Destinatario', fieldNames: ['consignee'], required: true },
            { labelKey: 'ui.carrier', labelFallback: 'Vettore', fieldNames: ['carrier'], required: true }
          ]
        },
        {
          key: 'route',
          titleKey: 'ui.practiceReadinessSectionRoute',
          titleFallback: 'Nodi logistici',
          groups: [
            { labelKey: 'ui.pickupPlace', labelFallback: 'Luogo ritiro', fieldNames: ['pickupPlace', 'originDest'], required: true },
            { labelKey: 'ui.deliveryPlace', labelFallback: 'Luogo consegna', fieldNames: ['deliveryPlace'], required: true }
          ]
        },
        {
          key: 'transport',
          titleKey: 'ui.practiceReadinessSectionTransport',
          titleFallback: 'Trasporto / tempi',
          groups: [
            { labelKey: 'ui.vehicleType', labelFallback: 'Tipo veicolo', fieldNames: ['vehicleType'], required: true },
            { labelKey: 'ui.pickupDate', labelFallback: 'Data ritiro', fieldNames: ['pickupDate'], required: true },
            { labelKey: 'ui.deliveryDate', labelFallback: 'Data consegna', fieldNames: ['deliveryDate'], required: true },
            { labelKey: 'ui.plateDriver', labelFallback: 'Targa / autista', fieldNames: ['plateDriver'], required: false }
          ]
        },
        {
          key: 'documents',
          titleKey: 'ui.practiceReadinessSectionDocuments',
          titleFallback: 'Documenti / riferimento',
          groups: [
            { labelKey: 'ui.cmr', labelFallback: 'CMR', fieldNames: ['cmr'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ]
        }
      ],
      road_export: [
        {
          key: 'parties',
          titleKey: 'ui.practiceReadinessSectionParties',
          titleFallback: 'Soggetti essenziali',
          groups: [
            { labelKey: 'ui.clientRequired', labelFallback: 'Cliente', fieldNames: ['client', 'clientName'], required: true },
            { labelKey: 'ui.shipper', labelFallback: 'Shipper', fieldNames: ['shipper'], required: true },
            { labelKey: 'ui.consignee', labelFallback: 'Destinatario', fieldNames: ['consignee'], required: true },
            { labelKey: 'ui.carrier', labelFallback: 'Vettore', fieldNames: ['carrier'], required: true }
          ]
        },
        {
          key: 'route',
          titleKey: 'ui.practiceReadinessSectionRoute',
          titleFallback: 'Nodi logistici',
          groups: [
            { labelKey: 'ui.pickupPlace', labelFallback: 'Luogo ritiro', fieldNames: ['pickupPlace', 'originDest'], required: true },
            { labelKey: 'ui.deliveryPlace', labelFallback: 'Luogo consegna', fieldNames: ['deliveryPlace'], required: true }
          ]
        },
        {
          key: 'transport',
          titleKey: 'ui.practiceReadinessSectionTransport',
          titleFallback: 'Trasporto / tempi',
          groups: [
            { labelKey: 'ui.vehicleType', labelFallback: 'Tipo veicolo', fieldNames: ['vehicleType'], required: true },
            { labelKey: 'ui.pickupDate', labelFallback: 'Data ritiro', fieldNames: ['pickupDate'], required: true },
            { labelKey: 'ui.deliveryDate', labelFallback: 'Data consegna', fieldNames: ['deliveryDate'], required: true },
            { labelKey: 'ui.plateDriver', labelFallback: 'Targa / autista', fieldNames: ['plateDriver'], required: false }
          ]
        },
        {
          key: 'documents',
          titleKey: 'ui.practiceReadinessSectionDocuments',
          titleFallback: 'Documenti / riferimento',
          groups: [
            { labelKey: 'ui.cmr', labelFallback: 'CMR', fieldNames: ['cmr'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ]
        }
      ],
      warehouse: [
        {
          key: 'parties',
          titleKey: 'ui.practiceReadinessSectionParties',
          titleFallback: 'Soggetti essenziali',
          groups: [
            { labelKey: 'ui.clientRequired', labelFallback: 'Cliente', fieldNames: ['client', 'clientName'], required: true },
            { labelKey: 'ui.warehouseContact', labelFallback: 'Contatto deposito', fieldNames: ['warehouseContact'], required: false }
          ]
        },
        {
          key: 'route',
          titleKey: 'ui.practiceReadinessSectionRoute',
          titleFallback: 'Flusso / deposito',
          groups: [
            { labelKey: 'ui.originDest', labelFallback: 'Orig. / Dest.', fieldNames: ['originDest'], required: true },
            { labelKey: 'ui.deposit', labelFallback: 'Deposito', fieldNames: ['deposit'], required: true },
            { labelKey: 'ui.movementDirection', labelFallback: 'Direzione movimento', fieldNames: ['movementDirection'], required: true }
          ]
        },
        {
          key: 'transport',
          titleKey: 'ui.practiceReadinessSectionTransport',
          titleFallback: 'Supporto operativo',
          groups: [
            { labelKey: 'ui.plateDriver', labelFallback: 'Targa / autista', fieldNames: ['plateDriver'], required: false },
            { labelKey: 'ui.lots', labelFallback: 'Lotti', fieldNames: ['lots'], required: false }
          ]
        },
        {
          key: 'documents',
          titleKey: 'ui.practiceReadinessSectionDocuments',
          titleFallback: 'Documenti / riferimenti',
          groups: [
            { labelKey: 'ui.linkedTo', labelFallback: 'Collega a', fieldNames: ['linkedTo'], required: true },
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: false },
            { labelKey: 'ui.baseQuotation', labelFallback: 'Quotaz. base', fieldNames: ['baseQuotation'], required: false }
          ]
        }
      ]
    };

    return map[String(type || '').trim()] || map.sea_import;
  }

  function filterDefinitionsForSchema(definitions, schemaFieldNames) {
    return definitions
      .map((section) => ({
        ...section,
        groups: section.groups.filter((group) => group.fieldNames.some((fieldName) => schemaFieldNames.has(fieldName) || fieldName === 'clientName'))
      }))
      .filter((section) => section.groups.length);
  }

  function evaluateGroup(draft, group) {
    const fieldNames = Array.isArray(group?.fieldNames) ? group.fieldNames : [];
    const resolvedField = fieldNames[0] || '';
    let matchedValue = '';
    let matchedFieldName = resolvedField;
    for (const fieldName of fieldNames) {
      const value = getValue(draft, fieldName);
      if (value) {
        matchedValue = value;
        matchedFieldName = fieldName;
        break;
      }
    }
    return {
      ...group,
      resolvedField: matchedFieldName,
      complete: Boolean(matchedValue),
      value: matchedValue
    };
  }

  function computeSection(section, draft, i18n) {
    const groups = (section.groups || []).map((group) => evaluateGroup(draft, group));
    const requiredGroups = groups.filter((group) => group.required !== false);
    const requiredTotal = requiredGroups.length;
    const requiredComplete = requiredGroups.filter((group) => group.complete).length;
    const total = groups.length;
    const complete = groups.filter((group) => group.complete).length;
    const missingRequired = requiredGroups.filter((group) => !group.complete);
    const missingOptional = groups.filter((group) => group.required === false && !group.complete);

    let status = 'ready';
    if (requiredTotal && requiredComplete < requiredTotal) {
      status = 'critical';
    } else if (complete < total) {
      status = 'attention';
    }

    const firstMissing = missingRequired[0] || missingOptional[0] || null;
    const missingLabels = groups
      .filter((group) => !group.complete)
      .slice(0, 3)
      .map((group) => t(i18n, group.labelKey, group.labelFallback));

    let helper = t(i18n, 'ui.practiceReadinessSectionReadyHint', 'Blocco pronto per il flusso operativo attuale.');
    if (status === 'critical') {
      helper = t(i18n, 'ui.practiceReadinessSectionCriticalHint', 'Completa prima i campi essenziali di questo blocco.');
    } else if (status === 'attention') {
      helper = t(i18n, 'ui.practiceReadinessSectionAttentionHint', 'Hai una buona base, ma restano ancora alcuni completamenti utili.');
    }
    if (missingLabels.length) {
      helper += ` ${t(i18n, 'ui.practiceReadinessMissingPrefix', 'Mancano')}: ${missingLabels.join(', ')}`;
    }

    return {
      key: section.key,
      title: t(i18n, section.titleKey, section.titleFallback),
      status,
      total,
      complete,
      requiredTotal,
      requiredComplete,
      firstMissing,
      helper,
      groups
    };
  }

  function buildOverview(sections, i18n) {
    const counts = {
      ready: sections.filter((section) => section.status === 'ready').length,
      attention: sections.filter((section) => section.status === 'attention').length,
      critical: sections.filter((section) => section.status === 'critical').length
    };

    const topSection = sections.find((section) => section.status === 'critical' && section.firstMissing)
      || sections.find((section) => section.status === 'attention' && section.firstMissing)
      || null;

    let tone = 'success';
    let title = t(i18n, 'ui.practiceReadinessOverviewReadyTitle', 'Pratica pronta a livello base');
    let detail = t(i18n, 'ui.practiceReadinessOverviewReadyDetail', 'I blocchi essenziali risultano coperti: puoi rifinire solo i dettagli di supporto.');

    if (counts.critical) {
      tone = 'danger';
      title = t(i18n, 'ui.practiceReadinessOverviewCriticalTitle', 'Completa prima i blocchi essenziali');
      detail = t(i18n, 'ui.practiceReadinessOverviewCriticalDetail', 'Ci sono ancora sezioni operative che bloccano la pratica.');
    } else if (counts.attention) {
      tone = 'warning';
      title = t(i18n, 'ui.practiceReadinessOverviewAttentionTitle', 'Base pronta, ma restano punti da rafforzare');
      detail = t(i18n, 'ui.practiceReadinessOverviewAttentionDetail', 'La pratica è leggibile, ma puoi completare ancora alcuni blocchi utili.');
    }

    return {
      counts,
      tone,
      title,
      detail,
      topSection
    };
  }

  function renderCountChip(utils, label, value, tone = 'default') {
    return `
      <span class="count-chip ${tone}">
        <strong>${escape(utils, value)}</strong>
        <span>${escape(utils, label)}</span>
      </span>`;
  }

  function renderSectionCard(section, utils, i18n) {
    const statusKey = {
      ready: ['ui.practiceReadinessStatusReady', 'Pronto'],
      attention: ['ui.practiceReadinessStatusAttention', 'Da rifinire'],
      critical: ['ui.practiceReadinessStatusCritical', 'Priorità alta']
    }[section.status] || ['ui.practiceReadinessStatusAttention', 'Da rifinire'];

    const coverage = `${section.complete}/${section.total} ${t(i18n, 'ui.practiceReadinessCoverageSuffix', 'aree complete')}`;
    const required = section.requiredTotal
      ? `${section.requiredComplete}/${section.requiredTotal} ${t(i18n, 'ui.practiceReadinessRequiredSuffix', 'essenziali')}`
      : '';

    const action = section.firstMissing
      ? `<button type="button" class="linked-entity-summary-action subtle" data-focus-practice-field="${escape(utils, section.firstMissing.resolvedField || '')}" data-focus-practice-tab="practice">${escape(utils, t(i18n, 'ui.practiceReadinessGoToAction', 'Vai al punto'))}</button>`
      : '';

    return `
      <article class="practice-readiness-card" data-status="${escape(utils, section.status)}">
        <div class="practice-readiness-card-head">
          <div class="practice-readiness-card-label">${escape(utils, section.title)}</div>
          <span class="badge ${section.status === 'critical' ? 'danger' : section.status === 'attention' ? 'warning' : 'success'}">${escape(utils, t(i18n, statusKey[0], statusKey[1]))}</span>
        </div>
        <div class="practice-readiness-card-meta">
          ${renderCountChip(utils, t(i18n, 'ui.practiceReadinessCoverageLabel', 'Copertura'), coverage, section.status === 'critical' ? 'danger' : section.status === 'attention' ? 'warning' : 'success')}
          ${required ? renderCountChip(utils, t(i18n, 'ui.practiceReadinessRequiredLabel', 'Essenziali'), required, section.requiredComplete === section.requiredTotal ? 'success' : 'warning') : ''}
        </div>
        <div class="practice-readiness-card-helper">${escape(utils, section.helper)}</div>
        ${action ? `<div class="practice-readiness-card-actions">${action}</div>` : ''}
      </article>`;
  }

  function render(options = {}) {
    const { draft = {}, type, i18n, utils } = options;
    const practiceType = String(type || draft?.practiceType || '').trim();
    if (!practiceType) return '';

    const schemaFieldNames = getSchemaFieldNames(practiceType);
    const sections = filterDefinitionsForSchema(buildDefinitions(practiceType), schemaFieldNames)
      .map((section) => computeSection(section, draft, i18n));
    if (!sections.length) return '';

    const overview = buildOverview(sections, i18n);
    const chips = [
      renderCountChip(utils, t(i18n, 'ui.practiceReadinessCountReady', 'pronti'), overview.counts.ready, overview.counts.ready ? 'success' : 'default'),
      renderCountChip(utils, t(i18n, 'ui.practiceReadinessCountAttention', 'da rifinire'), overview.counts.attention, overview.counts.attention ? 'warning' : 'default'),
      renderCountChip(utils, t(i18n, 'ui.practiceReadinessCountCritical', 'priorità alta'), overview.counts.critical, overview.counts.critical ? 'danger' : 'default')
    ].join('');

    const topAction = overview.topSection && overview.topSection.firstMissing
      ? `<button type="button" class="btn secondary practice-readiness-overview-btn" data-focus-practice-field="${escape(utils, overview.topSection.firstMissing.resolvedField || '')}" data-focus-practice-tab="practice">${escape(utils, t(i18n, 'ui.practiceReadinessTopAction', 'Vai al prossimo punto'))}</button>`
      : '';

    return `
      <section class="practice-readiness-board" data-practice-readiness-board>
        <div class="practice-readiness-head">
          <div>
            <div class="practice-overview-kicker">${escape(utils, t(i18n, 'ui.practiceReadinessKicker', 'Completezza operativa'))}</div>
            <h4 class="practice-readiness-title">${escape(utils, t(i18n, 'ui.practiceReadinessTitle', 'Stato pratica a colpo d’occhio'))}</h4>
            <p class="practice-readiness-subtitle">${escape(utils, t(i18n, 'ui.practiceReadinessSubtitle', 'Leggi subito se i blocchi essenziali della pratica sono pronti o se manca ancora qualcosa di operativo.'))}</p>
          </div>
          <div class="practice-readiness-counts">${chips}</div>
        </div>
        <div class="practice-readiness-overview ${escape(utils, overview.tone)}">
          <div>
            <div class="practice-readiness-overview-title">${escape(utils, overview.title)}</div>
            <div class="practice-readiness-overview-detail">${escape(utils, overview.detail)}</div>
          </div>
          <div class="practice-readiness-overview-side">
            ${topAction}
          </div>
        </div>
        <div class="practice-readiness-grid">
          ${sections.map((section) => renderSectionCard(section, utils, i18n)).join('')}
        </div>
      </section>`;
  }

  return {
    render
  };
})();
