# STEP AM — Import Pratiche

## Obiettivo
Sbloccare l'import controllato delle pratiche in un pannello dedicato dentro il modulo **Pratiche**, senza appesantire il core della tab pratica e senza interferire con i flussi già blindati.

## Cosa introduce
- pannello **Import pratiche — CSV / Excel** nel modulo Pratiche
- target per tipologia pratica
- mapping dedicato per schema pratica
- preview con warning di relazione e validazioni coerenti con `PracticeSchemas`
- commit controllato sulle **nuove pratiche**
- duplicati esistenti saltati

## Regole di questo step
- niente update massivo di pratiche esistenti
- CSV attivo per preview e commit
- Excel riconosciuto ma parser `.xlsx` ancora dipendente dalla libreria browser
- nessun refactor distruttivo della tab Pratica

## Dipendenze usate
- `KedrixOnePracticeSchemas`
- `KedrixOnePracticeSavePipeline.buildRecord`
- `KedrixOneMasterDataEntities.applyLinkedRecordToDraft`
- infrastruttura import già introdotta negli step AJ/AK/AL

## Output reale
Lo step crea pratiche nuove con:
- identità base coerente
- dynamic data coerente con lo schema
- linked entities hydrate dove i match esistono
- reference importata se presente, altrimenti fallback controllato

## Rischi tenuti sotto controllo
- bootstrap nuovo pannello dentro il modulo Pratiche
- traduzioni EN/IT/ES/FR del nuovo blocco
- nessuna regressione su quick add / Dettaglio / Allegati / workspace multi-maschera
