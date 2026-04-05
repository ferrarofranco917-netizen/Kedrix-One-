window.KedrixOneLinkedPartiesBoard = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas || null;
  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const LinkedEntitySummary = window.KedrixOneLinkedEntitySummary || null;

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
          fallbackLabel: field.labelKey || normalizedFieldName
        };
      })
      .filter(Boolean);
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
        helper = t(i18n, 'ui.linkedPartiesBoardManualHint', 'Valore presente ma non ancora collegato a una scheda anagrafica.');
      }

      return {
        ...field,
        label: t(i18n, field.labelKey, field.fallbackLabel),
        linkedRecord,
        summaryData,
        quality,
        manualValue,
        statusKey,
        statusLabel,
        statusClass,
        value,
        helper,
        canOpen: Boolean(linkedRecord)
      };
    });
  }

  function buildCounts(entries = []) {
    return entries.reduce((acc, entry) => {
      if (entry.statusKey === 'linked') acc.linked += 1;
      else if (entry.statusKey === 'manual') acc.manual += 1;
      else acc.missing += 1;
      return acc;
    }, { linked: 0, manual: 0, missing: 0 });
  }

  function renderCountChip(utils, label, value, className = 'default') {
    return `<span class="linked-entity-summary-chip ${escape(utils, className)}"><strong>${escape(utils, String(value))}</strong>&nbsp;${escape(utils, label)}</span>`;
  }

  function render(options = {}) {
    const { state, draft = {}, type, i18n, utils } = options;
    if (!draft || !String(draft.practiceType || '').trim()) return '';
    const entries = buildEntries({ state, draft, type: type || draft.practiceType, i18n }).filter((entry) => entry.statusKey !== 'missing' || entry.manualValue || entry.linkedRecord || entry.label);
    if (!entries.length) return '';

    const counts = buildCounts(entries);
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
        <div class="linked-parties-board-grid">
          ${entries.map((entry) => `
            <article class="linked-parties-board-card" data-linked-parties-card="${escape(utils, entry.fieldName)}" data-status="${escape(utils, entry.statusKey)}">
              <div class="linked-parties-board-card-head">
                <div class="linked-parties-board-card-label">${escape(utils, entry.label)}</div>
                <span class="linked-entity-summary-chip ${escape(utils, entry.statusClass)}">${escape(utils, entry.statusLabel)}</span>
              </div>
              <div class="linked-parties-board-card-value">${escape(utils, entry.value)}</div>
              <div class="linked-parties-board-card-helper">${escape(utils, entry.helper || t(i18n, 'ui.linkedPartiesBoardMissingHint', 'Nessuna scheda collegata ancora disponibile.'))}</div>
              ${entry.canOpen ? `<div class="linked-parties-board-card-actions"><button type="button" class="linked-entity-summary-action" data-open-linked-field="${escape(utils, entry.fieldName)}">${escape(utils, t(i18n, 'ui.linkedEntitySummaryOpenAction', 'Apri scheda'))}</button></div>` : ''}
            </article>`).join('')}
        </div>
      </section>`;
  }

  return {
    render
  };
})();
