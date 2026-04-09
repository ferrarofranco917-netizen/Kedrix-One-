# STEPAQ13 — Practice duplicate and toast fix

## Obiettivo
Ripristinare un flusso affidabile per `Duplica pratica` e aggiungere un feedback chiaro di conferma duplicazione.

## Problema risolto
- il flusso di duplicazione poteva appoggiarsi solo al record storico in `state.practices`
- se la pratica attiva era aperta in maschera, il click poteva non generare una nuova bozza coerente
- mancava un toast esplicito di conferma duplicazione

## Correzione applicata
- la duplicazione ora risolve prima la **pratica attiva in maschera** se coincide con il record in modifica
- la copia nasce da uno `sourceRecord` robusto che unisce record salvato + draft attivo
- il nuovo draft resta una **bozza nuova** (`editingPracticeId` e `generatedReference` vuoti prima della rigenerazione)
- dopo la duplicazione compare un **toast di successo**

## File modificati
- `js/practices/duplicate.js`
- `js/i18n.js`

## Test QA
1. aprire una pratica esistente
2. cliccare `Duplica pratica`
3. verificare apertura di una nuova bozza
4. verificare toast di conferma duplicazione
5. verificare che il pulsante principale sia `Salva pratica`
6. verificare che la pratica originale resti invariata
