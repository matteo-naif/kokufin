## ADDED Requirements

### Requirement: Riepilogo del mese
Il sistema SHALL mostrare, per il mese selezionato, tre barre: Essenziali, Piacere e Risparmi. Accanto al nome di ogni bucket, sulla stessa riga, c'è l'importo del mese, come il totale accanto al titolo nella vista "Categorie": lo speso per Essenziali e Piacere, il risparmio per Risparmi, cioè entrate − spese Essenziali − spese Piacere. Le tre barre hanno una sola scala: il 100% della larghezza sono le entrate del mese. Ogni barra ha una tacca nel punto della percentuale delle impostazioni. Sotto ogni barra una riga dice il significato della tacca. Per Essenziali e Piacere: quanto si può ancora spendere, che si è raggiunto il limite, o quanto si è speso in più; solo quest'ultimo caso ha l'icona di avviso. Per Risparmi la riga compare solo sotto la percentuale e dice quanto manca per raggiungerla, senza icona: il risparmio non è un obiettivo. Nei titoli Essenziali e Piacere si chiamano "Spese essenziali" e "Spese di piacere", con la stessa parola "spesa" usata nel resto dell'app; il nome vale ovunque compaia il bucket. Gli importi negativi usano il segno meno tipografico (−, U+2212), come l'elenco movimenti. L'importo delle entrate non è mostrato a parte: è la scala delle barre e compare nell'elenco movimenti.

#### Scenario: Mese di default
- **WHEN** l'utente apre l'app
- **THEN** vede il mese corrente

#### Scenario: Cambio mese
- **WHEN** l'utente usa le frecce
- **THEN** la schermata mostra i dati del mese scelto, senza limiti sul passato

#### Scenario: Ritorno al mese corrente
- **WHEN** il mese mostrato non è quello corrente
- **THEN** accanto alle frecce compare il pulsante "Mese corrente", che riporta al mese corrente

#### Scenario: Bucket entro l'ideale
- **WHEN** lo speso di Essenziali è 200 € e l'ideale 300 €
- **THEN** accanto a "Spese essenziali" c'è "200,00 €" e sotto la barra "Puoi spendere ancora 100,00 €", senza icona

#### Scenario: Bucket al limite
- **WHEN** lo speso di Essenziali o Piacere è uguale all'ideale
- **THEN** sotto la barra c'è "Hai raggiunto il limite", senza icona

#### Scenario: Bucket oltre l'ideale
- **WHEN** lo speso di Essenziali o Piacere supera l'ideale, per esempio 350 € spesi con ideale 300 €
- **THEN** accanto al nome del bucket c'è "350,00 €" e sotto la barra "Hai speso 50,00 € in più" con l'icona di avviso

#### Scenario: Risparmio calcolato
- **WHEN** il mese ha 1800 € di entrate, 200 € di spese Essenziali e 23 € di spese Piacere
- **THEN** accanto a "Risparmi" c'è "1577,00 €", e sotto la barra non c'è nessuna riga perché il risparmio supera il 50% delle entrate

#### Scenario: Risparmio sotto la percentuale
- **WHEN** il mese ha 1000 € di entrate, 650 € di spese e percentuale Risparmi al 50%
- **THEN** sotto la barra Risparmi c'è "Ti mancano 150,00 € per il 50%", senza icona

#### Scenario: Risparmio negativo
- **WHEN** le spese Essenziali e Piacere superano le entrate del mese
- **THEN** accanto a "Risparmi" il risparmio è scritto con il segno meno tipografico (per esempio "−20,00 €") e la barra è vuota

#### Scenario: Scala delle barre sulle entrate
- **WHEN** il mese ha 1000 € di entrate, 250 € di spese Essenziali e percentuali 30 / 20 / 50
- **THEN** la barra Essenziali occupa il 25% della larghezza, con la tacca dell'ideale al 30%; la tacca di Piacere è al 20%; la barra Risparmi occupa il 75%, con la tacca al 50%

#### Scenario: Spese oltre le entrate
- **WHEN** lo speso di un bucket supera le entrate del mese
- **THEN** la sua barra occupa tutta la larghezza e non va oltre; lo sforamento è scritto nel testo

#### Scenario: Mese senza entrate
- **WHEN** il mese ha entrate pari a zero, con o senza spese
- **THEN** al posto delle tre barre la schermata mostra solo l'invito "Aggiungi le entrate del mese per vedere quanto puoi spendere."; le spese restano visibili nell'elenco movimenti e nella vista "Categorie"

### Requirement: Viste del mese
Il sistema SHALL mostrare sotto l'intestazione del mese due tab: "Riepilogo", con barre dei bucket ed elenco movimenti, e "Categorie", con la ripartizione per categoria (`specs/category-breakdown`). Il mese selezionato è lo stesso per entrambi.

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
