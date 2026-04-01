window.KedrixOneData = (() => {
  'use strict';

  function initialState() {
    return {
      currentRoute: 'dashboard',
      selectedPracticeId: 'PR-2026-001',
      filterText: '',
      practiceSearchQuery: '',
      statusFilter: 'Tutti',
      expandedModules: ['practices', 'master-data', 'documents', 'tracking'],
      settingsModuleKey: 'practices',
      settingsClientId: 'CL-001',
      language: 'it',
      practiceTab: 'practice',
      draftPractice: {
        editingPracticeId: '',
        practiceType: '',
        clientId: '',
        clientName: '',
        practiceDate: new Date().toISOString().slice(0, 10),
        category: '',
        status: 'In attesa documenti',
        generatedReference: '',
        dynamicData: {}
      },
      companyConfig: {
        id: 'CMP-001',
        name: 'Kedrix Demo Logistics',
        plan: 'base',
        purchasedModules: ['crm', 'tracking', 'administration', 'bi'],
        disabledModules: [],
        purchasedSubmodules: [
          'crm/agenda-crm',
          'tracking/container-tracking',
          'tracking/vessel-tracking',
          'administration/fatture-attive',
          'administration/fatture-passive',
          'administration/scadenziario-clienti'
        ],
        disabledSubmodules: [
          'practices/richiesta-fondi',
          'practices/delivery-order'
        ],
        practiceConfig: {
          incotermProfiles: {
            sea: ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DPU', 'DDP'],
            air: ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
            road: ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
            warehouse: ['EXW', 'FCA', 'DAP', 'DPU', 'DDP']
          },
          directories: {
            seaPorts: ['Genova', 'La Spezia', 'Vado Ligure', 'Shanghai', 'Ningbo', 'Yantian'],
            airports: ['MXP Milano Malpensa', 'FCO Roma Fiumicino', 'CDG Paris Charles de Gaulle', 'PVG Shanghai Pudong'],
            shippingCompanies: ['MSC', 'Maersk', 'CMA CGM', 'Hapag-Lloyd'],
            airlines: ['Lufthansa Cargo', 'Air France KLM Martinair Cargo', 'Qatar Airways Cargo'],
            carriers: ['TERCOM', 'BRT', 'DHL Freight', 'DB Schenker'],
            vehicleTypes: ['Bilico centinato', 'Motrice', 'Furgone', 'Container chassis'],
            logisticsLocations: ['Fossano', 'Torino', 'Genova', 'Milano', 'Lione'],
            seaTerminals: ["PSA Genova Pra\'", 'SECH Genova', 'VTE Voltri', 'Terminal del Golfo La Spezia'],
            originDirectories: ['ITALIA', 'CINA', 'TURCHIA', 'USA', 'FRANCIA', 'GERMANIA'],
            destinationDirectories: ['ITALIA', 'CINA', 'TURCHIA', 'USA', 'FRANCIA', 'GERMANIA'],
            currencies: ['EUR', 'USD', 'GBP', 'CHF', 'CNY', 'JPY'],
            deposits: ['Magazzino interno', 'Deposito doganale', 'Transit point'],
            warehouseLinks: ['Pratica import', 'Pratica export', 'Transito interno'],
            customsOffices: ['Genova Porto', 'La Spezia', 'Torino', 'Milano 1']
          }
        }
      },
      users: [
        {
          id: 'USR-001',
          name: 'Franco',
          role: 'sales_manager',
          extraModules: ['crm', 'tracking', 'bi'],
          disabledModules: [],
          extraSubmodules: [
            'practices/booking-d-imbarco',
            'practices/notifica-arrivo-merce',
            'crm/indicatori'
          ],
          disabledSubmodules: ['practices/buono-consegna-merce-aerea']
        },
        {
          id: 'USR-002',
          name: 'Operativo 1',
          role: 'operator',
          extraModules: ['tracking'],
          disabledModules: ['crm', 'administration', 'bi'],
          extraSubmodules: [
            'practices/elenco-pratiche',
            'tracking/container-tracking'
          ],
          disabledSubmodules: [
            'practices/booking-d-imbarco',
            'practices/viaggi-nave',
            'tracking/air-cargo-tracking'
          ]
        },
        {
          id: 'USR-003',
          name: 'Amministrazione',
          role: 'finance',
          extraModules: ['administration'],
          disabledModules: ['crm'],
          extraSubmodules: [
            'administration/fatture-attive',
            'administration/fatture-passive',
            'administration/scadenziario-clienti',
            'administration/scadenziario-fornitori'
          ],
          disabledSubmodules: []
        }
      ],
      activeUserId: 'USR-001',
      clients: [
        {
          id: 'CL-001',
          name: 'Michelin Italia',
          code: 'MI',
          city: 'Torino',
          numberingRule: {
            prefix: 'MI',
            separator: '-',
            includeYear: true,
            resetEveryYear: true,
            nextNumber: 2,
            lastYear: 2026
          }
        },
        {
          id: 'CL-002',
          name: 'Aprica S.p.A.',
          code: 'AP',
          city: 'Milano',
          numberingRule: {
            prefix: 'AP',
            separator: '-',
            includeYear: true,
            resetEveryYear: true,
            nextNumber: 4,
            lastYear: 2026
          }
        },
        {
          id: 'CL-003',
          name: 'Monge & C. S.p.A.',
          code: 'MO',
          city: 'Fossano',
          numberingRule: {
            prefix: 'MO',
            separator: '-',
            includeYear: true,
            resetEveryYear: true,
            nextNumber: 3,
            lastYear: 2026
          }
        }
      ],
      practices: [
        {
          id: 'PR-2026-001',
          reference: 'MI-2026-1',
          clientId: 'CL-001',
          client: 'Michelin Italia',
          clientName: 'Michelin Italia',
          practiceType: 'sea_import',
          practiceTypeLabel: 'Mare Import',
          schemaGroup: 'sea',
          category: 'FCL-FULL',
          practiceDate: '2026-04-01',
          status: 'In attesa documenti',
          priority: 'Alta',
          importer: 'Michelin Italia',
          consignee: 'Michelin Italia',
          portLoading: 'Shanghai',
          portDischarge: 'Genova',
          containerCode: 'MSCU1234567',
          packageCount: '18',
          grossWeight: '22100',
          goodsDescription: 'Pneumatici automotive',
          booking: 'BK-SEA-0901',
          customsOffice: 'Genova Porto',
          eta: '2026-04-01',
          type: 'Import',
          port: 'Genova',
          notes: 'Packing list aggiornata da richiedere al fornitore.',
          terminal: "PSA Genova Pra\'",
          mbl: 'MSCU-MBL-7781',
          dynamicData: {
            importer: 'Michelin Italia',
            consignee: 'Michelin Italia',
            company: 'MSC',
            portLoading: 'Shanghai',
            portDischarge: 'Genova',
            originRef: 'CINA',
            destinationRef: 'ITALIA',
            vesselExchangeRate: '1',
            vesselExchangeCurrency: 'EUR',
            terminal: "PSA Genova Pra\'",
            arrivalDate: '2026-04-01',
            freightAmount: '2450',
            freightCurrency: 'USD',
            booking: 'BK-SEA-0901',
            policyNumber: 'POL-7781',
            policyOriginals: '3',
            policyCopies: '2',
            mbl: 'MSCU-MBL-7781',
            customsOffice: 'Genova Porto',
            baseQuotation: 'Q-2026-041',
            incoterm: 'CIF',
            goodsDescription: 'Pneumatici automotive',
            packageCount: '18',
            grossWeight: '22100',
            containerCode: 'MSCU1234567'
          },
          dynamicLabels: {
            importer: 'Importatore', consignee: 'Destinatario', company: 'Compagnia marittima',
            portLoading: 'Porto di imbarco', portDischarge: 'Porto di sbarco', originRef: 'Origine', destinationRef: 'Destinazione',
            vesselExchangeRate: 'Cambio nave', vesselExchangeCurrency: 'Valuta cambio nave', terminal: 'Terminal',
            arrivalDate: 'Data arrivo', freightAmount: 'Nolo', freightCurrency: 'Valuta nolo', booking: 'Booking',
            policyNumber: 'Polizza', policyOriginals: 'Originali', policyCopies: 'Copie', mbl: 'MBL', customsOffice: 'Dogana',
            baseQuotation: 'Quotaz. base / Des. agg.', incoterm: 'Incoterm', goodsDescription: 'Descrizione merce', packageCount: 'Colli',
            grossWeight: 'Peso lordo', containerCode: 'Container'
          }
        },
        {
          id: 'PR-2026-002',
          reference: 'MO-2026-2',
          clientId: 'CL-003',
          client: 'Monge & C. S.p.A.',
          clientName: 'Monge & C. S.p.A.',
          practiceType: 'road_export',
          practiceTypeLabel: 'Terra Export',
          schemaGroup: 'road',
          category: 'GROUPAGE',
          practiceDate: '2026-04-03',
          status: 'Operativa',
          priority: 'Media',
          importer: 'Monge & C. S.p.A.',
          consignee: 'Cliente Francia',
          portLoading: 'Fossano',
          portDischarge: 'Lione',
          containerCode: '',
          packageCount: '12',
          grossWeight: '8200',
          goodsDescription: 'Pet food palletizzato',
          booking: 'BK-RD-4412',
          customsOffice: 'Torino',
          eta: '2026-04-03',
          type: 'Export',
          port: 'Fossano',
          notes: 'Verificare ritiro e conferma mezzo.',
          carrier: 'TERCOM',
          cmr: 'CMR-EXPORT-4412',
          dynamicData: {
            shipper: 'Monge & C. S.p.A.',
            consignee: 'Cliente Francia',
            carrier: 'TERCOM',
            pickupDate: '2026-04-02',
            deliveryDate: '2026-04-03',
            vehicleType: 'Bilico centinato',
            pickupPlace: 'Fossano',
            deliveryPlace: 'Lione',
            cmr: 'CMR-EXPORT-4412',
            incoterm: 'DAP',
            goodsDescription: 'Pet food palletizzato',
            packageCount: '12',
            grossWeight: '8200',
            booking: 'BK-RD-4412'
          },
          dynamicLabels: {
            shipper: 'Mittente', consignee: 'Destinatario', carrier: 'Vettore', pickupDate: 'Data ritiro',
            deliveryDate: 'Data consegna', vehicleType: 'Mezzo', pickupPlace: 'Luogo ritiro',
            deliveryPlace: 'Luogo consegna', cmr: 'CMR', incoterm: 'Incoterm',
            goodsDescription: 'Descrizione merce', packageCount: 'Colli', grossWeight: 'Peso lordo', booking: 'Booking'
          }
        },
        {
          id: 'PR-2026-003',
          reference: 'AP-2026-3',
          clientId: 'CL-002',
          client: 'Aprica S.p.A.',
          clientName: 'Aprica S.p.A.',
          practiceType: 'sea_import',
          practiceTypeLabel: 'Mare Import',
          schemaGroup: 'sea',
          category: 'LCL-GROUPAGE',
          practiceDate: '2026-03-31',
          status: 'Sdoganamento',
          priority: 'Alta',
          importer: 'Aprica S.p.A.',
          consignee: 'Aprica S.p.A.',
          portLoading: 'Ningbo',
          portDischarge: 'La Spezia',
          containerCode: 'OOLU7654321',
          packageCount: '6',
          grossWeight: '4300',
          goodsDescription: 'Materiale tecnico',
          booking: 'BK-SEA-8812',
          customsOffice: 'La Spezia',
          eta: '2026-03-31',
          type: 'Import',
          port: 'La Spezia',
          notes: 'Verifica operativa con dogana.',
          hbl: 'HBL-APR-9902',
          dynamicData: {
            importer: 'Aprica S.p.A.',
            consignee: 'Aprica S.p.A.',
            company: 'Maersk',
            portLoading: 'Ningbo',
            portDischarge: 'La Spezia',
            arrivalDate: '2026-03-31',
            booking: 'BK-SEA-8812',
            hbl: 'HBL-APR-9902',
            customsOffice: 'La Spezia',
            incoterm: 'FOB',
            goodsDescription: 'Materiale tecnico',
            packageCount: '6',
            grossWeight: '4300',
            containerCode: 'OOLU7654321',
            inspectionFlags: ['ui.verifyDocumentale', 'ui.verifyScanner']
          },
          dynamicLabels: {
            importer: 'Importatore', consignee: 'Destinatario', company: 'Compagnia marittima',
            portLoading: 'Porto di imbarco', portDischarge: 'Porto di sbarco', arrivalDate: 'Data arrivo',
            booking: 'Booking', hbl: 'HBL', customsOffice: 'Dogana', incoterm: 'Incoterm',
            goodsDescription: 'Descrizione merce', packageCount: 'Colli', grossWeight: 'Peso lordo', containerCode: 'Container'
          }
        }
      ],
      operatorLogs: [
        { id: 'LOG-001', when: '31/03/2026, 09:15', practiceId: 'PR-2026-001', text: 'Sollecito inviato al fornitore per documentazione mancante.' },
        { id: 'LOG-002', when: '31/03/2026, 10:05', practiceId: 'PR-2026-003', text: 'Allineamento operativo richiesto per pratica in sdoganamento.' }
      ],
      contacts: [
        { id: 'CNT-001', name: 'Michelin Italia', type: 'Cliente', city: 'Torino' },
        { id: 'CNT-002', name: 'Aprica S.p.A.', type: 'Cliente', city: 'Milano' }
      ]
    };
  }

  return { initialState };
})();