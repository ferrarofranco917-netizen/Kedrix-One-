# STEP AI — Archivi logistici foundation

## Obiettivo
Rendere il modulo Anagrafiche capace di gestire i principali archivi logistici come famiglie dedicate, senza appesantire la tab Pratica e senza introdurre regressioni sui flussi già blindati.

## Scope introdotto
- nuove famiglie anagrafiche/logistiche: Porti, Aeroporti, Terminal, Località logistiche, Depositi, Collega a
- nuova sezione overview `Archivi logistici foundation` nel modulo Anagrafiche
- preparazione concreta per Import, normalizzazione località e convergenza futura verso dataset logistici più forti

## Note architetturali
- nessun refactor distruttivo
- nessuna crescita monolitica di `quick-add.js` o `master-data-overview.js`
- nuova logica dedicata nel file `js/master-data/logistics-archives.js`

## QA minimo
- aprire Anagrafiche
- verificare comparsa sezione `Archivi logistici foundation`
- verificare nel selettore famiglie: Porti, Aeroporti, Terminal, Località logistiche, Depositi, Collega a
- aprire una famiglia logistica e salvare/modificare una voce
- verificare console senza ReferenceError / TypeError
