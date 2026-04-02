window.KedrixOnePracticeAttachments = (() => {
  'use strict';

  const DB_NAME = 'kedrix-one-practice-attachments';
  const DocumentCategories = window.KedrixOneDocumentCategories;
  const DB_VERSION = 1;
  const STORE_NAME = 'attachments';

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB non disponibile in questo browser.'));
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error || new Error('Errore apertura archivio allegati.'));
      request.onupgradeneeded = () => {
        const db = request.result;
        const store = db.objectStoreNames.contains(STORE_NAME)
          ? request.transaction.objectStore(STORE_NAME)
          : db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        if (!store.indexNames.contains('ownerKey')) store.createIndex('ownerKey', 'ownerKey', { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  async function withStore(mode, worker) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      Promise.resolve(worker(store, tx)).then(resolve).catch(reject);
      tx.onerror = () => reject(tx.error || new Error('Errore archivio allegati.'));
      tx.oncomplete = () => db.close();
    });
  }

  function createAttachmentId() {
    return `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createDraftOwnerKey() {
    return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeAttachmentIndex(state) {
    if (!state || typeof state !== 'object') return {};
    if (!state.practiceAttachmentIndex || typeof state.practiceAttachmentIndex !== 'object' || Array.isArray(state.practiceAttachmentIndex)) {
      state.practiceAttachmentIndex = {};
    }
    return state.practiceAttachmentIndex;
  }

  function ensureDraftOwnerKey(draft) {
    if (!draft || typeof draft !== 'object') return createDraftOwnerKey();
    const explicit = String(draft.attachmentOwnerKey || '').trim();
    if (explicit) return explicit;
    const editingPracticeId = String(draft.editingPracticeId || '').trim();
    draft.attachmentOwnerKey = editingPracticeId || createDraftOwnerKey();
    return draft.attachmentOwnerKey;
  }

  function getOwnerKey(draft, practice) {
    return String(
      draft?.attachmentOwnerKey
      || practice?.attachmentOwnerKey
      || draft?.editingPracticeId
      || practice?.id
      || ''
    ).trim();
  }

  function resolveStateAndI18n(firstArg, secondArg) {
    const looksLikeState = firstArg && typeof firstArg === 'object' && ('companyConfig' in firstArg || 'practices' in firstArg);
    return {
      state: looksLikeState ? firstArg : null,
      i18n: looksLikeState ? secondArg : firstArg
    };
  }

  function getDocumentTypeOptions(firstArg, secondArg) {
    const context = resolveStateAndI18n(firstArg, secondArg);
    if (DocumentCategories && typeof DocumentCategories.getOptions === 'function') {
      return DocumentCategories.getOptions(context.state || { companyConfig: {} }, context.i18n);
    }
    const t = (key, fallback) => (context.i18n && typeof context.i18n.t === 'function' ? context.i18n.t(key, fallback) : fallback);
    return [
      { value: 'generic', label: t('ui.attachmentTypeGeneric', 'Allegato operativo') },
      { value: 'clientInstructions', label: t('ui.attachmentTypeClientInstructions', 'Istruzioni cliente') },
      { value: 'invoice', label: t('ui.attachmentTypeInvoice', 'Invoice') },
      { value: 'packingList', label: t('ui.attachmentTypePackingList', 'Packing list') },
      { value: 'signedMandate', label: t('ui.attachmentTypeSignedMandate', 'Mandato firmato') },
      { value: 'booking', label: t('ui.attachmentTypeBooking', 'Booking') },
      { value: 'policy', label: t('ui.attachmentTypePolicy', 'Polizza / BL / AWB') },
      { value: 'customsDocs', label: t('ui.attachmentTypeCustomsDocs', 'Documenti doganali') },
      { value: 'other', label: t('ui.attachmentTypeOther', 'Altro') }
    ];
  }

  function formatSize(bytes, locale = 'it-IT') {
    const value = Number(bytes || 0);
    if (!value) return '0 KB';
    if (value < 1024) return `${value} B`;
    const kb = value / 1024;
    if (kb < 1024) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(kb)} KB`;
    const mb = kb / 1024;
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(mb)} MB`;
  }

  function formatImportedAt(value, locale = 'it-IT') {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function getAttachments(state, draft, practice = null) {
    const ownerKey = getOwnerKey(draft, practice);
    if (!ownerKey) return [];
    const index = normalizeAttachmentIndex(state);
    const items = Array.isArray(index[ownerKey]) ? index[ownerKey] : [];
    return [...items].sort((a, b) => String(b.importedAt || '').localeCompare(String(a.importedAt || '')));
  }

  function syncRecordSummary(state, practice) {
    if (!practice || typeof practice !== 'object') return practice;
    const ownerKey = String(practice.attachmentOwnerKey || practice.id || '').trim();
    const items = ownerKey && state?.practiceAttachmentIndex && Array.isArray(state.practiceAttachmentIndex[ownerKey])
      ? state.practiceAttachmentIndex[ownerKey]
      : [];
    practice.attachmentOwnerKey = ownerKey;
    practice.attachmentCount = items.length;
    practice.attachmentUpdatedAt = items.length ? items[0].importedAt || '' : '';
    return practice;
  }

  function syncLinkedPracticeRecordState(state, draft) {
    if (!state || !draft) return null;
    const ownerKey = ensureDraftOwnerKey(draft);
    const linked = (state.practices || []).find((practice) => String(practice.id || '').trim() === String(draft.editingPracticeId || '').trim() || String(practice.attachmentOwnerKey || '').trim() === ownerKey);
    if (!linked) return null;
    return syncRecordSummary(state, linked);
  }

  function renderPanelHTML(options = {}) {
    const { state, draft, i18n, utils } = options;
    const t = (key, fallback) => (i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback);
    const escapeHtml = (value) => (utils && typeof utils.escapeHtml === 'function' ? utils.escapeHtml(value) : String(value || ''));
    if (!draft?.practiceType) {
      return `<div class="empty-text">${escapeHtml(t('ui.attachmentsTypeGuard', 'Seleziona prima il tipo pratica per attivare l’area allegati.'))}</div>`;
    }

    const items = getAttachments(state, draft);
    const typeOptions = getDocumentTypeOptions(state, i18n);
    const locale = typeof i18n?.getLanguage === 'function' && i18n.getLanguage() === 'en' ? 'en-GB' : 'it-IT';
    const ownerKey = ensureDraftOwnerKey(draft);
    const countLabel = items.length === 1 ? t('ui.attachmentCountOne', '1 allegato') : t('ui.attachmentCountMany', '{{count}} allegati').replace('{{count}}', String(items.length));

    return `
      <section class="attachments-panel" data-attachments-owner-key="${escapeHtml(ownerKey)}">
        <div class="attachments-toolbar">
          <div>
            <h4 class="attachments-title">${escapeHtml(t('ui.attachmentsPanelTitle', 'Allegati pratica'))}</h4>
            <p class="attachments-subtitle">${escapeHtml(t('ui.attachmentsPanelSubtitle', 'Importa documenti operativi nella pratica, tieni il tipo documento visibile e apri o rimuovi gli allegati in modo controllato.'))}</p>
          </div>
          <div class="attachments-meta-pills">
            <span class="helper-pill">${escapeHtml(countLabel)}</span>
            <span class="helper-pill">${escapeHtml(t('ui.attachmentsStorageHint', 'Archivio browser locale (demo/staging)'))}</span>
          </div>
        </div>

        <div class="attachments-upload-row">
          <div class="field">
            <label for="practiceAttachmentType">${escapeHtml(t('ui.attachmentTypeLabel', 'Tipo documento'))}</label>
            <select id="practiceAttachmentType" name="practiceAttachmentType">
              ${typeOptions.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('')}
            </select>
          </div>
          <div class="field full">
            <label for="practiceAttachmentInput">${escapeHtml(t('ui.attachmentUploadLabel', 'Importa file'))}</label>
            <input id="practiceAttachmentInput" type="file" multiple />
            <div class="field-hint">${escapeHtml(t('ui.attachmentUploadHint', 'PDF, immagini, fogli Excel o altri documenti. Per demo/staging evita file troppo pesanti.'))}</div>
          </div>
        </div>

        ${items.length ? `
          <div class="attachments-list">
            ${items.map((item) => `
              <article class="attachment-card" data-attachment-id="${escapeHtml(item.id)}">
                <div class="attachment-main">
                  <div class="attachment-file-name">${escapeHtml(item.fileName || '—')}</div>
                  <div class="attachment-file-meta">${escapeHtml(formatSize(item.size, locale))} · ${escapeHtml(formatImportedAt(item.importedAt, locale))}</div>
                </div>
                <div class="attachment-type-wrap">
                  <label class="attachment-inline-label" for="attachment_type_${escapeHtml(item.id)}">${escapeHtml(t('ui.attachmentTypeLabel', 'Tipo documento'))}</label>
                  <select id="attachment_type_${escapeHtml(item.id)}" data-attachment-type-id="${escapeHtml(item.id)}">
                    ${typeOptions.map((option) => `<option value="${escapeHtml(option.value)}" ${item.documentType === option.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
                  </select>
                </div>
                <div class="attachment-actions">
                  <button class="btn secondary small-btn" type="button" data-attachment-open="${escapeHtml(item.id)}">${escapeHtml(t('ui.openAttachment', 'Apri'))}</button>
                  <button class="btn secondary small-btn danger-btn" type="button" data-attachment-remove="${escapeHtml(item.id)}">${escapeHtml(t('ui.removeAttachment', 'Rimuovi'))}</button>
                </div>
              </article>
            `).join('')}
          </div>
        ` : `
          <div class="attachments-empty-state">
            <div class="empty-text">${escapeHtml(t('ui.attachmentsEmpty', 'Nessun allegato importato per questa pratica.'))}</div>
          </div>
        `}
      </section>
    `;
  }

  async function putAttachmentRecord(record) {
    await withStore('readwrite', (store) => new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Errore salvataggio allegato.'));
    }));
  }

  async function getAttachmentRecord(id) {
    return withStore('readonly', (store) => new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Errore lettura allegato.'));
    }));
  }

  async function deleteAttachmentRecord(id) {
    await withStore('readwrite', (store) => new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error || new Error('Errore rimozione allegato.'));
    }));
  }

  async function addFiles(options = {}) {
    const { state, draft, files, documentType = 'generic', save, toast, rerender } = options;
    const ownerKey = ensureDraftOwnerKey(draft);
    const index = normalizeAttachmentIndex(state);
    if (!Array.isArray(index[ownerKey])) index[ownerKey] = [];

    const incoming = Array.from(files || []).filter(Boolean);
    if (!incoming.length) return 0;

    for (const file of incoming) {
      const item = {
        id: createAttachmentId(),
        ownerKey,
        fileName: file.name || 'allegato',
        mimeType: file.type || 'application/octet-stream',
        size: Number(file.size || 0),
        documentType: String(documentType || 'generic'),
        importedAt: new Date().toISOString(),
        practiceId: String(draft.editingPracticeId || '').trim() || ''
      };
      await putAttachmentRecord({ ...item, blob: file });
      index[ownerKey].unshift(item);
    }

    syncLinkedPracticeRecordState(state, draft);
    if (typeof save === 'function') save();
    if (typeof rerender === 'function') rerender();
    if (typeof toast === 'function') {
      toast(incoming.length === 1 ? 'Allegato importato' : `${incoming.length} allegati importati`);
    }
    return incoming.length;
  }

  async function removeAttachment(options = {}) {
    const { state, draft, attachmentId, save, toast, rerender } = options;
    const ownerKey = ensureDraftOwnerKey(draft);
    await deleteAttachmentRecord(attachmentId);
    const index = normalizeAttachmentIndex(state);
    index[ownerKey] = (Array.isArray(index[ownerKey]) ? index[ownerKey] : []).filter((item) => item.id !== attachmentId);
    if (!index[ownerKey].length) delete index[ownerKey];
    syncLinkedPracticeRecordState(state, draft);
    if (typeof save === 'function') save();
    if (typeof rerender === 'function') rerender();
    if (typeof toast === 'function') toast('Allegato rimosso');
  }

  async function openAttachment(options = {}) {
    const { attachmentId, toast } = options;
    const record = await getAttachmentRecord(attachmentId);
    if (!record || !record.blob) {
      if (typeof toast === 'function') toast('Allegato non disponibile');
      return false;
    }
    const blobUrl = window.URL.createObjectURL(record.blob);
    const opened = window.open(blobUrl, '_blank', 'noopener');
    if (!opened) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = record.fileName || 'allegato';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
    return true;
  }

  function updateAttachmentType(options = {}) {
    const { state, draft, attachmentId, documentType, save, rerender, toast, i18n } = options;
    const ownerKey = ensureDraftOwnerKey(draft);
    const index = normalizeAttachmentIndex(state);
    const items = Array.isArray(index[ownerKey]) ? index[ownerKey] : [];
    const item = items.find((entry) => entry.id === attachmentId);
    if (!item) return false;
    item.documentType = String(documentType || 'generic');
    syncLinkedPracticeRecordState(state, draft);
    if (typeof save === 'function') save();
    if (typeof rerender === 'function') rerender();
    if (typeof toast === 'function') {
      const label = i18n && typeof i18n.t === 'function' ? i18n.t('ui.attachmentTypeUpdated', 'Tipo documento aggiornato') : 'Tipo documento aggiornato';
      toast(label);
    }
    return true;
  }

  function bind(options = {}) {
    const { state, draft, root, save, toast, rerender, feedback, i18n } = options;
    if (!root) return;
    const fileInput = root.querySelector('#practiceAttachmentInput');
    const typeSelect = root.querySelector('#practiceAttachmentType');

    fileInput?.addEventListener('change', async (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;
      try {
        await addFiles({
          state,
          draft,
          files,
          documentType: typeSelect?.value || 'generic',
          save,
          toast,
          rerender
        });
      } catch (error) {
        if (typeof toast === 'function') toast(error?.message || 'Errore import allegato');
      } finally {
        event.target.value = '';
      }
    });

    root.querySelectorAll('[data-attachment-open]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await openAttachment({ attachmentId: button.dataset.attachmentOpen, toast });
        } catch (error) {
          if (typeof toast === 'function') toast(error?.message || 'Errore apertura allegato');
        }
      });
    });

    root.querySelectorAll('[data-attachment-remove]').forEach((button) => {
      button.addEventListener('click', async () => {
        const confirmed = feedback && typeof feedback.confirm === 'function'
          ? await feedback.confirm({
              title: i18n && typeof i18n.t === 'function' ? i18n.t('ui.removeAttachmentConfirmTitle', 'Rimuovere allegato') : 'Rimuovere allegato',
              message: i18n && typeof i18n.t === 'function' ? i18n.t('ui.removeAttachmentConfirmMessage', 'L’allegato verrà scollegato dalla pratica corrente.') : 'L’allegato verrà scollegato dalla pratica corrente.',
              confirmLabel: i18n && typeof i18n.t === 'function' ? i18n.t('ui.removeAttachment', 'Rimuovi') : 'Rimuovi',
              cancelLabel: i18n && typeof i18n.t === 'function' ? i18n.t('ui.cancel', 'Annulla') : 'Annulla'
            })
          : window.confirm('Rimuovere questo allegato dalla pratica?');
        if (!confirmed) return;
        try {
          await removeAttachment({
            state,
            draft,
            attachmentId: button.dataset.attachmentRemove,
            save,
            toast,
            rerender
          });
        } catch (error) {
          if (typeof toast === 'function') toast(error?.message || 'Errore rimozione allegato');
        }
      });
    });

    root.querySelectorAll('[data-attachment-type-id]').forEach((select) => {
      select.addEventListener('change', () => {
        updateAttachmentType({
          state,
          draft,
          attachmentId: select.dataset.attachmentTypeId,
          documentType: select.value || 'generic',
          save,
          rerender,
          toast,
          i18n
        });
      });
    });
  }

  return {
    bind,
    createDraftOwnerKey,
    ensureDraftOwnerKey,
    getAttachments,
    getDocumentTypeOptions,
    normalizeAttachmentIndex,
    getAttachmentRecord,
    openAttachment,
    removeAttachment,
    renderPanelHTML,
    syncRecordSummary,
    updateAttachmentType
  };
})();
