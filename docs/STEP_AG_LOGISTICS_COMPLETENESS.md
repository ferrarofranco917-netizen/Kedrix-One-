# STEP AG — Completezza logistica intelligente

## Obiettivo
Evolvere il layer AF dei nodi logistici in un sistema più intelligente e meno rumoroso, capace di distinguere:
- nodi davvero essenziali
- nodi attivi sul flusso corrente
- nodi non ancora attivi e quindi da non segnalare inutilmente
- prossima azione logistica più utile per tipo pratica

## Scelta architetturale
Per evitare di far crescere in modo monolitico `practice-logistics-board.js`, la logica nuova è stata separata in un modulo dedicato:
- `js/practices/practice-logistics-intelligence.js`

Questo modulo calcola:
- profilo del flusso logistico
- stati intelligenti dei singoli campi
- copertura logistica del percorso
- label sintetica del flusso attivo

## Output introdotti
- nuovi stati item: attivo / non attivo / utile ma non bloccante
- overview più intelligente nel board logistico
- chip con flusso corrente nell’overview logistica
- support card meno rumorose quando il ramo non è attivo
- hub operativo aggiornato con lettura logistica più utile
- overview card “Nodi logistici” aggiornata con titolo di copertura + percorso

## File toccati
- `index.html`
- `style.css`
- `sw.js`
- `js/i18n.js`
- `js/practices/practice-logistics-intelligence.js` *(nuovo)*
- `js/practices/practice-logistics-board.js`
- `js/practices/practice-operational-hub.js`
- `js/practices/practice-overview.js`

## Rischi regressione sorvegliati
- bootstrap nuovo modulo prima del board logistico
- fallback i18n per nuove label
- render stabile tab Pratica
- board logistico con pratiche già salvate
- hub operativo senza ReferenceError
