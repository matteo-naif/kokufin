import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import Field from '@/components/Field'
import ScreenHeader from '@/components/ScreenHeader'
import { inputClass, primaryButtonClass } from '@/components/styles'
import { type Bucket, BUCKETS } from '@/config/categories'
import { db, getSettings, type Settings } from '@/data/db'

interface Props {
  onSaved: () => void
  onBack: () => void
}

interface FormValues {
  idealPct: Record<Bucket, string>
  soundsEnabled: boolean
}

/** Carica le impostazioni salvate, poi mostra il form con quei valori. */
export default function PreferencesScreen(props: Props) {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <ScreenHeader title="Preferenze" onBack={props.onBack} />
      <p>
        Scegli quanta parte delle entrate di ogni mese destinare alle spese essenziali, alle spese di piacere e ai risparmi: la somma deve fare
        100%. Puoi anche attivare o disattivare i suoni dei pulsanti.
      </p>
      {settings && <SettingsForm settings={settings} onSaved={props.onSaved} />}
    </main>
  )
}

function SettingsForm({ settings, onSaved }: { settings: Settings; onSaved: () => void }) {
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
    onSaved()
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
      </div>
    </form>
  )
}
