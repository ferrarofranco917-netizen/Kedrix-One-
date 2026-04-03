window.KedrixOnePracticeAttachments = (() => {
  'use strict';

  const DB_NAME = 'kedrix-one-practice-attachments';
  const DocumentCategories = window.KedrixOneDocumentCategories;
  const DocumentMetadata = window.KedrixOneDocumentMetadata;
  const I18N = window.KedrixOneI18N;
  const DB_VERSION = 1;
  const STORE_NAME = 'attachments';

  function tGlobal(key, fallback) {
    return I18N && typeof I18N.t === 'function' ? I18N.t(key, fallback) : fallback;
  }


  function isEnglish(i18n) {
    return !!(i18n && typeof i18n.getLanguage === 'function' && i18n.getLanguage() === 'en');
  }

  function fallbackByLanguage(i18n, itText, enText) {
    return isEnglish(i18n) ? enText : itText;
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error(tGlobal('ui.attachmentIndexedDbUnavailable', fallbackByLanguage(I18N, 'IndexedDB non disponibile in questo browser.', 'IndexedDB is not available in this browser.'))));
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error || new Error(tGlobal('ui.attachmentStoreOpenError', fallbackByLanguage(I18N, 'Errore apertura archivio allegati.', 'Unable to open the attachment archive.'))));
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
      tx.onerror = () => reject(tx.error || new Error(tGlobal('ui.attachmentStoreError', fallbackByLanguage(I18N, 'Errore archivio allegati.', 'Attachment archive error.'))));
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
      { value: 'generic', label: t('ui.attachmentTypeGeneric', fallbackByLanguage(context.i18n, 'Allegato operativo', 'Operational attachment')) },
      { value: 'clientInstructions', label: t('ui.attachmentTypeClientInstructions', fallbackByLanguage(context.i18n, 'Istruzioni cliente', 'Client instructions')) },
      { value: 'invoice', label: t('ui.attachmentTypeInvoice', 'Invoice') },
      { value: 'packingList', label: t('ui.attachmentTypePackingList', 'Packing list') },
      { value: 'signedMandate', label: t('ui.attachmentTypeSignedMandate', fallbackByLanguage(context.i18n, 'Mandato firmato', 'Signed mandate')) },
      { value: 'booking', label: t('ui.attachmentTypeBooking', 'Booking') },
      { value: 'policy', label: t('ui.attachmentTypePolicy', fallbackByLanguage(context.i18n, 'Polizza / BL / AWB', 'Policy / BL / AWB')) },
      { value: 'customsDocs', label: t('ui.attachmentTypeCustomsDocs', fallbackByLanguage(context.i18n, 'Documenti doganali', 'Customs documents')) },
      { value: 'other', label: t('ui.attachmentTypeOther', fallbackByLanguage(context.i18n, 'Altro', 'Other')) }
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

  function normalizeItem(item) {
    return DocumentMetadata && typeof DocumentMetadata.ensure === 'function'
      ? DocumentMetadata.ensure(item || {})
      : { ...item, documentDate: String(item?.documentDate || '').trim(), externalReference: String(item?.externalReference || '').trim(), customsMrn: String(item?.customsMrn || '').trim(), tags: Array.isArray(item?.tags) ? item.tags : [], notes: String(item?.notes || '').trim() };
  }

  function getAttachments(state, draft, practice = null) {
    const ownerKey = getOwnerKey(draft, practice);
    if (!ownerKey) return [];
    const index = normalizeAttachmentIndex(state);
    const items = Array.isArray(index[ownerKey]) ? index[ownerKey].map((item) => normalizeItem(item)) : [];
    index[ownerKey] = items;
    return [...items].sort((a, b) => String(b.importedAt || '').localeCompare(String(a.importedAt || '')));
  }

  function syncRecordSummary(state, practice) {
    if (!practice || typeof practice !== 'object') return practice;
    const ownerKey = String(practice.attachmentOwnerKey || practice.id || '').trim();
    const items = ownerKey && state?.practiceAttachmentIndex && Array.isArray(state.practiceAttachmentIndex[ownerKey])
      ? state.practiceAttachmentIndex[ownerKey].map((item) => normalizeItem(item))
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

  function renderMetadataSummary(item, i18n, escapeHtml) {
    const summary = DocumentMetadata && typeof DocumentMetadata.buildSummary === 'function'
      ? DocumentMetadata.buildSummary(item, i18n)
      : [];
    if (!summary.length) return '';
    const safe = typeof escapeHtml === 'function' ? escapeHtml : (value) => String(value || '');
    return `<div class="attachment-metadata-summary">${summary.map((entry) => `<span class="match-chip"><strong>${safe(entry.label)}:</strong> ${safe(entry.value)}</span>`).join('')}</div>`;
  }


  function buildCustomUploaderLabels(i18n) {
    return {
      button: tGlobal('ui.attachmentChooseFiles', fallbackByLanguage(i18n, 'Scegli file', 'Choose files')),
      empty: tGlobal('ui.attachmentNoFileSelected', fallbackByLanguage(i18n, 'Nessun file selezionato', 'No file selected')),
      single: tGlobal('ui.attachmentFileSelectedSingle', fallbackByLanguage(i18n, 'File selezionato: {{name}}', 'Selected file: {{name}}')),
      many: tGlobal('ui.attachmentFilesSelectedMany', fallbackByLanguage(i18n, '{{count}} file selezionati', '{{count}} files selected'))
    };
  }

  function renderCustomUploader(i18n, escapeHtml) {
    const labels = buildCustomUploaderLabels(i18n);
    return `
      <div class="custom-file-uploader" data-custom-file-uploader>
        <input id="practiceAttachmentInput" class="custom-file-input" type="file" multiple />
        <button class="btn secondary custom-file-trigger" type="button" data-file-trigger="practiceAttachmentInput">${escapeHtml(labels.button)}</button>
        <div
          class="custom-file-status"
          data-file-status
          aria-live="polite"
          data-empty-label="${escapeHtml(labels.empty)}"
          data-single-template="${escapeHtml(labels.single)}"
          data-many-template="${escapeHtml(labels.many)}"
        >${escapeHtml(labels.empty)}</div>
      </div>
    `;
  }

  function updateCustomUploaderStatus(root, files) {
    if (!root) return;
    const status = root.querySelector('[data-file-status]');
    if (!status) return;

    const incoming = Array.from(files || []).filter(Boolean);
    const emptyLabel = status.dataset.emptyLabel || 'No file selected';
    const singleTemplate = status.dataset.singleTemplate || 'Selected file: {{name}}';
    const manyTemplate = status.dataset.manyTemplate || '{{count}} files selected';

    if (!incoming.length) {
      status.textContent = emptyLabel;
      return;
    }

    if (incoming.length === 1) {
      status.textContent = singleTemplate.replace('{{name}}', String(incoming[0].name || ''));
      return;
    }

    status.textContent = manyTemplate.replace('{{count}}', String(incoming.length));
  }

  function renderPanelHTML(options = {}) {
    const { state, draft, i18n, utils } = options;
    const t = (key, fallback) => (i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback);
    const escapeHtml = (value) => (utils && typeof utils.escapeHtml === 'function' ? utils.escapeHtml(value) : String(value || ''));
    if (!draft?.practiceType) {
      return `<div class="empty-text">${escapeHtml(t('ui.attachmentsTypeGuard', fallbackByLanguage(i18n, 'Seleziona prima il tipo pratica per attivare l’area allegati.', 'Select the practice type first to enable the attachments area.')))}</div>`;
    }

    const items = getAttachments(state, draft);
    const typeOptions = getDocumentTypeOptions(state, i18n);
    const locale = typeof i18n?.getLanguage === 'function' && i18n.getLanguage() === 'en' ? 'en-GB' : 'it-IT';
    const ownerKey = ensureDraftOwnerKey(draft);
    const countLabel = items.length === 1 ? t('ui.attachmentCountOne', fallbackByLanguage(i18n, '1 allegato', '1 attachment')) : t('ui.attachmentCountMany', fallbackByLanguage(i18n, '{{count}} allegati', '{{count}} attachments')).replace('{{count}}', String(items.length));

    return `
      <section class="attachments-panel" data-attachments-owner-key="${escapeHtml(ownerKey)}">
        <div class="attachments-toolbar">
          <div>
            <h4 class="attachments-title">${escapeHtml(t('ui.attachmentsPanelTitle', fallbackByLanguage(i18n, 'Allegati pratica', 'Practice attachments')))}</h4>
            <p class="attachments-subtitle">${escapeHtml(t('ui.attachmentsPanelSubtitle', fallbackByLanguage(i18n, 'Importa documenti operativi nella pratica, tieni il tipo documento visibile e apri o rimuovi gli allegati in modo controllato.', 'Import operational documents into the practice, keep the document type visible and open or remove attachments in a controlled way.')))}</p>
          </div>
          <div class="attachments-meta-pills">
            <span class="helper-pill">${escapeHtml(countLabel)}</span>
            <span class="helper-pill">${escapeHtml(t('ui.attachmentsStorageHint', fallbackByLanguage(i18n, 'Archivio browser locale (demo/staging)', 'Local browser archive (demo/staging)')))}</span>
          </div>
        </div>

        <div class="attachments-upload-row">
          <div class="field">
            <label for="practiceAttachmentType">${escapeHtml(t('ui.attachmentTypeLabel', fallbackByLanguage(i18n, 'Tipo documento', 'Document type')))}</label>
            <select id="practiceAttachmentType" name="practiceAttachmentType">
              ${typeOptions.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('')}
            </select>
          </div>
          <div class="field full">
            <label for="practiceAttachmentInput">${escapeHtml(t('ui.attachmentUploadLabel', fallbackByLanguage(i18n, 'Importa file', 'Import file')))}</label>
            ${renderCustomUploader(i18n, escapeHtml)}
            <div class="field-hint">${escapeHtml(t('ui.attachmentUploadHint', fallbackByLanguage(i18n, 'PDF, immagini, fogli Excel o altri documenti. Per demo/staging evita file troppo pesanti.', 'PDFs, images, Excel sheets or other documents. For demo/staging, avoid very large files.')))}</div>
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
                  <label class="attachment-inline-label" for="attachment_type_${escapeHtml(item.id)}">${escapeHtml(t('ui.attachmentTypeLabel', fallbackByLanguage(i18n, 'Tipo documento', 'Document type')))}</label>
                  <select id="attachment_type_${escapeHtml(item.id)}" data-attachment-type-id="${escapeHtml(item.id)}">
                    ${typeOptions.map((option) => `<option value="${escapeHtml(option.value)}" ${item.documentType === option.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
                  </select>
                </div>
                ${renderMetadataSummary(item, i18n, escapeHtml)}
                <div class="attachment-metadata-grid">
                  <div class="field">
                    <label for="attachment_date_${escapeHtml(item.id)}">${escapeHtml(t('ui.documentDate', fallbackByLanguage(i18n, 'Data documento', 'Document date')))}</label>
                    <input id="attachment_date_${escapeHtml(item.id)}" type="date" value="${escapeHtml(item.documentDate || '')}" data-attachment-meta-id="${escapeHtml(item.id)}" data-attachment-meta-field="documentDate" />
                  </div>
                  <div class="field">
                    <label for="attachment_ref_${escapeHtml(item.id)}">${escapeHtml(t('ui.documentReference', fallbackByLanguage(i18n, 'Rif. documento', 'Document reference')))}</label>
                    <input id="attachment_ref_${escapeHtml(item.id)}" type="text" value="${escapeHtml(item.externalReference || '')}" placeholder="${escapeHtml(t('ui.documentReferencePlaceholder', fallbackByLanguage(i18n, 'Numero invoice, packing list, riferimento cliente...', 'Invoice number, packing list, client reference...')))}" data-attachment-meta-id="${escapeHtml(item.id)}" data-attachment-meta-field="externalReference" />
                  </div>
                  <div class="field">
                    <label for="attachment_mrn_${escapeHtml(item.id)}">${escapeHtml(t('ui.customsMrn', fallbackByLanguage(i18n, 'MRN / Rif. doganale', 'MRN / Customs reference')))}</label>
                    <input id="attachment_mrn_${escapeHtml(item.id)}" type="text" value="${escapeHtml(item.customsMrn || '')}" placeholder="${escapeHtml(t('ui.customsMrnPlaceholder', fallbackByLanguage(i18n, 'MRN, svincolo, rif. ufficio...', 'MRN, customs release, office reference...')))}" data-attachment-meta-id="${escapeHtml(item.id)}" data-attachment-meta-field="customsMrn" />
                  </div>
                  <div class="field full">
                    <label for="attachment_tags_${escapeHtml(item.id)}">${escapeHtml(t('ui.tags', 'Tags'))}</label>
                    <input id="attachment_tags_${escapeHtml(item.id)}" type="text" value="${escapeHtml(DocumentMetadata && typeof DocumentMetadata.serializeTags === 'function' ? DocumentMetadata.serializeTags(item.tags) : (Array.isArray(item.tags) ? item.tags.join(', ') : ''))}" placeholder="${escapeHtml(t('ui.attachmentTagsPlaceholder', fallbackByLanguage(i18n, 'dogana, scanner, originale, urgente...', 'customs, scanner, original, urgent...')))}" data-attachment-meta-id="${escapeHtml(item.id)}" data-attachment-meta-field="tags" />
                  </div>
                  <div class="field full">
                    <label for="attachment_notes_${escapeHtml(item.id)}">${escapeHtml(t('ui.notes', 'Note'))}</label>
                    <textarea id="attachment_notes_${escapeHtml(item.id)}" rows="2" placeholder="${escapeHtml(t('ui.attachmentNotesPlaceholder', fallbackByLanguage(i18n, 'Note operative sul documento, esito, originali, osservazioni...', 'Operational notes on the document, outcome, originals, remarks...')))}" data-attachment-meta-id="${escapeHtml(item.id)}" data-attachment-meta-field="notes">${escapeHtml(item.notes || '')}</textarea>
                  </div>
                </div>
                <div class="attachment-actions">
                  <button class="btn secondary small-btn" type="button" data-attachment-open="${escapeHtml(item.id)}">${escapeHtml(t('ui.openAttachment', fallbackByLanguage(i18n, 'Apri', 'Open')))}</button>
                  <button class="btn secondary small-btn danger-btn" type="button" data-attachment-remove="${escapeHtml(item.id)}">${escapeHtml(t('ui.removeAttachment', fallbackByLanguage(i18n, 'Rimuovi', 'Remove')))}</button>
                </div>
              </article>
            `).join('')}
          </div>
        ` : `
          <div class="attachments-empty-state">
            <div class="empty-text">${escapeHtml(t('ui.attachmentsEmpty', fallbackByLanguage(i18n, 'Nessun allegato importato per questa pratica.', 'No attachments imported for this practice.')))}</div>
          </div>
        `}
      </section>
    `;
  }

  async function putAttachmentRecord(record) {
    await withStore('readwrite', (store) => new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error(tGlobal('ui.attachmentSaveError', 'Unable to save the attachment.')));
    }));
  }

  async function getAttachmentRecord(id) {
    return withStore('readonly', (store) => new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error(tGlobal('ui.attachmentReadError', 'Unable to read the attachment.')));
    }));
  }

  async function deleteAttachmentRecord(id) {
    await withStore('readwrite', (store) => new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error || new Error(tGlobal('ui.attachmentDeleteError', 'Unable to remove the attachment.')));
    }));
  }

  async function syncAttachmentRecordMetadata(item) {
    if (!item || !item.id) return false;
    return withStore('readwrite', (store) => new Promise((resolve, reject) => {
      const readRequest = store.get(item.id);
      readRequest.onerror = () => reject(readRequest.error || new Error('Errore lettura allegato.'));
      readRequest.onsuccess = () => {
        const current = readRequest.result;
        if (!current) {
          resolve(false);
          return;
        }
        const next = { ...current, ...normalizeItem(item) };
        const putRequest = store.put(next);
        putRequest.onerror = () => reject(putRequest.error || new Error(tGlobal('ui.attachmentUpdateError', 'Unable to update the attachment.')));
        putRequest.onsuccess = () => resolve(true);
      };
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
        fileName: file.name || tGlobal('ui.attachmentDefaultFilename', 'attachment'),
        mimeType: file.type || 'application/octet-stream',
        size: Number(file.size || 0),
        documentType: String(documentType || 'generic'),
        importedAt: new Date().toISOString(),
        practiceId: String(draft.editingPracticeId || '').trim() || '',
        documentDate: '',
        externalReference: '',
        customsMrn: '',
        tags: [],
        notes: ''
      };
      await putAttachmentRecord({ ...item, blob: file });
      index[ownerKey].unshift(item);
    }

    syncLinkedPracticeRecordState(state, draft);
    if (typeof save === 'function') save();
    if (typeof rerender === 'function') rerender();
    if (typeof toast === 'function') {
      toast(incoming.length === 1 ? tGlobal('ui.attachmentImportedSingle', 'Attachment imported') : tGlobal('ui.attachmentImportedMany', '{{count}} attachments imported').replace('{{count}}', String(incoming.length)), 'success');
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
    if (typeof toast === 'function') toast(tGlobal('ui.attachmentRemoved', 'Attachment removed'), 'success');
  }

  async function openAttachment(options = {}) {
    const { attachmentId, toast } = options;
    const record = await getAttachmentRecord(attachmentId);
    if (!record || !record.blob) {
      if (typeof toast === 'function') toast(tGlobal('ui.attachmentUnavailable', 'Attachment unavailable'), 'warning');
      return false;
    }
    const blobUrl = window.URL.createObjectURL(record.blob);
    const opened = window.open(blobUrl, '_blank', 'noopener');
    if (!opened) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = record.fileName || tGlobal('ui.attachmentDefaultFilename', 'attachment');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
    return true;
  }

  async function updateAttachmentType(options = {}) {
    const { state, draft, attachmentId, documentType, save, rerender, toast, i18n } = options;
    const ownerKey = ensureDraftOwnerKey(draft);
    const index = normalizeAttachmentIndex(state);
    const items = Array.isArray(index[ownerKey]) ? index[ownerKey] : [];
    const item = items.find((entry) => entry.id === attachmentId);
    if (!item) return false;
    item.documentType = String(documentType || 'generic');
    await syncAttachmentRecordMetadata(item);
    syncLinkedPracticeRecordState(state, draft);
    if (typeof save === 'function') save();
    if (typeof rerender === 'function') rerender();
    if (typeof toast === 'function') {
      const label = i18n && typeof i18n.t === 'function' ? i18n.t('ui.attachmentTypeUpdated', fallbackByLanguage(i18n, fallbackByLanguage(i18n, 'Tipo documento aggiornato', 'Document type updated'), 'Document type updated')) : fallbackByLanguage(i18n, 'Tipo documento aggiornato', 'Document type updated');
      toast(label, 'success');
    }
    return true;
  }

  async function updateAttachmentMetadata(options = {}) {
    const { state, draft, attachmentId, field, value, save, rerender, toast, i18n } = options;
    const ownerKey = ensureDraftOwnerKey(draft);
    const index = normalizeAttachmentIndex(state);
    const items = Array.isArray(index[ownerKey]) ? index[ownerKey] : [];
    const item = items.find((entry) => entry.id === attachmentId);
    if (!item || !field) return false;

    const next = DocumentMetadata && typeof DocumentMetadata.applyPatch === 'function'
      ? DocumentMetadata.applyPatch(item, { [field]: value })
      : { ...item, [field]: value };

    const unchanged = JSON.stringify({
      documentDate: item.documentDate || '',
      externalReference: item.externalReference || '',
      customsMrn: item.customsMrn || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
      notes: item.notes || ''
    }) === JSON.stringify({
      documentDate: next.documentDate || '',
      externalReference: next.externalReference || '',
      customsMrn: next.customsMrn || '',
      tags: Array.isArray(next.tags) ? next.tags : [],
      notes: next.notes || ''
    });

    if (unchanged) return false;

    Object.assign(item, next);
    await syncAttachmentRecordMetadata(item);
    syncLinkedPracticeRecordState(state, draft);
    if (typeof save === 'function') save();
    if (typeof rerender === 'function') rerender();
    if (typeof toast === 'function') {
      const label = i18n && typeof i18n.t === 'function' ? i18n.t('ui.attachmentMetadataUpdated', fallbackByLanguage(i18n, fallbackByLanguage(i18n, 'Metadati documento aggiornati', 'Document metadata updated'), 'Document metadata updated')) : fallbackByLanguage(i18n, 'Metadati documento aggiornati', 'Document metadata updated');
      toast(label, 'success');
    }
    return true;
  }

  function bind(options = {}) {
    const { state, draft, root, save, toast, rerender, feedback, i18n } = options;
    if (!root) return;
    const fileInput = root.querySelector('#practiceAttachmentInput');
    const typeSelect = root.querySelector('#practiceAttachmentType');
    const uploaderRoot = root.querySelector('[data-custom-file-uploader]');
    const fileTrigger = root.querySelector('[data-file-trigger]');

    fileTrigger?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async (event) => {
      const files = Array.from(event.target.files || []);
      updateCustomUploaderStatus(uploaderRoot, files);
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
        if (typeof toast === 'function') toast(error?.message || tGlobal('ui.attachmentImportError', 'Unable to import the attachment'), 'warning');
      } finally {
        event.target.value = '';
        updateCustomUploaderStatus(uploaderRoot, []);
      }
    });

    root.querySelectorAll('[data-attachment-open]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await openAttachment({ attachmentId: button.dataset.attachmentOpen, toast });
        } catch (error) {
          if (typeof toast === 'function') toast(error?.message || tGlobal('ui.attachmentOpenError', 'Unable to open the attachment'), 'warning');
        }
      });
    });

    root.querySelectorAll('[data-attachment-remove]').forEach((button) => {
      button.addEventListener('click', async () => {
        const confirmed = feedback && typeof feedback.confirm === 'function'
          ? await feedback.confirm({
              title: i18n && typeof i18n.t === 'function' ? i18n.t('ui.removeAttachmentConfirmTitle', 'Rimuovere allegato') : 'Rimuovere allegato',
              message: i18n && typeof i18n.t === 'function' ? i18n.t('ui.removeAttachmentConfirmMessage', fallbackByLanguage(i18n, fallbackByLanguage(i18n, 'L’allegato verrà scollegato dalla pratica corrente.', 'The attachment will be unlinked from the current practice.'), 'The attachment will be unlinked from the current practice.')) : fallbackByLanguage(i18n, 'L’allegato verrà scollegato dalla pratica corrente.', 'The attachment will be unlinked from the current practice.'),
              confirmLabel: i18n && typeof i18n.t === 'function' ? i18n.t('ui.removeAttachment', fallbackByLanguage(i18n, 'Rimuovi', 'Remove')) : 'Rimuovi',
              cancelLabel: i18n && typeof i18n.t === 'function' ? i18n.t('ui.cancel', 'Annulla') : 'Annulla'
            })
          : window.confirm(i18n && typeof i18n.t === 'function' ? i18n.t('ui.removeAttachmentConfirmFallback', 'Remove this attachment from the current practice?') : 'Remove this attachment from the current practice?');
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
          if (typeof toast === 'function') toast(error?.message || tGlobal('ui.attachmentRemoveError', 'Unable to remove the attachment'), 'warning');
        }
      });
    });

    root.querySelectorAll('[data-attachment-type-id]').forEach((select) => {
      select.addEventListener('change', async () => {
        await updateAttachmentType({
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

    root.querySelectorAll('[data-attachment-meta-id]').forEach((input) => {
      const handler = async () => {
        await updateAttachmentMetadata({
          state,
          draft,
          attachmentId: input.dataset.attachmentMetaId,
          field: input.dataset.attachmentMetaField,
          value: input.value || '',
          save,
          rerender,
          toast,
          i18n
        });
      };

      if (input.tagName === 'INPUT' && input.type === 'date') input.addEventListener('change', handler);
      else input.addEventListener('blur', handler);
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
    updateAttachmentMetadata,
    updateAttachmentType
  };
})();
