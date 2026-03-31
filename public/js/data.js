
window.KedrixOneData = (() => {
  'use strict';
  function initialState(){
    return {
      currentRoute: 'dashboard',
      practices: [
        { id:'PR-2026-001', reference:'KX-IMP-0001', client:'Michelin Italia', type:'Import', port:'Genova', eta:'2026-04-01', status:'In attesa documenti' },
        { id:'PR-2026-002', reference:'KX-EXP-0002', client:'Monge & C. S.p.A.', type:'Export', port:'Fossano', eta:'2026-04-03', status:'Operativa' },
        { id:'PR-2026-003', reference:'KX-IMP-0003', client:'Aprica S.p.A.', type:'Import', port:'La Spezia', eta:'2026-03-31', status:'Sdoganamento' }
      ]
    };
  }
  return { initialState };
})();
