# HOTFIX AQ2R10 — Video review + real submit flush

## What was confirmed from the screen recording
The save issue was reproduced at workflow level:
- the validation summary appears only after a save attempt, which is the intended UX direction
- at the recorded save attempt, the form is still blocked because some required fields remain empty (the summary shows missing category and other required operational fields)
- separately from that, the real repo had a structural gap: the submit handler persisted identity fields, but did **not** force a final flush of the currently visible dynamic block before validation/save

This means two things can happen together:
1. save is legitimately blocked if required fields are still missing
2. the last edited values in the active block can remain out of sync if the user clicks save immediately

## Real fix applied
- added a real submit-time flush of the active practice draft before validation
- restored the missing `practice-list-analytics.js` module actually referenced by the app
- aligned service worker cache list with real existing files
- bumped cache/version strings to reduce stale asset issues

## Files touched
- `index.html`
- `sw.js`
- `js/app.js`
- `js/search/practice-list-analytics.js` (new)

## Expected result
- save attempt now validates against the latest values actually present in the visible block
- if required data is still missing, the save remains correctly blocked
- if required data is complete, the practice can be saved without losing the latest edited values in the active block
