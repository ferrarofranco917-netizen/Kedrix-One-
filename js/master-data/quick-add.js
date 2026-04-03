window.KedrixOneMasterDataQuickAdd = (() => {
  'use strict';

  function ensureModuleState(state) {
    if (!state || typeof state !== 'object') return { activeEntity: 'client', quickAddContext: null, formDrafts: {} };
    if (!state.masterDataModule || typeof state.masterDataModule !== 'object') {
      state.masterDataModule = { activeEntity: 'client', quickAddContext: null, formDrafts: {} };
    }
    if (!state.masterDataModule.formDrafts || typeof state.masterDataModule.formDrafts !== 'object') {
      state.masterDataModule.formDrafts = {};
    }
    if (!state.masterDataModule.activeEntity) {
      state.masterDataModule.activeEntity = 'client';
    }
    return state.masterDataModule;
  }

  function nextSequentialId(prefix, items) {
    const max = (Array.isArray(items) ? items : []).reduce((acc, item) => {
      const raw = String(item && item.id ? item.id : '');
      const numeric = Number(raw.replace(/[^0-9]/g, ''));
      return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  function getEntityDefinitions(i18n) {
    const t = (key, fallback) => i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
    return {
      client: {
        key: 'client',
        familyLabel: t('ui.masterDataFamilyClients', 'Clienti'),
        singleLabel: t('ui.client', 'Cliente'),
        valueLabel: t('ui.masterDataClientName', 'Ragione sociale'),
        supportsCity: true,
        listType: 'clients'
      },
      importer: {
        key: 'importer',
        familyLabel: t('ui.masterDataFamilyImporters', 'Importatori'),
        singleLabel: t('ui.importer', 'Importatore'),
        valueLabel: t('ui.importer', 'Importatore'),
        directoryKey: 'importers'
      },
      consignee: {
        key: 'consignee',
        familyLabel: t('ui.masterDataFamilyConsignees', 'Destinatari'),
        singleLabel: t('ui.consignee', 'Destinatario'),
        valueLabel: t('ui.consignee', 'Destinatario'),
        directoryKey: 'consignees'
      },
      vessel: {
        key: 'vessel',
        familyLabel: t('ui.masterDataFamilyVessels', 'Navi'),
        singleLabel: t('ui.masterDataVesselSingle', 'Nave'),
        valueLabel: t('ui.masterDataVesselSingle', 'Nave'),
        directoryKey: 'vessels'
      },
      sender: {
        key: 'sender',
        familyLabel: t('ui.masterDataFamilySenders', 'Mittenti'),
        singleLabel: t('ui.masterDataSenderSingle', 'Mittente'),
        valueLabel: t('ui.masterDataSenderSingle', 'Mittente'),
        directoryKey: 'shippers'
      },
      taric: {
        key: 'taric',
        familyLabel: t('ui.masterDataFamilyTaric', 'TARIC'),
        singleLabel: t('ui.taric', 'TARIC'),
        valueLabel: t('ui.masterDataTaricCode', 'Codice TARIC'),
        supportsDescription: true,
        directoryKey: 'taricCodes'
      }
    };
  }

  function resolveEntityKeyForField(fieldName) {
    const clean = String(fieldName || '').trim();
    if (clean === 'clientName') return 'client';
    if (clean === 'importer') return 'importer';
    if (clean === 'consignee') return 'consignee';
    if (clean === 'vesselVoyage') return 'vessel';
    if (clean === 'shipper' || clean === 'sender') return 'sender';
    if (clean === 'taric') return 'taric';
    return '';
  }

  function supportsQuickAdd(fieldName) {
    return Boolean(resolveEntityKeyForField(fieldName));
  }

  function ensureDirectory(state, directoryKey) {
    if (!state.companyConfig || typeof state.companyConfig !== 'object') state.companyConfig = {};
    if (!state.companyConfig.practiceConfig || typeof state.companyConfig.practiceConfig !== 'object') {
      state.companyConfig.practiceConfig = { directories: {} };
    }
    if (!state.companyConfig.practiceConfig.directories || typeof state.companyConfig.practiceConfig.directories !== 'object') {
      state.companyConfig.practiceConfig.directories = {};
    }
    if (!Array.isArray(state.companyConfig.practiceConfig.directories[directoryKey])) {
      state.companyConfig.practiceConfig.directories[directoryKey] = [];
    }
    return state.companyConfig.practiceConfig.directories[directoryKey];
  }

  function getEntries(state, entityKey, i18n) {
    const defs = getEntityDefinitions(i18n);
    const def = defs[entityKey];
    if (!def) return [];

    if (def.listType === 'clients') {
      return (state.clients || []).map((item) => ({
        id: String(item.id || item.name || ''),
        primary: String(item.name || '').trim(),
        secondary: String(item.city || '').trim(),
        value: String(item.name || '').trim()
      })).filter((item) => item.primary);
    }

    const raw = ensureDirectory(state, def.directoryKey);
    return raw.map((item, index) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const value = String(item.value || item.code || item.name || item.label || '').trim();
        const primary = String(item.displayValue || item.label || value).trim();
        const secondary = String(item.description || item.city || item.code || '').trim();
        return { id: `${entityKey}-${index}`, primary, secondary, value: value || primary };
      }
      const value = String(item || '').trim();
      return { id: `${entityKey}-${index}`, primary: value, secondary: '', value };
    }).filter((item) => item.primary);
  }

  function getFormDraft(state, entityKey) {
    const moduleState = ensureModuleState(state);
    if (!moduleState.formDrafts[entityKey] || typeof moduleState.formDrafts[entityKey] !== 'object') {
      moduleState.formDrafts[entityKey] = { value: '', description: '', city: '' };
    }
    return moduleState.formDrafts[entityKey];
  }

  function setActiveEntity(state, entityKey) {
    const moduleState = ensureModuleState(state);
    if (!entityKey) return;
    moduleState.activeEntity = entityKey;
  }

  function prepareQuickAdd(state, context = {}) {
    const entityKey = context.entityKey || resolveEntityKeyForField(context.fieldName);
    if (!entityKey) return null;
    const moduleState = ensureModuleState(state);
    moduleState.activeEntity = entityKey;
    moduleState.quickAddContext = {
      entityKey,
      fieldName: String(context.fieldName || '').trim(),
      returnRoute: String(context.returnRoute || 'practices').trim() || 'practices',
      returnTab: String(context.returnTab || 'practice').trim() || 'practice'
    };
    return moduleState.quickAddContext;
  }

  function clearQuickAdd(state) {
    const moduleState = ensureModuleState(state);
    moduleState.quickAddContext = null;
  }

  function applyEntryToDraft(state, context, result) {
    if (!state || !context || !result) return;
    const draft = state.draftPractice || (state.draftPractice = { dynamicData: {} });
    if (!draft.dynamicData || typeof draft.dynamicData !== 'object') draft.dynamicData = {};

    if (context.entityKey === 'client' || context.fieldName === 'clientName') {
      draft.clientName = result.value;
      draft.clientId = result.relatedId || '';
      return;
    }

    if (context.fieldName) {
      draft.dynamicData[context.fieldName] = result.value;
    }
  }

  function addEntry(state, entityKey, payload = {}, i18n) {
    const defs = getEntityDefinitions(i18n);
    const def = defs[entityKey];
    if (!def) return { ok: false, reason: 'invalid-entity' };

    let value = String(payload.value || '').trim();
    const description = String(payload.description || '').trim();
    const city = String(payload.city || '').trim();
    if (entityKey === 'taric') {
      value = value.replace(/\s+/g, '');
    }
    if (!value) return { ok: false, reason: 'missing-value' };

    if (def.listType === 'clients') {
      state.clients = Array.isArray(state.clients) ? state.clients : [];
      state.contacts = Array.isArray(state.contacts) ? state.contacts : [];
      const existing = state.clients.find((item) => String(item.name || '').trim().toUpperCase() === value.toUpperCase());
      if (existing) {
        return { ok: true, created: false, value: existing.name, relatedId: existing.id };
      }
      const client = {
        id: nextSequentialId('CL-', state.clients),
        name: value,
        city,
        numberingRule: {
          prefix: '',
          separator: '-',
          includeYear: true,
          resetEveryYear: true,
          nextNumber: 1,
          lastYear: new Date().getFullYear()
        }
      };
      state.clients.push(client);
      const contactExists = state.contacts.some((item) => String(item.name || '').trim().toUpperCase() === value.toUpperCase());
      if (!contactExists) {
        state.contacts.push({ id: nextSequentialId('CNT-', state.contacts), name: value, type: 'Cliente', city });
      }
      return { ok: true, created: true, value: client.name, relatedId: client.id };
    }

    const directory = ensureDirectory(state, def.directoryKey);
    if (entityKey === 'taric') {
      const existingTaric = directory.find((item) => String((item && (item.value || item.code || item.name)) || '').trim().toUpperCase() === value.toUpperCase());
      if (existingTaric) {
        return {
          ok: true,
          created: false,
          value: String(existingTaric.value || existingTaric.code || value).trim(),
          relatedId: String(existingTaric.value || existingTaric.code || value).trim()
        };
      }
      directory.push({
        value,
        label: value,
        description,
        displayValue: description ? `${value} · ${description}` : value
      });
      return { ok: true, created: true, value, relatedId: value };
    }

    const existing = directory.find((item) => String(item && item.value !== undefined ? item.value : item || '').trim().toUpperCase() === value.toUpperCase());
    if (existing) {
      return { ok: true, created: false, value: String(existing.value !== undefined ? existing.value : existing).trim(), relatedId: value };
    }
    directory.push(value);
    return { ok: true, created: true, value, relatedId: value };
  }

  function buildQuickAddButton(fieldName, i18n) {
    const entityKey = resolveEntityKeyForField(fieldName);
    if (!entityKey) return '';
    const defs = getEntityDefinitions(i18n);
    const def = defs[entityKey];
    const title = i18n && typeof i18n.t === 'function'
      ? i18n.t('ui.quickAddButtonTitle', `Aggiungi rapidamente in ${def.familyLabel}`)
      : `Aggiungi rapidamente in ${def.familyLabel}`;
    return `<button type="button" class="field-inline-action quick-add-button" data-quick-add-field="${fieldName}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">+</button>`;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderPanel({ state, module, t }) {
    const defs = getEntityDefinitions(t);
    const moduleState = ensureModuleState(state);
    const quickAddContext = moduleState.quickAddContext;
    const activeEntity = quickAddContext?.entityKey || moduleState.activeEntity || 'client';
    const activeDef = defs[activeEntity] || defs.client;
    const entries = getEntries(state, activeEntity, t);
    const formDraft = getFormDraft(state, activeEntity);
    const familyOptions = Object.values(defs);
    const currentValue = escapeHtml(formDraft.value || '');
    const currentDescription = escapeHtml(formDraft.description || '');
    const currentCity = escapeHtml(formDraft.city || '');

    return `
      <section class="hero">
        <div class="hero-meta">Master data</div>
        <h2>${escapeHtml(module?.label || t.t('ui.masterDataTitle', 'Anagrafiche'))}</h2>
        <p>${escapeHtml(t.t('ui.masterDataIntro', 'Gestisci anagrafiche e directory operative condivise tra pratiche e moduli collegati.'))}</p>
      </section>

      <section class="master-data-shell two-col">
        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataQuickAddTitle', 'Inserimento rapido anagrafica'))}</h3>
              <p class="panel-subtitle">${escapeHtml(quickAddContext ? t.t('ui.masterDataReturnHint', 'Stai aggiungendo un valore da una pratica: al salvataggio tornerai automaticamente al punto di origine.') : t.t('ui.masterDataManualHint', 'Puoi popolare manualmente le directory operative e riutilizzarle nelle pratiche.'))}</p>
            </div>
          </div>

          ${quickAddContext ? `<div class="master-data-return-banner"><span class="badge info">${escapeHtml(t.t('ui.quickAdd', 'Quick add'))}</span><span>${escapeHtml(activeDef.singleLabel)}</span></div>` : ''}

          <div class="form-grid two master-data-config-grid">
            <div class="field full">
              <label for="masterDataFamilySelect">${escapeHtml(t.t('ui.masterDataFamilyLabel', 'Famiglia anagrafica'))}</label>
              <select id="masterDataFamilySelect" ${quickAddContext ? 'disabled' : ''}>
                ${familyOptions.map((item) => `<option value="${escapeHtml(item.key)}" ${item.key === activeEntity ? 'selected' : ''}>${escapeHtml(item.familyLabel)}</option>`).join('')}
              </select>
            </div>
          </div>

          <form id="masterDataEntryForm" class="master-data-form-stack">
            <div class="form-grid two">
              <div class="field ${activeDef.supportsDescription ? '' : (activeDef.supportsCity ? '' : 'full')}">
                <label for="masterDataValue">${escapeHtml(activeDef.valueLabel)}</label>
                <input id="masterDataValue" name="value" type="text" value="${currentValue}" autocomplete="off" />
              </div>
              ${activeDef.supportsDescription ? `<div class="field"><label for="masterDataDescription">${escapeHtml(t.t('ui.masterDataDescription', 'Descrizione'))}</label><input id="masterDataDescription" name="description" type="text" value="${currentDescription}" autocomplete="off" /></div>` : ''}
              ${activeDef.supportsCity ? `<div class="field"><label for="masterDataCity">${escapeHtml(t.t('ui.city', 'Città'))}</label><input id="masterDataCity" name="city" type="text" value="${currentCity}" autocomplete="off" /></div>` : ''}
            </div>
            <div class="form-actions master-data-actions">
              <button class="btn" type="submit">${escapeHtml(t.t('ui.masterDataSaveEntry', 'Salva anagrafica'))}</button>
              ${quickAddContext ? `<button class="btn secondary" id="masterDataReturnButton" type="button">${escapeHtml(t.t('ui.masterDataBackToPractice', 'Torna alla pratica'))}</button>` : ''}
            </div>
          </form>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataCurrentList', 'Elenco corrente'))}</h3>
              <p class="panel-subtitle">${escapeHtml(activeDef.familyLabel)}</p>
            </div>
          </div>
          <div class="table-wrap master-data-table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>${escapeHtml(activeDef.singleLabel)}</th>
                  <th>${escapeHtml(t.t('ui.details', 'Dettagli'))}</th>
                </tr>
              </thead>
              <tbody>
                ${entries.length ? entries.map((entry) => `<tr><td>${escapeHtml(entry.primary)}</td><td>${escapeHtml(entry.secondary || '—')}</td></tr>`).join('') : `<tr><td colspan="2">${escapeHtml(t.t('ui.masterDataNoEntries', 'Nessun valore presente in questa anagrafica.'))}</td></tr>`}
              </tbody>
            </table>
          </div>
        </article>
      </section>`;
  }

  function bind({ state, root, save, render, navigate, toast, buildCurrentPracticeReference, i18n }) {
    const moduleState = ensureModuleState(state);
    const familySelect = root.querySelector('#masterDataFamilySelect');
    const form = root.querySelector('#masterDataEntryForm');
    const returnButton = root.querySelector('#masterDataReturnButton');
    const activeEntity = moduleState.quickAddContext?.entityKey || moduleState.activeEntity || 'client';

    familySelect?.addEventListener('change', (event) => {
      setActiveEntity(state, event.target.value || 'client');
      save();
      render();
    });

    returnButton?.addEventListener('click', () => {
      const context = moduleState.quickAddContext;
      clearQuickAdd(state);
      save();
      navigate(context?.returnRoute || 'practices');
    });

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const targetEntity = moduleState.quickAddContext?.entityKey || activeEntity;
      const currentDraft = getFormDraft(state, targetEntity);
      currentDraft.value = String(formData.get('value') || '').trim();
      currentDraft.description = String(formData.get('description') || '').trim();
      currentDraft.city = String(formData.get('city') || '').trim();

      const result = addEntry(state, targetEntity, currentDraft, i18n);
      if (!result.ok) {
        toast(i18n.t('ui.masterDataMissingValue', 'Compila il valore da inserire.'), 'warning');
        return;
      }

      currentDraft.value = '';
      currentDraft.description = '';
      currentDraft.city = '';

      const context = moduleState.quickAddContext;
      if (context) {
        applyEntryToDraft(state, context, result);
        if (context.entityKey === 'client' && typeof buildCurrentPracticeReference === 'function' && state.draftPractice) {
          state.draftPractice.generatedReference = buildCurrentPracticeReference();
        }
        clearQuickAdd(state);
        save();
        navigate(context.returnRoute || 'practices');
        toast(
          result.created
            ? i18n.t('ui.masterDataQuickAddSaved', 'Anagrafica salvata e riportata nella pratica.')
            : i18n.t('ui.masterDataQuickAddSelected', 'Valore già presente: selezionato nella pratica.'),
          result.created ? 'success' : 'info'
        );
        return;
      }

      save();
      render();
      toast(
        result.created
          ? i18n.t('ui.masterDataSaved', 'Anagrafica salvata correttamente.')
          : i18n.t('ui.masterDataAlreadyPresent', 'Valore già presente in anagrafica.'),
        result.created ? 'success' : 'info'
      );
    });
  }

  return {
    ensureModuleState,
    resolveEntityKeyForField,
    supportsQuickAdd,
    buildQuickAddButton,
    prepareQuickAdd,
    clearQuickAdd,
    renderPanel,
    bind
  };
})();
