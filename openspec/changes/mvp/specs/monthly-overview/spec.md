## ADDED Requirements

### Requirement: Riepilogo del mese
Il sistema SHALL mostrare, per il mese selezionato, le entrate totali e tre barre (Essenziali, Piacere, Risparmi) con importo, ideale e stato. Per Essenziali e Piacere l'importo è lo speso; per Risparmi è il risparmio del mese, cioè entrate − spese Essenziali − spese Piacere.

#### Scenario: Mese di default
- **WHEN** l'utente apre l'app
- **THEN** vede il mese corrente

#### Scenario: Cambio mese
- **WHEN** l'utente usa le frecce
- **THEN** la schermata mostra i dati del mese scelto, senza limiti sul passato

#### Scenario: Ritorno al mese corrente
- **WHEN** il mese mostrato non è quello corrente
- **THEN** accanto alle frecce compare il pulsante "Mese corrente", che riporta al mese corrente

#### Scenario: Bucket sopra il tetto
- **WHEN** lo speso di Essenziali o Piacere supera l'ideale
- **THEN** la barra mostra l'etichetta "Sopra il tetto" con la sua icona

#### Scenario: Risparmi sotto l'obiettivo
- **WHEN** il risparmio del mese è inferiore all'ideale
- **THEN** la barra mostra l'etichetta "Sotto l'obiettivo" con la sua icona

#### Scenario: Risparmio calcolato
- **WHEN** il mese ha 1800 € di entrate, 200 € di spese Essenziali e 23 € di spese Piacere, con ideale Risparmi al 50%
- **THEN** la barra Risparmi mostra "1577,00 € risparmiati su 900,00 € ideali" e l'etichetta "Obiettivo raggiunto"

#### Scenario: Risparmio negativo
- **WHEN** le spese Essenziali e Piacere superano le entrate del mese
- **THEN** la barra Risparmi mostra il risparmio con il segno meno, la barra vuota e l'etichetta "Sotto l'obiettivo"

### Requirement: Viste del mese
Il sistema SHALL mostrare sotto l'intestazione del mese due tab: "Riepilogo", con entrate, barre dei bucket ed elenco movimenti, e "Categorie", con la ripartizione per categoria (`specs/category-breakdown`). Il mese selezionato è lo stesso per entrambi.

#### Scenario: Cambio tab
- **WHEN** l'utente passa da "Riepilogo" a "Categorie"
- **THEN** la vista mostra la ripartizione dello stesso mese, e intestazione, frecce e "+" restano visibili

#### Scenario: Tab da tastiera
- **WHEN** il focus è su un tab e l'utente preme freccia destra o sinistra
- **THEN** si attiva il tab successivo o precedente, secondo il pattern ARIA dei tab

### Requirement: Elenco movimenti
Il sistema SHALL mostrare sotto le barre l'elenco delle transazioni del mese, dalla più recente.

#### Scenario: Ordine dell'elenco
- **WHEN** il mese ha più transazioni
- **THEN** l'elenco le mostra dalla più recente alla meno recente
