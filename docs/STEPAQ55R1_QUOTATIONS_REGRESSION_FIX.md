
# STEPAQ55R1 — Quotazioni regression fix

## Summary
Regression fixed on `quotations` route: the module was falling back to the generic module overview placeholder instead of opening a real Kedrix One workspace.

## Delivered
- real Quotazioni workspace
- list + filters + saved quotations
- multi-mask internal workspace
- tabs: Testata / Dettaglio / Documenti
- save / save and close / save and send / print without about:blank popup
- bridge from active practice to quotation draft
- compact enterprise packing with field sizing based on data type

## Notes
This patch is intentionally surgical and does not modify the Practices engine.
