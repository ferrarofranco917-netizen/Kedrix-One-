# STEPAQ11 — Gestione pratiche collapse pannelli secondari + fix Duplica pratica

## Obiettivo
Chiudere tre bug reali emersi in test:
1. `Coppie soggetti ricorrenti` non parte chiuso
2. `Profili doganali ricorrenti` non parte chiuso
3. `Duplica pratica` non apre in modo affidabile una nuova bozza da una pratica esistente

## File coinvolti
- `style.css`
- `js/app.js`
- `js/search/practice-list-party-pairs.js`
- `js/search/practice-list-customs-profiles.js`
- `js/practices/duplicate.js`

## Modifiche applicate
### Gestione pratiche
- i pannelli secondari `Coppie soggetti ricorrenti` e `Profili doganali ricorrenti` sono ora renderizzati come blocchi collassabili nativi e partono chiusi di default
- il contenuto interno resta invariato, ma la vista iniziale è più pulita
- il limite righe per card è fissato a 4 in entrambi i pannelli, coerente con la dedup promessa

### Duplica pratica
- il click del pulsante viene intercettato in modo esplicito senza propagazione residua
- la duplicazione usa prima di tutto la pratica attiva realmente aperta, non solo il record storico in lista
- se hai modifiche già visibili nella pratica aperta, la copia nasce da quel contenuto corrente e non da uno stato vecchio
- resta una nuova bozza: `editingPracticeId` vuoto, riferimento rigenerabile, documenti operativi azzerati come da logica duplicazione

## Test QA consigliati
1. `Pratiche > Gestione pratiche`
2. verificare che `Gap anagrafici soggetti` resti visibile
3. verificare che `Coppie soggetti ricorrenti` parta chiuso
4. verificare che `Profili doganali ricorrenti` parta chiuso
5. aprire una pratica esistente nel workspace
6. cliccare `Duplica pratica`
7. verificare che si apra una nuova bozza
8. verificare che il pulsante submit diventi `Salva pratica` e non resti `Aggiorna pratica`
9. verificare che la copia non mantenga riferimenti operativi sensibili come booking/container/polizze già presenti

## Rischio regressione
Basso.
Punti da controllare:
- resa responsive dei summary collassabili
- duplicazione di pratica con campi dinamici compilati ma non ancora salvati
- multi-maschera con pratica originale e copia aperte insieme
