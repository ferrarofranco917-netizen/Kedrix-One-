window.KedrixOnePracticeSchemas = (() => {
  'use strict';

  const I18N = window.KedrixOneI18N;

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
      airports: ['MXP Milano Malpensa', 'FCO Roma Fiumicino', 'CDG Paris Charles de Gaulle', 'PVG Shanghai Pudong', 'HKG Hong Kong'],
      shippingCompanies: ['MSC', 'Maersk', 'CMA CGM', 'Hapag-Lloyd', 'ONE'],
      airlines: ['Lufthansa Cargo', 'Air France KLM Martinair Cargo', 'Qatar Airways Cargo', 'Emirates SkyCargo'],
      carriers: ['TERCOM', 'BRT', 'DHL Freight', 'DB Schenker', 'Lannutti'],
      vehicleTypes: ['Bilico centinato', 'Motrice', 'Furgone', 'Container chassis', 'Cassonato'],
      logisticsLocations: ['Fossano', 'Torino', 'Genova', 'Milano', 'Lione'],
      seaPortLocodes: [
        { value: 'ITGOA - Genova', label: 'Genova', aliases: ['Genova', 'ITGOA'] },
        { value: 'ITSPE - La Spezia', label: 'La Spezia', aliases: ['La Spezia', 'ITSPE'] },
        { value: 'ITTRS - Trieste', label: 'Trieste', aliases: ['Trieste', 'ITTRS'] },
        { value: 'ITLIV - Livorno', label: 'Livorno', aliases: ['Livorno', 'ITLIV'] },
        { value: 'NLRTM - Rotterdam', label: 'Rotterdam', aliases: ['Rotterdam', 'NLRTM'] },
        { value: 'CNSHA - Shanghai', label: 'Shanghai', aliases: ['Shanghai', 'CNSHA'] },
        { value: 'CNNGB - Ningbo', label: 'Ningbo', aliases: ['Ningbo', 'CNNGB'] },
        { value: 'CNYTN - Yantian', label: 'Yantian', aliases: ['Yantian', 'CNYTN'] },
        { value: 'SGSIN - Singapore', label: 'Singapore', aliases: ['Singapore', 'SGSIN'] },
        { value: 'FRLEH - Le Havre', label: 'Le Havre', aliases: ['Le Havre', 'FRLEH'] }
      ],
      seaTerminals: ["PSA Genova Pra\'", 'SECH Genova', 'VTE Voltri', 'Terminal del Golfo La Spezia', 'Vado Gateway'],
      originDirectories: ['ITALIA', 'CINA', 'TURCHIA', 'USA', 'FRANCIA', 'GERMANIA'],
      destinationDirectories: ['ITALIA', 'CINA', 'TURCHIA', 'USA', 'FRANCIA', 'GERMANIA'],
      currencies: ['EUR', 'USD', 'GBP', 'CHF', 'CNY', 'JPY'],
      deposits: ['Magazzino interno', 'Deposito doganale', 'Transit point', 'Cross-dock'],
      warehouseLinks: ['Pratica import', 'Pratica export', 'Transito interno', 'Deposito temporaneo'],
      customsOffices: ['Genova Porto', 'La Spezia', 'Torino', 'Milano 1', 'Vado Ligure']
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
          { name: 'mbl', type: 'text', labelKey: 'ui.mbl' },
          { name: 'hbl', type: 'text', labelKey: 'ui.hbl' },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOffice', required: true, suggestionKey: 'customsOffices' },
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
          { name: 'mbl', type: 'text', labelKey: 'ui.mbl' },
          { name: 'hbl', type: 'text', labelKey: 'ui.hbl' },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOffice', required: true, suggestionKey: 'customsOffices' },
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
          { name: 'airportDeparture', type: 'text', labelKey: 'ui.airportDeparture', required: true, suggestionKey: 'airports' },
          { name: 'airportDestination', type: 'text', labelKey: 'ui.airportDestination', required: true, suggestionKey: 'airports' },
          { name: 'mawb', type: 'text', labelKey: 'ui.mawb', required: true },
          { name: 'hawb', type: 'text', labelKey: 'ui.hawb' },
          { name: 'arrivalDate', type: 'date', labelKey: 'ui.arrivalDate', required: true },
          { name: 'booking', type: 'text', labelKey: 'ui.booking' },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOperator', required: true, suggestionKey: 'customsOffices' },
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
          { name: 'airportDeparture', type: 'text', labelKey: 'ui.airportDeparture', required: true, suggestionKey: 'airports' },
          { name: 'airportDestination', type: 'text', labelKey: 'ui.airportDestination', required: true, suggestionKey: 'airports' },
          { name: 'mawb', type: 'text', labelKey: 'ui.mawb', required: true },
          { name: 'hawb', type: 'text', labelKey: 'ui.hawb' },
          { name: 'departureDate', type: 'date', labelKey: 'ui.departureDate', required: true },
          { name: 'booking', type: 'text', labelKey: 'ui.booking' },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOperator', required: true, suggestionKey: 'customsOffices' },
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
          { name: 'deposit', type: 'text', labelKey: 'ui.deposit', required: true, suggestionKey: 'deposits' },
          { name: 'customsOffice', type: 'text', labelKey: 'ui.customsOffice', suggestionKey: 'customsOffices' },
          { name: 'linkedTo', type: 'text', labelKey: 'ui.linkedTo', suggestionKey: 'warehouseLinks' },
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

  function getPracticeConfig(companyConfig) {
    const config = companyConfig && typeof companyConfig === 'object' ? companyConfig.practiceConfig || {} : {};
    return {
      incotermProfiles: { ...defaultPracticeConfig.incotermProfiles, ...(config.incotermProfiles || {}) },
      directories: { ...defaultPracticeConfig.directories, ...(config.directories || {}) }
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


  function normalizeOptionEntry(option) {
    if (option === null || option === undefined) return null;
    if (typeof option === 'string') {
      const value = option.trim();
      return value ? { value, label: value, aliases: [value] } : null;
    }
    if (typeof option === 'object') {
      const value = String(option.value || option.code || option.name || '').trim();
      if (!value) return null;
      const label = String(option.label || option.name || value).trim() || value;
      const aliases = Array.from(new Set([
        value,
        label,
        ...(Array.isArray(option.aliases) ? option.aliases : [])
      ].map((item) => String(item || '').trim()).filter(Boolean)));
      return { value, label, aliases };
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
      if (draft.category === 'FCL-FULL' && isEmptyValue(dynamicData.mbl)) {
        errors.push(buildError('mbl', 'practice', type, 'ui.validationMblRequired', 'Compila il Master BL per le pratiche FCL.'));
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
    getCategoryOptions,
    getIncotermOptions,
    validateDraft
  };
})();
