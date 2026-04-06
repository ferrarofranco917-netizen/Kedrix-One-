# STEP AL — Import Archivi logistici

## Obiettivo
Estendere la pipeline Import del modulo Anagrafiche al commit controllato degli archivi logistici attivi in roadmap, mantenendo separata la logica rispetto alle anagrafiche strutturate e senza introdurre regressioni sui flussi sensibili.

## Famiglie abilitate
- Porti
- Aeroporti
- Terminal
- Origini
- Destinazioni
- Località logistiche
- Depositi
- Collega a
- Tipologie unità/trasporto

## Scelte architetturali
- nuovo committer dedicato `import-logistics-commit.js`
- nessuna crescita monolitica del committer anagrafiche
- `import-manager.js` coordinato con scelta dinamica del committer in base alla famiglia target
- copy del pannello Import resa contestuale tra anagrafiche strutturate e archivi logistici

## Comportamento commit
- righe con errori: bloccate
- righe con warning: importate
- duplicati già presenti: saltati
- nuove voci valide: create

## Scope volutamente escluso
- import Pratiche
- update massivo archivi già esistenti
- parser Excel `.xlsx` pienamente attivo nel browser
- commit su famiglie non ancora abilitate in roadmap
