import { type ChangeEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/ConfirmDialog'
import ScreenHeader from '@/components/ScreenHeader'
import { secondaryButtonClass } from '@/components/styles'
import { type Backup, createBackup, parseBackup, restoreBackup } from '@/data/backup'
import { today } from '@/data/summary'

interface Props {
  onRestored: () => void
  onBack: () => void
}

/** Esporta e importa tutti i dati in un file JSON (spec backup). */
export default function BackupScreen({ onRestored, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLButtonElement>(null)
  // Backup letto dal file e in attesa di conferma
  const [pending, setPending] = useState<Backup | null>(null)
  const [invalid, setInvalid] = useState(false)

  async function exportData() {
    let text: string
    try {
      text = await createBackup()
    } catch {
      toast.error('Esportazione non riuscita. Riprova.')
      return
    }
    const file = new File([text], `kokufin-backup-${today()}.json`, { type: 'application/json' })
    // Sul telefono il foglio di condivisione permette di salvare il file o di inviarlo
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return // condivisione annullata dall'utente
        // Altri errori (per esempio NotAllowedError: il browser rifiuta il file anche se canShare
        // lo accetta, o l'attivazione utente è scaduta durante l'await): si scarica il file
      }
    }
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    // Revocato subito, l'indirizzo può sparire prima che il browser inizi il download
    setTimeout(() => URL.revokeObjectURL(url), 40_000)
  }

  async function chooseFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // così si può scegliere di nuovo lo stesso file
    if (!file) return
    const backup = parseBackup(await file.text())
    setInvalid(!backup)
    if (backup) setPending(backup)
    else importRef.current!.focus()
  }

  async function restore() {
    try {
      await restoreBackup(pending!)
    } catch {
      // restoreBackup usa un'unica transazione del database: se fallisce, nulla è cambiato
      toast.error('Ripristino non riuscito. I dati non sono stati modificati.')
      setPending(null) // chiude la conferma
      return
    }
    toast.success('Dati ripristinati')
    onRestored()
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <ScreenHeader title="Backup" onBack={onBack} />
      <p>
        Esporta salva transazioni e impostazioni in un file, da conservare o da spostare su un altro telefono. Importa
        sostituisce tutti i dati attuali con quelli di un file di backup.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={exportData} className={secondaryButtonClass}>
          Esporta
        </button>
        <button
          ref={importRef}
          type="button"
          onClick={() => fileRef.current!.click()}
          aria-describedby={invalid ? 'backup-error' : undefined}
          className={secondaryButtonClass}
        >
          Importa
        </button>
        {/* Selettore di file nativo, aperto dal pulsante Importa */}
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={chooseFile} />
      </div>
      {invalid && (
        <p id="backup-error" role="alert">
          Il file scelto non è un backup di Kokufin valido. I dati non sono stati modificati.
        </p>
      )}
      <ConfirmDialog
        open={pending !== null}
        title="Sostituire tutti i dati con quelli del backup?"
        confirmLabel="Ripristina"
        onConfirm={restore}
        onClose={() => setPending(null)}
        returnFocusRef={importRef}
      />
    </main>
  )
}
