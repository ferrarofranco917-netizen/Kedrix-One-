# STEPAQ62 — Anagrafiche / Fornitori / Profilo operativo

## Baseline di partenza
Baseline operativa considerata: repo originale allegata + esposizione del sottomodulo `master-data/fornitori` introdotta con AQ61.

## Obiettivo
Potenziamento del sottomodulo **Fornitori** già visibile, senza introdurre listini e senza toccare le altre famiglie operative.

## Implementazione
- confermato `Fornitori` come sottomodulo reale di Anagrafiche
- routing `master-data/fornitori` agganciato alla famiglia `supplier`
- lock della famiglia quando si entra dal sottomodulo, per evitare mismatch
- aggiunti campi operativi specifici per Fornitori:
  - referente operativo
  - servizi / modalità coperte
  - aree / tratte servite
  - condizioni pagamento
- persistenza dei nuovi campi dentro `masterDataRecords.suppliers`
- lista Fornitori resa più leggibile con servizi/modalità e condizioni pagamento
- overview/snapshot dedicato alla base fornitori
- pannello “profilo operativo” della scheda corrente
- aggiornati i18n IT/EN
- aggiornato cache busting su `index.html` e `sw.js`

## File toccati
- `index.html`
- `style.css`
- `sw.js`
- `js/app.js`
- `js/module-registry.js`
- `js/i18n.js`
- `js/master-data/entity-records.js`
- `js/master-data/master-data-overview.js`
- `js/master-data/quick-add.js`

## QA minimo
1. aprire `Anagrafiche > Fornitori`
2. verificare che la famiglia sia bloccata su Fornitori
3. aprire una scheda fornitore esistente
4. verificare i nuovi campi operativi
5. salvare un fornitore con servizi, aree e pagamento
6. ricaricare e verificare persistenza
7. controllare il pannello snapshot/profilo operativo
8. verificare che le altre famiglie Anagrafiche restino operative dal modulo madre `Anagrafiche`

## Rischio regressione
Basso-moderato:
- tocchiamo il motore master-data strutturato
- non tocchiamo pratiche, quotazioni, documenti o listini
- non modifichiamo la logica delle famiglie directory leggere
