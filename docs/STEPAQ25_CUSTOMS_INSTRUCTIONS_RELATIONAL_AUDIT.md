# STEPAQ25 — Audit relazionale del sottomodulo `Istruzioni di sdoganamento`

## Objective
Definire il **delta minimo e sicuro** per convertire i campi chiave del sottomodulo da input free-text a binding relazionali reali verso:
- pratica madre
- anagrafiche/master data
- directory operative riusabili già presenti in Kedrix One

Senza implementare modifiche funzionali in questo step.

## Files involved (audit scope)
- `js/customs-instructions/customs-instructions-module.js`
- `js/customs-instructions/customs-instructions-workspace.js`
- `js/app.js`
- `js/data.js`
- `js/practice-schemas.js`
- `js/practices/form-renderer.js`
- `js/practices/field-relations.js`
- `js/master-data/entity-records.js`
- `js/data/customs.js`

## Real current field behavior (as-is)

### 1) Link to mother practice: **present but partial**
Current module opens drafts from a selected mother practice and persists `practiceId`, `practiceReference`, `practiceType`, plus a light `sourcePracticeSnapshot`. Validation blocks save when `practiceId` is missing. This confirms the parent linkage exists at record level.

However, key customs/business fields are copied as plain strings into the draft and then edited as simple text/select values without relational IDs/snapshots.

### 2) Rendering model in customs instructions editor: **mostly free-text**
`renderGeneralTab` renders almost all priority fields with `renderField(...)` default text input. Field sync uses generic `data-customs-field` handlers that store raw values directly in `session.draft[fieldName]`.

No dedicated relation metadata, no linked entity IDs (e.g. `...EntityId`), and no linked snapshot map are maintained in customs instructions drafts.

### 3) Hydration from practice: **copy-by-value, not bind-by-reference**
`buildDraftFromPractice(...)` hydrates many fields from `practice.dynamicData` or top-level practice fields, but always as strings:
- customsOffice/customsSection
- carrierCompany
- origin/destination nodes
- sender/receiver/principal parties
- booking
- policy/bl/awb references
- incoterm

No source relation ID is captured from practice dynamic relation fields.

### 4) Save/update persistence: **stable but non-relational**
Save path (`normalizeDraftForSave` + `upsertRecord`) preserves the draft and workspace behavior (dirty state/mask sessions), but still persists free text values for target fields.

## Relational gaps found
1. **No per-field relation payload in customs-instructions records**
   - Missing pattern equivalent to Practices (`dynamicData.<field>EntityId` + `linkedEntities[field]`).
2. **No controlled lookup selection in customs instructions UI**
   - Priority fields are text inputs; users can type arbitrary values even where master data exists.
3. **No reuse of existing relation-state visual semantics**
   - Practices already provide linked/manual status via `PracticeFieldRelations`; customs instructions editor does not.
4. **No inheritance lock/override policy by field**
   - Parent-derived values are copied once; no explicit policy for inherited-only vs controlled override.

## Field-by-field classification (target policy)

| Field | Current behavior | Target class | Source | Edit policy |
|---|---|---|---|---|
| Dogana / Sezione | Text input (`customsOffice`) + separate `customsSection` text | **Master-data bound + controlled override** | `customsOffices` directory (`PracticeSchemas`/`CustomsData`) | Select from lookup; override allowed but flagged as manual |
| Compagnia | Text input (`carrierCompany`) | **Master-data bound + controlled override** | `shippingCompanies` / `airlines` / `carriers` by mode | Select from mode-aware lookup; manual override flagged |
| Origine / Destinazione | Text inputs (`originNode`, `destinationNode`) | **Master-data bound + controlled override** | sea ports / airports / logistics locations / origin-destination directories by mode | Prefer controlled picker; allow manual override with relation status |
| Transitario | Text input (`transitary`) prefilled from client | **Mother-practice bound + controlled override** | mother practice client (+ optional structured entity) | Inherit from mother by default; override via controlled entity select |
| Esportatore / Mittente / Destinatario / Importatore | Text inputs (`principalParty`, `senderParty`, `receiverParty`) | **Master-data bound + controlled override** | structured entities (`importers`, `shippers`, `consignees`, optionally `client`) | Select structured records; manual only as explicit override |
| Booking | Text input (`booking`) | **Mother-practice bound** | mother practice operational refs | Inherited editable (controlled override not required) |
| Polizza / BL / AWB | Text input (`policyReference`) derived from policy/hbl/hawb/cmr | **Mother-practice bound** | mother practice operational refs | Inherited editable (audit trail recommended) |
| Incoterm | Text input in customs module (despite select in Practices) | **Controlled selection (lookup/profile)** | Incoterms profile already in `PracticeSchemas` | Select only from allowed profile per mode |

