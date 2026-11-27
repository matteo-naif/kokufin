import { describe, expect, it } from 'vitest'
import { monthLabel, monthOf, shiftMonth, today } from '@/lib/dates'

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
})

describe('monthLabel', () => {
  it('mostra mese e anno in italiano con l\'iniziale maiuscola', () => {
    expect(monthLabel('2026-11')).toBe('Novembre 2026')
    expect(monthLabel('2027-01')).toBe('Gennaio 2027')
  })
})
