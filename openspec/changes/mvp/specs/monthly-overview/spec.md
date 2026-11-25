## ADDED Requirements

### Requirement: Riepilogo del mese
Il sistema SHALL mostrare, per il mese selezionato, tre barre: Essenziali, Piacere e Risparmi. Sopra ogni barra c'è l'importo del mese: lo speso per Essenziali e Piacere ("Hai speso X"), il risparmio per Risparmi ("Hai risparmiato X"). Il risparmio non è un obiettivo: è entrate − spese Essenziali − spese Piacere. Le tre barre hanno una sola scala: il 100% della larghezza sono le entrate del mese. Essenziali e Piacere hanno una tacca nel punto dell'ideale e, su una riga sotto la barra, il significato della tacca: quanto resta a disposizione o di quanto la si è superata. Lo sforamento ha anche l'icona di avviso; negli altri casi non c'è nessuna etichetta di stato. L'importo delle entrate non è mostrato a parte: è la scala delle barre e compare nell'elenco movimenti.

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
- **THEN** sopra la barra c'è "Hai speso 200,00 €" e sotto "Hai a disposizione ancora 100,00 €", senza icona

#### Scenario: Bucket oltre l'ideale
- **WHEN** lo speso di Essenziali o Piacere supera l'ideale, per esempio 350 € spesi con ideale 300 €
- **THEN** sopra la barra c'è "Hai speso 350,00 €" e sotto "Hai sforato di 50,00 €" con l'icona di avviso

#### Scenario: Risparmio calcolato
- **WHEN** il mese ha 1800 € di entrate, 200 € di spese Essenziali e 23 € di spese Piacere
- **THEN** sopra la barra Risparmi c'è "Hai risparmiato 1577,00 €", e la barra non ha tacca né riga sotto

#### Scenario: Risparmio negativo
- **WHEN** le spese Essenziali e Piacere superano le entrate del mese
- **THEN** la barra Risparmi mostra il risparmio con il segno meno e la barra vuota

#### Scenario: Scala delle barre sulle entrate
- **WHEN** il mese ha 1000 € di entrate, 250 € di spese Essenziali e percentuali 30 / 20 / 50
- **THEN** la barra Essenziali occupa il 25% della larghezza, con la tacca dell'ideale al 30%; la tacca di Piacere è al 20%; la barra Risparmi occupa il 75%, senza tacca

#### Scenario: Spese oltre le entrate
- **WHEN** lo speso di un bucket supera le entrate del mese
- **THEN** la sua barra occupa tutta la larghezza e non va oltre; lo sforamento è scritto nel testo

#### Scenario: Mese senza entrate
- **WHEN** il mese ha entrate pari a zero, con o senza spese
- **THEN** al posto delle tre barre la schermata mostra solo l'invito ad aggiungere un'entrata; le spese restano visibili nell'elenco movimenti e nella vista "Categorie"

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
