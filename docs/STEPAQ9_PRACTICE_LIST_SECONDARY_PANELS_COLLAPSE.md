# STEP AQ9 — Gestione pratiche — pannelli secondari comprimibili

## Obiettivo
Ridurre la ridondanza visiva di **Gestione pratiche** senza toccare la logica dati e senza impattare i pannelli davvero prioritari per la lettura della pratica.

## Cosa è stato modificato
- i pannelli analytics **Coppie soggetti ricorrenti** e **Profili doganali ricorrenti** sono ora renderizzati come pannelli **collassabili**
- i due pannelli partono **chiusi di default** per lasciare più pulita la vista principale
- le righe interne usano una lettura più compatta con chip inline per:
  - Attivo
  - Confronto
  - Delta / No confronto
- ridotto il numero massimo di righe mostrate per card da **5 a 4** per abbassare la densità visiva
- nessuna modifica al pannello **Gap anagrafici soggetti**, che resta prioritario e sempre visibile

## File coinvolti
- `style.css`
- `js/search/practice-list-party-pairs.js`
- `js/search/practice-list-customs-profiles.js`

## Effetto atteso
- Gestione pratiche più leggibile appena aperta
- meno rumore visivo prima della tabella elenco
- i pannelli secondari restano disponibili ma non invadono il flusso principale

## Test consigliati
1. aprire `Pratiche > Gestione pratiche`
2. verificare che:
   - `Gap anagrafici soggetti` resti aperto
   - `Coppie soggetti ricorrenti` parta chiuso
   - `Profili doganali ricorrenti` parta chiuso
3. aprire i due pannelli secondari e verificare che le card interne:
   - restino dentro i margini
   - mostrino i chip inline senza overflow
4. verificare resize desktop/tablet
5. verificare che i conteggi dati non siano cambiati

## Rischi regressione
Bassi. Il rischio principale è solo di layout/responsive sui pannelli collassabili.
