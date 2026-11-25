import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import ConfirmDialog from '@/components/ConfirmDialog'
import Field from '@/components/Field'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/config/categories'
import { db, type Transaction } from '@/data/db'
import { centsToInput, parseAmount } from '@/data/money'
import { today } from '@/data/summary'

interface Props {
  transaction?: Transaction // assente = nuova transazione
  onDone: () => void
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

export default function TransactionForm({ transaction, onDone }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
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

  const categories = useWatch({ control, name: 'kind' }) === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  async function save({ kind, amount, categoryId, date, note }: FormValues) {
    const data = { date, amountCents: parseAmount(amount)!, kind, categoryId, ...(note.trim() && { note: note.trim() }) }
    if (transaction) await db.transactions.put({ id: transaction.id, ...data })
    else await db.transactions.add(data)
    onDone()
  }

  async function remove() {
    await db.transactions.delete(transaction!.id)
    onDone()
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">{transaction ? 'Modifica transazione' : 'Nuova transazione'}</h1>

      {/* Il focus sul primo campo non valido lo sposta react-hook-form (shouldFocusError) */}
      <form onSubmit={handleSubmit(save)} noValidate className="flex flex-col gap-6">
        <fieldset className="flex gap-6">
          <legend className="mb-2 font-semibold">Tipo</legend>
          {KINDS.map((k) => (
            <label key={k.value} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                value={k.value}
                // le categorie di spesa ed entrata sono diverse
                {...register('kind', { onChange: () => setValue('categoryId', '') })}
                className="size-5 accent-primary"
              />
              {k.label}
            </label>
          ))}
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
          <div className="flex flex-col">
            {categories.map((c) => (
              <label key={c.id} className="flex min-h-11 items-center gap-3">
                <input
                  type="radio"
                  value={c.id}
                  {...register('categoryId', { required: 'Scegli una categoria.' })}
                  className="size-5 accent-primary"
                />
                {c.name}
              </label>
            ))}
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
          <button type="submit" className={primaryButtonClass}>
            Salva
          </button>
          <button type="button" onClick={onDone} className={secondaryButtonClass}>
            Annulla
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
