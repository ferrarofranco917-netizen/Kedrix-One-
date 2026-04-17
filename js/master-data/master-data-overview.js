window.KedrixOneMasterDataOverview = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const LogisticsArchives = window.KedrixOneLogisticsArchives || null;

  function getSupplierPriceLists() {
    return window.KedrixOneSupplierPriceLists || null;
  }

  const GROUPS = [
    {
      key: 'crm',
      titleKey: 'ui.masterDataOverviewClientsTitle',
      titleFallback: 'Clienti e CRM',
      detailKey: 'ui.masterDataOverviewClientsDetail',
      detailFallback: 'Base cliente strutturata per CRM, pratiche e lettura commerciale.',
      entities: ['client']
    },
    {
      key: 'quotes',
      titleKey: 'ui.masterDataOverviewSuppliersTitle',
      titleFallback: 'Fornitori e Quotazioni',
      detailKey: 'ui.masterDataOverviewSuppliersDetail',
      detailFallback: 'Fornitori, compagnie e vettori pronti per costi fornitore, margini e ponte Quotazioni.',
      entities: ['supplier', 'shippingCompany', 'airline', 'carrier']
    },
    {
      key: 'operations',
      titleKey: 'ui.masterDataOverviewOperationalTitle',
      titleFallback: 'Soggetti operativi',
      detailKey: 'ui.masterDataOverviewOperationalDetail',
      detailFallback: 'Importatori, mittenti e destinatari strutturati per pratiche, import e legami stabili.',
      entities: ['importer', 'consignee', 'sender']
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

  function getStructuredFamilyMeta(state, entityKey, i18n) {
    const defs = MasterDataEntities && typeof MasterDataEntities.getEntityDefinitions === 'function'
      ? MasterDataEntities.getEntityDefinitions(i18n)
      : {};
    const def = defs[entityKey];
    if (!def) return null;
    return {
      key: entityKey,
      label: def.familyLabel || entityKey,
      count: listCount(state, entityKey),
      structured: Boolean(def.structured)
    };
  }

  function computeCoverage(state, entities, i18n) {
    const items = entities.map((entityKey) => getStructuredFamilyMeta(state, entityKey, i18n)).filter(Boolean);
    const totalFamilies = items.length;
    const readyFamilies = items.filter((item) => item.count > 0).length;
    const totalRecords = items.reduce((acc, item) => acc + item.count, 0);
    const level = readyFamilies === totalFamilies && totalRecords > 0
      ? 'ready'
      : (readyFamilies > 0 ? 'attention' : 'critical');
    return { items, totalFamilies, readyFamilies, totalRecords, level };
  }

  function renderCoveragePill(level, i18n) {
    const map = {
      ready: {
        className: 'success',
        label: t(i18n, 'ui.masterDataOverviewStatusReady', 'Base strutturata attiva')
      },
      attention: {
        className: 'warning',
        label: t(i18n, 'ui.masterDataOverviewStatusAttention', 'Base in espansione')
      },
      critical: {
        className: 'default',
        label: t(i18n, 'ui.masterDataOverviewStatusCritical', 'Base da completare')
      }
    };
    const resolved = map[level] || map.attention;
    return `<span class="badge ${resolved.className}">${escapeHtml(resolved.label)}</span>`;
  }

  function renderGroupCard(state, group, i18n) {
    const coverage = computeCoverage(state, group.entities, i18n);
    const familyChips = coverage.items.map((item) => {
      const tone = item.count > 0 ? 'success' : 'default';
      return `<span class="master-data-overview-chip ${tone}">${escapeHtml(item.label)} · ${escapeHtml(item.count)}</span>`;
    }).join('');
    const SupplierPriceLists = getSupplierPriceLists();
    const supplierPriceMeta = group.key === 'quotes' && SupplierPriceLists && typeof SupplierPriceLists.getOverviewMeta === 'function'
      ? SupplierPriceLists.getOverviewMeta(state)
      : null;
    const supplierPriceHtml = supplierPriceMeta
      ? `<div class="master-data-overview-inline-meta">${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListOverviewInline', 'Listini attivi'))}: <strong>${escapeHtml(supplierPriceMeta.activeRecords)}</strong> · ${escapeHtml(t(i18n, 'ui.masterDataSupplierPriceListCoverage', 'fornitori coperti'))}: <strong>${escapeHtml(supplierPriceMeta.supplierCoverage)}</strong></div>`
      : '';
    return `
      <article class="master-data-overview-card level-${escapeHtml(coverage.level)}">
        <div class="master-data-overview-head">
          <div>
            <div class="master-data-overview-kicker">${escapeHtml(t(i18n, 'ui.masterDataOverviewKicker', 'Foundation'))}</div>
            <h3>${escapeHtml(t(i18n, group.titleKey, group.titleFallback))}</h3>
          </div>
          ${renderCoveragePill(coverage.level, i18n)}
        </div>
        <p>${escapeHtml(t(i18n, group.detailKey, group.detailFallback))}</p>
        <div class="master-data-overview-metrics">
          <strong>${escapeHtml(coverage.totalRecords)}</strong>
          <span>${escapeHtml(t(i18n, 'ui.masterDataOverviewRecords', 'schede strutturate'))}</span>
        </div>
        ${supplierPriceHtml}
        <div class="master-data-overview-meta">${escapeHtml(`${coverage.readyFamilies}/${coverage.totalFamilies}`)} ${escapeHtml(t(i18n, 'ui.masterDataOverviewFamiliesReady', 'famiglie attive'))}</div>
        <div class="master-data-overview-chips">${familyChips}</div>
      </article>`;
  }

  function renderActiveFamilyContext(state, activeEntity, i18n) {
    const defs = MasterDataEntities && typeof MasterDataEntities.getEntityDefinitions === 'function'
      ? MasterDataEntities.getEntityDefinitions(i18n)
      : {};
    const def = defs[activeEntity];
    if (!def) return '';
    const SupplierPriceLists = getSupplierPriceLists();
    const customDescriptor = activeEntity === 'supplierPriceList' && SupplierPriceLists && typeof SupplierPriceLists.describeActiveFamily === 'function'
      ? SupplierPriceLists.describeActiveFamily(i18n)
      : null;
    const count = listCount(state, activeEntity);
    const structured = Boolean(def.structured);
    const title = customDescriptor
      ? customDescriptor.title
      : (structured
        ? t(i18n, 'ui.masterDataOverviewActiveStructuredTitle', 'Scheda entità completa')
        : t(i18n, 'ui.masterDataOverviewActiveDirectoryTitle', 'Directory operativa'));
    const detail = customDescriptor
      ? customDescriptor.detail
      : (structured
        ? t(i18n, 'ui.masterDataOverviewActiveStructuredDetail', 'Questa famiglia salva schede complete con dati fiscali, contatti e riuso futuro in CRM, Quotazioni, Import e collegamenti forti.')
        : t(i18n, 'ui.masterDataOverviewActiveDirectoryDetail', 'Questa famiglia resta una directory operativa leggera, utile come supporto e normalizzazione nei flussi.'));
    const metricLabel = customDescriptor
      ? customDescriptor.metricLabel
      : (structured
        ? t(i18n, 'ui.masterDataOverviewActiveStructuredMetric', 'schede complete')
        : t(i18n, 'ui.masterDataOverviewActiveDirectoryMetric', 'voci di directory'));
    const badgeLabel = customDescriptor
      ? customDescriptor.badgeLabel
      : (structured ? t(i18n, 'ui.masterDataOverviewStructuredBadge', 'Strutturata') : t(i18n, 'ui.masterDataOverviewDirectoryBadge', 'Directory'));
    const badgeTone = customDescriptor ? (customDescriptor.badgeTone || 'success') : (structured ? 'success' : 'default');
    return `
      <section class="panel master-data-active-context">
        <div class="panel-head compact">
          <div>
            <h3 class="panel-title">${escapeHtml(def.familyLabel)}</h3>
            <p class="panel-subtitle">${escapeHtml(title)}</p>
          </div>
          <span class="badge ${escapeHtml(badgeTone)}">${escapeHtml(badgeLabel)}</span>
        </div>
        <div class="master-data-active-context-body">
          <p>${escapeHtml(detail)}</p>
          <div class="master-data-overview-metrics inline">
            <strong>${escapeHtml(count)}</strong>
            <span>${escapeHtml(metricLabel)}</span>
          </div>
        </div>
      </section>`;
  }

  function renderSummary(options = {}) {
    const { state = null, activeEntity = 'client', i18n = null } = options;
    if (!state || !MasterDataEntities) return '';
    const logisticsHtml = LogisticsArchives && typeof LogisticsArchives.renderSection === 'function'
      ? LogisticsArchives.renderSection({ state, activeEntity, i18n })
      : '';
    return `
      <section class="master-data-overview-grid">
        ${GROUPS.map((group) => renderGroupCard(state, group, i18n)).join('')}
      </section>
      ${logisticsHtml}
      ${renderActiveFamilyContext(state, activeEntity, i18n)}`;
  }

  return {
    renderSummary
  };
})();
