window.KedrixOneDocumentCategories = (() => {
  'use strict';

  const DEFAULT_OPTIONS = [
    { value: 'generic', labelKey: 'ui.attachmentTypeGeneric', fallback: 'Allegato operativo' },
    { value: 'clientInstructions', labelKey: 'ui.attachmentTypeClientInstructions', fallback: 'Istruzioni cliente' },
    { value: 'invoice', labelKey: 'ui.attachmentTypeInvoice', fallback: 'Invoice' },
    { value: 'packingList', labelKey: 'ui.attachmentTypePackingList', fallback: 'Packing list' },
    { value: 'signedMandate', labelKey: 'ui.attachmentTypeSignedMandate', fallback: 'Mandato firmato' },
    { value: 'booking', labelKey: 'ui.attachmentTypeBooking', fallback: 'Booking' },
    { value: 'policy', labelKey: 'ui.attachmentTypePolicy', fallback: 'Polizza / BL / AWB' },
    { value: 'customsDocs', labelKey: 'ui.attachmentTypeCustomsDocs', fallback: 'Documenti doganali' },
    { value: 'deliveryOrder', labelKey: 'ui.attachmentTypeDeliveryOrder', fallback: 'Delivery order' },
    { value: 'fundRequest', labelKey: 'ui.attachmentTypeFundRequest', fallback: 'Richiesta fondi' },
    { value: 'quotation', labelKey: 'ui.attachmentTypeQuotation', fallback: 'Quotazione' },
    { value: 'other', labelKey: 'ui.attachmentTypeOther', fallback: 'Altro' }
  ];

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function slugify(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  function defaultOptions(i18n) {
    return DEFAULT_OPTIONS.map((item) => ({
      value: item.value,
      label: t(i18n, item.labelKey, item.fallback)
    }));
  }

  function ensureConfigBucket(state) {
    if (!state.companyConfig || typeof state.companyConfig !== 'object') state.companyConfig = {};
    if (!state.companyConfig.documents || typeof state.companyConfig.documents !== 'object') state.companyConfig.documents = {};
    return state.companyConfig.documents;
  }

  function normalizeOptions(rawOptions, i18n) {
    const fallbackMap = new Map(defaultOptions(i18n).map((item) => [item.value, item]));
    const result = [];
    const seen = new Set();

    (Array.isArray(rawOptions) ? rawOptions : []).forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const value = slugify(entry.value || entry.label);
      const label = String(entry.label || '').trim();
      if (!value || !label || seen.has(value)) return;
      seen.add(value);
      result.push({ value, label });
    });

    if (!result.length) return defaultOptions(i18n);

    fallbackMap.forEach((entry, key) => {
      if (seen.has(key)) return;
      if (key === 'generic' || key === 'other') result.push(entry);
    });

    return result;
  }

  function ensureStateOptions(state, i18n) {
    const bucket = ensureConfigBucket(state || {});
    bucket.documentTypeOptions = normalizeOptions(bucket.documentTypeOptions, i18n);
    return bucket.documentTypeOptions;
  }

  function getOptions(state, i18n) {
    return ensureStateOptions(state || {}, i18n).map((item) => ({ ...item }));
  }

  function serializeOptions(state, i18n) {
    return getOptions(state, i18n).map((item) => `${item.value}|${item.label}`).join('\n');
  }

  function parseOptionsText(rawText, i18n) {
    const lines = String(rawText || '').split(/\r?\n/);
    const items = [];

    lines.forEach((line) => {
      const trimmed = String(line || '').trim();
      if (!trimmed) return;
      const parts = trimmed.split('|');
      const value = slugify(parts[0]);
      const label = String(parts.length > 1 ? parts.slice(1).join('|') : parts[0]).trim();
      if (!value || !label) return;
      items.push({ value, label });
    });

    return normalizeOptions(items, i18n);
  }

  function applyOptionsText(state, rawText, i18n) {
    const bucket = ensureConfigBucket(state || {});
    bucket.documentTypeOptions = parseOptionsText(rawText, i18n);
    return bucket.documentTypeOptions;
  }

  function resetToDefault(state, i18n) {
    const bucket = ensureConfigBucket(state || {});
    bucket.documentTypeOptions = defaultOptions(i18n);
    return bucket.documentTypeOptions;
  }

  return {
    defaultOptions,
    ensureStateOptions,
    getOptions,
    serializeOptions,
    applyOptionsText,
    resetToDefault
  };
})();
