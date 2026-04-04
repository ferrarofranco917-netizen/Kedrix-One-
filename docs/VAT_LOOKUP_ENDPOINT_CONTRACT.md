# Kedrix One — VAT Lookup Endpoint Contract

## Metodo supportato dal frontend
GET con query string:
- `country` (es. `IT`)
- `vat` (es. `06363391001`)
- `entity` (es. `client`)

Esempio:
`GET /vat-lookup?country=IT&vat=06363391001&entity=client`

## Header opzionale
- API key configurabile da UI, per default `x-api-key`

## Risposta attesa
```json
{
  "ok": true,
  "source": "InfoCamere API",
  "status": "official-data",
  "data": {
    "name": "Azienda Demo Srl",
    "shortName": "Azienda Demo",
    "vatNumber": "06363391001",
    "taxCode": "06363391001",
    "address": "Via Roma 1",
    "zipCode": "10121",
    "city": "Torino",
    "province": "TO",
    "country": "IT",
    "pec": "aziendademo@pec.it",
    "email": "info@aziendademo.it",
    "phone": "+39 011000000",
    "sdiCode": "ABC1234"
  }
}
```

## Campi riconosciuti dal frontend
Il frontend accetta anche alias frequenti come:
- `companyName`, `businessName`, `denominazione`, `ragioneSociale`
- `partitaIva`, `piva`, `vat`, `vat_id`
- `codiceFiscale`, `cf`
- `indirizzo`, `cap`, `comune`, `provincia`, `nazione`
- `pec`, `domicilioDigitale`

## Errori consigliati
- `404` se partita IVA non trovata
- `401/403` per accesso negato
- `500` per errore backend


## Apps Script / response 200 con `ok:false`
Per compatibilità con Web App Google Apps Script, il frontend ora accetta anche risposte HTTP 200 con payload del tipo:
```json
{
  "ok": false,
  "status": "not-found",
  "message": "VAT number not valid in VIES."
}
```
In questo caso Kedrix mappa comunque correttamente lo stato lookup (`not-found`, `invalid-vat`, `lookup-error`).
