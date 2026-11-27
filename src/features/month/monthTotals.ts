import { type Bucket, EXPENSE_CATEGORIES, type SpendingBucket } from '@/config/categories'
import { monthOf } from '@/data/dates'
import type { Transaction } from '@/data/db'

const BUCKET_OF = new Map(EXPENSE_CATEGORIES.map((c) => [c.id, c.bucket]))

/** Dalla più recente; a parità di data, l'ultima inserita prima. */
export function newestFirst(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
}

/** Ideale del bucket in centesimi: percentuale × entrate del mese. */
export function idealCents(pct: number, incomeCents: number): number {
  return Math.round((pct * incomeCents) / 100)
}

export function inMonth(txs: Transaction[], month: string): Transaction[] {
  return txs.filter((t) => monthOf(t.date) === month)
}

export interface MonthTotals {
  income: number
  /** Essenziali e Piacere: speso. Risparmi: entrate − speso, può essere negativo. */
  buckets: Record<Bucket, number>
}

/** Totali del mese in centesimi. */
export function monthTotals(txs: Transaction[]): MonthTotals {
  const spent: Record<SpendingBucket, number> = { essentials: 0, pleasure: 0 }
  let income = 0
  for (const t of txs) {
    if (t.kind === 'income') income += t.amountCents
    else spent[BUCKET_OF.get(t.categoryId)!] += t.amountCents
  }
  return { income, buckets: { ...spent, savings: income - spent.essentials - spent.pleasure } }
}

export interface CategoryTotal {
  categoryId: string
  cents: number
}

/** Categorie del bucket con spese, dalla più alta. */
export function categoryTotals(txs: Transaction[], bucket: SpendingBucket): CategoryTotal[] {
  const sums = new Map<string, number>()
  for (const t of txs) {
    if (t.kind === 'expense' && BUCKET_OF.get(t.categoryId) === bucket) {
      sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amountCents)
    }
  }
  return [...sums]
    .map(([categoryId, cents]) => ({ categoryId, cents }))
    .sort((a, b) => b.cents - a.cents)
}
