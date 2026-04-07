# HOTFIX AQ2R7 — Pratica: alert e board solo al tentativo di salvataggio

## Obiettivo
Evitare che nella nuova pratica compaiano subito board operative/readiness/documentali quando l'utente apre manualmente il tab **Pratica** dopo l'avvio.

## Regola UX applicata
- nuova pratica non ancora salvata + nessun tentativo di salvataggio -> vista pratica calma
- nuova pratica + tentativo di salvataggio fallito -> board e alert consentiti
- pratica esistente -> comportamento normale invariato

## Soluzione tecnica
Introdotto modulo dedicato `js/practices/practice-calm-start.js`.
Il modulo decide se sopprimere i board in `practice-overview.js` in base a:
- presenza o meno di `editingPracticeId`
- presenza o meno di errori in `state._practiceValidationErrors`

## File coinvolti
- index.html
- sw.js
- js/practices/practice-calm-start.js
- js/practices/practice-overview.js
- js/search/practice-list-analytics.js

## Rischi sorvegliati
- apertura nuova pratica
- passaggio Avvio -> Pratica
- tentativo di salvataggio con errori
- pratica esistente
- service worker / cache
