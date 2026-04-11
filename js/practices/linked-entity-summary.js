window.KedrixOneLinkedEntitySummary = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

  const QUALITY_CLASS_BY_KEY = {
    complete: 'success',
    partial: 'warning',
    basic: 'default'
  };

  function text(source, fallback = '') {
    if (source === null || source === undefined) return String(fallback || '').trim();
    if (typeof source === 'string' || typeof source === 'number' || typeof source === 'boolean') return String(source).trim();
    if (Array.isArray(source)) {
      for (const item of source) {
        const resolved = text(item, '');
        if (resolved) return resolved;
      }
      return String(fallback || '').trim();
    }
    if (typeof source === 'object') {
      const candidates = [
        source.displayValue,
        source.name,
        source.value,
        source.label,
        source.shortName,
        source.code,
        source.city,
        source.id
      ];
      for (const candidate of candidates) {
        const resolved = text(candidate, '');
        if (resolved) return resolved;
      }
    }
    return String(fallback || '').trim();
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function escape(utils, value) {
    return utils && typeof utils.escapeHtml === 'function'
      ? utils.escapeHtml(String(value || ''))
      : String(value || '');
  }

  function join(parts = [], separator = ' · ') {
    return parts.map((item) => text(item, '')).filter(Boolean).join(separator);
  }

  function resolveFieldName(fieldName = '') {
    const clean = text(fieldName, '');
    return clean === 'client' ? 'clientName' : clean;
  }

  function getEntityDefinition(i18n, fieldName = '') {
    if (!MasterDataEntities || typeof MasterDataEntities.resolveEntityKeyForField !== 'function' || typeof MasterDataEntities.getEntityDefinitions !== 'function') return null;
    const entityKey = MasterDataEntities.resolveEntityKeyForField(resolveFieldName(fieldName));
    if (!entityKey) return null;
    const definitions = MasterDataEntities.getEntityDefinitions(i18n) || {};
    return definitions[entityKey] || null;
  }

  function buildDataQuality(record, i18n) {
    if (!record || typeof record !== 'object') return null;

    const qualityAreas = {
      fiscal: Boolean(text([record.vatNumber, record.taxCode, record.code], '')),
      location: Boolean(text([record.address, record.zipCode, record.city, record.province, record.country], '')),
      contact: Boolean(text([record.email, record.phone, record.pec], '')),
      admin: Boolean(text([record.sdiCode, record.sdi, record.shortName, record.description, record.notes], ''))
    };

    const score = Object.values(qualityAreas).filter(Boolean).length;
    let key = 'basic';
    if (score >= 3) key = 'complete';
    else if (score >= 2) key = 'partial';

    const missing = [];
    if (!qualityAreas.fiscal) missing.push(t(i18n, 'ui.linkedEntitySummaryMissingFiscal', 'dati fiscali'));
    if (!qualityAreas.location) missing.push(t(i18n, 'ui.linkedEntitySummaryMissingLocation', 'località'));
    if (!qualityAreas.contact) missing.push(t(i18n, 'ui.linkedEntitySummaryMissingContact', 'contatto'));

    return {
      key,
      className: QUALITY_CLASS_BY_KEY[key] || 'default',
      label: t(i18n, `ui.linkedEntitySummaryQuality${key.charAt(0).toUpperCase()}${key.slice(1)}`, key),
      coverageLabel: t(i18n, 'ui.linkedEntitySummaryQualityCoverage', '{{count}}/4 aree complete').replace('{{count}}', String(score)),
      missingLabel: missing.length ? t(i18n, 'ui.linkedEntitySummaryMissingHint', 'Mancano: {{items}}').replace('{{items}}', missing.join(', ')) : ''
    };
  }

  function getLinkedRecord(options = {}) {
    const fieldName = resolveFieldName(options.fieldName || '');
    if (!fieldName || !MasterDataEntities || typeof MasterDataEntities.getLinkedRecordFromDraft !== 'function') return null;
    return MasterDataEntities.getLinkedRecordFromDraft({
      state: options.state,
      draft: options.draft,
      fieldName
    }) || null;
  }

  function buildSummaryData(record, i18n) {
    if (!record || typeof record !== 'object') return null;

    const title = text(record.shortName || record.name || record.value || record.label || record.displayValue, '');
    const vatNumber = text(record.vatNumber, '');
    const code = text(record.code, '');
    const taxCode = text(record.taxCode, '');
    const location = join([record.city, record.province, record.country], ', ');
    const contact = join([record.email, record.phone]);
    const address = join([record.address, join([record.zipCode, record.city], ' ')], ' · ');
    const description = text(record.description || record.notes || record.detail, '');
    const pec = text(record.pec, '');
    const sdi = text(record.sdiCode || record.sdi, '');

    const facts = [];
    if (vatNumber) {
      facts.push({ label: t(i18n, 'ui.linkedEntitySummaryVat', 'P.IVA'), value: vatNumber });
    } else if (code) {
      facts.push({ label: t(i18n, 'ui.linkedEntitySummaryCode', 'Codice'), value: code });
    }
    if (location) {
      facts.push({ label: t(i18n, 'ui.linkedEntitySummaryLocation', 'Località'), value: location });
    }
    if (contact) {
      facts.push({ label: t(i18n, 'ui.linkedEntitySummaryContact', 'Contatto'), value: contact });
    }
    if (!facts.length && description) {
      facts.push({ label: t(i18n, 'ui.linkedEntitySummaryDetail', 'Dettaglio'), value: description });
    }
    if (!facts.length && taxCode) {
      facts.push({ label: t(i18n, 'ui.linkedEntitySummaryTaxCode', 'Codice fiscale'), value: taxCode });
    }
    if (!facts.length && code) {
      facts.push({ label: t(i18n, 'ui.linkedEntitySummaryCode', 'Codice'), value: code });
    }

    const detailRows = [];
    const pushDetail = (labelKey, fallback, value) => {
      const resolved = text(value, '');
      if (!resolved) return;
      detailRows.push({ label: t(i18n, labelKey, fallback), value: resolved });
    };

    pushDetail('ui.linkedEntitySummaryVat', 'P.IVA', vatNumber);
    pushDetail('ui.linkedEntitySummaryTaxCode', 'Codice fiscale', taxCode);
    pushDetail('ui.linkedEntitySummaryCode', 'Codice', code);
    pushDetail('ui.linkedEntitySummaryLocation', 'Località', location);
    pushDetail('ui.linkedEntitySummaryAddress', 'Indirizzo', address);
    pushDetail('ui.linkedEntitySummaryContact', 'Contatto', contact);
    pushDetail('ui.linkedEntitySummaryPec', 'PEC', pec);
    pushDetail('ui.linkedEntitySummarySdi', 'SDI', sdi);
    pushDetail('ui.linkedEntitySummaryDetail', 'Dettaglio', description);

    if (!title && !facts.length && !detailRows.length) return null;

    return {
      title: title || text(record.displayValue || record.value || record.label || record.name, ''),
      facts: facts.slice(0, 3),
      address,
      isInactive: record.active === false,
      detailRows
    };
  }

  function buildCompactText(record, i18n) {
    const summary = buildSummaryData(record, i18n);
    if (!summary) return '';
    const primaryFact = summary.facts[0] ? summary.facts[0].value : '';
    return [summary.title, primaryFact].filter(Boolean).join(' · ');
  }

  function buildCopyText(options = {}) {
    const record = options.record || getLinkedRecord(options);
    const summary = buildSummaryData(record, options.i18n);
    if (!summary) return '';
    const lines = [summary.title].filter(Boolean);
    summary.detailRows.forEach((row) => {
      lines.push(`${row.label}: ${row.value}`);
    });
    return lines.join('\n').trim();
  }

  function renderInlineSummary(options = {}) {
    const record = options.record || getLinkedRecord(options);
    const summary = buildSummaryData(record, options.i18n);
    if (!summary || (!summary.facts.length && !summary.detailRows.length)) return '';

    const resolvedFieldName = resolveFieldName(options.fieldName || '');
    const entityDefinition = getEntityDefinition(options.i18n, resolvedFieldName);
    const dataQuality = buildDataQuality(record, options.i18n);
    const subjectLabel = entityDefinition ? text(entityDefinition.singleLabel || entityDefinition.familyLabel, '') : '';
    const microHeader = [
      subjectLabel ? `<span class="linked-entity-summary-chip default">${escape(options.utils, subjectLabel)}</span>` : '',
      dataQuality ? `<span class="linked-entity-summary-chip ${escape(options.utils, dataQuality.className)}" title="${escape(options.utils, dataQuality.coverageLabel)}">${escape(options.utils, dataQuality.label)}</span>` : ''
    ].filter(Boolean).join('');
    const htmlFacts = summary.facts.length
      ? `<div class="linked-entity-summary-facts">${summary.facts.map((fact) => `
          <span class="linked-entity-summary-fact"><strong>${escape(options.utils, fact.label)}:</strong> ${escape(options.utils, fact.value)}</span>`).join('')}
        </div>`
      : '';

    const htmlInactive = summary.isInactive
      ? `<span class="linked-entity-summary-status">${escape(options.utils, t(options.i18n, 'ui.linkedEntitySummaryInactive', 'Anagrafica non attiva'))}</span>`
      : '';

    const htmlQualityMeta = dataQuality && dataQuality.missingLabel
      ? `<div class="linked-entity-summary-quality-meta">${escape(options.utils, dataQuality.coverageLabel)} · ${escape(options.utils, dataQuality.missingLabel)}</div>`
      : (dataQuality && dataQuality.coverageLabel ? `<div class="linked-entity-summary-quality-meta">${escape(options.utils, dataQuality.coverageLabel)}</div>` : '');

    const actionDetailLabel = t(options.i18n, 'ui.linkedEntitySummaryDetailAction', 'Dettaglio');
    const actionOpenLabel = t(options.i18n, 'ui.linkedEntitySummaryOpenAction', 'Apri scheda');
    const actionCopyLabel = t(options.i18n, 'ui.linkedEntitySummaryCopyAction', 'Copia dati');
    const collapseLabel = t(options.i18n, 'ui.linkedEntitySummaryCollapseAction', 'Nascondi');
    const toggleButtonHtml = `<button type="button" class="linked-entity-summary-action linked-entity-summary-toggle" data-linked-summary-action="toggle" data-linked-summary-field="${escape(options.utils, resolvedFieldName)}" data-expand-label="${escape(options.utils, actionDetailLabel)}" data-collapse-label="${escape(options.utils, collapseLabel)}">${escape(options.utils, actionDetailLabel)}</button>`;

    const detailsHtml = summary.detailRows.length
      ? `<div class="linked-entity-summary-details">${summary.detailRows.map((row) => `
          <div class="linked-entity-summary-detail-row"><span class="linked-entity-summary-detail-label">${escape(options.utils, row.label)}</span><span class="linked-entity-summary-detail-value">${escape(options.utils, row.value)}</span></div>`).join('')}</div>`
      : '';

    return `
      <div class="linked-entity-summary-card" data-linked-summary-field="${escape(options.utils, resolvedFieldName)}">
        <div class="linked-entity-summary-head">
          <div class="linked-entity-summary-head-main">
            ${microHeader ? `<div class="linked-entity-summary-microhead">${microHeader}</div>` : ''}
            <div class="linked-entity-summary-title">${escape(options.utils, summary.title)}</div>
          </div>
          <div class="linked-entity-summary-head-side">
            ${htmlInactive}
            ${toggleButtonHtml}
          </div>
        </div>
        <div class="linked-entity-summary-body" hidden>
          ${htmlQualityMeta}
          ${htmlFacts}
          <div class="linked-entity-summary-actions">
            <button type="button" class="linked-entity-summary-action" data-open-linked-field="${escape(options.utils, resolvedFieldName)}">${escape(options.utils, actionOpenLabel)}</button>
            <button type="button" class="linked-entity-summary-action" data-linked-summary-action="copy" data-linked-summary-field="${escape(options.utils, resolvedFieldName)}">${escape(options.utils, actionCopyLabel)}</button>
          </div>
          ${detailsHtml}
        </div>
      </div>`;
  }

  return {
    getLinkedRecord,
    buildSummaryData,
    buildCompactText,
    buildCopyText,
    renderInlineSummary,
    buildDataQuality
  };
})();
