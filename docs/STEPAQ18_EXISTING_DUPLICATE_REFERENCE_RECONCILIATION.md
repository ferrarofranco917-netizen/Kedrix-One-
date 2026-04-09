# STEPAQ18 — Existing duplicate reference reconciliation

## Obiettivo
Chiudere il gap rimasto dopo AQ17: il guard di unicità bloccava le nuove collisioni, ma non sanava automaticamente i numeri pratica duplicati già presenti nello stato locale.

## Fix applicati
- Reconciliation automatica all'avvio dell'app dei `reference` duplicati già esistenti in `state.practices`
- Preservazione della prima occorrenza trovata
- Riassegnazione delle occorrenze successive al prossimo numero disponibile più alto della stessa serie
- Allineamento della `numberingRule` cliente al numero realmente usato dopo la riconciliazione
- Generazione dei nuovi numeri pratica sempre con esclusione della pratica in modifica e della maschera attiva
- Allineamento del save pipeline al `reference` realmente salvato
- Passaggio esplicito di `state` al flow di duplicazione pratica

## File coinvolti
- `js/utils.js`
- `js/app.js`
- `js/practices/identity.js`
- `js/practices/duplicate.js`
- `js/practices/save-pipeline.js`

## Comportamento atteso
Esempio reale:
- AP-2026-5
- AP-2026-7
- AP-2026-7
- AP-2026-7
- AP-2026-8

Dopo il load:
- AP-2026-5
- AP-2026-7
- AP-2026-9
- AP-2026-10
- AP-2026-8

La prima occorrenza resta invariata. Le collisioni successive vengono spinte in avanti senza creare nuove collisioni.

## Checklist test
1. Aprire `Pratiche > Gestione pratiche` con duplicati già presenti
2. Verificare che non restino due numeri pratica uguali nella lista
3. Duplicare una pratica esistente e verificare che la nuova bozza riceva il numero successivo disponibile
4. Salvare la copia e duplicare ancora una volta
5. Verificare che la numerazione continui ad avanzare senza tornare indietro

## Rischio regressione
Medio-basso:
- il fix tocca solo numerazione/riconciliazione dei reference
- non modifica ID pratica, allegati o linked entities
- da verificare eventuali flussi esterni che mostrano il `reference` già salvato in cache UI
