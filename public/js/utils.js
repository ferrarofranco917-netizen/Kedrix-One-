
window.KedrixOneUtils = (() => {
  'use strict';
  function escapeHtml(v){
    return String(v)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }
  function formatDate(v){
    if(!v) return '—';
    const d = new Date(v + 'T00:00:00');
    if(Number.isNaN(d.getTime())) return v;
    return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
  }
  return { escapeHtml, formatDate };
})();
