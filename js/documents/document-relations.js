window.KedrixOneDocumentRelations = (() => {
  'use strict';

  function cleanText(value) {
    return String(value || '').trim();
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function uniqueEntries(entries) {
    const seen = new Set();
    return entries.filter((entry) => {
      if (!entry || !entry.value) return false;
      const key = `${cleanText(entry.group)}|${cleanText(entry.label)}|${cleanText(entry.value)}`.toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function pushEntry(entries, group, label, value) {
    const cleanValue = cleanText(value);
    if (!cleanValue) return;
    entries.push({ group, label: cleanText(label), value: cleanValue });
  }

  function getSnapshotValue(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return '';
    return cleanText(snapshot.displayValue || snapshot.value || snapshot.name || '');
  }

  function getPracticeRelationEntries(practice, i18n) {
    const source = practice && typeof practice === 'object' ? practice : {};
    const linked = source.linkedEntities && typeof source.linkedEntities === 'object' ? source.linkedEntities : {};
    const entries = [];

    pushEntry(entries, 'subject', t(i18n, 'ui.client', 'Cliente'), getSnapshotValue(linked.clientName) || source.clientName || source.client);
    pushEntry(entries, 'subject', t(i18n, 'fields.importer', 'Importatore'), getSnapshotValue(linked.importer) || source.importer);
    pushEntry(entries, 'subject', t(i18n, 'fields.consignee', 'Destinatario'), getSnapshotValue(linked.consignee) || source.consignee);
    pushEntry(entries, 'subject', t(i18n, 'fields.sender', 'Mittente'), getSnapshotValue(linked.sender) || source.sender || source.shipper);
    pushEntry(entries, 'subject', t(i18n, 'fields.carrier', 'Vettore'), getSnapshotValue(linked.carrier) || source.carrier);

    pushEntry(entries, 'reference', t(i18n, 'fields.containerCode', 'Container'), source.containerCode);
    pushEntry(entries, 'reference', t(i18n, 'fields.booking', 'Booking'), source.booking);
    pushEntry(entries, 'reference', t(i18n, 'fields.policyNumber', 'Polizza'), source.policyNumber || source.mbl);
    pushEntry(entries, 'reference', t(i18n, 'fields.customsOffice', 'Dogana'), source.customsOffice);
    pushEntry(entries, 'reference', t(i18n, 'ui.terminal', 'Terminal'), source.terminal);
    pushEntry(entries, 'reference', t(i18n, 'fields.originPlace', 'Origine'), source.originPlace || source.origin);
    pushEntry(entries, 'reference', t(i18n, 'fields.destinationPlace', 'Destinazione'), source.destinationPlace || source.destination);
    pushEntry(entries, 'reference', 'POL', source.pol);
    pushEntry(entries, 'reference', 'POD', source.pod);

    return uniqueEntries(entries);
  }

  function buildBundleSummary(bundle, i18n) {
    const source = bundle && typeof bundle === 'object' ? bundle : {};
    const practice = source.practice && typeof source.practice === 'object' ? source.practice : {};
    const documents = Array.isArray(source.documents) ? source.documents : [];
    const relationEntries = getPracticeRelationEntries(practice, i18n);
    const subjectEntries = relationEntries.filter((entry) => entry.group === 'subject');
    const referenceEntries = relationEntries.filter((entry) => entry.group === 'reference');
    const referenceOnlyCount = documents.filter((item) => item && item.isReferenceOnly).length;
    const binaryCount = documents.length - referenceOnlyCount;
    const typeLabels = Array.from(new Set(documents.map((item) => cleanText(item.documentTypeLabel || item.documentType)).filter(Boolean))).slice(0, 5);

    return {
      entries: relationEntries,
      subjects: subjectEntries,
      references: referenceEntries,
      subjectCount: subjectEntries.length,
      referenceCount: referenceEntries.length,
      referenceOnlyCount,
      binaryCount,
      totalDocuments: documents.length,
      typeLabels,
      subjectChips: subjectEntries.slice(0, 4),
      referenceChips: referenceEntries.slice(0, 4)
    };
  }

  function buildFoundationSummary(bundles, i18n) {
    const list = Array.isArray(bundles) ? bundles : [];
    const summaries = list.map((bundle) => buildBundleSummary(bundle, i18n));
    return {
      bundlesWithSubjects: summaries.filter((item) => item.subjectCount > 0).length,
      bundlesWithOperationalRefs: summaries.filter((item) => item.referenceCount > 0).length,
      bundlesWithReferenceOnlyDocs: summaries.filter((item) => item.referenceOnlyCount > 0).length
    };
  }

  function getSearchCandidates(bundle, i18n) {
    const summary = bundle && bundle.relationSummary ? bundle.relationSummary : buildBundleSummary(bundle, i18n);
    return (summary.entries || []).map((entry) => entry.value).filter(Boolean);
  }

  return {
    getPracticeRelationEntries,
    buildBundleSummary,
    buildFoundationSummary,
    getSearchCandidates
  };
})();
