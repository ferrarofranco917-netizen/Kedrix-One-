# Kedrix One — STEP 6B.4

Metadati documentali avanzati + ponte di ricerca relazionale Pratiche/Documenti.

## Interventi applicati
- metadati documento nei pannelli Allegati: data documento, riferimento documento, MRN/rif. doganale, tags, note
- salvataggio metadati con conferma applicativa via toast
- ricerca Pratiche estesa ai match documentali collegati (nome file, tipo documento, MRN, riferimento documento, tags)
- Document Engine arricchito con metadati ricercabili e riepilogo metadata nei bundle
- nuovi moduli dedicati: `js/documents/document-metadata.js`, `js/search/practice-document-bridge.js`

## File toccati
- js/documents/document-metadata.js
- js/search/practice-document-bridge.js
- js/practices/attachments.js
- js/documents/document-engine.js
- js/templates.js
- js/app.js
- index.html
- style.css
- README.md

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



## STEP 5C.7 — Duplica pratica / copia pratica simile
- `js/practices/duplicate.js` introdotto come modulo dedicato per la duplicazione pratica, senza stratificare nuova logica autonoma in `app.js`.
- Pulsante `Duplica pratica` disponibile quando una pratica esistente è aperta in modifica.
- La copia apre subito un nuovo draft editabile con nuova identity pulita: nessuna collisione con `id`, `editingPracticeId` o `generatedReference`.
- La copia reimposta lo stato a `In attesa documenti` e svuota i riferimenti operativi/documentali che non devono ereditarsi in modo cieco (es. booking, container, MBL/HBL, MAWB/HAWB, CMR, bolla, alcune date operative e flag di verifica).
- Banner dedicato per distinguere chiaramente la copia non ancora salvata dalla pratica origine.
- Base pronta per step successivi: controlli container, pesi, allegati pratica e ulteriori regole di integrità dati.


## STEP 5C.8 — Sea schema cleanup + deduplication
- removed MBL input from sea forms and consolidated on `Polizza`
- removed duplicated `Sezione doganale` field from sea forms and consolidated on `Dogana / sezione`
- placed `Fatt. Estera` and `Importo Fattura` consecutively
- suppressed redundant Incoterms hint under `Deposito` and `Collega a`
- added legacy-safe sea normalization module for backward-compatible draft/record hydration


## STEP 5C.8A — micro-fix schema mare
- campo `Incoterm` mantenuto nel mare ma con etichetta semplificata, senza testo `Resa (Incoterms® 2020)`
- campo `Incoterm` riposizionato dopo `Terminal consegna` nello schema mare
- aggiunto campo `Valuta fattura` accanto a `Importo Fattura`

- removed the misplaced `Incoterms 2020` hint from sea/air suggestion fields (company, ports, origin/destination, customs, terminal) and replaced it with neutral directory guidance


## STEP 5C.9 — Dataset ufficiali porti + dogane
- dataset porti spostato su base strutturata con valori canonici, alias e display coerente per la normalizzazione operativa
- introdotto dataset dedicato `js/data/customs.js` per `Dogana / sezione`, con codici ADM e principali sezioni operative
- introdotto dataset aeroporti strutturato per i flussi aerei
- introdotto modulo `js/practices/reference-normalizer.js` per normalizzare porti/aeroporti/dogane in save/open/edit senza sporcare `app.js`
- hint operativi dedicati per UN/LOCODE, aeroporti e codici ADM


## STEP 5C.9A — Dataset estesi + TARIC autocomplete + layout comparti

- dataset porti UN/LOCODE ampliato in file dedicato
- dataset TARIC/CN bootstrap in file dedicato con suggerimenti su prefisso cifra
- form pratica segmentato in comparti operativi: controparti, routing, documentale, dogana, operativa
- `Dogana` e `Data dogana` affiancati nello stesso comparto logico
- `Importo fattura`, `Valuta fattura` e `Packing list` consolidati nel comparto documentale

