## ADDED Requirements

### Requirement: Un indirizzo per ogni vista
Il sistema SHALL dare a ogni vista un indirizzo proprio, nella forma con `#` perché l'app è caricata da file locali: `#/` per il mese, `#/transactions/new` per la nuova transazione, `#/transactions/{id}` per la modifica, `#/settings` per l'indice delle impostazioni, `#/settings/preferences` per le preferenze, `#/settings/backup` per il backup. Mese e tab scelti non fanno parte dell'indirizzo.

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
Il sistema SHALL riportare alla vista da cui si è arrivati con il tasto Indietro di Android o del browser, senza chiudere l'app da una vista secondaria. Dal form della transazione e dall'indice delle impostazioni si torna al mese; da Preferenze e Backup si torna all'indice delle impostazioni.

#### Scenario: Indietro da una vista secondaria
- **WHEN** l'utente è nel form della transazione o nell'indice delle impostazioni e preme Indietro
- **THEN** l'app torna alla schermata del mese, con lo stesso mese e la stessa tab di prima

#### Scenario: Indietro da una sezione delle impostazioni
- **WHEN** l'utente è in Preferenze o in Backup e preme Indietro
- **THEN** l'app torna all'indice delle impostazioni

#### Scenario: Ritorno dopo Salva, Elimina o ripristino
- **WHEN** l'utente salva o elimina una transazione, salva le preferenze o conferma il ripristino di un backup
- **THEN** l'app torna alla schermata del mese, con lo stesso mese e la stessa tab di prima, togliendo dalla cronologia le viste aperte dopo il mese, così un Indietro successivo non le riapre

### Requirement: Freccia indietro
Il sistema SHALL mostrare nell'intestazione di ogni vista secondaria (form della transazione, indice delle impostazioni, Preferenze, Backup) un pulsante con la freccia indietro, accanto al titolo. Il pulsante fa come il tasto Indietro ed è l'unico modo visibile per uscire senza salvare: i form non hanno un pulsante Annulla.

#### Scenario: Tocco della freccia
- **WHEN** l'utente tocca la freccia indietro
- **THEN** l'app torna alla vista da cui era arrivato, come con il tasto Indietro, senza salvare le modifiche e togliendo la vista dalla cronologia

#### Scenario: Vista aperta direttamente dall'indirizzo
- **WHEN** la vista è stata aperta direttamente dal suo indirizzo e l'utente tocca la freccia
- **THEN** l'app mostra la vista madre (il mese, o l'indice delle impostazioni per Preferenze e Backup) senza uscire dall'app

#### Scenario: Freccia accessibile
- **WHEN** viene mostrata la freccia indietro
- **THEN** ha il nome accessibile "Indietro", l'icona è nascosta allo screen reader e l'area di tocco è di almeno 44 × 44 px
