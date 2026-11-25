// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Transaction } from '@/data/db'
import CategoryBreakdown from '@/screens/CategoryBreakdown'

afterEach(cleanup)

let nextId = 1
function tx(amountCents: number, categoryId: string, kind: Transaction['kind'] = 'expense'): Transaction {
  return { id: nextId++, date: '2026-11-10', amountCents, kind, categoryId }
}

// Spese del mese: 20000. Essenziali 10000 (Casa (affitto/mutuo)), Piacere 10000
const NOVEMBER = [
  tx(200000, 'salary', 'income'),
  tx(4200, 'restaurants'),
  tx(800, 'restaurants'),
  tx(4000, 'travel'),
  tx(1000, 'entertainment'),
  tx(10000, 'housing'),
]

function section(name: string) {
  return screen.getByRole('region', { name })
}

function rows(name: string) {
  return within(section(name)).getAllByRole('listitem')
}

function bars(name: string) {
  return rows(name).map((li) => li.querySelector<HTMLElement>('[aria-hidden="true"] > div')!)
}

describe('CategoryBreakdown', () => {
  it('una sola vista: Essenziali e poi Piacere, ognuna con un titolo, senza controlli per scegliere', () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Essenziali', 'Piacere'])
    expect(screen.queryByRole('radio')).toBeNull()
  })

  it('ogni sezione mostra solo le sue categorie con spese, dalla più alta', () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    expect(rows('Piacere').map((li) => li.querySelector('span')!.textContent)).toEqual(['Ristoranti', 'Viaggi', 'Svago'])
    expect(rows('Essenziali').map((li) => li.querySelector('span')!.textContent)).toEqual(['Casa (affitto/mutuo)'])
  })

  it('accanto al titolo: totale speso nel bucket', () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    expect(within(section('Piacere')).getByText('100,00 €')).toBeTruthy()
  })

  it('barre da zero, larghezza = quota sulle spese totali del mese, uguale in tutte le sezioni', () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    expect(bars('Piacere').map((b) => b.style.width)).toEqual(['25%', '20%', '5%'])
    expect(bars('Essenziali').map((b) => b.style.width)).toEqual(['50%'])
  })

  it('etichette dirette: nome e importo su ogni riga, senza percentuali, barra nascosta allo screen reader', () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    expect(rows('Piacere')[1].textContent).toBe('Viaggi40,00\u00a0€')
    for (const li of [...rows('Essenziali'), ...rows('Piacere')]) expect(li.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('solo la categoria più alta del mese è #5C3A21, le altre #B07C52', () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    expect(bars('Essenziali').map((b) => b.className.includes('bg-chart-strong'))).toEqual([true])
    expect(bars('Piacere').map((b) => b.className.includes('bg-chart-soft'))).toEqual([true, true, true])
  })

  it('sezione senza spese: resta con titolo e "Nessuna spesa."', () => {
    render(<CategoryBreakdown txs={[tx(500, 'gifts')]} month="2026-11" />)
    expect(within(section('Essenziali')).getByText('Nessuna spesa.')).toBeTruthy()
    expect(within(section('Essenziali')).getByText('0,00 €')).toBeTruthy()
    expect(rows('Piacere')).toHaveLength(1)
  })

  it('mese senza spese: un solo stato vuoto al posto delle sezioni', () => {
    render(<CategoryBreakdown txs={[tx(200000, 'salary', 'income')]} month="2026-11" />)
    expect(screen.queryByRole('region')).toBeNull()
    expect(screen.getByText('Nessuna spesa a Novembre 2026.')).toBeTruthy()
  })

  it('si aggiorna quando cambiano mese e transazioni', () => {
    const { rerender } = render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    rerender(<CategoryBreakdown txs={[tx(500, 'gifts')]} month="2026-10" />)
    expect(rows('Piacere')[0].textContent).toBe('Regali5,00\u00a0€')
    rerender(<CategoryBreakdown txs={[]} month="2026-09" />)
    expect(screen.getByText('Nessuna spesa a Settembre 2026.')).toBeTruthy()
  })
})
