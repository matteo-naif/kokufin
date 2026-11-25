## ADDED Requirements

### Requirement: Ripartizione per categoria
Il sistema SHALL mostrare, per il mese selezionato, un grafico a barre orizzontali con la quota di ogni categoria all'interno di un bucket, secondo le "Regole per i grafici" di `design.md`. Ogni riga riporta il nome della categoria, l'importo e la percentuale.

#### Scenario: Scelta del bucket
- **WHEN** l'utente seleziona un bucket
- **THEN** il grafico mostra solo le categorie di quel bucket con spese nel mese, ordinate dal valore più alto

#### Scenario: Barre proporzionali
- **WHEN** il grafico è mostrato
- **THEN** ogni barra parte da zero e la sua larghezza è la quota della categoria sul totale del bucket, con 100% pari alla larghezza completa

#### Scenario: Titolo con il messaggio
- **WHEN** il bucket ha spese nel mese
- **THEN** sopra il grafico compare la frase "In {bucket} pesa di più {categoria}: {percentuale}%" con i dati della categoria più alta

#### Scenario: Etichette dirette
- **WHEN** il grafico è mostrato
- **THEN** nome, importo e percentuale sono scritti su ogni riga, e non ci sono legenda, asse dei valori, griglia né tooltip

#### Scenario: Colore
- **WHEN** il grafico è mostrato
- **THEN** la prima barra è `#5C3A21` e tutte le altre `#B07C52`

#### Scenario: Nessuna spesa
- **WHEN** il bucket non ha spese nel mese
- **THEN** compare uno stato vuoto al posto del grafico

#### Scenario: Cambio mese
- **WHEN** il mese cambia
- **THEN** la statistica si aggiorna di conseguenza
