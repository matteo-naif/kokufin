import { useEffect, useState } from 'react'
import { Redirect, Route, Router, Switch, useLocation, useParams } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import Toaster from '@/components/Toaster'
import { db, type Transaction } from '@/data/db'
import { monthOf, today } from '@/data/summary'
import MonthScreen, { type MonthTab } from '@/screens/MonthScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import TransactionForm from '@/screens/TransactionForm'

// Indirizzi con # (useHashLocation): l'APK carica l'app da file locali, senza server
function App() {
  return (
    <Router hook={useHashLocation}>
      <Views />
      {/* Fuori dalle viste: il toast resta visibile quando si torna al mese */}
      <Toaster />
    </Router>
  )
}

/** State delle voci di cronologia aperte dal mese: al ritorno basta tornare indietro. */
const FROM_MONTH = { fromMonth: true }

function Views() {
  const [, navigate] = useLocation()
  // Mese e tab scelti restano gli stessi quando si torna da una vista secondaria
  const [month, setMonth] = useState(() => monthOf(today()))
  const [tab, setTab] = useState<MonthTab>('summary')

  const open = (path: string) => navigate(path, { state: FROM_MONTH })
  // Ritorno al mese dopo Salva, Annulla o Elimina. Se la vista è stata aperta dal mese si torna
  // indietro, così Indietro non la riapre; se è stata aperta direttamente si sostituisce la voce.
  const done = () => (history.state?.fromMonth ? history.back() : navigate('/', { replace: true }))

  return (
    <Switch>
      <Route path="/">
        <MonthScreen
          month={month}
          onMonthChange={setMonth}
          tab={tab}
          onTabChange={setTab}
          onOpen={(tx) => open(tx ? `/transactions/${tx.id}` : '/transactions/new')}
          onSettings={() => open('/settings')}
        />
      </Route>
      <Route path="/transactions/new">
        <TransactionForm onDone={done} />
      </Route>
      <Route path="/transactions/:id">
        <EditTransaction onDone={done} />
      </Route>
      <Route path="/settings">
        <SettingsScreen onDone={done} />
      </Route>
      <Route>
        <Redirect to="/" replace />
      </Route>
    </Switch>
  )
}

/** Carica la transazione dell'indirizzo; se non esiste (per esempio eliminata) torna al mese. */
function EditTransaction({ onDone }: { onDone: () => void }) {
  const { id } = useParams<{ id: string }>()
  // undefined = in caricamento, null = inesistente
  const [tx, setTx] = useState<Transaction | null>()

  useEffect(() => {
    // Un id non numerico non è una chiave valida per IndexedDB
    const load = /^\d+$/.test(id) ? db.transactions.get(Number(id)) : Promise.resolve(undefined)
    load.then((t) => setTx(t ?? null))
  }, [id])

  if (tx === null) return <Redirect to="/" replace />
  return tx ? <TransactionForm transaction={tx} onDone={onDone} /> : null
}

export default App
