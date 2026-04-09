# STEP AQ4 — Practice save flow + overview de-dup

## Objective
Close two concrete issues affecting the Practice workspace after the AQ3 consolidation:

1. after save, the user could be brought back into an overview-heavy screen that felt like the inserted data had not really been retained;
2. the operational hub repeated the same information in source cards and step cards, creating unnecessary redundancy.

## What changed

### 1) Save flow now returns to the real working area
- the `practice` tab no longer renders the operational overview block before the real fields;
- after save, the user remains in a field-oriented workspace instead of landing on a duplicated summary-first screen;
- the save focus logic now prefers visible dynamic fields during save-driven reopen, instead of always forcing focus back to identity.

### 2) Overview / hub de-duplication
- the operational hub action cards no longer repeat the same explanatory paragraph when it duplicates the card title;
- the result is a lighter, less repetitive summary surface.

### 3) AQ3 baseline kept inside this delta
This delta also includes the AQ3 hardening files so the package is self-consistent when applied over the main baseline:
- `js/licensing.js`
- `js/workspace/practice-workspace.js`

## Files included
- `js/app.js`
- `js/licensing.js`
- `js/workspace/practice-workspace.js`
- `js/practices/form-renderer.js`
- `js/practices/open-edit.js`
- `js/practices/practice-operational-hub.js`

## Expected result
- saving a practice keeps the user inside the practical editing flow;
- filled values remain visible in the real form area after save;
- overview redundancy is reduced;
- AQ3 workspace gating remains preserved.
