# STEPAQ50 — Rimessa documenti layout governance / packing desktop enterprise

## Obiettivo
Rifinire il sottomodulo reale **Rimessa documenti** già entrato in repo con AQ49, mantenendo:

- workspace interno multi-maschera
- collegamento alla pratica madre
- stampa
- invio email
- salvataggio / riapertura documenti
- nessuna route placeholder nuova

## Delta implementato

### 1. Tab Generale riorganizzato field-by-field
Il tab **Generale** non è più un semplice blocco uniforme: ora è distribuito in sezioni operative compatte:

- **Pratica collegata**
- **Identità documento**
- **Parti e recapiti**
- **Movimento e trasporto**
- **Valori economici**

La nuova struttura applica packing desktop enterprise con campi dimensionati sul dato reale.

### 2. Miglioria tab Dettaglio
La tabella Dettaglio è stata resa più operativa:

- **Tipo documento** con select guidata
- **Note** con textarea compatta
- larghezze colonna riequilibrate
- nessuno scroll orizzontale inutile sul desktop target

### 3. Coerenza multi-maschera
Le maschere aperte mostrano anche lo stato dirty in modo più leggibile.

### 4. Conferme interne
La chiusura di una maschera con modifiche non salvate resta basata sul layer interno app-feedback.
Nel delta AQ50 il fallback browser è stato rimosso da Rimessa documenti per restare coerenti con la baseline Kedrix.

## File toccati
- `js/remittance-documents/remittance-documents-module.js`
- `style.css`
- `index.html`
- `sw.js`

## Rischio regressione
Basso / medio-basso, perché:

- nessuna modifica al motore pratiche
- nessuna modifica al modello dati persistito
- nessuna nuova route
- nessuna riscrittura del workspace engine

Il rischio residuo è concentrato sulla resa visiva e sui binding del tab Dettaglio.

## QA minima consigliata
1. Aprire **Pratiche → Rimessa documenti**.
2. Aprire da pratica attiva e anche con **Nuovo documento vuoto**.
3. Verificare più maschere aperte contemporaneamente.
4. Verificare tab **Generale**, **Testi**, **Dettaglio**.
5. In Dettaglio: aggiungere riga, cambiare tipo documento, scrivere note, salvare.
6. Salvare e riaprire il documento dai **Documenti salvati**.
7. Chiudere una maschera dirty e verificare conferma interna app.
8. Verificare layout desktop senza campi dispersi.
