# STEPAQ58 — Print client logo space + internal notes exclusion

## Scope
Micro-patch trasversale sui moduli documentali per:
- riservare nello stampato lo spazio per il logo cliente
- mostrare il logo cliente se disponibile dal record/anagrafica
- escludere le note interne/testi interni dagli stampati cliente-facing

## Modules touched
- Booking d’imbarco
- Notifica arrivo merce
- Notifica partenza merce
- Rimessa documenti
- Istruzioni di sdoganamento

## Notes
La patch non introduce backend email né nuove route. Mantiene il print interno Kedrix e prepara la futura applicazione del logo cliente proveniente dalle anagrafiche condivise.
