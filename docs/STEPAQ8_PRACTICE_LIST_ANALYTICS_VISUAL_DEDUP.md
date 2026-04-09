# STEPAQ8 — Practice list analytics visual dedup

## Obiettivo
Ridurre la ridondanza visiva nei pannelli analytics di **Gestione pratiche** senza cambiare la logica dei dati e senza toccare la shell Kedrix.

## Problemi chiusi
- card analytics troppo verbose e ripetitive
- helper duplicati tra titolo pannello e sottotitoli delle card
- lettura verticale pesante nei blocchi **Gap anagrafici soggetti**, **Coppie soggetti ricorrenti** e **Profili doganali ricorrenti**
- rischio di overflow / compressione nei KPI compatti del blocco gap soggetti

## Modifiche applicate
- introdotta una variante visiva compatta per i pannelli analytics di Gestione pratiche
- esempi del blocco **Gap anagrafici soggetti** resi più compatti: riferimento + stato in testata, cliente/tipologia in una sola riga meta
- righe delle card **Coppie soggetti ricorrenti** e **Profili doganali ricorrenti** convertite in layout a pillole metriche (Attivo / Confronto / Delta)
- sottotitoli delle card nascosti nella variante compatta per eliminare ridondanza con il sottotitolo del pannello padre
- KPI grid del blocco gap soggetti resa stabile e responsive

## File toccati
- `style.css`
- `js/search/practice-list-party-gaps.js`
- `js/search/practice-list-party-pairs.js`
- `js/search/practice-list-customs-profiles.js`

## Impatto atteso
- lettura più veloce di Gestione pratiche
- meno ripetizione testuale
- migliore tenuta dei badge e dei chip su desktop e resize tablet
- nessuna modifica ai conteggi o ai filtri analytics

## Rischi regressione
- basso
- verificare solo resa responsive e ordine visuale dei pannelli analytics
