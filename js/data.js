window.KedrixOneData = (() => {
  'use strict';

  function initialState() {
    return {
      currentRoute: 'dashboard',
      selectedPracticeId: 'PR-2026-001',
      filterText: '',
      statusFilter: 'Tutti',
      expandedModules: ['practices', 'master-data', 'documents', 'tracking'],
      settingsModuleKey: 'practices',
      language: 'it',
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
        ]
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
      practices: [
        { id: 'PR-2026-001', reference: 'KX-IMP-0001', client: 'Michelin Italia', type: 'Import', port: 'Genova', eta: '2026-04-01', priority: 'Alta', status: 'In attesa documenti', notes: 'Packing list aggiornata da richiedere al fornitore.' },
        { id: 'PR-2026-002', reference: 'KX-EXP-0002', client: 'Monge & C. S.p.A.', type: 'Export', port: 'Fossano', eta: '2026-04-03', priority: 'Media', status: 'Operativa', notes: 'Verificare ritiro e conferma mezzo.' },
        { id: 'PR-2026-003', reference: 'KX-IMP-0003', client: 'Aprica S.p.A.', type: 'Import', port: 'La Spezia', eta: '2026-03-31', priority: 'Alta', status: 'Sdoganamento', notes: 'Verifica operativa con dogana.' }
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