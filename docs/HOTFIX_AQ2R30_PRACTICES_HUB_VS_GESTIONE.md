# HOTFIX AQ2R30 — Pratiche hub separato da Gestione pratiche

## Obiettivo
Separare davvero i tre livelli: 
- `Pratiche` = hub padre
- `Pratiche / Gestione pratiche` = solo elenco, ricerca, filtri e pulsante nuova pratica
- `Pratiche / Workspace pratica` = maschera interna dedicata alla lavorazione

## Fix applicati
- nuovo route tecnico nascosto `practices/workspace`
- `Pratiche` non renderizza più il workspace al posto dell’hub
- `Gestione pratiche` non renderizza più la maschera pratica
- apertura nuova pratica e apertura pratica esistente instradate verso `practices/workspace`
- fallback automatico a `Gestione pratiche` se il workspace non ha maschere aperte
