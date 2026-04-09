window.KedrixOnePracticeListCustomsProfiles = (() => {
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

  function firstFilled(...values) {
    for (const value of values) {
      if (Array.isArray(value) && value.length) return value;
      if (String(value || '').trim()) return value;
    }
    return '';
  }

  function extractValues(practice) {
    const dynamic = practice && practice.dynamicData && typeof practice.dynamicData === 'object'
      ? practice.dynamicData
      : {};
    const analyticsValues = Analytics && typeof Analytics.extractValues === 'function'
      ? Analytics.extractValues(practice)
      : {};
    const customsOffice = String(firstFilled(
      practice?.customsOffice,
      dynamic.customsOffice,
      practice?.customsOperator,
      dynamic.customsOperator
    ) || '').trim();
    const customsSection = String(firstFilled(
      practice?.customsSection,
      dynamic.customsSection
    ) || '').trim();
    const direction = String(analyticsValues.direction || '').trim().toLowerCase() || 'other';
    return {
      customsOffice,
      customsSection,
      direction
    };
  }

  function directionLabel(direction) {
    if (direction === 'import') return I18N.t('ui.importWord', 'Import');
    if (direction === 'export') return I18N.t('ui.exportWord', 'Export');
    if (direction === 'warehouse') return I18N.t('ui.typeWarehouse', 'Magazzino');
    return I18N.t('ui.practiceListOtherFlow', 'Altro');
  }

  function collect(practices = [], mode = 'office') {
    const bucket = new Map();
    (Array.isArray(practices) ? practices : []).forEach((practice) => {
      const values = extractValues(practice);
      if (!values.customsOffice) return;
      let label = values.customsOffice;
      if (mode === 'office_flow') label = `${values.customsOffice} · ${directionLabel(values.direction)}`;
      if (mode === 'office_section') {
        const section = values.customsSection || I18N.t('ui.practiceListNoSection', 'Sezione n/d');
        label = `${values.customsOffice} · ${section}`;
      }
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

  function buildBreakdown(metrics = {}, mode = 'office', limit = 5) {
    const primary = Array.isArray(metrics.primary) ? metrics.primary : [];
    const comparison = Array.isArray(metrics.comparison) ? metrics.comparison : [];
    const compareEnabled = Boolean(metrics.compareEnabled);
    const primaryMap = collect(primary, mode);
    const comparisonMap = collect(comparison, mode);
    return {
      rows: buildRows(primaryMap, comparisonMap, compareEnabled, limit),
      primaryDistinctCount: primaryMap.size,
      comparisonDistinctCount: comparisonMap.size,
      compareEnabled
    };
  }

  function buildCustomsProfiles(metrics = {}, limit = 5) {
    return {
      office: buildBreakdown(metrics, 'office', limit),
      officeFlow: buildBreakdown(metrics, 'office_flow', limit),
      officeSection: buildBreakdown(metrics, 'office_section', limit)
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
      : `<div class="empty-text">${escapeHtml(I18N.t('ui.practiceListNoCustomsData', 'Nessun dato doganale coerente con il perimetro filtrato.'))}</div>`;
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
    const data = buildCustomsProfiles(metrics, 5);
    return `
      <section class="panel practice-list-analytics-panel practice-list-analytics-panel--compact">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${escapeHtml(I18N.t('ui.practiceListCustomsProfilesTitle', 'Profili doganali ricorrenti'))}</h3>
            <p class="panel-subtitle">${escapeHtml(I18N.t('ui.practiceListCustomsProfilesHint', 'Leggi uffici doganali, combinazioni con flusso e sezione sul range attivo e sul periodo di confronto.'))}</p>
          </div>
        </div>
        <div class="module-card-grid">
          ${renderCard(
            I18N.t('ui.practiceListCustomsOfficesCard', 'Dogane ricorrenti'),
            I18N.t('ui.practiceListCustomsOfficesHint', 'Top uffici doganali nel perimetro filtrato.'),
            data.office
          )}
          ${renderCard(
            I18N.t('ui.practiceListCustomsFlowCard', 'Dogana + flusso'),
            I18N.t('ui.practiceListCustomsFlowHint', 'Combinazioni più ricorrenti tra ufficio doganale e direzione.'),
            data.officeFlow
          )}
          ${renderCard(
            I18N.t('ui.practiceListCustomsSectionCard', 'Dogana + sezione'),
            I18N.t('ui.practiceListCustomsSectionHint', 'Lettura sintetica delle sezioni ricorrenti per ufficio.'),
            data.officeSection
          )}
        </div>
      </section>`;
  }

  function patchTemplates() {
    const templates = Templates();
    if (!templates || typeof templates.practiceList !== 'function' || templates.__customsProfilesPatched) return false;
    const original = templates.practiceList;
    templates.practiceList = function patchedPracticeList(state, filtered, insights) {
      const html = original.call(this, state, filtered, insights);
      const marker = '<section class="table-panel" id="practiceListSection">';
      const section = renderSection(insights || {});
      if (html.includes(marker)) return html.replace(marker, `${section}${marker}`);
      return `${html}${section}`;
    };
    templates.__customsProfilesPatched = true;
    return true;
  }

  patchTemplates();

  return {
    buildCustomsProfiles,
    renderSection,
    patchTemplates
  };
})();
