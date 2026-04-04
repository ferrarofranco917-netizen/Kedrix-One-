# Kedrix One — Setup endpoint automatico P.IVA con Apps Script + VIES

## Obiettivo
Usare un endpoint web app Apps Script come proxy tra Kedrix One e il servizio VIES, così il frontend può fare autofill anagrafico da partita IVA senza dipendere da un form con captcha.

## File pronti
- `apps-script/Kedrix_VAT_Lookup_VIES.gs`
- `apps-script/appsscript.json`
- `js/config/integrations-endpoints.js`

## Passi minimi
1. Crea un progetto Google Apps Script di staging.
2. Incolla `Kedrix_VAT_Lookup_VIES.gs` e `appsscript.json`.
3. Pubblica come **Web app** con accesso pubblico di test.
4. Copia la URL `/exec`.
5. Incolla la URL in `js/config/integrations-endpoints.js` dentro `vatLookupUrl`.
6. Apri Kedrix One e verifica **Anagrafiche → Cliente → Partita IVA → Recupera dati**.

## Nota pratica
VIES restituisce soprattutto validità, denominazione e indirizzo. Campi come PEC, telefono, email o SDI non sono garantiti e restano eventualmente da completare manualmente o con sorgenti ulteriori.
