# STEPAQ65 — Anagrafiche > Fornitori > storico/listini foundation

## Base di partenza
- baseline valida: repo originale + AQ61 + AQ62 + AQ63 + AQ64 + AQ64R1
- nessun refactor della struttura generale di Anagrafiche
- nessun nuovo sottomodulo fittizio

## Obiettivo
Inserire nel **Fornitori reale** una prima fondazione per lo **storico/listini fornitore** senza toccare le famiglie già operative.

## Implementazione

### 1. Nuovo modulo dedicato
Aggiunto file dedicato:
- `js/master-data/supplier-price-lists.js`

Responsabilità:
- store persistente in `companyConfig.masterDataRecords.supplierPriceLists`
- normalizzazione record listino
- draft listino
- salvataggio / aggiornamento
- recupero listini collegati al singolo fornitore

### 2. UI integrata nel Fornitore reale
Nel pannello **Anagrafiche > Fornitori** è stata aggiunta una sezione nuova:
- **Fornitori · storico / listini foundation**

Contiene:
- metriche sintetiche sui listini collegati
- storico listini del fornitore corrente
- editor embedded per nuovo listino / modifica listino

### 3. Campi listino foundation
Ogni listino contiene:
- fornitore collegato
- servizio / voce costo
- tratta / ambito
- validità dal / al
- valuta
- costo
- unità / misura
- lead time / resa
- pagamento listino
- note listino
- flag attivo

### 4. Regola anti-regressione
Lo storico/listini è disponibile **solo** quando la scheda fornitore è già salvata come record strutturato.
Se il fornitore non è ancora salvato, compare solo il messaggio guida e non si aprono flussi inconsistenti.

## File toccati
- `index.html`
- `style.css`
- `sw.js`
- `js/i18n.js`
- `js/master-data/quick-add.js`
- `js/master-data/supplier-price-lists.js` nuovo

## QA minimo
1. aprire **Anagrafiche > Fornitori**
2. aprire una scheda fornitore già salvata
3. verificare la nuova sezione **storico / listini foundation**
4. inserire un nuovo listino
5. salvare
6. verificare comparsa nello storico
7. riaprire il listino con pulsante **Apri**
8. modificare e risalvare
9. ricaricare la pagina e verificare persistenza
10. verificare che le altre famiglie restino sane
