import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/data/db'
import { categoryTotals, idealCents, inMonth, monthTotals, newestFirst } from '@/features/month/summary'

let nextId = 1
function tx(date: string, amountCents: number, categoryId: string, kind: Transaction['kind'] = 'expense'): Transaction {
  return { id: nextId++, date, amountCents, kind, categoryId }
}

describe('inMonth', () => {
  it('filtra le transazioni del mese', () => {
    const a = tx('2026-11-01', 100, 'groceries')
    const b = tx('2026-11-30', 100, 'groceries')
    const c = tx('2026-10-31', 100, 'groceries')
    const d = tx('2026-12-01', 100, 'groceries')
    expect(inMonth([a, b, c, d], '2026-11')).toEqual([a, b])
  })
})

describe('newestFirst', () => {
  it('ordina dalla più recente, a parità di data per inserimento', () => {
    const a = tx('2026-11-02', 100, 'groceries')
    const b = tx('2026-11-20', 100, 'groceries')
    const c = tx('2026-11-02', 100, 'groceries')
    expect(newestFirst([a, b, c])).toEqual([b, c, a])
  })
})

describe('idealCents', () => {
  it('ideale = percentuale × entrate', () => {
    expect(idealCents(30, 200000)).toBe(60000)
    expect(idealCents(33, 1001)).toBe(330)
    expect(idealCents(50, 0)).toBe(0)
  })
})

describe('monthTotals', () => {
  it('somma entrate e spese; Risparmi = entrate − Essenziali − Piacere', () => {
    const totals = monthTotals([
      tx('2026-11-01', 200000, 'salary', 'income'),
      tx('2026-11-02', 5000, 'extra', 'income'),
      tx('2026-11-03', 60000, 'housing'),
      tx('2026-11-04', 4550, 'groceries'),
      tx('2026-11-05', 3000, 'restaurants'),
    ])
    expect(totals).toEqual({
      income: 205000,
      buckets: { essentials: 64550, pleasure: 3000, savings: 137450 },
    })
  })

  it('esempio della spec: 1800 − 200 − 23 = 1577', () => {
    const totals = monthTotals([
      tx('2026-11-25', 180000, 'salary', 'income'),
      tx('2026-11-25', 20000, 'utilities'),
      tx('2026-11-25', 2300, 'gifts'),
    ])
    expect(totals.buckets.savings).toBe(157700)
  })

  it('il risparmio è negativo se le spese superano le entrate', () => {
    expect(monthTotals([tx('2026-11-01', 10000, 'salary', 'income'), tx('2026-11-02', 12000, 'housing')]).buckets.savings).toBe(-2000)
  })

  it('con nessuna transazione restituisce zeri', () => {
    expect(monthTotals([])).toEqual({
      income: 0,
      buckets: { essentials: 0, pleasure: 0, savings: 0 },
    })
  })
})

describe('categoryTotals', () => {
  const txs = [
    tx('2026-11-01', 200000, 'salary', 'income'),
    tx('2026-11-02', 1000, 'entertainment'),
    tx('2026-11-03', 4200, 'restaurants'),
    tx('2026-11-04', 800, 'restaurants'),
    tx('2026-11-05', 4000, 'travel'),
    tx('2026-11-06', 9999, 'housing'),
  ]

  it('mostra solo le categorie del bucket con spese, dalla più alta', () => {
    expect(categoryTotals(txs, 'pleasure')).toEqual([
      { categoryId: 'restaurants', cents: 5000 },
      { categoryId: 'travel', cents: 4000 },
      { categoryId: 'entertainment', cents: 1000 },
    ])
    expect(categoryTotals(txs, 'essentials')).toEqual([{ categoryId: 'housing', cents: 9999 }])
  })

  it('bucket senza spese → elenco vuoto', () => {
    expect(categoryTotals([tx('2026-11-01', 100, 'gifts')], 'essentials')).toEqual([])
  })
})
