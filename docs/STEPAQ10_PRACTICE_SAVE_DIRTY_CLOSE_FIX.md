# STEP AQ10 — Practice save dirty close fix

## Obiettivo
Correggere il falso positivo di "modifiche non salvate" dopo un salvataggio riuscito della pratica.

## Problema confermato
Dal video utente si vede che:
1. la pratica viene aggiornata con successo;
2. subito dopo, alla chiusura della maschera dal tab, compare ancora il dialogo "Chiudere la maschera con modifiche non salvate?".

Questo indica un disallineamento tra:
- flag `isDirty` della sessione workspace;
- stato reale del draft dopo il save.

## Fix applicato
### 1. Firma stabile del draft salvato
Nel workspace pratica ogni sessione ora mantiene una `savedDraftSignature` costruita sul contenuto reale del draft.

### 2. Verifica reale prima del prompt di chiusura
Il prompt di chiusura non si basa più solo sul flag `isDirty`.
Ora verifica se il draft corrente è davvero diverso dall'ultima firma salvata.

### 3. Mark-as-saved robusto post-save
Dopo save draft/final/update, la sessione attiva viene marcata come salvata aggiornando:
- `isDirty = false`
- `savedDraftSignature = firma corrente del draft`

### 4. Sync sessioni ricaricate
Quando una pratica viene riaperta o sincronizzata nel workspace, la firma salvata viene riallineata al draft ricostruito.

## File modificati
- `js/app.js`
- `js/workspace/practice-workspace.js`

## Esito atteso
Dopo `Aggiorna pratica` o `Salva pratica`, chiudendo subito la maschera dal tab:
- **non** deve apparire il dialogo di chiusura con modifiche non salvate,
- **a meno che** ci siano state modifiche successive reali non ancora salvate.
