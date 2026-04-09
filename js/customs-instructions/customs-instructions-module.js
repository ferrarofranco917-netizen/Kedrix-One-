
window.KedrixOneCustomsInstructionsModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneCustomsInstructionsWorkspace || null;

  const SEA_COLUMNS = ['containerCode', 'transportUnitType', 'seals', 'loadingDate', 'taric', 'description', 'packageCount', 'netWeight', 'grossWeight', 'volume'];
  const AIR_ROAD_COLUMNS = ['marksNumbers', 'description', 'packageCount', 'netWeight', 'grossWeight'];
  const PRACTICE_PICKER_LIMIT = 30;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function currentOperatorName(state) {
    const activeUserId = String(state?.activeUserId || '').trim();
    const user = (state?.users || []).find((entry) => String(entry?.id || '').trim() === activeUserId) || null;
    return String(user?.name || '').trim();
  }

  function normalizeMode(practice = {}) {
    const type = String(practice?.practiceType || '').toLowerCase();
    const schemaGroup = String(practice?.schemaGroup || '').toLowerCase();
    if (schemaGroup) {
      if (schemaGroup === 'road') return 'road';
      return schemaGroup;
    }
    if (type.includes('sea')) return 'sea';
    if (type.includes('air')) return 'air';
    if (type.includes('road') || type.includes('terra')) return 'road';
    return '';
  }

  function normalizeDirection(practice = {}) {
    const type = String(practice?.practiceType || practice?.type || '').toLowerCase();
    if (type.includes('import')) return 'import';
    if (type.includes('export')) return 'export';
    return '';
  }

  function ensureState(state) {
    if (!Workspace || typeof Workspace.ensureState !== 'function') return null;
    Workspace.ensureState(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!Array.isArray(state.customsInstructionRecords)) state.customsInstructionRecords = [];
    return state.customsInstructions;
  }

  function createEmptyDraft(state, overrides = {}) {
    return {
      editingRecordId: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      mode: '',
      direction: '',
      status: 'draft',
      instructionDate: today(),
      compileLocation: 'Bene Vagienna',
      operatorName: currentOperatorName(state),
      transitary: '',
      principalParty: '',
      principalPartyLabel: '',
      mainReference: '',
      senderReference: '',
      senderParty: '',
      senderPartyLabel: '',
      receiverParty: '',
      receiverPartyLabel: '',
      originNode: '',
      originNodeLabel: '',
      destinationNode: '',
      destinationNodeLabel: '',
      carrierCompany: '',
      carrierReference: '',
      carrierReferenceLabel: '',
      booking: '',
      policyReference: '',
      dtd: '',
      customsOffice: '',
      customsSection: '',
      incoterm: '',
      goodsValue: '',
      goodsValueCurrency: 'EUR',
      customsValue: '',
      customsValueCurrency: 'EUR',
      freightAmount: '',
      freightCurrency: 'EUR',
      taric: '',
      customsDisposition: '',
      additionalInstructions: '',
      goodsDeclaration: '',
      attachedText: '',
      footerText: '',
      prebillRequired: 'no',
      attachmentOwnerKey: '',
      linkedAttachmentCount: 0,
      lineColumns: [],
      lineItems: [],
      sourcePracticeSnapshot: {},
      ...overrides
    };
  }

  function modeLabel(mode, i18n) {
    const labels = {
      sea: i18n?.t('ui.customsInstructionsModeSea', 'Mare') || 'Mare',
      air: i18n?.t('ui.customsInstructionsModeAir', 'Aereo') || 'Aereo',
      road: i18n?.t('ui.customsInstructionsModeRoad', 'Terra') || 'Terra'
    };
    return labels[String(mode || '').trim()] || '—';
  }

  function directionLabel(direction, i18n) {
    return String(direction || '').trim() === 'export'
      ? (i18n?.t('ui.customsInstructionsDirectionExport', 'Export') || 'Export')
      : (i18n?.t('ui.customsInstructionsDirectionImport', 'Import') || 'Import');
  }

  function buildLineColumns(mode) {
    return mode === 'sea' ? [...SEA_COLUMNS] : [...AIR_ROAD_COLUMNS];
  }

  function emptyLineForMode(mode) {
    const columns = buildLineColumns(mode);
    return Object.fromEntries(columns.map((key) => [key, '']));
  }

  function derivePartyLabels(mode, direction) {
    const isImport = direction === 'import';
    if (mode === 'sea') {
      return {
        principalPartyLabel: isImport ? 'Importatore' : 'Esportatore',
        senderPartyLabel: 'Mittente',
        receiverPartyLabel: isImport ? 'Ricevitore' : 'Destinatario',
        originNodeLabel: 'Porto imbarco',
        destinationNodeLabel: 'Porto sbarco',
        carrierReferenceLabel: isImport ? 'Nave / Viaggio' : 'Nave / Data viaggio'
      };
    }
    if (mode === 'air') {
      return {
        principalPartyLabel: isImport ? 'Importatore' : 'Esportatore',
        senderPartyLabel: 'Mittente',
        receiverPartyLabel: 'Destinatario',
        originNodeLabel: 'Aeroporto partenza',
        destinationNodeLabel: 'Aeroporto arrivo',
        carrierReferenceLabel: 'MAWB / HAWB'
      };
    }
    return {
      principalPartyLabel: isImport ? 'Importatore' : 'Esportatore',
      senderPartyLabel: 'Mittente',
      receiverPartyLabel: 'Destinatario',
      originNodeLabel: 'Origine',
      destinationNodeLabel: 'Destinazione',
      carrierReferenceLabel: 'Targa mezzo'
    };
  }

  function buildLineItemsFromPractice(practice, mode) {
    const dynamic = practice?.dynamicData || {};
    if (mode === 'sea') {
      return [{
        containerCode: String(practice?.containerCode || dynamic.containerCode || '').trim(),
        transportUnitType: String(dynamic.transportUnitType || '').trim(),
        seals: String(dynamic.seal || dynamic.seals || '').trim(),
        loadingDate: String(dynamic.loadingDate || dynamic.pickupDate || '').trim(),
        taric: String(dynamic.taric || '').trim(),
        description: String(practice?.goodsDescription || dynamic.goodsDescription || '').trim(),
        packageCount: String(practice?.packageCount || dynamic.packageCount || '').trim(),
        netWeight: String(dynamic.netWeight || '').trim(),
        grossWeight: String(practice?.grossWeight || dynamic.grossWeight || '').trim(),
        volume: String(dynamic.volume || '').trim()
      }];
    }
    return [{
      marksNumbers: String(dynamic.marksNumbers || dynamic.marksAndNumbers || practice?.containerCode || '').trim(),
      description: String(practice?.goodsDescription || dynamic.goodsDescription || '').trim(),
      packageCount: String(practice?.packageCount || dynamic.packageCount || '').trim(),
      netWeight: String(dynamic.netWeight || '').trim(),
      grossWeight: String(practice?.grossWeight || dynamic.grossWeight || '').trim()
    }];
  }

  function countLinkedAttachments(state, ownerKey) {
    const index = state?.practiceAttachmentIndex || {};
    const items = ownerKey ? index[ownerKey] : [];
    return Array.isArray(items) ? items.length : 0;
  }

  function buildDraftFromPractice(state, practice) {
    if (!practice || typeof practice !== 'object') return createEmptyDraft(state);
    const dynamic = practice.dynamicData || {};
    const mode = normalizeMode(practice);
    const direction = normalizeDirection(practice);
    const labels = derivePartyLabels(mode, direction);
    const attachmentOwnerKey = String(practice.attachmentOwnerKey || practice.id || '').trim();
    const sourceSnapshot = {
      practiceId: String(practice.id || '').trim(),
      reference: String(practice.reference || '').trim(),
      practiceType: String(practice.practiceTypeLabel || practice.practiceType || '').trim(),
      status: String(practice.status || '').trim()
    };
    return createEmptyDraft(state, {
      practiceId: String(practice.id || '').trim(),
      practiceReference: String(practice.reference || '').trim(),
      practiceType: String(practice.practiceTypeLabel || practice.practiceType || '').trim(),
      mode,
      direction,
      instructionDate: String(practice.practiceDate || dynamic.customsDate || today()).trim() || today(),
      compileLocation: String(dynamic.deliveryCity || practice.port || 'Bene Vagienna').trim() || 'Bene Vagienna',
      operatorName: currentOperatorName(state),
      transitary: String(practice.clientName || practice.client || '').trim(),
      principalParty: String(direction === 'export' ? (practice.exporter || dynamic.exporter || practice.clientName || '') : (practice.importer || dynamic.importer || practice.clientName || '')).trim(),
      principalPartyLabel: labels.principalPartyLabel,
      mainReference: String(dynamic.additionalReference || practice.reference || '').trim(),
      senderReference: String(dynamic.additionalReference || '').trim(),
      senderParty: String(dynamic.shipper || dynamic.sender || practice.clientName || '').trim(),
      senderPartyLabel: labels.senderPartyLabel,
      receiverParty: String(dynamic.consignee || practice.consignee || dynamic.receiver || '').trim(),
      receiverPartyLabel: labels.receiverPartyLabel,
      originNode: String(practice.portLoading || dynamic.portLoading || dynamic.pickupPlace || '').trim(),
      originNodeLabel: labels.originNodeLabel,
      destinationNode: String(practice.portDischarge || dynamic.portDischarge || dynamic.deliveryPlace || '').trim(),
      destinationNodeLabel: labels.destinationNodeLabel,
      carrierCompany: String(dynamic.company || dynamic.carrier || practice.carrier || '').trim(),
      carrierReference: String(dynamic.mbl || dynamic.hbl || dynamic.hawb || dynamic.cmr || practice.mbl || practice.hbl || practice.cmr || '').trim(),
      carrierReferenceLabel: labels.carrierReferenceLabel,
      booking: String(practice.booking || dynamic.booking || '').trim(),
      policyReference: String(dynamic.policyNumber || dynamic.mbl || dynamic.hbl || dynamic.hawb || practice.mbl || practice.hbl || practice.cmr || '').trim(),
      dtd: String(dynamic.customsDate || practice.eta || practice.practiceDate || '').trim(),
      customsOffice: String(dynamic.customsOffice || practice.customsOffice || '').trim(),
      customsSection: String(dynamic.customsSection || '').trim(),
      incoterm: String(dynamic.incoterm || '').trim(),
      goodsValue: String(dynamic.invoiceAmount || dynamic.foreignInvoiceAmount || '').trim(),
      goodsValueCurrency: String(dynamic.invoiceCurrency || 'EUR').trim() || 'EUR',
      customsValue: String(dynamic.customsValue || '').trim(),
      customsValueCurrency: String(dynamic.customsValueCurrency || 'EUR').trim() || 'EUR',
      freightAmount: String(dynamic.freightAmount || '').trim(),
      freightCurrency: String(dynamic.freightCurrency || 'EUR').trim() || 'EUR',
      taric: String(dynamic.taric || '').trim(),
      customsDisposition: String(dynamic.customsDisposition || '').trim(),
      additionalInstructions: String(practice.notes || '').trim(),
      goodsDeclaration: String(practice.goodsDescription || dynamic.goodsDescription || '').trim(),
      attachedText: String(dynamic.textAttachments || '').trim(),
      footerText: '',
      prebillRequired: String(dynamic.prebillRequired || 'no').trim() || 'no',
      attachmentOwnerKey,
      linkedAttachmentCount: countLinkedAttachments(state, attachmentOwnerKey),
      lineColumns: buildLineColumns(mode),
      lineItems: buildLineItemsFromPractice(practice, mode),
      sourcePracticeSnapshot: sourceSnapshot
    });
  }

  function cloneRecord(record) {
    return Workspace && typeof Workspace.cloneDraft === 'function'
      ? Workspace.cloneDraft(record)
      : JSON.parse(JSON.stringify(record || {}));
  }

  function nextRecordId(state) {
    const current = Array.isArray(state?.customsInstructionRecords) ? state.customsInstructionRecords.length : 0;
    return `CUS-${new Date().getFullYear()}-${String(current + 1).padStart(4, '0')}`;
  }

  function upsertRecord(state, draft) {
    ensureState(state);
    const records = state.customsInstructionRecords;
    const now = new Date().toISOString();
    const recordId = String(draft?.editingRecordId || '').trim() || nextRecordId(state);
    const payload = cloneRecord({
      ...draft,
      id: recordId,
      editingRecordId: recordId,
      updatedAt: now,
      createdAt: now,
      title: String(draft?.practiceReference || draft?.principalParty || recordId).trim(),
      attachmentOwnerKey: String(draft?.attachmentOwnerKey || draft?.practiceId || '').trim()
    });
    const index = records.findIndex((record) => String(record?.id || '').trim() === recordId);
    if (index >= 0) {
      payload.createdAt = records[index]?.createdAt || now;
      records[index] = payload;
    } else {
      records.unshift(payload);
    }
    return payload;
  }

  function syncSessionDraft(session, draft) {
    if (!session) return;
    session.draft = cloneRecord(draft);
  }

  function activeSession(state) {
    ensureState(state);
    return Workspace?.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) }) || null;
  }

  function practiceTimestamp(practice) {
    const candidates = [
      practice?.updatedAt,
      practice?.savedAt,
      practice?.modifiedAt,
      practice?.lastOpenedAt,
      practice?.practiceDate,
      practice?.createdAt,
      practice?.eta,
      practice?.dynamicData?.customsDate
    ];
    for (const candidate of candidates) {
      const value = String(candidate || '').trim();
      if (!value) continue;
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
      const normalized = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (normalized) {
        const [, dd, mm, yyyy] = normalized;
        const fallback = Date.parse(`${yyyy}-${mm}-${dd}`);
        if (!Number.isNaN(fallback)) return fallback;
      }
    }
    return 0;
  }

  function practiceSequenceScore(practice) {
    const reference = String(practice?.reference || '').trim();
    const id = String(practice?.id || '').trim();
    const refDigits = reference.match(/(\d+)/g);
    if (refDigits && refDigits.length) return Number(refDigits.join('')) || 0;
    const idDigits = id.match(/(\d+)/g);
    return idDigits && idDigits.length ? Number(idDigits.join('')) || 0 : 0;
  }

  function practiceOptions(state, limit = PRACTICE_PICKER_LIMIT) {
    return (state?.practices || [])
      .slice()
      .sort((left, right) => {
        const dateDelta = practiceTimestamp(right) - practiceTimestamp(left);
        if (dateDelta !== 0) return dateDelta;
        return practiceSequenceScore(right) - practiceSequenceScore(left);
      })
      .slice(0, limit)
      .map((practice) => ({
        id: String(practice?.id || '').trim(),
        label: [
          String(practice?.reference || '').trim(),
          String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
          String(practice?.clientName || practice?.client || '').trim()
        ].filter(Boolean).join(' · ')
      }))
      .filter((entry) => entry.id);
  }

  function normalizePracticeSearchTerm(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
  }

  function findPracticeBySearch(state, rawTerm) {
    const term = normalizePracticeSearchTerm(rawTerm);
    if (!term) return { practice: null, totalMatches: 0, mode: '' };
    const practices = Array.isArray(state?.practices) ? state.practices.slice() : [];
    const ranked = practices
      .map((practice) => {
        const reference = normalizePracticeSearchTerm(practice?.reference);
        const practiceId = normalizePracticeSearchTerm(practice?.id);
        let score = 0;
        if (reference === term || practiceId === term) score = 400;
        else if (reference.startsWith(term)) score = 300;
        else if (reference.includes(term)) score = 200;
        else if (practiceId.includes(term)) score = 100;
        return score ? { practice, score } : null;
      })
      .filter(Boolean)
      .sort((left, right) => {
        const scoreDelta = right.score - left.score;
        if (scoreDelta !== 0) return scoreDelta;
        const dateDelta = practiceTimestamp(right.practice) - practiceTimestamp(left.practice);
        if (dateDelta !== 0) return dateDelta;
        return practiceSequenceScore(right.practice) - practiceSequenceScore(left.practice);
      });
    return {
      practice: ranked[0]?.practice || null,
      totalMatches: ranked.length,
      mode: ranked[0]?.score >= 400 ? 'exact' : (ranked[0]?.score ? 'fuzzy' : '')
    };
  }

  function getPracticeById(state, practiceId) {
    return (state?.practices || []).find((practice) => String(practice?.id || '').trim() === String(practiceId || '').trim()) || null;
  }

  function buildKpis(state) {
    const records = Array.isArray(state?.customsInstructionRecords) ? state.customsInstructionRecords : [];
    const openSessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const linkedPractices = new Set(records.map((record) => String(record?.practiceId || '').trim()).filter(Boolean));
    return {
      records: records.length,
      openMasks: openSessions.length,
      linkedPractices: linkedPractices.size
    };
  }

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const placeholder = options.placeholder || '';
    const readonly = options.readonly ? ' readonly' : '';
    const disabled = options.disabled ? ' disabled' : '';
    const rows = Number(options.rows || 4);
    const classes = ['field'];
    if (options.full) classes.push('full');
    const escapedLabel = U.escapeHtml(label);
    const escapedName = U.escapeHtml(name);
    const escapedValue = U.escapeHtml(value || '');
    const escapedPlaceholder = U.escapeHtml(placeholder);
    if (type === 'textarea') {
      return `<div class="${classes.join(' ')}"><label for="${escapedName}">${escapedLabel}</label><textarea id="${escapedName}" data-customs-field="${escapedName}" rows="${rows}" placeholder="${escapedPlaceholder}"${readonly}${disabled}>${escapedValue}</textarea></div>`;
    }
    if (type === 'select') {
      const items = Array.isArray(options.items) ? options.items : [];
      return `<div class="${classes.join(' ')}"><label for="${escapedName}">${escapedLabel}</label><select id="${escapedName}" data-customs-field="${escapedName}"${disabled}>${items.map((item) => {
        const itemValue = String(item?.value ?? '');
        const selected = itemValue === String(value ?? '') ? ' selected' : '';
        return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
      }).join('')}</select></div>`;
    }
    return `<div class="${classes.join(' ')}"><label for="${escapedName}">${escapedLabel}</label><input id="${escapedName}" type="${U.escapeHtml(type)}" value="${escapedValue}" placeholder="${escapedPlaceholder}" data-customs-field="${escapedName}"${readonly}${disabled}></div>`;
  }

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const activeId = String(state?.customsInstructions?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel practice-workspace-panel customs-instructions-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.customsInstructionsMasksTitle', 'Maschere istruzioni doganali'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.customsInstructionsMasksHint', 'Ogni istruzione si apre in una maschera interna dedicata, con controllo dirty state e cambio contesto senza uscire dalla shell Kedrix.'))}</p>
          </div>
        </div>
        <div class="practice-workspace-strip">
          ${sessions.map((session) => {
            const summary = Workspace.describeSession(session, i18n);
            return `<div class="practice-workspace-mask ${summary.id === activeId ? 'active' : ''}">
              <button class="practice-workspace-switch" type="button" data-customs-session-switch="${U.escapeHtml(summary.id)}">
                <span class="practice-workspace-mask-main">
                  <span class="practice-workspace-mask-title">${U.escapeHtml(summary.label || '—')}</span>
                  <span class="practice-workspace-mask-subtitle">${U.escapeHtml(summary.subtitle || '—')}</span>
                </span>
                <span class="practice-workspace-badges">
                  <span class="tag-pill muted">${U.escapeHtml(summary.badge || '—')}</span>
                  ${summary.dirtyBadge ? `<span class="tag-pill">${U.escapeHtml(summary.dirtyBadge)}</span>` : ''}
                </span>
              </button>
              <button class="practice-workspace-close" type="button" data-customs-session-close="${U.escapeHtml(summary.id)}" aria-label="${U.escapeHtml(i18n?.t('ui.workspaceCloseMask', 'Chiudi maschera'))}">×</button>
            </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  function renderHeader(state, i18n) {
    const kpis = buildKpis(state);
    return `
      <section class="hero">
        <div class="hero-meta">AQ21B · ${U.escapeHtml(i18n?.t('ui.customsInstructionsHeroEyebrow', 'Pratiche · consolidamento sottomodulo esistente'))}</div>
        <h2>${U.escapeHtml(i18n?.t('submodules.practices/istruzioni-di-sdoganamento', 'Istruzioni di sdoganamento'))} · Foundation</h2>
        <p>${U.escapeHtml(i18n?.t('ui.customsInstructionsHeroText', 'Foundation Kedrix del sottomodulo: collegamento reale alla pratica madre, salvataggio, aggiornamento, persistenza reload e maschere interne dedicate senza copiare la UI SP1.'))}</p>
      </section>
      <section class="kpi-grid compact-kpi-grid">
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(i18n?.t('ui.customsInstructionsSaved', 'Istruzioni salvate'))}</div><div class="kpi-value">${kpis.records}</div><div class="kpi-hint">${U.escapeHtml(i18n?.t('ui.customsInstructionsSavedHint', 'Record persistiti nel browser locale della main staging.'))}</div></article>
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(i18n?.t('ui.customsInstructionsOpenMasks', 'Maschere aperte'))}</div><div class="kpi-value">${kpis.openMasks}</div><div class="kpi-hint">${U.escapeHtml(i18n?.t('ui.customsInstructionsOpenMasksHint', 'Workspace interno dedicato al sottomodulo.'))}</div></article>
        <article class="kpi-card"><div class="kpi-label">${U.escapeHtml(i18n?.t('ui.customsInstructionsLinkedPractices', 'Pratiche collegate'))}</div><div class="kpi-value">${kpis.linkedPractices}</div><div class="kpi-hint">${U.escapeHtml(i18n?.t('ui.customsInstructionsLinkedPracticesHint', 'Legame reale con la pratica madre mantenuto nel record salvato.'))}</div></article>
      </section>`;
  }

  function renderLauncher(state, i18n) {
    const activePracticeId = String(state?.selectedPracticeId || '').trim();
    const options = practiceOptions(state, PRACTICE_PICKER_LIMIT);
    return `
      <section class="panel customs-instructions-launcher">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.customsInstructionsOpenTitle', 'Apri o crea istruzione'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.customsInstructionsOpenHint', 'Apri una nuova istruzione partendo dalla pratica attiva, usa le ultime pratiche recenti oppure cerca direttamente il numero pratica per mantenere il collegamento corretto.'))}</p>
          </div>
        </div>
        <div class="customs-instructions-launcher-grid">
          <button class="btn" type="button" data-customs-open-active-practice ${activePracticeId ? '' : 'disabled'}>${U.escapeHtml(i18n?.t('ui.customsInstructionsOpenFromActive', 'Nuova da pratica attiva'))}</button>
          <div class="customs-instructions-launcher-stack">
            <div class="customs-instructions-practice-picker">
              <div class="field customs-inline-field">
                <label for="customsPracticePicker">${U.escapeHtml(i18n?.t('ui.customsInstructionsRecentPracticesLabel', 'Ultime pratiche recenti'))}</label>
                <select id="customsPracticePicker" data-customs-practice-picker>
                  <option value="">${U.escapeHtml(i18n?.t('ui.customsInstructionsSelectPractice', 'Seleziona pratica madre'))}</option>
                  ${options.map((option) => `<option value="${U.escapeHtml(option.id)}">${U.escapeHtml(option.label)}</option>`).join('')}
                </select>
                <div class="field-hint">${U.escapeHtml(i18n?.t('ui.customsInstructionsRecentPracticesHint', 'Il menu mostra solo le ultime 30 pratiche per restare veloce anche con archivi molto grandi.'))}</div>
              </div>
              <button class="btn secondary" type="button" data-customs-open-picked-practice>${U.escapeHtml(i18n?.t('ui.customsInstructionsOpenSelected', 'Apri da pratica selezionata'))}</button>
            </div>
            <div class="customs-instructions-practice-search">
              <div class="field customs-inline-field">
                <label for="customsPracticeSearch">${U.escapeHtml(i18n?.t('ui.customsInstructionsSearchLabel', 'Cerca numero pratica'))}</label>
                <input id="customsPracticeSearch" type="search" value="" placeholder="${U.escapeHtml(i18n?.t('ui.customsInstructionsSearchPlaceholder', 'Es. AP-2026-8'))}" data-customs-practice-search autocomplete="off">
                <div class="field-hint">${U.escapeHtml(i18n?.t('ui.customsInstructionsSearchHint', 'Inserisci numero pratica o riferimento e apri direttamente la pratica madre senza scorrere tutto l’elenco.'))}</div>
              </div>
              <button class="btn secondary" type="button" data-customs-open-search-practice>${U.escapeHtml(i18n?.t('ui.customsInstructionsOpenFromSearch', 'Apri da ricerca'))}</button>
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderRecordList(state, i18n) {
    const records = Array.isArray(state?.customsInstructionRecords) ? state.customsInstructionRecords : [];
    return `
      <section class="table-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.customsInstructionsArchiveTitle', 'Archivio istruzioni salvate'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.customsInstructionsArchiveHint', 'Apri un record esistente per aggiornarlo senza perdere il riferimento alla pratica madre.'))}</p>
          </div>
        </div>
        ${records.length ? `
        <div class="table-wrap"><table class="table">
          <thead><tr>
            <th>${U.escapeHtml(i18n?.t('ui.reference', 'Riferimento'))}</th>
            <th>${U.escapeHtml(i18n?.t('ui.practice', 'Pratica'))}</th>
            <th>${U.escapeHtml(i18n?.t('ui.type', 'Tipo'))}</th>
            <th>${U.escapeHtml(i18n?.t('ui.status', 'Stato'))}</th>
            <th>${U.escapeHtml(i18n?.t('ui.updatedAt', 'Aggiornato'))}</th>
            <th>${U.escapeHtml(i18n?.t('ui.actions', 'Azioni'))}</th>
          </tr></thead>
          <tbody>
            ${records.map((record) => `<tr>
              <td>${U.escapeHtml(record.practiceReference || record.id || '—')}</td>
              <td>${U.escapeHtml(record.principalParty || record.practiceId || '—')}</td>
              <td>${U.escapeHtml([modeLabel(record.mode, i18n), directionLabel(record.direction, i18n)].filter(Boolean).join(' · ') || '—')}</td>
              <td>${U.escapeHtml(record.status || 'draft')}</td>
              <td>${U.escapeHtml(String(record.updatedAt || '').slice(0, 10) || '—')}</td>
              <td><button class="btn secondary small-btn" type="button" data-customs-open-record="${U.escapeHtml(record.id || '')}">${U.escapeHtml(i18n?.t('ui.openRecord', 'Apri record'))}</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>` : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.customsInstructionsArchiveEmpty', 'Nessuna istruzione salvata in questo staging locale.'))}</div>`}
      </section>`;
  }

  function renderSummaryPills(draft, i18n) {
    const items = [
      [i18n?.t('ui.customsInstructionsMotherPractice', 'Pratica madre'), draft.practiceReference || '—'],
      [i18n?.t('ui.type', 'Tipo'), draft.practiceType || '—'],
      [i18n?.t('ui.customsInstructionsLinkedAttachments', 'Allegati pratica'), String(draft.linkedAttachmentCount || 0)],
      [i18n?.t('ui.status', 'Stato'), draft.status || 'draft']
    ];
    return `<div class="tag-grid customs-instructions-summary-pills">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderGeneralTab(draft, i18n) {
    const currencies = ['EUR', 'USD', 'GBP', 'CHF', 'CNY'];
    const mode = String(draft.mode || '').trim();
    const isSea = mode === 'sea';
    const columns = Array.isArray(draft.lineColumns) && draft.lineColumns.length ? draft.lineColumns : buildLineColumns(mode);
    return `
      ${renderSummaryPills(draft, i18n)}
      <div class="form-grid three customs-instructions-form-grid">
        ${renderField(i18n?.t('ui.customsInstructionsInstructionDate', 'Data istruzione'), 'instructionDate', draft.instructionDate, { type: 'date' })}
        ${renderField(i18n?.t('ui.customsInstructionsCompileLocation', 'Luogo compilazione'), 'compileLocation', draft.compileLocation)}
        ${renderField(i18n?.t('ui.operator', 'Operatore'), 'operatorName', draft.operatorName)}
        ${renderField(i18n?.t('ui.customsInstructionsTransitary', 'Transitario'), 'transitary', draft.transitary)}
        ${renderField(draft.principalPartyLabel || i18n?.t('ui.client', 'Cliente'), 'principalParty', draft.principalParty)}
        ${renderField(i18n?.t('ui.customsInstructionsMainReference', 'Riferimento'), 'mainReference', draft.mainReference)}
        ${renderField(draft.senderPartyLabel || i18n?.t('ui.customsInstructionsSender', 'Mittente'), 'senderParty', draft.senderParty)}
        ${renderField(i18n?.t('ui.customsInstructionsSenderReference', 'Riferimento mittente'), 'senderReference', draft.senderReference)}
        ${renderField(draft.receiverPartyLabel || i18n?.t('ui.customsInstructionsReceiver', 'Destinatario'), 'receiverParty', draft.receiverParty)}
        ${renderField(draft.originNodeLabel || i18n?.t('ui.origin', 'Origine'), 'originNode', draft.originNode)}
        ${renderField(draft.destinationNodeLabel || i18n?.t('ui.destination', 'Destinazione'), 'destinationNode', draft.destinationNode)}
        ${renderField(draft.carrierReferenceLabel || i18n?.t('ui.customsInstructionsCarrierReference', 'Riferimento vettore'), 'carrierReference', draft.carrierReference)}
        ${renderField(i18n?.t('ui.company', 'Compagnia'), 'carrierCompany', draft.carrierCompany)}
        ${renderField(i18n?.t('ui.booking', 'Booking'), 'booking', draft.booking)}
        ${renderField(i18n?.t('ui.customsInstructionsPolicyReference', 'Polizza / BL / AWB'), 'policyReference', draft.policyReference)}
        ${renderField(i18n?.t('ui.customsInstructionsDtd', 'DTD'), 'dtd', draft.dtd, { type: 'date' })}
        ${renderField(i18n?.t('ui.customsInstructionsCustomsOffice', 'Dogana / Sezione'), 'customsOffice', draft.customsOffice)}
        ${renderField(i18n?.t('ui.customsInstructionsCustomsSection', 'Sezione doganale'), 'customsSection', draft.customsSection)}
        ${renderField(i18n?.t('ui.incoterm', 'Incoterm'), 'incoterm', draft.incoterm)}
        <div class="field"><label>${U.escapeHtml(i18n?.t('ui.customsInstructionsGoodsValue', 'Valore merce'))}</label><div class="customs-instructions-currency-row"><input type="text" value="${U.escapeHtml(draft.goodsValue || '')}" data-customs-field="goodsValue"><select data-customs-field="goodsValueCurrency">${currencies.map((currency) => `<option value="${U.escapeHtml(currency)}"${currency === String(draft.goodsValueCurrency || 'EUR') ? ' selected' : ''}>${U.escapeHtml(currency)}</option>`).join('')}</select></div></div>
        <div class="field"><label>${U.escapeHtml(i18n?.t('ui.customsInstructionsCustomsValue', 'Valore fiscale'))}</label><div class="customs-instructions-currency-row"><input type="text" value="${U.escapeHtml(draft.customsValue || '')}" data-customs-field="customsValue"><select data-customs-field="customsValueCurrency">${currencies.map((currency) => `<option value="${U.escapeHtml(currency)}"${currency === String(draft.customsValueCurrency || 'EUR') ? ' selected' : ''}>${U.escapeHtml(currency)}</option>`).join('')}</select></div></div>
        <div class="field"><label>${U.escapeHtml(i18n?.t('ui.customsInstructionsFreightAmount', 'Nolo bolla'))}</label><div class="customs-instructions-currency-row"><input type="text" value="${U.escapeHtml(draft.freightAmount || '')}" data-customs-field="freightAmount"><select data-customs-field="freightCurrency">${currencies.map((currency) => `<option value="${U.escapeHtml(currency)}"${currency === String(draft.freightCurrency || 'EUR') ? ' selected' : ''}>${U.escapeHtml(currency)}</option>`).join('')}</select></div></div>
        ${renderField(i18n?.t('ui.taric', 'TARIC'), 'taric', draft.taric)}
        ${renderField(i18n?.t('ui.customsInstructionsDisposition', 'Disp. op. doganali'), 'customsDisposition', draft.customsDisposition)}
        ${renderField(i18n?.t('ui.customsInstructionsPrebill', 'Richiesta prebolla'), 'prebillRequired', draft.prebillRequired, { type: 'select', items: [{ value: 'no', label: 'NO' }, { value: 'yes', label: 'SI' }] })}
        ${renderField(i18n?.t('ui.customsInstructionsAdditional', 'Ulteriori istruzioni'), 'additionalInstructions', draft.additionalInstructions, { type: 'textarea', rows: 4, full: true })}
        ${renderField(i18n?.t('ui.customsInstructionsGoodsDeclaration', 'Dichiaraz. merce in bolla'), 'goodsDeclaration', draft.goodsDeclaration, { type: 'textarea', rows: 4, full: true })}
        ${renderField(i18n?.t('ui.customsInstructionsAttachedText', 'Testo allegati'), 'attachedText', draft.attachedText, { type: 'textarea', rows: 4, full: true })}
      </div>
      <section class="table-panel customs-instructions-lines-panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(isSea ? i18n?.t('ui.customsInstructionsSeaLinesTitle', 'Dettaglio container / merce') : i18n?.t('ui.customsInstructionsGoodsLinesTitle', 'Dettaglio colli / merce'))}</h3><p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.customsInstructionsLinesHint', 'Tabella operativa persistente nella maschera: puoi aggiungere o correggere righe prima del salvataggio.'))}</p></div><div class="action-row"><button class="btn secondary" type="button" data-customs-add-line>${U.escapeHtml(i18n?.t('ui.addLine', 'Aggiungi riga'))}</button></div></div>
        ${renderLinesTable(draft, columns, i18n)}
      </section>`;
  }

  function lineColumnMeta(key, i18n) {
    const labels = {
      containerCode: i18n?.t('ui.container', 'Container'),
      transportUnitType: i18n?.t('ui.transportUnitType', 'Tipologia'),
      seals: i18n?.t('ui.customsInstructionsSeals', 'Sigilli'),
      loadingDate: i18n?.t('ui.customsInstructionsLoadingDate', 'Data carico'),
      taric: i18n?.t('ui.taric', 'TARIC'),
      description: i18n?.t('ui.description', 'Descrizione'),
      packageCount: i18n?.t('ui.packageCount', 'Colli'),
      netWeight: i18n?.t('ui.netWeight', 'Peso netto'),
      grossWeight: i18n?.t('ui.grossWeight', 'Peso lordo'),
      volume: i18n?.t('ui.volume', 'Volume'),
      marksNumbers: i18n?.t('ui.customsInstructionsMarksNumbers', 'Marche e numeri')
    };
    const types = { loadingDate: 'date' };
    return { label: labels[key] || key, type: types[key] || 'text' };
  }

  function renderLineCardField(column, row, rowIndex, i18n, options = {}) {
    const meta = lineColumnMeta(column, i18n);
    const full = options.full ? ' full' : '';
    const inputId = `customs-line-${rowIndex}-${column}`;
    return `<div class="field customs-line-field${full}"><label for="${U.escapeHtml(inputId)}">${U.escapeHtml(meta.label)}</label><input id="${U.escapeHtml(inputId)}" type="${U.escapeHtml(meta.type)}" value="${U.escapeHtml(row?.[column] || '')}" data-customs-line-field="${U.escapeHtml(column)}" data-customs-line-index="${rowIndex}"></div>`;
  }

  function lineCardGroups(mode) {
    if (mode === 'sea') {
      return [
        ['containerCode', 'transportUnitType'],
        ['seals', 'loadingDate'],
        ['taric'],
        ['description'],
        ['packageCount', 'netWeight'],
        ['grossWeight', 'volume']
      ];
    }
    return [
      ['marksNumbers'],
      ['description'],
      ['packageCount', 'netWeight'],
      ['grossWeight']
    ];
  }

  function renderLinesTable(draft, columns, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    const mode = String(draft?.mode || '').trim();
    const groups = lineCardGroups(mode);
    if (!rows.length) {
      return `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.customsInstructionsNoLines', 'Nessuna riga presente nella maschera attiva.'))}</div>`;
    }
    return `<div class="customs-lines-stack">${rows.map((row, rowIndex) => {
      const primaryValue = String(row?.containerCode || row?.marksNumbers || row?.description || '').trim();
      const meta = primaryValue || (i18n?.t('ui.customsInstructionsLineDraft', 'Compila i campi della riga') || 'Compila i campi della riga');
      return `<article class="customs-line-card">
        <div class="customs-line-card-head">
          <div>
            <div class="customs-line-card-title">${U.escapeHtml((i18n?.t('ui.customsInstructionsLineTitle', 'Riga') || 'Riga') + ' ' + String(rowIndex + 1))}</div>
            <div class="customs-line-card-meta">${U.escapeHtml(meta)}</div>
          </div>
          <button class="btn secondary small-btn" type="button" data-customs-remove-line="${rowIndex}">${U.escapeHtml(i18n?.t('ui.remove', 'Rimuovi'))}</button>
        </div>
        <div class="customs-line-grid ${mode === 'sea' ? 'is-sea' : 'is-compact'}">
          ${groups.map((group) => group.map((column) => renderLineCardField(column, row, rowIndex, i18n, { full: column === 'description' })).join('')).join('')}
        </div>
      </article>`;
    }).join('')}</div>`;
  }

  function renderTextsTab(draft, i18n) {
    return `
      <section class="panel">
        <div class="panel-head"><div><h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.customsInstructionsTextsTitle', 'Testi operativi'))}</h3><p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.customsInstructionsTextsHint', 'Base testi persistente del sottomodulo. L’editor avanzato/documentale resta uno step successivo dedicato.'))}</p></div></div>
        <div class="form-grid two">
          ${renderField(i18n?.t('ui.customsInstructionsAttachedText', 'Testo allegati'), 'attachedText', draft.attachedText, { type: 'textarea', rows: 12, full: true })}
          ${renderField(i18n?.t('ui.customsInstructionsFooterText', 'Testo footer'), 'footerText', draft.footerText, { type: 'textarea', rows: 12, full: true })}
        </div>
      </section>`;
  }

  function renderEditor(state, i18n) {
    const session = activeSession(state);
    if (!session) {
      return `<section class="panel"><div class="empty-text">${U.escapeHtml(i18n?.t('ui.customsInstructionsNoMask', 'Nessuna maschera aperta. Apri una nuova istruzione partendo da una pratica madre.'))}</div></section>`;
    }
    const draft = session.draft || createEmptyDraft(state);
    const activeTab = String(session?.uiState?.tab || 'general').trim() || 'general';
    return `
      <section class="panel customs-instructions-editor">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.customsInstructionsEditorTitle', 'Maschera istruzione'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.customsInstructionsEditorHint', 'Le modifiche restano nella maschera interna fino al salvataggio. La chiusura controlla il dirty state prima di perdere dati.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-customs-tab="general">${U.escapeHtml(i18n?.t('ui.general', 'Generale'))}</button>
            <button class="btn secondary" type="button" data-customs-tab="texts">${U.escapeHtml(i18n?.t('ui.texts', 'Testi'))}</button>
          </div>
        </div>
        <div class="customs-instructions-mode-bar">
          <span class="tag-pill">${U.escapeHtml(modeLabel(draft.mode, i18n))}</span>
          <span class="tag-pill">${U.escapeHtml(directionLabel(draft.direction, i18n))}</span>
          <span class="tag-pill muted">${U.escapeHtml(draft.practiceReference || '—')}</span>
        </div>
        ${activeTab === 'texts' ? renderTextsTab(draft, i18n) : renderGeneralTab(draft, i18n)}
        <div class="action-row customs-instructions-actions-row">
          <button class="btn" type="button" data-customs-save>${U.escapeHtml(i18n?.t('ui.save', 'Salva'))}</button>
          <button class="btn secondary" type="button" data-customs-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          <button class="btn secondary" type="button" data-customs-close-active>${U.escapeHtml(i18n?.t('ui.close', 'Chiudi'))}</button>
        </div>
      </section>`;
  }

  function render(state, helpers = {}) {
    const i18n = helpers.i18n;
    ensureState(state);
    return `${renderHeader(state, i18n)}${renderLauncher(state, i18n)}${renderSessionStrip(state, i18n)}${renderEditor(state, i18n)}${renderRecordList(state, i18n)}`;
  }

  function markDirty(state, sessionId) {
    Workspace?.setSessionDirty(state, sessionId, true, { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function normalizeDraftForSave(draft) {
    const nextDraft = cloneRecord(draft || {});
    nextDraft.status = 'saved';
    return nextDraft;
  }

  function syncActiveField(root, state, target) {
    const session = activeSession(state);
    if (!session) return;
    const fieldName = String(target?.dataset?.customsField || '').trim();
    if (!fieldName) return;
    session.draft[fieldName] = target?.value ?? '';
    markDirty(state, session.id);
  }

  function syncActiveLineField(state, target) {
    const session = activeSession(state);
    if (!session) return;
    const lineIndex = Number(target?.dataset?.customsLineIndex ?? -1);
    const fieldName = String(target?.dataset?.customsLineField || '').trim();
    if (!Number.isInteger(lineIndex) || lineIndex < 0 || !fieldName) return;
    if (!Array.isArray(session.draft.lineItems)) session.draft.lineItems = [];
    if (!session.draft.lineItems[lineIndex]) session.draft.lineItems[lineIndex] = emptyLineForMode(session.draft.mode);
    session.draft.lineItems[lineIndex][fieldName] = target?.value ?? '';
    markDirty(state, session.id);
  }

  function validationErrors(draft, i18n) {
    const errors = [];
    if (!String(draft?.practiceId || '').trim()) errors.push(i18n?.t('ui.customsInstructionsValidationPractice', 'Collega la pratica madre prima del salvataggio.') || 'Collega la pratica madre prima del salvataggio.');
    if (!String(draft?.mode || '').trim()) errors.push(i18n?.t('ui.customsInstructionsValidationMode', 'Tipo pratica non rilevato.') || 'Tipo pratica non rilevato.');
    return errors;
  }

  function maybeConfirmClose(helpers) {
    if (typeof helpers?.confirmClose === 'function') return helpers.confirmClose();
    return Promise.resolve(true);
  }

  function openFromPractice(state, practice, helpers = {}) {
    if (!practice) {
      helpers.toast?.(helpers.i18n?.t('ui.customsInstructionsPracticeMissing', 'Seleziona prima una pratica madre valida.') || 'Seleziona prima una pratica madre valida.', 'warning');
      return;
    }
    ensureState(state);
    const draft = buildDraftFromPractice(state, practice);
    Workspace.openDraftSession(state, {
      draft,
      source: 'practice',
      createEmptyDraft: () => createEmptyDraft(state),
      isDirty: true,
      tab: 'general'
    });
    helpers.save?.();
    helpers.render?.();
    helpers.toast?.(helpers.i18n?.t('ui.workspaceMaskOpened', 'Nuova maschera aperta') || 'Nuova maschera aperta', 'info');
  }

  function saveActive(state, helpers = {}, closeAfterSave = false) {
    const session = activeSession(state);
    if (!session) return;
    const errors = validationErrors(session.draft, helpers.i18n);
    if (errors.length) {
      helpers.toast?.(errors[0], 'warning');
      return;
    }
    const savedRecord = upsertRecord(state, normalizeDraftForSave(session.draft));
    syncSessionDraft(session, savedRecord);
    Workspace.markSessionSaved(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
    helpers.save?.();
    if (closeAfterSave) {
      Workspace.closeSession(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
      helpers.toast?.(helpers.i18n?.t('ui.customsInstructionsSavedAndClosed', 'Istruzione salvata e maschera chiusa.') || 'Istruzione salvata e maschera chiusa.', 'success');
    } else {
      helpers.toast?.(session.draft.editingRecordId ? (helpers.i18n?.t('ui.customsInstructionsUpdated', 'Istruzione aggiornata correttamente') || 'Istruzione aggiornata correttamente') : (helpers.i18n?.t('ui.customsInstructionsSavedSuccess', 'Istruzione salvata correttamente') || 'Istruzione salvata correttamente'), 'success');
    }
    helpers.save?.();
    helpers.render?.();
  }

  function bind(helpers = {}) {
    const root = helpers.root;
    const state = helpers.state;
    if (!root || !state) return;
    ensureState(state);

    root.querySelector('[data-customs-open-active-practice]')?.addEventListener('click', () => {
      const practice = helpers.getSelectedPractice?.() || getPracticeById(state, state.selectedPracticeId);
      openFromPractice(state, practice, helpers);
    });

    root.querySelector('[data-customs-open-picked-practice]')?.addEventListener('click', () => {
      const picker = root.querySelector('[data-customs-practice-picker]');
      const practice = getPracticeById(state, picker?.value || '');
      openFromPractice(state, practice, helpers);
    });

    const openFromSearch = () => {
      const input = root.querySelector('[data-customs-practice-search]');
      const result = findPracticeBySearch(state, input?.value || '');
      if (!result.practice) {
        helpers.toast?.(helpers.i18n?.t('ui.customsInstructionsSearchNoMatch', 'Nessuna pratica trovata con questo numero.') || 'Nessuna pratica trovata con questo numero.', 'warning');
        return;
      }
      openFromPractice(state, result.practice, helpers);
      if (result.totalMatches > 1 && result.mode === 'fuzzy') {
        helpers.toast?.(helpers.i18n?.t('ui.customsInstructionsSearchMultiple', 'Trovate più pratiche: aperta automaticamente la più recente.') || 'Trovate più pratiche: aperta automaticamente la più recente.', 'info');
      }
    };

    root.querySelector('[data-customs-open-search-practice]')?.addEventListener('click', openFromSearch);
    root.querySelector('[data-customs-practice-search]')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      openFromSearch();
    });

    root.querySelectorAll('[data-customs-open-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const recordId = String(button.dataset.customsOpenRecord || '').trim();
        const record = (state.customsInstructionRecords || []).find((entry) => String(entry?.id || '').trim() === recordId) || null;
        if (!record) {
          helpers.toast?.(helpers.i18n?.t('ui.customsInstructionsRecordMissing', 'Record non trovato.') || 'Record non trovato.', 'warning');
          return;
        }
        Workspace.openRecordSession(state, record, { createEmptyDraft: () => createEmptyDraft(state), tab: 'general' });
        helpers.save?.();
        helpers.render?.();
      });
    });

    root.querySelectorAll('[data-customs-session-switch]').forEach((button) => {
      button.addEventListener('click', () => {
        Workspace.switchSession(state, String(button.dataset.customsSessionSwitch || '').trim(), { createEmptyDraft: () => createEmptyDraft(state) });
        helpers.save?.();
        helpers.render?.();
      });
    });

    root.querySelectorAll('[data-customs-session-close]').forEach((button) => {
      button.addEventListener('click', async () => {
        const sessionId = String(button.dataset.customsSessionClose || '').trim();
        const hasUnsaved = Workspace.hasSessionUnsavedChanges(state, sessionId, { createEmptyDraft: () => createEmptyDraft(state) });
        if (hasUnsaved) {
          const confirmed = await maybeConfirmClose({ ...helpers, confirmClose: () => helpers.confirmClose?.(sessionId) });
          if (!confirmed) return;
        }
        Workspace.closeSession(state, sessionId, { createEmptyDraft: () => createEmptyDraft(state) });
        helpers.save?.();
        helpers.render?.();
      });
    });

    root.querySelector('[data-customs-close-active]')?.addEventListener('click', async () => {
      const session = activeSession(state);
      if (!session) return;
      const hasUnsaved = Workspace.hasSessionUnsavedChanges(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
      if (hasUnsaved) {
        const confirmed = await maybeConfirmClose({ ...helpers, confirmClose: () => helpers.confirmClose?.(session.id) });
        if (!confirmed) return;
      }
      Workspace.closeSession(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
      helpers.save?.();
      helpers.render?.();
      helpers.toast?.(helpers.i18n?.t('ui.workspaceMaskClosed', 'Maschera chiusa') || 'Maschera chiusa', 'info');
    });

    root.querySelectorAll('[data-customs-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = activeSession(state);
        if (!session) return;
        Workspace.setSessionTab(state, session.id, String(button.dataset.customsTab || 'general').trim() || 'general', { createEmptyDraft: () => createEmptyDraft(state) });
        helpers.save?.();
        helpers.render?.();
      });
    });

    root.querySelectorAll('[data-customs-field]').forEach((field) => {
      const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, () => {
        syncActiveField(root, state, field);
        helpers.save?.();
      });
    });

    root.querySelectorAll('[data-customs-line-field]').forEach((field) => {
      const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, () => {
        syncActiveLineField(state, field);
        helpers.save?.();
      });
    });

    root.querySelector('[data-customs-add-line]')?.addEventListener('click', () => {
      const session = activeSession(state);
      if (!session) return;
      if (!Array.isArray(session.draft.lineItems)) session.draft.lineItems = [];
      session.draft.lineItems.push(emptyLineForMode(session.draft.mode));
      markDirty(state, session.id);
      helpers.save?.();
      helpers.render?.();
    });

    root.querySelectorAll('[data-customs-remove-line]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = activeSession(state);
        if (!session) return;
        const index = Number(button.dataset.customsRemoveLine ?? -1);
        if (!Number.isInteger(index) || index < 0) return;
        session.draft.lineItems.splice(index, 1);
        markDirty(state, session.id);
        helpers.save?.();
        helpers.render?.();
      });
    });

    root.querySelector('[data-customs-save]')?.addEventListener('click', () => {
      saveActive(state, helpers, false);
    });

    root.querySelector('[data-customs-save-close]')?.addEventListener('click', () => {
      saveActive(state, helpers, true);
    });
  }

  return {
    bind,
    buildDraftFromPractice,
    createEmptyDraft,
    ensureState,
    render
  };
})();
