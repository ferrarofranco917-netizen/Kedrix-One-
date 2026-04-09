window.KedrixOneUtils = (() => {
  'use strict';

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  function normalize(value) {
    return String(value || '').trim().toUpperCase();
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }


  function buildPracticeReference(rule, dateValue) {
    const workingRule = { ...(rule || {}) };
    const separator = workingRule.separator || '-';
    const year = new Date((dateValue || new Date().toISOString().slice(0, 10)) + 'T00:00:00').getFullYear();
    const lastYear = Number(workingRule.lastYear || year);
    const sequence = workingRule.resetEveryYear && lastYear !== year ? 1 : Number(workingRule.nextNumber || 1);

    const parts = [];
    if (workingRule.prefix) parts.push(String(workingRule.prefix).trim().toUpperCase());
    if (workingRule.includeYear !== false) parts.push(String(year));
    parts.push(String(sequence));

    return parts.join(separator);
  }

  function commitPracticeNumber(rule, dateValue, usedReference = '') {
    const workingRule = rule || {};
    const year = new Date((dateValue || new Date().toISOString().slice(0, 10)) + 'T00:00:00').getFullYear();
    const lastYear = Number(workingRule.lastYear || year);
    const sequence = workingRule.resetEveryYear && lastYear !== year ? 1 : Number(workingRule.nextNumber || 1);
    const referenceMatch = String(usedReference || '').trim().match(/(\d+)(?!.*\d)/);
    const usedSequence = referenceMatch ? Number(referenceMatch[1]) : 0;
    const committedSequence = Math.max(sequence, usedSequence || 0);

    workingRule.lastYear = year;
    workingRule.nextNumber = committedSequence + 1;
    return committedSequence;
  }


  function deriveClientPrefix(clientName) {
    const normalized = String(clientName || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 ]+/g, ' ')
      .trim()
      .toUpperCase();
    if (!normalized) return 'PR';
    const compact = normalized.split(/\s+/).join('');
    return compact.slice(0, 3) || 'PR';
  }

  function buildFallbackPracticeReference(clientName, practices, dateValue) {
    const date = new Date((dateValue || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
    const year = date.getFullYear();
    const prefix = deriveClientPrefix(clientName);
    const seq = (practices || []).filter((practice) => String(practice.reference || '').startsWith(`${prefix}-${year}-`)).length + 1;
    return `${prefix}-${year}-${seq}`;
  }


  function nextPracticeId(practices) {
    const year = new Date().getFullYear();
    const max = practices.reduce((acc, item) => {
      const match = String(item.id).match(/PR-\d{4}-(\d+)/);
      return Math.max(acc, match ? Number(match[1]) : 0);
    }, 0);
    return `PR-${year}-${String(max + 1).padStart(3, '0')}`;
  }

  function nextLogId(logs) {
    const max = logs.reduce((acc, item) => {
      const match = String(item.id).match(/LOG-(\d+)/);
      return Math.max(acc, match ? Number(match[1]) : 0);
    }, 0);
    return `LOG-${String(max + 1).padStart(3, '0')}`;
  }

  function nowStamp() {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
  }

  return {
    escapeHtml,
    formatDate,
    normalize,
    slugify,
    buildPracticeReference,
    commitPracticeNumber,
    deriveClientPrefix,
    buildFallbackPracticeReference,
    nextPracticeId,
    nextLogId,
    nowStamp
  };
})();
