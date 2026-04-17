# STEPAQ56 · Quotazioni profili distinti + stampa cliente + header logo aziendale

## Obiettivo
Micro-patch reale sul modulo Quotazioni e sui moduli documentali già presenti per correggere tre punti richiesti:

1. **Quotazioni non tutte uguali**
   - profili distinti per Generica / Mare / Aerea / Ferrovia / Terra / Agenzia / Magazzino
   - per **Mare**: aggiunti **Tipo di container** e **Dimensione container** come campi dedicati

2. **Stampa cliente Quotazioni**
   - in stampa non compaiono più colonne/copy interne di marginalità
   - il contenuto stampabile mostra il **prezzo offerto** cliente, non la dicitura **Ricavo**
   - mantenuto l'uso interno del tab Dettaglio con costi e prezzo cliente

3. **Header logo aziendale**
   - introdotto banner/header aziendale Kedrix con spazio reale per logo e nome azienda
   - applicato a Quotazioni e ai moduli documentali già creati:
     - Booking d'imbarco
     - Notifica arrivo merce
     - Notifica partenza merce
     - Rimessa documenti
     - Istruzioni di sdoganamento

## File toccati
- `index.html`
- `style.css`
- `sw.js`
- `js/ui/module-branding.js`
- `js/quotations/quotations-module.js`
- `js/booking-embarkation/booking-embarkation-module.js`
- `js/arrival-notice/arrival-notice-module.js`
- `js/departure-notice/departure-notice-module.js`
- `js/remittance-documents/remittance-documents-module.js`
- `js/customs-instructions/customs-instructions-module.js`

## Note di qualità
- patch progettata per essere **micro e non distruttiva**
- non dichiarare blindato lo step senza validazione visiva
- nessuna copia grafica SP1: solo uso strutturale del riferimento

## Prossimo step naturale
- recipient rules e print engine unificato A4 tra tutti i documenti
- binding anagrafiche più forte sulle quotazioni per profilo e modalità
