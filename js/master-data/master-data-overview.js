window.KedrixOneMasterDataOverview = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const LogisticsArchives = window.KedrixOneLogisticsArchives || null;

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

  function listStructuredRecords(state, entityKey) {
    if (!MasterDataEntities || typeof MasterDataEntities.listEntityRecords !== 'function') return [];
    return MasterDataEntities.listEntityRecords(state, entityKey)
      .map((entry) => entry && entry.record ? entry.record : null)
      .filter(Boolean);
  }

  function renderSupplierOperationalSnapshot(state, i18n) {
    const suppliers = listStructuredRecords(state, 'supplier');
    if (!suppliers.length) return '';
    const withModes = suppliers.filter((record) => String(record.serviceModes || '').trim()).length;
    const withAreas = suppliers.filter((record) => String(record.servicedAreas || '').trim()).length;
    const withPaymentTerms = suppliers.filter((record) => String(record.paymentTerms || '').trim()).length;
    return `
      <section class="panel master-data-supplier-snapshot">
        <div class="panel-head compact">
          <div>
            <h3 class="panel-title">${escapeHtml(t(i18n, 'ui.masterDataSupplierSnapshotTitle', 'Fornitori · snapshot operativo'))}</h3>
            <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.masterDataSupplierSnapshotDetail', 'Verifica quanto la base fornitori è pronta per ricerche operative, quotazioni e CRM fornitori.'))}</p>
          </div>
        </div>
        <div class="master-data-supplier-metrics">
          <article class="master-data-supplier-metric"><strong>${escapeHtml(suppliers.length)}</strong><span>${escapeHtml(t(i18n, 'ui.masterDataSupplierSnapshotRecords', 'fornitori strutturati'))}</span></article>
          <article class="master-data-supplier-metric"><strong>${escapeHtml(withModes)}</strong><span>${escapeHtml(t(i18n, 'ui.masterDataSupplierSnapshotModes', 'con servizi configurati'))}</span></article>
          <article class="master-data-supplier-metric"><strong>${escapeHtml(withAreas)}</strong><span>${escapeHtml(t(i18n, 'ui.masterDataSupplierSnapshotAreas', 'con aree / tratte'))}</span></article>
          <article class="master-data-supplier-metric"><strong>${escapeHtml(withPaymentTerms)}</strong><span>${escapeHtml(t(i18n, 'ui.masterDataSupplierSnapshotTerms', 'con pagamento definito'))}</span></article>
        </div>
      </section>`;
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
    const count = listCount(state, activeEntity);
    const structured = Boolean(def.structured);
    const title = activeEntity === 'supplier'
      ? t(i18n, 'ui.masterDataOverviewActiveSupplierTitle', 'Scheda fornitore operativa')
      : (structured
        ? t(i18n, 'ui.masterDataOverviewActiveStructuredTitle', 'Scheda entità completa')
        : t(i18n, 'ui.masterDataOverviewActiveDirectoryTitle', 'Directory operativa'));
    const detail = activeEntity === 'supplier'
      ? t(i18n, 'ui.masterDataOverviewActiveSupplierDetail', 'Questa famiglia è il ponte naturale verso quotazioni, CRM fornitori e ricerca del partner giusto per servizio, tratta e condizioni operative.')
      : (structured
        ? t(i18n, 'ui.masterDataOverviewActiveStructuredDetail', 'Questa famiglia salva schede complete con dati fiscali, contatti e riuso futuro in CRM, Quotazioni, Import e collegamenti forti.')
        : t(i18n, 'ui.masterDataOverviewActiveDirectoryDetail', 'Questa famiglia resta una directory operativa leggera, utile come supporto e normalizzazione nei flussi.'));
    const metricLabel = structured
      ? t(i18n, 'ui.masterDataOverviewActiveStructuredMetric', 'schede complete')
      : t(i18n, 'ui.masterDataOverviewActiveDirectoryMetric', 'voci di directory');
    return `
      <section class="panel master-data-active-context">
        <div class="panel-head compact">
          <div>
            <h3 class="panel-title">${escapeHtml(def.familyLabel)}</h3>
            <p class="panel-subtitle">${escapeHtml(title)}</p>
          </div>
          <span class="badge ${structured ? 'success' : 'default'}">${escapeHtml(structured ? t(i18n, 'ui.masterDataOverviewStructuredBadge', 'Strutturata') : t(i18n, 'ui.masterDataOverviewDirectoryBadge', 'Directory'))}</span>
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
      ${renderActiveFamilyContext(state, activeEntity, i18n)}
      ${activeEntity === 'supplier' ? renderSupplierOperationalSnapshot(state, i18n) : ''}`;
  }

  return {
    renderSummary
  };
})();
