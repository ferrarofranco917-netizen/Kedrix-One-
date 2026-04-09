# STEPAQ14 — Practice duplicate state fix

## Obiettivo
Correggere il crash in duplicazione pratica che bloccava il flusso con errore `ReferenceError: state is not defined`.

## Problema reale
Nel metodo `createDuplicateSafeDraft` di `js/practices/identity.js` veniva usata la variabile `state` senza averla nel scope locale.

Quando il bottone **Duplica pratica** invocava la costruzione della bozza duplicata, il flusso andava in errore qui:
- `identity.js:157`
- `createDuplicateSafeDraft`

## Correzione applicata
- `createDuplicateSafeDraft` ora riceve `state` via `options`
- se `state` non è disponibile, il metodo usa un fallback sicuro sui `linkedEntities`
- `duplicate.js` ora passa `state` nel build della bozza duplicata

## File coinvolti
- `js/practices/identity.js`
- `js/practices/duplicate.js`

## Esito atteso
- `Duplica pratica` non va più in errore console
- viene creata una nuova bozza duplicata
- resta compatibile con il toast introdotto in AQ13

## Test QA consigliato
1. aprire una pratica esistente
2. cliccare `Duplica pratica`
3. verificare assenza errori console
4. verificare apertura nuova bozza
5. verificare toast di conferma duplicazione
