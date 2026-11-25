## ADDED Requirements

### Requirement: Percentuali ideali
Il sistema SHALL permettere di modificare le percentuali ideali dei tre bucket.

#### Scenario: Somma diversa da 100
- **WHEN** la somma delle tre percentuali non è 100
- **THEN** il salvataggio è bloccato e viene mostrato il totale corrente
- **AND** l'errore resta scritto accanto ai campi, non in un toast

#### Scenario: Salvataggio riuscito
- **WHEN** le percentuali sono valide e l'utente salva
- **THEN** l'app torna alla schermata del mese e mostra il toast di successo "Impostazioni salvate", annunciato dallo screen reader
