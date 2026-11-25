import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/ConfirmDialog'
import Field from '@/components/Field'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { type Bucket, BUCKETS } from '@/config/categories'
import { type Backup, createBackup, parseBackup, restoreBackup } from '@/data/backup'
import { db, getSettings, type Settings } from '@/data/db'
import { today } from '@/data/summary'

interface Props {
  onDone: () => void
}

interface FormValues {
  idealPct: Record<Bucket, string>
  soundsEnabled: boolean
}

/** Carica le impostazioni salvate, poi mostra il form con quei valori. */
export default function SettingsScreen({ onDone }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Impostazioni</h1>
      {settings && <SettingsForm settings={settings} onDone={onDone} />}
      <BackupSection onDone={onDone} />
    </main>
  )
}

function SettingsForm({ settings, onDone }: { settings: Settings; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      idealPct: {
        essentials: String(settings.idealPct.essentials),
        pleasure: String(settings.idealPct.pleasure),
        savings: String(settings.idealPct.savings),
      },
      soundsEnabled: settings.soundsEnabled,
    },
  })

  // Totale aggiornato mentre si scrive; i valori non numerici contano 0
  const values = useWatch({ control, name: 'idealPct' })
  const total = BUCKETS.reduce((sum, b) => sum + (Number(values[b.id]) || 0), 0)
  const soundsEnabled = useWatch({ control, name: 'soundsEnabled' })

  async function save({ idealPct, soundsEnabled }: FormValues) {
    if (total !== 100) {
      setError('root', { message: `La somma deve essere 100%: ora è ${total}%. Correggi le percentuali.` })
      setFocus('idealPct.essentials')
      return
    }
    await db.settings.put({
      id: 'default',
      idealPct: { essentials: Number(idealPct.essentials), pleasure: Number(idealPct.pleasure), savings: Number(idealPct.savings) },
      soundsEnabled,
    })
    toast.success('Impostazioni salvate')
    onDone()
  }

  return (
    // Il focus sul primo campo non valido lo sposta react-hook-form (shouldFocusError)
    <form onSubmit={handleSubmit(save)} noValidate className="flex flex-col gap-6">
      <fieldset aria-describedby={`pct-total${errors.root ? ' pct-error' : ''}`} className="flex flex-col gap-4">
        <legend className="mb-2 text-xl font-bold">Percentuali ideali</legend>
        {BUCKETS.map((b) => (
          <Field key={b.id} id={`pct-${b.id}`} label={`${b.name} (%)`} error={errors.idealPct?.[b.id]?.message}>
            {(control) => (
              <input
                {...control}
                inputMode="numeric"
                autoComplete="off"
                {...register(`idealPct.${b.id}`, {
                  validate: (v) => (/^\d+$/.test(v) && Number(v) <= 100) || 'Inserisci un numero intero da 0 a 100.',
                })}
                className={inputClass}
              />
            )}
          </Field>
        ))}
        <p id="pct-total" className="font-semibold">
          Totale: {total}%
        </p>
        {errors.root && (
          <p id="pct-error" role="alert">
            {errors.root.message}
          </p>
        )}
      </fieldset>

      {/* Interruttore: checkbox nativo con role="switch" e aria-checked, lo screen reader legge acceso/spento.
          L'etichetta copre tutta la riga, così l'area di tocco supera 44 px. */}
      <label className="flex min-h-11 items-center justify-between gap-4 font-semibold">
        Suoni
        <input
          type="checkbox"
          role="switch"
          aria-checked={soundsEnabled}
          {...register('soundsEnabled')}
          // Stato indicato dalla posizione del cerchio, non solo dal colore
          className="relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-border bg-separator before:absolute before:top-0.5 before:left-0.5 before:size-5 before:rounded-full before:border before:border-border before:bg-bg checked:border-primary checked:bg-primary checked:before:translate-x-5"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className={primaryButtonClass}>
          Salva
        </button>
        <button type="button" onClick={onDone} className={secondaryButtonClass}>
          Annulla
        </button>
      </div>
    </form>
  )
}

/** Esporta e importa tutti i dati in un file JSON (spec backup). */
function BackupSection({ onDone }: { onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLButtonElement>(null)
  // Backup letto dal file e in attesa di conferma
  const [pending, setPending] = useState<Backup | null>(null)
  const [invalid, setInvalid] = useState(false)

  async function exportData() {
    const file = new File([await createBackup()], `kokufin-backup-${today()}.json`, { type: 'application/json' })
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
    URL.revokeObjectURL(url)
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
    await restoreBackup(pending!)
    toast.success('Dati ripristinati')
    onDone()
  }

  return (
    <section aria-labelledby="backup-title" className="flex flex-col gap-4">
      <h2 id="backup-title" className="text-xl font-bold">
        Backup
      </h2>
      <p>Esporta salva transazioni e impostazioni in un file JSON. Importa sostituisce tutti i dati con quelli di un file di backup.</p>
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
    </section>
  )
}
