import { type Bucket, EXPENSE_CATEGORIES } from '@/config/categories'
import type { Transaction } from '@/data/db'

const BUCKET_OF = new Map(EXPENSE_CATEGORIES.map((c) => [c.id, c.bucket]))

/** Data locale di oggi in formato `YYYY-MM-DD`. */
export function today(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** `YYYY-MM-DD` → `YYYY-MM`. */
export function monthOf(date: string): string {
  return date.slice(0, 7)
}

/** Sposta un mese `YYYY-MM` di `delta` mesi. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const index = y * 12 + (m - 1) + delta
  const year = Math.floor(index / 12)
  return `${year}-${String((index % 12) + 1).padStart(2, '0')}`
}

export function inMonth(txs: Transaction[], month: string): Transaction[] {
  return txs.filter((t) => monthOf(t.date) === month)
}

export interface MonthTotals {
  income: number
  buckets: Record<Bucket, number>
}

/** Totali in centesimi: entrate e spese per bucket. */
export function monthTotals(txs: Transaction[]): MonthTotals {
  const totals: MonthTotals = { income: 0, buckets: { essentials: 0, pleasure: 0, savings: 0 } }
  for (const t of txs) {
    if (t.kind === 'income') totals.income += t.amountCents
    else totals.buckets[BUCKET_OF.get(t.categoryId)!] += t.amountCents
  }
  return totals
}

export interface CategoryTotal {
  categoryId: string
  cents: number
  pct: number // quota intera sul totale del bucket
}

/** Categorie del bucket con spese, dalla più alta. */
export function categoryTotals(txs: Transaction[], bucket: Bucket): CategoryTotal[] {
  const sums = new Map<string, number>()
  for (const t of txs) {
    if (t.kind === 'expense' && BUCKET_OF.get(t.categoryId) === bucket) {
      sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amountCents)
    }
  }
  const total = [...sums.values()].reduce((a, b) => a + b, 0)
  return [...sums]
    .map(([categoryId, cents]) => ({ categoryId, cents, pct: Math.round((cents / total) * 100) }))
    .sort((a, b) => b.cents - a.cents)
}
