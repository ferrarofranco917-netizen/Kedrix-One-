window.KedrixOneLogisticsArchives = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

  const GROUPS = [
    {
      key: 'routing',
      titleKey: 'ui.masterDataLogisticsRoutingTitle',
      titleFallback: 'Routing e riferimenti',
      detailKey: 'ui.masterDataLogisticsRoutingDetail',
      detailFallback: 'Origini, destinazioni e località operative da normalizzare per import, ricerca e routing coerente.',
      entities: ['origin', 'destination', 'logisticsLocation']
    },
    {
      key: 'nodes',
      titleKey: 'ui.masterDataLogisticsNodesTitle',
      titleFallback: 'Nodi di trasporto',
      detailKey: 'ui.masterDataLogisticsNodesDetail',
      detailFallback: 'Porti, aeroporti e terminal come base codificata per flussi mare, aereo e convergenza futura verso UN/LOCODE.',
      entities: ['seaPort', 'airport', 'terminal']
    },
    {
      key: 'support',
      titleKey: 'ui.masterDataLogisticsSupportTitle',
      titleFallback: 'Supporto logistico',
      detailKey: 'ui.masterDataLogisticsSupportDetail',
      detailFallback: 'Depositi, collegamenti operativi, dogane e tipologie unità pronti per pratiche, import e controlli futuri.',
      entities: ['deposit', 'warehouseLink', 'customsOffice', 'transportUnitType']
    }
  ];

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function listCount(state, entityKey) {
    if (!MasterDataEntities || typeof MasterDataEntities.listEntityRecords !== 'function') return 0;
    return MasterDataEntities.listEntityRecords(state, entityKey).length;
  }

  function getFamilyMeta(state, entityKey, i18n) {
    if (!MasterDataEntities || typeof MasterDataEntities.getEntityDefinitions !== 'function') return null;
    const defs = MasterDataEntities.getEntityDefinitions(i18n);
    const def = defs[entityKey];
    if (!def) return null;
    return {
      key: entityKey,
      label: def.familyLabel || entityKey,
      count: listCount(state, entityKey)
    };
  }

  function computeCoverage(state, entities, i18n) {
    const items = entities.map((entityKey) => getFamilyMeta(state, entityKey, i18n)).filter(Boolean);
    const totalFamilies = items.length;
    const readyFamilies = items.filter((item) => item.count > 0).length;
    const totalEntries = items.reduce((acc, item) => acc + item.count, 0);
    const level = readyFamilies === totalFamilies && totalEntries > 0
      ? 'ready'
      : (readyFamilies > 0 ? 'attention' : 'critical');
    return { items, totalFamilies, readyFamilies, totalEntries, level };
  }

  function renderCoveragePill(level, i18n) {
    const map = {
      ready: { className: 'success', label: t(i18n, 'ui.masterDataOverviewStatusReady', 'Base strutturata attiva') },
      attention: { className: 'warning', label: t(i18n, 'ui.masterDataOverviewStatusAttention', 'Base in espansione') },
      critical: { className: 'default', label: t(i18n, 'ui.masterDataOverviewStatusCritical', 'Base da completare') }
    };
    const resolved = map[level] || map.attention;
    return `<span class="badge ${resolved.className}">${escapeHtml(resolved.label)}</span>`;
  }

  function renderGroupCard(state, group, i18n) {
    const coverage = computeCoverage(state, group.entities, i18n);
    const chips = coverage.items.map((item) => {
      const tone = item.count > 0 ? 'success' : 'default';
      return `<span class="master-data-overview-chip ${tone}">${escapeHtml(item.label)} · ${escapeHtml(item.count)}</span>`;
    }).join('');
    return `
      <article class="master-data-overview-card level-${escapeHtml(coverage.level)}">
        <div class="master-data-overview-head">
          <div>
            <div class="master-data-overview-kicker">${escapeHtml(t(i18n, 'ui.masterDataLogisticsKicker', 'Archivi logistici'))}</div>
            <h3>${escapeHtml(t(i18n, group.titleKey, group.titleFallback))}</h3>
          </div>
          ${renderCoveragePill(coverage.level, i18n)}
        </div>
        <p>${escapeHtml(t(i18n, group.detailKey, group.detailFallback))}</p>
        <div class="master-data-overview-metrics">
          <strong>${escapeHtml(coverage.totalEntries)}</strong>
          <span>${escapeHtml(t(i18n, 'ui.masterDataLogisticsEntries', 'voci archivio'))}</span>
        </div>
        <div class="master-data-overview-meta">${escapeHtml(`${coverage.readyFamilies}/${coverage.totalFamilies}`)} ${escapeHtml(t(i18n, 'ui.masterDataLogisticsFamiliesReady', 'famiglie attive'))}</div>
        <div class="master-data-overview-chips">${chips}</div>
      </article>`;
  }

  function renderSection(options = {}) {
    const { state = null, i18n = null } = options;
    if (!state || !MasterDataEntities) return '';
    return `
      <section class="panel master-data-logistics-section">
        <div class="panel-head compact">
          <div>
            <h3 class="panel-title">${escapeHtml(t(i18n, 'ui.masterDataLogisticsSectionTitle', 'Archivi logistici foundation'))}</h3>
            <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.masterDataLogisticsSectionDetail', 'Base archivi per routing, nodi di trasporto, import e futura convergenza verso dataset logistici più forti.'))}</p>
          </div>
        </div>
        <section class="master-data-overview-grid master-data-overview-grid-logistics">
          ${GROUPS.map((group) => renderGroupCard(state, group, i18n)).join('')}
        </section>
      </section>`;
  }

  return {
    renderSection
  };
})();
