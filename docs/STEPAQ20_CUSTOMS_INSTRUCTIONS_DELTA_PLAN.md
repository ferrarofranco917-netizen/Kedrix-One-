# STEPAQ20 — Piano delta minimo di consolidamento `Istruzioni di sdoganamento`

## Obiettivo del prossimo step
Trasformare il route placeholder `practices/istruzioni-di-sdoganamento` in un sottomodulo Kedrix realmente utilizzabile, senza regressioni sul core Pratiche.

## Scope minimo consigliato
### 1. Routing reale
- branch dedicato in `js/app.js`
- renderer dedicato
- bind eventi dedicato

### 2. Data model minimo
- archivio `customsInstructions`
- workspace `customsInstructionsWorkspace`
- record collegato a `practiceId`

### 3. Apertura coerente
- apertura dal sidebar
- apertura da pratica attiva
- prefill da pratica madre

### 4. UI minima Kedrix
- tab `Generale`
- tab `Testi`
- profilo dinamico per:
  - sea import/export
  - air import/export
  - road import/export

### 5. CRUD minima
- nuova istruzione
- salva
- aggiorna
- riapri
- persistenza reload

### 6. Regole UX/UI
- solo IT / EN
- toast interno app
- dirty close interno
- maschera interna dedicata
- nessuna grafica copiata da SP1

## File nuovi consigliati
- `js/customs-instructions/customs-instructions-schema.js`
- `js/customs-instructions/customs-instructions-service.js`
- `js/customs-instructions/customs-instructions-renderer.js`
- `js/customs-instructions/customs-instructions-actions.js`
- `js/workspace/customs-instructions-workspace.js`

## File esistenti da toccare in modo chirurgico
- `index.html`
- `js/app.js`
- `js/data.js`
- `js/storage.js`
- `js/i18n.js`
- `js/templates.js`

## Anti-regressione
- non toccare il save pipeline delle Pratiche se non strettamente necessario
- non duplicare il workspace pratiche
- non creare un secondo sistema allegati separato se il primo è riusabile
- non cambiare la shell Kedrix
- non introdurre overview ridondanti

## Exit criteria del prossimo step
- il submodule non mostra più il placeholder
- si apre una maschera reale
- la pratica madre è collegata
- salva / aggiorna / riapre
- reload ok
- dirty close ok
- toast ok
- nessuna regressione evidente su Pratiche
