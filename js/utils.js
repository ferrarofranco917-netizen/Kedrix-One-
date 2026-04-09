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


  function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function listTakenPracticeReferences(state, options = {}) {
    const {
      excludePracticeId = '',
      excludeSessionId = ''
    } = options;

    const taken = new Set();
    const normalizedExcludePracticeId = String(excludePracticeId || '').trim();
    const normalizedExcludeSessionId = String(excludeSessionId || '').trim();

    (((state && state.practices) || [])).forEach((practice) => {
      if (!practice || typeof practice !== 'object') return;
      if (normalizedExcludePracticeId && String(practice.id || '').trim() === normalizedExcludePracticeId) return;
      const reference = normalize(practice.reference || practice.generatedReference || '');
      if (reference) taken.add(reference);
    });

    (((state && state.practiceWorkspace && state.practiceWorkspace.sessions) || [])).forEach((session) => {
      if (!session || typeof session !== 'object') return;
      if (normalizedExcludeSessionId && String(session.id || '').trim() === normalizedExcludeSessionId) return;
      const draft = session.draft && typeof session.draft === 'object' ? session.draft : null;
      if (!draft) return;
      if (normalizedExcludePracticeId && String(draft.editingPracticeId || '').trim() === normalizedExcludePracticeId) return;
      const reference = normalize(draft.generatedReference || draft.reference || '');
      if (reference) taken.add(reference);
    });

    return taken;
  }

  function ensureUniquePracticeReference(reference, options = {}) {
    const {
      takenReferences,
      fallbackPrefix = 'PR',
      dateValue
    } = options;

    const taken = takenReferences instanceof Set ? takenReferences : new Set();
    let candidate = String(reference || '').trim();
    if (!candidate) {
      const year = new Date((dateValue || new Date().toISOString().slice(0, 10)) + 'T00:00:00').getFullYear();
      candidate = `${String(fallbackPrefix || 'PR').trim().toUpperCase()}-${year}-1`;
    }

    if (!taken.has(normalize(candidate))) return candidate;

    const match = candidate.match(/^(.*?)(\d+)\s*$/);
    const prefix = match ? match[1] : `${candidate}-`;
    let sequence = match ? Number(match[2]) : 1;
    const padLength = match ? String(match[2]).length : 1;

    while (taken.has(normalize(candidate))) {
      sequence += 1;
      candidate = `${prefix}${String(sequence).padStart(padLength, '0')}`;
    }

    return candidate;
  }

  function syncNumberingRuleToReference(rule, reference, dateValue) {
    const workingRule = rule || {};
    const normalizedReference = String(reference || '').trim().toUpperCase();
    if (!normalizedReference) return false;

    const separator = String(workingRule.separator || '-');
    const year = new Date((dateValue || new Date().toISOString().slice(0, 10)) + 'T00:00:00').getFullYear();
    const prefixParts = [];
    if (workingRule.prefix) prefixParts.push(String(workingRule.prefix).trim().toUpperCase());
    if (workingRule.includeYear !== false) prefixParts.push(String(year));
    const base = prefixParts.join(separator);
    const pattern = base
      ? new RegExp(`^${escapeRegExp(base + separator)}(\\d+)$`)
      : new RegExp(`^(\\d+)$`);
    const match = normalizedReference.match(pattern);
    if (!match) return false;

    const usedSequence = Number(match[1] || 0);
    if (!Number.isFinite(usedSequence) || usedSequence <= 0) return false;

    workingRule.lastYear = year;
    workingRule.nextNumber = Math.max(Number(workingRule.nextNumber || 1), usedSequence + 1);
    return true;
  }



  function reconcilePracticeReferenceDuplicates(state) {
    const practices = Array.isArray(state?.practices) ? state.practices : [];
    if (!practices.length) return { changed: false, changes: [] };

    const reserved = new Set(
      practices
        .map((practice) => normalize(practice?.reference || practice?.generatedReference || ''))
        .filter(Boolean)
    );
    const seen = new Set();
    const changes = [];

    practices.forEach((practice) => {
      if (!practice || typeof practice !== 'object') return;
      const currentReference = String(practice.reference || practice.generatedReference || '').trim();
      if (!currentReference) return;
      const normalizedReference = normalize(currentReference);
      if (!normalizedReference) return;

      if (!seen.has(normalizedReference)) {
        seen.add(normalizedReference);
        return;
      }

      const nextReference = ensureUniquePracticeReference(currentReference, {
        takenReferences: reserved,
        fallbackPrefix: deriveClientPrefix(practice.clientName || practice.client || 'PR'),
        dateValue: practice.practiceDate || ''
      });

      if (normalize(nextReference) === normalizedReference) {
        seen.add(normalizedReference);
        return;
      }

      practice.reference = nextReference;
      changes.push({
        id: String(practice.id || '').trim(),
        from: currentReference,
        to: nextReference
      });
      const normalizedNextReference = normalize(nextReference);
      reserved.add(normalizedNextReference);
      seen.add(normalizedNextReference);
    });

    return {
      changed: changes.length > 0,
      changes
    };
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

  function commitPracticeNumber(rule, dateValue) {
    const workingRule = rule || {};
    const year = new Date((dateValue || new Date().toISOString().slice(0, 10)) + 'T00:00:00').getFullYear();
    const lastYear = Number(workingRule.lastYear || year);
    const sequence = workingRule.resetEveryYear && lastYear !== year ? 1 : Number(workingRule.nextNumber || 1);

    workingRule.lastYear = year;
    workingRule.nextNumber = sequence + 1;
    return sequence;
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
    escapeRegExp,
    listTakenPracticeReferences,
    ensureUniquePracticeReference,
    syncNumberingRuleToReference,
    reconcilePracticeReferenceDuplicates,
    buildPracticeReference,
    commitPracticeNumber,
    deriveClientPrefix,
    buildFallbackPracticeReference,
    nextPracticeId,
    nextLogId,
    nowStamp
  };
})();
