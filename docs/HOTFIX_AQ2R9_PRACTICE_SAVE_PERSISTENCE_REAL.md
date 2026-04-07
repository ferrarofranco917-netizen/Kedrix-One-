# HOTFIX AQ2R9 — Practice save persistence on real submit flow

## Goal
Ensure that values typed into the practice blocks are committed into the draft before validation and save.

## Real fix
- on form submit, force a full draft flush before validation
- persist the post-save clean session state
- align service worker cache/versioning
- restore missing practice list analytics module when absent

## Files
- index.html
- sw.js
- js/app.js
- js/search/practice-list-analytics.js
