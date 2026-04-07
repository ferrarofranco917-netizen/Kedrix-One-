# HOTFIX AQ2R5 — Practice alerts only on save (real repo)

## Goal
Align the real main repo with the UX rule already fixed at architectural level:

- no wall of operational/readiness alerts when a **new practice** opens
- keep **Start / Avvio** calm after selecting the practice type
- reveal boards and alert-like completeness panels only after the user actually tries to save

## Changes
- added `js/practices/practice-calm-start.js`
- kept the user on **Avvio / Start** after practice type selection when the draft is still new
- marked save attempt explicitly before validation
- suppressed overview boards for unsaved drafts until first save attempt
- preserved extra per-session UI state in `js/workspace/practice-workspace.js`

## Protected areas
- practice workspace
- multi-mask sessions
- existing practice opening
- validation summary on save
- practice overview modularity

## Main expected result
For a **new unsaved practice**:
1. opening is calm
2. selecting the type does not force the noisy operational wall
3. if the user opens `Pratica`, overview cards remain readable but the big boards stay deferred
4. the boards appear from the **first save attempt**
