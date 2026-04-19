# STEPAQ63 — Anagrafiche / Fornitori / Filtri operativi

Base: AQ62 validata dall'utente.

## Obiettivo
Aggiungere nel sottomodulo Fornitori un primo livello di ricerca operativa reale, senza introdurre ancora listini o nuove strutture dati.

## Delta applicato
- ricerca estesa anche a referente, servizi/modalità, aree/tratte, condizioni pagamento e note fornitore
- toolbar filtri operativi nel sottomodulo Fornitori
- toggle per:
  - con servizi / modalità
  - con aree / tratte
  - con condizioni pagamento
  - solo attivi
- azione di reset filtri
- tag sintetici dentro la lista fornitore per leggere subito profilo operativo

## File toccati
- index.html
- style.css
- sw.js
- js/i18n.js
- js/master-data/quick-add.js

## QA minimo
1. Aprire Anagrafiche > Fornitori
2. Cercare per referente o per servizio (es. dogana, mare, FTL)
3. Attivare i filtri rapidi uno per uno
4. Verificare aggiornamento conteggi e lista
5. Verificare che il reset ripristini l'elenco completo
6. Controllare che le altre famiglie restino inalterate
