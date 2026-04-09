# STEPAQ6 — Practice freeze save confirmation

## Obiettivo
Blindare gli ultimi punti del core Pratiche che impattano la fiducia sul salvataggio e la chiusura del workspace.

## Fix inclusi
- conferma interna persistente del salvataggio nella maschera pratica
- distinzione visiva tra bozza salvata e pratica salvata
- ritorno automatico a Gestione pratiche quando si chiude l’ultima maschera workspace
- mantenimento del focus operativo sulla pratica attiva quando restano altre maschere aperte

## File delta
- `js/app.js`
- `js/templates.js`

## QA prioritario
1. nuova pratica -> salva -> verifica banner interno di conferma
2. pratica esistente -> aggiorna -> verifica banner con riferimento e timestamp
3. salvataggio bozza con campi mancanti -> verifica banner “bozza salvata”
4. chiudi ultima maschera -> ritorno a `Pratiche / Gestione pratiche`
5. chiudi una maschera lasciandone altre aperte -> focus sulla maschera rimasta attiva

## Rischio regressione
Basso. Da verificare comunque:
- switch maschere con record già salvati
- apertura pratica da Documenti
- save finale e save bozza nello stesso browser state
