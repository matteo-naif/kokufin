import { useState } from 'react'
import { BUCKETS, CATEGORY_NAME, type SpendingBucket } from '@/config/categories'
import type { Transaction } from '@/data/db'
import { formatCents } from '@/data/money'
import { categoryTotals, monthLabel } from '@/data/summary'

// Risparmi non ha categorie: si calcola dalle entrate
const SPENDING_BUCKETS = BUCKETS.filter((b): b is { id: SpendingBucket; name: string } => b.id !== 'savings')

interface Props {
  txs: Transaction[] // transazioni del mese
  month: string // YYYY-MM
}

/** Ripartizione per categoria: segue le "Regole per i grafici" di design.md. */
export default function CategoryBreakdown({ txs, month }: Props) {
  const [bucket, setBucket] = useState<SpendingBucket>('essentials')
  const bucketName = SPENDING_BUCKETS.find((b) => b.id === bucket)!.name
  const rows = categoryTotals(txs, bucket)
  const total = rows.reduce((sum, r) => sum + r.cents, 0)

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 font-semibold">Bucket</legend>
        <div className="flex flex-wrap gap-x-6">
          {SPENDING_BUCKETS.map((b) => (
            <label key={b.id} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="breakdown-bucket"
                checked={bucket === b.id}
                onChange={() => setBucket(b.id)}
                className="size-5 accent-primary"
              />
              {b.name}
            </label>
          ))}
        </div>
      </fieldset>

      {rows.length === 0 ? (
        <p className="text-text-secondary">
          Nessuna spesa in {bucketName} a {monthLabel(month)}.
        </p>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            {/* Il titolo riporta la conclusione, non l'argomento */}
            <h2 className="text-xl font-bold">
              In {bucketName} pesa di più {CATEGORY_NAME.get(rows[0].categoryId)}: {rows[0].pct}%
            </h2>
            <p className="text-text-secondary">
              {bucketName} · {monthLabel(month)}
            </p>
          </div>

          {/* Spazio tra le righe (gap-4) maggiore di quello tra testo e barra (gap-1): prossimità */}
          <ul aria-label={`Ripartizione di ${bucketName}`} className="flex flex-col gap-4">
            {rows.map((r, i) => (
              <li key={r.categoryId} className="flex flex-col gap-1">
                <div className="flex flex-wrap justify-between gap-x-4">
                  <span>{CATEGORY_NAME.get(r.categoryId)}</span>
                  <span className="whitespace-nowrap">
                    {formatCents(r.cents)} · {r.pct}%
                  </span>
                </div>
                {/* Barra decorativa: scala fissa, 100% = totale del bucket */}
                <div aria-hidden="true">
                  <div
                    className={`h-3 ${i === 0 ? 'bg-chart-strong' : 'bg-chart-soft'}`}
                    style={{ width: `${(r.cents / total) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
