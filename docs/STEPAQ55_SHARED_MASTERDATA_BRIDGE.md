# STEPAQ55 — Shared master data bridge per moduli documentali

## Obiettivo
Micro-patch trasversale senza regressioni per collegare i moduli documentali alle stesse anagrafiche/shared master data già presenti in Kedrix One.

## Moduli coperti
- Notifica arrivo merce
- Notifica partenza merce
- Rimessa documenti
- Istruzioni di sdoganamento

## Cosa entra davvero
- helper condiviso `js/master-data/module-field-links.js`
- suggerimenti `datalist` alimentati dalle stesse anagrafiche/shared directories
- persistenza `linkedEntities` dentro i draft/record dei moduli documentali
- seed automatico del collegamento quando il documento nasce da pratica madre
- highlight leggero dei campi agganciati a un record condiviso

## Roadmap ufficiale aggiornata
### Binding forte master data
- passaggio da snapshot leggero a `entityId` persistente per tutti i moduli documentali
- recipient rules automatiche basate su anagrafica cliente/documento
- convergenza progressiva dei campi nodo su porti/aeroporti/località con distinzione per modalità

### Document output
- unificazione futura del print engine A4
- scheduler e dispatch center documentale con backend reale in step dedicato

## Rischio regressione
Basso. La patch non cambia i salvataggi esistenti e lavora come bridge leggero sui campi già presenti.
