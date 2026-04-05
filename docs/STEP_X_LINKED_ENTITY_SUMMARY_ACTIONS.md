# STEP X — Linked Entity Summary Actions

## Obiettivo
Rendere le mini-summary delle anagrafiche collegate più utili direttamente nella tab Pratica, senza uscire subito dal flusso operativo.

## Cosa aggiunge
- azione **Dettaglio** per espandere una preview più completa
- azione **Apri scheda** per entrare nell'anagrafica collegata
- azione **Copia dati** per copiare negli appunti i dati principali della scheda collegata

## Aree toccate
- `js/practices/linked-entity-summary.js`
- `js/app.js`
- `js/i18n.js`
- `style.css`
- `index.html`
- `sw.js`

## Note anti-regressione
- nessuna modifica alla shell
- nessun cambiamento al quick add
- nessun cambiamento al ritorno Anagrafiche → Pratica
- `Apri scheda` riusa il flusso già blindato di apertura record collegato
