# STEPAQ66 — Anagrafiche > Fornitori stradali > Listino chilometrico foundation

## Obiettivo
Introdurre nel sottomodulo reale **Anagrafiche > Fornitori** una foundation dedicata ai **vettori stradali**, con:

- campi anagrafici specifici per tariffazione stradale
- righe manuali origine/destinazione/km/tariffa
- import CSV / Excel di tratte chilometriche
- distanziere interno foundation agganciato alla matrice del vettore

## Ambito del rilascio
Questo step NON collega ancora un provider esterno di routing truck-specific.

La release AQ66 abilita invece:

1. **struttura dati interna** per tratte/km fornitore
2. **import foundation** da file con intestazioni mappate
3. **ricerca interna** della miglior corrispondenza tratta per il vettore corrente

## File toccati
- `index.html`
- `style.css`
- `sw.js`
- `js/i18n.js`
- `js/master-data/entity-records.js`
- `js/master-data/quick-add.js`
- `js/master-data/supplier-road-rates.js` (nuovo)

## Funzioni introdotte
### Scheda Fornitore
Nuovi campi:
- tariffazione stradale
- fonte km / distanze
- profili mezzi coperti

### Foundation vettori stradali
Nuovo pannello con:
- storico tratte/km
- editor singola tratta
- import CSV/Excel
- distanziere interno con match esatto / inverso / parziale

## Regola operativa
Il blocco si attiva solo per fornitori classificati come:
- `road-carrier`
oppure con ambito:
- `road`

## QA minimo
1. Aprire `Anagrafiche > Fornitori`
2. Selezionare un fornitore stradale salvato
3. Verificare i nuovi campi stradali in scheda
4. Salvare una riga manuale origine/destinazione/km/tariffa
5. Importare un CSV o un Excel con intestazioni standard
6. Verificare lo storico righe importate
7. Usare il distanziere interno e verificare il match con la matrice caricata

## Step successivo consigliato
AQ67:
- matching commerciale su Quotazioni
- sorgente km contrattuale vs km operativo
- preparazione integrazione futura con distanziere truck-specific esterno
