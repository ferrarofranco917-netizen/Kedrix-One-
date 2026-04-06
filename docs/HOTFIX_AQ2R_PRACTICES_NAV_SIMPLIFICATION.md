# HOTFIX AQ2-R — Practices navigation simplification

## Goal
Simplify the Practices navigation after STEP AQ2.

## Changes
- remove visible "Pratiche v2" naming
- rename practice list area to "Gestione pratiche"
- keep only two practice submodules in navigation: "Pratiche" and "Gestione pratiche"
- make module root `practices` open the practice workspace directly
- map old routes to new ones for compatibility:
  - `practices/pratiche-v2` -> `practices/pratiche`
  - `practices/elenco-pratiche` -> `practices/gestione-pratiche`
- keep "Nuova pratica" routed only to the dedicated practice workspace

## QA
- sidebar under Practices shows only two submodules
- root Practices opens workspace
- Gestione pratiche opens list/search
- old hashes still resolve correctly
- opening from Documents lands in Practices workspace
- IT/EN labels aligned
