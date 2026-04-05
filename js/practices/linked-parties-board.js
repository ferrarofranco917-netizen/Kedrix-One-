window.KedrixOneLinkedPartiesBoard = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;
  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const LinkedEntitySummary = window.KedrixOneLinkedEntitySummary || null;
  const STRUCTURED_ENTITY_KEYS = new Set(['client', 'importer', 'consignee', 'sender', 'carrier']);

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
      for (const item of value) {
        const resolved = text(item, '');
        if (resolved) return resolved;
      }
      return String(fallback || '').trim();
    }
    if (typeof value === 'object') {
      const candidates = [
        value.displayValue,
        value.label,
        value.value,
        value.name,
        value.shortName,
        value.city,
        value.code,
        value.id
      ];
      for (const candidate of candidates) {
        const resolved = text(candidate, '');
        if (resolved) return resolved;
      }
    }
    return String(fallback || '').trim();
  }

  function resolveFieldName(fieldName = '') {
    const clean = text(fieldName, '');
    return clean === 'client' ? 'clientName' : clean;
  }

  function getDynamicValue(draft, fieldName = '') {
    if (!draft || typeof draft !== 'object') return '';
    if (fieldName === 'clientName') return text(draft.clientName, '');
    return text(draft?.dynamicData?.[fieldName], '');
  }

  function isCorePartyField(fieldName = '', entityKey = '') {
    return fieldName === 'clientName' || STRUCTURED_ENTITY_KEYS.has(entityKey);
  }

  function getCandidateFields(type) {
    if (!PracticeSchemas || typeof PracticeSchemas.getSchema !== 'function') return [];
    const schema = PracticeSchemas.getSchema(type);
    const practiceFields = Array.isArray(schema?.tabs?.practice) ? schema.tabs.practice : [];
    const seen = new Set();
    return practiceFields
      .map((field) => {
        if (!field || !field.name) return null;
        const normalizedFieldName = resolveFieldName(field.name);
        if (!normalizedFieldName || seen.has(normalizedFieldName)) return null;
        const entityKey = MasterDataEntities && typeof MasterDataEntities.resolveEntityKeyForField === 'function'
          ? MasterDataEntities.resolveEntityKeyForField(normalizedFieldName)
          : '';
        if (!entityKey) return null;
        seen.add(normalizedFieldName);
        return {
          fieldName: normalizedFieldName,
          entityKey,
          labelKey: field.labelKey,
          fallbackLabel: field.labelKey || normalizedFieldName,
          required: Boolean(field.required || normalizedFieldName === 'clientName'),
          coreParty: isCorePartyField(normalizedFieldName, entityKey)
        };
      })
      .filter(Boolean);
  }

  function buildPriorityMeta(entry, i18n) {
    const coverageReady = Boolean(entry.linkedRecord || entry.manualValue);
    const isBlocking = entry.required && !coverageReady;
    const isToLink = entry.required && Boolean(entry.manualValue) && !entry.linkedRecord;
    const isRecommended = !entry.required && (Boolean(entry.manualValue) || entry.statusKey === 'missing');

    if (isBlocking) {
      return {
        key: 'high',
        className: 'danger',
        label: t(i18n, 'ui.linkedPartiesBoardPriorityHigh', 'Priorità alta'),
        helper: t(i18n, 'ui.linkedPartiesBoardPriorityHighHint', 'Completa questo soggetto per avere una pratica operativa più solida.')
      };
    }
    if (isToLink) {
      return {
        key: 'high',
        className: 'danger',
        label: t(i18n, 'ui.linkedPartiesBoardPriorityToLink', 'Da collegare ora'),
        helper: t(i18n, 'ui.linkedPartiesBoardPriorityToLinkHint', 'Il dato esiste ma va trasformato in collegamento anagrafico stabile.')
      };
    }
    if (isRecommended) {
      return {
        key: 'medium',
        className: 'warning',
        label: t(i18n, 'ui.linkedPartiesBoardPriorityMedium', 'Priorità media'),
        helper: t(i18n, 'ui.linkedPartiesBoardPriorityMediumHint', 'Utile da completare per migliorare qualità dati e riuso operativo.')
      };
    }
    return {
      key: 'low',
      className: 'success',
      label: t(i18n, 'ui.linkedPartiesBoardPriorityLow', 'Pronto'),
      helper: t(i18n, 'ui.linkedPartiesBoardPriorityLowHint', 'Questo soggetto è già pronto per il flusso operativo corrente.')
    };
  }

  function buildEntries(options = {}) {
    const { state, draft = {}, type, i18n } = options;
    const fields = getCandidateFields(type || draft.practiceType);
    return fields.map((field) => {
      const linkedRecord = LinkedEntitySummary && typeof LinkedEntitySummary.getLinkedRecord === 'function'
        ? LinkedEntitySummary.getLinkedRecord({ state, draft, fieldName: field.fieldName })
        : null;
      const summaryData = LinkedEntitySummary && typeof LinkedEntitySummary.buildSummaryData === 'function'
        ? LinkedEntitySummary.buildSummaryData(linkedRecord, i18n)
        : null;
      const quality = LinkedEntitySummary && typeof LinkedEntitySummary.buildDataQuality === 'function'
        ? LinkedEntitySummary.buildDataQuality(linkedRecord, i18n)
        : null;
      const manualValue = getDynamicValue(draft, field.fieldName);
      const exactMatchRecord = !linkedRecord && manualValue && MasterDataEntities && typeof MasterDataEntities.findStructuredEntityRecordByValue === 'function'
        ? MasterDataEntities.findStructuredEntityRecordByValue(state, field.entityKey, manualValue)
        : null;
      const supportsQuickAdd = STRUCTURED_ENTITY_KEYS.has(field.entityKey);

      let statusKey = 'missing';
      let statusLabel = t(i18n, 'ui.linkedPartiesBoardStatusMissing', 'Da completare');
      let statusClass = 'default';
      let value = t(i18n, 'ui.practiceOverviewNoData', 'Nessun dato rilevante ancora inserito');
      let helper = '';

      if (summaryData && summaryData.title) {
        statusKey = 'linked';
        statusLabel = t(i18n, 'ui.linkedPartiesBoardStatusLinked', 'Collegato');
        statusClass = 'success';
        value = summaryData.title;
        helper = quality && quality.coverageLabel
          ? [quality.coverageLabel, quality.missingLabel].filter(Boolean).join(' · ')
          : (summaryData.facts || []).map((fact) => text(fact.value, '')).filter(Boolean).join(' · ');
      } else if (manualValue) {
        statusKey = 'manual';
        statusLabel = t(i18n, 'ui.linkedPartiesBoardStatusManual', 'Manuale');
        statusClass = 'warning';
        value = manualValue;
        helper = exactMatchRecord
          ? t(i18n, 'ui.linkedPartiesBoardMatchHint', 'Scheda anagrafica già presente: puoi collegarla subito senza ricrearla.')
          : t(i18n, 'ui.linkedPartiesBoardManualHint', 'Valore presente ma non ancora collegato a una scheda anagrafica.');
      }

      const priority = buildPriorityMeta({ ...field, linkedRecord, manualValue, statusKey }, i18n);
      const readinessLabel = field.required
        ? t(i18n, 'ui.linkedPartiesBoardRequiredLabel', 'Essenziale')
        : t(i18n, 'ui.linkedPartiesBoardOptionalLabel', 'Supporto');

      return {
        ...field,
        label: t(i18n, field.labelKey, field.fallbackLabel),
        linkedRecord,
        summaryData,
        quality,
        manualValue,
        exactMatchRecord,
        supportsQuickAdd,
        statusKey,
        statusLabel,
        statusClass,
        value,
        helper,
        priority,
        readinessLabel,
        isCovered: Boolean(linkedRecord || manualValue),
        canOpen: Boolean(linkedRecord),
        canLink: Boolean(exactMatchRecord && exactMatchRecord.id),
        canCreate: supportsQuickAdd,
        canFocus: true
      };
    });
  }

  function buildCounts(entries = []) {
    return entries.reduce((acc, entry) => {
      if (entry.statusKey === 'linked') acc.linked += 1;
      else if (entry.statusKey === 'manual') acc.manual += 1;
      else acc.missing += 1;
      if (entry.required) {
        acc.requiredTotal += 1;
        if (entry.isCovered) acc.requiredCovered += 1;
        if (entry.statusKey === 'linked') acc.requiredLinked += 1;
      }
      if (entry.priority?.key === 'high') acc.highPriority += 1;
      else if (entry.priority?.key === 'medium') acc.mediumPriority += 1;
      return acc;
    }, {
      linked: 0,
      manual: 0,
      missing: 0,
      requiredTotal: 0,
      requiredCovered: 0,
      requiredLinked: 0,
      highPriority: 0,
      mediumPriority: 0
    });
  }

  function buildOperationalOverview(entries = [], counts, i18n) {
    const blockingEntries = entries.filter((entry) => entry.required && !entry.isCovered);
    const toLinkEntries = entries.filter((entry) => entry.required && entry.statusKey === 'manual');
    const recommendedEntries = entries.filter((entry) => !entry.required && entry.priority?.key === 'medium');
    const topEntry = blockingEntries[0] || toLinkEntries[0] || recommendedEntries[0] || null;

    let statusClass = 'success';
    let title = t(i18n, 'ui.linkedPartiesBoardOverviewReadyTitle', 'Base soggetti pronta');
    let detail = counts.requiredTotal
      ? t(i18n, 'ui.linkedPartiesBoardOverviewReadyDetail', 'Essenziali coperti {{covered}}/{{total}} · collegati {{linked}}/{{total}}')
        .replace('{{covered}}', String(counts.requiredCovered))
        .replace('{{linked}}', String(counts.requiredLinked))
        .replace('{{total}}', String(counts.requiredTotal))
      : t(i18n, 'ui.linkedPartiesBoardOverviewNoEssentials', 'Nessun soggetto essenziale rilevato per questo schema.');

    if (blockingEntries.length) {
      statusClass = 'danger';
      title = t(i18n, 'ui.linkedPartiesBoardOverviewBlockingTitle', 'Priorità alta: completa i soggetti essenziali');
      detail = t(i18n, 'ui.linkedPartiesBoardOverviewBlockingDetail', 'Mancano ancora: {{items}}')
        .replace('{{items}}', blockingEntries.slice(0, 3).map((entry) => entry.label).join(', '));
    } else if (toLinkEntries.length) {
      statusClass = 'warning';
      title = t(i18n, 'ui.linkedPartiesBoardOverviewToLinkTitle', 'Buona base, ma alcuni soggetti vanno collegati');
      detail = t(i18n, 'ui.linkedPartiesBoardOverviewToLinkDetail', 'Trasforma in schede collegate: {{items}}')
        .replace('{{items}}', toLinkEntries.slice(0, 3).map((entry) => entry.label).join(', '));
    } else if (recommendedEntries.length) {
      statusClass = 'default';
      title = t(i18n, 'ui.linkedPartiesBoardOverviewRecommendedTitle', 'Pratica leggibile: puoi rafforzare i soggetti di supporto');
      detail = t(i18n, 'ui.linkedPartiesBoardOverviewRecommendedDetail', 'Da completare in seconda battuta: {{items}}')
        .replace('{{items}}', recommendedEntries.slice(0, 3).map((entry) => entry.label).join(', '));
    }

    return { statusClass, title, detail, topEntry };
  }

  function renderCountChip(utils, label, value, className = 'default') {
    return `<span class="linked-entity-summary-chip ${escape(utils, className)}"><strong>${escape(utils, String(value))}</strong>&nbsp;${escape(utils, label)}</span>`;
  }

  function renderCardActions(entry, i18n, utils) {
    const actions = [];
    if (entry.canOpen) {
      actions.push(`<button type="button" class="linked-entity-summary-action" data-open-linked-field="${escape(utils, entry.fieldName)}">${escape(utils, t(i18n, 'ui.linkedEntitySummaryOpenAction', 'Apri scheda'))}</button>`);
    }
    if (entry.canLink) {
      actions.push(`<button type="button" class="linked-entity-summary-action primary" data-link-practice-entity-field="${escape(utils, entry.fieldName)}" data-link-practice-entity-id="${escape(utils, entry.exactMatchRecord.id)}">${escape(utils, t(i18n, 'ui.linkedPartiesBoardLinkAction', 'Collega scheda'))}</button>`);
    }
    if (!entry.canOpen && !entry.canLink && entry.canCreate) {
      actions.push(`<button type="button" class="linked-entity-summary-action" data-quick-add-field="${escape(utils, entry.fieldName)}">${escape(utils, t(i18n, 'ui.linkedPartiesBoardCreateAction', 'Crea scheda'))}</button>`);
    }
    if (entry.canFocus) {
      actions.push(`<button type="button" class="linked-entity-summary-action subtle" data-focus-practice-field="${escape(utils, entry.fieldName)}" data-focus-practice-tab="practice">${escape(utils, t(i18n, 'ui.linkedPartiesBoardFocusAction', 'Vai al campo'))}</button>`);
    }
    if (!actions.length) return '';
    return `<div class="linked-parties-board-card-actions">${actions.join('')}</div>`;
  }

  function renderCardMeta(entry, i18n, utils) {
    const chips = [
      `<span class="linked-entity-summary-chip ${escape(utils, entry.priority.className)}">${escape(utils, entry.priority.label)}</span>`,
      `<span class="linked-entity-summary-chip default">${escape(utils, entry.readinessLabel)}</span>`
    ];
    return `<div class="linked-parties-board-card-meta">${chips.join('')}</div>`;
  }

  function renderOverviewPanel(overview, counts, i18n, utils) {
    const chips = [
      renderCountChip(utils, t(i18n, 'ui.linkedPartiesBoardCountHighPriority', 'priorità alta'), counts.highPriority, counts.highPriority ? 'danger' : 'success'),
      renderCountChip(utils, t(i18n, 'ui.linkedPartiesBoardCountMediumPriority', 'priorità media'), counts.mediumPriority, counts.mediumPriority ? 'warning' : 'default'),
      renderCountChip(utils, t(i18n, 'ui.linkedPartiesBoardCountEssentialCovered', 'essenziali coperti'), `${counts.requiredCovered}/${counts.requiredTotal || 0}`, counts.requiredCovered === counts.requiredTotal ? 'success' : 'warning')
    ].join('');

    const actionHtml = overview.topEntry
      ? `<button type="button" class="btn secondary linked-parties-board-priority-btn" data-focus-practice-field="${escape(utils, overview.topEntry.fieldName)}" data-focus-practice-tab="practice">${escape(utils, t(i18n, 'ui.linkedPartiesBoardPriorityAction', 'Vai alla priorità principale'))}</button>`
      : '';

    return `
      <div class="linked-parties-board-overview ${escape(utils, overview.statusClass)}">
        <div class="linked-parties-board-overview-main">
          <div class="linked-parties-board-overview-title">${escape(utils, overview.title)}</div>
          <div class="linked-parties-board-overview-detail">${escape(utils, overview.detail)}</div>
        </div>
        <div class="linked-parties-board-overview-side">
          <div class="linked-parties-board-overview-chips">${chips}</div>
          ${actionHtml}
        </div>
      </div>`;
  }

  function render(options = {}) {
    const { state, draft = {}, type, i18n, utils } = options;
    if (!draft || !String(draft.practiceType || '').trim()) return '';
    const entries = buildEntries({ state, draft, type: type || draft.practiceType, i18n }).filter((entry) => entry.coreParty || entry.statusKey !== 'missing' || entry.manualValue || entry.linkedRecord || entry.label);
    if (!entries.length) return '';

    const counts = buildCounts(entries);
    const overview = buildOperationalOverview(entries, counts, i18n);
    const headerCounts = [
      renderCountChip(utils, t(i18n, 'ui.linkedPartiesBoardCountLinked', 'collegati'), counts.linked, 'success'),
      renderCountChip(utils, t(i18n, 'ui.linkedPartiesBoardCountManual', 'manuali'), counts.manual, 'warning'),
      renderCountChip(utils, t(i18n, 'ui.linkedPartiesBoardCountMissing', 'da completare'), counts.missing, 'default')
    ].join('');

    return `
      <section class="linked-parties-board" data-linked-parties-board>
        <div class="linked-parties-board-head">
          <div>
            <div class="practice-overview-kicker">${escape(utils, t(i18n, 'ui.linkedPartiesBoardKicker', 'Soggetti in pratica'))}</div>
            <h4 class="linked-parties-board-title">${escape(utils, t(i18n, 'ui.linkedPartiesBoardTitle', 'Quadro soggetti collegati'))}</h4>
            <p class="linked-parties-board-subtitle">${escape(utils, t(i18n, 'ui.linkedPartiesBoardSubtitle', 'Confronto rapido tra anagrafiche collegate, valori manuali e punti ancora da completare.'))}</p>
          </div>
          <div class="linked-parties-board-counts">${headerCounts}</div>
        </div>
        ${renderOverviewPanel(overview, counts, i18n, utils)}
        <div class="linked-parties-board-grid">
          ${entries.map((entry) => `
            <article class="linked-parties-board-card" data-linked-parties-card="${escape(utils, entry.fieldName)}" data-status="${escape(utils, entry.statusKey)}" data-priority="${escape(utils, entry.priority.key)}">
              <div class="linked-parties-board-card-head">
                <div class="linked-parties-board-card-label">${escape(utils, entry.label)}</div>
                <span class="linked-entity-summary-chip ${escape(utils, entry.statusClass)}">${escape(utils, entry.statusLabel)}</span>
              </div>
              ${renderCardMeta(entry, i18n, utils)}
              <div class="linked-parties-board-card-value">${escape(utils, entry.value)}</div>
              <div class="linked-parties-board-card-helper">${escape(utils, entry.helper || entry.priority.helper || t(i18n, 'ui.linkedPartiesBoardMissingHint', 'Nessuna scheda collegata ancora disponibile.'))}</div>
              ${renderCardActions(entry, i18n, utils)}
            </article>`).join('')}
        </div>
      </section>`;
  }

  function summarize(options = {}) {
    const { state, draft = {}, type, i18n } = options;
    if (!draft || !String(draft.practiceType || '').trim()) {
      return { entries: [], counts: buildCounts([]), overview: buildOperationalOverview([], buildCounts([]), i18n) };
    }
    const entries = buildEntries({ state, draft, type: type || draft.practiceType, i18n })
      .filter((entry) => entry.coreParty || entry.statusKey !== 'missing' || entry.manualValue || entry.linkedRecord || entry.label);
    const counts = buildCounts(entries);
    const overview = buildOperationalOverview(entries, counts, i18n);
    return { entries, counts, overview };
  }

  return {
    render,
    summarize
  };
})();
