window.KedrixOnePracticeListPartyGaps = (() => {
  'use strict';

  const Analytics = window.KedrixOnePracticeListAnalytics || null;
  const Templates = () => window.KedrixOneTemplates || null;
  const Utils = window.KedrixOneUtils || {
    escapeHtml: (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  };
  const I18N = window.KedrixOneI18n || { t: (_path, fallback = '') => fallback };

  function escapeHtml(value) {
    return Utils.escapeHtml ? Utils.escapeHtml(value) : String(value || '');
  }

  function extractValues(practice) {
    const values = Analytics && typeof Analytics.extractValues === 'function'
      ? Analytics.extractValues(practice)
      : {};
    return {
      reference: String(values.reference || practice?.id || '').trim(),
      client: String(values.client || '').trim(),
      importer: String(values.importer || '').trim(),
      exporter: String(values.exporter || '').trim(),
      consignee: String(values.consignee || '').trim(),
      practiceType: String(values.practiceType || practice?.practiceType || '').trim(),
      status: String(values.status || practice?.status || '').trim()
    };
  }

  const MODES = {
    missingClient: {
      key: 'missingClient',
      title: 'Cliente mancante',
      subtitle: 'Pratiche senza soggetto cliente leggibile nel perimetro filtrato.',
      empty: 'Nessuna pratica senza cliente nel perimetro filtrato.',
      test: (values) => !values.client
    },
    missingImporter: {
      key: 'missingImporter',
      title: 'Importatore mancante',
      subtitle: 'Pratiche senza importatore leggibile nel perimetro filtrato.',
      empty: 'Nessuna pratica senza importatore nel perimetro filtrato.',
      test: (values) => !values.importer
    },
    missingExporter: {
      key: 'missingExporter',
      title: 'Mittente / esportatore mancante',
      subtitle: 'Pratiche senza mittente o esportatore leggibile nel perimetro filtrato.',
      empty: 'Nessuna pratica senza mittente o esportatore nel perimetro filtrato.',
      test: (values) => !values.exporter
    },
    missingConsignee: {
      key: 'missingConsignee',
      title: 'Destinatario mancante',
      subtitle: 'Pratiche senza destinatario leggibile nel perimetro filtrato.',
      empty: 'Nessuna pratica senza destinatario nel perimetro filtrato.',
      test: (values) => !values.consignee
    }
  };

  function collect(practices = [], mode) {
    const def = MODES[mode];
    if (!def) return [];
    return (Array.isArray(practices) ? practices : []).map((practice) => ({ practice, values: extractValues(practice) }))
      .filter(({ values }) => def.test(values))
      .map(({ practice, values }) => ({
        reference: values.reference || String(practice?.id || '').trim() || '—',
        client: values.client || '—',
        practiceType: values.practiceType || '—',
        status: values.status || '—'
      }));
  }

  function buildCardData(metrics = {}, mode = 'missingImporter', exampleLimit = 3) {
    const primaryItems = collect(metrics.primary || [], mode);
    const comparisonItems = collect(metrics.comparison || [], mode);
    return {
      activeCount: primaryItems.length,
      comparisonCount: comparisonItems.length,
      deltaCount: Boolean(metrics.compareEnabled) ? primaryItems.length - comparisonItems.length : null,
      compareEnabled: Boolean(metrics.compareEnabled),
      examples: primaryItems.slice(0, exampleLimit)
    };
  }

  function renderExamples(examples = []) {
    if (!examples.length) return '';
    return `<div class="stack-list">${examples.map((item) => `
      <div class="stack-item">
        <strong>${escapeHtml(item.reference)}</strong>
        <span>${escapeHtml(item.client)}</span>
        <span>${escapeHtml(item.practiceType)}</span>
        <span class="badge info">${escapeHtml(item.status)}</span>
      </div>
    `).join('')}</div>`;
  }

  function renderCard(mode, metrics = {}) {
    const def = MODES[mode];
    const data = buildCardData(metrics, mode, 3);
    const deltaBadge = data.compareEnabled
      ? `<span class="badge ${data.deltaCount > 0 ? '' : data.deltaCount < 0 ? 'warning' : 'info'}">${data.deltaCount > 0 ? '+' : ''}${escapeHtml(String(data.deltaCount || 0))}</span>`
      : `<span class="badge info">${escapeHtml(I18N.t('ui.practiceListNoComparisonShort', 'No confronto'))}</span>`;

    const body = data.activeCount
      ? `${renderExamples(data.examples)}`
      : `<div class="empty-text">${escapeHtml(I18N.t(`ui.practiceList${def.key}Empty`, def.empty))}</div>`;

    return `<article class="module-card">
      <div>
        <div class="module-card-title">${escapeHtml(I18N.t(`ui.practiceList${def.key}Title`, def.title))}</div>
        <div class="module-card-meta">${escapeHtml(I18N.t(`ui.practiceList${def.key}Hint`, def.subtitle))}</div>
      </div>
      <div class="kpi-grid" style="margin-bottom:12px;">
        <div class="kpi-card compact">
          <div class="kpi-label">${escapeHtml(I18N.t('ui.practiceListActiveCount', 'Attivo'))}</div>
          <div class="kpi-value">${escapeHtml(String(data.activeCount || 0))}</div>
        </div>
        <div class="kpi-card compact">
          <div class="kpi-label">${escapeHtml(I18N.t('ui.practiceListCompareCount', 'Confronto'))}</div>
          <div class="kpi-value">${escapeHtml(String(data.comparisonCount || 0))}</div>
        </div>
        <div class="kpi-card compact">
          <div class="kpi-label">${escapeHtml(I18N.t('ui.practiceListDeltaLabel', 'Delta'))}</div>
          <div class="kpi-value">${deltaBadge}</div>
        </div>
      </div>
      ${body}
    </article>`;
  }

  function renderSection(metrics = {}) {
    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${escapeHtml(I18N.t('ui.practiceListPartyGapsTitle', 'Gap anagrafici soggetti'))}</h3>
            <p class="panel-subtitle">${escapeHtml(I18N.t('ui.practiceListPartyGapsHint', 'Leggi subito le pratiche che nel perimetro filtrato hanno ancora soggetti chiave mancanti.'))}</p>
          </div>
        </div>
        <div class="module-card-grid">
          ${renderCard('missingClient', metrics)}
          ${renderCard('missingImporter', metrics)}
          ${renderCard('missingExporter', metrics)}
          ${renderCard('missingConsignee', metrics)}
        </div>
      </section>`;
  }

  function patchTemplates() {
    const templates = Templates();
    if (!templates || typeof templates.practiceList !== 'function' || templates.__partyGapsPatched) return false;
    const original = templates.practiceList;
    templates.practiceList = function patchedPracticeList(state, filtered, insights) {
      const html = original.call(this, state, filtered, insights);
      const marker = '<section class="table-panel" id="practiceListSection">';
      const section = renderSection(insights || {});
      if (html.includes(marker)) return html.replace(marker, `${section}${marker}`);
      return `${html}${section}`;
    };
    templates.__partyGapsPatched = true;
    return true;
  }

  patchTemplates();

  return {
    renderSection,
    patchTemplates
  };
})();
