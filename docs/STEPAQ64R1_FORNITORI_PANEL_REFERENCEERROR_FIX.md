# STEPAQ64R1 — Fornitori panel ReferenceError fix

## Problema
Nel pannello operativo di **Anagrafiche > Fornitori** compariva l'errore runtime:

`ReferenceError: withClassification is not defined`

L'errore bloccava il render del pannello e propagava il crash fino al template `contacts`.

## Causa
Nel metodo `renderSupplierOperationalPanel` erano stati usati nel template HTML dei riferimenti a variabili mai inizializzate:

- `withClassification`
- `preferredSuppliers`
- `reliableSuppliers`
- `currentType`
- `currentScope`
- `currentPriority`
- `currentReliability`
- `currentInternalNote`

## Correzione applicata
Hotfix mirato, senza toccare la baseline dati:

- inizializzati i conteggi di classificazione fornitore
- inizializzati i valori correnti della scheda fornitore
- mantenuto il pannello dentro il modulo reale già validato
- aggiornato il version query string di `quick-add.js` in `index.html` per evitare cache sul file rotto

## File modificati
- `index.html`
- `js/master-data/quick-add.js`

## Verifica tecnica
Controllo sintattico eseguito con:

- `node --check js/master-data/quick-add.js`
- `node --check js/app.js`

Esito: nessun errore sintattico.
