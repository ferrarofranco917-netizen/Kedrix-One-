
window.KedrixOneWiseMind = (() => {
  'use strict';
  function alerts(practices){
    const result = [];
    practices.forEach((p) => {
      if(p.status === 'In attesa documenti'){
        result.push({ severity:'warning', title:'Documenti da completare', text:`${p.reference} · ${p.client}` });
      }
      if(p.status === 'Sdoganamento'){
        result.push({ severity:'info', title:'Attenzione operativa', text:`${p.reference} in sdoganamento` });
      }
    });
    return result;
  }
  return { alerts };
})();
