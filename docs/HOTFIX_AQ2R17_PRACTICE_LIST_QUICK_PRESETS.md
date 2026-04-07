# HOTFIX AQ2R17 — Gestione pratiche: viste rapide operative

## Obiettivo
Aggiungere viste rapide one-click in Gestione pratiche senza toccare il workspace della pratica.

## Contenuto
- nuovo modulo `js/search/practice-list-presets.js`
- preset rapidi: Tutte, Bozze incomplete, In attesa documenti, Solo import, Solo export
- mantenimento di date, confronto periodo e ordinamento quando si applica un preset
- supporto al filtro tecnico `draftState` nella pipeline analytics
