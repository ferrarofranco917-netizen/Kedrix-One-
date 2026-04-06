# STEP AF — Nodi logistici hardening

## Obiettivo
Rafforzare la lettura logistica nella tab **Pratica** senza regressioni sui layer già consolidati (hub operativo, readiness board, document readiness, quick add, Allegati, Dettaglio).

## Interventi eseguiti
- introdotto un modulo dedicato `practice-logistics-board.js`
- aggiunto un **board logistico** nella tab Pratica, con focus su:
  - percorso fisico
  - snodi di supporto
  - tempi logistici
- integrata la lettura logistica anche dentro l’**Operational Hub**
- migliorata la card overview “Nodi logistici” usando il percorso reale calcolato dal nuovo board
- aggiunti controlli soft su alcune incoerenze operative:
  - origine e destinazione uguali sul nodo principale
  - ritiro successivo alla consegna
  - scarico precedente ad arrivo / partenza nei casi gestiti

## Vincoli rispettati
- nessun refactor distruttivo
- nessuna crescita monolitica di `app.js`
- nessuna modifica invasiva ai flussi quick add / multi-maschera / allegati
- integrazione modulare tramite nuovo file dedicato

## File coinvolti
- `index.html`
- `style.css`
- `sw.js`
- `js/i18n.js`
- `js/practices/practice-logistics-board.js` **(nuovo)**
- `js/practices/practice-operational-hub.js`
- `js/practices/practice-overview.js`

## QA minimo richiesto
1. Aprire una pratica esistente mare import/export.
2. Verificare presenza del nuovo board logistico nella tab Pratica.
3. Cliccare le azioni “Vai al nodo” e verificare focus corretto sul campo.
4. Verificare che l’Operational Hub mostri anche la sorgente logistica.
5. Verificare che Dettaglio e Allegati restino stabili.
6. Verificare assenza di errori console su bootstrap e render tab Pratica.
