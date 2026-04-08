# HOTFIX AQ2R32 — Gestione pratiche render vars

## Problema corretto
- `activeSortBy is not defined` in `templates.js`
- `U is not defined` nel render guard di `app.js`

## Fix applicato
- dichiarati `activeSortBy` e `activeSortDirection` dentro `practiceList()`
- sostituito `U.escapeHtml(...)` con `Utils.escapeHtml(...)` nel fallback di render di `app.js`
- aggiornato cache busting in `index.html` e `sw.js`
