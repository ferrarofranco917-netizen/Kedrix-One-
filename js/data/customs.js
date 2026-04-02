window.KedrixOneCustomsData = (() => {
  'use strict';

  const defaultCustomsOffices = [
    { value: 'IT261000 - Genova 1', label: 'Genova 1', code: 'IT261000', officeName: 'Ufficio delle dogane di Genova 1', displayValue: 'Genova 1 · IT261000', aliases: ['IT261000', '261000', 'Genova 1', 'Genova Porto', 'Genova'] },
    { value: '261101 - Passo Nuovo (Genova 1)', label: 'Passo Nuovo', code: '261101', officeName: 'Ufficio delle dogane di Genova 1 - SOT Passo Nuovo', displayValue: 'Passo Nuovo · 261101', aliases: ['261101', 'Passo Nuovo', 'Genova 1 Passo Nuovo', 'SOT Passo Nuovo'] },
    { value: 'IT262000 - Genova 2', label: 'Genova 2', code: 'IT262000', officeName: 'Ufficio delle dogane di Genova 2', displayValue: 'Genova 2 · IT262000', aliases: ['IT262000', '262000', 'Genova 2'] },
    { value: '262101 - Aeroporto di Genova (Genova 2)', label: 'Aeroporto di Genova', code: '262101', officeName: 'Ufficio delle dogane di Genova 2 - Distaccamento aeroporto', displayValue: 'Aeroporto di Genova · 262101', aliases: ['262101', 'Aeroporto di Genova', 'GOA', 'Genova aeroporto'] },
    { value: '262102 - Voltri (Genova 2)', label: 'Voltri', code: '262102', officeName: 'Ufficio delle dogane di Genova 2 - Distaccamento Voltri', displayValue: 'Voltri · 262102', aliases: ['262102', 'Voltri', 'Genova Voltri'] },
    { value: 'IT068000 - La Spezia', label: 'La Spezia', code: 'IT068000', officeName: 'Direzione Ufficio delle Dogane di La Spezia', displayValue: 'La Spezia · IT068000', aliases: ['IT068000', '068000', 'La Spezia'] },
    { value: '068100 - La Spezia operativa', label: 'La Spezia operativa', code: '068100', officeName: 'Ufficio delle dogane di La Spezia', displayValue: 'La Spezia operativa · 068100', aliases: ['068100', 'La Spezia operativa', 'UD La Spezia', 'La Spezia porto'] },
    { value: 'IT213000 - Savona', label: 'Savona', code: 'IT213000', officeName: 'Ufficio delle dogane di Savona', displayValue: 'Savona · IT213000', aliases: ['IT213000', '213000', 'Savona'] },
    { value: '213101 - Vado Ligure (Savona)', label: 'Vado Ligure', code: '213101', officeName: 'Ufficio delle dogane di Savona - Distaccamento locale Vado Ligure', displayValue: 'Vado Ligure · 213101', aliases: ['213101', 'Vado Ligure', 'Savona Vado Ligure', 'Vado'] },
    { value: 'IT313000 - Alessandria', label: 'Alessandria', code: 'IT313000', officeName: 'Ufficio delle dogane di Alessandria', displayValue: 'Alessandria · IT313000', aliases: ['IT313000', '313000', 'Alessandria'] },
    { value: 'IT314000 - Torino', label: 'Torino', code: 'IT314000', officeName: 'Ufficio delle dogane di Torino', displayValue: 'Torino · IT314000', aliases: ['IT314000', '314000', 'Torino'] },
    { value: '314101 - Caselle Torinese (Torino)', label: 'Caselle Torinese', code: '314101', officeName: 'Ufficio delle dogane di Torino - Sezione territoriale Caselle Torinese', displayValue: 'Caselle Torinese · 314101', aliases: ['314101', 'Caselle Torinese', 'Torino aeroporto', 'TRN'] },
    { value: '314102 - Orbassano (Torino)', label: 'Orbassano', code: '314102', officeName: 'Ufficio delle dogane di Torino - Sezione territoriale Orbassano', displayValue: 'Orbassano · 314102', aliases: ['314102', 'Orbassano', 'Torino Orbassano', 'SITO Orbassano'] },
    { value: 'IT277000 - Milano 1', label: 'Milano 1', code: 'IT277000', officeName: 'Direzione Ufficio delle Dogane di Milano 1', displayValue: 'Milano 1 · IT277000', aliases: ['IT277000', '277000', 'Milano 1'] },
    { value: '277100 - Milano 1 operativa', label: 'Milano 1 operativa', code: '277100', officeName: 'Ufficio delle dogane di Milano 1', displayValue: 'Milano 1 operativa · 277100', aliases: ['277100', 'Milano 1 operativa', 'Milano 1'] },
    { value: 'IT278000 - Milano 2', label: 'Milano 2', code: 'IT278000', officeName: 'Direzione Ufficio delle Dogane di Milano 2', displayValue: 'Milano 2 · IT278000', aliases: ['IT278000', '278000', 'Milano 2'] },
    { value: 'IT279000 - Malpensa', label: 'Malpensa', code: 'IT279000', officeName: 'Direzione Ufficio delle Dogane di Malpensa', displayValue: 'Malpensa · IT279000', aliases: ['IT279000', '279000', 'Malpensa', 'Milano Malpensa'] },
    { value: '279100 - Malpensa Cargo', label: 'Malpensa Cargo', code: '279100', officeName: 'Ufficio delle dogane di Malpensa', displayValue: 'Malpensa Cargo · 279100', aliases: ['279100', 'Malpensa Cargo', 'Cargo City', 'Malpensa'] }
  ];

  return {
    defaultCustomsOffices
  };
})();
