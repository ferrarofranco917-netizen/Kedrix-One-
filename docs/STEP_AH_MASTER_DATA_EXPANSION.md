# STEP AH — Anagrafiche expansion foundation

## Obiettivo
Rafforzare il modulo **Anagrafiche** come base strutturata per i prossimi blocchi di roadmap, senza toccare i flussi delicati già blindati della tab **Pratica**.

Lo step introduce una crescita mirata in tre direzioni:

1. **Fornitori** come famiglia anagrafica reale e strutturata.
2. **Compagnie marittime** e **compagnie aeree** promosse a schede strutturate, non più sole directory leggere.
3. **Overview foundation** nel modulo Anagrafiche per leggere subito lo stato di maturità dei gruppi utili a:
   - CRM
   - Quotazioni
   - Importazione
   - pratiche relazionali

## File coinvolti
- `index.html`
- `style.css`
- `sw.js`
- `js/data.js`
- `js/i18n.js`
- `js/master-data/entity-records.js`
- `js/master-data/quick-add.js`
- `js/master-data/master-data-overview.js` **nuovo**

## Cosa cambia

### 1. Nuove famiglie strutturate
Aggiunta la famiglia:
- **Fornitori**

Promosse a famiglie strutturate:
- **Compagnie marittime**
- **Compagnie aeree**

Questo permette schede complete con:
- ragione sociale
- P.IVA
- contatti
- indirizzo
- note
- stato attivo

### 2. Ponte futuro Quotazioni
Il modulo Anagrafiche ora prepara in modo esplicito la base per il requisito roadmap:
- ogni voce economica di **Quotazioni** potrà selezionare un **fornitore**
- compagnie e vettori diventano più riusabili come entità strutturate

### 3. Overview foundation nel modulo Anagrafiche
Nuova lettura ad alto livello con tre blocchi:
- **Clienti e CRM**
- **Fornitori e Quotazioni**
- **Soggetti operativi**

Ogni blocco mostra:
- numero schede strutturate
- famiglie già attive
- stato di maturità della base dati

### 4. Contesto della famiglia attiva
Sotto l’overview viene mostrato anche un riquadro che distingue:
- **scheda entità completa**
- **directory operativa**

Così è più chiaro quali famiglie sono già pronte per collegamenti forti e quali restano directory leggere.

## Protezioni anti-regressione
- nessuna modifica ai workflow Pratica / Dettaglio / Allegati
- nessuna riscrittura distruttiva del quick add
- nuovo layer in file dedicato (`master-data-overview.js`)
- mantenuta la compatibilità del quick add esistente
- mantenute le regole di persistenza e ritorno automatico

## QA prioritario
1. Aprire **Anagrafiche** e verificare la nuova overview.
2. Controllare che **Fornitori** compaia nella tendina famiglie.
3. Salvare una nuova scheda fornitore.
4. Aprire e modificare una **compagnia marittima**.
5. Aprire e modificare una **compagnia aerea**.
6. Verificare che quick add cliente/importatore/destinatario/mittente/vettore continui a funzionare.
7. Verificare console pulita.
8. Verificare traduzioni IT/EN/ES/FR per i nuovi testi principali.

## Valore roadmap
Questo step prepara la base corretta per:
- **STEP AJ — Import foundation**
- **CRM cliente-centrico**
- **Quotazioni economics foundation**
- collegamento futuro con fornitori in righe costo/prezzo cliente
