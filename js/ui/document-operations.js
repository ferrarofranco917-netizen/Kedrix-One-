window.KedrixOneDocumentOperations = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value ?? '') };

  function ensureDispatchQueue(state) {
    if (!state || typeof state !== 'object') return [];
    if (!Array.isArray(state.documentDispatchQueue)) state.documentDispatchQueue = [];
    return state.documentDispatchQueue;
  }

  function deriveRecipientEmail(draft = {}) {
    const candidates = [
      draft.email,
      draft.contactEmail,
      draft.customerEmail,
      draft.notifyEmail,
      draft.recipientEmail,
      draft.consigneeEmail
    ];
    return String(candidates.find((entry) => String(entry || '').trim()) || '').trim();
  }

  function queueDispatch(state, payload = {}) {
    const queue = ensureDispatchQueue(state);
    const now = new Date().toISOString();
    const id = `DISP-${now.replace(/[-:TZ.]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const entry = {
      id,
      createdAt: now,
      updatedAt: now,
      status: 'queued',
      moduleKey: '',
      moduleLabel: '',
      documentLabel: '',
      recordId: '',
      practiceId: '',
      practiceReference: '',
      recipientEmail: '',
      subject: '',
      note: '',
      snapshot: {},
      ...payload
    };
    queue.unshift(entry);
    return entry;
  }

  function buildPrintShell({ title = 'Documento', bodyHtml = '', companyConfig = null } = {}) {
    const companyName = String(companyConfig?.name || 'Kedrix One').trim() || 'Kedrix One';
    return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <base href="${U.escapeHtml(document.baseURI || window.location.href)}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${U.escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --border: #d7dde6;
      --muted: #5b6470;
      --text: #13181e;
      --brand: #234a66;
      --panel: #f6f8fb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
      background: #ffffff;
    }
    .print-shell {
      max-width: 1120px;
      margin: 0 auto;
    }
    .print-header {
      display: grid;
      grid-template-columns: 78px 1fr;
      gap: 18px;
      align-items: center;
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .print-logo {
      width: 78px;
      height: 78px;
      object-fit: contain;
    }
    .print-brand-eyebrow {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .print-brand-title {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.1;
      margin: 0;
    }
    .print-brand-company {
      font-size: 14px;
      color: var(--muted);
      margin-top: 4px;
    }
    .print-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin: 18px 0;
    }
    .print-meta-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      background: var(--panel);
      min-height: 64px;
    }
    .print-meta-card strong {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .print-section { margin-top: 18px; }
    .print-section h2 {
      font-size: 15px;
      margin: 0 0 8px;
    }
    .print-block {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
      background: #fff;
      line-height: 1.5;
      white-space: normal;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 8px;
      text-align: left;
      vertical-align: top;
      font-size: 12px;
    }
    th {
      background: #eef3f8;
      font-weight: 700;
    }
    @media print {
      body { padding: 0; }
      .print-shell { max-width: none; }
    }
  </style>
</head>
<body>
  <div class="print-shell">
    <header class="print-header">
      <img class="print-logo" src="./brand/kedrix-one-mark.svg" alt="Kedrix One">
      <div>
        <div class="print-brand-eyebrow">Kedrix One</div>
        <h1 class="print-brand-title">${U.escapeHtml(title)}</h1>
        <div class="print-brand-company">${U.escapeHtml(companyName)}</div>
      </div>
    </header>
    ${bodyHtml}
  </div>
</body>
</html>`;
  }

  function printHtmlDocument({ title = 'Documento', bodyHtml = '', companyConfig = null } = {}) {
    const normalizedBody = String(bodyHtml || '');
    const html = /<html[\s>]/i.test(normalizedBody) ? normalizedBody : buildPrintShell({ title, bodyHtml: normalizedBody, companyConfig });
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        try {
          iframe.remove();
        } catch (error) {
          // noop
        }
      }, 250);
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        cleanup();
      }
    };
    iframe.srcdoc = html;
    return true;
  }

  return {
    deriveRecipientEmail,
    ensureDispatchQueue,
    queueDispatch,
    buildPrintShell,
    printHtmlDocument
  };
})();
