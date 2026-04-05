# HOTFIX — Quick add ritorno pratica (da verifica video)

## Problema osservato
Dal video il click sul pulsante `+` apriva il modulo Anagrafiche in modalità generica, senza banner di quick add e senza ritorno affidabile alla stessa maschera/tab della pratica.

## Correzioni applicate
- quick add ora apre sempre una scheda nuova della famiglia corretta
- il contesto di ritorno salva anche `sessionId`, `tab`, `fieldName` e riferimento pratica
- il ritorno ripristina la stessa maschera attiva della pratica
- dopo il ritorno viene riposizionato il focus sul campo richiesto
- se un campo non è realmente supportato, l'app non apre più Anagrafiche in modo generico: mostra un toast di avviso

## File toccati
- `js/master-data/quick-add.js`
- `js/app.js`
- `js/i18n.js`
