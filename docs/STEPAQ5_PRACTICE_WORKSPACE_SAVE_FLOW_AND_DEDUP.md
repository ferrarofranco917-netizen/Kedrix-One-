# STEPAQ5 — Practice workspace + save flow + de-dup

## Objective
Close the practice blockers that still distorted the real working flow:
- phantom workspace sessions even when no practice mask was truly open;
- post-save return landing on an overview-heavy surface instead of the real operating fields;
- start-tab persistence after save on a newly created practice;
- duplicated explanatory text inside the operational hub.

## What changed

### 1. Practice workspace now has no phantom bootstrap mask
- `js/workspace/practice-workspace.js`
- the workspace state can now stay empty until the user really opens a draft or an existing practice;
- closing the last mask no longer creates a silent replacement session;
- this keeps `Pratiche hub`, `Gestione pratiche` and `Workspace pratica` aligned with the intended architecture.

### 2. Save flow returns to a coherent working tab
- `js/practices/save-pipeline.js`
- `js/app.js`
- after save, if the active tab was `start`, the workspace now reopens on `practice`;
- if the user was already on an operating tab, that tab is preserved;
- this avoids reopening an existing saved practice on a starter state.

### 3. Focus after save goes to the active work area
- `js/practices/open-edit.js`
- after save/open, focus now prefers the currently active dynamic field area instead of always jumping back to the top identity block.

### 4. Practice tab shows the actual fields first
- `js/practices/form-renderer.js`
- the `practice` tab no longer prepends the overview shell before the real fields;
- the user lands directly on the core operational block.

### 5. Practice panel wording aligned with the real UX
- `js/templates.js`
- the `practice` panel title/subtitle now describe the area as the main operational block instead of an overview architecture area.

### 6. Operational hub redundancy reduced
- `js/practices/practice-operational-hub.js`
- action cards no longer repeat the same explanatory text when it duplicates the source message.

## Files included
- `js/app.js`
- `js/templates.js`
- `js/practices/form-renderer.js`
- `js/practices/open-edit.js`
- `js/practices/practice-operational-hub.js`
- `js/practices/save-pipeline.js`
- `js/workspace/practice-workspace.js`

## Expected result
- no ghost practice mask before a real open action;
- closing the last mask returns the route logic to Gestione pratiche cleanly;
- save no longer reopens a newly created practice on `start`;
- after save the user lands on real working fields, not on a misleading summary-first surface;
- less visual redundancy inside the operational hub.
