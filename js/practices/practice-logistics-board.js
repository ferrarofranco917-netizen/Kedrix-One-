window.KedrixOnePracticeLogisticsBoard = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;
  const PracticeFieldRelations = window.KedrixOnePracticeFieldRelations || null;
  const PracticeLogisticsIntelligence = window.KedrixOnePracticeLogisticsIntelligence || null;

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
    if (Array.isArray(value)) return value.map((entry) => text(entry, '')).filter(Boolean).join(', ');
    if (typeof value === 'object') {
      const candidates = [value.displayValue, value.label, value.value, value.name, value.code, value.city, value.id];
      for (const candidate of candidates) {
        const resolved = text(candidate, '');
        if (resolved) return resolved;
      }
    }
    return String(fallback || '').trim();
  }

  function normalize(value) {
    return String(value || '').trim().toUpperCase();
  }

  function getField(type, fieldName) {
    return PracticeSchemas && typeof PracticeSchemas.getField === 'function'
      ? PracticeSchemas.getField(type, fieldName)
      : null;
  }

  function getRawValue(draft, fieldName) {
    if (!draft || !fieldName) return '';
    if (fieldName === 'client') return text(draft?.dynamicData?.client, '') || text(draft?.clientName, '');
    if (fieldName === 'clientName') return text(draft?.clientName, '');
    return draft?.dynamicData?.[fieldName];
  }

  function resolveSuggestionDisplay(type, field, rawValue, companyConfig) {
    const fallback = text(rawValue, '');
    if (!fallback || !field || !field.suggestionKey || !PracticeSchemas || typeof PracticeSchemas.getFieldOptionEntries !== 'function') {
      return fallback;
    }
    const clean = normalize(fallback);
    const match = PracticeSchemas.getFieldOptionEntries(type, field, companyConfig).find((entry) =>
      (entry.aliases || []).some((alias) => normalize(alias) === clean)
    );
    return text(match?.displayValue || match?.label || match?.value, '') || fallback;
  }

  function resolveItemValue(context = {}, config = {}) {
    const { draft = {}, type = '', companyConfig = null, state = null, i18n = null } = context;
    const candidates = [config.fieldName, ...(Array.isArray(config.altFieldNames) ? config.altFieldNames : [])]
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    for (const candidate of candidates) {
      const rawValue = getRawValue(draft, candidate);
      const currentValue = text(rawValue, '');
      if (!currentValue) continue;
      const field = getField(type, candidate);
      const displayValue = resolveSuggestionDisplay(type, field, rawValue, companyConfig);
      const relationMeta = PracticeFieldRelations && typeof PracticeFieldRelations.getFieldRelationMeta === 'function' && field
        ? PracticeFieldRelations.getFieldRelationMeta({ state, type, field, draft, companyConfig, i18n })
        : null;
      return {
        value: displayValue,
        rawValue: currentValue,
        fieldName: candidate,
        field,
        relationMeta
      };
    }

    const fallbackFieldName = candidates[0] || '';
    return {
      value: '',
      rawValue: '',
      fieldName: fallbackFieldName,
      field: getField(type, fallbackFieldName),
      relationMeta: null
    };
  }

  function buildDefinition(type) {
    const map = {
      sea_import: {
        route: [
          { fieldName: 'originRef', labelKey: 'ui.originRef', labelFallback: 'Origine', required: true },
          { fieldName: 'portLoading', labelKey: 'ui.portLoading', labelFallback: 'POL', required: true },
          { fieldName: 'terminal', labelKey: 'ui.terminal', labelFallback: 'Terminal', required: false },
          { fieldName: 'portDischarge', labelKey: 'ui.portDischarge', labelFallback: 'POD', required: true },
          { fieldName: 'destinationRef', labelKey: 'ui.destinationRef', labelFallback: 'Destinazione', required: true }
        ],
        support: [
          { fieldName: 'terminalPickup', labelKey: 'ui.terminalPickup', labelFallback: 'Terminal ritiro', required: false },
          { fieldName: 'terminalDelivery', labelKey: 'ui.terminalDelivery', labelFallback: 'Terminal resa', required: false },
          { fieldName: 'deposit', labelKey: 'ui.deposit', labelFallback: 'Deposito', required: false },
          { fieldName: 'linkedTo', labelKey: 'ui.linkedTo', labelFallback: 'Collega a', required: false }
        ],
        timing: [
          { fieldName: 'arrivalDate', labelKey: 'ui.arrivalDate', labelFallback: 'Data arrivo', required: true },
          { fieldName: 'unloadingDate', labelKey: 'ui.unloadingDate', labelFallback: 'Data scarico', required: false }
        ],
        issueRules: ['sameDepartureArrival', 'arrivalBeforeUnloading']
      },
      sea_export: {
        route: [
          { fieldName: 'originRef', labelKey: 'ui.originRef', labelFallback: 'Origine', required: true },
          { fieldName: 'portLoading', labelKey: 'ui.portLoading', labelFallback: 'POL', required: true },
          { fieldName: 'terminal', labelKey: 'ui.terminal', labelFallback: 'Terminal', required: false },
          { fieldName: 'portDischarge', labelKey: 'ui.portDischarge', labelFallback: 'POD', required: true },
          { fieldName: 'destinationRef', labelKey: 'ui.destinationRef', labelFallback: 'Destinazione', required: true }
        ],
        support: [
          { fieldName: 'terminalPickup', labelKey: 'ui.terminalPickup', labelFallback: 'Terminal ritiro', required: false },
          { fieldName: 'terminalDelivery', labelKey: 'ui.terminalDelivery', labelFallback: 'Terminal resa', required: false },
          { fieldName: 'deposit', labelKey: 'ui.deposit', labelFallback: 'Deposito', required: false },
          { fieldName: 'linkedTo', labelKey: 'ui.linkedTo', labelFallback: 'Collega a', required: false }
        ],
        timing: [
          { fieldName: 'departureDate', labelKey: 'ui.departureDate', labelFallback: 'Data partenza', required: true },
          { fieldName: 'unloadingDate', labelKey: 'ui.unloadingDate', labelFallback: 'Data scarico', required: false }
        ],
        issueRules: ['sameDepartureArrival', 'unloadingBeforeDeparture']
      },
      air_import: {
        route: [
          { fieldName: 'airportDeparture', labelKey: 'ui.airportDeparture', labelFallback: 'Aeroporto partenza', required: true },
          { fieldName: 'airportDestination', labelKey: 'ui.airportDestination', labelFallback: 'Aeroporto destinazione', required: true }
        ],
        support: [],
        timing: [
          { fieldName: 'arrivalDate', labelKey: 'ui.arrivalDate', labelFallback: 'Data arrivo', required: true }
        ],
        issueRules: ['sameDepartureArrival']
      },
      air_export: {
        route: [
          { fieldName: 'airportDeparture', labelKey: 'ui.airportDeparture', labelFallback: 'Aeroporto partenza', required: true },
          { fieldName: 'airportDestination', labelKey: 'ui.airportDestination', labelFallback: 'Aeroporto destinazione', required: true }
        ],
        support: [],
        timing: [
          { fieldName: 'departureDate', labelKey: 'ui.departureDate', labelFallback: 'Data partenza', required: true }
        ],
        issueRules: ['sameDepartureArrival']
      },
      road_import: {
        route: [
          { fieldName: 'originDest', labelKey: 'ui.originDest', labelFallback: 'Orig. / Dest.', required: false },
          { fieldName: 'pickupPlace', labelKey: 'ui.pickupPlace', labelFallback: 'Luogo ritiro', required: true },
          { fieldName: 'deliveryPlace', labelKey: 'ui.deliveryPlace', labelFallback: 'Luogo consegna', required: true }
        ],
        support: [],
        timing: [
          { fieldName: 'pickupDate', labelKey: 'ui.pickupDate', labelFallback: 'Data ritiro', required: true },
          { fieldName: 'deliveryDate', labelKey: 'ui.deliveryDate', labelFallback: 'Data consegna', required: true }
        ],
        issueRules: ['samePickupDelivery', 'pickupAfterDelivery']
      },
      road_export: {
        route: [
          { fieldName: 'originDest', labelKey: 'ui.originDest', labelFallback: 'Orig. / Dest.', required: false },
          { fieldName: 'pickupPlace', labelKey: 'ui.pickupPlace', labelFallback: 'Luogo ritiro', required: true },
          { fieldName: 'deliveryPlace', labelKey: 'ui.deliveryPlace', labelFallback: 'Luogo consegna', required: true }
        ],
        support: [],
        timing: [
          { fieldName: 'pickupDate', labelKey: 'ui.pickupDate', labelFallback: 'Data ritiro', required: true },
          { fieldName: 'deliveryDate', labelKey: 'ui.deliveryDate', labelFallback: 'Data consegna', required: true }
        ],
        issueRules: ['samePickupDelivery', 'pickupAfterDelivery']
      },
      warehouse: {
        route: [
          { fieldName: 'originDest', labelKey: 'ui.originDest', labelFallback: 'Orig. / Dest.', required: true },
          { fieldName: 'deposit', labelKey: 'ui.deposit', labelFallback: 'Deposito', required: true },
          { fieldName: 'linkedTo', labelKey: 'ui.linkedTo', labelFallback: 'Collega a', required: true }
        ],
        support: [
          { fieldName: 'movementDirection', labelKey: 'ui.movementDirection', labelFallback: 'Direzione movimento', required: true },
          { fieldName: 'customsOffice', labelKey: 'ui.customsOffice', labelFallback: 'Dogana', required: false }
        ],
        timing: [],
        issueRules: []
      }
    };
    return map[String(type || '').trim()] || { route: [], support: [], timing: [], issueRules: [] };
  }

  function buildItems(context = {}, configs = []) {
    return (Array.isArray(configs) ? configs : []).map((config) => {
      const resolved = resolveItemValue(context, config);
      const label = t(context.i18n, config.labelKey, config.labelFallback || config.fieldName || '');
      const hasValue = Boolean(resolved.value);
      const status = hasValue ? 'ready' : (config.required ? 'critical' : 'attention');
      const relationLabel = resolved.relationMeta?.badgeLabel || '';
      let helper = '';
      let pillTone = 'default';

      if (hasValue && relationLabel) {
        helper = relationLabel;
        pillTone = resolved.relationMeta?.kind === 'linked' ? 'success' : 'default';
      } else if (hasValue) {
        helper = t(context.i18n, 'ui.practiceLogisticsItemReady', 'Presente');
        pillTone = 'success';
      } else if (config.required) {
        helper = t(context.i18n, 'ui.practiceLogisticsItemMissingRequired', 'Essenziale mancante');
        pillTone = 'danger';
      } else {
        helper = t(context.i18n, 'ui.practiceLogisticsItemOptional', 'Supporto opzionale');
        pillTone = 'warning';
      }

      return {
        ...config,
        label,
        fieldName: resolved.fieldName || config.fieldName || '',
        value: resolved.value,
        rawValue: resolved.rawValue,
        relationMeta: resolved.relationMeta,
        status,
        helper,
        pillTone
      };
    });
  }

  function parseDateValue(value) {
    const clean = text(value, '');
    if (!clean) return null;
    const stamp = Date.parse(clean);
    return Number.isNaN(stamp) ? null : stamp;
  }

  function buildIssues(context = {}, routeItems = [], timingItems = [], issueRules = []) {
    const issues = [];
    const byField = {};
    [...routeItems, ...timingItems].forEach((item) => {
      byField[item.fieldName] = item;
    });

    const sameValueIssue = (leftField, rightField, labelKey, fallback) => {
      const left = byField[leftField];
      const right = byField[rightField];
      if (!left?.rawValue || !right?.rawValue) return;
      if (normalize(left.rawValue) !== normalize(right.rawValue)) return;
      issues.push({
        tone: 'warning',
        label: t(context.i18n, labelKey, fallback),
        fieldName: right.fieldName || left.fieldName || ''
      });
    };

    const reverseDateIssue = (startField, endField, labelKey, fallback) => {
      const start = parseDateValue(byField[startField]?.rawValue);
      const end = parseDateValue(byField[endField]?.rawValue);
      if (start === null || end === null) return;
      if (start <= end) return;
      issues.push({
        tone: 'danger',
        label: t(context.i18n, labelKey, fallback),
        fieldName: endField
      });
    };

    if (issueRules.includes('sameDepartureArrival')) {
      sameValueIssue('portLoading', 'portDischarge', 'ui.practiceLogisticsIssueSameDepartureArrival', 'Origine e destinazione coincidono sul nodo principale.');
      sameValueIssue('airportDeparture', 'airportDestination', 'ui.practiceLogisticsIssueSameDepartureArrival', 'Origine e destinazione coincidono sul nodo principale.');
    }
    if (issueRules.includes('samePickupDelivery')) {
      sameValueIssue('pickupPlace', 'deliveryPlace', 'ui.practiceLogisticsIssueSamePickupDelivery', 'Luogo ritiro e consegna coincidono.');
    }
    if (issueRules.includes('pickupAfterDelivery')) {
      reverseDateIssue('pickupDate', 'deliveryDate', 'ui.practiceLogisticsIssuePickupAfterDelivery', 'La data ritiro risulta successiva alla data consegna.');
    }
    if (issueRules.includes('arrivalBeforeUnloading')) {
      reverseDateIssue('arrivalDate', 'unloadingDate', 'ui.practiceLogisticsIssueArrivalAfterUnloading', 'La data scarico risulta precedente alla data arrivo.');
    }
    if (issueRules.includes('unloadingBeforeDeparture')) {
      reverseDateIssue('departureDate', 'unloadingDate', 'ui.practiceLogisticsIssueUnloadingBeforeDeparture', 'La data scarico risulta precedente alla data partenza.');
    }

    return issues;
  }

  function buildRouteText(routeItems = [], i18n = null) {
    const values = routeItems.map((item) => item.value).filter(Boolean);
    return values.join(' → ') || t(i18n, 'ui.practiceLogisticsRouteEmpty', 'Percorso logistico non ancora leggibile');
  }

  function summarizeSection(context = {}, key, titleKey, titleFallback, items = [], issues = []) {
    const activeItems = items.filter((item) => item.status !== 'inactive');
    const criticalCount = activeItems.filter((item) => item.status === 'critical').length + issues.filter((issue) => issue.tone === 'danger').length;
    const attentionCount = activeItems.filter((item) => item.status === 'attention').length + issues.filter((issue) => issue.tone === 'warning').length;
    const readyCount = activeItems.filter((item) => item.status === 'ready').length;
    const status = criticalCount > 0 ? 'critical' : attentionCount > 0 ? 'attention' : 'ready';
    const firstMissing = activeItems.find((item) => item.status === 'critical') || activeItems.find((item) => item.status === 'attention') || null;
    const firstIssue = issues.find((issue) => issue.tone === 'danger') || issues.find((issue) => issue.tone === 'warning') || null;
    const actionFieldName = firstIssue?.fieldName || firstMissing?.fieldName || '';
    const detail = firstIssue
      ? firstIssue.label
      : activeItems.length === 0
        ? t(context.i18n, 'ui.practiceLogisticsItemInactive', 'Non attivo per questo flusso')
        : status === 'critical'
          ? t(context.i18n, 'ui.practiceLogisticsSectionCriticalHint', 'Completa prima i nodi essenziali di questo blocco logistico.')
          : status === 'attention'
            ? t(context.i18n, 'ui.practiceLogisticsSectionAttentionHint', 'La base c’è, ma restano alcuni snodi utili da consolidare.')
            : t(context.i18n, 'ui.practiceLogisticsSectionReadyHint', 'Blocco logistico leggibile e coerente per il flusso attuale.');

    return {
      key,
      title: t(context.i18n, titleKey, titleFallback),
      items,
      issues,
      status,
      counts: {
        critical: criticalCount,
        attention: attentionCount,
        ready: readyCount,
        total: activeItems.length
      },
      firstMissing,
      firstIssue,
      actionFieldName,
      detail
    };
  }

  function summarize(context = {}) {
    const { draft = {}, type = '' } = context;
    if (!draft || !String(draft.practiceType || type || '').trim()) {
      return {
        cards: [],
        overview: {
          tone: 'default',
          title: '',
          detail: '',
          routeText: '',
          counts: { critical: 0, attention: 0, ready: 0 },
          topItem: null
        }
      };
    }

    const definition = buildDefinition(type || draft.practiceType);
    const intelligenceFlags = PracticeLogisticsIntelligence && typeof PracticeLogisticsIntelligence.buildFlags === 'function'
      ? PracticeLogisticsIntelligence.buildFlags(context)
      : null;
    let routeItems = buildItems(context, definition.route);
    let supportItems = buildItems(context, definition.support);
    let timingItems = buildItems(context, definition.timing);

    if (PracticeLogisticsIntelligence && typeof PracticeLogisticsIntelligence.annotateItems === 'function') {
      routeItems = PracticeLogisticsIntelligence.annotateItems(context, 'route', routeItems, { flags: intelligenceFlags, supportItems, routeItems });
      supportItems = PracticeLogisticsIntelligence.annotateItems(context, 'support', supportItems, { flags: intelligenceFlags, routeItems, supportItems });
      timingItems = PracticeLogisticsIntelligence.annotateItems(context, 'timing', timingItems, { flags: intelligenceFlags, routeItems, supportItems });
    }

    const issues = buildIssues(context, routeItems.filter((item) => item.status !== 'inactive'), timingItems.filter((item) => item.status !== 'inactive'), definition.issueRules);
    const routeText = buildRouteText(routeItems.filter((item) => item.status !== 'inactive' || item.value), context.i18n);
    const coverage = PracticeLogisticsIntelligence && typeof PracticeLogisticsIntelligence.buildCoverage === 'function'
      ? PracticeLogisticsIntelligence.buildCoverage(context, { flags: intelligenceFlags, routeItems, supportItems, timingItems, issues, routeText })
      : null;

    const cards = [
      summarizeSection(context, 'route', 'ui.practiceLogisticsCardRoute', 'Percorso fisico', routeItems, issues),
      summarizeSection(context, 'support', 'ui.practiceLogisticsCardSupport', 'Snodi di supporto', supportItems, []),
      summarizeSection(context, 'timing', 'ui.practiceLogisticsCardTiming', 'Tempi logistici', timingItems, [])
    ].filter((card) => card.items.length && (card.counts.total > 0 || card.items.some((item) => item.value)));

    const counts = cards.reduce((acc, card) => {
      acc.critical += card.counts.critical;
      acc.attention += card.counts.attention;
      acc.ready += card.counts.ready;
      return acc;
    }, { critical: 0, attention: 0, ready: 0 });

    const topCard = cards.find((card) => card.status === 'critical') || cards.find((card) => card.status === 'attention') || cards[0] || null;
    const topItem = topCard
      ? (topCard.firstIssue
        ? { label: topCard.firstIssue.label, fieldName: topCard.firstIssue.fieldName || '', cardTitle: topCard.title }
        : topCard.firstMissing
          ? { label: topCard.firstMissing.label, fieldName: topCard.firstMissing.fieldName || '', cardTitle: topCard.title }
          : null)
      : null;

    const tone = coverage?.tone || (counts.critical > 0 ? 'danger' : counts.attention > 0 ? 'warning' : 'success');
    let overviewTitle = coverage?.label || t(context.i18n, 'ui.practiceLogisticsOverviewReadyTitle', 'Percorso logistico leggibile');
    let overviewDetail = coverage?.detail || t(context.i18n, 'ui.practiceLogisticsOverviewReadyDetail', 'I nodi principali risultano presenti e la tratta è abbastanza chiara per proseguire.');

    if (tone === 'danger' && !coverage) {
      overviewTitle = t(context.i18n, 'ui.practiceLogisticsOverviewCriticalTitle', 'Mancano nodi logistici essenziali');
      overviewDetail = t(context.i18n, 'ui.practiceLogisticsOverviewCriticalDetail', 'Chiudi prima origine, destinazione e tempi minimi: sono i punti che rendono fragile la pratica.');
    } else if (tone === 'warning' && !coverage) {
      overviewTitle = t(context.i18n, 'ui.practiceLogisticsOverviewAttentionTitle', 'Base logistica presente, ma conviene consolidare alcuni snodi');
      overviewDetail = t(context.i18n, 'ui.practiceLogisticsOverviewAttentionDetail', 'La tratta è leggibile, ma ci sono ancora passaggi o nodi di supporto che è meglio chiarire ora.');
    }
    if (routeText) overviewDetail += ` ${routeText}.`;
    if (topItem?.cardTitle) overviewDetail += ` ${t(context.i18n, 'ui.practiceOperationalHubOverviewNextSource', 'Prossimo fronte')}: ${topItem.cardTitle}.`;

    return {
      cards,
      overview: {
        tone,
        title: overviewTitle,
        detail: overviewDetail,
        routeText,
        flowLabel: coverage?.flowLabel || '',
        counts,
        topItem
      }
    };
  }

  function renderItem(item, utils) {
    return `
      <div class="practice-logistics-item" data-status="${escape(utils, item.status)}">
        <div class="practice-logistics-item-main">
          <div class="practice-logistics-item-label">${escape(utils, item.label)}</div>
          <div class="practice-logistics-item-value">${escape(utils, item.value || '—')}</div>
        </div>
        <div class="practice-logistics-item-side">
          <span class="field-relation-pill ${escape(utils, item.pillTone)}">${escape(utils, item.helper)}</span>
        </div>
      </div>`;
  }

  function renderCard(card, i18n, utils) {
    const actionHtml = card.actionFieldName
      ? `<button type="button" class="linked-entity-summary-action subtle" data-focus-practice-field="${escape(utils, card.actionFieldName)}" data-focus-practice-tab="practice">${escape(utils, t(i18n, 'ui.practiceLogisticsGoToAction', 'Vai al nodo'))}</button>`
      : '';
    return `
      <article class="practice-logistics-card" data-status="${escape(utils, card.status)}">
        <div class="practice-logistics-card-head">
          <div>
            <div class="practice-logistics-card-label">${escape(utils, card.title)}</div>
            <div class="practice-logistics-card-detail">${escape(utils, card.detail)}</div>
          </div>
          <div class="practice-logistics-card-meta">
            <span class="count-chip">${escape(utils, `${card.counts.critical} ${t(i18n, 'ui.practiceLogisticsCountCritical', 'essenziali')}`)}</span>
            <span class="count-chip">${escape(utils, `${card.counts.attention} ${t(i18n, 'ui.practiceLogisticsCountAttention', 'da chiarire')}`)}</span>
          </div>
        </div>
        <div class="practice-logistics-items">
          ${card.items.map((item) => renderItem(item, utils)).join('')}
        </div>
        ${actionHtml ? `<div class="practice-logistics-card-actions">${actionHtml}</div>` : ''}
      </article>`;
  }

  function render(options = {}) {
    const { draft = {}, i18n, utils } = options;
    if (!draft || !String(draft.practiceType || '').trim()) return '';
    const summary = summarize(options);
    if (!summary.cards.length) return '';
    const overview = summary.overview;
    return `
      <section class="practice-logistics-board" data-practice-logistics-board>
        <div class="practice-readiness-head">
          <div>
            <div class="practice-overview-kicker">${escape(utils, t(i18n, 'ui.practiceLogisticsKicker', 'Nodi logistici hardening'))}</div>
            <h4 class="practice-readiness-title">${escape(utils, t(i18n, 'ui.practiceLogisticsTitle', 'Percorso fisico e snodi operativi'))}</h4>
            <p class="practice-readiness-subtitle">${escape(utils, t(i18n, 'ui.practiceLogisticsSubtitle', 'Rende più leggibili origine, destinazione, porti, depositi e tempi minimi, così la pratica si prepara meglio per tracking, documenti e ricerca relazionale.'))}</p>
          </div>
          <div class="practice-readiness-counts">
            <span class="count-chip ${escape(utils, overview.tone)}"><strong>${escape(utils, summary.cards.length)}</strong><span>${escape(utils, t(i18n, 'ui.practiceLogisticsCountSections', 'blocchi logistici'))}</span></span>
          </div>
        </div>
        <div class="practice-readiness-overview ${escape(utils, overview.tone)}">
          <div>
            <div class="practice-readiness-overview-title">${escape(utils, overview.title)}</div>
            <div class="practice-readiness-overview-detail">${escape(utils, overview.detail)}</div>
          </div>
          <div class="practice-readiness-overview-side practice-logistics-overview-side">
            ${overview.flowLabel ? `<span class="count-chip"><strong>${escape(utils, overview.flowLabel)}</strong></span>` : ''}
            <span class="count-chip"><strong>${escape(utils, overview.routeText || '—')}</strong></span>
          </div>
        </div>
        <div class="practice-logistics-grid">
          ${summary.cards.map((card) => renderCard(card, i18n, utils)).join('')}
        </div>
      </section>`;
  }

  return {
    summarize,
    render
  };
})();
