window.KedrixOneDensitySystem = (() => {
  'use strict';

  function flattenTokens(values) {
    const tokens = [];
    values.forEach((value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        tokens.push(...flattenTokens(value));
        return;
      }
      if (typeof value === 'string') {
        tokens.push(...value.split(/\s+/).map((item) => item.trim()).filter(Boolean));
      }
    });
    return tokens;
  }

  function classes() {
    return Array.from(new Set(flattenTokens(Array.from(arguments)))).join(' ');
  }

  function grid(baseClass) {
    return classes(baseClass, 'density-grid', Array.from(arguments).slice(1));
  }

  function field(options = {}) {
    return classes(
      options.baseClass || 'field',
      'density-field',
      options.full ? 'full' : '',
      options.compact ? 'density-field--compact' : '',
      options.incoterm ? 'density-field--incoterm' : '',
      options.extra || []
    );
  }

  function head(options = {}) {
    return classes(
      options.baseClass || 'panel-head',
      'density-head',
      options.compact ? 'density-head--compact' : '',
      options.extra || []
    );
  }

  function compactGrid(baseClass) {
    return grid(baseClass, 'density-grid--compact');
  }

  function compactKpiGrid(baseClass = 'kpi-grid') {
    return grid(baseClass, 'density-grid--compact-kpi');
  }

  function compactTagGrid(baseClass = 'tag-grid') {
    return grid(baseClass, 'density-grid--compact-tag');
  }

  function compactDateGrid(baseClass = 'form-grid') {
    return grid(baseClass, 'density-grid--compact-date');
  }

  function sectionGrid(baseClass = 'dynamic-section-grid') {
    return grid(baseClass, 'density-grid--section');
  }

  function customsLineGrid(baseClass = 'customs-line-grid') {
    return grid(baseClass, 'density-grid--customs-lines');
  }

  return {
    classes,
    grid,
    field,
    head,
    compactGrid,
    compactKpiGrid,
    compactTagGrid,
    compactDateGrid,
    sectionGrid,
    customsLineGrid
  };
})();
