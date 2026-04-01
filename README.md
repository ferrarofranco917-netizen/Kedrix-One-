# Kedrix One — STEP 5C.1 HARDENING

Consolidamento reale del modulo Pratiche con hardening retrocompatibile e preparazione operativa per la ricerca base.

## Interventi applicati
- retrocompatibilità record legacy: i dati top-level vengono reidratati dentro dynamicData quando si riapre una pratica
- nessuna perdita campi in modifica per pratiche create nelle basi precedenti
- nuovi riferimenti operativi raccolti nel form: terminal, MBL, HBL, CMR, direzione movimento magazzino
- validazioni condizionali per scenario:
  - FCL → container + MBL
  - LCL/GROUPAGE mare → HBL
  - AIR-CONSOL → HAWB
  - Terra → CMR obbligatorio
  - Deposito doganale → dogana di riferimento
- quick filter elenco ampliato anche a HBL/MBL/MAWB/HAWB/CMR/terminal/vettore/deposito
- dataset demo riallineato con dynamicData e dynamicLabels, utile anche per search preview e modifica record

## File toccati
- js/practice-schemas.js
- js/app.js
- js/data.js
- js/templates.js
- js/i18n.js
- README.md

## Istruzione
Sostituisci integralmente il contenuto del repo con questo pacchetto oppure applica solo i file sopra indicati.


## STEP 5C.2 — Apertura pratica da search + banner verifica
- I risultati del motore ricerca pratiche aprono ora la pratica direttamente nel form principale in modalità modifica, con scroll/focus automatico.
- È stato aggiunto un banner sticky di verifica operativa quando la pratica ha controlli attivi (documentale, scanner, doganale, ecc.).
- Regola architetturale formalizzata: ogni risultato trovato da motori ricerca/documenti dovrà essere sempre apribile ed editabile dal relativo modulo di competenza.


## STEP 5C.3 — Search open hard-fix + banner verifica live
- apertura da search con scroll forzato al form editor
- banner IN VERIFICA sempre renderizzato e aggiornato live su stato/flag


## STEP 5C.4A — Sea field safe extension
- Added only missing sea import/export fields after duplicate audit.
- Introduced currencies directory plus origin/destination directories.
- Added safe fields: origin/destination, vessel exchange + currency, sea freight + currency, policy number/originals/copies, base quotation reference.
- Already existing fields were intentionally skipped to avoid regressions and duplicates.


## STEP 5C.4B
- Hardening etichette schema mare: resi espliciti i campi Valuta nolo e Valuta cambio nave per evitare ambiguità visiva e omissioni in review.


## STEP 5C.5A — Mare contact + UN/LOCODE
- `Rif. / Contatto` non usa più l'elenco città: resta un campo libero per riferimento cliente o nominativo contatto.
- `Porto imbarco` e `Porto sbarco` usano ora suggerimenti UN/LOCODE con normalizzazione city -> code (es. Genova -> ITGOA - Genova).
