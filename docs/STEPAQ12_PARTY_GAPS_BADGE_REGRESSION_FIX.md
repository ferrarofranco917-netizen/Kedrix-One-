# STEPAQ12 — Party gaps badge regression fix

## Obiettivo
Ripristinare il contenimento del badge `No confronto` nel pannello `Gap anagrafici soggetti` dopo la regressione introdotta nei delta successivi.

## File coinvolti
- `style.css`

## Modifica applicata
- ripristinate le regole CSS dedicate a `.practice-list-gap-kpis`
- contenimento del badge dentro il terzo KPI
- wrapping corretto del testo `No confronto`
- nessun impatto sulla logica dati

## Test QA
1. Aprire `Pratiche > Gestione pratiche`
2. Verificare `Gap anagrafici soggetti`
3. Controllare le card con `No confronto`
4. Verificare desktop e resize tablet
5. Verificare che il badge resti sempre dentro il box KPI

## Rischio regressione
Basso. Step solo CSS, mirato al layout del pannello gap soggetti.
