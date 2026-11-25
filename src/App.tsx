import { useState } from 'react'
import type { Transaction } from '@/data/db'
import { monthOf, today } from '@/data/summary'
import MonthScreen, { type MonthTab } from '@/screens/MonthScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import TransactionForm from '@/screens/TransactionForm'

// null = schermata del mese; undefined dentro form = nuova transazione
type View = null | 'settings' | { form: Transaction | undefined }

function App() {
  const [view, setView] = useState<View>(null)
  // Mese e tab scelti restano gli stessi quando si torna dalla schermata transazione
  const [month, setMonth] = useState(() => monthOf(today()))
  const [tab, setTab] = useState<MonthTab>('summary')

  if (view === 'settings') return <SettingsScreen onDone={() => setView(null)} />
  if (view) return <TransactionForm transaction={view.form} onDone={() => setView(null)} />
  return (
    <MonthScreen
      month={month}
      onMonthChange={setMonth}
      tab={tab}
      onTabChange={setTab}
      onOpen={(tx) => setView({ form: tx })}
      onSettings={() => setView('settings')}
    />
  )
}

export default App
