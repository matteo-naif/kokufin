import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/data/db'
import { categoryTotals, inMonth, monthOf, monthTotals, shiftMonth, today } from '@/data/summary'

let nextId = 1
function tx(date: string, amountCents: number, categoryId: string, kind: Transaction['kind'] = 'expense'): Transaction {
  return { id: nextId++, date, amountCents, kind, categoryId }
}

describe('today', () => {
  it('usa la data locale, non UTC', () => {
    expect(today(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('mese', () => {
  it('si ricava dalla data', () => {
    expect(monthOf('2026-11-25')).toBe('2026-11')
  })

  it('si sposta avanti e indietro, anche tra anni e senza limiti sul passato', () => {
    expect(shiftMonth('2026-11', 1)).toBe('2026-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-11', -240)).toBe('2006-11')
  })

  it('filtra le transazioni del mese', () => {
    const a = tx('2026-11-01', 100, 'groceries')
    const b = tx('2026-11-30', 100, 'groceries')
    const c = tx('2026-10-31', 100, 'groceries')
    const d = tx('2026-12-01', 100, 'groceries')
    expect(inMonth([a, b, c, d], '2026-11')).toEqual([a, b])
  })
})

describe('monthTotals', () => {
  it('somma entrate e spese per bucket', () => {
    const totals = monthTotals([
      tx('2026-11-01', 200000, 'salary', 'income'),
      tx('2026-11-02', 5000, 'extra', 'income'),
      tx('2026-11-03', 60000, 'housing'),
      tx('2026-11-04', 4550, 'groceries'),
      tx('2026-11-05', 3000, 'restaurants'),
      tx('2026-11-06', 50000, 'investments'),
    ])
    expect(totals).toEqual({
      income: 205000,
      buckets: { essentials: 64550, pleasure: 3000, savings: 50000 },
    })
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
      { categoryId: 'restaurants', cents: 5000, pct: 50 },
      { categoryId: 'travel', cents: 4000, pct: 40 },
      { categoryId: 'entertainment', cents: 1000, pct: 10 },
    ])
  })

  it('arrotonda le percentuali a interi senza correggere la somma', () => {
    const thirds = [tx('2026-11-01', 100, 'entertainment'), tx('2026-11-02', 100, 'travel'), tx('2026-11-03', 100, 'gifts')]
    expect(categoryTotals(thirds, 'pleasure').map((r) => r.pct)).toEqual([33, 33, 33])
  })

  it('bucket senza spese → elenco vuoto', () => {
    expect(categoryTotals(txs, 'savings')).toEqual([])
  })
})
