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

  function nextPracticeId(practices) {
    const max = practices.reduce((acc, item) => {
      const match = String(item.id).match(/PR-\d{4}-(\d+)/);
      return Math.max(acc, match ? Number(match[1]) : 0);
    }, 0);
    return `PR-2026-${String(max + 1).padStart(3, '0')}`;
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
    nextPracticeId,
    nextLogId,
    nowStamp
  };
})();
