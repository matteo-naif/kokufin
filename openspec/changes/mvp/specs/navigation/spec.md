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

### Requirement: Pulsante Aggiungi in basso
Il sistema SHALL mostrare nella schermata del mese, e solo lì, un FAB esteso (Material Design 3) fisso in basso a destra, con l'icona "+" e l'etichetta "Aggiungi", che apre la nuova transazione. Sta in basso perché è l'azione più frequente e deve essere raggiungibile con il pollice. Quando l'utente scorre verso il basso oltre i primi 100 px il FAB si stringe al solo "+"; quando scorre verso l'alto o torna entro i primi 100 px torna esteso. Il FAB non si nasconde mai. Le impostazioni restano nell'intestazione, perché si usano di rado. Gli angoli del FAB hanno il raggio unico del design system (0,25rem), non i 16 dp di Material: tutti i componenti di Kokufin hanno la stessa forma.

#### Scenario: FAB esteso all'apertura
- **WHEN** l'utente apre la schermata del mese
- **THEN** in basso a destra c'è il FAB con "+" ed etichetta "Aggiungi", e toccarlo apre la nuova transazione

#### Scenario: Scroll verso il basso
- **WHEN** l'utente scorre verso il basso oltre i primi 100 px
- **THEN** il FAB mostra solo il "+", resta nella stessa posizione e continua ad aprire la nuova transazione

#### Scenario: Scroll verso l'alto
- **WHEN** il FAB è stretto e l'utente scorre verso l'alto
- **THEN** il FAB torna esteso

#### Scenario: Ultimo movimento visibile
- **WHEN** l'utente scorre fino in fondo all'elenco dei movimenti
- **THEN** l'ultimo movimento, importo compreso, non è coperto dal FAB

#### Scenario: Solo nella schermata del mese
- **WHEN** l'utente apre una vista secondaria
- **THEN** il FAB non compare

#### Scenario: FAB accessibile
- **WHEN** viene mostrato il FAB, esteso o stretto
- **THEN** ha sempre il nome accessibile "Aggiungi transazione", l'icona è nascosta allo screen reader, l'area di tocco è di almeno 56 × 56 px e, con la riduzione del movimento attiva, il cambio di forma avviene senza animazione

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
