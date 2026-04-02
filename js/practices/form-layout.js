window.KedrixOnePracticeFormLayout = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas;
  const I18N = window.KedrixOneI18N;

  const sectionCatalog = {
    practice: {
      counterparties: {
        titleKey: 'ui.sectionCounterparties',
        titleFallback: 'Controparti',
        descriptionKey: 'ui.sectionCounterpartiesHint',
        descriptionFallback: 'Soggetti principali della pratica e riferimenti cliente.'
      },
      routing: {
        titleKey: 'ui.sectionRouting',
        titleFallback: 'Routing / Instradamento',
        descriptionKey: 'ui.sectionRoutingHint',
        descriptionFallback: 'Compagnia, porti, aeroporti, terminal e percorso operativo.'
      },
      documentary: {
        titleKey: 'ui.sectionDocumentary',
        titleFallback: 'Documentale',
        descriptionKey: 'ui.sectionDocumentaryHint',
        descriptionFallback: 'Booking, polizze, fatture, packing list e riferimenti documento.'
      },
      customs: {
        titleKey: 'ui.sectionCustoms',
        titleFallback: 'Zona dogana',
        descriptionKey: 'ui.sectionCustomsHint',
        descriptionFallback: 'Dogana, data dogana e punti di lavorazione doganale.'
      },
      operations: {
        titleKey: 'ui.sectionOperations',
        titleFallback: 'Zona operativa',
        descriptionKey: 'ui.sectionOperationsHint',
        descriptionFallback: 'Dati economici, terminali, trasporto, deposito e collegamenti operativi.'
      }
    },
    detail: {
      goods: {
        titleKey: 'ui.sectionGoods',
        titleFallback: 'Merce',
        descriptionKey: 'ui.sectionGoodsHint',
        descriptionFallback: 'Descrizione merce, codici articolo/TARIC e colli guidati.'
      },
      measures: {
        titleKey: 'ui.sectionMeasures',
        titleFallback: 'Pesi / Volumi',
        descriptionKey: 'ui.sectionMeasuresHint',
        descriptionFallback: 'Peso lordo, netto, volume e unità di misura operative con controllo coerenza.'
      },
      transportUnits: {
        titleKey: 'ui.sectionTransportUnits',
        titleFallback: 'Unità di trasporto',
        descriptionKey: 'ui.sectionTransportUnitsHint',
        descriptionFallback: 'Container, booking e riferimenti unità logistiche.'
      },
      checks: {
        titleKey: 'ui.sectionChecks',
        titleFallback: 'Controlli',
        descriptionKey: 'ui.sectionChecksHint',
        descriptionFallback: 'Verifiche disposte dalla dogana sulla unità e relativo stato di controllo.'
      }
    },
    notes: {
      notes: {
        titleKey: 'ui.sectionNotes',
        titleFallback: 'Note',
        descriptionKey: 'ui.sectionNotesHint',
        descriptionFallback: 'Appunti operativi e note interne della pratica.'
      }
    }
  };

  const assignmentMap = {
    sea_import: {
      practice: {
        counterparties: ['importer', 'clientContact', 'clientAgency', 'client', 'consignee', 'sender', 'correspondent'],
        routing: ['company', 'portLoading', 'portDischarge', 'originRef', 'destinationRef', 'terminal', 'terminalPickup', 'terminalDelivery', 'vesselVoyage', 'arrivalDate', 'unloadingDate'],
        documentary: ['booking', 'policyNumber', 'policyOriginals', 'policyCopies', 'hbl', 'baseQuotation', 'insurance', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency', 'packingList', 'incoterm'],
        customs: ['customsOffice', 'customsDate', 'performedDate'],
        operations: ['vesselExchangeRate', 'vesselExchangeCurrency', 'freightAmount', 'freightCurrency', 'fumigation', 'transporter', 'deliveryCity', 'additionalReference', 'bolla', 'appraisalCession', 'salesOwner', 'additionalFigures', 'deposit', 'linkedTo', 'tags']
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageType', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'teu', 'cbm', 'vgm'],
        transportUnits: ['containerCode'],
        checks: ['inspectionFlags']
      },
      notes: { notes: ['internalNotes'] }
    },
    sea_export: {
      practice: {
        counterparties: ['shipper', 'clientContact', 'clientAgency', 'client', 'consignee', 'correspondent'],
        routing: ['company', 'portLoading', 'portDischarge', 'originRef', 'destinationRef', 'terminal', 'terminalPickup', 'terminalDelivery', 'vesselVoyage', 'departureDate', 'unloadingDate'],
        documentary: ['booking', 'policyNumber', 'policyOriginals', 'policyCopies', 'hbl', 'baseQuotation', 'insurance', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency', 'packingList', 'incoterm'],
        customs: ['customsOffice', 'customsDate', 'performedDate'],
        operations: ['vesselExchangeRate', 'vesselExchangeCurrency', 'freightAmount', 'freightCurrency', 'fumigation', 'transporter', 'deliveryCity', 'additionalReference', 'bolla', 'appraisalCession', 'salesOwner', 'additionalFigures', 'deposit', 'linkedTo', 'tags']
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageType', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'teu', 'cbm', 'vgm'],
        transportUnits: ['containerCode'],
        checks: ['inspectionFlags']
      },
      notes: { notes: ['internalNotes'] }
    },
    air_import: {
      practice: {
        counterparties: ['importer', 'client', 'consignee'],
        routing: ['airline', 'airportDeparture', 'airportDestination', 'arrivalDate'],
        documentary: ['booking', 'mawb', 'hawb', 'baseQuotation', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency', 'packingList', 'incoterm'],
        customs: ['customsOffice', 'customsDate'],
        operations: []
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageType', 'packageCount', 'originDest'],
        measures: ['grossWeight', 'chargeableWeight', 'volumeWeight', 'cbm'],
        transportUnits: [],
        checks: ['warehouseFlag']
      },
      notes: { notes: ['internalNotes'] }
    },
    air_export: {
      practice: {
        counterparties: ['shipper', 'client', 'consignee'],
        routing: ['airline', 'airportDeparture', 'airportDestination', 'departureDate'],
        documentary: ['booking', 'mawb', 'hawb', 'baseQuotation', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency', 'packingList', 'incoterm'],
        customs: ['customsOffice', 'customsDate'],
        operations: []
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageType', 'packageCount', 'originDest'],
        measures: ['grossWeight', 'chargeableWeight', 'volumeWeight', 'cbm'],
        transportUnits: [],
        checks: []
      },
      notes: { notes: ['internalNotes'] }
    },
    road_import: {
      practice: {
        counterparties: ['shipper', 'client', 'consignee'],
        routing: ['carrier', 'originDest', 'pickupDate', 'deliveryDate', 'vehicleType', 'plateDriver', 'pickupPlace', 'deliveryPlace'],
        documentary: ['cmr', 'incoterm'],
        customs: [],
        operations: []
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'cbm', 'linearMeters'],
        transportUnits: ['containerCode', 'booking'],
        checks: []
      },
      notes: { notes: ['internalNotes'] }
    },
    road_export: {
      practice: {
        counterparties: ['shipper', 'client', 'consignee'],
        routing: ['carrier', 'originDest', 'pickupDate', 'deliveryDate', 'vehicleType', 'plateDriver', 'pickupPlace', 'deliveryPlace'],
        documentary: ['cmr', 'incoterm'],
        customs: [],
        operations: []
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'cbm', 'linearMeters'],
        transportUnits: ['containerCode', 'booking'],
        checks: []
      },
      notes: { notes: ['internalNotes'] }
    },
    warehouse: {
      practice: {
        counterparties: ['client', 'warehouseContact'],
        routing: ['originDest', 'movementDirection', 'deposit', 'linkedTo', 'plateDriver'],
        documentary: ['lots', 'baseQuotation'],
        customs: ['customsOffice'],
        operations: []
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'cbm', 'linearMeters', 'vgm'],
        transportUnits: ['containerCode'],
        checks: []
      },
      notes: { notes: ['internalNotes'] }
    }
  };

  function ensureFieldSection(type, tab, fieldName, sectionKey) {
    const schema = typeof PracticeSchemas?.getSchema === 'function' ? PracticeSchemas.getSchema(type) : null;
    if (!schema || !schema.tabs || !Array.isArray(schema.tabs[tab])) return;
    const field = schema.tabs[tab].find((entry) => entry && entry.name === fieldName);
    if (!field) return;
    field.sectionKey = sectionKey;
  }

  function applyAssignments() {
    Object.entries(assignmentMap).forEach(([type, tabConfig]) => {
      Object.entries(tabConfig || {}).forEach(([tab, sectionConfig]) => {
        Object.entries(sectionConfig || {}).forEach(([sectionKey, fieldNames]) => {
          (fieldNames || []).forEach((fieldName) => ensureFieldSection(type, tab, fieldName, sectionKey));
        });
      });
    });
  }

  function getSectionMeta(tab, sectionKey) {
    const catalog = sectionCatalog[tab] || {};
    const entry = catalog[sectionKey] || {};
    return {
      key: sectionKey,
      title: I18N?.t ? I18N.t(entry.titleKey, entry.titleFallback || sectionKey) : (entry.titleFallback || sectionKey),
      description: I18N?.t ? I18N.t(entry.descriptionKey, entry.descriptionFallback || '') : (entry.descriptionFallback || '')
    };
  }

  applyAssignments();

  return {
    getSectionMeta
  };
})();
