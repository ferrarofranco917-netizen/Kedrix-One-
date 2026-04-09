window.KedrixOnePracticeListPartyPairs = (() => {
  'use strict';

  const Analytics = window.KedrixOnePracticeListAnalytics || null;
  const Templates = () => window.KedrixOneTemplates || null;
  const Utils = window.KedrixOneUtils || {
    normalize: (value) => String(value || '').trim().toUpperCase(),
    escapeHtml: (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  };
  const I18N = window.KedrixOneI18n || { t: (_path, fallback = '') => fallback };

  function normalize(value) {
    return Utils.normalize ? Utils.normalize(value) : String(value || '').trim().toUpperCase();
  }

  function escapeHtml(value) {
    return Utils.escapeHtml ? Utils.escapeHtml(value) : String(value || '');
  }

  function extractValues(practice) {
    const values = Analytics && typeof Analytics.extractValues === 'function'
      ? Analytics.extractValues(practice)
      : {};
    return {
      client: String(values.client || '').trim(),
      importer: String(values.importer || '').trim(),
      exporter: String(values.exporter || '').trim(),
      consignee: String(values.consignee || '').trim()
    };
  }

  function labelFor(values, mode) {
    switch (mode) {
      case 'client_importer':
        return values.client && values.importer ? `${values.client} · ${values.importer}` : '';
      case 'client_exporter':
        return values.client && values.exporter ? `${values.client} · ${values.exporter}` : '';
      case 'importer_consignee':
        return values.importer && values.consignee ? `${values.importer} · ${values.consignee}` : '';
      default:
        return '';
    }
  }

  function collect(practices = [], mode = 'client_importer') {
    const bucket = new Map();
    (Array.isArray(practices) ? practices : []).forEach((practice) => {
      const values = extractValues(practice);
      const label = labelFor(values, mode);
      if (!label) return;
      const key = normalize(label);
      const current = bucket.get(key) || { key, label, count: 0 };
      current.count += 1;
      if (label.length > current.label.length) current.label = label;
      bucket.set(key, current);
    });
    return bucket;
  }

  function buildRows(primaryMap, comparisonMap, compareEnabled, limit = 5) {
    const keys = Array.from(new Set([...primaryMap.keys(), ...comparisonMap.keys()]));
    const rows = keys.map((key) => {
      const primary = primaryMap.get(key);
      const comparison = comparisonMap.get(key);
      const primaryCount = primary ? primary.count : 0;
      const comparisonCount = comparison ? comparison.count : 0;
      return {
        key,
        label: (primary && primary.label) || (comparison && comparison.label) || key,
        primaryCount,
        comparisonCount,
        deltaCount: compareEnabled ? primaryCount - comparisonCount : null,
        totalWeight: primaryCount + comparisonCount
      };
    });
    rows.sort((a, b) => {
      if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight;
      if (b.primaryCount !== a.primaryCount) return b.primaryCount - a.primaryCount;
      return a.label.localeCompare(b.label, 'it');
    });
    return rows.slice(0, limit);
  }

  function buildBreakdown(metrics = {}, mode = 'client_importer', limit = 5) {
    const primary = Array.isArray(metrics.primary) ? metrics.primary : [];
    const comparison = Array.isArray(metrics.comparison) ? metrics.comparison : [];
    const compareEnabled = Boolean(metrics.compareEnabled);
    const primaryMap = collect(primary, mode);
    const comparisonMap = collect(comparison, mode);
    return {
      rows: buildRows(primaryMap, comparisonMap, compareEnabled, limit),
      compareEnabled
    };
  }

  function buildPairs(metrics = {}, limit = 4) {
    return {
      clientImporter: buildBreakdown(metrics, 'client_importer', limit),
      clientExporter: buildBreakdown(metrics, 'client_exporter', limit),
      importerConsignee: buildBreakdown(metrics, 'importer_consignee', limit)
    };
  }

  function renderCard(title, subtitle, data) {
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    const compareEnabled = Boolean(data?.compareEnabled);
    const body = rows.length
      ? `<div class="stack-list">${rows.map((row) => {
          const delta = compareEnabled
            ? `<span class="badge ${row.deltaCount > 0 ? '' : row.deltaCount < 0 ? 'warning' : 'info'}">${row.deltaCount > 0 ? '+' : ''}${escapeHtml(String(row.deltaCount || 0))}</span>`
            : `<span class="badge info">${escapeHtml(I18N.t('ui.practiceListNoComparisonShort', 'No confronto'))}</span>`;
          return `<div class="stack-item stack-item--analytics">
              <strong>${escapeHtml(row.label)}</strong>
              <div class="stack-item-metrics">
                <span class="metric-pill">${escapeHtml(I18N.t('ui.practiceListActiveCount', 'Attivo'))}: ${escapeHtml(String(row.primaryCount || 0))}</span>
                <span class="metric-pill">${escapeHtml(I18N.t('ui.practiceListCompareCount', 'Confronto'))}: ${escapeHtml(String(row.comparisonCount || 0))}</span>
                ${delta}
              </div>
            </div>`;
        }).join('')}</div>`
      : `<div class="empty-text">${escapeHtml(I18N.t('ui.practiceListNoPartyPairsData', 'Nessuna coppia soggetti coerente con il perimetro filtrato.'))}</div>`;
    return `<article class="module-card module-card--analytics">
      <div class="module-card-head">
        <div>
          <div class="module-card-title">${escapeHtml(title)}</div>
          <div class="module-card-meta">${escapeHtml(subtitle)}</div>
        </div>
      </div>
      ${body}
    </article>`;
  }

  function renderSection(metrics = {}) {
    const data = buildPairs(metrics, 4);
    return `
      <details class="panel practice-list-analytics-panel practice-list-analytics-panel--compact practice-list-collapsible" data-practice-list-collapsible="party-pairs">
        <summary class="practice-list-collapsible-summary">
          <div>
            <h3 class="panel-title">${escapeHtml(I18N.t('ui.practiceListPartyPairsTitle', 'Coppie soggetti ricorrenti'))}</h3>
            <p class="panel-subtitle">${escapeHtml(I18N.t('ui.practiceListPartyPairsHint', 'Leggi le combinazioni più ricorrenti tra cliente, importatore, esportatore e destinatario nel range attivo e nel confronto.'))}</p>
          </div>
          <span class="practice-list-collapsible-badge">${escapeHtml(I18N.t('ui.practiceListCollapsedByDefault', 'Chiuso di default'))}</span>
        </summary>
        <div class="practice-list-collapsible-body">
          <div class="module-card-grid">
            ${renderCard(
              I18N.t('ui.practiceListClientImporterCard', 'Cliente + importatore'),
              I18N.t('ui.practiceListClientImporterHint', 'Abbinamenti più ricorrenti tra cliente commerciale e importatore.'),
              data.clientImporter
            )}
            ${renderCard(
              I18N.t('ui.practiceListClientExporterCard', 'Cliente + mittente/esportatore'),
              I18N.t('ui.practiceListClientExporterHint', 'Abbinamenti più ricorrenti tra cliente commerciale e mittente o esportatore.'),
              data.clientExporter
            )}
            ${renderCard(
              I18N.t('ui.practiceListImporterConsigneeCard', 'Importatore + destinatario'),
              I18N.t('ui.practiceListImporterConsigneeHint', 'Combinazioni più ricorrenti tra importatore e destinatario.'),
              data.importerConsignee
            )}
          </div>
        </div>
      </details>`;
  }

  function patchTemplates() {
    const templates = Templates();
    if (!templates || typeof templates.practiceList !== 'function' || templates.__partyPairsPatched) return false;
    const original = templates.practiceList;
    templates.practiceList = function patchedPracticeList(state, filtered, insights) {
      const html = original.call(this, state, filtered, insights);
      const marker = '<section class="table-panel" id="practiceListSection">';
      const section = renderSection(insights || {});
      if (html.includes(marker)) return html.replace(marker, `${section}${marker}`);
      return `${html}${section}`;
    };
    templates.__partyPairsPatched = true;
    return true;
  }

  patchTemplates();

  return {
    buildPairs,
    renderSection,
    patchTemplates
  };
})();
