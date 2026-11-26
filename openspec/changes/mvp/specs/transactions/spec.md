## ADDED Requirements

### Requirement: Registrare una transazione
Il sistema SHALL permettere di registrare entrate e spese con importo, categoria, data e nota facoltativa, in al massimo tre tocchi dalla schermata del mese.

#### Scenario: Spesa con i valori di default
- **WHEN** l'utente tocca "+", inserisce l'importo e sceglie una categoria
- **THEN** la transazione è salvata con la data di oggi e compare nel mese corrente

#### Scenario: Conferma del salvataggio
- **WHEN** l'utente salva una transazione nuova o modificata
- **THEN** l'app torna alla schermata del mese e mostra il toast di successo "Transazione salvata", annunciato dallo screen reader

#### Scenario: Importo non valido
- **WHEN** l'importo è vuoto, zero o negativo
- **THEN** il salvataggio è bloccato e il campo mostra un messaggio di errore

#### Scenario: Entrata
- **WHEN** l'utente imposta il tipo su "Entrata"
- **THEN** l'elenco delle categorie mostra solo quelle delle entrate

#### Scenario: Scelta del tipo
- **WHEN** l'utente apre il form di una transazione
- **THEN** il tipo si sceglie con un segmented button a tutta larghezza con i segmenti "Spesa" ed "Entrata", selezionabili con un tocco
- **AND** il segmento scelto ha sfondo primario e un'icona di spunta, come i chip delle categorie

#### Scenario: Scelta della categoria
- **WHEN** l'utente apre il form di una nuova transazione con tipo "Spesa"
- **THEN** le categorie sono chip su più righe, divise in due gruppi con il nome del bucket ("Spese essenziali", "Spese di piacere"), tutte visibili e selezionabili con un tocco
- **AND** il chip scelto ha sfondo primario e un'icona di spunta, così la scelta non dipende solo dal colore

### Requirement: Modificare ed eliminare
Il sistema SHALL permettere di modificare ed eliminare una transazione dall'elenco del mese.

#### Scenario: Eliminazione
- **WHEN** l'utente elimina una transazione e conferma
- **THEN** la transazione scompare e i totali del mese si aggiornano
- **AND** compare il toast di successo "Transazione eliminata", annunciato dallo screen reader
