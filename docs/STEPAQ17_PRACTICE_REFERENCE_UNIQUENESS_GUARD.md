# STEPAQ17 — Practice reference uniqueness guard

## Obiettivo
Impedire in modo strutturale che in Gestione pratiche compaiano due pratiche con lo stesso numero.

## File coinvolti
- js/utils.js
- js/practices/save-pipeline.js
- js/practices/duplicate.js

## Correzioni applicate
- aggiunta raccolta centralizzata dei numeri pratica già occupati da:
  - pratiche salvate
  - maschere workspace aperte
- aggiunto resolver che, in presenza di collisione, avanza automaticamente al primo numero libero
- duplicazione pratica resa compatibile con il guard di unicità già in apertura bozza
- salvataggio finale / bozza protetto contro collisioni del numero pratica
- allineamento della numbering rule cliente al numero realmente usato, così il progressivo successivo non torna indietro

## Esito atteso
- in Gestione pratiche non devono più comparire due pratiche con lo stesso numero
- una duplicazione da `AP-2026-4` deve aprire `AP-2026-5` se libero, oppure il primo progressivo disponibile
- dopo il salvataggio, la numerazione cliente resta coerente con l'ultimo numero realmente assegnato

## Test consigliati
1. Duplicare una pratica esistente e verificare che il numero salga al successivo disponibile.
2. Salvare la copia e verificare che la lista non contenga duplicati.
3. Duplicare di nuovo la stessa pratica e verificare che salga ancora di uno.
4. Provare con più maschere aperte per verificare che anche le bozze aperte vengano considerate come numeri già occupati.
