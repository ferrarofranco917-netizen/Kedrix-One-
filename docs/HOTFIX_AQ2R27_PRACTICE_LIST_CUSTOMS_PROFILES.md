# HOTFIX AQ2R27 — Practice list customs profiles

## Objective
Add a safe analytics section to **Gestione pratiche** that reads recurring customs profiles on the filtered scope without touching:
- practice save flow
- practice identity
- in-app workspace
- multi-mask opening rules

## Added
New section in Practice Management:
- Recurring customs profiles
  - recurring customs offices
  - customs office + flow
  - customs office + section

## Files changed
- index.html
- sw.js
- js/search/practice-list-customs-profiles.js

## Notes
This step is designed to sit on top of AQ2R26 consolidated practice-list modules.
