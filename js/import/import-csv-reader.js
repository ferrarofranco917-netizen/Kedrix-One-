window.KedrixOneImportCsvReader = (() => {
  'use strict';

  function cleanText(value) {
    return String(value || '').replace(/^\uFEFF/, '');
  }

  function countDelimiterHits(text, delimiter) {
    let count = 0;
    let inQuotes = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const nextChar = text[index + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          index += 1;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && char === delimiter) count += 1;
    }
    return count;
  }

  function detectDelimiter(text) {
    const sample = cleanText(text || '').split(/\r?\n/).slice(0, 8).join('\n');
    const candidates = [',', ';', '\t', '|'];
    const ranked = candidates
      .map((delimiter) => ({ delimiter, score: countDelimiterHits(sample, delimiter) }))
      .sort((left, right) => right.score - left.score);
    return ranked[0] && ranked[0].score > 0 ? ranked[0].delimiter : ',';
  }

  function parseCsvText(text, preferredDelimiter = '') {
    const source = cleanText(text || '');
    const delimiter = preferredDelimiter || detectDelimiter(source);
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      const nextChar = source[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          index += 1;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes && char === delimiter) {
        row.push(cell);
        cell = '';
        continue;
      }

      if (!inQuotes && (char === '\n' || char === '\r')) {
        if (char === '\r' && nextChar === '\n') index += 1;
        row.push(cell);
        const normalizedRow = row.map((value) => String(value || '').trim());
        const hasValue = normalizedRow.some((value) => value);
        if (hasValue) rows.push(normalizedRow);
        row = [];
        cell = '';
        continue;
      }

      cell += char;
    }

    row.push(cell);
    const normalizedRow = row.map((value) => String(value || '').trim());
    if (normalizedRow.some((value) => value)) rows.push(normalizedRow);

    const width = rows.reduce((acc, current) => Math.max(acc, current.length), 0);
    const matrix = rows.map((current) => {
      const cloned = current.slice();
      while (cloned.length < width) cloned.push('');
      return cloned;
    });

    return {
      ok: true,
      delimiter,
      matrix,
      rowCount: matrix.length,
      columnCount: width
    };
  }

  async function readCsvFile(file, preferredDelimiter = '') {
    if (!file) return { ok: false, reason: 'missing-file' };
    const text = typeof file.text === 'function'
      ? await file.text()
      : await new Response(file).text();
    return parseCsvText(text, preferredDelimiter);
  }

  return {
    detectDelimiter,
    parseCsvText,
    readCsvFile
  };
})();
