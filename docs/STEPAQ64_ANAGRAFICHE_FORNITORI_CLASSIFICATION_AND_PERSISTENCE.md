# STEPAQ64 — Anagrafiche / Fornitori: classificazione interna + persistence hardening

## Obiettivo
Rendere il sottomodulo Fornitori più utile operativamente senza introdurre ancora i listini, mantenendo AQ63 come baseline valida.

## Interventi
- aggiunti campi di classificazione interna nella scheda Fornitori:
  - tipo fornitore
  - ambito servizio
  - priorità interna
  - affidabilità
  - nota operativa interna
- aggiunto supporto `select` nel renderer del form master-data
- estesa ricerca Fornitori anche ai nuovi campi di classificazione
- aggiunti nuovi filtri operativi:
  - profilo classificato
  - priorità alta
  - affidabilità alta
- estesi row tags, pannello operativo e overview snapshot per leggere la classificazione in modo immediato
- corretto il salvataggio dei campi specifici del fornitore nei record strutturati, così i dati operativi non restano solo nel draft UI

## File toccati
- `index.html`
- `sw.js`
- `js/i18n.js`
- `js/master-data/entity-records.js`
- `js/master-data/master-data-overview.js`
- `js/master-data/quick-add.js`

## QA minimo
1. Aprire `Anagrafiche > Fornitori`
2. Verificare comparsa dei nuovi campi select e della nota operativa interna
3. Salvare una scheda fornitore compilando classificazione e dati operativi
4. Ricaricare e verificare persistenza reale
5. Testare ricerca per tipo/ambito/priorità/affidabilità
6. Testare filtri rapidi nuovi e reset
7. Verificare che le altre famiglie anagrafiche non subiscano regressioni
