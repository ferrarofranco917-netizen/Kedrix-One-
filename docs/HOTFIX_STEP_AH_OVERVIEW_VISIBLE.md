# HOTFIX STEP AH — Overview foundation visibile nel modulo Anagrafiche

## Problema osservato
In alcuni avvii la panoramica foundation del modulo Anagrafiche non compariva, pur essendo presente il file dedicato.

## Causa tecnica probabile
Il render leggeva `window.KedrixOneMasterDataOverview` in modo statico all'inizializzazione del modulo. In presenza di bootstrap/cache non perfettamente riallineati, il riferimento poteva risultare non disponibile e la panoramica restava vuota.

## Fix applicato
- aggancio lazy del modulo overview al momento del render
- fallback visibile in caso di bootstrap non ancora inizializzato
- cache busting aggiornato

## Aree protette
- quick add
- ritorno alla pratica
- modulo Anagrafiche
- i18n
