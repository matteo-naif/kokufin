import { CATEGORY_NAME, SPENDING_BUCKETS } from '@/config/categories'
import type { Transaction } from '@/data/db'
import { formatCents } from '@/data/money'
import { categoryTotals, monthLabel, monthTotals } from '@/data/summary'

interface Props {
  txs: Transaction[] // transazioni del mese
  month: string // YYYY-MM
}

/**
 * Ripartizione per categoria: segue le "Regole per i grafici" di design.md.
 * Una sola scala per tutta la vista: 100% = spese totali del mese.
 */
export default function CategoryBreakdown({ txs, month }: Props) {
  const totals = monthTotals(txs)
  const spent = totals.buckets.essentials + totals.buckets.pleasure

  if (spent === 0) return <p className="text-text-secondary">Nessuna spesa a {monthLabel(month)}.</p>

  const sections = SPENDING_BUCKETS.map((b) => ({ ...b, cents: totals.buckets[b.id], rows: categoryTotals(txs, b.id) }))
  // Categoria più alta del mese, l'unica con la tinta scura
  const top = sections.flatMap((s) => s.rows).reduce((a, b) => (b.cents > a.cents ? b : a)).categoryId

  return (
    <div className="flex flex-col gap-8">
      {sections.map((s) => (
        <section key={s.id} aria-labelledby={`breakdown-${s.id}`} className="flex flex-col gap-4">
          {/* Linea sotto la riga del titolo: guida l'occhio dal nome del bucket al totale */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-separator pb-2">
            <h2 id={`breakdown-${s.id}`} className="text-xl font-bold">
              {s.name}
            </h2>
            <p className="whitespace-nowrap font-semibold text-text-secondary">{formatCents(s.cents)}</p>
          </div>

          {s.rows.length === 0 ? (
            <p className="text-text-secondary">Nessuna spesa.</p>
          ) : (
            // Spazio tra le righe (gap-4) maggiore di quello tra testo e barra (gap-1): prossimità
            <ul aria-label={`Ripartizione di ${s.name}`} className="flex flex-col gap-4">
              {s.rows.map((r) => (
                <li key={r.categoryId} className="flex flex-col gap-1">
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <span>{CATEGORY_NAME.get(r.categoryId)}</span>
                    <span className="whitespace-nowrap">{formatCents(r.cents)}</span>
                  </div>
                  {/* Barra decorativa: scala fissa, 100% = spese totali del mese */}
                  <div aria-hidden="true">
                    <div
                      className={`h-3 ${r.categoryId === top ? 'bg-chart-strong' : 'bg-chart-soft'}`}
                      style={{ width: `${(r.cents / spent) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
