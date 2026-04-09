# STEPAQ19 — Duplicate workspace reference coherence

## Obiettivo
Evitare che una pratica duplicata mostri il numero della pratica sorgente quando l'operatore riapre o cambia maschera nel workspace.

## Problema corretto
La maschera duplicata riceveva correttamente un nuovo numero pratica nel workspace strip, ma il banner di identità continuava a mostrare come titolo il riferimento della pratica sorgente (`practiceDuplicateSource.reference`). Questo poteva far sembrare che la copia fosse ancora il record originale.

## Correzioni applicate
- la maschera duplicata mostra come titolo principale il **numero pratica assegnato alla copia** (`draft.generatedReference`)
- il riferimento della pratica sorgente resta visibile solo come badge di contesto: **Copiata da ...**
- il contesto di duplicazione viene salvato a livello di **sessione workspace**, non più solo nello stato globale
- quando si passa da una maschera all'altra, viene ripristinato il contesto corretto della sessione attiva
- aprendo una pratica esistente in modifica, il contesto di duplicazione viene azzerato per evitare confusioni

## File modificati
- `js/app.js`
- `js/templates.js`
- `js/i18n.js`
- `js/workspace/practice-workspace.js`

## Test consigliati
1. Duplica una pratica esistente.
2. Verifica che nella strip `Maschere aperte` la nuova copia mostri il nuovo numero.
3. Clicca sulla maschera duplicata.
4. Verifica che nel banner identità il titolo mostri lo **stesso nuovo numero**.
5. Verifica che il badge secondario mostri `Copiata da <numero sorgente>`.
6. Passa ad altre maschere e poi torna alla copia: il numero principale deve restare coerente.
