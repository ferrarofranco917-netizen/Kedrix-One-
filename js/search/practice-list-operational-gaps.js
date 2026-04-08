window.KedrixOnePracticeListOperationalGaps = (() => {
  'use strict';

  function normalize(value) {
    return String(value || '').trim().toUpperCase();
  }

  function summarize(practices = [], extractValues = null) {
    const rows = Array.isArray(practices) ? practices : [];
    const safeExtract = typeof extractValues === 'function'
      ? extractValues
      : ((practice) => ({
          reference: String(practice?.reference || practice?.id || '').trim(),
          client: String(practice?.clientName || practice?.client || '').trim(),
          importer: String(practice?.importer || '').trim(),
          exporter: String(practice?.exporter || practice?.shipper || '').trim(),
          destination: String(practice?.destination || practice?.port || '').trim(),
          booking: String(practice?.booking || '').trim(),
          container: String(practice?.containerCode || practice?.container || '').trim(),
          policy: String(practice?.policyNumber || practice?.mbl || practice?.mawb || '').trim(),
          status: String(practice?.status || '').trim()
        }));

    function examples(list) {
      return list.slice(0, 4).map((practice) => {
        const values = safeExtract(practice);
        return {
          id: practice?.id || values.reference || '',
          reference: values.reference || practice?.reference || practice?.id || '—',
          client: values.client || '—',
          status: values.status || practice?.status || '—'
        };
      });
    }

    const draftIncomplete = rows.filter((practice) => Boolean(practice?.draftIncomplete));
    const waitingDocuments = rows.filter((practice) => normalize(safeExtract(practice).status) === 'IN ATTESA DOCUMENTI');
    const missingTransportRefs = rows.filter((practice) => {
      const values = safeExtract(practice);
      return !String(values.booking || '').trim() && !String(values.container || '').trim() && !String(values.policy || '').trim();
    });
    const missingDestination = rows.filter((practice) => !String(safeExtract(practice).destination || '').trim());

    return [
      {
        id: 'draftIncomplete',
        labelKey: 'ui.practiceListGapDrafts',
        fallback: 'Bozze incomplete',
        hintKey: 'ui.practiceListGapDraftsHint',
        hintFallback: 'Pratiche già presenti nel range attivo ma ancora non complete.',
        tone: 'warning',
        count: draftIncomplete.length,
        examples: examples(draftIncomplete)
      },
      {
        id: 'waitingDocuments',
        labelKey: 'ui.practiceListGapWaitingDocs',
        fallback: 'In attesa documenti',
        hintKey: 'ui.practiceListGapWaitingDocsHint',
        hintFallback: 'Pratiche che dichiarano ancora attesa documentale nel perimetro filtrato.',
        tone: 'warning',
        count: waitingDocuments.length,
        examples: examples(waitingDocuments)
      },
      {
        id: 'missingTransportRefs',
        labelKey: 'ui.practiceListGapTransportRefs',
        fallback: 'Senza riferimenti trasporto',
        hintKey: 'ui.practiceListGapTransportRefsHint',
        hintFallback: 'Nessun booking, container o polizza/BL/AWB rilevato nella pratica filtrata.',
        tone: 'info',
        count: missingTransportRefs.length,
        examples: examples(missingTransportRefs)
      },
      {
        id: 'missingDestination',
        labelKey: 'ui.practiceListGapDestination',
        fallback: 'Senza destinazione',
        hintKey: 'ui.practiceListGapDestinationHint',
        hintFallback: 'Pratiche dove la destinazione non è ancora valorizzata.',
        tone: 'info',
        count: missingDestination.length,
        examples: examples(missingDestination)
      }
    ];
  }

  return {
    summarize
  };
})();
