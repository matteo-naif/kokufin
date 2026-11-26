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
- react-hook-form per la gestione dei form.
- wouter per il routing, con indirizzi nella forma `#/` (`useHashLocation`): l'APK carica l'app da file locali, senza un server che risponda agli altri percorsi. Serve soprattutto al tasto Indietro di Android, che in Capacitor segue la cronologia della WebView.
- sonner per i toast di conferma, con lo stile del design system (classi Tailwind, testi in `rem`). Gli errori di validazione non vanno nei toast: restano scritti accanto ai campi.
- Barre orizzontali in HTML e CSS per il grafico di ripartizione, con la stessa tecnica delle barre dei bucket. Nessuna libreria di grafici: Recharts non serve più.
- Capacitor per generare un APK da installare a mano, senza pubblicare online.
- Font inclusi nell'app con `@fontsource/space-mono` e `@fontsource/work-sans`, così funzionano offline.
- Icone dal pacchetto `@phosphor-icons/react`: nel bundle entrano solo le icone importate, quindi funzionano offline.

## Modello dati

- `Transaction`: `id`, `date` (ISO `YYYY-MM-DD`), `amountCents` (intero, sempre positivo), `kind` (`income` | `expense`), `categoryId`, `note?`.
- `Settings`: `idealPct` con tre valori (`essentials`, `pleasure`, `savings`) la cui somma è 100. Default 30 / 20 / 50. `soundsEnabled` (booleano), default `true`.
- Il mese non è salvato: si ricava dalla data della transazione.
- I risparmi non si registrano: si calcolano. Risparmi del mese = entrate − spese Essenziali − spese Piacere. Il valore può essere negativo, quando le spese superano le entrate.
- Le categorie di spesa appartengono solo a Essenziali (`essentials`) o Piacere (`pleasure`).

## Categorie

Definite in `src/config/categories.ts`, con `id` stabili e `name` modificabili. Gli `id` non si cambiano mai, così le transazioni salvate restano valide quando si rinomina una categoria. Le categorie delle entrate sono in `INCOME_CATEGORIES` nello stesso file.

## Calcolo ideale e stato dei bucket

