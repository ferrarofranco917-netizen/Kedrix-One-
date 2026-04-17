window.KedrixOneMasterDataQuickAdd = (() => {
  'use strict';

  const MasterDataEntities = window.KedrixOneMasterDataEntities || null;
  const VatAutofill = window.KedrixOneVatAutofill || null;

  function getImportFoundation() {
    return window.KedrixOneImportFoundation || null;
  }

  function getMasterDataOverview() {
    return window.KedrixOneMasterDataOverview || null;
  }

  function ensureModuleState(state) {
    if (!state || typeof state !== 'object') {
      return { activeEntity: 'client', quickAddContext: null, formDrafts: {}, selectedRecordId: '', searchQuery: '' };
    }
    if (!state.masterDataModule || typeof state.masterDataModule !== 'object') {
      state.masterDataModule = { activeEntity: 'client', quickAddContext: null, formDrafts: {}, selectedRecordId: '', searchQuery: '' };
    }
    if (!state.masterDataModule.formDrafts || typeof state.masterDataModule.formDrafts !== 'object') {
      state.masterDataModule.formDrafts = {};
    }
    if (!state.masterDataModule.activeEntity) state.masterDataModule.activeEntity = 'client';
    if (typeof state.masterDataModule.selectedRecordId !== 'string') state.masterDataModule.selectedRecordId = '';
    if (typeof state.masterDataModule.searchQuery !== 'string') state.masterDataModule.searchQuery = '';
    return state.masterDataModule;
  }

  function getEntityDefinitions(i18n) {
    return MasterDataEntities && typeof MasterDataEntities.getEntityDefinitions === 'function'
      ? MasterDataEntities.getEntityDefinitions(i18n)
      : {};
  }

  function normalizePracticeFieldName(fieldName) {
    const clean = String(fieldName || '').trim();
    return clean === 'client' ? 'clientName' : clean;
  }

  function resolveEntityKeyForField(fieldName) {
    const normalizedFieldName = normalizePracticeFieldName(fieldName);
    return MasterDataEntities && typeof MasterDataEntities.resolveEntityKeyForField === 'function'
      ? MasterDataEntities.resolveEntityKeyForField(normalizedFieldName)
      : '';
  }

  function supportsQuickAdd(fieldName) {
    return Boolean(resolveEntityKeyForField(fieldName));
  }

  function getEntries(state, entityKey) {
    if (MasterDataEntities && typeof MasterDataEntities.listEntityRecords === 'function') {
      return MasterDataEntities.listEntityRecords(state, entityKey);
    }
    return [];
  }

  function getFormDraft(state, entityKey) {
    const moduleState = ensureModuleState(state);
    if (!moduleState.formDrafts[entityKey] || typeof moduleState.formDrafts[entityKey] !== 'object') {
      moduleState.formDrafts[entityKey] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
        ? MasterDataEntities.createFormDraft(entityKey)
        : { id: '', value: '', description: '', city: '' };
    }
    return moduleState.formDrafts[entityKey];
  }

  function resetEntityDraft(state, entityKey) {
    const moduleState = ensureModuleState(state);
    moduleState.formDrafts[entityKey] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
      ? MasterDataEntities.createFormDraft(entityKey)
      : { id: '', value: '', description: '', city: '' };
    moduleState.selectedRecordId = '';
    return moduleState.formDrafts[entityKey];
  }

  function setActiveEntity(state, entityKey) {
    const moduleState = ensureModuleState(state);
    if (!entityKey) return;
    moduleState.activeEntity = entityKey;
    moduleState.selectedRecordId = '';
    moduleState.searchQuery = '';
    getFormDraft(state, entityKey);
  }

  function prepareQuickAdd(state, context = {}) {
    const normalizedFieldName = normalizePracticeFieldName(context.fieldName);
    const entityKey = context.entityKey || resolveEntityKeyForField(normalizedFieldName);
    if (!entityKey) return null;
    const moduleState = ensureModuleState(state);
    moduleState.activeEntity = entityKey;
    moduleState.selectedRecordId = '';
    moduleState.searchQuery = '';
    moduleState.formDrafts[entityKey] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
      ? MasterDataEntities.createFormDraft(entityKey)
      : { id: '', value: '', description: '', city: '' };
    moduleState.quickAddContext = {
      entityKey,
      fieldName: normalizedFieldName,
      returnRoute: String(context.returnRoute || 'practices').trim() || 'practices',
      returnTab: String(context.returnTab || 'practice').trim() || 'practice',
      returnSessionId: String(context.returnSessionId || '').trim(),
      returnFocusField: normalizePracticeFieldName(context.returnFocusField || normalizedFieldName || ''),
      returnFocusTab: String(context.returnFocusTab || context.returnTab || 'practice').trim() || 'practice',
      practiceReference: String(context.practiceReference || '').trim()
    };
    return moduleState.quickAddContext;
  }

  function clearQuickAdd(state) {
    const moduleState = ensureModuleState(state);
    moduleState.quickAddContext = null;
  }

  function applyEntryToDraft(state, context, result) {
    if (!state || !context || !result) return;
    const draft = state.draftPractice || (state.draftPractice = { dynamicData: {}, linkedEntities: {} });
    if (!draft.dynamicData || typeof draft.dynamicData !== 'object') draft.dynamicData = {};
    if (!draft.linkedEntities || typeof draft.linkedEntities !== 'object') draft.linkedEntities = {};
    const normalizedFieldName = normalizePracticeFieldName(context.fieldName);

    if (MasterDataEntities && typeof MasterDataEntities.applyLinkedRecordToDraft === 'function' && normalizedFieldName) {
      MasterDataEntities.applyLinkedRecordToDraft({
        state,
        draft,
        fieldName: normalizedFieldName,
        entityKey: context.entityKey,
        record: result.record || null,
        value: result.value || ''
      });
      return;
    }

    if (context.entityKey === 'client' || normalizedFieldName === 'clientName') {
      draft.clientName = result.value;
      draft.clientId = result.relatedId || '';
      return;
    }

    if (normalizedFieldName) {
      draft.dynamicData[normalizedFieldName] = result.value;
      if (MasterDataEntities && typeof MasterDataEntities.getRelationFieldName === 'function') {
        const relationFieldName = MasterDataEntities.getRelationFieldName(normalizedFieldName);
        if (relationFieldName) draft.dynamicData[relationFieldName] = result.relatedId || '';
      }
    }
  }

  function buildQuickAddButton(fieldName, i18n) {
    const normalizedFieldName = normalizePracticeFieldName(fieldName);
    const entityKey = resolveEntityKeyForField(normalizedFieldName);
    if (!entityKey) return '';
    const defs = getEntityDefinitions(i18n);
    const def = defs[entityKey];
    const title = i18n && typeof i18n.t === 'function'
      ? i18n.t('ui.quickAddButtonTitle', `Aggiungi rapidamente in ${def.familyLabel}`)
      : `Aggiungi rapidamente in ${def.familyLabel}`;
    return `<button type="button" class="field-inline-action quick-add-button" data-quick-add-field="${normalizedFieldName}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">+</button>`;
  }

  function buildOpenLinkedButton({ state, draft, fieldName, i18n }) {
    const normalizedFieldName = normalizePracticeFieldName(fieldName);
    const entityKey = resolveEntityKeyForField(normalizedFieldName);
    if (!entityKey || !MasterDataEntities || typeof MasterDataEntities.getLinkedRecordFromDraft !== 'function') return '';
    const linkedRecord = MasterDataEntities.getLinkedRecordFromDraft({ state, draft, fieldName: normalizedFieldName });
    if (!linkedRecord || !linkedRecord.id) return '';
    const defs = getEntityDefinitions(i18n);
    const def = defs[entityKey];
    const title = i18n && typeof i18n.t === 'function'
      ? i18n.t('ui.openLinkedRecordButtonTitle', `Apri la scheda collegata in ${def.familyLabel}`)
      : `Apri la scheda collegata in ${def.familyLabel}`;
    return `<button type="button" class="field-inline-action open-linked-button" data-open-linked-field="${normalizedFieldName}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">↗</button>`;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function syncDraftFromForm(form, draft) {
    if (!form || !draft) return draft;
    const formData = new FormData(form);
    Array.from(form.querySelectorAll('[name]')).forEach((node) => {
      if (!node.name) return;
      if (node.type === 'checkbox') draft[node.name] = Boolean(node.checked);
      else draft[node.name] = String(formData.get(node.name) || '').trim();
    });
    return draft;
  }

  function getFilteredEntries(entries, query) {
    const clean = String(query || '').trim().toLowerCase();
    if (!clean) return entries;
    return entries.filter((entry) => [entry.primary, entry.secondary, entry.tertiary, entry.value].some((part) => String(part || '').toLowerCase().includes(clean)));
  }

  function openExistingRecord(state, entityKey, recordId) {
    const moduleState = ensureModuleState(state);
    if (!recordId || !MasterDataEntities || typeof MasterDataEntities.getEntityRecordById !== 'function') {
      moduleState.selectedRecordId = '';
      resetEntityDraft(state, entityKey);
      return null;
    }
    const record = MasterDataEntities.getEntityRecordById(state, entityKey, recordId);
    if (!record) return null;
    moduleState.selectedRecordId = recordId;
    moduleState.formDrafts[entityKey] = MasterDataEntities.createFormDraft(entityKey, record);
    return record;
  }

  function renderEntryFormFields({ activeDef, formDraft, t }) {
    const structuredFields = MasterDataEntities && typeof MasterDataEntities.getFormFields === 'function'
      ? MasterDataEntities.getFormFields(activeDef.key, t)
      : [];
    if (Array.isArray(structuredFields) && structuredFields.length) {
      const blocks = structuredFields.map((field) => {
        const fieldId = `masterData_${field.name}`;
        const requiredMark = field.required ? ' <span class="required-mark">*</span>' : '';
        if (field.type === 'textarea') {
          return `<div class="field ${field.full ? 'full' : ''}"><label for="${fieldId}">${escapeHtml(field.label)}${requiredMark}</label><textarea id="${fieldId}" name="${field.name}" rows="3">${escapeHtml(formDraft[field.name] || '')}</textarea></div>`;
        }
        if (field.type === 'checkbox') {
          return `<div class="field ${field.full ? 'full' : ''}"><label class="checkbox-chip master-data-checkbox"><input id="${fieldId}" name="${field.name}" type="checkbox" ${formDraft[field.name] !== false ? 'checked' : ''} /> ${escapeHtml(field.label)}</label></div>`;
        }
        if (field.lookupAction === 'vat-autofill') {
          const lookupStatus = VatAutofill && typeof VatAutofill.renderLookupStatus === 'function'
            ? VatAutofill.renderLookupStatus(formDraft, t)
            : '';
          return `<div class="field ${field.full ? 'full' : ''} master-data-lookup-field"><label for="${fieldId}">${escapeHtml(field.label)}${requiredMark}</label><div class="master-data-lookup-row"><input id="${fieldId}" name="${field.name}" type="text" value="${escapeHtml(formDraft[field.name] || '')}" autocomplete="off" /><button class="btn secondary master-data-lookup-button" id="masterDataVatLookupButton" type="button">${escapeHtml(t.t('ui.masterDataVatLookupAction', 'Recupera dati'))}</button></div>${lookupStatus}</div>`;
        }
        return `<div class="field ${field.full ? 'full' : ''}"><label for="${fieldId}">${escapeHtml(field.label)}${requiredMark}</label><input id="${fieldId}" name="${field.name}" type="text" value="${escapeHtml(formDraft[field.name] || '')}" autocomplete="off" /></div>`;
      }).join('');
      return `<div class="form-grid two master-data-entity-grid">${blocks}</div>`;
    }

    const currentValue = escapeHtml(formDraft.value || '');
    const currentDescription = escapeHtml(formDraft.description || '');
    const currentCity = escapeHtml(formDraft.city || '');
    return `<div class="form-grid two"><div class="field ${activeDef.supportsDescription ? '' : (activeDef.supportsCity ? '' : 'full')}"><label for="masterDataValue">${escapeHtml(activeDef.valueLabel)}</label><input id="masterDataValue" name="value" type="text" value="${currentValue}" autocomplete="off" /></div>${activeDef.supportsDescription ? `<div class="field"><label for="masterDataDescription">${escapeHtml(t.t('ui.masterDataDescription', 'Descrizione'))}</label><input id="masterDataDescription" name="description" type="text" value="${currentDescription}" autocomplete="off" /></div>` : ''}${activeDef.supportsCity ? `<div class="field"><label for="masterDataCity">${escapeHtml(t.t('ui.city', 'Città'))}</label><input id="masterDataCity" name="city" type="text" value="${currentCity}" autocomplete="off" /></div>` : ''}</div>`;
  }

  function renderRecordMeta(formDraft, t) {
    const chips = [];
    if (formDraft.id) chips.push(`<span class="badge">${escapeHtml(t.t('ui.masterDataRecordCode', 'Codice scheda'))}: ${escapeHtml(formDraft.id)}</span>`);
    if (formDraft.vatLookupSource) chips.push(`<span class="badge info">${escapeHtml(formDraft.vatLookupSource)}</span>`);
    if (formDraft.vatLookupAt) chips.push(`<span class="badge">${escapeHtml(t.t('ui.masterDataLastLookup', 'Ultimo lookup'))}: ${escapeHtml(new Date(formDraft.vatLookupAt).toLocaleDateString('it-IT'))}</span>`);
    if (!chips.length) return '';
    return `<div class="master-data-meta-strip">${chips.join('')}</div>`;
  }

  function renderList(entries, filteredEntries, activeRecordId, t) {
    if (!entries.length) {
      return `<div class="master-data-empty-state">${escapeHtml(t.t('ui.masterDataNoEntries', 'Nessun valore presente in questa anagrafica.'))}</div>`;
    }
    if (!filteredEntries.length) {
      return `<div class="master-data-empty-state">${escapeHtml(t.t('ui.masterDataSearchNoResults', 'Nessun risultato per questa ricerca.'))}</div>`;
    }
    return `<div class="master-data-list">${filteredEntries.map((entry) => {
      const active = String(activeRecordId || '') === String(entry.id || '');
      return `<button type="button" class="master-data-row ${active ? 'active' : ''}" data-master-record-id="${escapeHtml(entry.id || '')}"><span class="master-data-row-main"><strong>${escapeHtml(entry.primary)}</strong><small>${escapeHtml(entry.secondary || '—')}</small></span><span class="master-data-row-side">${escapeHtml(entry.tertiary || '—')}</span></button>`;
    }).join('')}</div>`;
  }

  function getRouteEntityMeta(state, defs) {
    const route = String(state && state.currentRoute || '').trim();
    const map = {
      'master-data/fornitori': 'supplier',
      'master-data/clienti': 'client',
      'master-data/importatori': 'importer',
      'master-data/destinatari': 'consignee',
      'master-data/mittenti': 'sender',
      'master-data/compagnie-marittime': 'shippingCompany',
      'master-data/compagnie-aeree': 'airline',
      'master-data/vettori': 'carrier',
      'master-data/navi': 'vessel',
      'master-data/taric': 'taric',
      'master-data/dogane': 'customsOffice',
      'master-data/porti': 'seaPort',
      'master-data/aeroporti': 'airport',
      'master-data/terminal': 'terminal',
      'master-data/origini': 'origin',
      'master-data/destinazioni': 'destination',
      'master-data/localita-logistiche': 'logisticsLocation',
      'master-data/depositi': 'deposit',
      'master-data/collega-a': 'warehouseLink',
      'master-data/codici-articolo': 'articleCode',
      'master-data/tipologie-unita': 'transportUnitType'
    };
    const key = map[route] || '';
    return key && defs[key] ? defs[key] : null;
  }

  function renderPanel({ state, module, t }) {
    const defs = getEntityDefinitions(t);
    const moduleState = ensureModuleState(state);
    const quickAddContext = moduleState.quickAddContext;
    const activeEntity = quickAddContext?.entityKey || moduleState.activeEntity || 'client';
    const activeDef = defs[activeEntity] || defs.client;
    const entries = getEntries(state, activeEntity);
    const filteredEntries = getFilteredEntries(entries, moduleState.searchQuery);
    const formDraft = getFormDraft(state, activeEntity);
    const isEditing = Boolean(formDraft.id);
    const familyOptions = Object.values(defs);
    const MasterDataOverview = getMasterDataOverview();
    const ImportFoundation = getImportFoundation();
    const routeEntityMeta = getRouteEntityMeta(state, defs);
    const overviewHtml = MasterDataOverview && typeof MasterDataOverview.renderSummary === 'function'
      ? MasterDataOverview.renderSummary({ state, activeEntity, i18n: t })
      : `<section class="panel master-data-active-context"><div class="panel-head compact"><div><h3 class="panel-title">${escapeHtml(t.t('ui.masterDataOverviewFallbackTitle', 'Fondazione anagrafiche'))}</h3><p class="panel-subtitle">${escapeHtml(t.t('ui.masterDataOverviewFallbackDetail', 'Panoramica temporaneamente non disponibile: ricarica la schermata per inizializzare il riepilogo anagrafiche.'))}</p></div></div></section>`;
    const importHtml = !quickAddContext && ImportFoundation && typeof ImportFoundation.renderPanel === 'function'
      ? ImportFoundation.renderPanel({ state, activeEntity, i18n: t })
      : '';

    return `
      <section class="hero">
        <div class="hero-meta">${escapeHtml(routeEntityMeta ? 'Master data · ' + routeEntityMeta.familyLabel : 'Master data')}</div>
        <h2>${escapeHtml(routeEntityMeta ? routeEntityMeta.familyLabel : (module?.label || t.t('ui.masterDataTitle', 'Anagrafiche')))}</h2>
        <p>${escapeHtml(routeEntityMeta ? 'Sottomodulo reale di Anagrafiche agganciato alla famiglia operativa già presente nel motore master-data.' : t.t('ui.masterDataIntro', 'Gestisci anagrafiche e directory operative condivise tra pratiche e moduli collegati.'))}</p>
      </section>

      ${overviewHtml}
      ${importHtml}

      <section class="master-data-shell two-col master-data-shell-v2">
        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${escapeHtml(t.t('ui.masterDataCurrentList', 'Elenco corrente'))}</h3>
              <p class="panel-subtitle">${escapeHtml(activeDef.familyLabel)}</p>
            </div>
            <button class="btn secondary" type="button" id="masterDataNewButton">${escapeHtml(t.t('ui.masterDataNewEntry', 'Nuova scheda'))}</button>
          </div>

          ${quickAddContext ? `<div class="master-data-return-banner"><span class="badge info">${escapeHtml(t.t('ui.quickAdd', 'Quick add'))}</span><span>${escapeHtml(activeDef.singleLabel)}</span>${quickAddContext.practiceReference ? `<strong>${escapeHtml(quickAddContext.practiceReference)}</strong>` : ''}</div>` : ''}

          <div class="form-grid two master-data-config-grid">
            <div class="field full">
              <label for="masterDataFamilySelect">${escapeHtml(t.t('ui.masterDataFamilyLabel', 'Famiglia anagrafica'))}</label>
              <select id="masterDataFamilySelect" ${quickAddContext ? 'disabled' : ''}>
                ${familyOptions.map((item) => `<option value="${escapeHtml(item.key)}" ${item.key === activeEntity ? 'selected' : ''}>${escapeHtml(item.familyLabel)}</option>`).join('')}
              </select>
            </div>
            <div class="field full">
              <label for="masterDataSearchInput">${escapeHtml(t.t('ui.search', 'Cerca'))}</label>
              <input id="masterDataSearchInput" type="search" value="${escapeHtml(moduleState.searchQuery || '')}" placeholder="${escapeHtml(t.t('ui.masterDataSearchPlaceholder', 'Cerca per nome, città, P.IVA o codice'))}" autocomplete="off" />
            </div>
          </div>

          <div class="master-data-list-summary">${escapeHtml(`${filteredEntries.length} / ${entries.length}`)} ${escapeHtml(t.t('ui.masterDataVisibleRecords', 'schede visibili'))}</div>
          ${renderList(entries, filteredEntries, moduleState.selectedRecordId, t)}
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">${escapeHtml(isEditing ? t.t('ui.masterDataEditTitle', 'Scheda anagrafica') : t.t('ui.masterDataCreateTitle', 'Nuova anagrafica'))}</h3>
              <p class="panel-subtitle">${escapeHtml(isEditing ? t.t('ui.masterDataEditHint', 'Apri, modifica e salva la scheda selezionata.') : t.t('ui.masterDataCreateHint', 'Compila una nuova scheda completa per questa famiglia anagrafica.'))}</p>
            </div>
          </div>

          ${renderRecordMeta(formDraft, t)}

          <form id="masterDataEntryForm" class="master-data-form-stack">
            ${renderEntryFormFields({ activeDef, formDraft, t })}
            <div class="form-actions master-data-actions">
              <button class="btn" type="submit">${escapeHtml(isEditing ? t.t('ui.masterDataUpdateEntry', 'Salva modifiche') : t.t('ui.masterDataSaveEntry', 'Salva anagrafica'))}</button>
              ${isEditing ? `<button class="btn secondary" id="masterDataResetButton" type="button">${escapeHtml(t.t('ui.masterDataResetForm', 'Nuova scheda'))}</button>` : ''}
              ${quickAddContext ? `<button class="btn secondary" id="masterDataReturnButton" type="button">${escapeHtml(t.t('ui.masterDataBackToPractice', 'Torna alla pratica'))}</button>` : ''}
            </div>
          </form>
        </article>
      </section>

      ${activeDef.structured && !quickAddContext && VatAutofill && typeof VatAutofill.renderConfigPanel === 'function' ? VatAutofill.renderConfigPanel(state, t) : ''}`;
  }

  function bind({ state, root, save, render, navigate, toast, buildCurrentPracticeReference, restorePracticeContext, markPracticeDirty, i18n }) {
    const moduleState = ensureModuleState(state);
    const ImportFoundation = getImportFoundation();
    const familySelect = root.querySelector('#masterDataFamilySelect');
    const searchInput = root.querySelector('#masterDataSearchInput');
    const form = root.querySelector('#masterDataEntryForm');
    const returnButton = root.querySelector('#masterDataReturnButton');
    const resetButton = root.querySelector('#masterDataResetButton');
    const newButton = root.querySelector('#masterDataNewButton');
    const vatLookupButton = root.querySelector('#masterDataVatLookupButton');
    const activeEntity = moduleState.quickAddContext?.entityKey || moduleState.activeEntity || 'client';

    familySelect?.addEventListener('change', (event) => {
      setActiveEntity(state, event.target.value || 'client');
      resetEntityDraft(state, event.target.value || 'client');
      save();
      render();
    });

    searchInput?.addEventListener('input', (event) => {
      moduleState.searchQuery = String(event.target.value || '');
      save();
      render();
    });

    root.querySelectorAll('[data-master-record-id]').forEach((button) => {
      button.addEventListener('click', () => {
        openExistingRecord(state, activeEntity, button.dataset.masterRecordId || '');
        save();
        render();
      });
    });

    newButton?.addEventListener('click', () => {
      resetEntityDraft(state, activeEntity);
      save();
      render();
    });

    resetButton?.addEventListener('click', () => {
      resetEntityDraft(state, activeEntity);
      save();
      render();
    });

    returnButton?.addEventListener('click', () => {
      const context = moduleState.quickAddContext;
      if (typeof restorePracticeContext === 'function') {
        restorePracticeContext(context || { returnTab: 'practice' });
      }
      clearQuickAdd(state);
      save();
      navigate(context?.returnRoute || 'practices', { skipScrollTop: true });
    });

    if (VatAutofill && typeof VatAutofill.bindConfigPanel === 'function') {
      VatAutofill.bindConfigPanel({ state, root, save, render, toast, i18n });
    }

    if (ImportFoundation && typeof ImportFoundation.bind === 'function') {
      ImportFoundation.bind({ state, root, save, render, toast, i18n });
    }

    vatLookupButton?.addEventListener('click', async () => {
      const targetEntity = moduleState.quickAddContext?.entityKey || activeEntity;
      const currentDraft = getFormDraft(state, targetEntity);
      syncDraftFromForm(form, currentDraft);
      vatLookupButton.disabled = true;
      vatLookupButton.classList.add('is-loading');
      const result = VatAutofill && typeof VatAutofill.lookupByVatNumber === 'function'
        ? await VatAutofill.lookupByVatNumber({ state, entityKey: targetEntity, vatNumber: currentDraft.vatNumber || '' })
        : { ok: false, lookupStatus: 'lookup-error' };

      if (result && result.ok && result.found && VatAutofill && typeof VatAutofill.applyLookupToDraft === 'function') {
        const config = VatAutofill.ensureConfig(state);
        VatAutofill.applyLookupToDraft(currentDraft, result, config);
      } else if (VatAutofill && typeof VatAutofill.setDraftLookupMeta === 'function') {
        VatAutofill.setDraftLookupMeta(currentDraft, {
          vatLookupStatus: result.lookupStatus || 'lookup-error',
          vatLookupSource: result.source || '',
          vatLookupAt: new Date().toISOString(),
          vatLookupVat: result.normalizedVat ? result.normalizedVat.formatted : String(currentDraft.vatNumber || '').trim()
        });
      }

      save();
      render();
      toast(
        VatAutofill && typeof VatAutofill.messageForLookupResult === 'function' ? VatAutofill.messageForLookupResult(result, i18n) : i18n.t('ui.masterDataVatLookupError', 'Recupero dati non riuscito.'),
        VatAutofill && typeof VatAutofill.toneForLookupResult === 'function' ? VatAutofill.toneForLookupResult(result) : 'warning'
      );
    });

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const targetEntity = moduleState.quickAddContext?.entityKey || activeEntity;
      const currentDraft = getFormDraft(state, targetEntity);
      syncDraftFromForm(form, currentDraft);

      const defs = getEntityDefinitions(i18n);
      const def = defs[targetEntity];
      const payload = { ...currentDraft };
      const result = def && def.structured && MasterDataEntities && typeof MasterDataEntities.saveBusinessEntity === 'function'
        ? MasterDataEntities.saveBusinessEntity(state, targetEntity, payload, i18n)
        : (MasterDataEntities && typeof MasterDataEntities.saveDirectoryEntity === 'function'
          ? MasterDataEntities.saveDirectoryEntity(state, targetEntity, payload, i18n)
          : { ok: false, reason: 'invalid-entity' });

      if (!result.ok) {
        toast(i18n.t('ui.masterDataMissingValue', 'Compila il valore da inserire.'), 'warning');
        return;
      }

      const context = moduleState.quickAddContext;
      if (context) {
        applyEntryToDraft(state, context, result);
        if (typeof markPracticeDirty === 'function') markPracticeDirty(true);
        if (context.entityKey === 'client' && typeof buildCurrentPracticeReference === 'function' && state.draftPractice) {
          state.draftPractice.generatedReference = buildCurrentPracticeReference();
        }
        if (typeof restorePracticeContext === 'function') {
          restorePracticeContext(context);
        }
        clearQuickAdd(state);
        moduleState.selectedRecordId = result.relatedId || '';
        moduleState.formDrafts[targetEntity] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
          ? MasterDataEntities.createFormDraft(targetEntity, result.record || null)
          : { id: '', value: '', description: '', city: '' };
        save();
        navigate(context.returnRoute || 'practices', { skipScrollTop: true });
        toast(
          result.updated
            ? i18n.t('ui.masterDataQuickAddUpdated', 'Anagrafica aggiornata e riportata nella pratica.')
            : (result.created
              ? i18n.t('ui.masterDataQuickAddSaved', 'Anagrafica salvata e riportata nella pratica.')
              : i18n.t('ui.masterDataQuickAddSelected', 'Valore già presente: selezionato nella pratica.')),
          result.updated || result.created ? 'success' : 'info'
        );
        return;
      }

      moduleState.selectedRecordId = result.relatedId || '';
      moduleState.formDrafts[targetEntity] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
        ? MasterDataEntities.createFormDraft(targetEntity, result.record || null)
        : { id: '', value: '', description: '', city: '' };

      save();
      render();
      toast(
        result.updated
          ? i18n.t('ui.masterDataUpdated', 'Anagrafica aggiornata correttamente.')
          : (result.created
            ? i18n.t('ui.masterDataSaved', 'Anagrafica salvata correttamente.')
            : i18n.t('ui.masterDataAlreadyPresent', 'Valore già presente in anagrafica.')),
        result.updated || result.created ? 'success' : 'info'
      );
    });
  }


  function openLinkedRecordFromPractice(state, context = {}) {
    const normalizedFieldName = normalizePracticeFieldName(context.fieldName);
    const entityKey = context.entityKey || resolveEntityKeyForField(normalizedFieldName);
    if (!entityKey || !MasterDataEntities || typeof MasterDataEntities.getLinkedRecordFromDraft !== 'function') return null;
    const draft = state && state.draftPractice ? state.draftPractice : null;
    const linkedRecord = MasterDataEntities.getLinkedRecordFromDraft({ state, draft, fieldName: normalizedFieldName });
    if (!linkedRecord || !linkedRecord.id) return null;
    const moduleState = ensureModuleState(state);
    moduleState.activeEntity = entityKey;
    moduleState.searchQuery = '';
    moduleState.selectedRecordId = String(linkedRecord.id || '').trim();
    moduleState.formDrafts[entityKey] = MasterDataEntities && typeof MasterDataEntities.createFormDraft === 'function'
      ? MasterDataEntities.createFormDraft(entityKey, linkedRecord)
      : { id: '', value: '', description: '', city: '' };
    moduleState.quickAddContext = {
      entityKey,
      fieldName: normalizedFieldName,
      returnRoute: String(context.returnRoute || 'practices').trim() || 'practices',
      returnTab: String(context.returnTab || 'practice').trim() || 'practice',
      returnSessionId: String(context.returnSessionId || '').trim(),
      returnFocusField: normalizePracticeFieldName(context.returnFocusField || normalizedFieldName || ''),
      returnFocusTab: String(context.returnFocusTab || context.returnTab || 'practice').trim() || 'practice',
      practiceReference: String(context.practiceReference || '').trim()
    };
    return moduleState.quickAddContext;
  }

  return {
    ensureModuleState,
    resolveEntityKeyForField,
    supportsQuickAdd,
    buildQuickAddButton,
    buildOpenLinkedButton,
    prepareQuickAdd,
    openLinkedRecordFromPractice,
    clearQuickAdd,
    renderPanel,
    bind
  };
})();
