
window.KedrixOneStorage = (() => {
  'use strict';
  const KEY = 'kedrix-one.step3.fix';
  function load(fallback){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return fallback();
      return JSON.parse(raw);
    }catch(e){ return fallback(); }
  }
  function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function reset(){ localStorage.removeItem(KEY); }
  return { load, save, reset, key: KEY };
})();
