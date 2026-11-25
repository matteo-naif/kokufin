## ADDED Requirements

### Requirement: Riepilogo del mese
Il sistema SHALL mostrare, per il mese selezionato, le entrate totali e tre barre (Essenziali, Piacere, Risparmi) con un testo, l'ideale e lo stato. Per Essenziali e Piacere il testo dice quanto resta prima del tetto o di quanto lo si è superato, così non va calcolato a mente. Per Risparmi il testo riporta il risparmio del mese, cioè entrate − spese Essenziali − spese Piacere, e sotto l'obiettivo anche quanto manca. Le tre barre hanno una sola scala: il 100% della larghezza sono le entrate del mese. Ogni barra ha una tacca nel punto dell'ideale.

#### Scenario: Mese di default
- **WHEN** l'utente apre l'app
- **THEN** vede il mese corrente

#### Scenario: Cambio mese
- **WHEN** l'utente usa le frecce
- **THEN** la schermata mostra i dati del mese scelto, senza limiti sul passato

#### Scenario: Ritorno al mese corrente
- **WHEN** il mese mostrato non è quello corrente
- **THEN** accanto alle frecce compare il pulsante "Mese corrente", che riporta al mese corrente

#### Scenario: Bucket entro il tetto
- **WHEN** lo speso di Essenziali è 200 € e l'ideale 300 €
- **THEN** la barra mostra "Restano 100,00 € su 300,00 € ideali" e l'etichetta "In linea"

#### Scenario: Bucket sopra il tetto
- **WHEN** lo speso di Essenziali o Piacere supera l'ideale, per esempio 350 € spesi con ideale 300 €
- **THEN** la barra mostra "50,00 € oltre il tetto di 300,00 €" e l'etichetta "Sopra il tetto" con la sua icona

#### Scenario: Risparmi sotto l'obiettivo
- **WHEN** il risparmio del mese è inferiore all'ideale, per esempio 400 € risparmiati con ideale 500 €
- **THEN** la barra mostra "400,00 € risparmiati su 500,00 € ideali", sotto "Mancano 100,00 € all'obiettivo" e l'etichetta "Sotto l'obiettivo" con la sua icona

#### Scenario: Risparmio calcolato
- **WHEN** il mese ha 1800 € di entrate, 200 € di spese Essenziali e 23 € di spese Piacere, con ideale Risparmi al 50%
- **THEN** la barra Risparmi mostra "1577,00 € risparmiati su 900,00 € ideali" e l'etichetta "Obiettivo raggiunto", senza la riga "Mancano"

#### Scenario: Risparmio negativo
- **WHEN** le spese Essenziali e Piacere superano le entrate del mese
- **THEN** la barra Risparmi mostra il risparmio con il segno meno, la barra vuota e l'etichetta "Sotto l'obiettivo"

#### Scenario: Scala delle barre sulle entrate
- **WHEN** il mese ha 1000 € di entrate, 250 € di spese Essenziali e percentuali 30 / 20 / 50
- **THEN** la barra Essenziali occupa il 25% della larghezza, con la tacca dell'ideale al 30%; la tacca di Piacere è al 20% e quella di Risparmi al 50%

#### Scenario: Spese oltre le entrate
- **WHEN** lo speso di un bucket supera le entrate del mese
- **THEN** la sua barra occupa tutta la larghezza e non va oltre; lo sforamento è scritto nel testo

#### Scenario: Mese senza entrate
- **WHEN** il mese ha entrate pari a zero, con o senza spese
- **THEN** al posto delle tre barre la schermata mostra solo l'invito ad aggiungere un'entrata, senza importi ideali né stati; le spese restano visibili nell'elenco movimenti e nella vista "Categorie"

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
