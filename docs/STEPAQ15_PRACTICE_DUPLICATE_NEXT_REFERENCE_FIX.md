# STEPAQ15 — Practice duplicate next reference fix

## Obiettivo
Correggere la duplicazione pratica in modo che la nuova bozza non riusi il numero pratica della sorgente e riceva subito il numero successivo disponibile.

## Fix applicati
- La duplicazione calcola un `generatedReference` nuovo e univoco già all'apertura della bozza.
- Se il riferimento proposto dal numbering rule collide con la pratica sorgente o con riferimenti già occupati, viene incrementato fino al primo valore libero.
- I riferimenti già occupati vengono letti da:
  - pratiche salvate
  - sessioni workspace aperte
  - bozza corrente
- Al salvataggio di una pratica nuova, il numbering rule del cliente viene allineato al riferimento realmente usato, evitando collisioni al duplicato successivo.

## File toccati
- `js/practices/duplicate.js`
- `js/utils.js`
- `js/app.js`
- `js/practices/save-pipeline.js`

## QA minimo
1. Apri una pratica esistente.
2. Clicca `Duplica pratica`.
3. Verifica che la nuova bozza abbia un numero pratica successivo e non uguale alla sorgente.
4. Verifica il toast di conferma duplicazione.
5. Salva la copia.
6. Duplica di nuovo e verifica che il numero salga ancora di uno.
7. Controlla che l'originale resti invariata.
