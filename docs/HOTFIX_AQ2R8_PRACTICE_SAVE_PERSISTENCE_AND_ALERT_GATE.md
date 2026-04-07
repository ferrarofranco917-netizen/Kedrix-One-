# HOTFIX AQ2R8 — Practice save persistence + alert gate stabilization

## Objective
Fix the regression where, after compiling the practice blocks, pressing save could fail to persist the latest entered values before validation, while keeping practice overview alerts hidden until the user actually attempts a save.

## Applied changes
- Added an explicit per-session save-attempt UI state in `js/app.js`.
- On form submit, force persistence of visible identity and dynamic fields before validation and save pipeline execution.
- Reset save-attempt state when opening a new practice, opening an existing practice, duplicating a practice, or after a successful save.
- Updated `practice-calm-start.js` to rely on explicit save-attempt state rather than only current validation errors.
- Preserved modular alert suppression in `practice-overview.js`.
- Kept `practice-list-analytics.js` available to avoid missing-script regressions.
- Bumped `index.html` asset versions and `sw.js` cache.

## Expected behavior after hotfix
- New practice opens clean.
- Practice overview boards stay hidden until the first save attempt.
- When the user fills blocks and presses save, the latest values are flushed into the draft before validation.
- If validation fails, errors appear and entered values remain persisted.
- If validation passes, the practice saves normally and reopen state remains coherent.
