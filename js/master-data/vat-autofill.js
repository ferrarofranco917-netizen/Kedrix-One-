window.KedrixOneVatAutofill = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

  const DEFAULT_CONFIG = {
    provider: 'apps-script-vies',
    endpointUrl: '',
    apiKeyHeader: 'x-api-key',
    apiKey: '',
    countryDefault: 'IT',
    applyMode: 'replace-all',
    requestTimeoutMs: 8000
  };

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanUpper(value) {
    return cleanText(value).toUpperCase();
  }

  function getGlobalDefaults() {
    return window.KedrixOneIntegrationEndpoints && typeof window.KedrixOneIntegrationEndpoints === 'object'
      ? window.KedrixOneIntegrationEndpoints
      : {};
  }

  function ensureConfig(state) {
    if (!state.companyConfig || typeof state.companyConfig !== 'object') state.companyConfig = {};
    if (!state.companyConfig.integrations || typeof state.companyConfig.integrations !== 'object') {
      state.companyConfig.integrations = {};
    }
    if (!state.companyConfig.integrations.vatAutofill || typeof state.companyConfig.integrations.vatAutofill !== 'object') {
      state.companyConfig.integrations.vatAutofill = { ...DEFAULT_CONFIG };
    }
    const cfg = state.companyConfig.integrations.vatAutofill;
    const defaults = getGlobalDefaults();
    return Object.assign(cfg, {
      provider: cleanText(cfg.provider) || cleanText(defaults.vatLookupProvider) || DEFAULT_CONFIG.provider,
      endpointUrl: cleanText(cfg.endpointUrl) || cleanText(defaults.vatLookupUrl),
      apiKeyHeader: cleanText(cfg.apiKeyHeader) || cleanText(defaults.vatLookupApiKeyHeader) || DEFAULT_CONFIG.apiKeyHeader,
      apiKey: cleanText(cfg.apiKey) || cleanText(defaults.vatLookupApiKey),
      countryDefault: cleanUpper(cfg.countryDefault || defaults.vatLookupCountryDefault) || DEFAULT_CONFIG.countryDefault,
      applyMode: cleanText(cfg.applyMode || defaults.vatLookupApplyMode) || DEFAULT_CONFIG.applyMode,
      requestTimeoutMs: Number(cfg.requestTimeoutMs) > 0 ? Number(cfg.requestTimeoutMs) : DEFAULT_CONFIG.requestTimeoutMs
    });
  }

  function stripVat(value) {
    return cleanUpper(value).replace(/[^A-Z0-9]/g, '');
  }

  function isValidItalianVatNumber(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!/^\d{11}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 10; i += 1) {
      let n = Number(digits[i]);
      if ((i + 1) % 2 === 0) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
    }
    const check = (10 - (sum % 10)) % 10;
    return check === Number(digits[10]);
  }

  function normalizeVatNumber(value, defaultCountry = 'IT') {
    const raw = stripVat(value);
    if (!raw) {
      return { ok: false, reason: 'missing-vat', countryCode: cleanUpper(defaultCountry) || 'IT', nationalNumber: '', formatted: '' };
    }
    const prefixed = /^[A-Z]{2}/.test(raw);
    const countryCode = prefixed ? raw.slice(0, 2) : (cleanUpper(defaultCountry) || 'IT');
    const nationalNumber = prefixed ? raw.slice(2) : raw;
    if (countryCode === 'IT') {
      if (!/^\d{11}$/.test(nationalNumber) || !isValidItalianVatNumber(nationalNumber)) {
        return { ok: false, reason: 'invalid-italian-vat', countryCode, nationalNumber, formatted: `IT${nationalNumber}` };
      }
    } else if (!/^[A-Z0-9]{4,16}$/.test(nationalNumber)) {
      return { ok: false, reason: 'invalid-vat-format', countryCode, nationalNumber, formatted: `${countryCode}${nationalNumber}` };
    }
    return { ok: true, reason: '', countryCode, nationalNumber, formatted: `${countryCode}${nationalNumber}` };
  }

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function normalizeLookupPayload(payload, fallbackVat, fallbackCountry) {
    const source = payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object' ? payload.data : payload;
    if (!source || typeof source !== 'object') return null;

    const addressNode = source.address && typeof source.address === 'object' ? source.address : null;
    const result = {
      value: cleanText(source.value || source.name || source.companyName || source.company_name || source.denominazione || source.ragioneSociale || source.businessName || ''),
      shortName: cleanText(source.shortName || source.short_name || source.tradeName || source.nomeBreve || ''),
      code: cleanText(source.code || source.customerCode || source.internalCode || source.codice || ''),
      vatNumber: cleanText(source.vatNumber || source.vat || source.vat_id || source.partitaIva || source.piva || fallbackVat || ''),
      taxCode: cleanText(source.taxCode || source.tax_code || source.codiceFiscale || source.cf || ''),
      address: cleanText(source.addressLine || (typeof source.address === 'string' ? source.address : '') || source.street || source.indirizzo || (addressNode ? (addressNode.line1 || addressNode.address || '') : '') || ''),
      zipCode: cleanText(source.zipCode || source.zip || source.cap || source.postalCode || (addressNode ? (addressNode.zipCode || addressNode.postalCode || '') : '') || ''),
      city: cleanText(source.city || source.locality || source.comune || (addressNode ? (addressNode.city || '') : '') || ''),
      province: cleanText(source.province || source.regionCode || source.provincia || (addressNode ? (addressNode.province || '') : '') || ''),
      country: cleanUpper(source.country || source.countryCode || source.nazione || (addressNode ? (addressNode.country || addressNode.countryCode || '') : '') || fallbackCountry || ''),
      email: cleanText(source.email || source.mail || ''),
      phone: cleanText(source.phone || source.telephone || source.telefono || ''),
      pec: cleanText(source.pec || source.pecAddress || source.domicilioDigitale || ''),
      sdiCode: cleanText(source.sdiCode || source.sdi || source.codiceSdi || ''),
      notes: cleanText(source.notes || source.note || ''),
      sourceLabel: cleanText(source.source || source.sourceLabel || payload.source || payload.provider || ''),
      lookupStatus: cleanText(source.lookupStatus || payload.lookupStatus || payload.status || ''),
      raw: payload
    };
    if (!result.value) return null;
    return result;
  }

  function resolveEndpointUrl(config) {
    return cleanText(config && config.endpointUrl);
  }

  function normalizeRemoteFailure(payload, fallback = 'lookup-error') {
    const status = cleanText(payload && (payload.status || payload.lookupStatus || payload.reason));
    if (status === 'not-found') return 'not-found';
    if (status === 'invalid-vat') return 'invalid-vat';
    if (status === 'needs-config') return 'needs-config';
    return fallback;
  }

  function buildHeaders(config) {
    const headers = { Accept: 'application/json' };
    if (config.apiKey && config.apiKeyHeader && cleanText(config.provider) !== 'apps-script-vies') headers[config.apiKeyHeader] = config.apiKey;
    return headers;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function collectStructuredRecords(state, entityKey = '') {
    if (!MasterDataEntities || typeof MasterDataEntities.getEntityDefinitions !== 'function') return [];
    const defs = MasterDataEntities.getEntityDefinitions(null);
    const keys = entityKey ? [entityKey] : Object.values(defs).filter((def) => def && def.structured).map((def) => def.key);
    return keys.flatMap((key) => {
      if (MasterDataEntities && typeof MasterDataEntities.listEntityRecords === 'function') {
        return MasterDataEntities.listEntityRecords(state, key)
          .map((entry) => entry && entry.record ? { entityKey: key, record: entry.record } : null)
          .filter(Boolean);
      }
      return [];
    });
  }

  function findLocalRecordByVat(state, vatNumber, entityKey = '') {
    const normalized = normalizeVatNumber(vatNumber, ensureConfig(state).countryDefault);
    if (!normalized.ok) return null;
    const hits = collectStructuredRecords(state, entityKey).filter(({ record }) => {
      const candidate = normalizeVatNumber(record && record.vatNumber ? record.vatNumber : '', normalized.countryCode);
      return candidate.ok && candidate.formatted === normalized.formatted;
    });
    if (!hits.length) return null;
    return {
      ok: true,
      found: true,
      source: 'Kedrix local master data',
      sourceKind: 'local-records',
      lookupStatus: 'linked-local',
      data: { ...hits[0].record, vatNumber: normalized.nationalNumber },
      matchedEntityKey: hits[0].entityKey,
      normalizedVat: normalized
    };
  }

  async function fetchFromCustomEndpoint(state, entityKey, normalizedVat) {
    const config = ensureConfig(state);
    const endpointUrl = resolveEndpointUrl(config);
    if (!endpointUrl) return { ok: false, reason: 'missing-endpoint' };
    const url = new URL(endpointUrl, window.location.href);
    url.searchParams.set('country', normalizedVat.countryCode);
    url.searchParams.set('vat', normalizedVat.nationalNumber);
    url.searchParams.set('entity', cleanText(entityKey));
    if (cleanText(config.provider) === 'apps-script-vies' && config.apiKey) url.searchParams.set('key', config.apiKey);

    const response = await fetchWithTimeout(url.toString(), { method: 'GET', headers: buildHeaders(config) }, config.requestTimeoutMs);
    const text = await response.text();
    const payload = safeJsonParse(text);
    if (!response.ok) {
      return { ok: false, reason: response.status === 404 ? 'not-found' : normalizeRemoteFailure(payload, 'lookup-http-error'), status: response.status, payload };
    }
    if (payload && typeof payload === 'object' && payload.ok === false) {
      return { ok: false, reason: normalizeRemoteFailure(payload, 'lookup-error'), status: response.status, payload };
    }
    const normalized = normalizeLookupPayload(payload, normalizedVat.nationalNumber, normalizedVat.countryCode);
    if (!normalized) return { ok: false, reason: normalizeRemoteFailure(payload, 'invalid-payload'), payload };
    return {
      ok: true,
      found: true,
      source: normalized.sourceLabel || (cleanText(config.provider) === 'apps-script-vies' ? 'Apps Script VIES proxy' : 'Custom endpoint'),
      sourceKind: cleanText(config.provider) === 'apps-script-vies' ? 'apps-script-vies' : 'custom-endpoint',
      lookupStatus: normalized.lookupStatus || 'official-data',
      data: normalized,
      normalizedVat
    };
  }

  function applyLookupToDraft(draft, lookupResult, config = DEFAULT_CONFIG) {
    if (!draft || !lookupResult || !lookupResult.ok || !lookupResult.found || !lookupResult.data) return draft;
    const data = lookupResult.data;
    const applyMode = cleanText(config.applyMode) || DEFAULT_CONFIG.applyMode;
    const overwrite = applyMode === 'replace-all';
    const fields = ['value', 'shortName', 'code', 'vatNumber', 'taxCode', 'address', 'zipCode', 'city', 'province', 'country', 'email', 'phone', 'pec', 'sdiCode'];
    fields.forEach((field) => {
      const nextValue = cleanText(data[field]);
      if (!nextValue) return;
      if (overwrite || !cleanText(draft[field])) draft[field] = nextValue;
    });
    if (data.notes && !cleanText(draft.notes)) draft.notes = cleanText(data.notes);
    draft.vatLookupSource = lookupResult.source || '';
    draft.vatLookupStatus = lookupResult.lookupStatus || '';
    draft.vatLookupAt = new Date().toISOString();
    draft.vatLookupVat = lookupResult.normalizedVat ? lookupResult.normalizedVat.formatted : cleanText(data.vatNumber || '');
    return draft;
  }

  function setDraftLookupMeta(draft, patch = {}) {
    if (!draft || typeof draft !== 'object') return;
    Object.assign(draft, {
      vatLookupSource: cleanText(patch.vatLookupSource || draft.vatLookupSource || ''),
      vatLookupStatus: cleanText(patch.vatLookupStatus || draft.vatLookupStatus || ''),
      vatLookupAt: cleanText(patch.vatLookupAt || draft.vatLookupAt || ''),
      vatLookupVat: cleanText(patch.vatLookupVat || draft.vatLookupVat || '')
    });
  }

  function getLookupStatusInfo(draft, i18n) {
    const status = cleanText(draft && draft.vatLookupStatus);
    const source = cleanText(draft && draft.vatLookupSource);
    if (!status) return { tone: 'neutral', text: i18n.t('ui.masterDataVatLookupIdle', 'Inserisci la partita IVA e usa “Recupera dati”.'), source: '' };
    if (status === 'official-data') return { tone: 'success', text: i18n.t('ui.masterDataVatLookupOfficial', 'Dati recuperati da sorgente configurata.'), source };
    if (status === 'linked-local') return { tone: 'info', text: i18n.t('ui.masterDataVatLookupLocal', 'Dati riutilizzati da anagrafiche Kedrix esistenti.'), source };
    if (status === 'not-found') return { tone: 'warning', text: i18n.t('ui.masterDataVatLookupNotFound', 'Nessun dato trovato per questa partita IVA.'), source };
    if (status === 'invalid-vat') return { tone: 'warning', text: i18n.t('ui.masterDataVatLookupInvalid', 'Partita IVA non valida.'), source };
    if (status === 'needs-config') return { tone: 'warning', text: i18n.t('ui.masterDataVatLookupNeedsConfig', 'Configura un endpoint per il recupero automatico.'), source };
    if (status === 'lookup-error') return { tone: 'warning', text: i18n.t('ui.masterDataVatLookupError', 'Recupero dati non riuscito.'), source };
    return { tone: 'neutral', text: i18n.t('ui.masterDataVatLookupIdle', 'Inserisci la partita IVA e usa “Recupera dati”.'), source };
  }

  function renderLookupStatus(draft, i18n) {
    const info = getLookupStatusInfo(draft || {}, i18n);
    const source = info.source ? `<span class="master-data-lookup-source">${escapeHtml(info.source)}</span>` : '';
    return `<div class="master-data-lookup-status ${info.tone}"><span>${escapeHtml(info.text)}</span>${source}</div>`;
  }

  function renderConfigPanel(state, i18n) {
    const config = ensureConfig(state);
    return `
      <section class="panel master-data-integration-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${escapeHtml(i18n.t('ui.masterDataVatLookupConfigTitle', 'Recupero dati da partita IVA'))}</h3>
            <p class="panel-subtitle">${escapeHtml(i18n.t('ui.masterDataVatLookupConfigIntro', 'Configura come Kedrix deve cercare i dati anagrafici quando inserisci una partita IVA.'))}</p>
          </div>
        </div>
        <form id="vatLookupConfigForm" class="master-data-form-stack">
          <div class="form-grid two master-data-config-grid">
            <div class="field">
              <label for="vatLookupProvider">${escapeHtml(i18n.t('ui.masterDataVatLookupProvider', 'Provider'))}</label>
              <select id="vatLookupProvider" name="provider">
                <option value="apps-script-vies" ${config.provider === 'apps-script-vies' ? 'selected' : ''}>${escapeHtml(i18n.t('ui.masterDataVatLookupProviderAppsScript', 'Apps Script · VIES'))}</option>
                <option value="custom-endpoint" ${config.provider === 'custom-endpoint' ? 'selected' : ''}>${escapeHtml(i18n.t('ui.masterDataVatLookupProviderCustom', 'Endpoint personalizzato'))}</option>
                <option value="local-records" ${config.provider === 'local-records' ? 'selected' : ''}>${escapeHtml(i18n.t('ui.masterDataVatLookupProviderLocal', 'Archivio Kedrix locale'))}</option>
              </select>
            </div>
            <div class="field">
              <label for="vatLookupApplyMode">${escapeHtml(i18n.t('ui.masterDataVatLookupApplyMode', 'Modalità compilazione'))}</label>
              <select id="vatLookupApplyMode" name="applyMode">
                <option value="replace-all" ${config.applyMode === 'replace-all' ? 'selected' : ''}>${escapeHtml(i18n.t('ui.masterDataVatLookupApplyAll', 'Sovrascrivi i campi anagrafici'))}</option>
                <option value="replace-empty" ${config.applyMode === 'replace-empty' ? 'selected' : ''}>${escapeHtml(i18n.t('ui.masterDataVatLookupApplyEmpty', 'Compila solo i campi vuoti'))}</option>
              </select>
            </div>
            <div class="field full" data-vat-endpoint-row ${(config.provider === 'custom-endpoint' || config.provider === 'apps-script-vies') ? '' : 'hidden'}>
              <label for="vatLookupEndpointUrl">${escapeHtml(i18n.t('ui.masterDataVatLookupEndpoint', 'Endpoint lookup'))}</label>
              <input id="vatLookupEndpointUrl" name="endpointUrl" type="text" value="${escapeHtml(config.endpointUrl)}" placeholder="https://.../vat-lookup" autocomplete="off" />
            </div>
            <div class="field" data-vat-header-row ${config.provider === 'custom-endpoint' ? '' : 'hidden'}>
              <label for="vatLookupApiKeyHeader">${escapeHtml(i18n.t('ui.masterDataVatLookupApiKeyHeader', 'Header API key'))}</label>
              <input id="vatLookupApiKeyHeader" name="apiKeyHeader" type="text" value="${escapeHtml(config.apiKeyHeader)}" autocomplete="off" />
            </div>
            <div class="field" data-vat-endpoint-row ${(config.provider === 'custom-endpoint' || config.provider === 'apps-script-vies') ? '' : 'hidden'}>
              <label for="vatLookupApiKey">${escapeHtml(i18n.t('ui.masterDataVatLookupApiKey', 'API key'))}</label>
              <input id="vatLookupApiKey" name="apiKey" type="password" value="${escapeHtml(config.apiKey)}" autocomplete="off" />
            </div>
            <div class="field">
              <label for="vatLookupCountryDefault">${escapeHtml(i18n.t('ui.masterDataVatLookupCountry', 'Nazione predefinita'))}</label>
              <input id="vatLookupCountryDefault" name="countryDefault" type="text" maxlength="2" value="${escapeHtml(config.countryDefault)}" autocomplete="off" />
            </div>
          </div>
          <div class="master-data-integration-note">${escapeHtml(i18n.t('ui.masterDataVatLookupConfigNote', 'In staging puoi usare un endpoint personalizzato oppure riutilizzare i dati già presenti in Kedrix.'))}</div>
          <div class="form-actions master-data-actions"><button class="btn secondary" id="vatLookupConfigSave" type="submit">${escapeHtml(i18n.t('ui.masterDataVatLookupConfigSave', 'Salva configurazione lookup'))}</button></div>
        </form>
      </section>`;
  }

  function bindConfigPanel({ state, root, save, render, toast, i18n }) {
    const form = root.querySelector('#vatLookupConfigForm');
    const provider = root.querySelector('#vatLookupProvider');
    const endpointRows = Array.from(root.querySelectorAll('[data-vat-endpoint-row]'));
    const headerRows = Array.from(root.querySelectorAll('[data-vat-header-row]'));

    function toggleRows() {
      const providerValue = (provider && provider.value) || '';
      const showEndpoint = ['custom-endpoint', 'apps-script-vies'].includes(providerValue);
      endpointRows.forEach((node) => { node.hidden = !showEndpoint; });
      headerRows.forEach((node) => { node.hidden = providerValue !== 'custom-endpoint'; });
    }

    provider?.addEventListener('change', toggleRows);
    toggleRows();

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const config = ensureConfig(state);
      const formData = new FormData(form);
      config.provider = cleanText(formData.get('provider')) || DEFAULT_CONFIG.provider;
      config.applyMode = cleanText(formData.get('applyMode')) || DEFAULT_CONFIG.applyMode;
      config.endpointUrl = cleanText(formData.get('endpointUrl')) || cleanText(getGlobalDefaults().vatLookupUrl);
      config.apiKeyHeader = cleanText(formData.get('apiKeyHeader')) || DEFAULT_CONFIG.apiKeyHeader;
      config.apiKey = cleanText(formData.get('apiKey'));
      config.countryDefault = cleanUpper(formData.get('countryDefault')) || DEFAULT_CONFIG.countryDefault;
      save();
      render();
      toast(i18n.t('ui.masterDataVatLookupConfigSaved', 'Configurazione recupero partita IVA salvata.'), 'success');
    });
  }

  async function lookupByVatNumber({ state, entityKey, vatNumber }) {
    const config = ensureConfig(state);
    const normalizedVat = normalizeVatNumber(vatNumber, config.countryDefault);
    if (!normalizedVat.ok) return { ok: false, reason: 'invalid-vat', lookupStatus: 'invalid-vat', normalizedVat };

    const localHit = findLocalRecordByVat(state, normalizedVat.formatted, entityKey);
    if (localHit && config.provider === 'local-records') return localHit;

    if (config.provider === 'custom-endpoint' || config.provider === 'apps-script-vies') {
      if (!config.endpointUrl) {
        return localHit || { ok: false, reason: 'missing-endpoint', lookupStatus: 'needs-config', normalizedVat };
      }
      try {
        const remote = await fetchFromCustomEndpoint(state, entityKey, normalizedVat);
        if (remote.ok) return remote;
        if (remote.reason === 'not-found' && localHit) return localHit;
        return { ok: false, reason: remote.reason || 'lookup-error', lookupStatus: remote.reason === 'not-found' ? 'not-found' : 'lookup-error', normalizedVat, payload: remote.payload };
      } catch (error) {
        return localHit || { ok: false, reason: 'lookup-error', lookupStatus: 'lookup-error', normalizedVat, error };
      }
    }

    return localHit || { ok: false, reason: 'not-found', lookupStatus: 'not-found', normalizedVat };
  }

  function messageForLookupResult(result, i18n) {
    if (!result) return i18n.t('ui.masterDataVatLookupError', 'Recupero dati non riuscito.');
    if (result.ok && result.found) {
      return result.sourceKind === 'local-records'
        ? i18n.t('ui.masterDataVatLookupLocalToast', 'Dati anagrafici riutilizzati da Kedrix.')
        : i18n.t('ui.masterDataVatLookupOfficialToast', 'Dati anagrafici recuperati dalla sorgente configurata.');
    }
    if (result.lookupStatus === 'invalid-vat') return i18n.t('ui.masterDataVatLookupInvalid', 'Partita IVA non valida.');
    if (result.lookupStatus === 'needs-config') return i18n.t('ui.masterDataVatLookupNeedsConfig', 'Configura un endpoint per il recupero automatico.');
    if (result.lookupStatus === 'not-found') return i18n.t('ui.masterDataVatLookupNotFound', 'Nessun dato trovato per questa partita IVA.');
    return i18n.t('ui.masterDataVatLookupError', 'Recupero dati non riuscito.');
  }

  function toneForLookupResult(result) {
    if (result && result.ok && result.found) return result.sourceKind === 'local-records' ? 'info' : 'success';
    if (result && result.lookupStatus === 'needs-config') return 'warning';
    if (result && result.lookupStatus === 'invalid-vat') return 'warning';
    if (result && result.lookupStatus === 'not-found') return 'warning';
    return 'warning';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
    DEFAULT_CONFIG,
    getGlobalDefaults,
    ensureConfig,
    normalizeVatNumber,
    lookupByVatNumber,
    applyLookupToDraft,
    setDraftLookupMeta,
    renderLookupStatus,
    renderConfigPanel,
    bindConfigPanel,
    messageForLookupResult,
    toneForLookupResult
  };
})();
