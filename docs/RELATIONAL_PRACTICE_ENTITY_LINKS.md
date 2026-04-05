# Kedrix One — STEP T

## Obiettivo
Blindare il collegamento tra Pratica e Anagrafiche principali usando **entityId + snapshot stabile**.

## Cosa introduce
- `draft.linkedEntities` nella bozza pratica
- `practice.linkedEntities` nel record salvato
- sync automatico dei campi relazionali strutturati:
  - Cliente
  - Importatore
  - Destinatario
  - Mittente
  - Vettore
- persistenza dello snapshot leggibile anche se il record anagrafico cambia in seguito
- ricerca arricchita sui dati snapshot (display, P.IVA, codice, città)

## Effetto pratico
La pratica non dipende più solo dal testo visibile nel campo: conserva anche il collegamento all’entità e una fotografia minima del dato collegato.
