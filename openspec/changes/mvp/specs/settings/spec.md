## ADDED Requirements

### Requirement: Indice delle impostazioni
Il sistema SHALL mostrare la schermata Impostazioni come un indice di sezioni, come le impostazioni di Android: ogni voce è un link a tutta riga con il nome della sezione e una riga di descrizione, e apre la pagina della sezione. Le sezioni sono "Preferenze" (percentuali ideali e suoni) e "Backup" (esporta e importa i dati).

#### Scenario: Apertura di una sezione
- **WHEN** l'utente tocca una voce dell'indice
- **THEN** si apre la pagina della sezione, con il nome della sezione come titolo

#### Scenario: Voci accessibili
- **WHEN** viene mostrato l'indice
- **THEN** ogni voce è un link con nome e descrizione letti dallo screen reader e l'area di tocco è alta almeno 44 px

### Requirement: Percentuali ideali
Il sistema SHALL permettere di modificare le percentuali ideali dei tre bucket nella pagina Preferenze.

#### Scenario: Somma diversa da 100
- **WHEN** la somma delle tre percentuali non è 100
- **THEN** il salvataggio è bloccato e viene mostrato il totale corrente
- **AND** l'errore resta scritto accanto ai campi, non in un toast

#### Scenario: Salvataggio riuscito
- **WHEN** le percentuali sono valide e l'utente salva
- **THEN** l'app torna alla schermata del mese e mostra il toast di successo "Impostazioni salvate", annunciato dallo screen reader
