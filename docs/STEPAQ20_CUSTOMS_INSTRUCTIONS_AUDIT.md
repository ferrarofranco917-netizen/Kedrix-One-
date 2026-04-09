# STEPAQ20 — Audit tecnico-funzionale del sottomodulo esistente **Istruzioni di sdoganamento**

## Obiettivo step
Eseguire un audit reale del sottomodulo già presente in Kedrix One, senza ricrearlo da zero, per stabilire:
- dove vive davvero nel codice
- come si apre oggi
- se è collegato o no alla pratica madre
- se salva / aggiorna / persiste davvero
- se è coerente col workspace Kedrix
- qual è il delta minimo corretto per consolidarlo senza regressioni

## Baseline usata
- baseline autorevole: `Kedrix-One--main.zip`
- reference funzionale: `Kedrix One pratiche e sottomoduli.7z`
- screenshot utente: mare import/export, aereo import/export, terra import/export

## Stato reale trovato
### 1) Dove si trova davvero nel codice
Il sottomodulo **esiste solo come route registrata e localizzata**, non come implementazione funzionale reale.

File e punti reali trovati:
- `js/module-registry.js`
  - blueprint pratiche con voce `Istruzioni di sdoganamento`
  - slug automatico → route `practices/istruzioni-di-sdoganamento`
  - descrizione generata come placeholder
- `js/i18n.js`
  - label IT/EN del submodule
- `js/templates.js`
  - il sidebar lo mostra come submodule normale
  - se il route non ha renderer dedicato finisce nel placeholder generico
- `js/app.js`
  - non esiste branch dedicato per `practices/istruzioni-di-sdoganamento`
  - il route ricade nel fallback `Templates.submodulePlaceholder(...)`
- `index.html`
  - non esiste nessun file script dedicato al sottomodulo

Conclusione: **vive come voce di navigazione, non come modulo operativo reale**.

### 2) Come si apre oggi
Si apre:
- dal sidebar / subnav di `Pratiche`
- oppure via hash route diretta `#practices/istruzioni-di-sdoganamento`

Flusso tecnico attuale:
1. il sidebar genera il bottone del submodule
2. il click passa da `data-route`
3. `app.js` fa `navigate(route)`
4. `renderMain()` non trova una gestione dedicata
5. il route finisce nel placeholder generico

Quindi oggi **si apre come pagina placeholder dentro la shell**, non come maschera operativa dedicata.

### 3) Collegamento con la pratica madre
**Non è davvero collegato alla pratica madre.**

Verifica negativa:
- non legge `state.selectedPracticeId`
- non legge `state.draftPractice`
- non usa il `practiceWorkspace`
- non riceve `practiceId`, `reference`, `practiceType`, `direction`, `mode`
- non eredita i soggetti della pratica
- non eredita campi logistici / doganali
- non ha un proprio `workspace` multi-maschera
- non ha un proprio record model con foreign key verso la pratica

Conclusione: il collegamento con la pratica madre è oggi **assente**.

### 4) Stato reale del sottomodulo
Classificazione reale:
- **non completo**
- **non parziale operativo**
- **non salvabile**
- **non aggiornabile**
- **placeholder navigabile**

È quindi un **placeholder shell-level** già registrato correttamente nel sistema moduli, ma non ancora consolidato come sottomodulo business-ready.

### 5) Salvataggio / aggiornamento / persistenza
**Oggi non salva davvero e non aggiorna davvero.**

Perché:
- non esiste uno state slice dedicato
- `data.js` non inizializza un archivio customs instructions
- `storage.js` non normalizza né persiste alcun dataset dedicato
- non esiste save pipeline del sottomodulo
- non esiste update pipeline
- non esiste dirty-state dedicato
- non esiste reload persistence del sottomodulo

Conclusione:
- nuova istruzione: **NO**
- apertura istruzione esistente: **NO**
- salvataggio: **NO**
- aggiornamento: **NO**
- persistenza reload: **NO**

### 6) Coerenza con workspace Kedrix
**Non è coerente con il workspace Kedrix richiesto.**

Motivi:
- non è multi-maschera
- non apre una maschera dedicata interna all’app
- non ha dirty-close proprio
- non ha feedback salvataggio interno
- non aggancia gli allegati / documenti a un owner coerente
- non ha un flusso “apri da pratica → lavora → salva → riapri”

Quindi è coerente solo come:
- naming
- route
- visibilità sidebar
- traduzione IT/EN

Ma **non** come sottomodulo operativo Kedrix.

## Mappa funzionale emersa dal reference SP1 + screenshot
Il reference conferma che il sottomodulo reale da consolidare non è generico: ha una matrice operativa chiara.

### Struttura comune osservata
- header con:
  - Numero pratica
  - Scegli pratica
  - Tipo: Import / Export
  - Viaggio: Mare / Aereo / Terra
- tab:
  - `Generale`
  - `Testi`

### Profili operativi osservati
- Mare Import
- Mare Export
- Aereo Import
- Aereo Export
- Terra Import
- Terra Export

### Blocchi ricorrenti osservati
Campi comuni o quasi-comuni:
- data pratica
- transitario
- riferimento
- riferimento mittente
- luogo compilazione
- importatore / esportatore / committente
- mittente
- destinatario / ricevitore
- resa
- valore merce
- valore fiscale
- DTD
- sezione doganale
- nolo bolla
- booking
- compagnia
- ulteriori istruzioni
- testo allegati
- dichiarazione merce in bolla
- operatore
- allegati
- richiesta prebolla

