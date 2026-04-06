window.KedrixOneImportFoundation = (() => {
  'use strict';

  const CsvReader = window.KedrixOneImportCsvReader || null;
  const ExcelReader = window.KedrixOneImportExcelReader || null;
  const Mapper = window.KedrixOneImportMapper || null;
  const Validator = window.KedrixOneImportValidator || null;
  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;

  const session = {
    targetEntity: '',
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
    sourceDelimiter: '',
    selectedSheet: '',
    sheetNames: [],
    currentFile: null
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

  function ensureTarget(i18n, preferred = '') {
    const options = Mapper && typeof Mapper.getTargetOptions === 'function' ? Mapper.getTargetOptions(i18n) : [];
    const fallback = options[0]?.key || 'client';
    if (preferred && options.some((item) => item.key === preferred)) session.targetEntity = preferred;
    if (!session.targetEntity || !options.some((item) => item.key === session.targetEntity)) {
      session.targetEntity = preferred && options.some((item) => item.key === preferred) ? preferred : fallback;
    }
    return options;
  }

  function getSchema(i18n) {
    return Mapper && typeof Mapper.buildSchema === 'function'
      ? Mapper.buildSchema(session.targetEntity, i18n)
      : [];
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
    session.sourceDelimiter = '';
    session.selectedSheet = '';
    session.sheetNames = [];
    session.currentFile = null;
  }

  function resetAll(i18n, preferred = '') {
    const currentHeaderRow = session.headerRow;
    resetData();
    session.headerRow = currentHeaderRow || 1;
    ensureTarget(i18n, preferred);
  }

  function recompute(i18n) {
    const schema = getSchema(i18n);
    if (!session.matrix.length || !schema.length || !Mapper) {
      session.headers = [];
      session.rawRows = [];
      session.mapping = {};
      session.normalizedRows = [];
      session.validationRows = [];
      session.validationSummary = null;
      session.issues = [];
      return;
    }

    const { headers, rows } = Mapper.buildRowsFromMatrix(session.matrix, session.headerRow);
    session.headers = headers;
    session.rawRows = rows;

    const nextMapping = {};
    const suggested = Mapper.suggestMapping(headers, schema);
    schema.forEach((field) => {
      const current = session.mapping[field.name];
      nextMapping[field.name] = headers.includes(current) ? current : (suggested[field.name] || '');
    });
    session.mapping = nextMapping;
    session.normalizedRows = Mapper.normalizeMappedRows(rows, schema, session.mapping);

    const validation = Validator && typeof Validator.validateRows === 'function'
      ? Validator.validateRows(session.targetEntity, session.normalizedRows, schema, i18n)
      : { rows: session.normalizedRows, summary: null, issues: [] };

    session.validationRows = validation.rows || [];
    session.validationSummary = validation.summary || null;
    session.issues = validation.issues || [];
  }

  async function handleIncomingFile(file, i18n) {
    if (!file) return;
    session.currentFile = file;
    const name = cleanText(file.name || '');
    const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    resetData();
    session.fileMeta = {
      name,
      size: Number(file.size || 0),
      type: cleanText(file.type || ''),
      extension
    };

    if (['csv', 'txt'].includes(extension)) {
      const parsed = CsvReader && typeof CsvReader.readCsvFile === 'function'
        ? await CsvReader.readCsvFile(file)
        : { ok: false, reason: 'csv-engine-missing' };
      if (!parsed.ok) {
        session.statusTone = 'critical';
        session.statusMessage = t(i18n, 'ui.importCsvReadError', 'Impossibile leggere il file CSV caricato.');
        return;
      }
      session.sourceFormat = 'csv';
      session.matrix = parsed.matrix || [];
      session.sourceDelimiter = parsed.delimiter || ',';
      session.statusTone = 'ready';
      session.statusMessage = t(i18n, 'ui.importCsvLoaded', 'CSV caricato: intestazioni e righe pronte per mapping e validazione.');
      recompute(i18n);
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
      session.statusMessage = t(i18n, 'ui.importExcelLoaded', 'Foglio Excel caricato: controlla mapping e validazioni prima di sbloccare il commit.');
      recompute(i18n);
      return;
    }

    session.statusTone = 'warning';
    session.statusMessage = t(i18n, 'ui.importUnsupportedFileType', 'Formato non supportato in questa foundation: usa CSV oppure esporta Excel in CSV.');
  }

  function handleTargetChange(targetEntity, i18n) {
    session.targetEntity = cleanText(targetEntity || '') || session.targetEntity;
    recompute(i18n);
  }

  function handleHeaderRowChange(value, i18n) {
    const numeric = Math.max(1, Number(value || 1));
    session.headerRow = Number.isFinite(numeric) ? numeric : 1;
    recompute(i18n);
  }

  async function handleSheetChange(sheetName, currentFile, i18n) {
    session.selectedSheet = cleanText(sheetName || '');
    if (!currentFile) return;
    await handleIncomingFile(currentFile, i18n);
  }

  function handleMappingChange(fieldName, headerName, i18n) {
    session.mapping[fieldName] = cleanText(headerName || '');
    recompute(i18n);
  }

  function formatSize(bytes) {
    const size = Number(bytes || 0);
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    if (size >= 1024) return `${Math.round(size / 1024)} KB`;
    return `${size} B`;
  }

  function renderUploader(i18n) {
    return `
      <div class="custom-file-uploader" data-import-uploader>
        <input id="masterDataImportInput" class="custom-file-input" type="file" accept=".csv,.txt,.xlsx,.xls,.xlsm" />
        <button class="btn secondary custom-file-trigger" type="button" data-file-trigger="masterDataImportInput">${escapeHtml(t(i18n, 'ui.importChooseFile', 'Scegli file'))}</button>
        <div class="custom-file-status" data-import-file-status aria-live="polite">${escapeHtml(session.fileMeta?.name || t(i18n, 'ui.importNoFileSelected', 'Nessun file import selezionato'))}</div>
      </div>`;
  }

  function renderSummaryCards(i18n) {
    const summary = session.validationSummary;
    const mappedCount = Object.values(session.mapping || {}).filter(Boolean).length;
    return `
      <section class="import-foundation-kpis">
        <article class="kpi-card compact"><div class="kpi-label">${escapeHtml(t(i18n, 'ui.importTargetFamily', 'Famiglia target'))}</div><div class="kpi-value">${escapeHtml((Mapper.getTargetOptions(i18n).find((item) => item.key === session.targetEntity) || {}).label || '—')}</div><div class="kpi-hint">${escapeHtml(t(i18n, 'ui.importCurrentMappingHint', 'Target attivo per preview e validazione.'))}</div></article>
        <article class="kpi-card compact"><div class="kpi-label">${escapeHtml(t(i18n, 'ui.importMappedFields', 'Campi mappati'))}</div><div class="kpi-value">${mappedCount}/${getSchema(i18n).length}</div><div class="kpi-hint">${escapeHtml(t(i18n, 'ui.importSourceColumns', 'Colonne sorgente lette'))}: ${session.headers.length}</div></article>
        <article class="kpi-card compact"><div class="kpi-label">${escapeHtml(t(i18n, 'ui.importPreviewRows', 'Righe analizzate'))}</div><div class="kpi-value">${summary ? summary.totalRows : 0}</div><div class="kpi-hint">${escapeHtml(session.fileMeta ? formatSize(session.fileMeta.size) : '—')}</div></article>
        <article class="kpi-card compact"><div class="kpi-label">${escapeHtml(t(i18n, 'ui.importValidationState', 'Esito validazione'))}</div><div class="kpi-value">${summary ? `${summary.validRows}/${summary.totalRows}` : '—'}</div><div class="kpi-hint">${escapeHtml(t(i18n, 'ui.importWarningsErrorsHint', 'Warning / errori'))}: ${summary ? `${summary.warningRows} / ${summary.errorRows}` : '0 / 0'}</div></article>
      </section>`;
  }

  function renderMappingTable(i18n) {
    const schema = getSchema(i18n);
    if (!session.headers.length || !schema.length) {
      return `<div class="master-data-empty-state">${escapeHtml(t(i18n, 'ui.importAwaitingPreview', 'Carica un file per attivare mapping, preview e validazioni.'))}</div>`;
    }

    return `
      <div class="import-mapping-table">
        ${schema.map((field) => `
          <div class="import-mapping-row">
            <div class="import-mapping-meta">
              <strong>${escapeHtml(field.label)}</strong>
              <div class="import-mapping-hint">${field.required ? `<span class="badge attention">${escapeHtml(t(i18n, 'ui.importRequiredBadge', 'Obbligatorio'))}</span>` : `<span class="badge">${escapeHtml(t(i18n, 'ui.importOptionalBadge', 'Opzionale'))}</span>`}</div>
            </div>
            <div class="import-mapping-select-wrap">
              <select data-import-mapping-field="${escapeHtml(field.name)}">
                <option value="">${escapeHtml(t(i18n, 'ui.importSkipColumn', 'Non mappare'))}</option>
                ${session.headers.map((header) => `<option value="${escapeHtml(header)}" ${session.mapping[field.name] === header ? 'selected' : ''}>${escapeHtml(header)}</option>`).join('')}
              </select>
            </div>
          </div>`).join('')}
      </div>`;
  }

  function renderPreviewTable(i18n) {
    if (!session.validationRows.length) {
      return `<div class="master-data-empty-state">${escapeHtml(t(i18n, 'ui.importNoRowsPreview', 'Nessuna riga disponibile per la preview corrente.'))}</div>`;
    }
    const schema = getSchema(i18n);
    const previewRows = session.validationRows.slice(0, 8);
    return `
      <div class="import-preview-table-wrap">
        <table class="import-preview-table">
          <thead>
            <tr>
              <th>${escapeHtml(t(i18n, 'ui.importRow', 'Riga'))}</th>
              ${schema.map((field) => `<th>${escapeHtml(field.label)}</th>`).join('')}
              <th>${escapeHtml(t(i18n, 'ui.importState', 'Stato'))}</th>
            </tr>
          </thead>
          <tbody>
            ${previewRows.map((row) => `
              <tr>
                <td>${row.rowNumber}</td>
                ${schema.map((field) => `<td>${escapeHtml(field.type === 'checkbox' ? (row.values[field.name] ? 'true' : 'false') : (row.values[field.name] || ''))}</td>`).join('')}
                <td><span class="badge ${row.tone === 'critical' ? 'danger' : (row.tone === 'attention' ? 'attention' : 'success')}">${escapeHtml(row.tone === 'critical' ? t(i18n, 'ui.importStateError', 'Errore') : (row.tone === 'attention' ? t(i18n, 'ui.importStateWarning', 'Warning') : t(i18n, 'ui.importStateReady', 'Pronta')))}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderIssues(i18n) {
    if (!session.issues.length) {
      return `<div class="master-data-empty-state">${escapeHtml(t(i18n, 'ui.importNoIssues', 'Nessuna criticità nei controlli base del campione importato.'))}</div>`;
    }
    return `
      <div class="alert-list compact-alert-list">
        ${session.issues.map((issue) => `
          <div class="alert-item ${issue.tone === 'critical' ? 'danger' : 'warning'}">
            <div class="panel-title" style="font-size:14px">${escapeHtml(t(i18n, 'ui.importRow', 'Riga'))} ${issue.rowNumber}</div>
            <div class="alert-text">${escapeHtml(issue.message)}</div>
          </div>`).join('')}
      </div>`;
  }

  function renderPanel({ activeEntity, i18n }) {
    ensureTarget(i18n, activeEntity || 'client');
    const targetOptions = Mapper.getTargetOptions(i18n);
    const statusClass = session.statusTone === 'critical' ? 'danger' : (session.statusTone === 'attention' ? 'attention' : (session.statusTone === 'ready' ? 'success' : 'info'));
    const sheetField = session.sheetNames.length > 1 ? `
      <div class="field">
        <label for="importSheetSelect">${escapeHtml(t(i18n, 'ui.importSheet', 'Foglio'))}</label>
        <select id="importSheetSelect">
          ${session.sheetNames.map((sheetName) => `<option value="${escapeHtml(sheetName)}" ${session.selectedSheet === sheetName ? 'selected' : ''}>${escapeHtml(sheetName)}</option>`).join('')}
        </select>
      </div>` : '';

    return `
      <section class="panel import-foundation-panel">
        <div class="panel-head compact">
          <div>
            <div class="summary-kicker">${escapeHtml(t(i18n, 'ui.importFoundationKicker', 'Import foundation'))}</div>
            <h3 class="panel-title">${escapeHtml(t(i18n, 'ui.importFoundationTitle', 'Migrazione dati — CSV / Excel'))}</h3>
            <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.importFoundationDetail', 'Carica un file, mappa le colonne, valida il campione e prepara il terreno per il commit controllato del prossimo step.'))}</p>
          </div>
          <div class="attachments-meta-pills">
            <span class="helper-pill">${escapeHtml(session.sourceFormat ? session.sourceFormat.toUpperCase() : t(i18n, 'ui.importNoFormat', 'Nessun file'))}</span>
            <span class="helper-pill">${escapeHtml(t(i18n, 'ui.importCommitLocked', 'Commit sbloccato nel prossimo step'))}</span>
          </div>
        </div>

        <div class="form-grid two import-foundation-config-grid">
          <div class="field">
            <label for="importTargetEntity">${escapeHtml(t(i18n, 'ui.importTargetFamily', 'Famiglia target'))}</label>
            <select id="importTargetEntity">
              ${targetOptions.map((option) => `<option value="${escapeHtml(option.key)}" ${option.key === session.targetEntity ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="importHeaderRow">${escapeHtml(t(i18n, 'ui.importHeaderRow', 'Riga intestazioni'))}</label>
            <input id="importHeaderRow" type="number" min="1" step="1" value="${escapeHtml(session.headerRow || 1)}" />
          </div>
          <div class="field full">
            <label for="masterDataImportInput">${escapeHtml(t(i18n, 'ui.importUploadLabel', 'File di migrazione'))}</label>
            ${renderUploader(i18n)}
            <div class="field-hint">${escapeHtml(t(i18n, 'ui.importUploadHint', 'CSV già attivo. I file Excel vengono riconosciuti e instradati al parser dedicato quando disponibile nella build.'))}</div>
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
                <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.importMappingDetail', 'Mappa le colonne sorgente sui campi target della famiglia selezionata.'))}</p>
              </div>
            </div>
            ${renderMappingTable(i18n)}
          </article>

          <article class="panel">
            <div class="panel-head compact">
              <div>
                <h4 class="panel-title">${escapeHtml(t(i18n, 'ui.importPreviewTitle', 'Preview e controlli'))}</h4>
                <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.importPreviewDetail', 'Campione normalizzato, warning base e report errori prima di attivare il commit.'))}</p>
              </div>
            </div>
            ${renderPreviewTable(i18n)}
            <div class="import-issues-block">
              <h5 class="panel-title" style="font-size:14px">${escapeHtml(t(i18n, 'ui.importIssuesTitle', 'Issue report'))}</h5>
              ${renderIssues(i18n)}
            </div>
          </article>
        </section>

        <div class="form-actions import-foundation-actions">
          <button class="btn secondary" type="button" id="importFoundationResetButton">${escapeHtml(t(i18n, 'ui.importResetSession', 'Reset sessione import'))}</button>
          <button class="btn" type="button" disabled>${escapeHtml(t(i18n, 'ui.importCommitDeferred', 'Commit controllato nel prossimo step'))}</button>
        </div>
      </section>`;
  }

  function bind({ root, render, toast, i18n }) {
    const fileInput = root.querySelector('#masterDataImportInput');
    const fileTrigger = root.querySelector('[data-file-trigger="masterDataImportInput"]');
    const fileStatus = root.querySelector('[data-import-file-status]');
    const targetSelect = root.querySelector('#importTargetEntity');
    const headerInput = root.querySelector('#importHeaderRow');
    const sheetSelect = root.querySelector('#importSheetSelect');
    const resetButton = root.querySelector('#importFoundationResetButton');

    fileTrigger?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
      if (!file) return;
      if (fileStatus) fileStatus.textContent = file.name || '';
      await handleIncomingFile(file, i18n);
      render();
      if (session.statusTone === 'critical' || session.statusTone === 'attention') {
        toast(session.statusMessage || t(i18n, 'ui.importFileHandledWithNotes', 'File gestito con note da verificare.'), session.statusTone === 'critical' ? 'warning' : 'info');
      } else {
        toast(t(i18n, 'ui.importPreviewReadyToast', 'Preview import pronta: controlla mapping e validazioni.'), 'success');
      }
    });

    targetSelect?.addEventListener('change', (event) => {
      handleTargetChange(event.target.value || '', i18n);
      render();
    });

    headerInput?.addEventListener('change', (event) => {
      handleHeaderRowChange(event.target.value || 1, i18n);
      render();
    });

    sheetSelect?.addEventListener('change', async (event) => {
      await handleSheetChange(event.target.value || '', session.currentFile, i18n);
      render();
    });

    root.querySelectorAll('[data-import-mapping-field]').forEach((select) => {
      select.addEventListener('change', (event) => {
        handleMappingChange(select.dataset.importMappingField || '', event.target.value || '', i18n);
        render();
      });
    });

    resetButton?.addEventListener('click', () => {
      resetAll(i18n, targetSelect?.value || session.targetEntity || 'client');
      if (fileInput) fileInput.value = '';
      render();
      toast(t(i18n, 'ui.importSessionResetToast', 'Sessione import azzerata.'), 'info');
    });
  }

  return {
    renderPanel,
    bind,
    resetAll
  };
})();
