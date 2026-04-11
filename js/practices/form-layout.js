window.KedrixOnePracticeFormLayout = (() => {
  'use strict';

  const PracticeSchemas = window.KedrixOnePracticeSchemas;
  const I18N = window.KedrixOneI18N;

  const sectionCatalog = {
    practice: {
      operationalIdentity: {
        titleKey: 'ui.sectionOperationalIdentity',
        titleFallback: 'Identità operativa',
        descriptionKey: 'ui.sectionOperationalIdentityHint',
        descriptionFallback: 'Riferimenti chiave della pratica: numero documentale, quotazione base e agganci operativi.'
      },
      linkedParties: {
        titleKey: 'ui.sectionLinkedParties',
        titleFallback: 'Soggetti collegati',
        descriptionKey: 'ui.sectionLinkedPartiesHint',
        descriptionFallback: 'Cliente, importatore, mittente, destinatario e controparti principali della pratica.'
      },
      transportUnit: {
        titleKey: 'ui.sectionTransportUnit',
        titleFallback: 'Trasporto / unità',
        descriptionKey: 'ui.sectionTransportUnitHint',
        descriptionFallback: 'Compagnia, vettore, terminal, viaggio e riferimenti esecutivi del trasporto.'
      },
      logisticsNodes: {
        titleKey: 'ui.sectionLogisticsNodes',
        titleFallback: 'Nodi logistici',
        descriptionKey: 'ui.sectionLogisticsNodesHint',
        descriptionFallback: 'Origine, destinazione, porti, aeroporti, terminal e snodi fisici della spedizione.'
      },
      customsEconomics: {
        titleKey: 'ui.sectionCustomsEconomics',
        titleFallback: 'Dogana + economico essenziale',
        descriptionKey: 'ui.sectionCustomsEconomicsHint',
        descriptionFallback: 'Dogana, Incoterm, fattura estera, importi e dati economici essenziali da tenere in overview.'
      },
      operationalFlow: {
        titleKey: 'ui.sectionOperationalFlow',
        titleFallback: 'Nota rapida operativa',
        descriptionKey: 'ui.sectionOperationalFlowHint',
        descriptionFallback: 'Memo rapidi, collegamenti, riferimenti aggiuntivi e indicatori utili alla gestione operativa.'
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
        operationalIdentity: ['booking', 'policyNumber', 'policyOriginals', 'policyCopies', 'hbl', 'baseQuotation', 'clientContact', 'clientAgency'],
        linkedParties: ['importer', 'client', 'consignee', 'sender', 'correspondent'],
        transportUnit: ['company', 'vesselVoyage', 'arrivalDate', 'terminal', 'terminalPickup', 'terminalDelivery', 'transporter', 'deliveryCity'],
        logisticsNodes: ['portLoading', 'portDischarge', 'originRef', 'destinationRef', 'unloadingDate', 'deposit', 'linkedTo'],
        customsEconomics: ['customsOffice', 'customsDate', 'performedDate', 'incoterm', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency', 'freightAmount', 'freightCurrency', 'vesselExchangeRate', 'vesselExchangeCurrency', 'insurance', 'fumigation'],
        operationalFlow: ['salesOwner', 'additionalReference', 'bolla', 'appraisalCession', 'additionalFigures', 'tags']
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageType', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'teu', 'cbm', 'vgm'],
        transportUnits: ['containerCode', 'transportUnitType'],
        checks: ['inspectionFlags']
      },
      notes: { notes: ['internalNotes'] }
    },
    sea_export: {
      practice: {
        operationalIdentity: ['booking', 'policyNumber', 'policyOriginals', 'policyCopies', 'hbl', 'baseQuotation', 'clientContact', 'clientAgency'],
        linkedParties: ['shipper', 'client', 'consignee', 'correspondent'],
        transportUnit: ['company', 'vesselVoyage', 'departureDate', 'terminal', 'terminalPickup', 'terminalDelivery', 'transporter', 'deliveryCity'],
        logisticsNodes: ['portLoading', 'portDischarge', 'originRef', 'destinationRef', 'unloadingDate', 'deposit', 'linkedTo'],
        customsEconomics: ['customsOffice', 'customsDate', 'performedDate', 'incoterm', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency', 'freightAmount', 'freightCurrency', 'vesselExchangeRate', 'vesselExchangeCurrency', 'insurance', 'fumigation'],
        operationalFlow: ['salesOwner', 'additionalReference', 'bolla', 'appraisalCession', 'additionalFigures', 'tags']
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageType', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'teu', 'cbm', 'vgm'],
        transportUnits: ['containerCode', 'transportUnitType'],
        checks: ['inspectionFlags']
      },
      notes: { notes: ['internalNotes'] }
    },
    air_import: {
      practice: {
        operationalIdentity: ['booking', 'mawb', 'hawb', 'baseQuotation', 'packingList'],
        linkedParties: ['importer', 'client', 'consignee'],
        transportUnit: ['airline', 'arrivalDate'],
        logisticsNodes: ['airportDeparture', 'airportDestination'],
        customsEconomics: ['customsOffice', 'customsDate', 'incoterm', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency'],
        operationalFlow: []
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
        operationalIdentity: ['booking', 'mawb', 'hawb', 'baseQuotation', 'packingList'],
        linkedParties: ['shipper', 'client', 'consignee'],
        transportUnit: ['airline', 'departureDate'],
        logisticsNodes: ['airportDeparture', 'airportDestination'],
        customsEconomics: ['customsOffice', 'customsDate', 'incoterm', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency'],
        operationalFlow: []
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
        operationalIdentity: ['cmr', 'clientContact', 'clientAgency', 'booking', 'policyNumber', 'policyOriginals', 'policyCopies', 'hbl', 'baseQuotation', 'packingList'],
        linkedParties: ['shipper', 'client', 'consignee'],
        transportUnit: ['carrier', 'vehicleType', 'plateDriver'],
        logisticsNodes: ['originDest', 'pickupPlace', 'deliveryPlace', 'pickupDate', 'deliveryDate'],
        customsEconomics: ['customsOffice', 'customsDate', 'insurance', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency', 'vesselExchangeRate', 'vesselExchangeCurrency', 'freightAmount', 'freightCurrency', 'incoterm', 'performedDate', 'fumigation'],
        operationalFlow: ['salesOwner', 'additionalFigures', 'bolla', 'appraisalCession', 'additionalReference', 'tags']
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'cbm', 'linearMeters'],
        transportUnits: ['containerCode', 'transportUnitType', 'booking'],
        checks: []
      },
      notes: { notes: ['internalNotes'] }
    },
    road_export: {
      practice: {
        operationalIdentity: ['cmr', 'clientContact', 'clientAgency', 'booking', 'policyNumber', 'policyOriginals', 'policyCopies', 'hbl', 'baseQuotation', 'packingList'],
        linkedParties: ['shipper', 'client', 'consignee'],
        transportUnit: ['carrier', 'vehicleType', 'plateDriver'],
        logisticsNodes: ['originDest', 'pickupPlace', 'deliveryPlace', 'pickupDate', 'deliveryDate'],
        customsEconomics: ['customsOffice', 'customsDate', 'insurance', 'foreignInvoice', 'invoiceAmount', 'invoiceCurrency', 'vesselExchangeRate', 'vesselExchangeCurrency', 'freightAmount', 'freightCurrency', 'incoterm', 'performedDate', 'fumigation'],
        operationalFlow: ['salesOwner', 'additionalFigures', 'bolla', 'appraisalCession', 'additionalReference', 'tags']
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'cbm', 'linearMeters'],
        transportUnits: ['containerCode', 'transportUnitType', 'booking'],
        checks: []
      },
      notes: { notes: ['internalNotes'] }
    },
    warehouse: {
      practice: {
        operationalIdentity: ['lots', 'baseQuotation'],
        linkedParties: ['client', 'warehouseContact'],
        transportUnit: ['movementDirection', 'plateDriver'],
        logisticsNodes: ['originDest', 'deposit', 'linkedTo'],
        customsEconomics: ['customsOffice'],
        operationalFlow: []
      },
      detail: {
        goods: ['articleCode', 'taric', 'goodsDescription', 'packageCount'],
        measures: ['grossWeight', 'netWeight', 'cbm', 'linearMeters', 'vgm'],
        transportUnits: ['containerCode', 'transportUnitType'],
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
