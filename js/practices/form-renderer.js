window.KedrixOnePracticeFormRenderer = (() => {
  'use strict';

  const Utils = window.KedrixOneUtils;
  const I18N = window.KedrixOneI18N;
  const PracticeSchemas = window.KedrixOnePracticeSchemas;

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
    const displayValue = resolveOptionText(entry.displayValue, '') || (label && code ? `${label} · ${code}` : label || value);
    const aliases = Array.from(new Set([
      value,
      label,
      displayValue,
      code,
      resolveOptionText(entry.city, ''),
      ...(Array.isArray(entry.aliases) ? entry.aliases.map((alias) => resolveOptionText(alias, '')) : [])
    ].map((item) => String(item || '').trim()).filter(Boolean)));
    return { value, label, displayValue, aliases };
  }

  function renderDynamicFieldsHTML(type, tab, draft, companyConfig) {
    const schema = PracticeSchemas.getSchema(type);
    if (!schema) {
      return `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.tabInstruction', 'Seleziona una tipologia pratica per caricare i campi corretti.'))}</div>`;
    }

    const fields = (schema.tabs && schema.tabs[tab]) ? schema.tabs[tab] : [];
    if (!fields.length) {
      return `<div class="empty-text">${Utils.escapeHtml(I18N.t('ui.noDataYet', 'Nessun dato'))}</div>`;
    }

    return `<div class="dynamic-section-grid">` + fields.map((field) => {
      const label = `${Utils.escapeHtml(I18N.t(field.labelKey, field.name))}${field.required ? ' <span class="required-mark">*</span>' : ''}`;
      const wrapClass = `field${field.full ? ' full' : ''}`;
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
        return `<div ${wrapAttrs}><label>${label}</label><div class="derived-chip">${Utils.escapeHtml(draft.clientName || I18N.t('ui.clientRequired', 'Cliente'))}</div></div>`;
      }
      if (field.type === 'select-derived') {
        return '';
      }
      if (field.type === 'textarea') {
        return `<div ${wrapAttrs}><label for="dyn_${field.name}">${label}</label><textarea id="dyn_${field.name}" name="${field.name}" rows="4">${Utils.escapeHtml(currentValue || '')}</textarea></div>`;
      }
      if (field.type === 'select') {
        return `<div ${wrapAttrs}><label for="dyn_${field.name}">${label}</label><select id="dyn_${field.name}" name="${field.name}"><option value="">—</option>${fieldOptionEntries.map((option) => `<option value="${Utils.escapeHtml(option.value)}" ${currentValue === option.value ? 'selected' : ''}>${Utils.escapeHtml(option.label || option.value)}</option>`).join('')}</select></div>`;
      }
      if (field.type === 'checkbox-group') {
        const currentValues = Array.isArray(currentValue) ? currentValue : [];
        return `<div ${wrapAttrs}><label>${label}</label><div class="checkbox-group">${(field.options || []).map((option) => `<label class="checkbox-chip"><input type="checkbox" name="${field.name}" value="${Utils.escapeHtml(option)}" ${currentValues.includes(option) ? 'checked' : ''} /> ${Utils.escapeHtml(I18N.t(option, option))}</label>`).join('')}</div></div>`;
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
      const hintKey = field.hintKey === false
        ? false
        : (field.hintKey || (isSeaPortField
          ? 'ui.unlocodeHint'
          : isAirportField
            ? 'ui.airportCodeHint'
            : isCustomsField
              ? 'ui.customsCodeHint'
              : 'ui.directorySuggestionHint'));
      const hintFallback = field.hintKey === false
        ? ''
        : (field.hintFallback || (isSeaPortField
          ? 'Scrivi il porto o il codice UN/LOCODE. Esempio: Genova → ITGOA.'
          : isAirportField
            ? 'Scrivi l’aeroporto o il codice operativo. Esempio: Malpensa → ITMXP.'
            : isCustomsField
              ? 'Scrivi la dogana o il codice ADM. Esempio: Alessandria → IT313000.'
              : 'Seleziona un valore suggerito coerente con la configurazione operativa.'));
      const hintHtml = fieldOptionEntries.length && datalistId && hintKey
        ? `<div class="field-hint">${Utils.escapeHtml(I18N.t(hintKey, hintFallback))}</div>`
        : '';
      return `<div ${wrapAttrs}><label for="dyn_${field.name}">${label}</label><input id="dyn_${field.name}" name="${field.name}" value="${Utils.escapeHtml(currentValue || '')}" type="${field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}" ${field.type === 'number' ? 'step="0.01" min="0"' : ''} ${datalistId ? `list="${datalistId}"` : ''} autocomplete="off" />${datalistHtml}${hintHtml}</div>`;
    }).join('') + `</div>`;
  }

  return {
    resolveOptionText,
    sanitizeOptionEntryForRender,
    renderDynamicFieldsHTML
  };
})();
