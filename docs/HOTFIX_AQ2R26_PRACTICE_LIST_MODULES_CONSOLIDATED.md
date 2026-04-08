# HOTFIX AQ2R26 — Consolidamento moduli practice-list

Questo pacchetto consolida tutti i moduli `js/search/practice-list-*` referenziati da `index.html` e dal service worker, così da eliminare i 404 dovuti alla catena di delta applicata in modo parziale.

Contenuto:
- `index.html` con cache-bust aggiornato
- `sw.js` con cache key aggiornata
- set completo dei moduli `practice-list-*` referenziati dalla pagina

Obiettivo:
- eliminare i 404 in console
- riallineare `Gestione pratiche` ai moduli analytics realmente disponibili
- evitare ulteriori inseguimenti file-per-file
