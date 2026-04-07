# HOTFIX AQ2R13 — Gestione pratiche: breakdown per soggetti

## Obiettivo
Rafforzare il sottomodulo Gestione pratiche senza toccare il workspace della pratica.

## Contenuto dello step
- nuovo modulo dedicato per breakdown per cliente / importatore / mittente-esportatore
- confronto tra range attivo e range di confronto se impostato
- top list leggibile direttamente nella vista Gestione pratiche
- allineamento service worker ai file realmente presenti

## File coinvolti
- index.html
- sw.js
- style.css
- js/app.js
- js/templates.js
- js/i18n.js
- js/search/practice-list-breakdowns.js

## QA focus
- filtri lista pratiche
- range date e confronto periodale
- apertura workspace dalla lista
- nessuna regressione sul save della pratica