### Truly free-text (keep free)
- `additionalInstructions`
- `goodsDeclaration`
- `attachedText`
- `footerText`
- optional narrative notes that are operational prose

## Existing reusable infrastructure (already in repo)
1. **Master-data relation engine** (`KedrixOneMasterDataEntities`)
   - Resolves entity by field/suggestion key.
   - Maintains relation-field convention (`<field>EntityId`).
   - Builds/stores relation snapshots (`linkedEntities`).
   - Applies linked records to drafts.
2. **Practice schema lookup catalogs** (`KedrixOnePracticeSchemas`)
   - Provides mode-aware suggestion keys and option entries for customs offices, ports, airports, companies, parties, incoterms.
3. **Relation-state UX pattern** (`KedrixOnePracticeFieldRelations`)
   - Already distinguishes linked/manual/empty and renders compact relation metadata.
4. **Customs dataset** (`KedrixOneCustomsData`)
   - Contains ADM/customs office seed entries usable for controlled lookup.

## Proposed minimal safe delta sequence (no implementation in this task)

### Step 1 — Data model extension in customs instructions draft/record
- Add non-breaking relation containers:
  - `linkedEntities` object
  - relation ids per bound field (`<field>EntityId` where applicable)
- Keep existing plain text fields untouched for backward compatibility.
- On load/open, hydrate relation snapshots from existing text when a unique lookup match exists; otherwise keep as manual.

### Step 2 — Lookup adapter dedicated to customs-instructions
- Introduce a small dedicated file (avoid monolith) for mode-aware lookup sources:
  - customs offices
  - companies (sea/air/road)
  - parties (importer/shipper/consignee/client)
  - origin/destination nodes
  - incoterms profile
- Reuse `PracticeSchemas.getFieldOptionEntries(...)` and `MasterDataEntities` helpers.

### Step 3 — Controlled selectors only on priority fields
- Replace only priority free-text inputs with controlled controls (select/datalist + relation capture).
- Keep legacy text mirrored for persistence compatibility.
- Add explicit “manual override” state marker when typed value is outside active directories.

### Step 4 — Mother-practice inheritance policy
- On `openFromPractice`, stamp inheritance metadata (`inheritedFromPractice: true`, source field map).
- For `booking` and `policyReference`, default to inherited values; allow edit without forcing master-data linkage.

### Step 5 — Save/reopen consistency and migration safety
- Save both relation payload + display value.
- Reopen existing records without relation payload in degraded/manual mode.
- No change to workspace/mask lifecycle or dirty-state logic.

## Regression risks
1. **Dirty-state drift** if selector events are not wired identically to current `data-customs-field` pipeline.
2. **Reopen mismatch** for old records lacking relation payload.
3. **Mode mismatch** (sea/air/road) if wrong lookup source is selected.
4. **Over-constraining operations** if fields that should remain editable become hard-locked.
5. **Parent-child coherence risk** if inherited references are overwritten silently on reopen.

## Minimal QA checklist
1. Open new customs instruction from active practice; verify parent linkage persisted (`practiceId/reference`).
2. For each converted priority field, verify:
   - controlled selection works
   - linked relation payload saved
   - manual override explicitly marked
3. Save, close mask, reopen from archive; verify values + relation metadata unchanged.
4. Reload page; verify persistence of records and workspace integrity.
5. Open multiple masks concurrently; verify no cross-mask data bleed.
6. Verify IT/EN labels remain coherent on converted controls.
7. Verify legacy records (without relation payload) still open/edit/save safely.
