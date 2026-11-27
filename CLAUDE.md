Prima di scrivere codice leggi `openspec/changes/mvp/design.md` e segui le regole di sviluppo.

## Lingua del codice

- Tutti gli identificatori del codice sono in inglese: nomi di tipi, campi e chiavi dei modelli, valori delle union, `id` di categorie e bucket, nomi di tabelle e funzioni. Nessun modello mescola chiavi italiane e inglesi.
- In italiano restano solo i testi mostrati all'utente (per esempio i `name` delle categorie e le etichette dell'interfaccia) , i commenti nel codice, le descrizioni dei test e la documentazione.

## Struttura

La struttura è descritta in `design.md`, sezione "Struttura del codice".

- Una feature non importa mai da un'altra feature. Se un modulo serve a più feature, va in `src/components/`, `src/data/` o `src/config/`.
- Un modulo usato da una sola feature sta nella cartella di quella feature.
- Le cartelle delle feature sono piatte: niente sottocartelle e niente file `index.ts` che riesportano.

## Import

- Gli import dei moduli del progetto usano sempre l'alias `@/`, che corrisponde a `src/` (es. `import { db } from '@/data/db'`). Niente percorsi relativi (`./`, `../`), nemmeno per i file nella stessa cartella.
- L'alias è configurato in `tsconfig.app.json` (`paths`) e in `vite.config.ts` (`resolve.alias`): se cambia, va cambiato in entrambi.

## Flusso di lavoro Git

Il repository usa git flow (`git flow`, già inizializzato). Usa sempre i suoi comandi per branch, merge, release e hotfix, mai `git merge` a mano.

- `main` contiene solo le release. `develop` è il branch di integrazione. Non fare commit diretti su nessuno dei due.
- Ogni sviluppo si fa in un branch feature: `git flow feature start <nome>`, che parte da `develop`. Il nome è breve, in kebab-case (es. `data-layer`).
- Commit sul branch feature in formato Conventional Commits.
- `git flow feature finish <nome>` porta la feature in `develop`. Si esegue quando l'utente lo chiede.
- Release e hotfix (`git flow release …`, `git flow hotfix …`) portano il codice in `main`: il merge in `main` lo decide l'utente, quindi si eseguono solo su sua richiesta. I tag di versione non hanno prefisso (es. `0.1.0`).
- Niente push senza richiesta esplicita.
