# STEPAQ57 — Print & Save-and-Send coverage micro-patch

## Obiettivo
Eliminare l'apertura di `about:blank` in stampa e uniformare i moduli documentali reali presenti in repo con il pulsante **Salva e invia** interno a Kedrix One.

## Moduli coperti davvero in questa base repo
- Booking d’imbarco
- Istruzioni di sdoganamento
- Notifica arrivo merce
- Notifica partenza merce
- Rimessa documenti

## Implementato
- introdotto helper condiviso `js/ui/document-operations.js`
- stampa tramite iframe interno nascosto, senza popup/finestra `about:blank`
- coda interna `documentDispatchQueue` nello stato applicativo
- sostituito `Invia email` / `mailto:` con **Salva e invia** sui moduli coperti
- su Booking d’imbarco e Istruzioni di sdoganamento aggiunti anche i controlli mancanti di stampa e dispatch

## Non implementato in questo step
- Gestione pratiche: resta fuori dal perimetro save-and-send; in roadmap ufficiale la stampa pratica con opzioni **A3 copertina** e **A4**
- backend reale di outbound email: la coda è interna/staging, non invia ancora all'esterno

## Rischio regressione
Basso, perché il patch interviene solo sugli action handler documentali e sul layer condiviso di print/dispatch.
