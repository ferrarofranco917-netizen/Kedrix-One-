window.KedrixOneModules = (() => {
  'use strict';

  const U = window.KedrixOneUtils;
  const I = window.KedrixOneI18N;

  const BLUEPRINT = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      description: 'Vista sintetica della piattaforma con segnali operativi, KPI e punti di accesso ai moduli enterprise.',
      category: 'core',
      tierHint: 'base',
      submodules: []
    },
    {
      key: 'practices',
      label: 'Pratiche',
      description: 'Workspace operativo delle spedizioni e delle pratiche con estensione verso documenti, viaggi, notifiche e flussi avanzati.',
      category: 'operations',
      tierHint: 'base',
      submodules: [
        'Pratiche',
        'Gestione pratiche'
      ]
    },
    {
      key: 'quotations',
      label: 'Quotazioni',
      description: 'Modulo commerciale-operativo per offerte, simulazioni, tariffe e gestione preventivi multi-servizio.',
      category: 'commercial',
      tierHint: 'base',
      submodules: []
    },
    {
      key: 'transports',
      label: 'Trasporti',
      description: 'Controllo viaggi, documenti di trasporto, mezzi e pianificazione della rete operativa terrestre.',
      category: 'operations',
      tierHint: 'premium-candidate',
      submodules: [
        'CMR',
        'Buono di ritiro',
        'Lettera di vettura',
        'Giornaliera',
        'Lettere di vettura v2',
        'Scheda di trasporto',
        'Stampa giornaliera',
        'Posizionamento mezzi',
        'Riepilogo percorsi',
        'Viaggi',
        'Ordini',
        'Tipologia tariffe',
        'Trasferte e assenze',
        'Buoni di consegna DDT',
        'Scadenziario mezzi'
      ]
    },
    {
      key: 'warehouse',
      label: 'Magazzino',
      description: 'Architettura per inventario, movimenti, anagrafiche articolo e flussi di fatturazione magazzino.',
      category: 'operations',
      tierHint: 'premium-candidate',
      submodules: [
        'Inventario',
        'Movimenti',
        'Prodotti',
        'Categorie prodotti',
        'Magazzini',
        'Causali',
        'Fatturazione'
      ]
    },
    {
      key: 'crm',
      label: 'CRM',
      description: 'CRM operativo collegato a pratiche, andamento clienti, fatturato, segnali commerciali e lettura manageriale reale.',
      category: 'commercial',
      tierHint: 'premium-candidate',
      submodules: [
        'Agenda CRM',
        'Tipologia operazioni',
        'Mappa CRM',
        'Nominativi',
        'Campagne',
        'Gerarchia agenti',
        'Interessi',
        'Figure',
        'Indicatori'
      ]
    },
    {
      key: 'master-data',
      label: 'Anagrafiche',
      description: 'Mega modulo enterprise per master data condivisi tra pratiche, trasporti, contabilità, dogana, HRM e CRM.',
      category: 'foundation',
      tierHint: 'base',
      submodules: [
        'Ditte',
        'Utenti',
        'Conti correnti',
        'Ditte intrastat',
        'FTP',
        'Zone geografiche',
        'Stampanti termiche',
        'Contabilità master data',
        'Dichiarazioni intento',
        'Stati ordini',
        'Tipologia mezzi',
        'Opzioni mezzi',
        'Resa trasporto',
        'Nazioni',
        'Province',
        'Città',
        'Terminal',
        'Porti',
        'Navi',
        'Direttrici traffico',
        'Tipologia pratiche',
        'Aeroporti',
        'Tipologia container',
        'Tipologie costi',
        'Agenti polizze',
        'Compagnie aeree',
        'Zone',
        'Profili pratiche',
        'Tipologia comunicazioni',
        'Unità di misura',
        'Articoli magazzino',
        'Classi tariffarie',
        'Mezzi',
        'Dogana entities',
        'HRM entities',
        'CRM entities'
      ]
    },
    {
      key: 'documents',
      label: 'Documenti',
      description: 'Hub documentale per preview, note, stampe, categorie e gestioni multiple coerenti con i moduli aziendali.',
      category: 'foundation',
      tierHint: 'base',
      submodules: [
        'Preview',
        'Elenco stampe',
        'Elenco documenti',
        'Note',
        'Categorie',
        'Stampe multiple'
      ]
    },
    {
      key: 'tracking',
      label: 'Tracking',
      description: 'Architettura di monitoraggio multimodale con eventi, eccezioni e collegamenti carrier/vessel/container.',
      category: 'intelligence',
      tierHint: 'premium-candidate',
      submodules: [
        'Container tracking',
        'Vessel tracking',
        'Air cargo tracking',
        'Carrier links',
        'MarineTraffic linking',
        'Tracking events',
        'Exception alerts'
      ]
    },
    {
      key: 'bi',
      label: 'Report / BI',
      description: 'Area analytics con reportistica, statistiche operative e business intelligence orientata a eccezioni e performance.',
      category: 'intelligence',
      tierHint: 'premium-candidate',
      submodules: [
        'Business intelligence',
        'Reportistica',
        'Pratiche strane',
        'Fatture strane',
        'Grafici',
        'Reportistica 2.0',
        'Statistiche',
        'Creazione statistiche',
        'Statistiche v2'
      ]
    },
    {
      key: 'customs',
      label: 'Dogana',
      description: 'Strato specialistico per bolle, intrastat, TARIC/AIDA, depositi, tributi e certificazioni customs-ready.',
      category: 'specialist',
      tierHint: 'premium-candidate',
      submodules: [
        'Flussi intrastat',
        'Bolle doganali',
        'Trasmissione flussi',
        'Calcolo CIN',
        'Importazione TARIC',
        'Intrastat 4.0',
        'Invio intrastat',
        'Deposito doganale',
        'Deposito temp. custodia',
        'Deposito IVA',
        'Riepilogo bolle',
        'Certificati EUR-1 DV1 ATR EUR-MED',
        'Export docs',
        'Dichiaranti',
        'Conti differiti',
        'Tributi',
        'Regimi',
        'Depositi',
        'TARIC',
        'TARIC AIDA',
        'Sezioni doganali',
        'Campi dogana',
        'Condizioni dogana'
      ]
    },
    {
      key: 'administration',
      label: 'Amministrazione / Contabile',
      description: 'Motore amministrativo per cicli attivo/passivo, scadenziari, pagamenti, cambi, commesse e prima nota.',
      category: 'finance',
      tierHint: 'premium-candidate',
      submodules: [
        'Fatture attive',
        'Fatture passive',
        'Scadenziario clienti',
        'Scadenziario fornitori',
        'Pagamenti differiti',
        'Partitario',
        'Cambi e valute',
        'Import pagamenti',
        'Prima nota / registrazione primanota',
        'Commesse',
        'Allegati fatture',
        'Richiesta fondi fornitore'
      ]
    },
    {
      key: 'groupware',
      label: 'Groupware',
      description: 'Collaboration layer per comunicazioni, tempi, HR light, centralino, webmail e servizi interni.',
      category: 'people',
      tierHint: 'premium-candidate',
      submodules: [
        'Contatti',
        'SMS',
        'Calendario',
        'Notifiche',
        'Eventi',
        'Ferie',
        'Turni',
        'Timbrature',
        'Libro unico',
        'Permessi',
        'Ticket pasti',
        'Residui',
        'Rimborsi spese',
        'Anomalie ferie',
        'Centralino',
        'Telefonate',
        'Email',
        'Webmail',
        'Newsletter'
      ]
    },
    {
      key: 'workflow',
      label: 'Workflow',
      description: 'Governance di stati e permessi per i processi interni e il controllo delle transizioni applicative.',
      category: 'governance',
      tierHint: 'premium-candidate',
      submodules: [
        'Stati',
        'Permessi'
      ]
    },
    {
      key: 'admin',
      label: 'Admin',
      description: 'Console tecnica-amministrativa per configurazioni, utilità, ambienti, log, servizi e profili applicativi.',
      category: 'governance',
      tierHint: 'premium-candidate',
      submodules: [
        'Traduzioni',
        'LDAP',
        'Gestione riepiloghi',
        'Sezionali',
        'Template stampa fattura',
        'Account inbox',
        'Widget',
        'IP bannati',
        'Fix',
        'Box calcoli',
        'Profili pratiche eventi',
        'Ambienti',
        'Profili colonne',
        'Grep',
        'Debug SQL',
        'Backup',
        'Log',
        'Servizi',
        'Tempi esecuzione',
        'DB size',
        'Cronjob',
        'Immagini login',
        'Moduli',
        'Coerenza stati',
        'Contatori',
        'Utenti connessi',
        'Variabili',
        'Profili menu',
        'Lingue',
        'App pubbliche',
        'Contabilità config',
        'Dogana config',
        'Utility'
      ]
    },
    {
      key: 'settings',
      label: 'Impostazioni',
      description: 'Area configurativa utente/azienda predisposta per preferenze operative, profili e setup futuro.',
      category: 'core',
      tierHint: 'base',
      submodules: []
    }
  ];

  const ROUTE_ALIASES = {
    contacts: 'master-data',
    anagrafiche: 'master-data',
    dashboard: 'dashboard',
    practices: 'practices',
    'practices/elenco-pratiche': 'practices/gestione-pratiche',
    'practices/pratiche-v2': 'practices/pratiche',
    documents: 'documents',
    settings: 'settings'
  };

  function enrichModule(module) {
    const route = module.key;
    const submodules = (module.submodules || []).map((label) => {
      const key = U.slugify(label);
      return {
        key,
        label,
        route: `${route}/${key}`,
        type: 'submodule',
        parentKey: module.key,
        parentLabel: module.label,
        tierHint: module.tierHint,
        description: `Placeholder coerente STEP 4A per ${label}.`
      };
    });

    return {
      ...module,
      route,
      type: 'module',
      submodules
    };
  }

  const MODULES = BLUEPRINT.map(enrichModule);
  const MODULE_MAP = Object.fromEntries(MODULES.map((module) => [module.key, module]));

  const ROUTE_MAP = {};
  MODULES.forEach((module) => {
    ROUTE_MAP[module.route] = {
      route: module.route,
      type: 'module',
      moduleKey: module.key,
      moduleLabel: module.label,
      title: module.label,
      fullTitle: module.label,
      description: module.description,
      category: module.category,
      tierHint: module.tierHint,
      submoduleCount: module.submodules.length
    };

    module.submodules.forEach((submodule) => {
      ROUTE_MAP[submodule.route] = {
        route: submodule.route,
        type: 'submodule',
        moduleKey: module.key,
        moduleLabel: module.label,
        submoduleKey: submodule.key,
        submoduleLabel: submodule.label,
        title: submodule.label,
        fullTitle: `${module.label} / ${submodule.label}`,
        description: submodule.description,
        category: module.category,
        tierHint: submodule.tierHint,
        submoduleCount: module.submodules.length
      };
    });
  });

  function list() {
    return MODULES.map((module) => localizeModule(module));
  }

  function getModule(moduleKey) {
    return MODULE_MAP[moduleKey] ? localizeModule(MODULE_MAP[moduleKey]) : null;
  }

  function getRouteMeta(route) {
    return ROUTE_MAP[route] ? localizeRouteMeta(ROUTE_MAP[route]) : null;
  }

  function getModuleKeyFromRoute(route) {
    const normalized = normalizeRoute(route);
    const meta = ROUTE_MAP[normalized];
    return meta ? meta.moduleKey : 'dashboard';
  }

  function normalizeRoute(route) {
    const raw = String(route || '').trim().replace(/^#\/?/, '').replace(/^\//, '');
    if (!raw) return 'dashboard';

    const alias = ROUTE_ALIASES[raw];
    if (alias && ROUTE_MAP[alias]) return alias;
    if (ROUTE_MAP[raw]) return raw;

    const firstSegment = raw.split('/')[0];
    if (ROUTE_ALIASES[firstSegment]) {
      const remapped = raw.replace(firstSegment, ROUTE_ALIASES[firstSegment]);
      if (ROUTE_MAP[remapped]) return remapped;
      return ROUTE_ALIASES[firstSegment];
    }

    return 'dashboard';
  }

  function summary() {
    return {
      totalModules: MODULES.length,
      totalSubmodules: MODULES.reduce((acc, module) => acc + module.submodules.length, 0),
      baseModules: MODULES.filter((module) => module.tierHint === 'base').length,
      premiumCandidates: MODULES.filter((module) => module.tierHint !== 'base').length
    };
  }

  
  function localizeModule(module) {
    const label = I.moduleLabel(module.key, module.label);
    const description = I.moduleDescription(module.key, module.description);
    return {
      ...module,
      label,
      description,
      submodules: module.submodules.map((submodule) => ({
        ...submodule,
        label: I.submoduleLabel(submodule.route, submodule.label),
        parentLabel: label,
        description: I.submoduleDescription(submodule.route, submodule.description)
      }))
    };
  }

  function localizeRouteMeta(meta) {
    if (!meta) return null;
    if (meta.type === 'module') {
      const moduleLabel = I.moduleLabel(meta.moduleKey, meta.moduleLabel);
      const description = I.moduleDescription(meta.moduleKey, meta.description);
      return {
        ...meta,
        moduleLabel,
        title: moduleLabel,
        fullTitle: moduleLabel,
        description
      };
    }
    const moduleLabel = I.moduleLabel(meta.moduleKey, meta.moduleLabel);
    const submoduleLabel = I.submoduleLabel(meta.route, meta.submoduleLabel);
    const description = I.submoduleDescription(meta.route, meta.description);
    return {
      ...meta,
      moduleLabel,
      submoduleLabel,
      title: submoduleLabel,
      fullTitle: `${moduleLabel} / ${submoduleLabel}`,
      description
    };
  }

return {
    list,
    getModule,
    getRouteMeta,
    getModuleKeyFromRoute,
    normalizeRoute,
    summary
  };
})();
