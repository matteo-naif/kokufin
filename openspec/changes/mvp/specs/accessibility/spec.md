## ADDED Requirements

### Requirement: Conformità WCAG 2.2 AA
Il sistema SHALL rispettare le WCAG 2.2 livello AA in ogni schermata e componente. Una schermata o un componente non è completo finché i controlli di questa spec non passano.

#### Scenario: Nuova schermata
- **WHEN** viene aggiunta o modificata una schermata
- **THEN** i controlli di accessibilità elencati in `tasks.md` passano prima di considerarla finita

### Requirement: Contenuto percepibile
Il sistema SHALL presentare testo, controlli e grafici in modo percepibile senza dipendere dalla vista, dal colore o dalla dimensione dello schermo.

#### Scenario: Contrasto del testo
- **WHEN** viene mostrato del testo
- **THEN** il suo contrasto con lo sfondo è almeno 4,5:1 (3:1 per il testo grande, da 24 px, o da 19 px in grassetto)

#### Scenario: Contrasto dei componenti
- **WHEN** viene mostrato un bordo di campo, un'icona informativa, una barra o un indicatore di focus
- **THEN** il suo contrasto con lo sfondo adiacente è almeno 3:1

#### Scenario: Informazione non affidata al colore
- **WHEN** un bucket è sopra il tetto, in linea, sotto l'obiettivo o raggiunto
- **THEN** lo stato è comunicato anche da un'etichetta di testo e da un'icona

#### Scenario: Grafico per chi non lo vede
- **WHEN** viene mostrato il grafico di ripartizione
- **THEN** ogni riga è un elemento di un elenco `ul` con categoria, importo e percentuale in testo, letto dallo screen reader, e la barra è decorativa e nascosta alle tecnologie assistive

#### Scenario: Testo ingrandito
- **WHEN** la dimensione del carattere del telefono è al 200% o la larghezza è 320 px
- **THEN** il contenuto resta leggibile, senza testo tagliato o sovrapposto e senza scorrimento orizzontale

### Requirement: Contenuto utilizzabile
Il sistema SHALL essere completamente utilizzabile con tocco, tastiera e screen reader (TalkBack).

#### Scenario: Tastiera e ordine del focus
- **WHEN** l'utente naviga con la tastiera
- **THEN** ogni controllo è raggiungibile, l'ordine del focus segue l'ordine visivo e il focus è sempre visibile e non coperto da altri elementi

#### Scenario: Bersagli di tocco
- **WHEN** viene mostrato un controllo toccabile
- **THEN** la sua area è di almeno 44 × 44 px

#### Scenario: Nomi dei controlli
- **WHEN** un controllo non ha testo visibile (frecce del mese, pulsante "+")
- **THEN** ha un nome accessibile esplicito, per esempio "Mese precedente", "Aggiungi transazione"

#### Scenario: Conferma di eliminazione
- **WHEN** compare la conferma di eliminazione
- **THEN** il focus si sposta nella conferma, resta al suo interno finché è aperta e torna all'elemento di partenza alla chiusura

### Requirement: Contenuto comprensibile
Il sistema SHALL rendere chiari etichette, errori e lingua.

#### Scenario: Etichette dei campi
- **WHEN** viene mostrato un campo di input
- **THEN** ha un'etichetta visibile collegata al campo, non solo un segnaposto

#### Scenario: Errore di validazione
- **WHEN** un campo non è valido (importo non valido, somma delle percentuali diversa da 100)
- **THEN** il messaggio è in testo, indica come correggere, è associato al campo ed è annunciato dallo screen reader

#### Scenario: Lingua
- **WHEN** l'app viene caricata
- **THEN** il documento dichiara `lang="it"`

### Requirement: Contenuto robusto
Il sistema SHALL esporre nome, ruolo e valore di ogni componente a screen reader e tecnologie assistive.

#### Scenario: Barre dei bucket
- **WHEN** viene mostrata una barra di bucket
- **THEN** speso, ideale e stato sono disponibili come testo per lo screen reader, non solo come lunghezza della barra

#### Scenario: Struttura della pagina
- **WHEN** viene mostrata una schermata
- **THEN** ha un solo `h1`, una gerarchia di titoli senza salti e regioni semantiche (`main`, `nav`)
