# HOTFIX AQ2R31 — Gestione pratiche render fix

## Problema reale
Nel video il titolo passava da `Pratiche` a `Pratiche / Gestione pratiche`, ma il contenuto restava quello dell'hub padre.

## Causa
La funzione `Templates.practiceList()` referenziava `PracticeListPresets` senza aver dichiarato il binding globale in `templates.js`.
Quando la vista veniva aperta, il render lanciava un `ReferenceError` prima di sostituire il contenuto del main. Il risultato percepito era: route cambiata, contenuto vecchio rimasto a schermo.

## Correzioni
- dichiarati tutti i binding `PracticeList*` usati o previsti da Gestione pratiche in `templates.js`
- aggiunto guard-rail nel render di `practices/gestione-pratiche` in `app.js` con log esplicito in console e pannello di errore leggibile invece del contenuto stantio
- aggiornato cache busting in `index.html` e `sw.js`

## Effetto atteso
- `Pratiche` = hub padre
- `Pratiche / Gestione pratiche` = lista + filtri + `Nuova pratica`
- niente contenuto duplicato tra le due viste
