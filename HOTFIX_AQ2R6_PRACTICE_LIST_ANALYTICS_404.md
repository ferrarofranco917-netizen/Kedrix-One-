# HOTFIX AQ2R6 — practice-list-analytics.js 404

## Problema corretto
La repo main referenziava `./js/search/practice-list-analytics.js` in `index.html`, ma il file non era presente nel progetto.

Effetto:
- errore console `404` sul resource load
- rischio di perdita della logica dedicata ai filtri avanzati e alle metriche di Gestione pratiche

## Correzione applicata
- creato il file modulare `js/search/practice-list-analytics.js`
- implementate le funzioni attese dal runtime:
  - `defaultFilters()`
  - `extractValues()`
  - `filterPractices()`
  - `buildMetrics()`
- aggiornato `index.html` con nuovo version tag
- aggiornato `sw.js` includendo il nuovo file nel precache e con nuova cache key

## Area protetta
Fix chirurgico, nessuna riscrittura del modulo Pratiche o della shell Kedrix.
