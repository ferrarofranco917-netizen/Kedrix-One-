# HOTFIX AQ2R3 — Practices architecture simplification + calm start

## Scope
Realignment of the **Pratiche** module after AQ2R2 with focus on:
- `Gestione pratiche` as the first visible submodule
- parent `Pratiche` tab used as a clean domain hub when no practice mask is open
- in-app dedicated workspace preserved for opening/editing practices
- `Nuova pratica` kept only inside `Gestione pratiche`
- calmer startup for a new practice mask to avoid invasive validation feeling on open

## Files touched
- `index.html`
- `sw.js`
- `js/module-registry.js`
- `js/i18n.js`
- `js/templates.js`
- `js/app.js`

## Delivered behaviour
1. **Sidebar order fixed**
   - `Gestione pratiche` is now the first submodule under `Pratiche`
   - legacy alias `practices/pratiche-v2` is normalized away from the old naming

2. **Parent tab cleaned**
   - `Pratiche` now behaves as a parent hub when no workspace mask is active
   - the actual editor appears when a practice is opened or a new one is created from `Gestione pratiche`

3. **No duplicate entry point for new practice**
   - `Nuova pratica` remains only in `Gestione pratiche`
   - the parent hub routes users toward list/search or already-open masks

4. **Calmer new-practice opening**
   - a brand new draft opens on an `Avvio / Start` tab instead of landing directly on the operational overview
   - the user can first compile identity fields and then open Practice / Detail / Attachments blocks
   - validation summary still stays bound to save attempt logic

## Regression attention
Verify especially:
- open existing practice from list
- open practice from Documents
- create new practice from `Gestione pratiche`
- multi-mask switch/close
- save/update existing practice
- list filters + date comparison
- quick add return flow
- attachments tab
