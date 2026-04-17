# STEPAQ59 — Quotazioni profili con righe intelligenti

## Obiettivo
Introdurre preset rapidi coerenti con il profilo quotazione (mare, aerea, terra, ferrovia, agenzia, magazzino, generica) senza perdere la libertà multi-riga.

## Implementato
- barra preset nel tab Dettaglio
- bottone `Carica set profilo`
- preset rapidi dedicati per profilo attivo
- bundle base per ogni profilo
- idratazione leggera di codice/descrizione/unità quando si cambia tipologia riga
- nessuna regressione sulla compilazione manuale delle righe

## Esempi
- Mare: nolo box, dogana, handling, assistenza
- Aerea: nolo aereo, AWB/docs, dogana, assistenza
- Terra: linea strada, ritiro, assistenza
- Magazzino: inbound, giacenza, outbound

## Nota
La libertà multi-riga resta totale: i preset accelerano la compilazione ma non la vincolano.
