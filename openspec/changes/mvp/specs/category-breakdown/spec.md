## ADDED Requirements

### Requirement: Ripartizione per categoria
Il sistema SHALL mostrare, per il mese selezionato, un'unica vista con le spese per categoria in barre orizzontali, divisa in due sezioni con un titolo ciascuna: prima Essenziali, poi Piacere, sempre in quest'ordine. Le regole sono le "Regole per i grafici" di `design.md`. La vista ha una sola scala: il 100% sono le spese totali del mese (Essenziali più Piacere), così le barre sono confrontabili anche tra una sezione e l'altra. Ogni riga riporta il nome della categoria e l'importo, senza percentuali: la proporzione la dà la lunghezza della barra.

#### Scenario: Due sezioni in una vista
- **WHEN** il mese ha spese
- **THEN** la vista mostra la sezione Essenziali e poi la sezione Piacere, ognuna con le proprie categorie con spese nel mese, ordinate dal valore più alto, senza controlli per scegliere il bucket

#### Scenario: Titolo della sezione
- **WHEN** viene mostrata una sezione
- **THEN** il titolo è il nome del bucket, e accanto c'è il totale speso nel bucket in grassetto, per distinguerlo dagli importi delle categorie, per esempio "Essenziali" con "820,00 €". Sotto la riga del titolo c'è una linea sottile che collega nome e totale

#### Scenario: Barre proporzionali
- **WHEN** il grafico è mostrato
- **THEN** ogni barra parte da zero e la sua larghezza è la quota della categoria sulle spese totali del mese, con 100% pari alla larghezza completa

#### Scenario: Etichette dirette
- **WHEN** il grafico è mostrato
- **THEN** nome e importo sono scritti su ogni riga, e non ci sono percentuali, legenda, asse dei valori, griglia né tooltip

#### Scenario: Colore
- **WHEN** il grafico è mostrato
- **THEN** la barra della categoria più alta del mese è `#5C3A21` e tutte le altre `#B07C52`

#### Scenario: Sezione senza spese
- **WHEN** un solo bucket non ha spese nel mese
- **THEN** la sua sezione resta, con il titolo e la scritta "Nessuna spesa." al posto delle barre

#### Scenario: Nessuna spesa nel mese
- **WHEN** il mese non ha spese
- **THEN** al posto delle sezioni compare un solo stato vuoto

#### Scenario: Cambio mese
- **WHEN** il mese cambia
- **THEN** la statistica si aggiorna di conseguenza
