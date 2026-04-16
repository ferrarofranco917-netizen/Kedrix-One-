window.KedrixOneDocumentOps = (() => {
  'use strict';

  const Feedback = window.KedrixOneAppFeedback || null;

  let previewRoot = null;

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function ensurePreviewRoot() {
    if (previewRoot) return previewRoot;
    previewRoot = document.createElement('section');
    previewRoot.id = 'documentPrintPreviewRoot';
    previewRoot.className = 'print-preview-root';
    previewRoot.setAttribute('hidden', 'hidden');
    document.body.appendChild(previewRoot);
    return previewRoot;
  }

  function closePrintPreview() {
    const root = ensurePreviewRoot();
    root.innerHTML = '';
    root.setAttribute('hidden', 'hidden');
    document.body.classList.remove('print-preview-open');
  }

  function openPrintPreview(options = {}) {
    const root = ensurePreviewRoot();
    const title = String(options.title || 'Anteprima di stampa').trim() || 'Anteprima di stampa';
    const html = String(options.html || '').trim();
    if (!html) return false;

    root.removeAttribute('hidden');
    document.body.classList.add('print-preview-open');
    root.innerHTML = `
      <div class="print-preview-backdrop" data-print-preview-close="backdrop"></div>
      <section class="print-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="printPreviewTitle">
        <header class="print-preview-toolbar">
          <div>
            <div class="print-preview-kicker">Kedrix One</div>
            <h3 id="printPreviewTitle">${escapeHtml(title)}</h3>
          </div>
          <div class="print-preview-actions">
            <button type="button" class="btn secondary" data-print-preview-trigger="1">Stampa</button>
            <button type="button" class="btn" data-print-preview-close="1">Chiudi</button>
          </div>
        </header>
        <div class="print-preview-frame-wrap">
          <iframe class="print-preview-frame" title="${escapeHtml(title)}"></iframe>
        </div>
      </section>`;

    const iframe = root.querySelector('.print-preview-frame');
    if (iframe && 'srcdoc' in iframe) {
      iframe.srcdoc = html;
    }

    root.querySelector('[data-print-preview-close="backdrop"]')?.addEventListener('click', closePrintPreview, { once: true });
    root.querySelector('[data-print-preview-close="1"]')?.addEventListener('click', closePrintPreview, { once: true });
    root.querySelector('[data-print-preview-trigger="1"]')?.addEventListener('click', () => {
      const frame = root.querySelector('.print-preview-frame');
      const win = frame && frame.contentWindow ? frame.contentWindow : null;
      if (!win) return;
      win.focus();
      win.print();
    });

    return true;
  }

  function ensureDispatchQueue(state) {
    if (!state || typeof state !== 'object') return [];
    if (!Array.isArray(state.documentDispatchQueue)) state.documentDispatchQueue = [];
    return state.documentDispatchQueue;
  }

  function queueAutomaticDispatch(options = {}) {
    const {
      state = null,
      moduleKey = '',
      documentType = '',
      recordId = '',
      draft = null,
      subject = '',
      body = '',
      recipient = '',
      recipientLabel = '',
      save = null
    } = options;

    const queue = ensureDispatchQueue(state);
    const entry = {
      id: `dispatch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      moduleKey: String(moduleKey || '').trim(),
      documentType: String(documentType || moduleKey || '').trim(),
      recordId: String(recordId || '').trim(),
      documentReference: String(draft?.practiceReference || draft?.quoteNumber || draft?.reference || draft?.id || '').trim(),
      subject: String(subject || '').trim(),
      body: String(body || '').trim(),
      recipient: String(recipient || '').trim(),
      recipientLabel: String(recipientLabel || '').trim(),
      moduleLabel: String(options.moduleLabel || '').trim(),
      status: 'queued-local-staging',
      queuedAt: new Date().toISOString(),
      sourceDraftSnapshot: draft && typeof draft === 'object' ? JSON.parse(JSON.stringify(draft)) : null
    };
    queue.unshift(entry);
    if (typeof save === 'function') save();
    if (Feedback && typeof Feedback.success === 'function') {
      Feedback.success('Documento salvato e accodato al Centro invii automatici di Kedrix One.');
    }
    return entry;
  }

  return {
    openPrintPreview,
    closePrintPreview,
    ensureDispatchQueue,
    queueAutomaticDispatch
  };
})();
