window.KedrixOneDocumentPreview = (() => {
  'use strict';

  let currentUrl = '';
  let currentAttachmentId = '';

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function revokePreviewUrl() {
    if (!currentUrl) return;
    window.URL.revokeObjectURL(currentUrl);
    currentUrl = '';
  }

  function setMessage(host, title, body) {
    if (!host) return;
    host.innerHTML = `
      <div class="document-preview-empty">
        <div class="document-preview-empty-title">${escapeHtml(title)}</div>
        <div class="document-preview-empty-text">${escapeHtml(body)}</div>
      </div>`;
  }

  function classify(record) {
    const mimeType = String(record?.mimeType || '').toLowerCase();
    const fileName = String(record?.fileName || '').toLowerCase();
    if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('text/') || ['.txt', '.csv', '.json', '.xml', '.md', '.log'].some((ext) => fileName.endsWith(ext))) return 'text';
    return 'generic';
  }

  async function render(options = {}) {
    const { host, attachmentId, attachments, i18n } = options;
    if (!host) return;
    const t = (key, fallback) => (i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback);

    if (!attachmentId) {
      revokePreviewUrl();
      currentAttachmentId = '';
      setMessage(host, t('ui.documentPreviewEmptyTitle', 'Anteprima documento'), t('ui.documentPreviewEmptyText', 'Seleziona un documento dal bundle per visualizzare un’anteprima interna.'));
      return;
    }

    if (!attachments || typeof attachments.getAttachmentRecord !== 'function') {
      setMessage(host, t('ui.documentPreviewUnavailableTitle', 'Anteprima non disponibile'), t('ui.documentPreviewUnavailableText', 'Il servizio allegati non è disponibile nella build corrente.'));
      return;
    }

    try {
      const record = await attachments.getAttachmentRecord(attachmentId);
      if (!record || !record.blob) {
        revokePreviewUrl();
        currentAttachmentId = '';
        setMessage(host, t('ui.documentPreviewMissingTitle', 'Documento non disponibile'), t('ui.documentPreviewMissingText', 'Il file non è disponibile nell’archivio locale del browser.'));
        return;
      }

      revokePreviewUrl();
      currentAttachmentId = attachmentId;
      const kind = classify(record);
      currentUrl = window.URL.createObjectURL(record.blob);

      if (kind === 'pdf') {
        host.innerHTML = `
          <div class="document-preview-stage">
            <div class="document-preview-meta"><span class="badge info">PDF</span><span>${escapeHtml(record.fileName || '—')}</span></div>
            <iframe class="document-preview-frame" title="${escapeHtml(record.fileName || 'Anteprima PDF')}" src="${currentUrl}"></iframe>
          </div>`;
        return;
      }

      if (kind === 'image') {
        host.innerHTML = `
          <div class="document-preview-stage">
            <div class="document-preview-meta"><span class="badge success">IMG</span><span>${escapeHtml(record.fileName || '—')}</span></div>
            <div class="document-preview-image-wrap"><img class="document-preview-image" src="${currentUrl}" alt="${escapeHtml(record.fileName || 'Documento immagine')}" /></div>
          </div>`;
        return;
      }

      if (kind === 'text') {
        const rawText = await record.blob.text();
        const clipped = rawText.length > 50000 ? `${rawText.slice(0, 50000)}

…` : rawText;
        host.innerHTML = `
          <div class="document-preview-stage">
            <div class="document-preview-meta"><span class="badge">TXT</span><span>${escapeHtml(record.fileName || '—')}</span></div>
            <pre class="document-preview-text">${escapeHtml(clipped)}</pre>
          </div>`;
        return;
      }

      host.innerHTML = `
        <div class="document-preview-empty">
          <div class="document-preview-empty-title">${escapeHtml(t('ui.documentPreviewGenericTitle', 'Anteprima non disponibile'))}</div>
          <div class="document-preview-empty-text">${escapeHtml(t('ui.documentPreviewGenericText', 'Questo formato non ha una preview inline nella build corrente. Puoi comunque aprire il documento dal bundle.'))}</div>
          <div class="document-preview-meta generic"><span>${escapeHtml(record.fileName || '—')}</span><span>${escapeHtml(record.mimeType || 'application/octet-stream')}</span></div>
        </div>`;
    } catch (error) {
      revokePreviewUrl();
      currentAttachmentId = '';
      setMessage(host, t('ui.documentPreviewErrorTitle', 'Errore anteprima'), error?.message || t('ui.documentPreviewErrorText', 'Impossibile caricare l’anteprima del documento.'));
    }
  }

  return {
    render,
    revokePreviewUrl
  };
})();
