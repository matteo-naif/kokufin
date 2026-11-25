## ADDED Requirements

### Requirement: Suoni dei pulsanti
Il sistema SHALL riprodurre un suono breve al tocco dei pulsanti di azione ("+" Aggiungi transazione, Salva, Elimina nella conferma), usando i suoni di https://buttons.joshwcomeau.com/. I file audio sono inclusi nell'app e funzionano senza connessione. Il suono si aggiunge al riscontro visivo e non lo sostituisce: nessuna informazione è affidata solo all'audio.

#### Scenario: Tocco di un pulsante di azione
- **WHEN** i suoni sono attivi e l'utente tocca un pulsante di azione
- **THEN** l'app riproduce il suono associato, senza ritardare l'azione

#### Scenario: Senza connessione
- **WHEN** il telefono è offline
- **THEN** i suoni si riproducono come quando è online

#### Scenario: Suoni disattivati
- **WHEN** l'utente ha disattivato i suoni nelle impostazioni
- **THEN** nessun pulsante riproduce suoni

### Requirement: Interruttore dei suoni
Il sistema SHALL permettere di attivare e disattivare i suoni dalla schermata Impostazioni. La scelta è salvata con le altre impostazioni. Di default i suoni sono attivi.

#### Scenario: Disattivazione
- **WHEN** l'utente spegne l'interruttore "Suoni"
- **THEN** la scelta resta salvata anche dopo la chiusura dell'app

#### Scenario: Interruttore accessibile
- **WHEN** viene mostrato l'interruttore "Suoni"
- **THEN** ha un'etichetta visibile, lo stato acceso o spento è letto dallo screen reader e l'area di tocco è di almeno 44 × 44 px
