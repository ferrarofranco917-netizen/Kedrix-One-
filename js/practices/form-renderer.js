window.KedrixOnePracticeFormRenderer = (() => {
  'use strict';

  const Utils = window.KedrixOneUtils;
  const I18N = window.KedrixOneI18N;
  const PracticeSchemas = window.KedrixOnePracticeSchemas;
  const PracticeFormLayout = window.KedrixOnePracticeFormLayout;
  const PracticeOverview = window.KedrixOnePracticeOverview;
  const PracticeFieldRelations = window.KedrixOnePracticeFieldRelations;
  const Density = window.KedrixOneDensitySystem || {
    resolve: (value, options = {}) => options.full ? 'full' : String(value || options.fallback || 'medium').trim().toLowerCase(),
    append: (base, value, options = {}) => [String(base || '').trim(), `density-${options.full ? 'full' : (String(value || options.fallback || 'medium').trim().toLowerCase() || 'medium')}`].filter(Boolean).join(' ')
  };

  function getMasterDataQuickAdd() {
    return window.KedrixOneMasterDataQuickAdd;
  }

  function resolveOptionText(source, fallback = '') {
    if (source === null || source === undefined) return String(fallback || '').trim();
    if (typeof source === 'string' || typeof source === 'number' || typeof source === 'boolean') {
      return String(source).trim();
    }
    if (Array.isArray(source)) {
      for (const item of source) {
        const resolved = resolveOptionText(item, '');
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
        const resolved = resolveOptionText(candidate, '');
        if (resolved) return resolved;
      }
    }
    return String(fallback || '').trim();
  }

  function sanitizeOptionEntryForRender(entry) {
    if (entry === null || entry === undefined) return null;
    const value = resolveOptionText(entry.value ?? entry, '');
    if (!value) return null;
    const label = resolveOptionText(entry.label, '') || resolveOptionText(entry.city, '') || resolveOptionText(entry.name, '') || value;
    const code = resolveOptionText(entry.code, '');
    const description = resolveOptionText(entry.description, '');
    const displayValue = resolveOptionText(entry.displayValue, '') || (description ? `${value} · ${description}` : (label && code ? `${label} · ${code}` : label || value));
    const aliases = Array.from(new Set([
      value,
      label,
      description,
      displayValue,
      code,
      resolveOptionText(entry.city, ''),
      ...(Array.isArray(entry.aliases) ? entry.aliases.map((alias) => resolveOptionText(alias, '')) : [])
    ].map((item) => String(item || '').trim()).filter(Boolean)));
    return { value, label, description, displayValue, aliases };
  }

  function resolveFieldDensity(field = {}) {
    if (!field || typeof field !== 'object') return 'medium';
    if (field.full || field.type === 'textarea') return 'full';
    if (field.density) return Density.resolve(field.density, { full: field.full, fallback: 'medium' });
    const name = String(field.name || '').toLowerCase();
    if (field.type === 'date' || field.type === 'number' || field.type === 'select') return 'compact';
    if (field.type === 'checkbox-group') return 'full';
    if (name.includes('address') || name.includes('description') || name.includes('declaration') || name.includes('instruction') || name.includes('note') || name.includes('text')) return 'wide';
    if (
      name.includes('client')
      || name.includes('importer')
      || name.includes('exporter')
      || name.includes('shipper')
      || name.includes('consignee')
      || name.includes('sender')
      || name.includes('receiver')
      || name.includes('carrier')
      || name.includes('company')
      || name.includes('vessel')
      || name.includes('origin')
      || name.includes('destination')
      || name.includes('airport')
      || name.includes('port')
      || name.includes('customs')
      || name.includes('depot')
      || name.includes('warehouse')
      || name.includes('operator')
      || name.includes('transport')
      || name.includes('section')
      || name.includes('reference')
      || name.includes('booking')
      || name.includes('policy')
      || name.includes('container')
      || name.includes('taric')
      || name.includes('incoterm')
    ) return 'compact';
    return 'medium';
  }

  function groupFieldsBySection(tab, fields = []) {
    const sections = [];
    const sectionMap = new Map();
    fields.forEach((field) => {
      const key = field && field.sectionKey ? field.sectionKey : (tab === 'notes' ? 'notes' : 'general');
      if (!sectionMap.has(key)) {
        sectionMap.set(key, { key, fields: [] });
        sections.push(sectionMap.get(key));
      }
      sectionMap.get(key).fields.push(field);
    });
    return sections;
  }

  function renderFieldHTML(type, tab, draft, companyConfig, state, field) {
    const label = `${Utils.escapeHtml(I18N.t(field.labelKey, field.name))}${field.required ? ' <span class="required-mark">*</span>' : ''}`;
    const resolvedFieldName = field.type === 'derived' && field.name === 'client' ? 'clientName' : field.name;
    const MasterDataQuickAdd = getMasterDataQuickAdd();
    const quickAddButton = MasterDataQuickAdd && typeof MasterDataQuickAdd.buildQuickAddButton === 'function'
      ? MasterDataQuickAdd.buildQuickAddButton(resolvedFieldName, I18N)
      : '';
    const openLinkedButton = MasterDataQuickAdd && typeof MasterDataQuickAdd.buildOpenLinkedButton === 'function'
      ? MasterDataQuickAdd.buildOpenLinkedButton({ state, draft, fieldName: resolvedFieldName, i18n: I18N })
      : '';
    const fieldActionsHtml = [openLinkedButton, quickAddButton].filter(Boolean).join('');
    const labelHtml = fieldActionsHtml
      ? `<div class="field-label-row"><label for="dyn_${field.name}">${label}</label><div class="field-label-actions">${fieldActionsHtml}</div></div>`
      : `<label for="dyn_${field.name}">${label}</label>`;
    const incotermCompactClass = field.name === 'incoterm' ? ' practice-incoterm-compact' : '';
    const density = resolveFieldDensity(field);
    const wrapClass = Density.append(`field${field.full ? ' full' : ''}${incotermCompactClass}`, density, { full: field.full, fallback: 'medium' });
    const wrapAttrs = `class="${wrapClass}" data-field-wrap="${Utils.escapeHtml(field.name)}" data-field-tab="${Utils.escapeHtml(tab)}"`;
    const fieldOptions = PracticeSchemas.getFieldOptions(type, field, companyConfig);
    const fieldOptionEntries = (typeof PracticeSchemas.getFieldOptionEntries === 'function'
      ? PracticeSchemas.getFieldOptionEntries(type, field, companyConfig)
      : fieldOptions.map((option) => ({ value: String(option || ''), label: String(option || ''), aliases: [String(option || '')] })))
      .map((option) => sanitizeOptionEntryForRender(option))
      .filter(Boolean);
    const currentRawValue = draft.dynamicData?.[field.name];
    const currentValue = typeof currentRawValue === 'object'
      ? resolveOptionText(currentRawValue, '')
      : (currentRawValue || '');

    if (field.type === 'derived') {
      const relationMetaHtml = PracticeFieldRelations && typeof PracticeFieldRelations.renderFieldRelationMeta === 'function'
        ? PracticeFieldRelations.renderFieldRelationMeta({ state, type, field, draft, companyConfig, i18n: I18N, utils: Utils })
        : '';
      return `<div ${wrapAttrs}><label>${label}</label><div class="derived-chip">${Utils.escapeHtml(draft.clientName || I18N.t('ui.clientRequired', 'Cliente'))}</div>${relationMetaHtml}</div>`;
    }
    if (field.type === 'select-derived') {
      return '';
    }
    const relationMetaHtml = PracticeFieldRelations && typeof PracticeFieldRelations.renderFieldRelationMeta === 'function'
      ? PracticeFieldRelations.renderFieldRelationMeta({ state, type, field, draft, companyConfig, i18n: I18N, utils: Utils })
      : '';

    if (field.type === 'textarea') {
      return `<div ${wrapAttrs}>${labelHtml}<textarea id="dyn_${field.name}" name="${field.name}" rows="4">${Utils.escapeHtml(currentValue || '')}</textarea>${relationMetaHtml}</div>`;
    }
    if (field.type === 'select') {
      return `<div ${wrapAttrs}>${labelHtml}<select id="dyn_${field.name}" name="${field.name}"><option value="">—</option>${fieldOptionEntries.map((option) => `<option value="${Utils.escapeHtml(option.value)}" ${currentValue === option.value ? 'selected' : ''}>${Utils.escapeHtml(option.label || option.value)}</option>`).join('')}</select>${relationMetaHtml}</div>`;
    }
    if (field.type === 'checkbox-group') {
      const currentValues = Array.isArray(currentValue)
        ? currentValue
        : String(currentValue || '').split(',').map((item) => item.trim()).filter(Boolean);
      return `<div ${wrapAttrs}><label>${label}</label><div class="checkbox-group">${(field.options || []).map((option) => `<label class="checkbox-chip"><input type="checkbox" name="${field.name}" value="${Utils.escapeHtml(option)}" ${currentValues.includes(option) ? 'checked' : ''} /> ${Utils.escapeHtml(I18N.t(option, option))}</label>`).join('')}</div>${relationMetaHtml}</div>`;
    }

    const datalistId = fieldOptionEntries.length && field.type !== 'date' && field.type !== 'number' ? `dyn_list_${field.name}` : '';
    const datalistHtml = datalistId
      ? `<datalist id="${datalistId}">${fieldOptionEntries.map((option) => {
        const displayText = Utils.escapeHtml(resolveOptionText(option.displayValue, '') || resolveOptionText(option.value, ''));
        return `<option value="${displayText}">${displayText}</option>`;
      }).join('')}</datalist>`
      : '';
    const isSeaPortField = field.name === 'portLoading' || field.name === 'portDischarge';
    const isAirportField = field.name === 'airportDeparture' || field.name === 'airportDestination';
    const isCustomsField = field.name === 'customsOffice';
    const isTaricField = field.name === 'taric';
    const hintKey = field.hintKey === false
      ? false
      : (field.hintKey || (isSeaPortField
        ? 'ui.unlocodeHint'
        : isAirportField
          ? 'ui.airportCodeHint'
          : isCustomsField
            ? 'ui.customsCodeHint'
            : isTaricField
              ? 'ui.taricHint'
              : 'ui.directorySuggestionHint'));
    const hintFallback = field.hintKey === false
      ? ''
      : (field.hintFallback || (isSeaPortField
        ? 'Scrivi il porto o il codice UN/LOCODE. Esempio: Genova → ITGOA.'
        : isAirportField
          ? 'Scrivi l’aeroporto o il codice operativo. Esempio: Malpensa → ITMXP.'
          : isCustomsField
            ? 'Scrivi la dogana o il codice ADM. Esempio: Alessandria → IT313000.'
            : isTaricField
              ? 'Digita 2, 4, 6 o 8 cifre della voce doganale per ottenere suggerimenti TARIC/CN.'
              : 'Seleziona un valore suggerito coerente con la configurazione operativa.'));
    const hintHtml = fieldOptionEntries.length && datalistId && hintKey
      ? `<div class="field-hint">${Utils.escapeHtml(I18N.t(hintKey, hintFallback))}</div>`
      : '';
    return `<div ${wrapAttrs}>${labelHtml}<input id="dyn_${field.name}" name="${field.name}" value="${Utils.escapeHtml(currentValue || '')}" type="${field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}" ${field.type === 'number' ? 'step="0.01" min="0"' : ''} ${datalistId ? `list="${datalistId}"` : ''} autocomplete="off" />${datalistHtml}${hintHtml}${relationMetaHtml}</div>`;
  }

  function renderCurrencyPairFieldHTML(type, tab, draft, companyConfig, state, amountField, currencyField) {
    const amountLabel = `${Utils.escapeHtml(I18N.t(amountField.labelKey, amountField.name))}${amountField.required ? ' <span class="required-mark">*</span>' : ''}`;
    const currencyOptions = PracticeSchemas.getFieldOptions(type, currencyField, companyConfig);
    const currencyValue = String(draft.dynamicData?.[currencyField.name] || '');
    const amountValue = String(draft.dynamicData?.[amountField.name] || '');
    const amountDensity = Density.resolve(amountField.density || 'compact', { fallback: 'compact' });
    const currencyDensity = Density.resolve(currencyField.density || 'compact', { fallback: 'compact' });
    const amountWrapAttrs = `class="${Density.append('field practice-economic-pair', amountDensity)}" data-field-wrap="${Utils.escapeHtml(amountField.name)}" data-field-tab="${Utils.escapeHtml(tab)}"`;
    const currencyWrapAttrs = `class="${Density.append('field practice-economic-pair-currency-wrap', currencyDensity)}" data-field-wrap="${Utils.escapeHtml(currencyField.name)}" data-field-tab="${Utils.escapeHtml(tab)}"`;
    const currencyLabel = Utils.escapeHtml(I18N.t(currencyField.labelKey, currencyField.name));
    const amountRelationMetaHtml = PracticeFieldRelations && typeof PracticeFieldRelations.renderFieldRelationMeta === 'function'
      ? PracticeFieldRelations.renderFieldRelationMeta({ state, type, field: amountField, draft, companyConfig, i18n: I18N, utils: Utils })
      : '';
    const currencyRelationMetaHtml = PracticeFieldRelations && typeof PracticeFieldRelations.renderFieldRelationMeta === 'function'
      ? PracticeFieldRelations.renderFieldRelationMeta({ state, type, field: currencyField, draft, companyConfig, i18n: I18N, utils: Utils })
      : '';
    return `<div ${amountWrapAttrs}><label for="dyn_${amountField.name}">${amountLabel}</label><div class="customs-instructions-currency-row practice-economic-pair-row"><input id="dyn_${amountField.name}" name="${amountField.name}" value="${Utils.escapeHtml(amountValue)}" type="number" step="0.01" min="0" autocomplete="off" /><div ${currencyWrapAttrs}><select id="dyn_${currencyField.name}" name="${currencyField.name}" aria-label="${currencyLabel}"><option value="">—</option>${currencyOptions.map((option) => {
      const value = String(option || '');
      return `<option value="${Utils.escapeHtml(value)}" ${currencyValue === value ? 'selected' : ''}>${Utils.escapeHtml(value)}</option>`;
    }).join('')}</select>${currencyRelationMetaHtml}</div></div>${amountRelationMetaHtml}</div>`;
  }

  function renderSectionFieldsHTML(type, tab, draft, companyConfig, state, fields = []) {
    const pairByAmountField = {
      invoiceAmount: 'invoiceCurrency',
      freightAmount: 'freightCurrency',
      vesselExchangeRate: 'vesselExchangeCurrency'
    };
    const consumedFields = new Set();
    return fields.map((field) => {
      if (consumedFields.has(field.name)) return '';
      const currencyFieldName = pairByAmountField[field.name];
      if (!currencyFieldName) {
        return renderFieldHTML(type, tab, draft, companyConfig, state, field);
      }
      const currencyField = fields.find((entry) => entry && entry.name === currencyFieldName);
      if (!currencyField) {
        return renderFieldHTML(type, tab, draft, companyConfig, state, field);
      }
      consumedFields.add(currencyFieldName);
      return renderCurrencyPairFieldHTML(type, tab, draft, companyConfig, state, field, currencyField);
    }).join('');
  }

  function renderDynamicFieldsHTML(type, tab, draft, companyConfig, state) {
    const schema = PracticeSchemas.getSchema(type);
    if (!schema) {
      return `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.tabInstruction', 'Seleziona una tipologia pratica per caricare i campi corretti.'))}</div>`;
    }

    const fields = (schema.tabs && schema.tabs[tab]) ? schema.tabs[tab] : [];
    if (!fields.length) {
      return `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.noDataYet', 'Nessun dato'))}</div>`;
    }

    const sectionsHtml = groupFieldsBySection(tab, fields).map((section) => {
      const meta = PracticeFormLayout && typeof PracticeFormLayout.getSectionMeta === 'function'
        ? PracticeFormLayout.getSectionMeta(tab, section.key)
        : { title: '', description: '' };
      const headerHtml = meta && (meta.title || meta.description)
        ? `<div class="dynamic-field-section-head">${meta.title ? `<h4 class="dynamic-field-section-title">${Utils.escapeHtml(meta.title)}</h4>` : ''}${meta.description ? `<p class="dynamic-field-section-subtitle">${Utils.escapeHtml(meta.description)}</p>` : ''}</div>`
        : '';
      return `<section class="dynamic-field-section" data-section-key="${Utils.escapeHtml(section.key)}">${headerHtml}<div class="dynamic-section-grid">${renderSectionFieldsHTML(type, tab, draft, companyConfig, state, section.fields)}</div></section>`;
    }).join('');

    return sectionsHtml;
  }

  return {
    resolveOptionText,
    sanitizeOptionEntryForRender,
    renderDynamicFieldsHTML
  };
})();
