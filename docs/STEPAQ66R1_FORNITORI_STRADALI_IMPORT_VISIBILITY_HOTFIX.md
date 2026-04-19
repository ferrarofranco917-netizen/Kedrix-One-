# STEPAQ66R1 — Fornitori stradali import visibility hotfix

## Problema rilevato
Nel blocco `Fornitori stradali · tratte/km foundation`, il pannello import CSV/Excel non compariva subito dopo la classificazione del fornitore come `Vettore stradale` o `ambito stradale` se l'operatore aveva modificato i campi nella scheda ma non aveva ancora forzato un nuovo render del modulo.

Dai test video il pannello rimaneva sul messaggio:

- `Questo blocco si attiva per fornitori classificati come vettori stradali o con ambito stradale.`

anche quando nella scheda erano già stati impostati:

- `Tipo fornitore = Vettore stradale`
- `Tariffazione stradale = Listino tratte / km`
- `Fonte km / distanze = Matrice vettore`

## Causa tecnica
Il render del pannello road rates leggeva correttamente `formDraft`, ma i cambi di alcuni campi chiave della scheda fornitore non provocavano un re-render immediato del modulo.

Di fatto il draft in memoria non veniva sincronizzato live per i campi che decidono l'attivazione del blocco stradale.

## Hotfix applicato
Micro-fix solo su `quick-add.js`:

- aggiunto sync live del draft fornitore su cambio dei campi chiave:
  - `supplierType`
  - `serviceScope`
  - `roadPricingMode`
  - `roadDistanceSource`
  - `truckProfiles`
  - `paymentTerms`
  - `value`
- dopo il cambio di questi campi viene eseguito:
  - `syncDraftFromForm(...)`
  - `save()`
  - `render()`
- aggiornato cache busting di `quick-add.js` in `index.html`

## Effetto atteso
Quando l'operatore classifica il fornitore come vettore stradale, il blocco:

- `Fornitori stradali · tratte/km foundation`

si aggiorna subito e mostra:

- editor tratta/km
- import CSV / Excel
- distanziere foundation interno

senza dover cambiare schermata o restare sul messaggio inattivo.
