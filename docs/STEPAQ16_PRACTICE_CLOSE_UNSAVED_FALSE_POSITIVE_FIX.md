# STEPAQ16 — Practice close unsaved false positive fix

## Obiettivo
Eliminare il falso positivo in chiusura maschera dopo `Aggiorna pratica` / `Salva pratica` quando il contenuto corrente coincide già con l'ultimo stato salvato.

## Problema reale
La chiusura della maschera si basava solo sul flag `isDirty`. In alcuni flussi di aggiornamento la sessione restava marcata dirty anche dopo un salvataggio riuscito, quindi il popup di conferma compariva di nuovo pur senza modifiche reali.

## Correzione applicata
- introdotta una firma stabile del draft per ogni sessione workspace
- memorizzato l'ultimo snapshot salvato (`lastSavedDraftSignature`)
- la conferma in chiusura ora verifica le differenze reali tra draft corrente e ultimo draft salvato
- quando la sessione viene ricaricata da record salvato o marcata come salvata, la firma viene aggiornata e il dirty viene azzerato
- il badge `Da salvare` nelle maschere aperte non compare più in caso di falso positivo

## File coinvolti
- `js/app.js`
- `js/workspace/practice-workspace.js`

## Test consigliati
1. apri pratica esistente
2. modifica un campo
3. clicca `Aggiorna pratica`
4. chiudi subito la maschera dal tab `Maschere aperte`
5. atteso: nessun popup di modifiche non salvate

Test controllo:
1. apri pratica esistente
2. modifica un campo
3. salva
4. modifica di nuovo un altro campo
5. chiudi la maschera
6. atteso: il popup compare
