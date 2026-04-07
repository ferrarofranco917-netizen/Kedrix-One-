# HOTFIX AQ2R16 — Gestione pratiche: distribuzione per stato

## Obiettivo
Aggiungere una lettura operativa sicura in Gestione pratiche per capire subito quanti dossier ricadono in ogni stato nel range attivo e nel periodo di confronto, senza toccare il workspace pratica.

## Modifiche
- nuovo modulo `js/search/practice-list-status-breakdowns.js`
- integrazione metrica in `js/app.js`
- nuova sezione UI in `js/templates.js`
- nuove stringhe IT/EN in `js/i18n.js`
- piccolo supporto visuale in `style.css`
- cache/versioning aggiornati in `index.html` e `sw.js`

## Output atteso
- sezione `Distribuzione per stato`
- conteggi attivo / confronto / delta per stato
- riepilogo rapido delle pratiche ancora aperte
