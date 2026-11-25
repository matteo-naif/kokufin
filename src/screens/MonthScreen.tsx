import {
  ArrowDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  GearIcon,
  type Icon as PhosphorIcon,
  PlusIcon,
  WarningIcon,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import Tabs from '@/components/Tabs'
import { BUCKETS, CATEGORY_NAME } from '@/config/categories'
import { DEFAULT_SETTINGS, getSettings, type Settings, type Transaction, transactionsInMonth } from '@/data/db'
import { formatCents } from '@/data/money'
import {
  type BucketStatus,
  bucketStatus,
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
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          {/* aria-live: chi usa lo screen reader sente il nuovo mese dopo le frecce */}
          <h1 aria-live="polite" className="text-2xl font-bold">
            {monthLabel(month)}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Impostazioni"
              onClick={onSettings}
              className={`${iconButton} border border-border`}
            >
              <GearIcon />
            </button>
            <button
              type="button"
              aria-label="Aggiungi transazione"
              onClick={() => onOpen()}
              className={`${iconButton} bg-primary text-white`}
            >
              <PlusIcon />
            </button>
          </div>
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
              <section aria-label="Entrate" className="flex flex-col gap-1">
                <p className="text-text-secondary">Entrate</p>
                <p className="font-heading text-3xl font-bold">{formatCents(totals.income)}</p>
                {data && totals.income === 0 && (
                  <p className="text-text-secondary">Aggiungi un'entrata per calcolare gli importi ideali dei bucket.</p>
                )}
              </section>

              <ul aria-label="Bucket" className="flex flex-col gap-6">
                {BUCKETS.map((b) => {
                  const amount = totals.buckets[b.id] // Risparmi: entrate − spese, può essere negativo
                  const ideal = idealCents(settings.idealPct[b.id], totals.income)
                  const share = amount <= 0 ? 0 : ideal > 0 ? Math.min(amount / ideal, 1) : 1
                  return (
                    <li key={b.id} className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-x-4">
                        <span className="font-semibold">{b.name}</span>
                        <Status status={bucketStatus(b.id, amount, ideal)} />
                      </div>
                      <p>
                        {formatCents(amount)} {b.id === 'savings' ? 'risparmiati' : 'spesi'} su {formatCents(ideal)} ideali
                      </p>
                      {/* Barra decorativa: importo, ideale e stato sono già scritti sopra */}
                      <div aria-hidden="true" className="h-3 rounded bg-separator">
                        <div className="h-full rounded bg-primary" style={{ width: `${share * 100}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>

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
    </main>
  )
}

const STATUS: Record<BucketStatus, { label: string; Icon: PhosphorIcon }> = {
  onTrack: { label: 'In linea', Icon: CheckIcon },
  goalReached: { label: 'Obiettivo raggiunto', Icon: CheckIcon },
  overCap: { label: 'Sopra il tetto', Icon: WarningIcon },
  belowGoal: { label: "Sotto l'obiettivo", Icon: ArrowDownIcon },
}

/** Stato del bucket: sempre etichetta di testo più icona, mai solo colore. */
function Status({ status }: { status: BucketStatus }) {
  const { label, Icon } = STATUS[status]
  return (
    <span className="flex items-center gap-1">
      <Icon />
      {label}
    </span>
  )
}


/** "2026-11-03" → "3 nov". */
function shortDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d))
}
