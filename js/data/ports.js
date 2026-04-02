window.KedrixOnePortData = (() => {
  'use strict';

  const defaultSeaPortLocodes = [
    { value: 'ITGOA - Genova', label: 'Genova', code: 'ITGOA', city: 'Genova', displayValue: 'Genova · ITGOA', aliases: ['Genova', 'Genoa', 'ITGOA', 'GOA'] },
    { value: 'ITSPE - La Spezia', label: 'La Spezia', code: 'ITSPE', city: 'La Spezia', displayValue: 'La Spezia · ITSPE', aliases: ['La Spezia', 'ITSPE', 'SPE'] },
    { value: 'ITVDL - Vado Ligure', label: 'Vado Ligure', code: 'ITVDL', city: 'Vado Ligure', displayValue: 'Vado Ligure · ITVDL', aliases: ['Vado Ligure', 'Vado', 'ITVDL', 'VDL'] },
    { value: 'ITLIV - Livorno', label: 'Livorno', code: 'ITLIV', city: 'Livorno', displayValue: 'Livorno · ITLIV', aliases: ['Livorno', 'Leghorn', 'ITLIV', 'LIV'] },
    { value: 'ITGIT - Gioia Tauro', label: 'Gioia Tauro', code: 'ITGIT', city: 'Gioia Tauro', displayValue: 'Gioia Tauro · ITGIT', aliases: ['Gioia Tauro', 'ITGIT', 'GIT'] },
    { value: 'ITTRS - Trieste', label: 'Trieste', code: 'ITTRS', city: 'Trieste', displayValue: 'Trieste · ITTRS', aliases: ['Trieste', 'ITTRS', 'TRS'] },
    { value: 'ITNAP - Napoli', label: 'Napoli', code: 'ITNAP', city: 'Napoli', displayValue: 'Napoli · ITNAP', aliases: ['Napoli', 'Naples', 'ITNAP', 'NAP'] },
    { value: 'NLRTM - Rotterdam', label: 'Rotterdam', code: 'NLRTM', city: 'Rotterdam', displayValue: 'Rotterdam · NLRTM', aliases: ['Rotterdam', 'NLRTM', 'RTM'] },
    { value: 'BEANR - Antwerpen', label: 'Antwerpen', code: 'BEANR', city: 'Antwerpen', displayValue: 'Antwerpen · BEANR', aliases: ['Antwerpen', 'Antwerp', 'Anversa', 'BEANR', 'ANR'] },
    { value: 'DEHAM - Hamburg', label: 'Hamburg', code: 'DEHAM', city: 'Hamburg', displayValue: 'Hamburg · DEHAM', aliases: ['Hamburg', 'DEHAM', 'HAM'] },
    { value: 'FRLEH - Le Havre', label: 'Le Havre', code: 'FRLEH', city: 'Le Havre', displayValue: 'Le Havre · FRLEH', aliases: ['Le Havre', 'FRLEH', 'LEH'] },
    { value: 'ESALG - Algeciras', label: 'Algeciras', code: 'ESALG', city: 'Algeciras', displayValue: 'Algeciras · ESALG', aliases: ['Algeciras', 'ESALG', 'ALG'] },
    { value: 'ESBCN - Barcelona', label: 'Barcelona', code: 'ESBCN', city: 'Barcelona', displayValue: 'Barcelona · ESBCN', aliases: ['Barcelona', 'ESBCN', 'BCN'] },
    { value: 'ESVLC - Valencia', label: 'Valencia', code: 'ESVLC', city: 'Valencia', displayValue: 'Valencia · ESVLC', aliases: ['Valencia', 'ESVLC', 'VLC'] },
    { value: 'GRPIR - Piraeus', label: 'Piraeus', code: 'GRPIR', city: 'Piraeus', displayValue: 'Piraeus · GRPIR', aliases: ['Piraeus', 'Pireo', 'GRPIR', 'PIR'] },
    { value: 'GBFXT - Felixstowe', label: 'Felixstowe', code: 'GBFXT', city: 'Felixstowe', displayValue: 'Felixstowe · GBFXT', aliases: ['Felixstowe', 'GBFXT', 'FXT'] },
    { value: 'SGSIN - Singapore', label: 'Singapore', code: 'SGSIN', city: 'Singapore', displayValue: 'Singapore · SGSIN', aliases: ['Singapore', 'SGSIN', 'SIN'] },
    { value: 'CNSHG - Shanghai Port', label: 'Shanghai Port', code: 'CNSHG', city: 'Shanghai', displayValue: 'Shanghai Port · CNSHG', aliases: ['Shanghai', 'Shanghai Port', 'CNSHG', 'SHA'] },
    { value: 'CNNBG - Ningbo Port', label: 'Ningbo Port', code: 'CNNBG', city: 'Ningbo', displayValue: 'Ningbo Port · CNNBG', aliases: ['Ningbo', 'Ningbo Port', 'CNNBG', 'NBG'] },
    { value: 'CNYTN - Yantian', label: 'Yantian', code: 'CNYTN', city: 'Yantian', displayValue: 'Yantian · CNYTN', aliases: ['Yantian', 'CNYTN', 'YTN'] },
    { value: 'CNXMG - Xiamen Port', label: 'Xiamen Port', code: 'CNXMG', city: 'Xiamen', displayValue: 'Xiamen Port · CNXMG', aliases: ['Xiamen', 'Xiamen Port', 'CNXMG', 'XMG'] },
    { value: 'HKHKG - Hong Kong', label: 'Hong Kong', code: 'HKHKG', city: 'Hong Kong', displayValue: 'Hong Kong · HKHKG', aliases: ['Hong Kong', 'HKHKG', 'HKG'] },
    { value: 'KRPUS - Busan', label: 'Busan', code: 'KRPUS', city: 'Busan', displayValue: 'Busan · KRPUS', aliases: ['Busan', 'Pusan', 'KRPUS', 'PUS'] },
    { value: 'KRBNP - Busan New Port', label: 'Busan New Port', code: 'KRBNP', city: 'Busan', displayValue: 'Busan New Port · KRBNP', aliases: ['Busan New Port', 'Busan', 'KRBNP', 'BNP'] },
    { value: 'AEJEA - Jebel Ali', label: 'Jebel Ali', code: 'AEJEA', city: 'Jebel Ali', displayValue: 'Jebel Ali · AEJEA', aliases: ['Jebel Ali', 'Dubai', 'AEJEA', 'JEA'] },
    { value: 'USNYC - New York', label: 'New York', code: 'USNYC', city: 'New York', displayValue: 'New York · USNYC', aliases: ['New York', 'USNYC', 'NYC'] },
    { value: 'USSAV - Savannah', label: 'Savannah', code: 'USSAV', city: 'Savannah', displayValue: 'Savannah · USSAV', aliases: ['Savannah', 'USSAV', 'SAV'] },
    { value: 'USLAX - Los Angeles', label: 'Los Angeles', code: 'USLAX', city: 'Los Angeles', displayValue: 'Los Angeles · USLAX', aliases: ['Los Angeles', 'USLAX', 'LAX'] },
    { value: 'BRSSZ - Santos', label: 'Santos', code: 'BRSSZ', city: 'Santos', displayValue: 'Santos · BRSSZ', aliases: ['Santos', 'BRSSZ', 'SSZ'] },
    { value: 'INNSA - Nhava Sheva', label: 'Nhava Sheva', code: 'INNSA', city: 'Nhava Sheva', displayValue: 'Nhava Sheva · INNSA', aliases: ['Nhava Sheva', 'Jawaharlal Nehru Port', 'INNSA', 'NSA'] }
  ];

  const defaultAirports = [
    { value: 'ITMXP - Milano Malpensa', label: 'Milano Malpensa', code: 'ITMXP', city: 'Milano', displayValue: 'Milano Malpensa · MXP', aliases: ['Milano Malpensa', 'Malpensa', 'MXP', 'ITMXP'] },
    { value: 'ITFCO - Roma Fiumicino', label: 'Roma Fiumicino', code: 'ITFCO', city: 'Roma', displayValue: 'Roma Fiumicino · FCO', aliases: ['Roma Fiumicino', 'Fiumicino', 'FCO', 'ITFCO'] },
    { value: 'ITGOA - Genova Airport', label: 'Genova Airport', code: 'ITGOA', city: 'Genova', displayValue: 'Genova Airport · GOA', aliases: ['Genova Airport', 'Aeroporto di Genova', 'GOA', 'ITGOA'] },
    { value: 'ITTRN - Torino Caselle', label: 'Torino Caselle', code: 'ITTRN', city: 'Torino', displayValue: 'Torino Caselle · TRN', aliases: ['Torino Caselle', 'Caselle Torinese', 'TRN', 'ITTRN'] },
    { value: 'FRCDG - Paris Charles de Gaulle', label: 'Paris Charles de Gaulle', code: 'FRCDG', city: 'Paris', displayValue: 'Paris Charles de Gaulle · CDG', aliases: ['Paris Charles de Gaulle', 'CDG', 'FRCDG'] },
    { value: 'CNPVG - Shanghai Pudong', label: 'Shanghai Pudong', code: 'CNPVG', city: 'Shanghai', displayValue: 'Shanghai Pudong · PVG', aliases: ['Shanghai Pudong', 'PVG', 'CNPVG'] },
    { value: 'HKHKG - Hong Kong Airport', label: 'Hong Kong Airport', code: 'HKHKG', city: 'Hong Kong', displayValue: 'Hong Kong Airport · HKG', aliases: ['Hong Kong Airport', 'HKG', 'HKHKG'] },
    { value: 'AEDXB - Dubai International', label: 'Dubai International', code: 'AEDXB', city: 'Dubai', displayValue: 'Dubai International · DXB', aliases: ['Dubai International', 'DXB', 'AEDXB'] },
    { value: 'NLAMS - Amsterdam Schiphol', label: 'Amsterdam Schiphol', code: 'NLAMS', city: 'Amsterdam', displayValue: 'Amsterdam Schiphol · AMS', aliases: ['Amsterdam Schiphol', 'AMS', 'NLAMS'] },
    { value: 'DEFRA - Frankfurt Main', label: 'Frankfurt Main', code: 'DEFRA', city: 'Frankfurt', displayValue: 'Frankfurt Main · FRA', aliases: ['Frankfurt Main', 'FRA', 'DEFRA'] }
  ];

  return {
    defaultAirports,
    defaultSeaPortLocodes
  };
})();
