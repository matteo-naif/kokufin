// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { Transaction } from '@/data/db'
import CategoryBreakdown from '@/screens/CategoryBreakdown'

afterEach(cleanup)

let nextId = 1
function tx(amountCents: number, categoryId: string, kind: Transaction['kind'] = 'expense'): Transaction {
  return { id: nextId++, date: '2026-11-10', amountCents, kind, categoryId }
}

const NOVEMBER = [
  tx(200000, 'salary', 'income'),
  tx(4200, 'restaurants'),
  tx(800, 'restaurants'),
  tx(4000, 'travel'),
  tx(1000, 'entertainment'),
  tx(9999, 'housing'),
]

function rows() {
  return within(screen.getByRole('list', { name: /Ripartizione/ })).getAllByRole('listitem')
}

function bars() {
  return rows().map((li) => li.querySelector<HTMLElement>('[aria-hidden="true"] > div')!)
}

async function choose(bucket: string) {
  await userEvent.setup().click(screen.getByRole('radio', { name: bucket }))
}

describe('CategoryBreakdown', () => {
  it('mostra solo le categorie del bucket scelto con spese, dalla più alta', async () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    await choose('Piacere')
    expect(rows().map((li) => li.querySelector('span')!.textContent)).toEqual(['Ristoranti', 'Viaggi', 'Svago'])
  })

  it('barre da zero, larghezza = quota sul totale del bucket', async () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    await choose('Piacere')
    expect(bars().map((b) => b.style.width)).toEqual(['50%', '40%', '10%'])
  })

  it('il titolo dice il messaggio, sotto bucket e mese', async () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    await choose('Piacere')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('In Piacere pesa di più Ristoranti: 50%')
    expect(screen.getByText('Piacere · Novembre 2026')).toBeTruthy()
  })

  it('etichette dirette: nome, importo e percentuale su ogni riga, barra nascosta allo screen reader', async () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    await choose('Piacere')
    expect(rows()[1].textContent).toBe('Viaggi40,00 € · 40%')
    for (const li of rows()) expect(li.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('prima barra #5C3A21, le altre #B07C52', async () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    await choose('Piacere')
    expect(bars().map((b) => b.className.includes('bg-chart-strong'))).toEqual([true, false, false])
    expect(bars().map((b) => b.className.includes('bg-chart-soft'))).toEqual([false, true, true])
  })

  it('bucket senza spese: stato vuoto al posto del grafico', async () => {
    render(<CategoryBreakdown txs={[tx(500, 'gifts')]} month="2026-11" />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('Nessuna spesa in Essenziali a Novembre 2026.')).toBeTruthy()
  })

  it('offre solo i bucket di spesa: Risparmi non ha categorie', () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    expect(screen.getAllByRole('radio').map((r) => r.closest('label')!.textContent)).toEqual(['Essenziali', 'Piacere'])
  })

  it('si aggiorna quando cambiano mese e transazioni', async () => {
    const { rerender } = render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    await choose('Piacere')
    rerender(<CategoryBreakdown txs={[tx(500, 'gifts')]} month="2026-10" />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('In Piacere pesa di più Regali: 100%')
    expect(screen.getByText('Piacere · Ottobre 2026')).toBeTruthy()
  })

  it('di default mostra Essenziali', () => {
    render(<CategoryBreakdown txs={NOVEMBER} month="2026-11" />)
    expect(screen.getByRole('radio', { name: 'Essenziali', checked: true })).toBeTruthy()
  })
})
