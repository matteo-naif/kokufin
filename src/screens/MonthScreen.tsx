import {
  CaretLeftIcon,
  CaretRightIcon,
  GearIcon,
  PlusIcon,
  WarningIcon,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import Tabs from '@/components/Tabs'
import { BUCKETS, CATEGORY_NAME } from '@/config/categories'
import { DEFAULT_SETTINGS, getSettings, type Settings, type Transaction, transactionsInMonth } from '@/data/db'
import { formatCents } from '@/data/money'
import {
  idealCents,
  monthLabel,
  monthOf,
  monthTotals,
  newestFirst,
  shiftMonth,
  today,
} from '@/data/summary'
import CategoryBreakdown from '@/screens/CategoryBreakdown'

export type MonthTab = 'summary' | 'categories'

interface Props {
  month: string // YYYY-MM
  onMonthChange: (month: string) => void
  tab: MonthTab
  onTabChange: (tab: MonthTab) => void
  onOpen: (tx?: Transaction) => void // senza argomento = nuova transazione
  onSettings: () => void
}

const iconButton = 'flex size-11 items-center justify-center rounded'

export default function MonthScreen({ month, onMonthChange, tab, onTabChange, onOpen, onSettings }: Props) {
  const [data, setData] = useState<{ month: string; txs: Transaction[]; settings: Settings } | null>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const currentMonth = monthOf(today())

  useEffect(() => {
    let current = true // ignora risposte arrivate dopo un cambio di mese
    Promise.all([transactionsInMonth(month), getSettings()]).then(([txs, settings]) => {
      if (current) setData({ month, txs, settings })
    })
    return () => {
      current = false
    }
  }, [month])

  const txs = data?.month === month ? data.txs : []
  const settings = data?.settings ?? DEFAULT_SETTINGS
  const totals = monthTotals(txs)

  return (
    // pb-24: spazio sotto l'ultimo movimento, così il FAB non copre l'importo
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4 pb-24">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          {/* aria-live: chi usa lo screen reader sente il nuovo mese dopo le frecce */}
          <h1 aria-live="polite" className="text-2xl font-bold">
            {monthLabel(month)}
          </h1>
          <button
            type="button"
            aria-label="Impostazioni"
            onClick={onSettings}
            className={`${iconButton} border border-border`}
          >
            <GearIcon />
          </button>
        </div>
        <nav aria-label="Mese" className="flex gap-2">
          <button
            ref={prevRef}
            type="button"
            aria-label="Mese precedente"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            className={`${iconButton} border border-border`}
          >
            <CaretLeftIcon />
          </button>
          <button
            type="button"
            aria-label="Mese successivo"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            className={`${iconButton} border border-border`}
          >
            <CaretRightIcon />
          </button>
          {month !== currentMonth && (
            <button
              type="button"
              onClick={() => {
                onMonthChange(currentMonth)
                prevRef.current!.focus() // il pulsante sparisce: il focus non va perso
              }}
              className="min-h-11 rounded border border-border px-4 font-semibold"
            >
              Mese corrente
            </button>
          )}
        </nav>
      </header>

      <Tabs
        label="Vista del mese"
        selected={tab}
        onSelect={(id) => onTabChange(id as MonthTab)}
        tabs={[
          {
            id: 'summary',
            label: 'Riepilogo',
            panel: (
              <div className="flex flex-col gap-6">
              {data && totals.income === 0 && (
                <p className="text-text-secondary">Aggiungi le entrate del mese per vedere quanto puoi spendere.</p>
              )}

              {/* Senza entrate la scala è nulla: niente barre */}
              {data && totals.income > 0 && (
              <ul aria-label="Ripartizione delle entrate" className="flex flex-col gap-6">
                {BUCKETS.map((b) => {
                  const amount = totals.buckets[b.id] // Risparmi: entrate − spese, può essere negativo
                  // Scala unica per i tre bucket: 100% = entrate del mese
                  const share = Math.min(Math.max(amount / totals.income, 0), 1)
                  return (
                    <li key={b.id} className="flex flex-col gap-2">
                      {/* Importo accanto al nome, come il totale accanto al titolo in Categorie */}
                      <div className="flex flex-wrap justify-between gap-x-4">
                        <span className="font-semibold">{b.name}</span>
                        <span className="whitespace-nowrap font-semibold text-text-secondary">{formatCents(amount)}</span>
                      </div>
                      {/* Barra decorativa: importi e sforamento sono scritti in testo */}
                      <div aria-hidden="true" className="relative h-3 rounded bg-separator">
                        <div className="h-full rounded bg-primary" style={{ width: `${share * 100}%` }} />
                        {/* Tacca dell'ideale: più alta della barra, si vede anche sopra il riempimento */}
                        <div
                          className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 bg-text"
                          style={{ left: `${settings.idealPct[b.id]}%` }}
                        />
                      </div>
                      {b.id === 'savings' ? (
                        <SavingsLine saved={amount} pct={settings.idealPct.savings} income={totals.income} />
                      ) : (
                        <IdealLine spent={amount} ideal={idealCents(settings.idealPct[b.id], totals.income)} />
                      )}
                    </li>
                  )
                })}
              </ul>
              )}

              <section className="flex flex-col gap-2">
                <h2 className="text-xl font-bold">Movimenti</h2>
                {data && txs.length === 0 ? (
                  <p className="text-text-secondary">Nessun movimento in questo mese.</p>
                ) : (
                  <ul aria-label="Movimenti" className="flex flex-col divide-y divide-separator">
                    {newestFirst(txs).map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => onOpen(t)}
                          className="flex min-h-11 w-full items-center justify-between gap-4 py-2 text-left"
                        >
                          <span className="flex flex-col">
                            <span>
                              {CATEGORY_NAME.get(t.categoryId)} · {shortDate(t.date)}
                            </span>
                            {t.note && <span className="text-text-secondary">{t.note}</span>}
                          </span>
                          <span className="whitespace-nowrap font-semibold">
                            {t.kind === 'income' ? '+' : '−'}
                            {formatCents(t.amountCents)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              </div>
            ),
          },
          { id: 'categories', label: 'Categorie', panel: <CategoryBreakdown txs={txs} month={month} /> },
        ]}
      />

      <AddFab onClick={() => onOpen()} />
    </main>
  )
}

/** Oltre questa distanza dall'inizio della pagina lo scroll verso il basso stringe il FAB. */
const FAB_COLLAPSE_SCROLL = 100

/**
 * FAB esteso di Material 3 (spec navigation): si stringe al solo "+" scorrendo verso il basso
 * oltre FAB_COLLAPSE_SCROLL e torna esteso scorrendo verso l'alto. Non si nasconde mai.
 */
function AddFab({ onClick }: { onClick: () => void }) {
  const [extended, setExtended] = useState(true)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setExtended(y <= FAB_COLLAPSE_SCROLL || y < lastY)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      // Nome fisso: da stretto l'etichetta non si vede, ma il pulsante resta lo stesso
      aria-label="Aggiungi transazione"
      onClick={onClick}
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] flex h-14 min-w-14 items-center justify-center rounded-2xl bg-primary px-4 font-semibold text-white shadow-lg"
    >
      <PlusIcon />
      <span
        data-testid="fab-label"
        className={`overflow-hidden whitespace-nowrap transition-all duration-200 motion-reduce:transition-none ${
          extended ? 'ml-3 max-w-32 opacity-100' : 'ml-0 max-w-0 opacity-0'
        }`}
      >
        Aggiungi
      </span>
    </button>
  )
}

/** Significato della tacca: quanto resta prima dell'ideale o di quanto lo si è superato. */
function IdealLine({ spent, ideal }: { spent: number; ideal: number }) {
  if (spent < ideal) return <p>Puoi spendere ancora {formatCents(ideal - spent)}</p>
  if (spent === ideal) return <p>Hai raggiunto il limite</p>
  // Lo sforamento è l'unico avviso: testo più icona, mai solo colore
  return (
    <p className="flex items-center gap-1">
      <WarningIcon />
      Hai speso {formatCents(spent - ideal)} in più
    </p>
  )
}

/** Significato della tacca di Risparmi: cita la percentuale, non un obiettivo. Nessuna riga se raggiunta. */
function SavingsLine({ saved, pct, income }: { saved: number; pct: number; income: number }) {
  const target = idealCents(pct, income)
  if (saved >= target) return null
  return (
    <p>
      Ti mancano {formatCents(target - saved)} per il {pct}%
    </p>
  )
}

/** "2026-11-03" → "3 nov". */
function shortDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d))
}
