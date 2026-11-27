import { useEffect, useState } from 'react'
import { Redirect, Route, Router, Switch, useLocation, useParams } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import IconProvider from '@/components/IconProvider'
import Toaster from '@/components/Toaster'
import { db, type Transaction } from '@/data/db'
import BackupScreen from '@/features/backup/BackupScreen'
import MonthScreen, { type MonthTab } from '@/features/month/MonthScreen'
import PreferencesScreen from '@/features/settings/PreferencesScreen'
import SettingsScreen from '@/features/settings/SettingsScreen'
import TransactionForm from '@/features/transactions/TransactionForm'
import { monthOf, today } from '@/lib/dates'

// Indirizzi con # (useHashLocation): l'APK carica l'app da file locali, senza server
function App() {
  return (
    <IconProvider>
      <Router hook={useHashLocation}>
        <Views />
        {/* Fuori dalle viste: il toast resta visibile quando si torna al mese */}
        <Toaster />
      </Router>
    </IconProvider>
  )
}

/**
 * State delle voci di cronologia aperte dall'app: quanti passi indietro si trova il mese,
 * oppure null se il mese non è nella cronologia (vista aperta direttamente dall'indirizzo).
 * Le voci aperte dall'indirizzo non hanno state.
 */
interface NavState {
  monthDepth: number | null
}

const navState = () => history.state as NavState | null

function Views() {
  const [location, navigate] = useLocation()
  // Mese e tab scelti restano gli stessi quando si torna da una vista secondaria
  const [month, setMonth] = useState(() => monthOf(today()))
  const [tab, setTab] = useState<MonthTab>('summary')

  const open = (path: string) => {
    const depth = navState()?.monthDepth
    const state: NavState = { monthDepth: location === '/' ? 1 : depth ? depth + 1 : null }
    navigate(path, { state })
  }
  // Ritorno al mese dopo Salva, Elimina o ripristino. Se il mese è nella cronologia si torna indietro
  // fino a lui, così Indietro non riapre le viste; altrimenti si sostituisce la voce attuale.
  const toMonth = () => {
    const depth = navState()?.monthDepth
    if (depth) history.go(-depth)
    else navigate('/', { replace: true })
  }
  // Freccia indietro: come il tasto Indietro. Se la vista è stata aperta direttamente
  // dall'indirizzo si sostituisce la voce con la vista madre.
  const up = (parent: string) => (navState() ? history.back() : navigate(parent, { replace: true }))

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
        <TransactionForm onDone={toMonth} onBack={() => up('/')} />
      </Route>
      <Route path="/transactions/:id">
        <EditTransaction onDone={toMonth} onBack={() => up('/')} />
      </Route>
      <Route path="/settings">
        <SettingsScreen onOpen={open} onBack={() => up('/')} />
      </Route>
      <Route path="/settings/preferences">
        <PreferencesScreen onSaved={toMonth} onBack={() => up('/settings')} />
      </Route>
      <Route path="/settings/backup">
        <BackupScreen onRestored={toMonth} onBack={() => up('/settings')} />
      </Route>
      <Route>
        <Redirect to="/" replace />
      </Route>
    </Switch>
  )
}

/** Carica la transazione dell'indirizzo; se non esiste (per esempio eliminata) torna al mese. */
function EditTransaction(props: { onDone: () => void; onBack: () => void }) {
  const { id } = useParams<{ id: string }>()
  // undefined = in caricamento, null = inesistente
  const [tx, setTx] = useState<Transaction | null>()

  useEffect(() => {
    // Un id non numerico non è una chiave valida per IndexedDB
    const load = /^\d+$/.test(id) ? db.transactions.get(Number(id)) : Promise.resolve(undefined)
    load.then((t) => setTx(t ?? null))
  }, [id])

  if (tx === null) return <Redirect to="/" replace />
  // key: passando a un'altra transazione il form riparte dai suoi valori (defaultValues vale solo al montaggio)
  return tx ? <TransactionForm key={tx.id} transaction={tx} {...props} /> : null
}

export default App
