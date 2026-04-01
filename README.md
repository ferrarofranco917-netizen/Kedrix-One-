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


## STEP 5C.5D — Port hardening + sea schema completion
- archivio `UN/LOCODE` ampliato per i porti mare più ricorrenti, con merge retrocompatibile tra default di prodotto e configurazione già salvata nel browser
- normalizzazione retrocompatibile dei valori porto nelle pratiche mare esistenti (`Genova` -> `ITGOA - Genova`, ecc.) per tenere coerenti ricerca, riapertura e modifica
- completamento sicuro dello schema mare con inserimento **solo dei campi mancanti** e skip automatico dei duplicati già presenti
- nuovi campi mare aggiunti: corrispondente, assicurazione, fatt. estera, deposito, terminal ritiro/consegna, effettuata, scarico, fumigazione, importo fattura, commerciale, sezione doganale, figure aggiuntive, trasportatore, bolla, perizia/cessione, collega a, città consegna, rif. aggiuntivo, tags
- ricerca base ampliata ai nuovi riferimenti operativi/documentali mare e CTA esplicita `Apri e modifica` anche dall'anteprima risultato

## STEP 5C.5E — base anti-monolite

Da questo step ogni nuova feature autonoma deve uscire in file dedicati. Base introdotta:

- `js/data/ports.js` → archivio porti e dataset autonomi
- `js/practices/form-renderer.js` → rendering campi dinamici Pratiche
- `js/practices/draft-validator.js` → validazione Pratiche
- `js/practices/verification.js` → banner/stati verifica Pratiche

Regola: niente nuova logica autonoma in `app.js` se può vivere in un modulo dedicato.


## STEP 5C.5F — Search / open / edit modularization
- `js/practices/open-edit.js` introdotto per gestire apertura pratica, scroll/focus editor e binding dei trigger di apertura.
- `js/search/practice-search-ui.js` introdotto per gestire query input e runtime UI della ricerca pratiche.
- `index.html` aggiornato per caricare i nuovi moduli prima di `app.js`.
- `js/app.js` alleggerito: la logica autonoma search/open/edit non viene più stratificata nel file principale.


## STEP 5C.6 — Practice Identity / Persistence / Save Pipeline Modularization
- `js/practices/identity.js` introdotto per centralizzare draft identity, reset, load in edit e base clone-safe per il prossimo step di duplicazione pratica.
- `js/practices/persistence.js` introdotto per isolare persistenza del draft identity/dynamic fields e ridurre la pressione di `app.js` durante input/change/blur.
- `js/practices/save-pipeline.js` introdotto per isolare build record, hook pre-save, commit/update record, log operatore e toast di salvataggio.
- `index.html` aggiornato per caricare i nuovi moduli practices prima di `app.js`.
- `js/app.js` alleggerito: identity, persistence e save pipeline passano a moduli dedicati mantenendo il comportamento esistente.
- Base pronta per i prossimi step: duplicazione pratica, controlli container/pre-save, allegati pratica e ulteriori regole di integrità dati.
