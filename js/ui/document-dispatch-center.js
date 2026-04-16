window.KedrixOneDocumentDispatchCenter = (() => {
  'use strict';

  const Feedback = window.KedrixOneAppFeedback || null;

  const MODULE_ROUTE_MAP = {
    arrivalNotice: 'practices/notifica-arrivo-merce',
    departureNotice: 'practices/notifica-partenza-merce',
    remittanceDocuments: 'practices/rimessa-documenti',
    quotations: 'quotations'
  };

  const MODULE_LABELS = {
    arrivalNotice: 'Notifica arrivo merce',
    departureNotice: 'Notifica partenza merce',
    remittanceDocuments: 'Rimessa documenti',
    quotations: 'Quotazioni'
  };

  const STATUS_LABELS = {
    'queued-local-staging': 'Accodato in staging',
    'ready-for-backend': 'Pronto per backend',
    'sent-confirmed': 'Inviato',
    cancelled: 'Annullato'
  };

  function cleanText(value) {
    return String(value || '').trim();
  }

  function escapeHtml(value) {
    return cleanText(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function ensureState(state) {
    if (!state || typeof state !== 'object') return null;
    if (!state.documentDispatchCenter || typeof state.documentDispatchCenter !== 'object' || Array.isArray(state.documentDispatchCenter)) {
      state.documentDispatchCenter = {
        filterStatus: 'all',
        filterModule: 'all',
        selectedEntryId: ''
      };
    }
    if (!Array.isArray(state.documentDispatchQueue)) state.documentDispatchQueue = [];
    return state.documentDispatchCenter;
  }

  function getModuleLabel(moduleKey) {
    return MODULE_LABELS[moduleKey] || cleanText(moduleKey) || 'Modulo';
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || cleanText(status) || 'Stato';
  }

  function getStatusTone(status) {
    switch (status) {
      case 'sent-confirmed':
        return 'success';
      case 'ready-for-backend':
        return 'info';
      case 'cancelled':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  function formatDateTime(value) {
    const raw = cleanText(value);
    if (!raw) return '—';
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function summarize(state) {
    ensureState(state);
    const queue = state.documentDispatchQueue || [];
    return {
      total: queue.length,
      queued: queue.filter((entry) => entry.status === 'queued-local-staging').length,
      ready: queue.filter((entry) => entry.status === 'ready-for-backend').length,
      sent: queue.filter((entry) => entry.status === 'sent-confirmed').length,
      cancelled: queue.filter((entry) => entry.status === 'cancelled').length
    };
  }

  function getFilteredEntries(state) {
    const ui = ensureState(state) || { filterStatus: 'all', filterModule: 'all' };
    const queue = Array.isArray(state.documentDispatchQueue) ? state.documentDispatchQueue : [];
    return queue.filter((entry) => {
      if (ui.filterStatus && ui.filterStatus !== 'all' && cleanText(entry.status) !== ui.filterStatus) return false;
      if (ui.filterModule && ui.filterModule !== 'all' && cleanText(entry.moduleKey) !== ui.filterModule) return false;
      return true;
    });
  }

  function getSelectedEntry(state) {
    const ui = ensureState(state);
    const entries = getFilteredEntries(state);
    if (!entries.length) {
      ui.selectedEntryId = '';
      return null;
    }
    let selected = entries.find((entry) => cleanText(entry.id) === cleanText(ui.selectedEntryId)) || null;
    if (!selected) {
      selected = entries[0] || null;
      ui.selectedEntryId = selected ? cleanText(selected.id) : '';
    }
    return selected;
  }

  function renderPanel(options = {}) {
    const state = options.state;
    const i18n = options.i18n || null;
    ensureState(state);
    const ui = state.documentDispatchCenter;
    const summary = summarize(state);
    const entries = getFilteredEntries(state);
    const selected = getSelectedEntry(state);
    const moduleOptions = Object.entries(MODULE_LABELS).map(([value, label]) => `<option value="${escapeHtml(value)}"${ui.filterModule === value ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('');
    const statusOptions = [
      ['all', 'Tutti gli stati'],
      ['queued-local-staging', 'Accodato in staging'],
      ['ready-for-backend', 'Pronto per backend'],
      ['sent-confirmed', 'Inviato'],
      ['cancelled', 'Annullato']
    ].map(([value, label]) => `<option value="${escapeHtml(value)}"${ui.filterStatus === value ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('');

    return `
      <section class="panel document-dispatch-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${escapeHtml(i18n?.t?.('ui.dispatchCenterTitle', 'Centro invii automatici') || 'Centro invii automatici')}</h3>
            <p class="panel-subtitle">${escapeHtml(i18n?.t?.('ui.dispatchCenterHint', 'Coda interna Kedrix One per i documenti salvati e inviati senza aprire browser o client email esterni.') || 'Coda interna Kedrix One per i documenti salvati e inviati senza aprire browser o client email esterni.')}</p>
          </div>
        </div>
        <div class="dispatch-kpi-grid">
          <article class="kpi-card"><div class="kpi-label">Totale code</div><div class="kpi-value">${summary.total}</div></article>
          <article class="kpi-card"><div class="kpi-label">Accodati</div><div class="kpi-value">${summary.queued}</div></article>
          <article class="kpi-card"><div class="kpi-label">Pronti backend</div><div class="kpi-value">${summary.ready}</div></article>
          <article class="kpi-card"><div class="kpi-label">Inviati</div><div class="kpi-value">${summary.sent}</div></article>
        </div>
        <div class="dispatch-filter-row">
          <label class="field compact"><span>Stato</span><select data-dispatch-filter-status>${statusOptions}</select></label>
          <label class="field compact"><span>Modulo</span><select data-dispatch-filter-module><option value="all">Tutti i moduli</option>${moduleOptions}</select></label>
        </div>
        <div class="dispatch-layout">
          <div class="dispatch-list">
            ${entries.length ? entries.map((entry) => `
              <button type="button" class="dispatch-entry-card ${selected && cleanText(selected.id) === cleanText(entry.id) ? 'active' : ''}" data-dispatch-select="${escapeHtml(entry.id)}">
                <div class="dispatch-entry-head">
                  <strong>${escapeHtml(entry.documentReference || entry.recordId || 'Senza riferimento')}</strong>
                  <span class="badge ${getStatusTone(entry.status)}">${escapeHtml(getStatusLabel(entry.status))}</span>
                </div>
                <div class="dispatch-entry-meta">${escapeHtml(getModuleLabel(entry.moduleKey))} · ${escapeHtml(entry.recipientLabel || 'Destinatario da definire')}</div>
                <div class="dispatch-entry-subject">${escapeHtml(entry.subject || 'Senza oggetto')}</div>
                <div class="dispatch-entry-time">${escapeHtml(formatDateTime(entry.queuedAt))}</div>
              </button>
            `).join('') : `<div class="empty-state-inline">Nessun invio automatico in coda.</div>`}
          </div>
          <div class="dispatch-detail">
            ${selected ? `
              <div class="detail-grid detail-grid-large dispatch-detail-grid">
                <div class="detail-row"><div class="detail-label">Modulo</div><div>${escapeHtml(getModuleLabel(selected.moduleKey))}</div></div>
                <div class="detail-row"><div class="detail-label">Riferimento</div><div>${escapeHtml(selected.documentReference || selected.recordId || '—')}</div></div>
                <div class="detail-row"><div class="detail-label">Stato</div><div>${escapeHtml(getStatusLabel(selected.status))}</div></div>
                <div class="detail-row"><div class="detail-label">Accodato</div><div>${escapeHtml(formatDateTime(selected.queuedAt))}</div></div>
              </div>
              <div class="dispatch-edit-grid">
                <label class="field compact full"><span>Destinatario</span><input type="text" value="${escapeHtml(selected.recipientLabel || '')}" data-dispatch-field="recipientLabel" /></label>
                <label class="field compact full"><span>Oggetto</span><input type="text" value="${escapeHtml(selected.subject || '')}" data-dispatch-field="subject" /></label>
                <label class="field compact full"><span>Corpo email</span><textarea rows="10" data-dispatch-field="body">${escapeHtml(selected.body || '')}</textarea></label>
              </div>
              <div class="action-row dispatch-action-row">
                <button class="btn secondary" type="button" data-dispatch-mark-ready="${escapeHtml(selected.id)}">Pronto backend</button>
                <button class="btn secondary" type="button" data-dispatch-mark-sent="${escapeHtml(selected.id)}">Segna inviato</button>
                <button class="btn secondary" type="button" data-dispatch-requeue="${escapeHtml(selected.id)}">Rimetti in coda</button>
                <button class="btn secondary" type="button" data-dispatch-open-module="${escapeHtml(selected.moduleKey)}">Apri modulo</button>
                <button class="btn danger ghost" type="button" data-dispatch-cancel="${escapeHtml(selected.id)}">Annulla</button>
              </div>
            ` : `<div class="empty-state-inline">Seleziona un invio per vedere il dettaglio.</div>`}
          </div>
        </div>
      </section>`;
  }

  function bind(options = {}) {
    const state = options.state;
    const root = options.root;
    const save = typeof options.save === 'function' ? options.save : null;
    const render = typeof options.render === 'function' ? options.render : null;
    const navigate = typeof options.navigate === 'function' ? options.navigate : null;
    if (!root || !state) return;
    ensureState(state);

    const rerender = () => {
      if (save) save();
      if (render) render();
    };

    root.querySelectorAll('[data-dispatch-filter-status]').forEach((node) => {
      node.addEventListener('change', () => {
        state.documentDispatchCenter.filterStatus = cleanText(node.value) || 'all';
        state.documentDispatchCenter.selectedEntryId = '';
        rerender();
      });
    });

    root.querySelectorAll('[data-dispatch-filter-module]').forEach((node) => {
      node.addEventListener('change', () => {
        state.documentDispatchCenter.filterModule = cleanText(node.value) || 'all';
        state.documentDispatchCenter.selectedEntryId = '';
        rerender();
      });
    });

    root.querySelectorAll('[data-dispatch-select]').forEach((button) => {
      button.addEventListener('click', () => {
        state.documentDispatchCenter.selectedEntryId = cleanText(button.dataset.dispatchSelect);
        rerender();
      });
    });

    const queue = Array.isArray(state.documentDispatchQueue) ? state.documentDispatchQueue : [];
    const findEntry = (id) => queue.find((entry) => cleanText(entry.id) === cleanText(id)) || null;

    root.querySelectorAll('[data-dispatch-field]').forEach((field) => {
      field.addEventListener('input', () => {
        const selected = findEntry(state.documentDispatchCenter.selectedEntryId);
        if (!selected) return;
        selected[field.dataset.dispatchField] = field.value || '';
        if (save) save();
      });
    });

    root.querySelectorAll('[data-dispatch-mark-ready]').forEach((button) => {
      button.addEventListener('click', () => {
        const entry = findEntry(button.dataset.dispatchMarkReady);
        if (!entry) return;
        entry.status = 'ready-for-backend';
        entry.updatedAt = new Date().toISOString();
        Feedback?.success?.('Invio segnato come pronto per backend.');
        rerender();
      });
    });

    root.querySelectorAll('[data-dispatch-mark-sent]').forEach((button) => {
      button.addEventListener('click', () => {
        const entry = findEntry(button.dataset.dispatchMarkSent);
        if (!entry) return;
        entry.status = 'sent-confirmed';
        entry.sentAt = new Date().toISOString();
        entry.updatedAt = entry.sentAt;
        Feedback?.success?.('Invio marcato come completato.');
        rerender();
      });
    });

    root.querySelectorAll('[data-dispatch-requeue]').forEach((button) => {
      button.addEventListener('click', () => {
        const entry = findEntry(button.dataset.dispatchRequeue);
        if (!entry) return;
        entry.status = 'queued-local-staging';
        entry.updatedAt = new Date().toISOString();
        Feedback?.success?.('Invio rimesso in coda interna.');
        rerender();
      });
    });

    root.querySelectorAll('[data-dispatch-cancel]').forEach((button) => {
      button.addEventListener('click', () => {
        const entry = findEntry(button.dataset.dispatchCancel);
        if (!entry) return;
        entry.status = 'cancelled';
        entry.updatedAt = new Date().toISOString();
        Feedback?.success?.('Invio annullato.');
        rerender();
      });
    });

    root.querySelectorAll('[data-dispatch-open-module]').forEach((button) => {
      button.addEventListener('click', () => {
        const moduleKey = cleanText(button.dataset.dispatchOpenModule);
        const route = MODULE_ROUTE_MAP[moduleKey] || '';
        if (!route || !navigate) return;
        navigate(route);
      });
    });
  }

  return {
    ensureState,
    summarize,
    renderPanel,
    bind,
    getFilteredEntries,
    getSelectedEntry
  };
})();
