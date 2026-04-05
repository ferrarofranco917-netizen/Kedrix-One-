window.KedrixOneLinkedEntitySummary = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

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
    const description = text(record.description, '');

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

    if (!title && !facts.length && !address) return null;

    return {
      title: title || text(record.displayValue || record.value || record.label || record.name, ''),
      facts: facts.slice(0, 3),
      address,
      isInactive: record.active === false
    };
  }

  function buildCompactText(record, i18n) {
    const summary = buildSummaryData(record, i18n);
    if (!summary) return '';
    const primaryFact = summary.facts[0] ? summary.facts[0].value : '';
    return [summary.title, primaryFact].filter(Boolean).join(' · ');
  }

  function renderInlineSummary(options = {}) {
    const record = options.record || getLinkedRecord(options);
    const summary = buildSummaryData(record, options.i18n);
    if (!summary || (!summary.facts.length && !summary.address)) return '';

    const htmlFacts = summary.facts.length
      ? `<div class="linked-entity-summary-facts">${summary.facts.map((fact) => `
          <span class="linked-entity-summary-fact"><strong>${escape(options.utils, fact.label)}:</strong> ${escape(options.utils, fact.value)}</span>`).join('')}
        </div>`
      : '';

    const htmlAddress = summary.address
      ? `<div class="linked-entity-summary-address"><strong>${escape(options.utils, t(options.i18n, 'ui.linkedEntitySummaryAddress', 'Indirizzo'))}:</strong> ${escape(options.utils, summary.address)}</div>`
      : '';

    const htmlInactive = summary.isInactive
      ? `<span class="linked-entity-summary-status">${escape(options.utils, t(options.i18n, 'ui.linkedEntitySummaryInactive', 'Anagrafica non attiva'))}</span>`
      : '';

    return `
      <div class="linked-entity-summary-card" data-linked-summary-field="${escape(options.utils, resolveFieldName(options.fieldName || ''))}">
        <div class="linked-entity-summary-head">
          <div class="linked-entity-summary-title">${escape(options.utils, summary.title)}</div>
          ${htmlInactive}
        </div>
        ${htmlFacts}
        ${htmlAddress}
      </div>`;
  }

  return {
    getLinkedRecord,
    buildSummaryData,
    buildCompactText,
    renderInlineSummary
  };
})();
