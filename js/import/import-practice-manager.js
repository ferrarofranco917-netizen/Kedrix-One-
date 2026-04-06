window.KedrixOnePracticeImportFoundation = (() => {
  'use strict';

  const CsvReader = window.KedrixOneImportCsvReader || null;
  const ExcelReader = window.KedrixOneImportExcelReader || null;
  const Mapper = window.KedrixOneImportPracticeMapper || null;
  const Validator = window.KedrixOneImportPracticeValidator || null;
  const Committer = window.KedrixOneImportPracticeCommit || null;

  const session = {
    targetType: '',
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

  function ensureTarget(i18n, preferred = '') {
    const options = Mapper && typeof Mapper.getTargetOptions === 'function' ? Mapper.getTargetOptions(i18n) : [];
    const fallback = options[0]?.key || 'sea_import';
    if (preferred && options.some((item) => item.key === preferred)) session.targetType = preferred;
    if (!session.targetType || !options.some((item) => item.key === session.targetType)) session.targetType = fallback;
    return options;
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
    session.commitPlan = null;
  }

  function resetAll(i18n, preferred = '') {
    const currentHeaderRow = session.headerRow;
    resetData();
    session.headerRow = currentHeaderRow || 1;
    ensureTarget(i18n, preferred);
  }

  function getSchema(i18n) {
    return Mapper && typeof Mapper.buildSchema === 'function'
      ? Mapper.buildSchema(session.targetType, i18n)
      : [];
  }

  function recompute(state, i18n) {
    const schema = getSchema(i18n);
    if (!session.matrix.length || !schema.length || !Mapper) {
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

    const rowsInfo = Mapper.buildRowsFromMatrix(session.matrix, session.headerRow);
    session.headers = rowsInfo.headers;
    session.rawRows = rowsInfo.rows;

    const suggested = Mapper.suggestMapping(session.headers, schema, i18n);
    const nextMapping = {};
    schema.forEach((field) => {
      const current = session.mapping[field.name];
      nextMapping[field.name] = session.headers.includes(current) ? current : (suggested[field.name] || '');
    });
    session.mapping = nextMapping;
    session.normalizedRows = Mapper.normalizeMappedRows(session.rawRows, schema, session.mapping);

    const validation = Validator && typeof Validator.validateRows === 'function'
      ? Validator.validateRows({ targetType: session.targetType, rows: session.normalizedRows, schema, i18n, state })
      : { rows: session.normalizedRows, summary: null, issues: [] };

    session.validationRows = validation.rows || [];
    session.validationSummary = validation.summary || null;
    session.issues = validation.issues || [];
    session.commitPlan = Committer && typeof Committer.summarizePlannedCommit === 'function'
      ? Committer.summarizePlannedCommit({ state, entityKey: session.targetType, rows: session.validationRows })
      : null;
  }

  async function handleIncomingFile(file, state, i18n) {
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
      session.statusMessage = t(i18n, 'ui.importPracticeCsvLoaded', 'CSV pratiche caricato: controlla mapping e validazioni prima del commit.');
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
      session.statusMessage = t(i18n, 'ui.importPracticeExcelLoaded', 'Foglio pratiche caricato: controlla mapping e validazioni prima del commit.');
      recompute(state, i18n);
      return;
    }

    session.statusTone = 'attention';
    session.statusMessage = t(i18n, 'ui.importUnsupportedFileType', 'Formato non supportato in questa foundation: usa CSV oppure esporta Excel in CSV.');
  }

  function handleTargetChange(targetType, state, i18n) {
    session.targetType = cleanText(targetType);
    session.mapping = {};
    recompute(state, i18n);
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
        <input id="practiceImportInput" class="visually-hidden" type="file" accept=".csv,.txt,.xlsx,.xls,.xlsm" />
        <button class="btn secondary" type="button" data-file-trigger="practiceImportInput">${escapeHtml(t(i18n, 'ui.importChooseFile', 'Scegli file'))}</button>
        <span class="file-input-status" data-practice-import-file-status>${escapeHtml(fileLabel)}</span>
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

  function renderMappingTable(i18n) {
    const schema = getSchema(i18n);
    if (!schema.length) {
      return `<div class="empty-state">${escapeHtml(t(i18n, 'ui.importAwaitingPreview', 'Carica un file per attivare mapping, preview e validazioni.'))}</div>`;
    }

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
                <div class="field-hint">${escapeHtml(field.tab === 'identity' ? t(i18n, 'ui.importPracticeIdentityHint', 'Identità pratica') : (field.tab === 'detail' ? t(i18n, 'ui.tabDetail', 'Dettaglio') : t(i18n, 'ui.tabPractice', 'Pratica')))}</div>
              </td>
              <td>${field.required ? `<span class="badge warning">${escapeHtml(t(i18n, 'ui.importRequiredBadge', 'Obbligatorio'))}</span>` : `<span class="badge">${escapeHtml(t(i18n, 'ui.importOptionalBadge', 'Opzionale'))}</span>`}</td>
              <td>
                <select data-practice-import-mapping-field="${escapeHtml(field.name)}">
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
    const schema = getSchema(i18n);
    const mappedFields = schema.filter((field) => session.mapping[field.name]);
    if (!rows.length || !mappedFields.length) {
      return `<div class="empty-state">${escapeHtml(t(i18n, 'ui.importNoRowsPreview', 'Nessuna riga disponibile per la preview corrente.'))}</div>`;
    }

    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>${escapeHtml(t(i18n, 'ui.importRow', 'Riga'))}</th>
              <th>${escapeHtml(t(i18n, 'ui.importState', 'Stato'))}</th>
              ${mappedFields.slice(0, 6).map((field) => `<th>${escapeHtml(field.label || field.name)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.rowNumber)}</td>
                <td><span class="badge ${row.tone === 'critical' ? 'warning' : row.tone === 'attention' ? 'info' : ''}">${escapeHtml(row.tone === 'critical' ? t(i18n, 'ui.importStateError', 'Errore') : row.tone === 'attention' ? t(i18n, 'ui.importStateWarning', 'Warning') : t(i18n, 'ui.importStateReady', 'Pronta'))}</span></td>
                ${mappedFields.slice(0, 6).map((field) => {
                  const value = row.values && Object.prototype.hasOwnProperty.call(row.values, field.name) ? row.values[field.name] : '';
                  const rendered = Array.isArray(value) ? value.join(', ') : value;
                  return `<td>${escapeHtml(rendered || '—')}</td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderIssues(i18n) {
    if (!session.issues.length) {
      return `<div class="empty-state">${escapeHtml(t(i18n, 'ui.importNoIssues', 'Nessuna criticità nei controlli base del campione importato.'))}</div>`;
    }
    return `
      <div class="stack compact">
        ${session.issues.map((issue) => `<div class="summary-alert ${issue.tone === 'critical' ? 'critical' : 'attention'}"><strong>${escapeHtml(t(i18n, 'ui.importRow', 'Riga'))} ${escapeHtml(issue.rowNumber)}</strong> · ${escapeHtml(issue.message)}</div>`).join('')}
      </div>`;
  }

  function renderCommitPlan(i18n) {
    if (!session.commitPlan) {
      return `<div class="empty-state">${escapeHtml(t(i18n, 'ui.importAwaitingPreview', 'Carica un file per attivare mapping, preview e validazioni.'))}</div>`;
    }
    const plan = session.commitPlan;
    const last = session.lastCommitSummary;
    const lastHtml = last ? `
      <div class="summary-card tone-ready" style="margin-top:12px;">
        <div class="summary-kicker">${escapeHtml(t(i18n, 'ui.importLastCommitBadge', 'Ultimo commit'))}</div>
        <div class="summary-title">${escapeHtml(t(i18n, 'ui.importPracticeCommitLastTitle', 'Import pratiche completato'))}</div>
        <div class="summary-meta-grid">
          <div><span>${escapeHtml(t(i18n, 'ui.importCreatedCount', 'Create'))}</span><strong>${escapeHtml(last.created || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importDuplicateCount', 'Duplicati'))}</span><strong>${escapeHtml(last.duplicates || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importSkippedRows', 'Righe bloccate'))}</span><strong>${escapeHtml(last.skippedErrors || 0)}</strong></div>
        </div>
      </div>` : '';

    return `
      <div class="summary-card ${plan.eligible ? 'tone-ready' : 'tone-attention'}">
        <div class="summary-kicker">${escapeHtml(plan.eligible ? t(i18n, 'ui.importPracticeCommitEnabled', 'Commit pratiche attivo') : t(i18n, 'ui.importCommitLocked', 'Commit non attivo su questa famiglia in questo step'))}</div>
        <div class="summary-title">${escapeHtml(t(i18n, 'ui.importPracticeCommitPlanTitle', 'Commit controllato pratiche'))}</div>
        <p class="summary-description">${escapeHtml(t(i18n, 'ui.importPracticeCommitPlanDetail', 'In questo step il commit crea nuove pratiche, salta errori e blocca i duplicati già presenti.'))}</p>
        <div class="summary-meta-grid">
          <div><span>${escapeHtml(t(i18n, 'ui.importCreatablePracticeRows', 'Nuove pratiche'))}</span><strong>${escapeHtml(plan.creatableRows || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importDuplicateExistingRows', 'Già presenti'))}</span><strong>${escapeHtml(plan.duplicateRows || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importWarningRows', 'Con warning'))}</span><strong>${escapeHtml(plan.warningRows || 0)}</strong></div>
          <div><span>${escapeHtml(t(i18n, 'ui.importBlockedRows', 'Bloccate da errori'))}</span><strong>${escapeHtml(plan.blockedRows || 0)}</strong></div>
        </div>
        <div class="field-hint">${escapeHtml(t(i18n, 'ui.importPracticeCommitRulesHint', 'Il commit importa solo nuove pratiche senza errori. Le righe con warning vengono create comunque, mentre i duplicati già presenti vengono saltati.'))}</div>
        ${lastHtml}
      </div>`;
  }

  function renderPanel({ state, draftPractice, i18n }) {
    ensureTarget(i18n, session.targetType || draftPractice?.practiceType || 'sea_import');
    if (session.validationRows.length && Committer && typeof Committer.summarizePlannedCommit === 'function') {
      session.commitPlan = Committer.summarizePlannedCommit({ state, entityKey: session.targetType, rows: session.validationRows });
    }

    const targetOptions = Mapper && typeof Mapper.getTargetOptions === 'function' ? Mapper.getTargetOptions(i18n) : [];
    const statusClass = session.statusTone === 'critical' ? 'danger' : (session.statusTone === 'attention' ? 'attention' : (session.statusTone === 'ready' ? 'success' : 'info'));
    const sheetField = session.sheetNames.length > 1 ? `
      <div class="field">
        <label for="practiceImportSheetSelect">${escapeHtml(t(i18n, 'ui.importSheet', 'Foglio'))}</label>
        <select id="practiceImportSheetSelect">
          ${session.sheetNames.map((sheetName) => `<option value="${escapeHtml(sheetName)}" ${session.selectedSheet === sheetName ? 'selected' : ''}>${escapeHtml(sheetName)}</option>`).join('')}
        </select>
      </div>` : '';

    return `
      <section class="panel import-foundation-panel practice-import-panel">
        <div class="panel-head compact">
          <div>
            <div class="summary-kicker">${escapeHtml(t(i18n, 'ui.importPracticeKicker', 'Import pratiche'))}</div>
            <h3 class="panel-title">${escapeHtml(t(i18n, 'ui.importPracticeTitle', 'Import pratiche — CSV / Excel'))}</h3>
            <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.importPracticeDetail', 'Importa pratiche per tipologia, con mapping dedicato, validazione coerente con lo schema e commit controllato solo sulle nuove pratiche.'))}</p>
          </div>
          <div class="attachments-meta-pills">
            <span class="helper-pill">${escapeHtml(session.sourceFormat ? session.sourceFormat.toUpperCase() : t(i18n, 'ui.importNoFormat', 'Nessun file'))}</span>
            <span class="helper-pill">${escapeHtml(session.commitPlan?.eligible ? t(i18n, 'ui.importPracticeCommitEnabled', 'Commit pratiche attivo') : t(i18n, 'ui.importCommitLocked', 'Commit non attivo su questa famiglia in questo step'))}</span>
          </div>
        </div>

        <div class="form-grid two import-foundation-config-grid">
          <div class="field">
            <label for="practiceImportTargetType">${escapeHtml(t(i18n, 'ui.importPracticeTargetType', 'Tipologia pratica target'))}</label>
            <select id="practiceImportTargetType">
              ${targetOptions.map((option) => `<option value="${escapeHtml(option.key)}" ${option.key === session.targetType ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="practiceImportHeaderRow">${escapeHtml(t(i18n, 'ui.importHeaderRow', 'Riga intestazioni'))}</label>
            <input id="practiceImportHeaderRow" type="number" min="1" step="1" value="${escapeHtml(session.headerRow || 1)}" />
          </div>
          <div class="field full">
            <label for="practiceImportInput">${escapeHtml(t(i18n, 'ui.importUploadLabel', 'File di migrazione'))}</label>
            ${renderUploader(i18n)}
            <div class="field-hint">${escapeHtml(t(i18n, 'ui.importPracticeUploadHint', 'CSV attivo per preview e commit. Excel viene riconosciuto e instradato al parser dedicato quando disponibile nella build.'))}</div>
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
                <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.importPracticeMappingDetail', 'Mappa le colonne sorgente sullo schema della tipologia pratica selezionata.'))}</p>
              </div>
            </div>
            ${renderMappingTable(i18n)}
          </article>

          <article class="panel">
            <div class="panel-head compact">
              <div>
                <h4 class="panel-title">${escapeHtml(t(i18n, 'ui.importPreviewTitle', 'Preview e controlli'))}</h4>
                <p class="panel-subtitle">${escapeHtml(t(i18n, 'ui.importPracticePreviewDetail', 'Campione normalizzato, warning di relazione e controlli schema prima del commit.'))}</p>
              </div>
            </div>
            ${renderPreviewTable(i18n)}
            <div class="import-issues-block">
              <h5 class="panel-title" style="font-size:14px">${escapeHtml(t(i18n, 'ui.importIssuesTitle', 'Issue report'))}</h5>
              ${renderIssues(i18n)}
            </div>
            <div class="import-issues-block">
              ${renderCommitPlan(i18n)}
            </div>
          </article>
        </section>

        <div class="form-actions import-foundation-actions">
          <button class="btn secondary" type="button" id="practiceImportResetButton">${escapeHtml(t(i18n, 'ui.importResetSession', 'Reset sessione import'))}</button>
          <button class="btn" type="button" id="practiceImportCommitButton" ${!(session.commitPlan && session.commitPlan.eligible && (session.commitPlan.creatableRows || session.commitPlan.warningRows || session.commitPlan.duplicateRows)) ? 'disabled' : ''}>${escapeHtml(session.commitPlan?.eligible ? t(i18n, 'ui.importPracticeCommitAction', 'Importa pratiche valide') : t(i18n, 'ui.importCommitDeferred', 'Commit non attivo per questa famiglia'))}</button>
        </div>
      </section>`;
  }

  function bind({ state, root, save, render, toast, i18n }) {
    const fileInput = root.querySelector('#practiceImportInput');
    const fileTrigger = root.querySelector('[data-file-trigger="practiceImportInput"]');
    const fileStatus = root.querySelector('[data-practice-import-file-status]');
    const targetSelect = root.querySelector('#practiceImportTargetType');
    const headerInput = root.querySelector('#practiceImportHeaderRow');
    const sheetSelect = root.querySelector('#practiceImportSheetSelect');
    const resetButton = root.querySelector('#practiceImportResetButton');
    const commitButton = root.querySelector('#practiceImportCommitButton');

    if (!targetSelect) return;

    fileTrigger?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
      if (!file) return;
      if (fileStatus) fileStatus.textContent = file.name || '';
      await handleIncomingFile(file, state, i18n);
      render();
      if (session.statusTone === 'critical' || session.statusTone === 'attention') {
        toast(session.statusMessage || t(i18n, 'ui.importFileHandledWithNotes', 'File gestito con note da verificare.'), session.statusTone === 'critical' ? 'warning' : 'info');
      } else {
        toast(t(i18n, 'ui.importPracticePreviewReadyToast', 'Preview pratiche pronta: controlla mapping, relazioni e validazioni.'), 'success');
      }
    });

    targetSelect?.addEventListener('change', (event) => {
      handleTargetChange(event.target.value || '', state, i18n);
      render();
    });

    headerInput?.addEventListener('change', (event) => {
      handleHeaderRowChange(event.target.value || 1, state, i18n);
      render();
    });

    sheetSelect?.addEventListener('change', async (event) => {
      await handleSheetChange(event.target.value || '', session.currentFile, state, i18n);
      render();
    });

    root.querySelectorAll('[data-practice-import-mapping-field]').forEach((select) => {
      select.addEventListener('change', (event) => {
        handleMappingChange(select.dataset.practiceImportMappingField || '', event.target.value || '', state, i18n);
        render();
      });
    });

    resetButton?.addEventListener('click', () => {
      resetAll(i18n, targetSelect?.value || session.targetType || 'sea_import');
      if (fileInput) fileInput.value = '';
      render();
      toast(t(i18n, 'ui.importSessionResetToast', 'Sessione import azzerata.'), 'info');
    });

    commitButton?.addEventListener('click', () => {
      if (!Committer || typeof Committer.commitRows !== 'function') return;
      const summary = Committer.commitRows({ state, entityKey: session.targetType, rows: session.validationRows, i18n });
      session.lastCommitSummary = summary;
      session.commitPlan = Committer && typeof Committer.summarizePlannedCommit === 'function'
        ? Committer.summarizePlannedCommit({ state, entityKey: session.targetType, rows: session.validationRows })
        : session.commitPlan;
      if (!summary.eligible) {
        toast(t(i18n, 'ui.importPracticeCommitUnsupportedTarget', 'In questo step il commit è attivo solo sulle tipologie pratica abilitate per la migrazione controllata.'), 'info');
        render();
        return;
      }
      save && save();
      const tone = summary.created ? 'success' : (summary.duplicates ? 'info' : 'warning');
      const message = `${t(i18n, 'ui.importCommitToastLead', 'Commit completato')}: ${summary.created} ${t(i18n, 'ui.importPracticeCreatedCountLower', 'pratiche create')}, ${summary.duplicates} ${t(i18n, 'ui.importDuplicateCountLower', 'duplicate')}, ${summary.skippedErrors} ${t(i18n, 'ui.importSkippedRowsLower', 'bloccate')}.`;
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
