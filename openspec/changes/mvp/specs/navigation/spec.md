## ADDED Requirements

### Requirement: Un indirizzo per ogni vista
Il sistema SHALL dare a ogni vista un indirizzo proprio, nella forma con `#` perché l'app è caricata da file locali: `#/` per il mese, `#/transactions/new` per la nuova transazione, `#/transactions/{id}` per la modifica, `#/settings` per le impostazioni. Mese e tab scelti non fanno parte dell'indirizzo.

#### Scenario: Apertura di una vista
- **WHEN** l'utente apre una vista dalla schermata del mese
- **THEN** l'indirizzo cambia in quello della vista e la vista viene mostrata

#### Scenario: Transazione inesistente
- **WHEN** l'indirizzo punta a una transazione che non esiste, per esempio perché è stata eliminata
- **THEN** l'app mostra la schermata del mese

#### Scenario: Indirizzo sconosciuto
- **WHEN** l'indirizzo non corrisponde a nessuna vista
- **THEN** l'app mostra la schermata del mese

### Requirement: Tasto Indietro
Il sistema SHALL riportare alla schermata del mese con il tasto Indietro di Android o del browser, senza chiudere l'app da una vista secondaria.

#### Scenario: Indietro da una vista secondaria
- **WHEN** l'utente è nel form della transazione o nelle impostazioni e preme Indietro
- **THEN** l'app torna alla schermata del mese, con lo stesso mese e la stessa tab di prima

#### Scenario: Ritorno dopo Salva, Annulla o Elimina
- **WHEN** l'utente salva, annulla o elimina in una vista secondaria
- **THEN** l'app torna alla schermata del mese togliendo la vista dalla cronologia, così un Indietro successivo non la riapre
