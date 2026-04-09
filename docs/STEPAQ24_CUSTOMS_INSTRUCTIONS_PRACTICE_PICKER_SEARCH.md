# STEPAQ24 — Customs Instructions / practice picker + search

## Obiettivo
Rendere scalabile l’apertura di una nuova istruzione doganale quando l’archivio pratiche cresce: il menu rapido mostra solo le ultime 30 pratiche recenti, mentre una nuova ricerca per numero pratica permette di aprire direttamente la pratica madre corretta.

## File coinvolti
- js/customs-instructions/customs-instructions-module.js
- js/i18n.js
- style.css

## Modifiche eseguite
- limitato il picker rapido alle ultime 30 pratiche recenti
- ordinamento pratiche per recency con fallback su sequenza riferimento/id
- aggiunta casella di ricerca per numero pratica / riferimento
- apertura diretta da ricerca con Enter o pulsante dedicato
- messaggio informativo se la ricerca trova più match e viene aperta la più recente
- copy IT/EN dedicata

## Note regressione
- nessuna modifica al data model
- nessuna modifica al save/update delle istruzioni
- nessuna modifica al workspace multi-maschera
