# HOTFIX — STEP V client linked entity button

## Issue
The inline `↗` action for opening a linked master-data record from the practice was not visible on the top `Cliente (editabile)` field.

## Cause
`buildOpenLinkedButton()` was wired in `js/practices/form-renderer.js` for dynamic fields inside the Practice tab sections, but the top identity field `clientName` is rendered by `js/templates.js` with a custom label row that only included the `+` quick-add button.

## Fix applied
- Added `buildOpenLinkedButton({ state, draft, fieldName: 'clientName', i18n: T })` to the top `clientName` field in `js/templates.js`.
- Kept the existing `+` quick-add button.
- Wrapped both actions in `.field-label-actions` so the UI remains consistent.

## Expected result
When the current practice client is linked — or matches an existing structured client record — the `↗` button appears next to `Cliente (editabile)` and opens the related anagrafica record.
