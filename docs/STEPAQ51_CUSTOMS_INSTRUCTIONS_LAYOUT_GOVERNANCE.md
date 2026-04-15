# STEPAQ51 — Istruzioni di sdoganamento layout governance / packing desktop enterprise

## Obiettivo
Portare il sottomodulo reale **Istruzioni di sdoganamento** a un livello di packing desktop enterprise coerente con la baseline Kedrix già applicata a Rimessa documenti, senza nuove route e senza regressioni sulla logica di workspace.

## Implementato davvero

- rifinitura hero/modulo come step AQ51
- riorganizzazione del tab **Generale** in sezioni operative:
  - Pratica collegata
  - Identità istruzione
  - Parti e soggetti
  - Movimento, vettore e dogana
  - Valori e disposizioni
  - Note operative
- grid desktop più compatte con field sizing per dato reale
- supporto span class (`customs-col-2`, `customs-col-3`) per evitare righe disperse
- card meta della pratica madre con ancoraggio visivo alla pratica collegata
- miglioramento della leggibilità delle aree valori/currency e note operative
- aggiornamento asset versioning e cache step AQ51

## Non modificato

- workspace multi-maschera del sottomodulo
- save / save and close
- dirty state
- conferma interna close dirty
- archivio record salvati
- logica relazionale del modulo

## Rischio regressione

Basso / medio-basso.

Punti da verificare in QA visuale:

1. resa del nuovo packing del tab Generale
2. comportamento responsivo sotto 1400px e sotto 980px
3. coerenza del binding input/select nei campi valuta e relazionali

## File delta

- `index.html`
- `style.css`
- `sw.js`
- `js/customs-instructions/customs-instructions-module.js`
- `docs/STEPAQ51_CUSTOMS_INSTRUCTIONS_LAYOUT_GOVERNANCE.md`
