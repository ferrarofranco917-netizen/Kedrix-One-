# STEPAQ57 — Quotazioni mare: tipo imballo + predisposizione CRM follow-up

## Obiettivo
Rendere il profilo Mare più aderente all’operatività reale introducendo il campo **Tipo imballo** (con opzione Container e altri imballi) accanto ai campi container, e predisporre il collegamento tra **Quotazioni** e **CRM** per follow-up automatici post-invio.

## Implementato davvero
- Aggiunto in Quotazioni/Mare il campo **Tipo imballo** con opzioni operative tra cui **Container**.
- Estesa la stampa cliente-facing per riportare anche il tipo imballo nel profilo Mare.
- Introdotto in testata il blocco **CRM e follow-up feedback** con:
  - attivazione/disattivazione follow-up
  - giorni di attesa
  - template feedback selezionabile
- In `Salva e invia`, oltre alla coda dispatch della quotazione, viene schedulata anche una voce in `quotationFeedbackFollowUps` se il follow-up è attivo e il template è definito.
- Inserita configurazione aziendale `companyConfig.crmAutomation.quotationFeedback` con template standard iniziale.

## Roadmap ufficiale consolidata
- Collegamento CRM reale: la quotazione inviata dovrà aggiornare il CRM del cliente.
- Scheduler outbound reale: dopo N giorni, invio automatico email di richiesta feedback.
- Template feedback completamente personalizzabili dall’utente.
- Binding destinatari e contatti al master data condiviso / entityId.
- Storico follow-up visibile nel CRM cliente.
