## Nome e identità

- Nome: **Kokufin**. Koku è l'antica unità giapponese corrispondente al riso che sfama una persona per un anno, usata qui come idea di "quanto basta". Fin sta per finanza.
- Nome del progetto e del pacchetto: `kokufin`. In Capacitor: `appName` "Kokufin", `appId` `it.matteonaif.kokufin`.
- Esistono altri prodotti finanziari chiamati Koku: un'app per Mac e iPhone, una fintech di Singapore e uno strumento open source da terminale. Per un APK installato a mano non è un problema. Prima di una eventuale pubblicazione vanno ricontrollati marchi, domini e store.

## Regole di sviluppo

Queste regole derivano dalla skill `andrej-karpathy-skills` (https://github.com/multica-ai/andrej-karpathy-skills), pensata per ridurre gli errori più comuni degli LLM nella scrittura di codice. Valgono per ogni modifica al codice di Kokufin. Privilegiano la cautela sulla velocità: per interventi banali (un refuso, una riga ovvia) basta il buon senso.

1. **Pensare prima di programmare.** Dichiarare le assunzioni. Se ci sono più interpretazioni, presentarle invece di sceglierne una in silenzio. Se esiste una soluzione più semplice, dirlo. Se qualcosa non è chiaro, fermarsi e chiedere.
2. **Semplicità prima di tutto.** Scrivere il codice minimo che soddisfa la spec. Niente funzionalità, astrazioni o configurabilità non richieste, e niente gestione di errori per scenari impossibili. Ciò che è elencato in "Fuori dalla v1" (vedi `proposal.md`) non si costruisce, nemmeno in forma preparatoria. Se 200 righe possono diventare 50, si riscrivono.
3. **Modifiche chirurgiche.** Toccare solo ciò che serve alla richiesta. Non migliorare né riformattare il codice vicino, non rifattorizzare ciò che funziona, rispettare lo stile esistente. Il codice morto preesistente si segnala, non si elimina. Gli import e le funzioni resi inutili dalla propria modifica si rimuovono. Ogni riga modificata deve risalire alla richiesta.
4. **Esecuzione guidata da obiettivi verificabili.** Prima di scrivere codice si definisce come si verifica il risultato. Gli scenari WHEN/THEN delle spec sono i criteri di successo: ogni scenario diventa un test o un controllo manuale descritto. Per un bug si scrive prima un test che lo riproduce. Per un compito in più passi si scrive un piano breve con una verifica per passo.

## Stack

- Vite + React + TypeScript + Tailwind.
- Dexie (IndexedDB) per i dati locali.
- Barre orizzontali in HTML e CSS per il grafico di ripartizione, con la stessa tecnica delle barre dei bucket. Nessuna libreria di grafici: Recharts non serve più.
- Capacitor per generare un APK da installare a mano, senza pubblicare online.
- Font inclusi nell'app con `@fontsource/space-mono` e `@fontsource/work-sans`, così funzionano offline.

## Modello dati

- `Transaction`: `id`, `date` (ISO `YYYY-MM-DD`), `amountCents` (intero, sempre positivo), `kind` (`income` | `expense`), `categoryId`, `note?`.
- `Settings`: `idealPct` con tre valori (`essentials`, `pleasure`, `savings`) la cui somma è 100. Default 30 / 20 / 50.
- Il mese non è salvato: si ricava dalla data della transazione.
- I risparmi sono transazioni `expense` con una categoria del bucket `savings`.

## Categorie

Definite in `src/config/categories.ts`, con `id` stabili e `name` modificabili. Gli `id` non si cambiano mai, così le transazioni salvate restano valide quando si rinomina una categoria. Le categorie delle entrate sono in `INCOME_CATEGORIES` nello stesso file.

## Calcolo ideale e stato dei bucket

- `ideale = percentuale × entrate del mese`.
- Essenziali e Piacere: speso ≤ ideale → "In linea", speso > ideale → "Sopra il tetto".
- Risparmi: speso ≥ ideale → "Obiettivo raggiunto", speso < ideale → "Sotto l'obiettivo".
- Con entrate pari a zero l'ideale è 0 e la schermata mostra l'invito ad aggiungere un'entrata.

## Design system

- Tema chiaro, palette monocromatica: neutri caldi più un marrone, in linea con il riso del nome.
- Primario `#5C3A21` (marrone scuro). Contrasto 10,09:1 su bianco, e lo stesso valore con testo bianco sul primario.
- Tinte del marrone per i grafici: `#5C3A21` (10,09:1 su bianco) e `#B07C52` (3,59:1). Entrambe superano il 3:1 su bianco richiesto per i grafici. Il loro uso è descritto in "Regole per i grafici".
- Neutri: `#FFFFFF` (sfondo), `#F7F3EE` (superfici), `#E6DFD6` (separatori e fondo delle barre), `#5A5148` (testo secondario: 7,76:1 su bianco, 7,03:1 su `#F7F3EE`, 5,87:1 su `#E6DFD6`), `#1F1A16` (testo principale: 17,25:1 su bianco).
- `#857768` per i bordi dei campi e dei componenti: 4,34:1 su bianco, 3,93:1 su `#F7F3EE`, 3,29:1 su `#E6DFD6`, quindi supera il 3:1 su tutti gli sfondi della palette. Non si usa per il testo, perché 4,34:1 non raggiunge 4,5:1.
- Titoli in Space Mono, testi in Work Sans.
- Con una sola tinta non si può affidare lo stato al colore. Lo stato di ogni bucket usa sempre un'etichetta di testo e un'icona, oltre alla barra.
- Layout pensato per il telefono: una colonna, bersagli di tocco di almeno 44 px.

## Regole per i grafici

Sintesi dei principi di *Data storytelling* (Cole Nussbaumer Knaflic, Apogeo, 2016). Valgono per ogni grafico di Kokufin. La v1 ne ha uno solo, la ripartizione per categoria. Le statistiche rimandate a dopo la v1 (andamento nel tempo, confronto tra mesi) si progettano con le stesse regole.

1. **La forma segue il confronto.** Per confrontare le quote delle categorie si usano barre orizzontali. L'occhio confronta bene lunghezze che partono dalla stessa linea di base e male angoli e aree, quindi niente grafici a torta né a ciambella, che hanno lo stesso difetto. Niente effetti 3D e niente secondo asse verticale. Con una sola informazione basta il numero scritto in grande. Per gli andamenti nel tempo, in futuro, si userà una linea.
2. **Barre oneste.** Ogni barra parte da zero e la sua lunghezza è proporzionale al valore. La scala è fissa: 100% della larghezza è il totale del bucket, quindi la lunghezza è la quota e resta confrontabile tra bucket e tra mesi. Le barre sono ordinate dal valore più alto al più basso, perché l'ordine dice già qual è la categoria che pesa di più. Le categorie senza spese nel mese non compaiono.
3. **Etichette dirette, niente legenda.** Il nome della categoria è scritto sopra la sua barra, importo e percentuale a destra sulla stessa riga. Non servono legenda, asse dei valori né griglia, perché i numeri sono già scritti. Il lettore non deve spostare lo sguardo tra grafico e legenda. I valori sono sempre visibili, non stanno in un tooltip, perché sul telefono non esiste il passaggio del mouse.
4. **Il colore guida l'attenzione.** Si usa una sola tinta, in due intensità. La prima barra dell'elenco, la categoria più alta, è `#5C3A21`. Le altre sono `#B07C52`. Il colore non distingue le categorie, perché lo fanno già posizione ed etichetta, e nessun significato dipende solo dal colore.
5. **Il titolo dice il messaggio.** Sopra il grafico c'è una frase che riporta la conclusione, non l'argomento. Modello: "In {bucket} pesa di più {categoria}: {percentuale}%", per esempio "In Piacere pesa di più Ristoranti: 42%". La frase si compone con i dati, senza IA. Sotto, in testo secondario, il nome del bucket e il mese.
6. **Meno disordine.** Niente bordi, ombre, sfondi colorati, effetti o animazioni decorative, e nessun elemento che non porti informazione. Tutto è allineato a sinistra su un unico asse. Lo spazio bianco tra una riga e l'altra è maggiore dello spazio tra il testo e la sua barra, così ogni etichetta si legge insieme alla propria barra (principio di prossimità). Lo spazio tra le barre è minore del loro spessore. Il testo è sempre orizzontale, e le barre orizzontali permettono nomi lunghi senza ruotarli.
7. **Gerarchia del testo.** Il titolo è il testo più grande (Space Mono). Nome della categoria e valori hanno lo stesso corpo, in `#1F1A16`. Bucket e mese sono in `#5A5148`. Le dimensioni sono in `rem`.
8. **Percentuali arrotondate.** Le percentuali sono mostrate come interi. Per questo la loro somma può differire di 1 dal 100% e non si corregge.

## Accessibilità

L'accessibilità non è una rifinitura finale: è un requisito di ogni schermata e di ogni componente, e si controlla durante lo sviluppo. Gli scenari verificabili sono in `specs/accessibility/spec.md`.

- Standard di riferimento: WCAG 2.2 livello AA. Assunzione: è il livello da rispettare, e le WCAG si applicano al contenuto web dentro la WebView di Capacitor. Il comportamento con TalkBack si verifica a mano su telefono.
- Si usa HTML semantico prima di ARIA: `button`, `label`, `input`, `h1`–`h3`, `ul`, `dialog`. ARIA solo dove l'HTML nativo non basta.
- Le dimensioni dei testi sono in `rem`, così seguono le impostazioni di carattere del telefono.
- Contrasti della palette: i valori indicati nel design system sono calcolati con la formula WCAG. Nel grafico il significato non dipende dal colore: categoria, importo e percentuale sono scritti in testo.
- I rapporti di contrasto si misurano di nuovo con uno strumento sui colori effettivamente usati, non si stimano a occhio.
