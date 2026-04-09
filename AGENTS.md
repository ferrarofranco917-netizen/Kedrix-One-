# AGENTS.md

## Project identity
Kedrix One is a modular operational workspace for logistics, customs, documents, CRM, quotations, tracking, and related enterprise workflows.

## Non-negotiable rules
- Preserve Kedrix shell and visual identity.
- Staging only.
- No monolithic files.
- Zero regressions.
- Prefer surgical deltas over broad refactors.
- IT/EN only.
- Keep multi-mask internal workspace behavior intact.
- Every opened entity must stay in an internal dedicated mask.
- Save/update feedback must happen inside the app.

## Product rules
- Do not rebuild existing modules from scratch unless explicitly requested.
- If a submodule already exists, audit first and consolidate it.
- Do not touch core Practices unless strictly necessary.
- Keep parent-child coherence between Practices and connected submodules.
- Do not copy external/reference software UI.

## Architecture rules
- Touch only files required by the task.
- Prefer dedicated feature files over adding logic to large generic files.
- Reuse existing patterns for route, renderer, state, storage, workspace, and notifications.
- Do not replace real renderers with generic placeholders.
- Keep persistence and dirty-state behavior stable.
- Avoid horizontal scroll in primary workflows unless strictly unavoidable.

## UX/UI rules
- Keep visual consistency across buttons, tabs, cards, and launchers.
- Prefer operational clarity over decorative redesign.
- Preserve multi-device usability across desktop, tablet, and smartphone.

## Customs instructions rules
- "Istruzioni di sdoganamento" is an existing submodule and must be consolidated, not recreated.
- Keep real linkage to the mother practice.
- Preserve create/save/update/reopen/reload consistency.
- Use scalable practice-selection patterns: recent items + targeted search.

## Review guidelines
- Check regressions in Practices core flows.
- Check route-to-renderer consistency.
- Check save/update/reload persistence.
- Check dirty-state and close behavior.
- Check multi-mask behavior.
- Check that no unnecessary monolithic growth was introduced.
- Check IT/EN label consistency.
- Check that Kedrix shell remains coherent.

## Output expectations
For each task, always return:
- objective
- files changed
- real state found
- issues detected
- changes implemented
- regression risks
- minimal QA checklist

## Forbidden
- No silent mass refactors.
- No browser-native alerts as final save/update UX.
- No duplicate modules or duplicate business flows.
- No “ready” claims without checking route, renderer, state, save, and reopen flow.
