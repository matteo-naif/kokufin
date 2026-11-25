## ADDED Requirements

### Requirement: Registrare una transazione
Il sistema SHALL permettere di registrare entrate e spese con importo, categoria, data e nota facoltativa, in al massimo tre tocchi dalla schermata del mese.

#### Scenario: Spesa con i valori di default
- **WHEN** l'utente tocca "+", inserisce l'importo e sceglie una categoria
- **THEN** la transazione è salvata con la data di oggi e compare nel mese corrente

#### Scenario: Importo non valido
- **WHEN** l'importo è vuoto, zero o negativo
- **THEN** il salvataggio è bloccato e il campo mostra un messaggio di errore

#### Scenario: Entrata
- **WHEN** l'utente imposta il tipo su "Entrata"
- **THEN** l'elenco delle categorie mostra solo quelle delle entrate

### Requirement: Modificare ed eliminare
Il sistema SHALL permettere di modificare ed eliminare una transazione dall'elenco del mese.

#### Scenario: Eliminazione
- **WHEN** l'utente elimina una transazione e conferma
- **THEN** la transazione scompare e i totali del mese si aggiornano
