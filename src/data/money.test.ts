import { describe, expect, it } from 'vitest'
import { centsToInput, formatCents, parseAmount } from './money'

describe('parseAmount', () => {
  it.each([
    ['12', 1200],
    ['12,5', 1250],
    ['12,50', 1250],
    ['12.50', 1250],
    [' 0,01 ', 1],
  ])('%s → %i centesimi', (input, cents) => {
    expect(parseAmount(input)).toBe(cents)
  })

  // Spec transactions, scenario "Importo non valido": vuoto, zero o negativo
  it.each(['', '   ', '0', '0,00', '-5', 'abc', '12,345', '1.000,00'])(
    'rifiuta %j',
    (input) => {
      expect(parseAmount(input)).toBeNull()
    },
  )
})

describe('centsToInput', () => {
  it('produce un testo che parseAmount rilegge uguale', () => {
    expect(centsToInput(500)).toBe('5,00')
    expect(centsToInput(1)).toBe('0,01')
    expect(parseAmount(centsToInput(123456))).toBe(123456)
  })
})

describe('formatCents', () => {
  it('formatta in euro all\'italiana', () => {
    expect(formatCents(123456)).toBe('1234,56 €')
    expect(formatCents(5)).toBe('0,05 €')
  })
})
