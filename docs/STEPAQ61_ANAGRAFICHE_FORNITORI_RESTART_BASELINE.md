# STEPAQ61 — Anagrafiche restart baseline (repo originale)

Baseline usata: repo originale allegata dall'utente (`Kedrix-One--main (3).zip`).

## Obiettivo del micro-step
- scartare completamente i delta AQ60/AQ60 hotfix
- ripartire dalla baseline originale senza regressioni
- rendere **Fornitori** una sottocartella/sottomodulo visibile di Anagrafiche
- senza toccare la logica dati già operativa di fornitori e delle altre famiglie

## Modifiche applicate
1. `js/module-registry.js`
   - aggiunto il sottomodulo **Fornitori** in Anagrafiche
2. `js/app.js`
   - i route `master-data/...` ora possono aprire il modulo Anagrafiche focalizzato sulla famiglia corretta
   - supportato esplicitamente `master-data/fornitori`
3. `js/master-data/quick-add.js`
   - hero del modulo allineato al sottomodulo attivo quando si entra da route dedicata

## Effetto atteso
- cliccando il sottomodulo **Fornitori** sotto Anagrafiche non compare più un placeholder
- si apre il modulo reale Anagrafiche già esistente, focalizzato direttamente sulla famiglia **Fornitori**
- le famiglie operative già presenti restano inalterate

## QA minimo
1. aprire Anagrafiche
2. cliccare **Fornitori** nel menu sottomoduli
3. verificare che non si apra un placeholder
4. verificare che il selettore famiglia sia su **Fornitori**
5. verificare che le altre famiglie già operative risultino ancora disponibili nel menu famiglia
