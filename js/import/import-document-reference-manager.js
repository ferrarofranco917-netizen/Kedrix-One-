window.KedrixOneDocumentReferenceImportFoundation = (() => {
  'use strict';

  const CsvReader = window.KedrixOneImportCsvReader || null;
  const ExcelReader = window.KedrixOneImportExcelReader || null;
  const BaseMapper = window.KedrixOneImportMapper || null;
  const Mapper = window.KedrixOneImportDocumentReferenceMapper || null;
  const Validator = window.KedrixOneImportDocumentReferenceValidator || null;
  const Committer = window.KedrixOneImportDocumentReferenceCommit || null;

  const session = {
    headerRow: 1,
    fileMeta: null,
    sourceFormat: '',
    matrix: [],
    headers: [],
    rawRows: [],
    mapping: {},
    normalizedRows: [],
    validationRows: [],
    validationSummary: null,
    issues: [],
    statusTone: 'info',
    statusMessage: '',
    selectedSheet: '',
    sheetNames: [],
    currentFile: null,
    commitPlan: null,
    lastCommitSummary: null
  };

  function cleanText(value) {
    return String(value || '').trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function resetData() {
    session.fileMeta = null;
    session.sourceFormat = '';
    session.matrix = [];
    session.headers = [];
    session.rawRows = [];
    session.mapping = {};
    session.normalizedRows = [];
    session.validationRows = [];
    session.validationSummary = null;
    session.issues = [];
    session.statusTone = 'info';
    session.statusMessage = '';
    session.selectedSheet = '';
    session.sheetNames = [];
    session.currentFile = null;
    session.commitPlan = null;
  }

  function getSchema(state, i18n) {
    const base = Mapper && typeof Mapper.buildSchema === 'function' ? Mapper.buildSchema(i18n) : [];
    return Mapper && typeof Mapper.enrichSchema === 'function' ? Mapper.enrichSchema(base, state, i18n) : base;
  }

  function recompute(state, i18n) {
    const schema = getSchema(state, i18n);
    if (!session.matrix.length || !schema.length || !BaseMapper) {
      session.headers = [];
      session.rawRows = [];
      session.mapping = {};
      session.normalizedRows = [];
      session.validationRows = [];
      session.validationSummary = null;
      session.issues = [];
      session.commitPlan = null;
      return;
    }

    const rowsInfo = BaseMapper.buildRowsFromMatrix(session.matrix, session.headerRow);
    session.headers = rowsInfo.headers;
    session.rawRows = rowsInfo.rows;

    const suggested = BaseMapper.suggestMapping(session.headers, schema, i18n);
    const nextMapping = {};
    schema.forEach((field) => {
      const current = session.mapping[field.name];
      nextMapping[field.name] = session.headers.includes(current) ? current : (suggested[field.name] || '');
    });
    session.mapping = nextMapping;
    session.normalizedRows = BaseMapper.normalizeMappedRows(session.rawRows, schema, session.mapping);

    const validation = Validator && typeof Validator.validateRows === 'function'
      ? Validator.validateRows({ rows: session.normalizedRows, state, i18n })
      : { rows: session.normalizedRows, summary: null, issues: [] };

    session.validationRows = validation.rows || [];
    session.validationSummary = validation.summary || null;
    session.issues = validation.issues || [];
    session.commitPlan = Committer && typeof Committer.summarizePlannedCommit === 'function'
      ? Committer.summarizePlannedCommit({ state, rows: session.validationRows })
      : null;
  }

  async function handleIncomingFile(file, state, i18n) {
    if (!file) return;
    session.currentFile = file;
    const name = cleanText(file.name || '');
    const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    resetData();
    session.fileMeta = { name, size: Number(file.size || 0), extension, type: cleanText(file.type || '') };

    if (['csv', 'txt'].includes(extension)) {
      const parsed = CsvReader && typeof CsvReader.readCsvFile === 'function' ? await CsvReader.readCsvFile(file) : { ok: false };
      if (!parsed.ok) {
        session.statusTone = 'critical';
        session.statusMessage = t(i18n, 'ui.importCsvReadError', 'Impossibile leggere il file CSV caricato.');
        return;
      }
      session.sourceFormat = 'csv';
      session.matrix = parsed.matrix || [];
      session.statusTone = 'ready';
      session.statusMessage = t(i18n, 'ui.importDocRefCsvLoaded', 'CSV riferimenti documentali caricato: controlla mapping e validazioni prima del commit.');
      recompute(state, i18n);
      return;
    }

    if (['xlsx', 'xls', 'xlsm'].includes(extension)) {
      const parsed = ExcelReader && typeof ExcelReader.readWorkbook === 'function'
        ? await ExcelReader.readWorkbook(file, { sheetName: session.selectedSheet })
        : { ok: false, reason: 'excel-engine-missing' };
      if (!parsed.ok) {
        session.statusTone = 'attention';
        session.statusMessage = t(i18n, parsed.messageKey || 'ui.importExcelReadError', parsed.messageFallback || 'File Excel riconosciuto ma parser non disponibile in questa build.');
        return;
      }
      session.sourceFormat = parsed.sourceFormat || 'xlsx';
      session.matrix = parsed.matrix || [];
      session.selectedSheet = parsed.selectedSheet || '';
      session.sheetNames = Array.isArray(parsed.sheetNames) ? parsed.sheetNames.slice() : [];
      session.statusTone = 'ready';
      session.statusMessage = t(i18n, 'ui.importDocRefExcelLoaded', 'Foglio riferimenti documentali caricato: controlla mapping e validazioni prima del commit.');
      recompute(state, i18n);
      return;
    }

    session.statusTone = 'attention';
    session.statusMessage = t(i18n, 'ui.importUnsupportedFileType', 'Formato non supportato in questa foundation: usa CSV oppure esporta Excel in CSV.');
  }

  function handleHeaderRowChange(nextRow, state, i18n) {
    const numericValue = Number(nextRow || 1);
    session.headerRow = Number.isFinite(numericValue) && numericValue > 0 ? Math.round(numericValue) : 1;
    recompute(state, i18n);
  }

  async function handleSheetChange(sheetName, file, state, i18n) {
    session.selectedSheet = cleanText(sheetName);
    if (!file) return;
    await handleIncomingFile(file, state, i18n);
  }

  function handleMappingChange(fieldName, headerName, state, i18n) {
    session.mapping[fieldName] = cleanText(headerName);
    recompute(state, i18n);
  }

  function renderUploader(i18n) {
    const fileLabel = session.fileMeta?.name || t(i18n, 'ui.importNoFileSelected', 'Nessun file import selezionato');
    return `
      <div class="file-input-shell" data-file-shell>
        <input id="documentReferenceImportInput" class="visually-hidden" type="file" accept=".csv,.txt,.xlsx,.xls,.xlsm" />
        <button class="btn secondary" type="button" data-file-trigger="documentReferenceImportInput">${escapeHtml(t(i18n, 'ui.importChooseFile', 'Scegli file'))}</button>
        <span class="file-input-status" data-document-reference-import-file-status>${escapeHtml(fileLabel)}</span>
      </div>`;
  }

  function renderSummaryCards(i18n) {
    const summary = session.validationSummary || {};
    const cards = [
      { label: t(i18n, 'ui.importMappedFields', 'Campi mappati'), value: summary.mappedFields || 0 },
      { label: t(i18n, 'ui.importSourceColumns', 'Colonne sorgente lette'), value: session.headers.length || 0 },
      { label: t(i18n, 'ui.importPreviewRows', 'Righe analizzate'), value: summary.totalRows || 0 },
      { label: t(i18n, 'ui.importValidationState', 'Esito validazione'), value: `${summary.validRows || 0}/${summary.totalRows || 0}` }
    ];
    return `<div class="kpi-grid compact-kpi-grid import-foundation-kpis">${cards.map((card) => `<article class="kpi-card"><div class="kpi-label">${escapeHtml(card.label)}</div><div class="kpi-value">${escapeHtml(card.value)}</div></article>`).join('')}</div>`;
  }

  function renderMappingTable(state, i18n) {
    const schema = getSchema(state, i18n);
    if (!schema.length) return `<div class="empty-state">${escapeHtml(t(i18n, 'ui.importAwaitingPreview', 'Carica un file per attivare mapping, preview e validazioni.'))}</div>`;
    return `
      <table class="data-table import-mapping-table">
        <thead>
          <tr>
            <th>${escapeHtml(t(i18n, 'ui.importValueField', 'Valore'))}</th>
            <th>${escapeHtml(t(i18n, 'ui.importState', 'Stato'))}</th>
            <th>${escapeHtml(t(i18n, 'ui.importSourceColumns', 'Colonne sorgente lette'))}</th>
          </tr>
        </thead>
        <tbody>
          ${schema.map((field) => `
            <tr>
              <td>
                <strong>${escapeHtml(field.label || field.name)}</strong>
              </td>
              <td>${field.required ? `<span class="badge warning">${escapeHtml(t(i18n, 'ui.importRequiredBadge', 'Obbligatorio'))}</span>` : `<span class="badge">${escapeHtml(t(i18n, 'ui.importOptionalBadge', 'Opzionale'))}</span>`}</td>
              <td>
                <select data-document-reference-import-mapping-field="${escapeHtml(field.name)}">
                  <option value="">${escapeHtml(t(i18n, 'ui.importSkipColumn', 'Non mappare'))}</option>
                  ${session.headers.map((header) => `<option value="${escapeHtml(header)}" ${session.mapping[field.name] === header ? 'selected' : ''}>${escapeHtml(header)}</option>`).join('')}
                </select>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  function renderPreviewTable(i18n) {
    const rows = session.validationRows.slice(0, 8);
    if (!rows.length) return `<div class="empty-state">${escapeHtml(t(i18n, 'ui.importNoRowsPreview', 'Nessuna riga disponibile per la preview corrente.'))}</div>`;
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>${escapeHtml(t(i18n, 'ui.importRow', 'Riga'))}</th>
              <th>${escapeHtml(t(i18n, 'ui.importState', 'Stato'))}</th>
              <th>${escapeHtml(t(i18n, 'ui.importDocRefFieldPracticeReference', 'Practice reference'))}</th>
              <th>${escapeHtml(t(i18n, 'ui.importDocRefFieldDocumentType', 'Document type'))}</th>
              <th>${escapeHtml(t(i18n, 'ui.importDocRefFieldExternalReference', 'Document reference'))}</th>
              <th>MRN</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.rowNumber)}</td>
                <td><span class="badge ${row.tone === 'critical' ? 'warning' : row.tone === 'attention' ? 'info' : ''}">${escapeHtml(row.tone === 'critical' ? t(i18n, 'ui.importStateError', 'Errore') : row.tone === 'attention' ? t(i18n, 'ui.importStateWarning', 'Warning') : t(i18n, 'ui.importStateReady', 'Pronta'))}</span></td>
                <td>${escapeHtml(row.draft?.practiceReference || '—')}</td>
                <td>${escapeHtml(row.draft?.documentType || '—')}</td>
                <td>${escapeHtml(row.draft?.externalReference || row.draft?.documentLabel || '—')}</td>
                <td>${escapeHtml(row.draft?.customsMrn || '—')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderIssues(i18n) {
    if (!session.issues.length) return `<div class="empty-state">${escapeHtml(t(i18n, 'ui.importNoIssues', 'Nessuna criticità nei controlli base del campione importato.'))}</div>`;
    return `<div class="stack compact">${session.issues.map((issue) => `<div class="summary-alert ${issue.tone === 'critical' ? 'critical' : 'attention'}"><strong>${escapeHtml(t(i18n, 'ui.importRow', 'Riga'))} ${escapeHtml(issue.rowNumber)}</strong> · ${escapeHtml(issue.message)}</div>`).join('')}</div>`;
  }

  function renderCommitPlan(i18n) {
    if (!session.commitPlan) return `<div class="empty-state">${escapeHtml(t(i18n, 'ui.importAwaitingPreview', 'Carica un file per attivare mapping, preview e validazioni.'))}</div>`;
    const plan = session.commitPlan;
    const last = session.lastCommitSummary;
    const lastHtml = last ? `
      <div class="summary-card tone-ready" style="margin-top:12px;">
        <div class="summary-kicker">${escapeHtml(t(i18n, 'ui.importLastCommitBadge', 'Ultimo commit'))}</div>
        <div class="summary-title">${escapeHtml(t(i18n, 'ui.importDocRefCommitLastTitle', 'Import riferimenti documentali completato'))}</div>
        <div class="summary-meta-grid">
          <div><span>${escapeHtml(t(i18n, 'ui.importCreatedCount', 'Create'))}</span><strong>${escapeHtml(last.created || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importDuplicateCount', 'Duplicati'))}</span><strong>${escapeHtml(last.duplicates || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importSkippedRows', 'Righe bloccate'))}</span><strong>${escapeHtml(last.skippedErrors || 0)}</strong></div>
        </div>
      </div>` : '';
    return `
      <div class="summary-card tone-ready">
        <div class="summary-kicker">${escapeHtml(t(i18n, 'ui.importDocRefCommitEnabled', 'Commit riferimenti documentali attivo'))}</div>
        <div class="summary-title">${escapeHtml(t(i18n, 'ui.importDocRefCommitPlanTitle', 'Commit controllato riferimenti documentali'))}</div>
        <p class="summary-description">${escapeHtml(t(i18n, 'ui.importDocRefCommitPlanDetail', 'In questo step il commit crea metadati documentali collegati alle pratiche esistenti, salta errori e blocca i duplicati già presenti.'))}</p>
        <div class="summary-meta-grid">
          <div><span>${escapeHtml(t(i18n, 'ui.importDocRefCreatableRows', 'Nuovi riferimenti'))}</span><strong>${escapeHtml(plan.creatableRows || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importDuplicateExistingRows', 'Già presenti'))}</span><strong>${escapeHtml(plan.duplicateRows || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importWarningRows', 'Con warning'))}</span><strong>${escapeHtml(plan.warningRows || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importBlockedRows', 'Bloccate da errori'))}</span><strong>${escapeHtml(plan.blockedRows || 0)}</strong></div>
        </div>
        <div class="field-hint">${escapeHtml(t(i18n, 'ui.importDocRefCommitRulesHint', 'Il commit importa solo riferimenti documentali senza errori. Le righe con warning vengono create comunque, mentre i duplicati già presenti vengono saltati.'))}</div>
        ${lastHtml}
      </div>`;
  }

  function renderPanel({ state, i18n }) {
    if (session.validationRows.length && Committer && typeof Committer.summarizePlannedCommit === 'function') {
      session.commitPlan = Committer.summarizePlannedCommit({ state, rows: session.validationRows });
    }
    const statusClass = session.statusTone === 'critical' ? 'danger' : (session.statusTone === 'attention' ? 'attention' : (session.statusTone === 'ready' ? 'success' : 'info'));
    const sheetField = session.sheetNames.length > 1 ? `
      <div class="field">
        <label for="documentReferenceImportSheetSelect">${escapeHtml(t(i18n, 'ui.importSheet', 'Foglio'))}</label>
        <select id="documentReferenceImportSheetSelect">
          ${session.sheetNames.map((sheetName) => `<option value="${escapeHtml(sheetName)}" ${session.selectedSheet === sheetName ? 'selected' : ''}>${escapeHtml(sheetName)}</option>`).join('')}
        </select>
      </div>` : '';

    return `
      <section class="panel import-foundation-panel document-reference-import-panel">
        <div class="panel-head compact">
          <div>
            <div class="summary-kicker">${escapeHtml(t(i18n, 'ui.importDocRefKicker', 'Import riferimenti documentali'))}</div>
            <h3 class="panel-title">${escapeHtml(t(i18n, 'ui.importDocRefTitle', 'Import riferimenti documentali — CSV / Excel'))}</h3>
            <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.importDocRefDetail', 'Importa riferimenti e metadata documentali collegandoli alle pratiche esistenti, senza richiedere ancora il file binario allegato.'))}</p>
          </div>
          <div class="attachments-meta-pills">
            <span class="helper-pill">${escapeHtml(session.sourceFormat ? session.sourceFormat.toUpperCase() : t(i18n, 'ui.importNoFormat', 'Nessun file'))}</span>
            <span class="helper-pill">${escapeHtml(t(i18n, 'ui.importDocRefCommitEnabled', 'Commit riferimenti documentali attivo'))}</span>
          </div>
        </div>

        <div class="form-grid two import-foundation-config-grid">
          <div class="field">
            <label for="documentReferenceImportHeaderRow">${escapeHtml(t(i18n, 'ui.importHeaderRow', 'Riga intestazioni'))}</label>
            <input id="documentReferenceImportHeaderRow" type="number" min="1" step="1" value="${escapeHtml(session.headerRow || 1)}" />
          </div>
          <div class="field full">
            <label for="documentReferenceImportInput">${escapeHtml(t(i18n, 'ui.importUploadLabel', 'File di migrazione'))}</label>
            ${renderUploader(i18n)}
            <div class="field-hint">${escapeHtml(t(i18n, 'ui.importDocRefUploadHint', 'CSV attivo per preview e commit dei metadata documentali. Excel viene riconosciuto e instradato al parser dedicato quando disponibile nella build.'))}</div>
          </div>
          ${sheetField}
        </div>

        ${session.statusMessage ? `<div class="import-status-bar ${statusClass}">${escapeHtml(session.statusMessage)}</div>` : ''}
        ${renderSummaryCards(i18n)}

        <section class="master-data-shell two-col import-foundation-shell">
          <article class="panel">
            <div class="panel-head compact">
              <div>
                <h4 class="panel-title">${escapeHtml(t(i18n, 'ui.importMappingTitle', 'Mapping colonne → Kedrix'))}</h4>
                <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.importDocRefMappingDetail', 'Mappa le colonne sorgente ai campi documentali e ai riferimenti pratica necessari per il collegamento.'))}</p>
              </div>
            </div>
            ${renderMappingTable(state, i18n)}
          </article>

          <article class="panel">
            <div class="panel-head compact">
              <div>
                <h4 class="panel-title">${escapeHtml(t(i18n, 'ui.importPreviewTitle', 'Preview e controlli'))}</h4>
                <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.importDocRefPreviewDetail', 'Controlla collegamento pratica, tipo documento e riferimenti chiave prima del commit.'))}</p>
              </div>
            </div>
            ${renderPreviewTable(i18n)}
            <div class="import-issues-block">
              <h5 class="panel-title" style="font-size:14px">${escapeHtml(t(i18n, 'ui.importIssuesTitle', 'Issue report'))}</h5>
              ${renderIssues(i18n)}
            </div>
            <div class="import-issues-block">${renderCommitPlan(i18n)}</div>
          </article>
        </section>

        <div class="form-actions import-foundation-actions">
          <button class="btn secondary" type="button" id="documentReferenceImportResetButton">${escapeHtml(t(i18n, 'ui.importResetSession', 'Reset sessione import'))}</button>
          <button class="btn" type="button" id="documentReferenceImportCommitButton" ${!(session.commitPlan && (session.commitPlan.creatableRows || session.commitPlan.warningRows || session.commitPlan.duplicateRows)) ? 'disabled' : ''}>${escapeHtml(t(i18n, 'ui.importDocRefCommitAction', 'Importa riferimenti documentali validi'))}</button>
        </div>
      </section>`;
  }

  function bind({ state, root, save, render, toast, i18n }) {
    const fileInput = root.querySelector('#documentReferenceImportInput');
    const fileTrigger = root.querySelector('[data-file-trigger="documentReferenceImportInput"]');
    const fileStatus = root.querySelector('[data-document-reference-import-file-status]');
    const headerInput = root.querySelector('#documentReferenceImportHeaderRow');
    const sheetSelect = root.querySelector('#documentReferenceImportSheetSelect');
    const resetButton = root.querySelector('#documentReferenceImportResetButton');
    const commitButton = root.querySelector('#documentReferenceImportCommitButton');

    if (!headerInput) return;

    fileTrigger?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
      if (!file) return;
      if (fileStatus) fileStatus.textContent = file.name || '';
      await handleIncomingFile(file, state, i18n);
      render();
      if (session.statusTone === 'critical' || session.statusTone === 'attention') toast(session.statusMessage || t(i18n, 'ui.importFileHandledWithNotes', 'File gestito con note da verificare.'), session.statusTone === 'critical' ? 'warning' : 'info');
      else toast(t(i18n, 'ui.importDocRefPreviewReadyToast', 'Preview riferimenti documentali pronta: controlla mapping, collegamenti e validazioni.'), 'success');
    });

    headerInput?.addEventListener('change', (event) => {
      handleHeaderRowChange(event.target.value || 1, state, i18n);
      render();
    });

    sheetSelect?.addEventListener('change', async (event) => {
      await handleSheetChange(event.target.value || '', session.currentFile, state, i18n);
      render();
    });

    root.querySelectorAll('[data-document-reference-import-mapping-field]').forEach((select) => {
      select.addEventListener('change', (event) => {
        handleMappingChange(select.dataset.documentReferenceImportMappingField || '', event.target.value || '', state, i18n);
        render();
      });
    });

    resetButton?.addEventListener('click', () => {
      resetData();
      session.headerRow = 1;
      if (fileInput) fileInput.value = '';
      render();
      toast(t(i18n, 'ui.importSessionResetToast', 'Sessione import azzerata.'), 'info');
    });

    commitButton?.addEventListener('click', () => {
      if (!Committer || typeof Committer.commitRows !== 'function') return;
      const summary = Committer.commitRows({ state, rows: session.validationRows });
      session.lastCommitSummary = summary;
      session.commitPlan = Committer.summarizePlannedCommit({ state, rows: session.validationRows });
      save && save();
      const tone = summary.created ? 'success' : (summary.duplicates ? 'info' : 'warning');
      const message = `${t(i18n, 'ui.importCommitToastLead', 'Commit completato')}: ${summary.created} ${t(i18n, 'ui.importDocRefCreatedCountLower', 'riferimenti creati')}, ${summary.duplicates} ${t(i18n, 'ui.importDuplicateCountLower', 'duplicate')}, ${summary.skippedErrors} ${t(i18n, 'ui.importSkippedRowsLower', 'bloccate')}.`;
      session.statusTone = tone === 'success' ? 'ready' : (tone === 'warning' ? 'attention' : 'info');
      session.statusMessage = message;
      render();
      toast(message, tone);
    });
  }

  return {
    renderPanel,
    bind
  };
})();
