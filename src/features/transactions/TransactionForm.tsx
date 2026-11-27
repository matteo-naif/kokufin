import { CheckIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/ConfirmDialog'
import Field from '@/components/Field'
import ScreenHeader from '@/components/ScreenHeader'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { type Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES, SPENDING_BUCKETS } from '@/config/categories'
import { db, type Transaction } from '@/data/db'
import { today } from '@/lib/dates'
import { centsToInput, parseAmount } from '@/lib/money'

interface Props {
  transaction?: Transaction // assente = nuova transazione
  onDone: () => void // dopo Salva o Elimina
  onBack: () => void
}

interface FormValues {
  kind: Transaction['kind']
  amount: string
  categoryId: string
  date: string
  note: string
}

const KINDS = [
  { value: 'expense', label: 'Spesa' },
  { value: 'income', label: 'Entrata' },
] as const

export default function TransactionForm({ transaction, onDone, onBack }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({
    defaultValues: {
      kind: transaction?.kind ?? 'expense',
      amount: transaction ? centsToInput(transaction.amountCents) : '',
      categoryId: transaction?.categoryId ?? '',
      date: transaction?.date ?? today(),
      note: transaction?.note ?? '',
    },
  })
  const [confirming, setConfirming] = useState(false)
  const deleteRef = useRef<HTMLButtonElement>(null)

  const kind = useWatch({ control, name: 'kind' })
  const selectedCategory = useWatch({ control, name: 'categoryId' })
  // Le spese sono divise per bucket, così si vede dove va la spesa; le entrate sono un solo gruppo
  const categoryGroups: { name?: string; categories: Category[] }[] =
    kind === 'expense'
      ? SPENDING_BUCKETS.map((b) => ({
          name: b.name,
          categories: EXPENSE_CATEGORIES.filter((c) => c.bucket === b.id),
        }))
      : [{ categories: INCOME_CATEGORIES }]

  // Chip: radio nascosto alla vista ma non allo screen reader; la scelta è segnata da colore e spunta
  function chips(categories: Category[]) {
    return (
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <label
            key={c.id}
            className="flex min-h-11 items-center gap-2 rounded border border-border px-4 has-checked:border-primary has-checked:bg-primary has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
          >
            <input
              type="radio"
              value={c.id}
              {...register('categoryId', { required: 'Scegli una categoria.' })}
              className="sr-only"
            />
            {selectedCategory === c.id && <CheckIcon />}
            {c.name}
          </label>
        ))}
      </div>
    )
  }

  async function save({ kind, amount, categoryId, date, note }: FormValues) {
    const data = { date, amountCents: parseAmount(amount)!, kind, categoryId, ...(note.trim() && { note: note.trim() }) }
    if (transaction) await db.transactions.put({ id: transaction.id, ...data })
    else await db.transactions.add(data)
    toast.success('Transazione salvata')
    onDone()
  }

  async function remove() {
    await db.transactions.delete(transaction!.id)
    toast.success('Transazione eliminata')
    onDone()
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <ScreenHeader title={transaction ? 'Modifica transazione' : 'Nuova transazione'} onBack={onBack} />

      {/* Il focus sul primo campo non valido lo sposta react-hook-form (shouldFocusError) */}
      <form onSubmit={handleSubmit(save)} noValidate className="flex flex-col gap-6">
        {/* Segmented button di Material 3: radio nascosti, come i chip delle categorie */}
        <fieldset>
          <legend className="mb-2 font-semibold">Tipo</legend>
          <div className="flex">
            {KINDS.map((k) => (
              <label
                key={k.value}
                className="relative flex min-h-11 flex-1 items-center justify-center gap-2 border border-border px-4 first:rounded-l last:rounded-r not-first:-ml-px has-checked:border-primary has-checked:bg-primary has-checked:text-white has-focus-visible:z-10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
              >
                <input
                  type="radio"
                  value={k.value}
                  // le categorie di spesa ed entrata sono diverse
                  {...register('kind', { onChange: () => setValue('categoryId', '') })}
                  className="sr-only"
                />
                {kind === k.value && <CheckIcon />}
                {k.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="amount" label="Importo (€)" error={errors.amount?.message}>
          {(control) => (
            <input
              {...control}
              inputMode="decimal"
              autoComplete="off"
              {...register('amount', {
                validate: (v) => parseAmount(v) !== null || 'Inserisci un importo maggiore di zero, per esempio 12,50.',
              })}
              className={inputClass}
            />
          )}
        </Field>

        <fieldset aria-describedby={errors.categoryId ? 'category-error' : undefined}>
          <legend className="mb-2 font-semibold">Categoria</legend>
          {errors.categoryId && (
            <p id="category-error" role="alert" className="mb-2 text-text">
              {errors.categoryId.message}
            </p>
          )}
          <div className="flex flex-col gap-4">
            {categoryGroups.map((g) =>
              g.name ? (
                <fieldset key={g.name}>
                  <legend className="mb-2 text-sm text-text-secondary">{g.name}</legend>
                  {chips(g.categories)}
                </fieldset>
              ) : (
                <div key="income">{chips(g.categories)}</div>
              ),
            )}
          </div>
        </fieldset>

        <Field id="date" label="Data">
          {(control) => (
            <input
              {...control}
              type="date"
              required
              {...register('date', { setValueAs: (v: string) => v || today() })}
              className={inputClass}
            />
          )}
        </Field>

        <Field id="note" label="Nota (facoltativa)">
          {(control) => <input {...control} {...register('note')} className={inputClass} />}
        </Field>

        <div className="flex flex-wrap gap-3">
          {/* Disattivato dal salvataggio fino al cambio di vista: un doppio tocco non aggiunge due transazioni */}
          <button type="submit" disabled={isSubmitting || isSubmitSuccessful} className={primaryButtonClass}>
            Salva
          </button>
          {transaction && (
            <button ref={deleteRef} type="button" onClick={() => setConfirming(true)} className={`${secondaryButtonClass} ml-auto`}>
              Elimina
            </button>
          )}
        </div>
      </form>

      {transaction && (
        <ConfirmDialog
          open={confirming}
          title="Eliminare questa transazione?"
          confirmLabel="Elimina"
          onConfirm={remove}
          onClose={() => setConfirming(false)}
          returnFocusRef={deleteRef}
        />
      )}
    </main>
  )
}
