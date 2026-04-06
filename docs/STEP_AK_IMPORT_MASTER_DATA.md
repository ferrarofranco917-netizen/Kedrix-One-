# STEP AK — Import Anagrafiche

## Obiettivo
Sbloccare il commit controllato delle anagrafiche strutturate principali direttamente dal pannello Import foundation del modulo Anagrafiche.

## Scope incluso
- commit attivo per: Clienti, Importatori, Destinatari, Mittenti, Fornitori, Vettori, Compagnie marittime, Compagnie aeree
- preview commit con conteggi: nuove schede, duplicati già presenti, righe con warning, righe bloccate
- salvataggio reale nelle anagrafiche strutturate con aggiornamento directory collegate
- skip automatico di errori e duplicati già presenti
- traduzioni UI allineate anche in inglese

## Scope volutamente escluso
- update massivo di schede esistenti
- commit di archivi logistici/directory semplici
- import pratiche
- import allegati/documenti

## QA minimo
1. Aprire Anagrafiche
2. Caricare CSV su una famiglia strutturata (es. Fornitori)
3. Verificare mapping, preview e piano commit
4. Lanciare il commit
5. Verificare toast, riepilogo ultimo commit e nuove schede in elenco
6. Ripetere con righe duplicate
7. Controllare traduzioni EN nel pannello import
