window.KedrixOneModuleBranding = (() => {
  'use strict';

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function companyName(state) {
    return String(state?.companyConfig?.name || 'Kedrix One').trim() || 'Kedrix One';
  }

  function companySubline(state) {
    return String(state?.companyConfig?.documentTagline || 'Operational Workspace').trim() || 'Operational Workspace';
  }

  function logoUrl(state) {
    const configured = String(state?.companyConfig?.brandLogoPath || '').trim();
    if (configured) return configured;
    try {
      return new URL('./brand/kedrix-one-mark.svg', window.location.href).href;
    } catch (error) {
      return './brand/kedrix-one-mark.svg';
    }
  }

  function renderBanner(state, options = {}) {
    const eyebrow = String(options.eyebrow || 'Kedrix One').trim();
    const title = String(options.title || companyName(state)).trim() || companyName(state);
    const subtitle = String(options.subtitle || companySubline(state)).trim();
    const meta = Array.isArray(options.meta) ? options.meta.filter(Boolean) : [];
    return `
      <section class="module-company-banner">
        <div class="module-company-brandmark-wrap">
          <img class="module-company-brandmark" src="${escapeHtml(logoUrl(state))}" alt="${escapeHtml(companyName(state))}">
        </div>
        <div class="module-company-copy">
          <div class="module-company-eyebrow">${escapeHtml(eyebrow)}</div>
          <div class="module-company-title">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="module-company-subtitle">${escapeHtml(subtitle)}</div>` : ''}
          ${meta.length ? `<div class="module-company-meta-row">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
        </div>
      </section>`;
  }

  return {
    companyName,
    companySubline,
    logoUrl,
    renderBanner
  };
})();
