window.KedrixOneGoodsMasterData = (() => {
  'use strict';

  function makeArticleCode(value, label, aliases = []) {
    const cleanValue = String(value || '').trim();
    const cleanLabel = String(label || '').trim() || cleanValue;
    const normalizedAliases = Array.from(new Set([
      cleanValue,
      cleanLabel,
      ...aliases
    ].map((item) => String(item || '').trim()).filter(Boolean)));
    return {
      value: cleanValue,
      label: cleanLabel,
      description: cleanLabel,
      displayValue: `${cleanValue} · ${cleanLabel}`,
      aliases: normalizedAliases
    };
  }

  function makePackageType(value, label, aliases = []) {
    const cleanValue = String(value || '').trim();
    const cleanLabel = String(label || '').trim() || cleanValue;
    const normalizedAliases = Array.from(new Set([
      cleanValue,
      cleanLabel,
      ...aliases
    ].map((item) => String(item || '').trim()).filter(Boolean)));
    return {
      value: cleanValue,
      label: cleanLabel,
      description: cleanLabel,
      displayValue: `${cleanValue} · ${cleanLabel}`,
      aliases: normalizedAliases
    };
  }

  return {
    defaultArticleCodes: [
      makeArticleCode('ART-STD-001', 'Merce generica su pallet', ['merce generica', 'pallet standard']),
      makeArticleCode('ART-AUTO-001', 'Pneumatici e ricambi auto', ['pneumatici', 'ricambi automotive']),
      makeArticleCode('ART-FOOD-001', 'Alimenti confezionati', ['alimentare', 'food packed']),
      makeArticleCode('ART-MACH-001', 'Macchinari e componenti', ['macchinari', 'componenti meccanici']),
      makeArticleCode('ART-TEXT-001', 'Tessile e abbigliamento', ['tessile', 'abbigliamento']),
      makeArticleCode('ART-CHEM-001', 'Prodotti chimici non ADR', ['chimici', 'non adr'])
    ],
    defaultPackageTypes: [
      makePackageType('CT', 'Cartoni', ['cartoni', 'cartone']),
      makePackageType('PK', 'Colli', ['colli', 'packages']),
      makePackageType('PL', 'Pallet', ['pallet', 'epal']),
      makePackageType('BX', 'Casse', ['casse', 'boxes']),
      makePackageType('BG', 'Sacchi', ['sacchi', 'bags']),
      makePackageType('RL', 'Rotoli', ['rotoli', 'rolls']),
      makePackageType('DR', 'Fusti', ['fusti', 'drums'])
    ]
  };
})();
