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

  function cleanText(value) {
    return String(value || '').trim();
  }

  function resolveClientBranding(state = null, draft = {}) {
    const linkedClientId = cleanText(draft?.linkedEntities?.client?.recordId);
    const directClientId = cleanText(draft?.clientId || draft?.customerId || draft?.recipientClientId);
    const clientName = cleanText(
      draft?.client || draft?.clientName || draft?.customer || draft?.customerName || draft?.principalParty || draft?.transitary || draft?.consignee || draft?.recipient || ''
    );
    const clients = Array.isArray(state?.clients) ? state.clients : [];
    const matched = clients.find((entry) => {
      const entryId = cleanText(entry?.id);
      const entryName = cleanText(entry?.name);
      return (linkedClientId && entryId === linkedClientId)
        || (directClientId && entryId === directClientId)
        || (clientName && entryName && entryName.toLowerCase() === clientName.toLowerCase());
    }) || null;
    return {
      name: cleanText(
        matched?.name || draft?.client || draft?.clientName || draft?.customer || draft?.customerName || draft?.principalParty || draft?.transitary || draft?.consignee || draft?.recipient || ''
      ),
      logoUrl: cleanText(
        draft?.clientLogoUrl || draft?.customerLogoUrl || draft?.recipientLogoUrl || matched?.logoUrl || matched?.logoDataUrl || matched?.logoDataUri || ''
      )
    };
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

  function buildPrintShell({ title = 'Documento', bodyHtml = '', companyConfig = null, clientConfig = null } = {}) {
    const companyName = String(companyConfig?.name || 'Kedrix One').trim() || 'Kedrix One';
    const clientName = cleanText(clientConfig?.name);
    const clientLogoUrl = cleanText(clientConfig?.logoUrl);
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
      grid-template-columns: minmax(0, 1fr) 240px;
      gap: 18px;
      align-items: stretch;
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .print-brand-panel {
      display: grid;
      grid-template-columns: 78px minmax(0, 1fr);
      gap: 18px;
      align-items: center;
      min-height: 94px;
    }
    .print-logo {
      width: 78px;
      height: 78px;
      object-fit: contain;
    }
    .print-client-panel {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 12px;
      min-height: 94px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 8px;
      background: #fff;
    }
    .print-client-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      align-self: flex-start;
    }
    .print-client-logo,
    .print-client-logo-slot {
      width: 100%;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      object-fit: contain;
    }
    .print-client-logo-slot {
      border: 1px dashed var(--border);
      border-radius: 10px;
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: #fbfcfe;
    }
    .print-client-name {
      width: 100%;
      font-size: 12px;
      text-align: center;
      color: var(--text);
      font-weight: 600;
      min-height: 16px;
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
      <div class="print-brand-panel">
        <img class="print-logo" src="./brand/kedrix-one-mark.svg" alt="Kedrix One">
        <div>
          <div class="print-brand-eyebrow">Kedrix One</div>
          <h1 class="print-brand-title">${U.escapeHtml(title)}</h1>
          <div class="print-brand-company">${U.escapeHtml(companyName)}</div>
        </div>
      </div>
      <div class="print-client-panel">
        <div class="print-client-label">Cliente</div>
        ${clientLogoUrl ? `<img class="print-client-logo" src="${U.escapeHtml(clientLogoUrl)}" alt="${U.escapeHtml(clientName || 'Logo cliente')}">` : `<div class="print-client-logo-slot">Spazio logo cliente</div>`}
        <div class="print-client-name">${U.escapeHtml(clientName || '')}</div>
      </div>
    </header>
    ${bodyHtml}
  </div>
</body>
</html>`;
  }

  function printHtmlDocument({ title = 'Documento', bodyHtml = '', companyConfig = null, clientConfig = null } = {}) {
    const normalizedBody = String(bodyHtml || '');
    const html = /<html[\s>]/i.test(normalizedBody) ? normalizedBody : buildPrintShell({ title, bodyHtml: normalizedBody, companyConfig, clientConfig });
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
    resolveClientBranding,
    printHtmlDocument
  };
})();
