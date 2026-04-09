# AGENTS.md

## Project identity
Kedrix One is a modular operational workspace for logistics, customs, documents, CRM, quotations, tracking, and related enterprise workflows.

This repository must evolve incrementally.
Do not restart modules from scratch when an existing implementation already exists.
Prefer audit first, then minimal delta, then hardening.

## Core operating principles
- Preserve the Kedrix shell and visual identity.
- Staging only. Never assume production deployment.
- No monolithic files.
- Zero-regression mindset.
- Prefer surgical changes over broad refactors.
- Keep the architecture modular and scalable.
- Every autonomous feature must live in dedicated files.
- Do not duplicate modules, components, or business flows that already exist.
- Keep all changes compatible with multi-mask internal workspace behavior.
- Every opened entity must stay inside a dedicated internal mask, never as a browser popup/window.
- Save/update feedback must be generated inside the app, not by browser-native alerts.
- Supported UI languages in this repository: Italian and English only.

## Product rules
- The Practices module is a core hub and must not be destabilized.
- Do not touch the core Practices flow unless strictly required by the task.
- If a submodule already exists, consolidate it instead of rebuilding it.
- Preserve parent-child coherence between Practices and connected submodules.
- Keep references to mother practice consistent across create, save, reopen, update, and reload flows.
- Preserve multi-device usability across desktop, tablet, and smartphone.
- Avoid redundant overview screens or duplicated navigation layers.
- Do not copy external/reference software UI. External packs may be used only as functional references.

## Architecture rules
- Prefer dedicated feature files over adding logic to large generic files.
- Reuse existing app patterns for route handling, state, storage, workspace, and notifications where possible.
- Do not introduce placeholder UIs when the task requires real business rendering.
- Do not silently replace an existing renderer with a generic fallback.
- Keep data relationships explicit and traceable.
- Respect existing module boundaries:
  - Practices
  - Documents
  - Master Data / Anagrafiche
  - Workspace
  - CRM
  - Quotations
  - Tracking
- Any new persistence logic must be compatible with existing local staging behavior.
- Any new UI layout must avoid horizontal scrolling for primary workflows unless strictly unavoidable.
- If a form grows, solve it with layout restructuring, sections, cards, or responsive grids — not with oversized horizontal tables.

## UX/UI rules
- Preserve Kedrix visual coherence.
- Use clear hierarchy, balanced spacing, and consistent component sizing.
- Avoid visually inconsistent controls in the same launcher/action zone.
- Tabs, segmented controls, action buttons, and cards must look part of the same system.
- Keep forms readable and operational first.
- Favor density with clarity, not empty decorative space.
- For operational screens, prioritize speed, scanability, and editability.
- Important actions must be obvious.
- Do not introduce heavy decorative redesigns unless explicitly requested.

## Data safety and regression rules
- Never remove or overwrite existing business logic without confirming the exact impact in code.
- Before changing a behavior, identify the current route, renderer, state source, storage binding, and event flow.
- Preserve save/update/reload consistency.
- Preserve dirty-state protections where already present.
- If you change launchers, navigation, or masks, verify that open records still anchor to the correct active section.
- If a bug fix requires broad change, propose the minimal safe path first.

## Working method for tasks
For each task:
1. Audit the existing implementation first.
2. Identify exact files involved.
3. Describe the real current state.
4. Implement only the minimal correct delta.
5. Summarize regression risks.
6. Suggest a short QA checklist.

Unless explicitly requested, do not perform broad refactors.

## File-change policy
- Touch only the files necessary for the task.
- Keep naming consistent with existing repository conventions.
- Avoid creating generic utility layers unless they are truly reusable and justified.
- If adding a new submodule, create dedicated files for:
  - renderer/module logic
  - workspace behavior if needed
  - service/state helpers if needed
- Do not move large existing code blocks unless necessary for stability or modularization.

## Practices-specific rules
- Do not create duplicate practice numbering flows.
- Keep practice numbering unique.
- Preserve consistency between displayed practice number and real assigned number.
- Preserve reliable save/update behavior in practice masks.
- Do not reintroduce false unsaved-changes warnings.
- Practice-related validations should trigger at the appropriate moment, not invasively on initial open.
- New practice work must remain inside the internal app workspace.

## Customs instructions-specific rules
- "Istruzioni di sdoganamento" is an existing submodule and must be consolidated, not recreated.
- Maintain real linkage to the mother practice.
- Preserve create/save/update/reopen/reload consistency.
- Keep the launcher scalable for large practice volumes.
- For practice selection UIs, prefer recent-item shortcuts plus targeted search over huge unfiltered dropdowns.
- Archive opening should focus the user on the start of the active instruction mask.
- Avoid horizontal scroll for main editing flows.

## Review guidelines
When reviewing changes:
- Check for regressions in Practices core flows.
- Check route-to-renderer consistency.
- Check state/storage persistence behavior.
- Check dirty-state and close behavior.
- Check that multi-mask internal behavior is preserved.
- Check that no monolithic file growth has been introduced unnecessarily.
- Check that UI changes remain coherent with Kedrix design language.
- Check that only Italian and English labels are introduced.
- Check that external reference UI has not been copied.

## Output expectations
When completing a task, always provide:
- objective of the step
- files changed
- real state found
- issues detected
- changes implemented
- regression risks
- minimal QA checklist

If asked for PR-ready work, prepare changes in a way that is easy to review as a small, coherent delta.

## Forbidden behaviors
- Do not rebuild an existing module from zero without explicit authorization.
- Do not copy external software UI.
- Do not introduce browser-native alerts as final UX for save/update feedback.
- Do not add unnecessary abstraction layers.
- Do not perform silent mass refactors.
- Do not claim a module is ready without checking the actual route, renderer, state, save, and reopen flow.