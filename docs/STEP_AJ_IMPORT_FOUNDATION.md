# STEP AJ — Import foundation (CSV / Excel)

## Obiettivo
Introdurre un layer modulare di importazione nel modulo **Anagrafiche** per preparare la migrazione dati senza toccare ancora il commit reale delle anagrafiche o delle pratiche.

## Scope effettivo di questo step
- uploader dedicato nel modulo **Anagrafiche**
- parser CSV attivo
- riconoscimento file Excel e instradamento verso parser dedicato quando disponibile
- mapping colonne → campi Kedrix
- preview righe normalizzate
- validazioni base del campione importato
- issue report sintetico
- commit volutamente differito allo step successivo

## Moduli creati
- `js/import/import-csv-reader.js`
- `js/import/import-excel-reader.js`
- `js/import/import-mapper.js`
- `js/import/import-validator.js`
- `js/import/import-manager.js`

## Integrazione
L’import foundation viene renderizzato nel modulo **Anagrafiche** sotto l’overview foundation e sopra il workspace delle schede.

## Nota importante su Excel
In questa build:
- **CSV** è operativo
- i file **Excel** vengono riconosciuti dalla pipeline
- il parser `.xlsx` resta predisposto ma non ancora attivo se la libreria browser non è disponibile
- in quel caso il sistema guida l’utente a esportare il file in CSV per la preview foundation

Questa scelta è coerente con il principio di:
- step incrementali
- zero regressioni
- nessun innesto distruttivo o monolitico

## Prossimo step coerente
**STEP AK — Import Anagrafiche**

Qui verrà sbloccato il commit controllato delle famiglie strutturate, a partire da:
- Clienti
- Importatori
- Destinatari
- Mittenti
- Fornitori
- Vettori / Compagnie
