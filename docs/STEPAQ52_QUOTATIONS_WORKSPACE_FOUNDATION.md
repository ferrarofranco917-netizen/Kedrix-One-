# STEPAQ52 · Quotazioni workspace foundation

## Obiettivo
Trasformare il modulo padre **Quotazioni** da overview generica a workspace reale Kedrix One, senza introdurre grafica SP1 e senza regressioni sul nucleo Pratiche.

## Implementato davvero
- nuovo modulo reale `js/quotations/quotations-module.js`
- nuovo workspace multi-maschera `js/quotations/quotations-workspace.js`
- route `quotations` agganciata in `js/app.js`
- editor interno con tab:
  - Testata
  - Dettaglio
  - Documenti
- lista quotazioni con filtri rapidi e record riapribili
- nuova quotazione vuota
- nuova quotazione da pratica attiva
- duplicazione quotazione salvata
- save / save and close
- stampa
- invio email via `mailto:`
- document register interno con metadati file
- packing desktop enterprise con campi dimensionati sul dato reale

## Vincoli rispettati
- nessuna route fittizia nuova
- nessuna finestra esterna sistema
- maschere multiple interne
- conferme interne Kedrix sul close dirty
- stile Kedrix One mantenuto
- nessun riuso grafico SP1

## File toccati
- `index.html`
- `style.css`
- `sw.js`
- `js/app.js`
- `js/quotations/quotations-workspace.js`
- `js/quotations/quotations-module.js`
- `docs/STEPAQ52_QUOTATIONS_WORKSPACE_FOUNDATION.md`

## Nota stato
Step **implementato** ma **non blindato** finché non validato visivamente dall’utente.
