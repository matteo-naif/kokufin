Prima di scrivere codice leggi `openspec/changes/mvp/design.md` e segui le regole di sviluppo.

## Flusso di lavoro Git

Il repository usa git flow (`git flow`, già inizializzato). Usa sempre i suoi comandi per branch, merge, release e hotfix, mai `git merge` a mano.

- `main` contiene solo le release. `develop` è il branch di integrazione. Non fare commit diretti su nessuno dei due.
- Ogni sviluppo si fa in un branch feature: `git flow feature start <nome>`, che parte da `develop`. Il nome è breve, in kebab-case (es. `data-layer`).
- Commit sul branch feature in formato Conventional Commits.
- `git flow feature finish <nome>` porta la feature in `develop`. Si esegue quando l'utente lo chiede.
- Release e hotfix (`git flow release …`, `git flow hotfix …`) portano il codice in `main`: il merge in `main` lo decide l'utente, quindi si eseguono solo su sua richiesta. I tag di versione non hanno prefisso (es. `0.1.0`).
- Niente push senza richiesta esplicita.
