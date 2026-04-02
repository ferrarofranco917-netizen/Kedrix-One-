window.KedrixOnePracticeSchemas = (() => {
  'use strict';

  const I18N = window.KedrixOneI18N;
  const PortData = window.KedrixOnePortData || {};
  const CustomsData = window.KedrixOneCustomsData || {};

  const incoterms2020 = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'];

  const defaultPracticeConfig = {
    incotermProfiles: {
      sea: ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DPU', 'DDP'],
      air: ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
      road: ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
      warehouse: ['EXW', 'FCA', 'DAP', 'DPU', 'DDP']
    },
    directories: {
      seaPorts: ['Genova', 'La Spezia', 'Vado Ligure', 'Shanghai', 'Ningbo', 'Yantian', 'Rotterdam'],
      airports: Array.isArray(PortData.defaultAirports) ? PortData.defaultAirports.map((entry) => ({ ...entry })) : [],
      shippingCompanies: ['MSC', 'Maersk', 'CMA CGM', 'Hapag-Lloyd', 'ONE'],
      airlines: ['Lufthansa Cargo', 'Air France KLM Martinair Cargo', 'Qatar Airways Cargo', 'Emirates SkyCargo'],
      carriers: ['TERCOM', 'BRT', 'DHL Freight', 'DB Schenker', 'Lannutti'],
      vehicleTypes: ['Bilico centinato', 'Motrice', 'Furgone', 'Container chassis', 'Cassonato'],
      logisticsLocations: ['Fossano', 'Torino', 'Genova', 'Milano', 'Lione'],
      seaPortLocodes: Array.isArray(PortData.defaultSeaPortLocodes) ? PortData.defaultSeaPortLocodes.map((entry) => ({ ...entry })) : [],
      seaTerminals: ["PSA Genova Pra'", 'SECH Genova', 'VTE Voltri', 'Terminal del Golfo La Spezia', 'Vado Gateway', 'LSCT La Spezia', 'Ravano Terminal', 'Terminal San Giorgio', 'Terminal Bettolo'],
      originDirectories: ['ITALIA', 'CINA', 'TURCHIA', 'USA', 'FRANCIA', 'GERMANIA'],
      destinationDirectories: ['ITALIA', 'CINA', 'TURCHIA', 'USA', 'FRANCIA', 'GERMANIA'],
      currencies: ['EUR', 'USD', 'GBP', 'CHF', 'CNY', 'JPY'],
      deposits: ['Magazzino interno', 'Deposito doganale', 'Transit point', 'Cross-dock'],
      warehouseLinks: ['Pratica import', 'Pratica export', 'Transito interno', 'Deposito temporaneo'],
      customsOffices: Array.isArray(CustomsData.defaultCustomsOffices) ? CustomsData.defaultCustomsOffices.map((entry) => ({ ...entry })) : []
    }
  };

  const categoryMap = {
    sea_import: ['FCL-FULL', 'LCL-GROUPAGE'],
    sea_export: ['FCL-FULL', 'LCL-GROUPAGE'],
    air_import: ['AIR-FULL', 'AIR-CONSOL'],
    air_export: ['AIR-FULL', 'AIR-CONSOL'],
    road_import: ['TERRA-FULL', 'GROUPAGE'],
    road_export: ['TERRA-FULL', 'GROUPAGE'],
    warehouse: ['MAGAZZINO', 'DEPOSITO DOGANALE', 'TRANSITO']
  };

  const sharedNotes = [
    { name: 'internalNotes', type: 'textarea', labelKey: 'ui.internalNotes', required: false, full: true }
  ];

  const schemas = {
    sea_import: {
      group: 'sea',
      tabs: {
        practice: [
          { name: 'importer', type: 'text', labelKey: 'ui.importer', required: true },
          { name: 'clientContact', type: 'text', labelKey: 'ui.clientContact' },
          { name: 'clientAgency', type: 'text', labelKey: 'ui.agency' },
          { name: 'client', type: 'derived', labelKey: 'ui.clientRequired' },
          { name: 'consignee', type: 'text', labelKey: 'ui.consignee', required: true },
          { name: 'company', type: 'text', labelKey: 'ui.shippingCompany', suggestionKey: 'shippingCompanies' },
          { name: 'portLoading', type: 'text', labelKey: 'ui.seaPortLoading', required: true, suggestionKey: 'seaPortLocodes' },
          { name: 'portDischarge', type: 'text', labelKey: 'ui.seaPortDischarge', required: true, suggestionKey: 'seaPortLocodes' },
          { name: 'originRef', type: 'text', labelKey: 'ui.originRef', suggestionKey: 'originDirectories' },
          { name: 'destinationRef', type: 'text', labelKey: 'ui.destinationRef', suggestionKey: 'destinationDirectories' },
          { name: 'vesselExchangeRate', type: 'number', labelKey: 'ui.vesselExchangeRate' },
          { name: 'vesselExchangeCurrency', type: 'select', labelKey: 'ui.vesselExchangeCurrency', suggestionKey: 'currencies' },
          { name: 'terminal', type: 'text', labelKey: 'ui.terminal', suggestionKey: 'seaTerminals' },
          { name: 'vesselVoyage', type: 'text', labelKey: 'ui.vesselVoyage' },
          { name: 'arrivalDate', type: 'date', labelKey: 'ui.arrivalDate', required: true },
          { name: 'freightAmount', type: 'number', labelKey: 'ui.freightAmount' },
          { name: 'freightCurrency', type: 'select', labelKey: 'ui.freightCurrency', suggestionKey: 'currencies' },
          { name: 'booking', type: 'text', labelKey: 'ui.booking', required: true },
          { name: 'policyNumber', type: 'text', labelKey: 'ui.policyNumber' },
          { name: 'policyOriginals', type: 'number', labelKey: 'ui.policyOriginals' },
          { name: 'policyCopies', type: 'number', labelKey: 'ui.policyCopies' },
          { name: 'hbl', type: 'text', labelKey: 'ui.hbl' },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOffice', required: true, suggestionKey: 'customsOffices', hintKey: 'ui.customsCodeHint', hintFallback: 'Scrivi la dogana o il codice ADM. Esempio: Alessandria → IT313000.' },
          { name: 'baseQuotation', type: 'text', labelKey: 'ui.baseQuotation' },
          { name: 'incoterm', type: 'select', labelKey: 'ui.incoterm', required: true, optionSource: 'incoterms' },
          { name: 'category', type: 'select-derived', labelKey: 'ui.categoryLabel' }
        ],
        detail: [
          { name: 'articleCode', type: 'text', labelKey: 'ui.articleCode' },
          { name: 'containerCode', type: 'text', labelKey: 'ui.containerCode' },
          { name: 'taric', type: 'text', labelKey: 'ui.taric' },
          { name: 'goodsDescription', type: 'textarea', labelKey: 'ui.goodsDescription', required: true, full: true },
          { name: 'packageType', type: 'text', labelKey: 'ui.packageType' },
          { name: 'packageCount', type: 'number', labelKey: 'ui.packageCount', required: true },
          { name: 'grossWeight', type: 'number', labelKey: 'ui.grossWeight', required: true },
          { name: 'netWeight', type: 'number', labelKey: 'ui.netWeight' },
          { name: 'teu', type: 'number', labelKey: 'ui.teu' },
          { name: 'cbm', type: 'number', labelKey: 'ui.cbm' },
          { name: 'vgm', type: 'text', labelKey: 'ui.vgm' },
          { name: 'inspectionFlags', type: 'checkbox-group', labelKey: 'ui.verifications', options: ['ui.verifyMerce', 'ui.verifyDocumentale', 'ui.verifyScanner', 'ui.verifySanitario', 'ui.verifyMagazzino'], full: true }
        ],
        notes: sharedNotes
      }
    },
    sea_export: {
      group: 'sea',
      tabs: {
        practice: [
          { name: 'shipper', type: 'text', labelKey: 'ui.shipper', required: true },
          { name: 'client', type: 'derived', labelKey: 'ui.clientRequired' },
          { name: 'consignee', type: 'text', labelKey: 'ui.consignee', required: true },
          { name: 'company', type: 'text', labelKey: 'ui.shippingCompany', suggestionKey: 'shippingCompanies' },
          { name: 'portLoading', type: 'text', labelKey: 'ui.seaPortLoading', required: true, suggestionKey: 'seaPortLocodes' },
          { name: 'portDischarge', type: 'text', labelKey: 'ui.seaPortDischarge', required: true, suggestionKey: 'seaPortLocodes' },
          { name: 'originRef', type: 'text', labelKey: 'ui.originRef', suggestionKey: 'originDirectories' },
          { name: 'destinationRef', type: 'text', labelKey: 'ui.destinationRef', suggestionKey: 'destinationDirectories' },
          { name: 'vesselExchangeRate', type: 'number', labelKey: 'ui.vesselExchangeRate' },
          { name: 'vesselExchangeCurrency', type: 'select', labelKey: 'ui.vesselExchangeCurrency', suggestionKey: 'currencies' },
          { name: 'terminal', type: 'text', labelKey: 'ui.terminal', suggestionKey: 'seaTerminals' },
          { name: 'vesselVoyage', type: 'text', labelKey: 'ui.vesselVoyage' },
          { name: 'departureDate', type: 'date', labelKey: 'ui.departureDate', required: true },
          { name: 'freightAmount', type: 'number', labelKey: 'ui.freightAmount' },
          { name: 'freightCurrency', type: 'select', labelKey: 'ui.freightCurrency', suggestionKey: 'currencies' },
          { name: 'booking', type: 'text', labelKey: 'ui.booking', required: true },
          { name: 'policyNumber', type: 'text', labelKey: 'ui.policyNumber' },
          { name: 'policyOriginals', type: 'number', labelKey: 'ui.policyOriginals' },
          { name: 'policyCopies', type: 'number', labelKey: 'ui.policyCopies' },
          { name: 'hbl', type: 'text', labelKey: 'ui.hbl' },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOffice', required: true, suggestionKey: 'customsOffices', hintKey: 'ui.customsCodeHint', hintFallback: 'Scrivi la dogana o il codice ADM. Esempio: Alessandria → IT313000.' },
          { name: 'baseQuotation', type: 'text', labelKey: 'ui.baseQuotation' },
          { name: 'incoterm', type: 'select', labelKey: 'ui.incoterm', required: true, optionSource: 'incoterms' },
          { name: 'category', type: 'select-derived', labelKey: 'ui.categoryLabel' }
        ],
        detail: [
          { name: 'articleCode', type: 'text', labelKey: 'ui.articleCode' },
          { name: 'containerCode', type: 'text', labelKey: 'ui.containerCode' },
          { name: 'taric', type: 'text', labelKey: 'ui.taric' },
          { name: 'goodsDescription', type: 'textarea', labelKey: 'ui.goodsDescription', required: true, full: true },
          { name: 'packageType', type: 'text', labelKey: 'ui.packageType' },
          { name: 'packageCount', type: 'number', labelKey: 'ui.packageCount', required: true },
          { name: 'grossWeight', type: 'number', labelKey: 'ui.grossWeight', required: true },
          { name: 'netWeight', type: 'number', labelKey: 'ui.netWeight' },
          { name: 'teu', type: 'number', labelKey: 'ui.teu' },
          { name: 'cbm', type: 'number', labelKey: 'ui.cbm' },
          { name: 'vgm', type: 'text', labelKey: 'ui.vgm' },
          { name: 'inspectionFlags', type: 'checkbox-group', labelKey: 'ui.verifications', options: ['ui.verifyMerce', 'ui.verifyDocumentale', 'ui.verifyScanner', 'ui.verifySanitario', 'ui.verifyMagazzino'], full: true }
        ],
        notes: sharedNotes
      }
    },
    air_import: {
      group: 'air',
      tabs: {
        practice: [
          { name: 'importer', type: 'text', labelKey: 'ui.importer', required: true },
          { name: 'client', type: 'derived', labelKey: 'ui.clientRequired' },
          { name: 'consignee', type: 'text', labelKey: 'ui.consignee', required: true },
          { name: 'airline', type: 'text', labelKey: 'ui.airline', suggestionKey: 'airlines' },
          { name: 'airportDeparture', type: 'text', labelKey: 'ui.airportDeparture', required: true, suggestionKey: 'airports', hintKey: 'ui.airportCodeHint', hintFallback: 'Scrivi l’aeroporto o il codice. Esempio: Malpensa → ITMXP.' },
          { name: 'airportDestination', type: 'text', labelKey: 'ui.airportDestination', required: true, suggestionKey: 'airports', hintKey: 'ui.airportCodeHint', hintFallback: 'Scrivi l’aeroporto o il codice. Esempio: Malpensa → ITMXP.' },
          { name: 'mawb', type: 'text', labelKey: 'ui.mawb', required: true },
          { name: 'hawb', type: 'text', labelKey: 'ui.hawb' },
          { name: 'arrivalDate', type: 'date', labelKey: 'ui.arrivalDate', required: true },
          { name: 'booking', type: 'text', labelKey: 'ui.booking' },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOperator', required: true, suggestionKey: 'customsOffices', hintKey: 'ui.customsCodeHint', hintFallback: 'Scrivi la dogana o il codice ADM. Esempio: Alessandria → IT313000.' },
          { name: 'incoterm', type: 'select', labelKey: 'ui.incoterm', required: true, optionSource: 'incoterms' }
        ],
        detail: [
          { name: 'articleCode', type: 'text', labelKey: 'ui.articleCode' },
          { name: 'goodsDescription', type: 'textarea', labelKey: 'ui.goodsDescription', required: true, full: true },
          { name: 'packageCount', type: 'number', labelKey: 'ui.packageCount', required: true },
          { name: 'packageType', type: 'text', labelKey: 'ui.packageType' },
          { name: 'grossWeight', type: 'number', labelKey: 'ui.grossWeight', required: true },
          { name: 'chargeableWeight', type: 'number', labelKey: 'ui.chargeableWeight' },
          { name: 'volumeWeight', type: 'number', labelKey: 'ui.volumeWeight' },
          { name: 'cbm', type: 'number', labelKey: 'ui.cbm' },
          { name: 'originDest', type: 'text', labelKey: 'ui.originDestination' },
          { name: 'warehouseFlag', type: 'checkbox-group', labelKey: 'ui.verifications', options: ['ui.verifyMerce', 'ui.verifyDocumentale', 'ui.verifyScanner', 'ui.verifySanitario'], full: true }
        ],
        notes: sharedNotes
      }
    },
    air_export: {
      group: 'air',
      tabs: {
        practice: [
          { name: 'shipper', type: 'text', labelKey: 'ui.shipper', required: true },
          { name: 'client', type: 'derived', labelKey: 'ui.clientRequired' },
          { name: 'consignee', type: 'text', labelKey: 'ui.consignee', required: true },
          { name: 'airline', type: 'text', labelKey: 'ui.airline', suggestionKey: 'airlines' },
          { name: 'airportDeparture', type: 'text', labelKey: 'ui.airportDeparture', required: true, suggestionKey: 'airports', hintKey: 'ui.airportCodeHint', hintFallback: 'Scrivi l’aeroporto o il codice. Esempio: Malpensa → ITMXP.' },
          { name: 'airportDestination', type: 'text', labelKey: 'ui.airportDestination', required: true, suggestionKey: 'airports', hintKey: 'ui.airportCodeHint', hintFallback: 'Scrivi l’aeroporto o il codice. Esempio: Malpensa → ITMXP.' },
          { name: 'mawb', type: 'text', labelKey: 'ui.mawb', required: true },
          { name: 'hawb', type: 'text', labelKey: 'ui.hawb' },
          { name: 'departureDate', type: 'date', labelKey: 'ui.departureDate', required: true },
          { name: 'booking', type: 'text', labelKey: 'ui.booking' },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOperator', required: true, suggestionKey: 'customsOffices', hintKey: 'ui.customsCodeHint', hintFallback: 'Scrivi la dogana o il codice ADM. Esempio: Alessandria → IT313000.' },
          { name: 'incoterm', type: 'select', labelKey: 'ui.incoterm', required: true, optionSource: 'incoterms' }
        ],
        detail: [
          { name: 'articleCode', type: 'text', labelKey: 'ui.articleCode' },
          { name: 'goodsDescription', type: 'textarea', labelKey: 'ui.goodsDescription', required: true, full: true },
          { name: 'packageCount', type: 'number', labelKey: 'ui.packageCount', required: true },
          { name: 'packageType', type: 'text', labelKey: 'ui.packageType' },
          { name: 'grossWeight', type: 'number', labelKey: 'ui.grossWeight', required: true },
          { name: 'chargeableWeight', type: 'number', labelKey: 'ui.chargeableWeight' },
          { name: 'volumeWeight', type: 'number', labelKey: 'ui.volumeWeight' },
          { name: 'cbm', type: 'number', labelKey: 'ui.cbm' },
          { name: 'originDest', type: 'text', labelKey: 'ui.originDestination' }
        ],
        notes: sharedNotes
      }
    },
    road_import: {
      group: 'road',
      tabs: {
        practice: [
          { name: 'shipper', type: 'text', labelKey: 'ui.sender', required: true },
          { name: 'client', type: 'derived', labelKey: 'ui.clientRequired' },
          { name: 'consignee', type: 'text', labelKey: 'ui.consignee', required: true },
          { name: 'carrier', type: 'text', labelKey: 'ui.carrier', required: true, suggestionKey: 'carriers' },
          { name: 'originDest', type: 'text', labelKey: 'ui.originDestination' },
          { name: 'pickupDate', type: 'date', labelKey: 'ui.pickupDate', required: true },
          { name: 'deliveryDate', type: 'date', labelKey: 'ui.deliveryDate', required: true },
          { name: 'vehicleType', type: 'text', labelKey: 'ui.vehicleType', required: true, suggestionKey: 'vehicleTypes' },
          { name: 'plateDriver', type: 'text', labelKey: 'ui.plateDriver' },
          { name: 'pickupPlace', type: 'text', labelKey: 'ui.pickupPlace', required: true, suggestionKey: 'logisticsLocations' },
          { name: 'deliveryPlace', type: 'text', labelKey: 'ui.deliveryPlace', required: true, suggestionKey: 'logisticsLocations' },
          { name: 'cmr', type: 'text', labelKey: 'ui.cmr', required: true },
          { name: 'incoterm', type: 'select', labelKey: 'ui.incoterm', required: true, optionSource: 'incoterms' }
        ],
        detail: [
          { name: 'articleCode', type: 'text', labelKey: 'ui.articleCode' },
          { name: 'containerCode', type: 'text', labelKey: 'ui.containerCode' },
          { name: 'taric', type: 'text', labelKey: 'ui.taric' },
          { name: 'goodsDescription', type: 'textarea', labelKey: 'ui.goodsDescription', required: true, full: true },
          { name: 'packageCount', type: 'number', labelKey: 'ui.packageCount', required: true },
          { name: 'grossWeight', type: 'number', labelKey: 'ui.grossWeight', required: true },
          { name: 'netWeight', type: 'number', labelKey: 'ui.netWeight' },
          { name: 'cbm', type: 'number', labelKey: 'ui.cbm' },
          { name: 'linearMeters', type: 'number', labelKey: 'ui.linearMeters' },
          { name: 'booking', type: 'text', labelKey: 'ui.booking' }
        ],
        notes: sharedNotes
      }
    },
    road_export: {
      group: 'road',
      tabs: {
        practice: [
          { name: 'shipper', type: 'text', labelKey: 'ui.sender', required: true },
          { name: 'client', type: 'derived', labelKey: 'ui.clientRequired' },
          { name: 'consignee', type: 'text', labelKey: 'ui.consignee', required: true },
          { name: 'carrier', type: 'text', labelKey: 'ui.carrier', required: true, suggestionKey: 'carriers' },
          { name: 'originDest', type: 'text', labelKey: 'ui.originDestination' },
          { name: 'pickupDate', type: 'date', labelKey: 'ui.pickupDate', required: true },
          { name: 'deliveryDate', type: 'date', labelKey: 'ui.deliveryDate', required: true },
          { name: 'vehicleType', type: 'text', labelKey: 'ui.vehicleType', required: true, suggestionKey: 'vehicleTypes' },
          { name: 'plateDriver', type: 'text', labelKey: 'ui.plateDriver' },
          { name: 'pickupPlace', type: 'text', labelKey: 'ui.pickupPlace', required: true, suggestionKey: 'logisticsLocations' },
          { name: 'deliveryPlace', type: 'text', labelKey: 'ui.deliveryPlace', required: true, suggestionKey: 'logisticsLocations' },
          { name: 'cmr', type: 'text', labelKey: 'ui.cmr', required: true },
          { name: 'incoterm', type: 'select', labelKey: 'ui.incoterm', required: true, optionSource: 'incoterms' }
        ],
        detail: [
          { name: 'articleCode', type: 'text', labelKey: 'ui.articleCode' },
          { name: 'containerCode', type: 'text', labelKey: 'ui.containerCode' },
          { name: 'taric', type: 'text', labelKey: 'ui.taric' },
          { name: 'goodsDescription', type: 'textarea', labelKey: 'ui.goodsDescription', required: true, full: true },
          { name: 'packageCount', type: 'number', labelKey: 'ui.packageCount', required: true },
          { name: 'grossWeight', type: 'number', labelKey: 'ui.grossWeight', required: true },
          { name: 'netWeight', type: 'number', labelKey: 'ui.netWeight' },
          { name: 'cbm', type: 'number', labelKey: 'ui.cbm' },
          { name: 'linearMeters', type: 'number', labelKey: 'ui.linearMeters' },
          { name: 'booking', type: 'text', labelKey: 'ui.booking' }
        ],
        notes: sharedNotes
      }
    },
    warehouse: {
      group: 'warehouse',
      tabs: {
        practice: [
          { name: 'client', type: 'derived', labelKey: 'ui.clientRequired' },
          { name: 'warehouseContact', type: 'text', labelKey: 'ui.clientContact' },
          { name: 'originDest', type: 'text', labelKey: 'ui.originDestination', required: true, suggestionKey: 'logisticsLocations' },
          { name: 'movementDirection', type: 'select', labelKey: 'ui.movementDirection', required: true, options: ['ENTRATA', 'USCITA'] },
          { name: 'lots', type: 'text', labelKey: 'ui.lots', required: true },
          { name: 'deposit', type: 'text', labelKey: 'ui.deposit', required: true, suggestionKey: 'deposits', hintKey: false },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOffice', suggestionKey: 'customsOffices' },
          { name: 'linkedTo', type: 'text', labelKey: 'ui.linkedTo', suggestionKey: 'warehouseLinks', hintKey: false },
          { name: 'baseQuotation', type: 'text', labelKey: 'ui.baseQuotation' },
          { name: 'plateDriver', type: 'text', labelKey: 'ui.plateDriver' }
        ],
        detail: [
          { name: 'articleCode', type: 'text', labelKey: 'ui.articleCode' },
          { name: 'containerCode', type: 'text', labelKey: 'ui.containerCode' },
          { name: 'taric', type: 'text', labelKey: 'ui.taric' },
          { name: 'goodsDescription', type: 'textarea', labelKey: 'ui.goodsDescription', required: true, full: true },
          { name: 'packageCount', type: 'number', labelKey: 'ui.packageCount', required: true },
          { name: 'grossWeight', type: 'number', labelKey: 'ui.grossWeight', required: true },
          { name: 'netWeight', type: 'number', labelKey: 'ui.netWeight' },
          { name: 'cbm', type: 'number', labelKey: 'ui.cbm' },
          { name: 'linearMeters', type: 'number', labelKey: 'ui.linearMeters' },
          { name: 'vgm', type: 'text', labelKey: 'ui.vgm' }
        ],
        notes: sharedNotes
      }
    }
  };


  function mergeDirectoryList(defaultValues, overrideValues) {
    const fallbackValues = Array.isArray(defaultValues) ? defaultValues : [];
    const customValues = Array.isArray(overrideValues) ? overrideValues : [];
    if (!customValues.length) return [...fallbackValues];
    const combined = [...fallbackValues, ...customValues];
    const hasObjects = combined.some((item) => item && typeof item === 'object' && !Array.isArray(item));

    if (hasObjects) {
      const seen = new Set();
      return combined
        .map((item) => normalizeOptionEntry(item))
        .filter(Boolean)
        .filter((entry) => {
          const key = String(entry.value || '').trim().toUpperCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    }

    const seen = new Set();
    return combined
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .filter((item) => {
        const key = item.toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function appendUniqueFields(schemaKey, tabKey, fieldsToAppend) {
    const schema = schemas[schemaKey];
    if (!schema || !schema.tabs || !Array.isArray(schema.tabs[tabKey]) || !Array.isArray(fieldsToAppend)) return;
    const knownNames = new Set(schema.tabs[tabKey].map((field) => field && field.name).filter(Boolean));
    fieldsToAppend.forEach((field) => {
      if (!field || !field.name || knownNames.has(field.name)) return;
      schema.tabs[tabKey].push({ ...field });
      knownNames.add(field.name);
    });
  }

  function moveFieldAfter(schemaKey, tabKey, fieldName, anchorFieldName) {
    const schema = schemas[schemaKey];
    if (!schema || !schema.tabs || !Array.isArray(schema.tabs[tabKey])) return;
    const fields = schema.tabs[tabKey];
    const fieldIndex = fields.findIndex((field) => field && field.name === fieldName);
    const anchorIndex = fields.findIndex((field) => field && field.name === anchorFieldName);
    if (fieldIndex === -1 || anchorIndex === -1 || fieldIndex === anchorIndex) return;
    const [field] = fields.splice(fieldIndex, 1);
    const targetIndex = fields.findIndex((entry) => entry && entry.name === anchorFieldName);
    fields.splice(targetIndex + 1, 0, field);
  }

  const seaSharedPracticeHardeningFields = [
    { name: 'correspondent', type: 'text', labelKey: 'ui.correspondent' },
    { name: 'insurance', type: 'text', labelKey: 'ui.insurance' },
    { name: 'foreignInvoice', type: 'text', labelKey: 'ui.foreignInvoice' },
    { name: 'invoiceAmount', type: 'number', labelKey: 'ui.invoiceAmount' },
    { name: 'invoiceCurrency', type: 'select', labelKey: 'ui.invoiceCurrency', suggestionKey: 'currencies' },
    { name: 'deposit', type: 'text', labelKey: 'ui.deposit', suggestionKey: 'deposits', hintKey: false },
    { name: 'terminalPickup', type: 'text', labelKey: 'ui.terminalPickup', suggestionKey: 'seaTerminals' },
    { name: 'terminalDelivery', type: 'text', labelKey: 'ui.terminalDelivery', suggestionKey: 'seaTerminals' },
    { name: 'performedDate', type: 'date', labelKey: 'ui.performedDate' },
    { name: 'unloadingDate', type: 'date', labelKey: 'ui.unloadingDate' },
    { name: 'fumigation', type: 'text', labelKey: 'ui.fumigation' },
    { name: 'salesOwner', type: 'text', labelKey: 'ui.salesOwner' },
    { name: 'additionalFigures', type: 'text', labelKey: 'ui.additionalFigures' },
    { name: 'transporter', type: 'text', labelKey: 'ui.transporter' },
    { name: 'bolla', type: 'text', labelKey: 'ui.bolla' },
    { name: 'appraisalCession', type: 'text', labelKey: 'ui.appraisalCession' },
    { name: 'linkedTo', type: 'text', labelKey: 'ui.linkedTo', suggestionKey: 'warehouseLinks', hintKey: false },
    { name: 'deliveryCity', type: 'text', labelKey: 'ui.deliveryCity' },
    { name: 'additionalReference', type: 'text', labelKey: 'ui.additionalReference' },
    { name: 'tags', type: 'text', labelKey: 'ui.tags' }
  ];

  appendUniqueFields('sea_import', 'practice', [
    ...seaSharedPracticeHardeningFields,
    { name: 'sender', type: 'text', labelKey: 'ui.sender' }
  ]);

  appendUniqueFields('sea_export', 'practice', [
    { name: 'clientContact', type: 'text', labelKey: 'ui.clientContact' },
    { name: 'clientAgency', type: 'text', labelKey: 'ui.agency' },
    ...seaSharedPracticeHardeningFields
  ]);

  moveFieldAfter('sea_import', 'practice', 'incoterm', 'terminalDelivery');
  moveFieldAfter('sea_export', 'practice', 'incoterm', 'terminalDelivery');

  function getPracticeConfig(companyConfig) {
    const config = companyConfig && typeof companyConfig === 'object' ? companyConfig.practiceConfig || {} : {};
    const overrideDirectories = config.directories || {};
    const directoryKeys = Array.from(new Set([
      ...Object.keys(defaultPracticeConfig.directories || {}),
      ...Object.keys(overrideDirectories)
    ]));
    const mergedDirectories = {};

    directoryKeys.forEach((key) => {
      mergedDirectories[key] = mergeDirectoryList(defaultPracticeConfig.directories[key], overrideDirectories[key]);
    });

    return {
      incotermProfiles: { ...defaultPracticeConfig.incotermProfiles, ...(config.incotermProfiles || {}) },
      directories: mergedDirectories
    };
  }

  function getSchema(type) {
    return schemas[type] || null;
  }

  function getGroup(type) {
    const schema = getSchema(type);
    return schema ? schema.group : '';
  }

  function getCategoryOptions(type) {
    return Array.isArray(categoryMap[type]) ? [...categoryMap[type]] : [];
  }

  function getIncotermOptions(type, companyConfig) {
    const group = getGroup(type);
    const config = getPracticeConfig(companyConfig);
    const profile = config.incotermProfiles[group];
    return Array.isArray(profile) && profile.length ? [...profile] : [...incoterms2020];
  }


  function pickOptionText(source, fallback = '') {
    if (source === null || source === undefined) return String(fallback || '').trim();
    if (typeof source === 'string' || typeof source === 'number' || typeof source === 'boolean') {
      return String(source).trim();
    }
    if (Array.isArray(source)) {
      for (const item of source) {
        const resolved = pickOptionText(item, '');
        if (resolved) return resolved;
      }
      return String(fallback || '').trim();
    }
    if (typeof source === 'object') {
      const candidates = [
        source.displayValue,
        source.label,
        source.value,
        source.code,
        source.city,
        source.name,
        source.id
      ];
      for (const candidate of candidates) {
        const resolved = pickOptionText(candidate, '');
        if (resolved) return resolved;
      }
    }
    return String(fallback || '').trim();
  }

  function normalizeOptionEntry(option) {
    if (option === null || option === undefined) return null;
    if (typeof option === 'string' || typeof option === 'number' || typeof option === 'boolean') {
      const value = String(option).trim();
      return value ? { value, label: value, displayValue: value, aliases: [value] } : null;
    }
    if (typeof option === 'object') {
      const value = pickOptionText(option.value, '') || pickOptionText(option.code, '') || pickOptionText(option.name, '');
      if (!value) return null;
      const label = pickOptionText(option.label, '') || pickOptionText(option.city, '') || pickOptionText(option.name, '') || value;
      const code = pickOptionText(option.code, '');
      const city = pickOptionText(option.city, '');
      const displayValue = pickOptionText(option.displayValue, '') || (label && code ? `${label} · ${code}` : label || value);
      const aliasSource = Array.isArray(option.aliases) ? option.aliases : [];
      const aliases = Array.from(new Set([
        value,
        label,
        displayValue,
        code,
        city,
        ...aliasSource.map((item) => pickOptionText(item, ''))
      ].map((item) => String(item || '').trim()).filter(Boolean)));
      return { value, label, displayValue, aliases };
    }
    return null;
  }

  function getFieldOptions(type, field, companyConfig) {
    if (!field) return [];
    if (field.optionSource === 'incoterms' || field.name === 'incoterm') {
      return getIncotermOptions(type, companyConfig);
    }
    if (Array.isArray(field.options) && field.options.length) return [...field.options];
    if (field.suggestionKey) {
      const config = getPracticeConfig(companyConfig);
      const values = config.directories[field.suggestionKey];
      return Array.isArray(values) ? [...values] : [];
    }
    return [];
  }

  function getFieldOptionEntries(type, field, companyConfig) {
    return getFieldOptions(type, field, companyConfig)
      .map((option) => normalizeOptionEntry(option))
      .filter(Boolean);
  }

  function getFields(type) {
    const schema = getSchema(type);
    if (!schema) return [];
    return Object.entries(schema.tabs).flatMap(([tabKey, tabFields]) => (tabFields || []).map((field) => ({ ...field, tab: tabKey })));
  }

  function getField(type, fieldName) {
    return getFields(type).find((field) => field.name === fieldName) || null;
  }

  function fieldLabel(field) {
    if (!field) return '';
    return I18N.t(field.labelKey, field.name || '');
  }

  function normalizeSuggestedValue(type, field, rawValue, companyConfig) {
    const clean = String(rawValue || '').trim();
    if (!clean || !field || !field.suggestionKey) return clean;
    const upper = clean.toUpperCase();
    const match = getFieldOptionEntries(type, field, companyConfig).find((entry) =>
      (entry.aliases || []).some((alias) => String(alias || '').trim().toUpperCase() === upper)
    );
    return match ? match.value : clean;
  }

  function isEmptyValue(value) {
    if (Array.isArray(value)) return value.length === 0;
    return String(value || '').trim() === '';
  }

  function buildError(fieldName, tab, type, messageKey, fallbackMessage, overrideLabel) {
    const field = getField(type, fieldName);
    return {
      field: fieldName,
      tab,
      label: overrideLabel || fieldLabel(field) || fieldName,
      message: I18N.t(messageKey, fallbackMessage)
    };
  }

  function validateDraft(draft, companyConfig) {
    const errors = [];
    const type = draft && draft.practiceType ? draft.practiceType : '';
    const dynamicData = (draft && draft.dynamicData) || {};

    if (!type) {
      errors.push({ field: 'practiceType', tab: 'identity', label: I18N.t('ui.practiceType', 'Tipo pratica'), message: I18N.t('ui.validationPracticeTypeRequired', 'Seleziona il tipo pratica.') });
    }
    if (isEmptyValue(draft && draft.clientName)) {
      errors.push({ field: 'clientName', tab: 'identity', label: I18N.t('ui.clientEditable', 'Cliente'), message: I18N.t('ui.validationClientRequired', 'Compila il cliente.') });
    }
    if (isEmptyValue(draft && draft.practiceDate)) {
      errors.push({ field: 'practiceDate', tab: 'identity', label: I18N.t('ui.practiceDate', 'Data pratica'), message: I18N.t('ui.validationPracticeDateRequired', 'Compila la data pratica.') });
    }

    if (!type) return { valid: errors.length === 0, errors };

    const schema = getSchema(type);
    if (!schema) {
      errors.push({ field: 'practiceType', tab: 'identity', label: I18N.t('ui.practiceType', 'Tipo pratica'), message: I18N.t('ui.validationInvalidPracticeType', 'Tipologia pratica non riconosciuta.') });
      return { valid: false, errors };
    }

    const allowedCategories = getCategoryOptions(type);
    if (allowedCategories.length && isEmptyValue(draft && draft.category)) {
      errors.push({ field: 'category', tab: 'identity', label: I18N.t('ui.categoryLabel', 'Categoria'), message: I18N.t('ui.validationCategoryRequired', 'Seleziona la categoria coerente con il tipo pratica.') });
    }
    if (!isEmptyValue(draft && draft.category) && allowedCategories.length && !allowedCategories.includes(draft.category)) {
      errors.push({ field: 'category', tab: 'identity', label: I18N.t('ui.categoryLabel', 'Categoria'), message: I18N.t('ui.validationCategoryInvalid', 'Categoria non coerente con la tipologia selezionata.') });
    }

    getFields(type).forEach((field) => {
      if (field.type === 'derived' || field.type === 'select-derived') return;
      const value = dynamicData[field.name];

      if (field.required && isEmptyValue(value)) {
        errors.push(buildError(field.name, field.tab, type, 'ui.validationFieldRequired', `${fieldLabel(field)} obbligatorio.`));
        return;
      }

      if (field.type === 'number' && !isEmptyValue(value)) {
        const numericValue = Number(value);
        if (Number.isNaN(numericValue) || numericValue < 0) {
          errors.push(buildError(field.name, field.tab, type, 'ui.validationPositiveNumber', 'Inserisci un valore numerico valido e non negativo.'));
        }
      }

      if (field.type === 'select' && !isEmptyValue(value)) {
        const allowed = getFieldOptions(type, field, companyConfig);
        if (allowed.length && !allowed.includes(value)) {
          errors.push(buildError(field.name, field.tab, type, 'ui.validationSelectInvalid', 'Seleziona un valore previsto dalla configurazione.'));
        }
      }
    });

    if (type.startsWith('sea_')) {
      if (draft.category === 'FCL-FULL' && isEmptyValue(dynamicData.containerCode)) {
        errors.push(buildError('containerCode', 'detail', type, 'ui.validationContainerRequired', 'Il container è obbligatorio per le pratiche FCL.'));
      }
      if (draft.category === 'FCL-FULL' && isEmptyValue(dynamicData.policyNumber || dynamicData.mbl)) {
        errors.push(buildError('policyNumber', 'practice', type, 'ui.validationPolicyNumberRequired', 'Compila la polizza per le pratiche FCL.'));
      }
      if (draft.category === 'LCL-GROUPAGE' && isEmptyValue(dynamicData.hbl)) {
        errors.push(buildError('hbl', 'practice', type, 'ui.validationHblRequired', "Compila l'House BL per le pratiche LCL / groupage."));
      }
      if (!isEmptyValue(dynamicData.freightAmount) && isEmptyValue(dynamicData.freightCurrency)) {
        errors.push(buildError('freightCurrency', 'practice', type, 'ui.validationFreightCurrencyRequired', 'Se indichi il nolo, seleziona anche la valuta.'));
      }
      if (!isEmptyValue(dynamicData.vesselExchangeRate) && isEmptyValue(dynamicData.vesselExchangeCurrency)) {
        errors.push(buildError('vesselExchangeCurrency', 'practice', type, 'ui.validationExchangeCurrencyRequired', 'Se indichi il cambio nave, seleziona anche la valuta.'));
      }
    }

    if (type.startsWith('air_') && draft.category === 'AIR-CONSOL' && isEmptyValue(dynamicData.hawb)) {
      errors.push(buildError('hawb', 'practice', type, 'ui.validationHawbRequired', "Compila l'HAWB per le spedizioni aeree in consol."));
    }

    if (type.startsWith('road_')) {
      const pickupDate = dynamicData.pickupDate;
      const deliveryDate = dynamicData.deliveryDate;
      if (!isEmptyValue(pickupDate) && !isEmptyValue(deliveryDate) && deliveryDate < pickupDate) {
        errors.push(buildError('deliveryDate', 'practice', type, 'ui.validationDeliveryAfterPickup', 'La consegna non può essere precedente alla presa.'));
      }
    }

    if (type === 'warehouse' && draft.category === 'DEPOSITO DOGANALE' && isEmptyValue(dynamicData.customsOffice)) {
      errors.push(buildError('customsOffice', 'practice', type, 'ui.validationWarehouseCustomsRequired', 'Per il deposito doganale indica la dogana di riferimento.'));
    }

    const uniqueErrors = [];
    const seenErrors = new Set();
    errors.forEach((error) => {
      const key = `${error.tab || ''}|${error.field || ''}|${error.message || ''}`;
      if (seenErrors.has(key)) return;
      seenErrors.add(key);
      uniqueErrors.push(error);
    });

    return { valid: uniqueErrors.length === 0, errors: uniqueErrors };
  }

  return {
    incoterms2020,
    schemas,
    defaultPracticeConfig,
    getPracticeConfig,
    getSchema,
    getGroup,
    getFields,
    getField,
    getFieldOptions,
    getFieldOptionEntries,
    getCategoryOptions,
    getIncotermOptions,
    normalizeSuggestedValue,
    validateDraft
  };
})();