## STEP 5C.9B — Semantica verifiche doganali nel Dettaglio
- il blocco `Controlli` nel tab `Dettaglio` viene riallineato a verifiche **doganali** sulla unità, non a controlli interni di processo
- etichetta aggiornata in `Verifiche doganali`
- hint sezione aggiornato per chiarire che merce/documentale/scanner/sanitario/magazzino sono tipologie di verifica doganale
- banner pratica `IN VERIFICA` aggiornato con titolo fisso: `Attenzione unità sottoposta a verifica`
- dettaglio delle tipologie attive mostrato sotto il titolo del banner
- dashboard alert aggiornata: quando una pratica ha flag verifica attivi genera l'avviso `Attenzione unità sottoposta a verifica`


## STEP 5C.9C — Banner verifica con tipo esplicito

- titolo banner mantenuto: `Attenzione unità sottoposta a verifica`
- riga dettaglio resa più diretta: `Tipo: Scanner · Magazzino · Documentale`
- allineamento applicato anche agli alert dashboard


## STEP 5C.9C HF1 — Fix verificationHint banner
- Fix regressione in `templates.js` che causava `ReferenceError: verificationHint is not defined` al render di Pratiche.
- Ripristinata la costruzione dell'hint del banner verifica usando `KedrixOnePracticeVerification.formatTypesHint()`.


## STEP 5C.9C HF2 — Verification banner flags only
- Fixed regression: the verification banner is now shown only when one or more customs verification flags are active.
- Status `Sdoganamento` no longer triggers the banner by itself.


## STEP 5C.10 — Controlli container e integrità dati
- controllo formale container ISO 6346 per pratiche mare
- controllo check digit container ISO 6346
- alert non bloccante se il container è già presente in altra pratica
- normalizzazione container in maiuscolo senza spazi
- modulo dedicato: `js/practices/container-integrity.js`


## STEP 5C.10 HF1 — Nuova pratica + booking opzionale
- `Nuova pratica` ora resetta sempre il draft e apre il form pulito anche se l'utente è già dentro `Pratiche`.
- `Booking` non è più obbligatorio negli schemi mare import/export.


## STEP 5C.11 — Dettaglio: controlli peso e UX dati merce
- nuovo modulo `js/practices/weight-integrity.js`
- controllo live e pre-save: il peso netto non può superare il peso lordo
- dataset ponte per `articleCode` e `packageType` con suggerimenti operativi
- dettaglio merce più guidato senza introdurre monoliti


## STEP 6B.1 — Allegati pratica + lista allegati

- nuovo modulo `js/practices/attachments.js`
- import file nella pratica con archivio browser locale (IndexedDB)
- tab dedicata `Allegati` nel form pratica
- lista allegati con nome file, tipo documento, data importazione, apertura e rimozione controllata
- owner key stabile per allegati anche prima del primo salvataggio della pratica


## STEP 6B.2 — Document Engine + ricerca relazionale documentale
- nuovo modulo `js/documents/document-engine.js` per costruire bundle pratica/documenti a partire dagli allegati esistenti
- nuova route reale `Documenti` con ricerca relazionale su numero pratica, cliente, container, booking, dogana, nome file e tipo documento
- ogni risultato della ricerca documentale resta centrato sulla pratica madre ma mostra i documenti collegati nello stesso bundle
- apertura diretta della pratica madre dal modulo Documenti
- apertura diretta dell'allegato collegato dal modulo Documenti
- base feedback interna app introdotta con `js/ui/app-feedback.js` per conferme/toast dell'app senza dipendere da popup di sistema
- rimozione allegato nel tab Allegati aggiornata: conferma tramite dialog interno app, non `window.confirm`
- aggiornamento tipo documento ora confermato con feedback applicativo
- service worker riallineato ai file reali del repo per evitare cache incoerenti nello staging PWA


## STEP 6B.3 — Preview documenti + categorie documentali

- preview inline per PDF / immagini / testi nel modulo Documenti
- categorie documentali configurabili da Impostazioni
- nessun uso di popup browser per le conferme operative documentali


## STEP 6B.3 HF2 — Allegati hotfix
- Fix `DocumentCategories is not defined` nel pannello allegati.
- Ripristinato il caricamento allegati con alias globale sicuro e ordine script protetto.

- Hotfix i18n Allegati: completate traduzioni EN del pannello, azioni, toast, conferme ed errori del modulo attachments.


## STEP 6B.4 HF2
- Hardened English coverage for the Attachments module.
- Replaced Italian-only fallbacks in attachments/templates/document engine with language-aware fallbacks.
