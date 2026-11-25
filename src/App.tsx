import { useEffect, useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/config/categories'
import { type Transaction, transactionsInMonth } from '@/data/db'
import { formatCents } from '@/data/money'
import { monthOf, today } from '@/data/summary'
import TransactionForm from '@/screens/TransactionForm'

const CATEGORY_NAME = new Map([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.id, c.name]))

// null = schermata del mese; undefined dentro form = nuova transazione
type View = null | { form: Transaction | undefined }

function App() {
  const [view, setView] = useState<View>(null)

  if (view) return <TransactionForm transaction={view.form} onDone={() => setView(null)} />
  return <MonthPlaceholder onOpen={(tx) => setView({ form: tx })} />
}

// Provvisorio: accesso minimo alla schermata transazione, sostituito dalla schermata mese nel task 3.2
function MonthPlaceholder({ onOpen }: { onOpen: (tx?: Transaction) => void }) {
  const [txs, setTxs] = useState<Transaction[]>([])

  useEffect(() => {
    transactionsInMonth(monthOf(today())).then(setTxs)
  }, [])

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Kokufin</h1>
      <button
        type="button"
        aria-label="Aggiungi transazione"
        onClick={() => onOpen()}
        className="size-11 rounded bg-primary text-2xl text-white"
      >
        +
      </button>
      <ul>
        {txs.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => onOpen(t)} className="min-h-11 w-full text-left">
              {t.date} · {CATEGORY_NAME.get(t.categoryId)} · {t.kind === 'income' ? '+' : '−'}
              {formatCents(t.amountCents)}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
