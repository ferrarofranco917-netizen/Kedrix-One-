# STEPAQ60 — Anagrafiche fornitori + listini foundation

## Obiettivo
Introdurre nel modulo **Anagrafiche** il primo blocco reale di **Listini fornitore** senza toccare la baseline già blindata di Pratiche e Quotazioni.

## Scope reale del delta
- nuova famiglia reale in Anagrafiche: **Listini fornitore**
- nuovo file dedicato: `js/master-data/supplier-price-lists.js`
- salvataggio persistente in `companyConfig.masterDataRecords.supplierPriceLists`
- ponte operativo dalla scheda **Fornitore** al nuovo listino tramite azione diretta
- KPI foundation dei listini nel modulo Anagrafiche
- overview aggiornata con lettura sintetica di copertura listini

## Dati gestiti dal listino
Ogni scheda listino salva:
- fornitore collegato
- servizio
- modalità
- tratta / direttrice
- mezzo / equipment
- area servita
- costo fornitore
- valuta
- unità costo
- validità dal / al
- contatto / email contatto
- note operative
- stato attivo

## Regole preservate
- nessuna regressione sui workspace pratiche
- nessun refactor pesante di Quotazioni
- niente crescita monolitica: logica listini in file dedicato
- compatibilità mantenuta con quick add e overview esistenti

## QA minimo
1. Aprire **Anagrafiche**.
2. Verificare in tendina la nuova famiglia **Listini fornitore**.
3. Aprire **Fornitori**, selezionare un fornitore e usare il pulsante **Nuovo listino**.
4. Salvare un listino con costo, validità e tratta.
5. Riaprire il listino e verificare persistenza dati.
6. Verificare overview con metrica listini attivi/copertura fornitori.
7. Verificare console pulita e assenza di errori JS in rendering del modulo.

## File coinvolti
- `index.html`
- `style.css`
- `sw.js`
- `data.js`
- `js/i18n.js`
- `js/master-data/entity-records.js`
- `js/master-data/master-data-overview.js`
- `js/master-data/quick-add.js`
- `js/master-data/supplier-price-lists.js` **nuovo**
