# STEPAQ60 HOTFIX — Anagrafiche no regression

## Problema corretto

Nel delta precedente c'erano due criticità:

1. `supplierPriceLists` era stato seedato nel nodo sbagliato dello state, quindi i listini non entravano davvero nel motore `companyConfig.masterDataRecords`.
2. erano stati pre-caricati anche `suppliers` strutturati, con effetto collaterale di coprire/sostituire le famiglie già operative derivate dalle directory.

## Correzione applicata

- rimossi i seed strutturati di `suppliers`
- mantenuti solo i seed di `supplierPriceLists`
- spostati nel nodo corretto: `companyConfig.masterDataRecords.supplierPriceLists`
- reso il seed delle famiglie strutturate **additivo** in `entity-records.js`, così eventuali record già presenti non eliminano più le voci operative già disponibili dalle directory

## Esito atteso

- **Fornitori** continua a mostrare anche le voci già operative (MSC, Maersk, Qatar Airways Cargo, Broker Doganale Piemonte, Autotrasporti Nord Ovest)
- **Listini fornitore** compare come famiglia reale
- i listini demo risultano visibili e collegabili per nome ai fornitori esistenti
- nessuna regressione sulle altre famiglie strutturate

## File toccati

- `data.js`
- `js/master-data/entity-records.js`
