# STEPAQ58 · Quotazioni multiline rows

## Obiettivo
Permettere in Quotazioni l'inserimento di più righe economiche e operative per ogni tipologia di servizio (mare, aerea, terra, ferrovia, agenzia, magazzino e generica).

## Implementato davvero
- Route Quotazioni attiva con workspace reale.
- Tab Dettaglio con righe multiple aggiungibili e rimovibili.
- Ogni riga può rappresentare una voce diversa della quotazione.
- Tipologie riga operative: container 20/40 box, trasporto, operazione doganale, movimentazione magazzino, handling, assistenza, documentazione, surcharge e altre voci.
- Totali costi, ricavi e margine aggiornati sul set completo delle righe.
- Stampa cliente-facing costruita sulle righe della quotazione senza esporre costi interni.

## Nota architetturale
Questo step è cumulativo perché la repo staging allegata non conteneva ancora la foundation reale di Quotazioni; il delta include quindi i file necessari per far entrare davvero il modulo e il supporto multi-riga.
