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
              <>
              {/* Entrate: il 100% delle barre. Stile dei titoli dei bucket, non un titolo grande */}
              <p className="flex flex-wrap justify-between gap-x-4">
                <span className="font-semibold">Entrate</span>
                <span className="whitespace-nowrap font-semibold text-text-secondary">{formatCents(totals.income)}</span>
              </p>
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
                      {b.id !== 'savings' && (
                        <IdealLine
                          spent={amount}
                          ideal={idealCents(settings.idealPct[b.id], totals.income)}
                          moneyLeft={totals.buckets.savings}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
              </>
              )}

              <section className="flex flex-col gap-2">
                <h2 className="text-xl font-bold">Movimenti</h2>
                {data && txs.length === 0 ? (
                  <p className="text-text-secondary">Nessun movimento in questo mese.</p>
                ) : (
                  // Raggruppati per giorno: il mese è già nel titolo, la data si scrive una volta per giorno
                  <ul aria-label="Movimenti" className="flex flex-col gap-4">
                    {byDay(newestFirst(txs)).map(([date, dayTxs]) => (
                      <li key={date} className="flex flex-col">
                        <h3 id={`day-${date}`} className="text-sm font-bold text-text-secondary">
                          {dayLabel(date)}
                        </h3>
                        <ul aria-labelledby={`day-${date}`} className="flex flex-col divide-y divide-separator">
                          {dayTxs.map((t) => (
                            <li key={t.id}>
                              <button
                                type="button"
                                onClick={() => onOpen(t)}
                                className="flex min-h-11 w-full items-center justify-between gap-4 py-2 text-left"
                              >
                                {/* min-w-0: senza, una parola lunga nella nota allarga la riga oltre lo schermo */}
                                <span className="flex min-w-0 flex-col">
                                  <span>{CATEGORY_NAME.get(t.categoryId)}</span>
                                  {/* Nota intera nella modifica: qui serve solo a riconoscere il movimento */}
                                  {t.note && (
                                    <span className="line-clamp-2 text-sm wrap-break-word text-text-secondary">{t.note}</span>
                                  )}
                                </span>
                                {/* Entrate in verde, uscite neutre: nessun allarme; il segno porta il significato */}
                                <span
                                  className={`whitespace-nowrap font-semibold ${t.kind === 'income' ? 'text-success' : ''}`}
                                >
                                  {t.kind === 'income' ? '+' : '−'}
                                  {formatCents(t.amountCents)}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
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

/**
 * Cosa si può ancora fare nel bucket. Le entrate sono una sola: il residuo è il minore tra
 * il budget del bucket e i soldi rimasti nel mese (moneyLeft = entrate − tutte le spese).
 */
function IdealLine({ spent, ideal, moneyLeft }: { spent: number; ideal: number; moneyLeft: number }) {
  if (spent > ideal) {
    // Lo sforamento è l'unico avviso: testo più icona, mai solo colore
    return (
      <p className="flex items-center gap-1">
        <WarningIcon />
        Hai speso {formatCents(spent - ideal)} in più
      </p>
    )
  }
  if (spent === ideal) return <p>Hai raggiunto il limite</p>
  if (moneyLeft <= 0) return <p>Le entrate del mese sono finite</p>
  return <p>Puoi spendere ancora {formatCents(Math.min(ideal - spent, moneyLeft))}</p>
}

/** Transazioni già ordinate → gruppi consecutivi con la stessa data, nello stesso ordine. */
function byDay(txs: Transaction[]): [string, Transaction[]][] {
  const groups: [string, Transaction[]][] = []
  for (const t of txs) {
    const last = groups.at(-1)
    if (last?.[0] === t.date) last[1].push(t)
    else groups.push([t.date, [t]])
  }
  return groups
}

/** "2026-11-03" → "Martedì 3". */
function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const label = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric' }).format(new Date(y, m - 1, d))
  return label[0].toUpperCase() + label.slice(1)
}
