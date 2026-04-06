# HOTFIX STEP AL — Import target select persistent fix

## Problema corretto
Nel pannello Import del modulo Anagrafiche il menu `Famiglia target` mostrava tutte le opzioni, ma dopo la selezione tornava alla famiglia anagrafica attiva del modulo (es. `Mittenti`).

## Causa
Il render del pannello rieseguiva `ensureTarget(...)` usando sempre `activeEntity` come preferenza primaria, sovrascrivendo la selezione appena fatta dall'utente.

## Fix applicato
- il render del pannello ora preserva prima `session.targetEntity`
- `activeEntity` resta solo fallback iniziale
- aggiornati cache busting e service worker

## File toccati
- `js/import/import-manager.js`
- `index.html`
- `sw.js`