- `ideale = percentuale × entrate del mese`.
- Accanto al nome di ogni bucket, sulla stessa riga e allineato a destra, c'è l'importo del mese, con lo stile del totale accanto al titolo nella vista Categorie (Work Sans 600, `#5A5148`).
- Nei testi visibili i bucket di spesa si chiamano "Spese essenziali" e "Spese di piacere" (`name` in `BUCKETS`): stessa parola "spesa" del form e della vista Categorie, così è chiaro che sono soldi usciti e che Risparmi è ciò che resta.
- Essenziali e Piacere: sotto la barra, in quest'ordine: "Hai speso Z in più" con `WarningIcon` se speso > ideale; "Hai raggiunto il limite" se speso = ideale; "Le entrate del mese sono finite", senza icona, se il bucket ha ancora budget ma entrate − tutte le spese ≤ 0; altrimenti "Puoi spendere ancora Z", con Z = il minore tra ideale − speso e entrate − tutte le spese. Le entrate sono una sola: lo sforamento di un bucket consuma i soldi degli altri, e il testo dice ciò che si può fare davvero. La tacca invece resta sul piano (la percentuale): può capitare che tacca e testo non coincidano, ed è voluto. Le due frasi con l'importo usano lo stesso verbo, così si confrontano a colpo d'occhio. Non c'è un'etichetta di stato quando va tutto bene: un "In linea" ripetuto su ogni barra non aggiunge informazione, e l'avviso si nota di più se è l'unico.
- Risparmi: l'importo è ciò che resta delle entrate dopo le spese. La tacca segna la percentuale Risparmi delle impostazioni. Sotto la barra non c'è riga: quanto manca alla percentuale è la somma algebrica delle righe di Essenziali e Piacere, e non suggerisce nessuna azione. Con risparmio negativo il valore è scritto con il segno meno tipografico (−, U+2212, lo stesso dell'elenco movimenti) e la barra è vuota.
- Barre dei bucket: una sola scala per le tre barre, 100% della larghezza = entrate del mese (regola 2 dei grafici). La lunghezza è l'importo diviso le entrate, tra 0 e 100%: oltre le entrate la barra si ferma al bordo e lo sforamento lo dice il testo. Su ogni barra una tacca verticale segna l'ideale, alla posizione della sua percentuale. La tacca è `#1F1A16`, larga 2 px e più alta della barra, così si vede sopra e sotto anche quando cade sul riempimento (17,25:1 su bianco).
- Le entrate sono una riga sopra le barre, con lo stile dei titoli dei bucket e senza barra: dicono quanto vale il 100% delle barre. Non sono un titolo grande, perché sono il punto di partenza e non il risultato.
- Con entrate pari a zero l'ideale è 0: la schermata non mostra le barre dei bucket, ma solo l'invito "Aggiungi le entrate del mese per vedere quanto puoi spendere." Barre e tacche su una scala nulla sarebbero fuorvianti.

## Design system

- Tema chiaro, palette monocromatica: neutri caldi più un marrone, in linea con il riso del nome.
- Primario `#5C3A21` (marrone scuro). Contrasto 10,09:1 su bianco, e lo stesso valore con testo bianco sul primario.
- Tinte del marrone per i grafici: `#5C3A21` (10,09:1 su bianco) e `#B07C52` (3,59:1). Entrambe superano il 3:1 su bianco richiesto per i grafici. Il loro uso è descritto in "Regole per i grafici".
- Neutri: `#FFFFFF` (sfondo), `#F7F3EE` (superfici), `#E6DFD6` (separatori e fondo delle barre), `#5A5148` (testo secondario: 7,76:1 su bianco, 7,03:1 su `#F7F3EE`, 5,87:1 su `#E6DFD6`), `#1F1A16` (testo principale: 17,25:1 su bianco).
- `#857768` per i bordi dei campi e dei componenti: 4,34:1 su bianco, 3,93:1 su `#F7F3EE`, 3,29:1 su `#E6DFD6`, quindi supera il 3:1 su tutti gli sfondi della palette. Non si usa per il testo, perché 4,34:1 non raggiunge 4,5:1.
- Colori semantici, presi dalla palette di Tailwind, per i messaggi all'utente come i toast. Sono l'unica eccezione alla palette monocromatica e non si usano per bucket e grafici. Per ogni significato una tinta 800 per testo, icona e bordo e una tinta 50 per lo sfondo:
  - Successo `#166534` su `#F0FDF4` (6,81:1; 7,13:1 su bianco).
  - Errore `#991B1B` su `#FEF2F2` (7,60:1; 8,31:1 su bianco).
  - Avviso `#92400E` su `#FFFBEB` (6,84:1; 7,09:1 su bianco).
  - Informazione `#1E40AF` su `#EFF6FF` (8,01:1; 8,72:1 su bianco).
  Come per gli stati dei bucket, il significato non è affidato al colore: ogni messaggio ha testo e icona.
- Titoli in Space Mono, testi in Work Sans.
- Con una sola tinta non si può affidare lo stato al colore. Lo sforamento di un bucket usa sempre un testo e un'icona, oltre alla barra.
- Layout pensato per il telefono: una colonna, bersagli di tocco di almeno 44 px.

## Linee guida di interfaccia

- Per i pattern di interazione e i componenti si seguono le linee guida di Material Design 3 (https://m3.material.io/): navigazione, pulsanti, FAB, dialoghi, tab, comportamento allo scroll, misure e spaziature dei componenti. Su Android sono le convenzioni che l'utente già conosce.
- L'aspetto visivo resta quello del design system di Kokufin: palette, font, icone Phosphor e bersagli di tocco. Dove Material e il design system divergono su colori, tipografia o icone, vale il design system.
- Quando una scelta si discosta da Material, la spec che la descrive ne spiega il motivo.

## Icone

- Tutte le icone vengono dalla famiglia Phosphor (https://phosphoricons.com/), tramite `@phosphor-icons/react`. Niente SVG disegnati a mano né icone di altre librerie.
- Si importano i nomi con il suffisso `Icon` (per esempio `GearIcon`): quelli senza suffisso sono deprecati.
- Peso `bold`, dimensione `1.25rem`, colore del testo (`currentColor`). Questi valori e `aria-hidden` sono fissati una volta sola da `IconProvider` (`src/components/IconProvider.tsx`), usato in `App`: le singole icone non li ripetono.
- L'icona non porta mai da sola un significato: il nome accessibile lo dà il pulsante (`aria-label`) o il testo accanto, come per gli stati dei bucket.
- Icone in uso: `GearIcon` (impostazioni), `PlusIcon` (aggiungi transazione), `CaretLeftIcon` e `CaretRightIcon` (mese precedente e successivo, voci dell'indice impostazioni), `ArrowLeftIcon` (indietro), `WarningIcon` (sforamento dell'ideale di un bucket).

## Regole per i grafici

Sintesi dei principi di *Data storytelling* (Cole Nussbaumer Knaflic, Apogeo, 2016). Valgono per ogni grafico di Kokufin. La v1 ne ha uno solo, la ripartizione per categoria. Le statistiche rimandate a dopo la v1 (andamento nel tempo, confronto tra mesi) si progettano con le stesse regole.

1. **La forma segue il confronto.** Per confrontare le quote delle categorie si usano barre orizzontali. L'occhio confronta bene lunghezze che partono dalla stessa linea di base e male angoli e aree, quindi niente grafici a torta né a ciambella, che hanno lo stesso difetto. Niente effetti 3D e niente secondo asse verticale. Con una sola informazione basta il numero scritto in grande. Per gli andamenti nel tempo, in futuro, si userà una linea.
2. **Barre oneste.** Ogni barra parte da zero e la sua lunghezza è proporzionale al valore. La scala è fissa e unica per tutta la vista: 100% della larghezza sono le spese totali del mese, quindi la lunghezza è la quota sulle spese del mese. Due barre della stessa lunghezza valgono lo stesso importo anche se stanno in sezioni diverse: con una scala per sezione l'occhio confronterebbe lunghezze che non si possono confrontare. Le barre sono ordinate dal valore più alto al più basso, perché l'ordine dice già qual è la categoria che pesa di più. Le categorie senza spese nel mese non compaiono.
3. **Etichette dirette, niente legenda.** Il nome della categoria è scritto sopra la sua barra, l'importo a destra sulla stessa riga. Niente percentuali: con una sola scala ripeterebbero la lunghezza della barra e aggiungerebbero un secondo numero da leggere per ogni riga. Non servono legenda, asse dei valori né griglia, perché i numeri sono già scritti. Il lettore non deve spostare lo sguardo tra grafico e legenda. I valori sono sempre visibili, non stanno in un tooltip, perché sul telefono non esiste il passaggio del mouse.
4. **Il colore guida l'attenzione.** Si usa una sola tinta, in due intensità. La barra della categoria più alta della vista è `#5C3A21`. Le altre sono `#B07C52`. Il colore non distingue le categorie, perché lo fanno già posizione ed etichetta, e nessun significato dipende solo dal colore.
5. **Il titolo dice ciò che il grafico non mostra.** Un titolo con il messaggio serve solo se aggiunge un'informazione che il grafico non rende già evidente. Una frase che ripete la barra più lunga (per esempio "In Piacere pesa di più Ristoranti: 42%") è ridondante: ordine e colore lo dicono già. Nella ripartizione per categoria ogni sezione ha come titolo il nome del bucket, e accanto il totale speso, che altrimenti andrebbe sommato a mente.
6. **Meno disordine.** Niente bordi, ombre, sfondi colorati, effetti o animazioni decorative, e nessun elemento che non porti informazione. Tutto è allineato a sinistra su un unico asse. Uniche linee ammesse: quella sottile (`#E6DFD6`) sotto la riga del titolo di sezione, che collega il nome del bucket a sinistra al totale a destra, e la tacca dell'ideale nelle barre dei bucket, che porta un'informazione. Lo spazio bianco tra una riga e l'altra è maggiore dello spazio tra il testo e la sua barra, così ogni etichetta si legge insieme alla propria barra (principio di prossimità). Lo spazio tra le barre è minore del loro spessore. Il testo è sempre orizzontale, e le barre orizzontali permettono nomi lunghi senza ruotarli.
7. **Gerarchia del testo.** Il titolo della sezione è il testo più grande (Space Mono). Nome della categoria e valori hanno lo stesso corpo, in `#1F1A16`. Il totale del bucket accanto al titolo è in `#5A5148` e in grassetto (Work Sans 600), per distinguerlo dagli importi delle categorie. Le dimensioni sono in `rem`.

## Accessibilità

L'accessibilità non è una rifinitura finale: è un requisito di ogni schermata e di ogni componente, e si controlla durante lo sviluppo. Gli scenari verificabili sono in `specs/accessibility/spec.md`.

- Standard di riferimento: WCAG 2.2 livello AA. Assunzione: è il livello da rispettare, e le WCAG si applicano al contenuto web dentro la WebView di Capacitor. Il comportamento con TalkBack si verifica a mano su telefono.
- Si usa HTML semantico prima di ARIA: `button`, `label`, `input`, `h1`–`h3`, `ul`, `dialog`. ARIA solo dove l'HTML nativo non basta.
- Le dimensioni dei testi sono in `rem`, così seguono le impostazioni di carattere del telefono.
- Contrasti della palette: i valori indicati nel design system sono calcolati con la formula WCAG. Nel grafico il significato non dipende dal colore: categoria e importo sono scritti in testo.
- I rapporti di contrasto si misurano di nuovo con uno strumento sui colori effettivamente usati, non si stimano a occhio.
