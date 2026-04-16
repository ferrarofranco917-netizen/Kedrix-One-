# STEPAQ53 — Print / Save&Send / Master Data Micro-Patch

## Stato step
Micro-patch correttiva a basso rischio eseguita sulla base rollbackata + delta AQ52.

## Problemi corretti
1. **Stampa**: rimossi i popup `about:blank` nei moduli documentali/quotazioni che aprivano finestre esterne vuote.
2. **Email**: rimossi i link `mailto:` che delegavano l'invio al browser/client esterno.
3. **Invio da Kedrix One**: introdotta una coda interna di dispatch locale staging con azione **Salva e invia**.
4. **Master data condivisi**: introdotto un primo bridge leggero per usare le stesse anagrafiche/directory come suggerimenti unificati nei moduli documentali e in Quotazioni.

## Implementazione reale
- nuovo helper `js/ui/document-operations.js`
  - anteprima di stampa interna in maschera Kedrix
  - coda dispatch locale `documentDispatchQueue`
- nuovo helper `js/master-data/module-field-links.js`
  - bridge leggero modulo → entità master data
  - datalist/suggerimenti da anagrafiche/directory condivise
- patch dei moduli:
  - Notifica arrivo merce
  - Notifica partenza merce
  - Rimessa documenti
  - Quotazioni

## Comportamento attuale dopo patch
- **Stampa** apre un'anteprima interna Kedrix invece di una finestra `about:blank`.
- **Salva e invia** salva il record e accoda l'invio dentro Kedrix One senza aprire client email esterni.
- i campi principali legati a soggetti/nodi usano suggerimenti provenienti dalle stesse anagrafiche/directory condivise.

## Limite dichiarato e roadmap ufficiale
Questa micro-patch **non** collega ancora tutti i moduli a un backend email reale.
In staging l'invio è gestito come **dispatch queue locale** per evitare regressioni e sostituire subito `mailto:`.

### Da mantenere ufficialmente in roadmap
1. **Document Print Engine unificato**
   - anteprima interna comune a tutti i documenti
   - stampa coerente senza finestre esterne
2. **Automatic Dispatch Engine**
   - pipeline reale backend per invio automatico documenti
   - scheduler/configurazioni per cliente/modulo/documento
   - log esiti, retry, tracciamento
3. **Master Data Binding forte**
   - non solo suggerimenti condivisi
   - persistenza `entityId`/snapshot relazionale nei documenti
   - convergenza completa con Anagrafiche/archivi unificati
4. **Recipient resolution rules**
   - destinatari automatici per cliente/documento
   - template mittente/oggetto/corpo per modulo
