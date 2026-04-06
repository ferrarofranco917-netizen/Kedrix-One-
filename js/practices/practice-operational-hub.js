window.KedrixOnePracticeOperationalHub = (() => {
  'use strict';

  const LinkedPartiesBoard = window.KedrixOneLinkedPartiesBoard || null;
  const PracticeReadinessBoard = window.KedrixOnePracticeReadinessBoard || null;
  const PracticeLogisticsBoard = window.KedrixOnePracticeLogisticsBoard || null;
  const PracticeDocumentReadinessBoard = window.KedrixOnePracticeDocumentReadinessBoard || null;

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function escape(utils, value) {
    return utils && typeof utils.escapeHtml === 'function'
      ? utils.escapeHtml(String(value || ''))
      : String(value || '');
  }

  function toneToBadgeClass(tone) {
    if (tone === 'danger' || tone === 'critical') return 'danger';
    if (tone === 'warning' || tone === 'attention') return 'warning';
    return 'success';
  }

  function toneOrder(tone) {
    return tone === 'danger' ? 0 : tone === 'warning' ? 1 : 2;
  }

  function buildActionButton(action, utils) {
    if (!action) return '';
    if (action.kind === 'attachments') {
      return `<button type="button" class="btn secondary operational-hub-action-btn" data-focus-practice-tab-only="attachments">${escape(utils, action.label)}</button>`;
    }
    if (action.kind === 'field' && action.fieldName) {
      return `<button type="button" class="btn secondary operational-hub-action-btn" data-focus-practice-field="${escape(utils, action.fieldName)}" data-focus-practice-tab="practice">${escape(utils, action.label)}</button>`;
    }
    return '';
  }

  function buildSourceCards(context = {}) {
    const { state, draft = {}, type, i18n } = context;
    const partiesSummary = LinkedPartiesBoard && typeof LinkedPartiesBoard.summarize === 'function'
      ? LinkedPartiesBoard.summarize({ state, draft, type, i18n })
      : { entries: [], counts: { linked: 0, manual: 0, missing: 0, highPriority: 0, mediumPriority: 0 }, overview: { statusClass: 'default', title: '', detail: '', topEntry: null } };
    const readinessSummary = PracticeReadinessBoard && typeof PracticeReadinessBoard.summarize === 'function'
      ? PracticeReadinessBoard.summarize({ draft, type, i18n })
      : { sections: [], overview: { counts: { ready: 0, attention: 0, critical: 0 }, tone: 'default', title: '', detail: '', topSection: null } };
    const logisticsSummary = PracticeLogisticsBoard && typeof PracticeLogisticsBoard.summarize === 'function'
      ? PracticeLogisticsBoard.summarize({ state, draft, type, companyConfig: context.companyConfig || null, i18n })
      : { cards: [], overview: { counts: { ready: 0, attention: 0, critical: 0 }, tone: 'default', title: '', detail: '', topItem: null, routeText: '' } };
    const documentSummary = PracticeDocumentReadinessBoard && typeof PracticeDocumentReadinessBoard.summarize === 'function'
      ? PracticeDocumentReadinessBoard.summarize({ state, draft, type, i18n })
      : { cards: [], overview: { counts: { ready: 0, attention: 0, critical: 0 }, tone: 'default', title: '', detail: '', topCard: null, totalAttachments: 0 } };

    const cards = [
      {
        key: 'parties',
        tone: partiesSummary.overview?.statusClass === 'danger' ? 'danger' : partiesSummary.overview?.statusClass === 'warning' ? 'warning' : 'success',
        label: t(i18n, 'ui.practiceOperationalHubSourceParties', 'Soggetti'),
        title: partiesSummary.overview?.title || t(i18n, 'ui.practiceOperationalHubSourcePartiesFallbackTitle', 'Quadro soggetti collegati'),
        detail: partiesSummary.overview?.detail || t(i18n, 'ui.practiceOperationalHubSourcePartiesFallbackDetail', 'Controlla collegamenti, valori manuali e soggetti ancora da completare.'),
        chips: [
          `${partiesSummary.counts?.linked || 0} ${t(i18n, 'ui.linkedPartiesBoardCountLinked', 'collegati')}`,
          `${partiesSummary.counts?.manual || 0} ${t(i18n, 'ui.linkedPartiesBoardCountManual', 'manuali')}`,
          `${partiesSummary.counts?.missing || 0} ${t(i18n, 'ui.linkedPartiesBoardCountMissing', 'da completare')}`
        ],
        action: partiesSummary.overview?.topEntry ? {
          kind: 'field',
          fieldName: partiesSummary.overview.topEntry.fieldName,
          label: t(i18n, 'ui.practiceOperationalHubSourcePartiesAction', 'Vai al soggetto prioritario')
        } : null,
        priorityLabel: partiesSummary.overview?.topEntry?.label || ''
      },
      {
        key: 'readiness',
        tone: readinessSummary.overview?.tone === 'danger' ? 'danger' : readinessSummary.overview?.tone === 'warning' ? 'warning' : 'success',
        label: t(i18n, 'ui.practiceOperationalHubSourceReadiness', 'Operatività'),
        title: readinessSummary.overview?.title || t(i18n, 'ui.practiceOperationalHubSourceReadinessFallbackTitle', 'Completezza operativa'),
        detail: readinessSummary.overview?.detail || t(i18n, 'ui.practiceOperationalHubSourceReadinessFallbackDetail', 'Controlla blocchi essenziali, nodi logistici e riferimenti operativi.'),
        chips: [
          `${readinessSummary.overview?.counts?.critical || 0} ${t(i18n, 'ui.practiceReadinessCountCritical', 'priorità alta')}`,
          `${readinessSummary.overview?.counts?.attention || 0} ${t(i18n, 'ui.practiceReadinessCountAttention', 'da rifinire')}`,
          `${readinessSummary.overview?.counts?.ready || 0} ${t(i18n, 'ui.practiceReadinessCountReady', 'pronti')}`
        ],
        action: readinessSummary.overview?.topSection?.firstMissing ? {
          kind: 'field',
          fieldName: readinessSummary.overview.topSection.firstMissing.resolvedField || '',
          label: t(i18n, 'ui.practiceOperationalHubSourceReadinessAction', 'Vai al blocco operativo')
        } : null,
        priorityLabel: readinessSummary.overview?.topSection?.title || ''
      },
      {
        key: 'logistics',
        tone: logisticsSummary.overview?.tone === 'danger' ? 'danger' : logisticsSummary.overview?.tone === 'warning' ? 'warning' : 'success',
        label: t(i18n, 'ui.practiceOperationalHubSourceLogistics', 'Logistica'),
        title: logisticsSummary.overview?.title || t(i18n, 'ui.practiceOperationalHubSourceLogisticsFallbackTitle', 'Percorso logistico'),
        detail: logisticsSummary.overview?.detail || t(i18n, 'ui.practiceOperationalHubSourceLogisticsFallbackDetail', 'Controlla origine, destinazione, snodi intermedi e tempi minimi del percorso fisico.'),
        chips: [
          `${logisticsSummary.overview?.counts?.critical || 0} ${t(i18n, 'ui.practiceLogisticsCountCritical', 'essenziali')}`,
          `${logisticsSummary.overview?.counts?.attention || 0} ${t(i18n, 'ui.practiceLogisticsCountAttention', 'da chiarire')}`,
          `${logisticsSummary.overview?.counts?.ready || 0} ${t(i18n, 'ui.practiceLogisticsCountReady', 'nodi pronti')}`
        ],
        action: logisticsSummary.overview?.topItem?.fieldName ? {
          kind: 'field',
          fieldName: logisticsSummary.overview.topItem.fieldName,
          label: t(i18n, 'ui.practiceOperationalHubSourceLogisticsAction', 'Vai al nodo logistico')
        } : null,
        priorityLabel: logisticsSummary.overview?.topItem?.label || logisticsSummary.overview?.routeText || ''
      },
      {
        key: 'documents',
        tone: documentSummary.overview?.tone === 'danger' ? 'danger' : documentSummary.overview?.tone === 'warning' ? 'warning' : 'success',
        label: t(i18n, 'ui.practiceOperationalHubSourceDocuments', 'Documenti'),
        title: documentSummary.overview?.title || t(i18n, 'ui.practiceOperationalHubSourceDocumentsFallbackTitle', 'Completezza documentale'),
        detail: documentSummary.overview?.detail || t(i18n, 'ui.practiceOperationalHubSourceDocumentsFallbackDetail', 'Controlla riferimenti e allegati essenziali per il fascicolo.'),
        chips: [
          `${documentSummary.overview?.counts?.critical || 0} ${t(i18n, 'ui.practiceDocReadinessCountCritical', 'essenziali mancanti')}`,
          `${documentSummary.overview?.counts?.attention || 0} ${t(i18n, 'ui.practiceDocReadinessCountAttention', 'da consolidare')}`,
          `${documentSummary.overview?.totalAttachments || 0} ${t(i18n, 'ui.practiceDocReadinessArchiveCountLabel', 'Archivio')}`
        ],
        action: documentSummary.overview?.topCard?.action ? {
          kind: documentSummary.overview.topCard.action.kind === 'attachments' ? 'attachments' : 'field',
          fieldName: documentSummary.overview.topCard.action.fieldName || '',
          label: documentSummary.overview.topCard.action.label || t(i18n, 'ui.practiceOperationalHubSourceDocumentsAction', 'Vai al pacchetto documentale')
        } : null,
        priorityLabel: documentSummary.overview?.topCard?.title || ''
      }
    ];

    const overallTone = cards.slice().sort((a, b) => toneOrder(a.tone) - toneOrder(b.tone))[0]?.tone || 'success';
    return { cards, overallTone };
  }

  function buildNextActions(cards, i18n) {
    const actions = cards
      .filter((card) => card.action)
      .map((card) => ({
        sourceKey: card.key,
        sourceLabel: card.label,
        tone: card.tone,
        title: card.priorityLabel || card.title,
        detail: card.detail,
        action: card.action
      }))
      .sort((a, b) => toneOrder(a.tone) - toneOrder(b.tone));
    return actions.slice(0, 3).map((entry, index) => ({
      ...entry,
      rank: index + 1,
      rankLabel: t(i18n, 'ui.practiceOperationalHubStepLabel', 'Step {{count}}').replace('{{count}}', String(index + 1))
    }));
  }

  function buildOverview(cards, overallTone, actions, i18n) {
    if (!actions.length) {
      return {
        tone: 'success',
        title: t(i18n, 'ui.practiceOperationalHubOverviewReadyTitle', 'Pratica leggibile e ben instradata'),
        detail: t(i18n, 'ui.practiceOperationalHubOverviewReadyDetail', 'I livelli di controllo risultano stabili: puoi continuare con i completamenti di supporto o con la lavorazione successiva.')
      };
    }
    const first = actions[0];
    let title = t(i18n, 'ui.practiceOperationalHubOverviewCriticalTitle', 'Chiudi prima i blocchi che impattano davvero la pratica');
    let detail = t(i18n, 'ui.practiceOperationalHubOverviewCriticalDetail', 'Parti dal punto più urgente e poi passa ai completamenti utili, così la pratica resta coerente anche su documenti e collegamenti.');
    if (overallTone === 'warning') {
      title = t(i18n, 'ui.practiceOperationalHubOverviewAttentionTitle', 'Base pronta, ma conviene consolidare i prossimi punti');
      detail = t(i18n, 'ui.practiceOperationalHubOverviewAttentionDetail', 'La pratica è leggibile: chiudi adesso i passaggi più vicini per evitare correzioni dopo.');
    }
    detail += ` ${t(i18n, 'ui.practiceOperationalHubOverviewNextSource', 'Prossimo fronte')}: ${first.sourceLabel}.`;
    return { tone: overallTone, title, detail };
  }

  function renderActionCard(item, utils) {
    const buttonHtml = buildActionButton(item.action, utils);
    return `
      <article class="practice-operational-hub-action-card" data-tone="${escape(utils, item.tone)}">
        <div class="practice-operational-hub-action-rank">${escape(utils, item.rankLabel)}</div>
        <div class="practice-operational-hub-action-main">
          <div class="practice-operational-hub-action-source">${escape(utils, item.sourceLabel)}</div>
          <div class="practice-operational-hub-action-title">${escape(utils, item.title)}</div>
          <div class="practice-operational-hub-action-detail">${escape(utils, item.detail)}</div>
        </div>
        <div class="practice-operational-hub-action-side">${buttonHtml}</div>
      </article>`;
  }

  function render(options = {}) {
    const { draft = {}, i18n, utils } = options;
    if (!draft || !String(draft.practiceType || '').trim()) return '';
    const { cards, overallTone } = buildSourceCards(options);
    const nextActions = buildNextActions(cards, i18n);
    const overview = buildOverview(cards, overallTone, nextActions, i18n);

    const sourceCardsHtml = cards.map((card) => `
      <article class="practice-operational-hub-source" data-tone="${escape(utils, card.tone)}">
        <div class="practice-operational-hub-source-head">
          <div class="practice-operational-hub-source-label">${escape(utils, card.label)}</div>
          <span class="badge ${toneToBadgeClass(card.tone)}">${escape(utils, card.tone === 'danger' ? t(i18n, 'ui.practiceOperationalHubStatusCritical', 'Priorità alta') : card.tone === 'warning' ? t(i18n, 'ui.practiceOperationalHubStatusAttention', 'Da consolidare') : t(i18n, 'ui.practiceOperationalHubStatusReady', 'Stabile'))}</span>
        </div>
        <div class="practice-operational-hub-source-title">${escape(utils, card.title)}</div>
        <div class="practice-operational-hub-source-detail">${escape(utils, card.detail)}</div>
        <div class="practice-operational-hub-source-chips">${card.chips.map((chip) => `<span class="count-chip">${escape(utils, chip)}</span>`).join('')}</div>
        ${card.action ? `<div class="practice-operational-hub-source-actions">${buildActionButton(card.action, utils)}</div>` : ''}
      </article>`).join('');

    const actionsHtml = nextActions.length
      ? `<div class="practice-operational-hub-actions">${nextActions.map((item) => renderActionCard(item, utils)).join('')}</div>`
      : `<div class="practice-operational-hub-empty">${escape(utils, t(i18n, 'ui.practiceOperationalHubEmpty', 'Nessuna urgenza attiva: puoi usare i board sotto per rifinire i dettagli di supporto.'))}</div>`;

    return `
      <section class="practice-operational-hub" data-practice-operational-hub>
        <div class="practice-readiness-head">
          <div>
            <div class="practice-overview-kicker">${escape(utils, t(i18n, 'ui.practiceOperationalHubKicker', 'Hub operativo'))}</div>
            <h4 class="practice-readiness-title">${escape(utils, t(i18n, 'ui.practiceOperationalHubTitle', 'Prossime azioni in pratica'))}</h4>
            <p class="practice-readiness-subtitle">${escape(utils, t(i18n, 'ui.practiceOperationalHubSubtitle', 'Unifica soggetti, completezza operativa e documenti in una vista sola, così sai subito dove intervenire senza rincorrere più board separati.'))}</p>
          </div>
          <div class="practice-readiness-counts">
            <span class="count-chip ${escape(utils, toneToBadgeClass(overallTone))}"><strong>${escape(utils, nextActions.length)}</strong><span>${escape(utils, t(i18n, 'ui.practiceOperationalHubPendingActions', 'azioni prioritarie'))}</span></span>
          </div>
        </div>
        <div class="practice-readiness-overview ${escape(utils, overallTone)}">
          <div>
            <div class="practice-readiness-overview-title">${escape(utils, overview.title)}</div>
            <div class="practice-readiness-overview-detail">${escape(utils, overview.detail)}</div>
          </div>
        </div>
        <div class="practice-operational-hub-sources">${sourceCardsHtml}</div>
        ${actionsHtml}
      </section>`;
  }

  return {
    render,
    buildSourceCards,
    buildNextActions
  };
})();
