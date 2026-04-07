# HOTFIX AQ2R11 — Save pratica come bozza anche se incompleta

Problema reale osservato nel video: il click su Salva pratica bloccava la registrazione se mancava anche un solo obbligatorio.

Correzione applicata:
- flush del draft attivo prima della validazione
- se esistono tipo pratica, cliente e data, la pratica viene comunque registrata come bozza incompleta
- quando tutti gli obbligatori sono compilati, il salvataggio resta pieno/normale
