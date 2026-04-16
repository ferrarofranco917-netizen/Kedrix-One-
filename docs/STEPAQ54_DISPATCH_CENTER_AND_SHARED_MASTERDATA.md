# STEPAQ54 — Dispatch center interno + rafforzamento master data condivisi

## Obiettivo
Micro-patch trasversale senza regressioni per: stampa/email interne, coda invii visibile, e convergenza progressiva dei moduli documentali e Quotazioni sulle stesse anagrafiche.

## Implementato davvero
- nuovo pannello **Centro invii automatici** dentro il modulo Documenti
- coda interna staging leggibile e modificabile
- stati operativi: accodato, pronto backend, inviato, annullato
- apertura modulo sorgente dalla coda
- valorizzazione destinatario da linked master data quando disponibile
- persistenza filtri e selezione del centro invii

## Requisiti messi ufficialmente in roadmap
- backend reale di outbound email documentale
- regole automatiche destinatari per cliente/modulo/documento
- binding forte con entityId condiviso su tutti i moduli
- stampa A4 enterprise standardizzata per tutti i documenti
- dashboard operativa invii con esiti, retry e schedulazioni

## Note QA
- verificare che **Salva e invia** non apra browser/client esterni
- verificare presenza della coda nel modulo Documenti
- verificare cambio stato e riapertura modulo sorgente
- verificare valorizzazione del destinatario da anagrafiche condivise quando presenti
