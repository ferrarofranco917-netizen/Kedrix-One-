window.KedrixOneDocumentEngine = (() => {
  'use strict';

  const Utils = window.KedrixOneUtils;
  const Attachments = window.KedrixOnePracticeAttachments;
  const DocumentCategories = window.KedrixOneDocumentCategories;
  const DocumentMetadata = window.KedrixOneDocumentMetadata;

  function fallbackByLanguage() {
    const args = Array.from(arguments);
    if (args.length >= 3 && args[0] && typeof args[0] === 'object' && typeof args[0].getLanguage === 'function') {
      const i18n = args[0];
      const itText = args[1];
      const enText = args[2];
      return i18n.getLanguage() === 'en' ? enText : itText;
    }
    const itText = args[0];
    const enText = args[1];
    return T && typeof T.getLanguage === 'function' && T.getLanguage() === 'en' ? enText : itText;
  }

  const PRACTICE_FIELD_DEFS = [
    { key: 'reference', label: 'Numero pratica', getter: (practice) => practice.reference },
    { key: 'id', label: 'ID', getter: (practice) => practice.id },
    { key: 'clientName', label: 'Cliente', getter: (practice) => practice.clientName || practice.client },
    { key: 'practiceTypeLabel', label: 'Tipologia', getter: (practice) => practice.practiceTypeLabel || practice.practiceType },
    { key: 'containerCode', label: 'Container', getter: (practice) => practice.containerCode },
    { key: 'booking', label: 'Booking', getter: (practice) => practice.booking },
    { key: 'policyNumber', label: 'Policy', getter: (practice) => practice.policyNumber || practice.mbl },
    { key: 'customsOffice', label: 'Dogana', getter: (practice) => practice.customsOffice },
    { key: 'terminal', label: 'Terminal', getter: (practice) => practice.terminal },
    { key: 'goodsDescription', label: 'Merce', getter: (practice) => practice.goodsDescription }
  ];

  function normalize(value) {
    return Utils && typeof Utils.normalize === 'function'
      ? Utils.normalize(value)
      : String(value || '').trim().toUpperCase();
  }

  function getTypeOptions(state, i18n) {
    if (DocumentCategories && typeof DocumentCategories.getOptions === 'function') {
      return DocumentCategories.getOptions(state || { companyConfig: {} }, i18n);
    }
    return Attachments && typeof Attachments.getDocumentTypeOptions === 'function'
      ? Attachments.getDocumentTypeOptions(state, i18n)
      : [
          { value: 'generic', label: 'Operational attachment' },
          { value: 'clientInstructions', label: 'Istruzioni cliente' },
          { value: 'invoice', label: 'Invoice' },
          { value: 'packingList', label: 'Packing list' },
          { value: 'signedMandate', label: 'Mandato firmato' },
          { value: 'booking', label: 'Booking' },
          { value: 'policy', label: 'Policy / BL / AWB' },
          { value: 'customsDocs', label: 'Customs documents' },
          { value: 'other', label: 'Other' }
        ];
  }

  function getTypeLabel(documentType, state, i18n) {
    const options = getTypeOptions(state, i18n);
    const matched = options.find((option) => option.value === documentType);
    return matched ? matched.label : documentType || '—';
  }

  function practiceOwnerKey(practice) {
    return String(practice?.attachmentOwnerKey || practice?.id || '').trim();
  }

  function resolvePractice(state, ownerKey, practiceId) {
    const practices = Array.isArray(state?.practices) ? state.practices : [];
    return practices.find((practice) => String(practice.id || '').trim() === String(practiceId || '').trim())
      || practices.find((practice) => practiceOwnerKey(practice) === String(ownerKey || '').trim())
      || null;
  }

  function listDocuments(state, i18n) {
    const index = state?.practiceAttachmentIndex && typeof state.practiceAttachmentIndex === 'object'
      ? state.practiceAttachmentIndex
      : {};

    const documents = [];
    Object.entries(index).forEach(([ownerKey, items]) => {
      (Array.isArray(items) ? items : []).forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const practice = resolvePractice(state, ownerKey, item.practiceId);
        const metadata = DocumentMetadata && typeof DocumentMetadata.ensure === 'function'
          ? DocumentMetadata.ensure(item)
          : item;
        const metadataSummary = DocumentMetadata && typeof DocumentMetadata.buildSummary === 'function'
          ? DocumentMetadata.buildSummary(metadata, i18n)
          : [];

        documents.push({
          id: item.id,
          ownerKey: String(ownerKey || '').trim(),
          practiceId: practice?.id || String(item.practiceId || '').trim(),
          reference: practice?.reference || '—',
          clientName: practice?.clientName || practice?.client || '—',
          practiceType: practice?.practiceType || '',
          practiceTypeLabel: practice?.practiceTypeLabel || practice?.practiceType || '—',
          practiceStatus: practice?.status || '—',
          containerCode: practice?.containerCode || '',
          booking: practice?.booking || '',
          customsOffice: practice?.customsOffice || '',
          goodsDescription: practice?.goodsDescription || '',
          fileName: String(item.fileName || 'allegato').trim(),
          mimeType: item.mimeType || 'application/octet-stream',
          size: Number(item.size || 0),
          documentType: String(item.documentType || 'generic'),
          documentTypeLabel: getTypeLabel(item.documentType || 'generic', state, i18n),
          importedAt: item.importedAt || '',
          documentDate: metadata.documentDate || '',
          externalReference: metadata.externalReference || '',
          customsMrn: metadata.customsMrn || '',
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          notes: metadata.notes || '',
          metadataSummary,
          practice
        });
      });
    });

    return documents.sort((left, right) => String(right.importedAt || '').localeCompare(String(left.importedAt || '')));
  }

  function buildBundles(state, i18n) {
    const documents = listDocuments(state, i18n);
    const map = new Map();

    documents.forEach((document) => {
      const bundleKey = document.practiceId || document.ownerKey || document.id;
      if (!map.has(bundleKey)) {
        map.set(bundleKey, {
          bundleKey,
          practiceId: document.practiceId,
          practice: document.practice,
          reference: document.reference,
          clientName: document.clientName,
          practiceTypeLabel: document.practiceTypeLabel,
          practiceStatus: document.practiceStatus,
          importedAt: document.importedAt,
          documents: []
        });
      }
      const bucket = map.get(bundleKey);
      bucket.documents.push(document);
      if (String(document.importedAt || '').localeCompare(String(bucket.importedAt || '')) > 0) {
        bucket.importedAt = document.importedAt;
      }
    });

    return Array.from(map.values()).sort((left, right) => String(right.importedAt || '').localeCompare(String(left.importedAt || '')));
  }

  function getBundleForPractice(state, practiceId, i18n) {
    const practice = (state?.practices || []).find((item) => String(item.id || '').trim() === String(practiceId || '').trim()) || null;
    if (!practice) return null;
    const ownerKey = practiceOwnerKey(practice);
    const documents = listDocuments(state, i18n).filter((item) => item.practiceId === practice.id || item.ownerKey === ownerKey);
    return {
      bundleKey: ownerKey || practice.id,
      practiceId: practice.id,
      practice,
      reference: practice.reference || '—',
      clientName: practice.clientName || practice.client || '—',
      practiceTypeLabel: practice.practiceTypeLabel || practice.practiceType || '—',
      practiceStatus: practice.status || '—',
      importedAt: documents[0]?.importedAt || '',
      documents
    };
  }

  function collectPracticeMatches(practice, tokens) {
    if (!practice || !tokens.length) return [];
    return PRACTICE_FIELD_DEFS.flatMap((definition) => {
      const value = String(definition.getter(practice) || '').trim();
      if (!value) return [];
      const normalized = normalize(value);
      if (!tokens.every((token) => normalized.includes(token)) && !tokens.some((token) => normalized.includes(token))) return [];
      return [{ label: definition.label, value }];
    }).slice(0, 4);
  }

  function collectDocumentMatches(document, tokens) {
    const candidates = [
      { label: 'Documento', value: document.fileName },
      { label: i18n && typeof i18n.t === 'function' ? i18n.t('ui.attachmentTypeLabel', fallbackByLanguage(i18n, 'Tipo documento', 'Document type')) : fallbackByLanguage(i18n, 'Tipo documento', 'Document type'), value: document.documentTypeLabel },
      { label: 'Dogana', value: document.customsOffice },
      { label: 'Container', value: document.containerCode },
      { label: 'Booking', value: document.booking },
      { label: 'Merce', value: document.goodsDescription },
      { label: i18n && typeof i18n.t === 'function' ? i18n.t('ui.documentReference', fallbackByLanguage(i18n, 'Rif. documento', 'Document reference')) : fallbackByLanguage(i18n, 'Rif. documento', 'Document reference'), value: document.externalReference },
      { label: 'MRN', value: document.customsMrn },
      { label: 'Tags', value: Array.isArray(document.tags) ? document.tags.join(', ') : '' },
      { label: i18n && typeof i18n.t === 'function' ? i18n.t('ui.notes', fallbackByLanguage(i18n, 'Note', 'Notes')) : fallbackByLanguage(i18n, 'Note', 'Notes'), value: document.notes }
    ];

    return candidates.filter((candidate) => {
      const normalized = normalize(candidate.value);
      return candidate.value && tokens.some((token) => normalized.includes(token));
    }).slice(0, 4);
  }

  function scoreMatch(text, tokens, weight = 50) {
    const normalized = normalize(text);
    let score = 0;
    tokens.forEach((token) => {
      if (!token) return;
      if (normalized === token) score += weight + 30;
      else if (normalized.startsWith(token)) score += weight + 18;
      else if (normalized.includes(token)) score += weight + 10;
    });
    return score;
  }

  function scorePractice(practice, tokens) {
    return PRACTICE_FIELD_DEFS.reduce((acc, definition) => acc + scoreMatch(definition.getter(practice), tokens, 44), 0);
  }

  function scoreDocument(document, tokens) {
    return [
      { value: document.fileName, weight: 80 },
      { value: document.documentTypeLabel, weight: 65 },
      { value: document.reference, weight: 58 },
      { value: document.clientName, weight: 52 },
      { value: document.containerCode, weight: 52 },
      { value: document.booking, weight: 52 },
      { value: document.customsOffice, weight: 48 },
      { value: document.externalReference, weight: 62 },
      { value: document.customsMrn, weight: 78 },
      { value: Array.isArray(document.tags) ? document.tags.join(' ') : '', weight: 42 },
      { value: document.notes, weight: 25 },
      { value: document.goodsDescription, weight: 35 }
    ].reduce((acc, candidate) => acc + scoreMatch(candidate.value, tokens, candidate.weight), 0);
  }

  function searchBundles(query, state, i18n) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const bundles = buildBundles(state, i18n);

    return bundles.map((bundle) => {
      const practiceScore = scorePractice(bundle.practice, tokens);
      const matchedDocuments = bundle.documents.map((document) => {
        const score = scoreDocument(document, tokens);
        return score > 0 ? {
          ...document,
          score,
          matches: collectDocumentMatches(document, tokens)
        } : null;
      }).filter(Boolean).sort((left, right) => right.score - left.score);

      if (!practiceScore && !matchedDocuments.length) return null;

      return {
        ...bundle,
        score: practiceScore + matchedDocuments.reduce((acc, item) => acc + item.score, 0),
        practiceMatches: collectPracticeMatches(bundle.practice, tokens),
        matchedDocuments,
        documentsCount: bundle.documents.length,
        matchedDocumentsCount: matchedDocuments.length
      };
    }).filter(Boolean).sort((left, right) => right.score - left.score || String(right.importedAt || '').localeCompare(String(left.importedAt || '')));
  }

  function summary(state, i18n) {
    const documents = listDocuments(state, i18n);
    const bundles = buildBundles(state, i18n);
    const typedCounts = documents.reduce((acc, item) => {
      const key = item.documentTypeLabel || item.documentType || 'Altro';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      totalDocuments: documents.length,
      totalBundles: bundles.length,
      latestImportedAt: documents[0]?.importedAt || '',
      typedCounts
    };
  }

  return {
    buildBundles,
    getBundleForPractice,
    listDocuments,
    searchBundles,
    summary,
    getTypeLabel
  };
})();
