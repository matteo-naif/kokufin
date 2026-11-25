## Why

L'Excel mensile somma solo i totali di entrate, essenziali, piacere e risparmi. Non permette di sapere in quali categorie è andato il denaro. L'app registra ogni singola spesa con una categoria e calcola da lì i totali e le statistiche.

## What Changes

- Nuova app Android chiamata Kokufin, usata da telefono, con dati solo locali.
- Ogni transazione appartiene a una categoria, e ogni categoria a un bucket: Essenziali, Piacere, Risparmi.
- Gli importi ideali dei bucket si calcolano dalle entrate del mese (default 30% / 20% / 50%).
- Una sola statistica nella v1: ripartizione per categoria nel mese, in barre orizzontali.
- L'accessibilità è un requisito fondamentale: ogni schermata rispetta le WCAG 2.2 livello AA (vedi `specs/accessibility`).
- I grafici seguono le regole di data visualization descritte in `design.md`.
- Chi implementa, persona o IA, segue le regole di sviluppo descritte in `design.md`.

## Capabilities

### New Capabilities
- `transactions`: registrazione, modifica ed eliminazione di entrate e spese
- `monthly-overview`: riepilogo del mese con barre dei bucket ed elenco movimenti
- `category-breakdown`: ripartizione per categoria in barre orizzontali
- `settings`: percentuali ideali dei bucket
- `backup`: esportazione e ripristino dei dati in JSON
- `accessibility`: conformità WCAG 2.2 AA

## Fuori dalla v1

Sincronizzazione tra dispositivi, import dell'Excel storico (si parte dal mese corrente), conti multipli, budget per categoria, tag, valute, spese ricorrenti, gruppi, altre statistiche (top categorie, confronto tra mesi, andamento nel tempo, medie), modifica delle categorie dall'interfaccia, tema scuro.
