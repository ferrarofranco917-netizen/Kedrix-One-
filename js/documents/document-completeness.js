window.KedrixOneDocumentCompleteness = (() => {
  'use strict';

  function cleanText(value) {
    return String(value || '').trim();
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function attachmentLabel(i18n, type) {
    const map = {
      booking: ['ui.attachmentTypeBooking', 'Booking'],
      policy: ['ui.attachmentTypePolicy', 'Polizza / BL / AWB'],
      customsDocs: ['ui.attachmentTypeCustomsDocs', 'Documenti doganali'],
      invoice: ['ui.attachmentTypeInvoice', 'Fattura'],
      packingList: ['ui.attachmentTypePackingList', 'Packing list'],
      signedMandate: ['ui.attachmentTypeSignedMandate', 'Mandato firmato'],
      generic: ['ui.attachmentTypeGeneric', 'Allegato operativo'],
      deliveryOrder: ['ui.attachmentTypeDeliveryOrder', 'Delivery order'],
      fundRequest: ['ui.attachmentTypeFundRequest', 'Richiesta fondi'],
      quotation: ['ui.attachmentTypeQuotation', 'Quotazione'],
      other: ['ui.attachmentTypeOther', 'Altro']
    };
    const entry = map[String(type || '').trim()] || ['ui.attachmentTypeGeneric', 'Allegato operativo'];
    return t(i18n, entry[0], entry[1]);
  }

  function getProfile(type, i18n) {
    const sharedCommercial = [
      { type: 'invoice', required: false, label: attachmentLabel(i18n, 'invoice') },
      { type: 'packingList', required: false, label: attachmentLabel(i18n, 'packingList') }
    ];

    const profiles = {
      sea_import: {
        label: t(i18n, 'ui.practiceTypeSeaImport', 'Import mare'),
        docs: [
          { type: 'booking', required: true, label: attachmentLabel(i18n, 'booking') },
          { type: 'policy', required: true, label: attachmentLabel(i18n, 'policy') },
          { type: 'customsDocs', required: true, label: attachmentLabel(i18n, 'customsDocs') },
          ...sharedCommercial
        ]
      },
      sea_export: {
        label: t(i18n, 'ui.practiceTypeSeaExport', 'Export mare'),
        docs: [
          { type: 'booking', required: true, label: attachmentLabel(i18n, 'booking') },
          { type: 'policy', required: true, label: attachmentLabel(i18n, 'policy') },
          { type: 'customsDocs', required: true, label: attachmentLabel(i18n, 'customsDocs') },
          ...sharedCommercial
        ]
      },
      air_import: {
        label: t(i18n, 'ui.practiceTypeAirImport', 'Import aereo'),
        docs: [
          { type: 'policy', required: true, label: attachmentLabel(i18n, 'policy') },
          { type: 'customsDocs', required: true, label: attachmentLabel(i18n, 'customsDocs') },
          { type: 'booking', required: false, label: attachmentLabel(i18n, 'booking') },
          ...sharedCommercial
        ]
      },
      air_export: {
        label: t(i18n, 'ui.practiceTypeAirExport', 'Export aereo'),
        docs: [
          { type: 'policy', required: true, label: attachmentLabel(i18n, 'policy') },
          { type: 'customsDocs', required: true, label: attachmentLabel(i18n, 'customsDocs') },
          { type: 'booking', required: false, label: attachmentLabel(i18n, 'booking') },
          ...sharedCommercial
        ]
      },
      road_import: {
        label: t(i18n, 'ui.practiceTypeRoadImport', 'Import terrestre'),
        docs: [
          { type: 'policy', required: true, label: attachmentLabel(i18n, 'policy') },
          { type: 'customsDocs', required: false, label: attachmentLabel(i18n, 'customsDocs') },
          { type: 'generic', required: false, label: attachmentLabel(i18n, 'generic') },
          ...sharedCommercial
        ]
      },
      road_export: {
        label: t(i18n, 'ui.practiceTypeRoadExport', 'Export terrestre'),
        docs: [
          { type: 'policy', required: true, label: attachmentLabel(i18n, 'policy') },
          { type: 'customsDocs', required: false, label: attachmentLabel(i18n, 'customsDocs') },
          { type: 'generic', required: false, label: attachmentLabel(i18n, 'generic') },
          ...sharedCommercial
        ]
      },
      warehouse: {
        label: t(i18n, 'ui.moduleWarehouse', 'Magazzino'),
        docs: [
          { type: 'generic', required: true, label: attachmentLabel(i18n, 'generic') },
          { type: 'signedMandate', required: false, label: attachmentLabel(i18n, 'signedMandate') },
          { type: 'deliveryOrder', required: false, label: attachmentLabel(i18n, 'deliveryOrder') },
          { type: 'quotation', required: false, label: attachmentLabel(i18n, 'quotation') }
        ]
      }
    };

    const normalized = cleanText(type).toLowerCase();
    if (profiles[normalized]) return profiles[normalized];
    return {
      label: t(i18n, 'ui.documentCompletenessGenericProfile', 'Profilo documentale base'),
      docs: [
        { type: 'generic', required: true, label: attachmentLabel(i18n, 'generic') },
        { type: 'invoice', required: false, label: attachmentLabel(i18n, 'invoice') },
        { type: 'quotation', required: false, label: attachmentLabel(i18n, 'quotation') }
      ]
    };
  }

  function summarizeRequirement(documents, requirement, i18n) {
    const relevant = (Array.isArray(documents) ? documents : []).filter((item) => cleanText(item.documentType) === cleanText(requirement.type));
    const binaryItems = relevant.filter((item) => !item.isReferenceOnly);
    const referenceItems = relevant.filter((item) => item.isReferenceOnly);

    let status = 'missing';
    let tone = requirement.required ? 'critical' : 'default';
    let helper = requirement.required
      ? t(i18n, 'ui.documentCompletenessMissingHelper', 'Documento essenziale ancora da allegare o referenziare.')
      : t(i18n, 'ui.documentCompletenessOptionalMissingHelper', 'Documento opzionale non ancora presente nel fascicolo.');

    if (binaryItems.length) {
      status = 'ready';
      tone = 'ready';
      helper = t(i18n, 'ui.documentCompletenessBinaryReadyHelper', 'Almeno un file binario è già presente nel bundle.');
    } else if (referenceItems.length) {
      status = 'reference-only';
      tone = requirement.required ? 'attention' : 'info';
      helper = requirement.required
        ? t(i18n, 'ui.documentCompletenessReferenceOnlyHelper', 'C’è già un riferimento ma manca ancora il file binario allegato.')
        : t(i18n, 'ui.documentCompletenessOptionalReferenceHelper', 'Presente come riferimento: puoi allegare il file binario in seguito.');
    }

    return {
      type: requirement.type,
      label: requirement.label,
      required: !!requirement.required,
      binaryCount: binaryItems.length,
      referenceOnlyCount: referenceItems.length,
      totalCount: relevant.length,
      status,
      tone,
      helper
    };
  }

  function summarizeBundle(bundle, i18n) {
    const practiceType = cleanText(bundle?.practice?.practiceType || bundle?.practiceType || '');
    const profile = getProfile(practiceType, i18n);
    const rows = profile.docs.map((requirement) => summarizeRequirement(bundle?.documents || [], requirement, i18n));
    const essentialRows = rows.filter((row) => row.required);
    const optionalRows = rows.filter((row) => !row.required);
    const essentialReady = essentialRows.filter((row) => row.status === 'ready').length;
    const essentialReferenceOnly = essentialRows.filter((row) => row.status === 'reference-only').length;
    const essentialMissing = essentialRows.filter((row) => row.status === 'missing').length;
    const optionalReady = optionalRows.filter((row) => row.status === 'ready').length;
    const optionalReferenceOnly = optionalRows.filter((row) => row.status === 'reference-only').length;
    const referenceCoverage = rows.filter((row) => row.status === 'reference-only').length;

    const tone = essentialMissing > 0 ? 'critical' : essentialReferenceOnly > 0 ? 'attention' : 'ready';
    const title = tone === 'critical'
      ? t(i18n, 'ui.documentCompletenessOverviewCritical', 'Fascicolo da completare')
      : tone === 'attention'
        ? t(i18n, 'ui.documentCompletenessOverviewAttention', 'Fascicolo coperto ma non ancora allegato del tutto')
        : t(i18n, 'ui.documentCompletenessOverviewReady', 'Fascicolo essenziale pronto');

    const detail = tone === 'critical'
      ? t(i18n, 'ui.documentCompletenessOverviewCriticalHint', 'Mancano ancora uno o più documenti essenziali per questo tipo pratica.')
      : tone === 'attention'
        ? t(i18n, 'ui.documentCompletenessOverviewAttentionHint', 'I documenti essenziali risultano almeno referenziati, ma alcuni mancano ancora come allegati binari.')
        : t(i18n, 'ui.documentCompletenessOverviewReadyHint', 'I documenti essenziali risultano già allegati nel fascicolo locale.');

    let nextAction = '';
    if (essentialMissing > 0) {
      const firstMissing = essentialRows.find((row) => row.status === 'missing');
      nextAction = firstMissing
        ? t(i18n, 'ui.documentCompletenessNextActionMissing', 'Aggiungi prima il documento essenziale: ') + firstMissing.label
        : '';
    } else if (essentialReferenceOnly > 0) {
      const firstReferenceOnly = essentialRows.find((row) => row.status === 'reference-only');
      nextAction = firstReferenceOnly
        ? t(i18n, 'ui.documentCompletenessNextActionReference', 'Trasforma in allegato binario il riferimento: ') + firstReferenceOnly.label
        : '';
    } else if (optionalReferenceOnly > 0) {
      nextAction = t(i18n, 'ui.documentCompletenessNextActionOptional', 'Puoi completare i documenti opzionali già referenziati quando il fascicolo operativo è stabile.');
    }

    return {
      practiceType,
      profileLabel: profile.label,
      rows,
      essentialRows,
      optionalRows,
      counts: {
        essentialTotal: essentialRows.length,
        essentialReady,
        essentialReferenceOnly,
        essentialMissing,
        optionalTotal: optionalRows.length,
        optionalReady,
        optionalReferenceOnly,
        referenceCoverage
      },
      tone,
      title,
      detail,
      nextAction
    };
  }

  function buildFoundationSummary(bundles, i18n) {
    const summaries = (Array.isArray(bundles) ? bundles : []).map((bundle) => summarizeBundle(bundle, i18n));
    return {
      bundlesReady: summaries.filter((item) => item.tone === 'ready').length,
      bundlesAttention: summaries.filter((item) => item.tone === 'attention').length,
      bundlesCritical: summaries.filter((item) => item.tone === 'critical').length,
      bundlesWithReferenceCoverage: summaries.filter((item) => item.counts.referenceCoverage > 0).length,
      summaries
    };
  }

  return {
    summarizeBundle,
    buildFoundationSummary
  };
})();