Blocchi specifici per modalità:
- **Mare**
  - nave / viaggio
  - porto imbarco / porto sbarco
  - container
  - tipologia
  - sigilli
  - data carico
  - TARIC
  - descrizione
  - colli
  - peso netto
  - peso lordo
  - volume
- **Aereo**
  - aeroporto partenza / arrivo
  - MAWB / HAWB
  - marche e numeri
  - descrizione
  - colli
  - peso lordo / netto
- **Terra**
  - targa mezzo
  - origine / destinazione
  - marche e numeri
  - descrizione
  - colli
  - peso lordo / netto

### Tab Testi osservato
È presente almeno un editor testo/footer dedicato, con logica separata dal tab generale.

## Problemi rilevati
1. **Route esistente ma implementazione assente**
2. **Nessun renderer dedicato**
3. **Nessun data model**
4. **Nessuna CRUD**
5. **Nessun legame reale con pratica madre**
6. **Nessuna multi-maschera dedicata**
7. **Nessun dirty state dedicato**
8. **Nessun aggancio reale ad allegati/documenti**
9. **Nessun freeze-ready operativo**
10. **Rischio architetturale**: lasciarlo com’è crea falsa percezione di modulo esistente quando in realtà è solo placeholder

## Freeze-ready?
**No.**
Il sottomodulo è **non freeze-ready** perché manca il minimo operativo strutturale.

## Delta minimo corretto di consolidamento
Il delta minimo corretto **non** è rifare tutto lo SP1.
Il delta minimo corretto è costruire una foundation Kedrix modulare che copra il minimo business reale senza toccare inutilmente il core Pratiche.

### Perimetro minimo consigliato
1. **Creare un renderer reale del sottomodulo**
2. **Aprirlo in maschera dedicata interna**
3. **Collegarlo a una pratica madre**
4. **Prefill dei dati base dalla pratica**
5. **Salvataggio reale**
6. **Aggiornamento reale**
7. **Persistenza reload**
8. **dirty state + chiusura coerente**
9. **toast interno di conferma**
10. **solo IT / EN**

### Architettura minima consigliata
Nuovi file dedicati, senza monoliti:
- `js/customs-instructions/customs-instructions-schema.js`
- `js/customs-instructions/customs-instructions-service.js`
- `js/customs-instructions/customs-instructions-renderer.js`
- `js/customs-instructions/customs-instructions-actions.js`
- `js/workspace/customs-instructions-workspace.js`

Touchpoint minimi ai file esistenti:
- `index.html` → script include
- `js/data.js` → state iniziale
- `js/storage.js` → normalizzazione/persistenza state slice
- `js/i18n.js` → label e messaggi UI
- `js/app.js` → routing + open/save/close hooks
- `js/templates.js` → solo dove serve agganciare CTA o shell wrappers

### Modello minimo dati consigliato
Ogni istruzione deve avere almeno:
- `id`
- `practiceId`
- `practiceReference`
- `practiceType`
- `direction`
- `transportMode`
- `status`
- `attachmentOwnerKey`
- `linkedEntitiesSnapshot`
- `generalData`
- `textData`
- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`

### Regola chiave di collegamento
Il sottomodulo deve nascere:
- da pratica attiva nel workspace
- oppure da pratica scelta esplicitamente

Mai scollegato dal mother record.

### Riusi consigliati
Per ridurre rischio regressione:
- riusare pattern di `PracticeIdentity`
- riusare pattern di `PracticeWorkspace`
- riusare `PracticeAttachments` / `DocumentEngine` tramite owner key coerente
- evitare una seconda logica allegati separata

## File coinvolti nell’audit
### Toccati in lettura
- `index.html`
- `js/app.js`
- `js/module-registry.js`
- `js/templates.js`
- `js/i18n.js`
- `js/data.js`
- `js/storage.js`
- `js/practices/identity.js`
- `js/workspace/practice-workspace.js`

### Toccati in scrittura in questo step
Nessun file runtime.
In questo step sono stati prodotti **solo documenti di audit**, per rispettare la regola:
- audit prima
- consolidamento dopo
- blindatura poi

## Esito finale dello step
### Risposte secche richieste
1. **Dove si trova nel codice?**  
   Solo in route registry + i18n + sidebar/fallback placeholder.
2. **Come si apre oggi?**  
   Dal sidebar / route diretta, come placeholder shell-level.
3. **È collegato alla pratica madre?**  
   No.
4. **Salva davvero?**  
   No.
5. **Aggiorna davvero?**  
   No.
6. **È coerente col workspace Kedrix?**  
   Solo a livello di navigazione, non a livello operativo.
7. **È freeze-ready?**  
   No.
8. **Qual è il delta minimo corretto?**  
   Foundation dedicata modulare + collegamento a pratica madre + CRUD minima + multi-maschera + persistenza + dirty state, senza refactor massivo del core Pratiche.

## Decisione operativa raccomandata
Procedere nel prossimo step con:
- **foundation reale del sottomodulo**
- scope minimo business valido
- zero copie grafiche SP1
- massimo riuso architetturale Kedrix
- rilascio delta chirurgico
