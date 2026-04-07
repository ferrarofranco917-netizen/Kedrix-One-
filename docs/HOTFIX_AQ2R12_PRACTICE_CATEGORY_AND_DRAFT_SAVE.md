# HOTFIX AQ2R12 — Pratica: categoria preservata + save bozza incompleta

## Obiettivo
Correggere due problemi reali emersi in uso:
1. il campo Categoria poteva tornare vuoto durante il flusso pratica;
2. il pulsante Salva pratica non manteneva i dati dei blocchi se la pratica era ancora incompleta.

## Correzioni
- flush dei campi dinamici visibili prima della validazione;
- persistenza identity più robusta per la Categoria, senza cancellarla per vuoti transitori;
- salvataggio come bozza incompleta quando sono presenti almeno tipo pratica, cliente e data;
- aggiunta del modulo practice-list-analytics.js mancante nella repo main.

## Effetto atteso
- Categoria non si azzera più in modo anomalo;
- i dati compilati nei blocchi restano salvati;
- gli alert continuano a comparire al salvataggio, ma non impediscono di mantenere una bozza utile.
