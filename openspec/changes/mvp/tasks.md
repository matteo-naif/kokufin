Ogni compito segue le regole di sviluppo di `design.md`: prima si scrive come verificarlo, poi si scrive il codice. L'accessibilità si controlla in ogni compito che crea o cambia interfaccia, non solo alla fine.

## 1. Progetto

- [x] 1.1 Creare il progetto `kokufin` con Vite + React + TypeScript + Tailwind
- [x] 1.2 Aggiungere i font (`@fontsource/space-mono`, `@fontsource/work-sans`) e i token del design system
- [x] 1.3 Attivare il plugin `jsx-a11y` di oxlint nel lint e `lang="it"` al documento

## 2. Dati

- [x] 2.1 Livello dati con Dexie, importi in centesimi, funzioni per mese, totali per bucket e per categoria
- [x] 2.2 `src/config/categories.ts` con categorie di spesa ed entrata

## 3. Schermate

- [x] 3.1 Schermata "Aggiungi / modifica transazione" (`specs/transactions`)
- [x] 3.2 Schermata mese: barre, stati, elenco movimenti, navigazione tra mesi (`specs/monthly-overview`)
- [x] 3.3 Schermata ripartizione per categoria: barre orizzontali ordinate, con etichette dirette e titolo con il messaggio, secondo `specs/category-breakdown` e le "Regole per i grafici" di `design.md`
- [x] 3.4 Impostazioni: percentuali (`specs/settings`) e interruttore "Suoni" (`specs/sounds`)
- [x] 3.5 Backup JSON, esporta e importa (`specs/backup`)
- [x] 3.6 Routing con wouter (indirizzi `#/`) e ritorno al mese con il tasto Indietro (`specs/navigation`)
- [x] 3.7 Impostazioni come indice con le sezioni Preferenze e Backup, ognuna con il proprio indirizzo (`specs/settings`, `specs/navigation`)
- [x] 3.8 Freccia indietro nell'intestazione delle viste secondarie al posto dei pulsanti Annulla (`specs/navigation`)
- [x] 3.9 Icone Phosphor al posto degli SVG disegnati a mano, secondo "Icone" di `design.md`
- [x] 3.10 FAB esteso "Aggiungi" in basso a destra nella schermata del mese, che si stringe scorrendo verso il basso, al posto del "+" nell'intestazione (`specs/navigation`, "Linee guida di interfaccia" di `design.md`)
- [x] 3.11 Ripartizione per categoria in una vista unica con le sezioni Essenziali e Piacere, una sola scala sulle spese del mese, senza la frase con la categoria più alta e senza percentuali (`specs/category-breakdown`, "Regole per i grafici" di `design.md`)

## 4. Android

- [ ] 4.1 Aggiungere Capacitor Android con `appName` "Kokufin" e `appId` `it.matteonaif.kokufin`
- [ ] 4.2 Backup nell'APK (`specs/backup`): la WebView non supporta `navigator.share` con file né `<a download>`, quindi nell'app nativa (`Capacitor.isNativePlatform()`) "Esporta" scrive il JSON nella cache con `@capacitor/filesystem` e lo passa al foglio di condivisione con `@capacitor/share`. Nel browser resta il comportamento attuale. Verificare sul telefono che "Esporta" proponga di salvare o condividere il file e che "Importa" apra il selettore di file
- [ ] 4.3 Generare l'APK di debug

## 5. Verifica

- [ ] 5.1 Ogni scenario delle spec passa (test o controllo manuale descritto)
- [ ] 5.2 Uso con tastiera numerica su telefono
- [ ] 5.3 Nessuna violazione del lint `jsx-a11y` (oxlint) e della scansione `axe` su ogni schermata
- [ ] 5.4 Contrasti misurati con uno strumento (testo 4,5:1, componenti e grafici 3:1)
- [ ] 5.5 Navigazione completa solo con tastiera, con focus visibile
- [ ] 5.6 Prova manuale con TalkBack su telefono, su tutte le schermate
- [ ] 5.7 Carattere al 200% e larghezza 320 px senza perdite di contenuto

## 6. Minori

- [ ] 6.1 Suoni dei pulsanti di azione da https://buttons.joshwcomeau.com/: verificare la licenza dei suoni, includere i file nell'app per l'uso offline, riprodurli al tocco solo se attivi (`specs/sounds`)
- [ ] 6.2 Da decidere: data di default di una transazione nuova. Oggi "Aggiungi" usa sempre la data odierna (`specs/transactions`, scenario "Spesa con i valori di default"), anche quando la schermata mostra un mese passato o futuro. Capire se l'utente si aspetta invece una data nel mese visualizzato (per esempio il primo giorno, o lo stesso giorno del mese) e, se sì, aggiornare spec e codice
