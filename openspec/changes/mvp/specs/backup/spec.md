## ADDED Requirements

### Requirement: Backup e ripristino
Il sistema SHALL esportare tutti i dati in un file JSON e ripristinarli da un file JSON, dalla pagina Backup delle impostazioni.

#### Scenario: Esportazione
- **WHEN** l'utente tocca "Esporta"
- **THEN** il telefono propone di salvare il file con transazioni e impostazioni in una cartella a scelta, con il nome `kokufin-backup-<data>.json` già compilato

#### Scenario: Esportazione nell'app Android
- **WHEN** nell'app Android l'utente sceglie la cartella e conferma
- **THEN** il file è salvato nella cartella scelta e compare il toast "Backup salvato"
- **AND** se l'utente chiude la finestra senza salvare, non compare nessun messaggio

#### Scenario: Ripristino
- **WHEN** l'utente sceglie un file di backup valido e conferma
- **THEN** i dati attuali sono sostituiti da quelli del file
- **AND** l'app torna alla schermata del mese e mostra il toast "Dati ripristinati"

#### Scenario: File non valido
- **WHEN** il file non è un backup valido
- **THEN** i dati attuali restano invariati e compare un errore
