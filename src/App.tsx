import { useState } from 'react'
import type { Transaction } from '@/data/db'
import { monthOf, today } from '@/data/summary'
import MonthScreen from '@/screens/MonthScreen'
import TransactionForm from '@/screens/TransactionForm'

// null = schermata del mese; undefined dentro form = nuova transazione
type View = null | { form: Transaction | undefined }

function App() {
  const [view, setView] = useState<View>(null)
  // Il mese scelto resta lo stesso quando si torna dalla schermata transazione
  const [month, setMonth] = useState(() => monthOf(today()))

  if (view) return <TransactionForm transaction={view.form} onDone={() => setView(null)} />
  return <MonthScreen month={month} onMonthChange={setMonth} onOpen={(tx) => setView({ form: tx })} />
}

export default App
