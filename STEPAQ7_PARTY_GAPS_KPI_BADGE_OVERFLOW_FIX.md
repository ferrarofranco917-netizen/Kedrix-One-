# STEPAQ7 — Party gaps KPI badge overflow fix

## Obiettivo
Correggere il badge `No confronto` che usciva dai margini nel blocco `Gap anagrafici soggetti` dentro Gestione pratiche.

## File modificati
- `js/search/practice-list-party-gaps.js`
- `style.css`

## Modifica applicata
- aggiunta classe dedicata `practice-list-gap-kpis` alla griglia KPI del modulo `Gap anagrafici soggetti`
- fissata la griglia a 3 colonne reali invece di ereditare il layout KPI generico a 4 colonne
- reso il badge dentro `Delta` contenuto nei margini anche quando compare `No confronto`
- abilitato wrapping interno controllato del badge senza uscita dal box

## Esito atteso
- il chip `No confronto` resta sempre dentro il riquadro KPI
- nessuna uscita laterale dai margini
- nessun impatto sugli altri KPI globali del progetto
