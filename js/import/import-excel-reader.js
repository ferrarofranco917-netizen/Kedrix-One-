window.KedrixOneImportExcelReader = (() => {
  'use strict';

  async function readAsText(file) {
    if (!file) return '';
    if (typeof file.text === 'function') return file.text();
    return new Response(file).text();
  }

  async function readAsArrayBuffer(file) {
    if (!file) return new ArrayBuffer(0);
    if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
    return new Response(file).arrayBuffer();
  }

  async function readWorkbook(file, options = {}) {
    if (!file) return { ok: false, reason: 'missing-file' };

    if (window.XLSX && typeof window.XLSX.read === 'function') {
      const buffer = await readAsArrayBuffer(file);
      const workbook = window.XLSX.read(buffer, { type: 'array', dense: true, cellDates: false });
      const sheetNames = Array.isArray(workbook.SheetNames) ? workbook.SheetNames.slice() : [];
      const selectedSheet = options.sheetName && sheetNames.includes(options.sheetName) ? options.sheetName : (sheetNames[0] || '');
      const sheet = selectedSheet ? workbook.Sheets[selectedSheet] : null;
      const matrix = sheet && window.XLSX.utils && typeof window.XLSX.utils.sheet_to_json === 'function'
        ? window.XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' })
        : [];
      return {
        ok: true,
        sourceFormat: 'xlsx',
        matrix: Array.isArray(matrix) ? matrix.map((row) => Array.isArray(row) ? row.map((value) => String(value ?? '').trim()) : []) : [],
        sheetNames,
        selectedSheet,
        parser: 'xlsx'
      };
    }

    const fallbackText = String(await readAsText(file) || '').trim();
    if (/^<\?xml/i.test(fallbackText) || /<table/i.test(fallbackText) || /<Workbook/i.test(fallbackText)) {
      return {
        ok: false,
        reason: 'excel-xml-unsupported',
        messageKey: 'ui.importExcelXmlUnsupported',
        messageFallback: 'Questo file Excel richiede un parser dedicato: per questa foundation esportalo come CSV e ricaricalo.'
      };
    }

    return {
      ok: false,
      reason: 'excel-engine-missing',
      messageKey: 'ui.importExcelEngineMissing',
      messageFallback: 'Il parser XLSX non è ancora attivo in questa build: per la foundation esporta il file come CSV e ricaricalo.'
    };
  }

  return {
    readWorkbook
  };
})();
