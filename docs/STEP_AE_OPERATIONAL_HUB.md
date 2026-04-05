# STEP AE — Operational Hub Overview

## Obiettivo
Consolidare i board già presenti nella tab **Pratica** in un unico punto operativo, senza aggiungere nuova shell e senza toccare i flussi già blindati.

## Cosa aggiunge
- nuovo **Hub operativo** nella tab Pratica
- sintesi unificata di:
  - soggetti collegati
  - completezza operativa
  - completezza documentale
- lista delle **prossime azioni** ordinate per priorità
- pulsanti rapidi verso:
  - campo pratica prioritario
  - blocco operativo prioritario
  - allegati / riferimenti documentali

## File toccati
- `index.html`
- `style.css`
- `sw.js`
- `js/i18n.js`
- `js/practices/linked-parties-board.js`
- `js/practices/practice-readiness-board.js`
- `js/practices/practice-document-readiness.js`
- `js/practices/practice-overview.js`
- `js/practices/practice-operational-hub.js` (nuovo)

## Test consigliati
1. Aprire una pratica con dati parziali.
2. Verificare il nuovo blocco **Hub operativo** in tab Pratica.
3. Cliccare l'azione prioritaria su soggetti.
4. Cliccare l'azione prioritaria su blocco operativo.
5. Cliccare l'azione documentale verso Allegati o riferimenti.
6. Verificare che Pratica / Dettaglio / Allegati restino stabili.
7. Verificare cambio lingua IT/EN.

## Nota
Questo step usa i board già presenti come sorgenti di stato e priorità, così il consolidamento resta modulare e meno fragile.
