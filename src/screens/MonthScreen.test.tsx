// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import IconProvider from '@/components/IconProvider'
import { db, type Transaction } from '@/data/db'
import MonthScreen, { type MonthTab } from '@/screens/MonthScreen'

beforeAll(() => {
  // Solo Date: timer veri per Dexie e user-event
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 25))
})
afterAll(() => vi.useRealTimers())

beforeEach(async () => {
  await db.transactions.clear()
  await db.settings.clear()
})
afterEach(cleanup)

function add(date: string, amountCents: number, categoryId: string, kind: Transaction['kind'] = 'expense') {
  return db.transactions.add({ date, amountCents, kind, categoryId })
}

// Il mese selezionato vive nel genitore, come in App
function Harness({ onOpen = () => {} }: { onOpen?: (tx?: Transaction) => void }) {
  const [month, setMonth] = useState('2026-11')
  const [tab, setTab] = useState<MonthTab>('summary')
  return <MonthScreen month={month} onMonthChange={setMonth} tab={tab} onTabChange={setTab} onOpen={onOpen} onSettings={() => {}} />
}

async function setup(onOpen?: (tx?: Transaction) => void) {
  render(<Harness onOpen={onOpen} />, { wrapper: IconProvider })
  await screen.findByRole('list', { name: 'Bucket' })
  return userEvent.setup()
}

function income() {
  return screen.getByRole('region', { name: 'Entrate' }).textContent
}

function bucket(name: string) {
  const list = screen.getByRole('list', { name: 'Bucket' })
  return within(list).getAllByRole('listitem').find((li) => li.textContent!.startsWith(name))!
}

describe('MonthScreen', () => {
  it('ha un solo h1 con il mese, e le regioni main e nav', async () => {
    await setup()
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Novembre 2026'])
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('navigation')).toBeTruthy()
  })

  it('le frecce cambiano mese senza limiti sul passato e mostrano i dati del mese scelto', async () => {
    await add('2026-10-10', 300000, 'salary', 'income')
    await add('2026-11-10', 100000, 'salary', 'income')
    const user = await setup()
    await vi.waitFor(() => expect(income()).toContain('1000,00'))

    await user.click(screen.getByRole('button', { name: 'Mese precedente' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Ottobre 2026' })).toBeTruthy()
    await vi.waitFor(() => expect(income()).toContain('3000,00'))

    for (let i = 0; i < 24; i++) await user.click(screen.getByRole('button', { name: 'Mese precedente' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Ottobre 2024' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Mese successivo' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Novembre 2024' })).toBeTruthy()
  })

  it('"Mese corrente" compare solo fuori dal mese corrente e riporta a oggi', async () => {
    const user = await setup()
    expect(screen.queryByRole('button', { name: 'Mese corrente' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Mese precedente' }))
    await user.click(screen.getByRole('button', { name: 'Mese precedente' }))
    await user.click(screen.getByRole('button', { name: 'Mese corrente' }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Novembre 2026')
    expect(screen.queryByRole('button', { name: 'Mese corrente' })).toBeNull()
    // il pulsante sparisce: il focus non va perso
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Mese precedente' }))
  })

  it('Essenziali sopra il tetto: etichetta, icona e testo con speso e ideale', async () => {
    await add('2026-11-01', 100000, 'salary', 'income') // ideale Essenziali 30% = 300 €
    await add('2026-11-02', 35000, 'housing')
    await setup()

    const item = await vi.waitFor(() => {
      const li = bucket('Essenziali')
      if (!li.textContent!.includes('350,00')) throw new Error('dati non ancora caricati')
      return li
    })
    expect(item.textContent).toContain('Sopra il tetto')
    expect(item.textContent).toContain('350,00 € spesi su 300,00 € ideali')
    expect(item.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
  })

  it('Risparmi calcolato: entrate − Essenziali − Piacere (esempio della spec)', async () => {
    await add('2026-11-25', 180000, 'salary', 'income')
    await add('2026-11-25', 20000, 'utilities')
    await add('2026-11-25', 2300, 'gifts')
    await setup()

    await vi.waitFor(() => expect(bucket('Risparmi').textContent).toContain('1577,00\u00a0€ risparmiati su 900,00\u00a0€ ideali'))
    expect(bucket('Risparmi').textContent).toContain('Obiettivo raggiunto')
    expect(bucket('Essenziali').textContent).toContain('200,00\u00a0€ spesi')
  })

  it('Risparmi sotto l\'obiettivo', async () => {
    await add('2026-11-01', 100000, 'salary', 'income') // ideale Risparmi 50% = 500 €
    await add('2026-11-02', 60000, 'housing') // risparmio 400 €
    await setup()

    await vi.waitFor(() => expect(bucket('Risparmi').textContent).toContain('Sotto l\'obiettivo'))
    expect(bucket('Risparmi').textContent).toContain('400,00\u00a0€ risparmiati')
  })

  it('Risparmi negativo: segno meno, barra vuota, sotto l\'obiettivo', async () => {
    await add('2026-11-01', 10000, 'salary', 'income')
    await add('2026-11-02', 12000, 'housing')
    await setup()

    await vi.waitFor(() => expect(bucket('Risparmi').textContent).toContain('-20,00\u00a0€ risparmiati'))
    expect(bucket('Risparmi').textContent).toContain('Sotto l\'obiettivo')
    expect(bucket('Risparmi').querySelector<HTMLElement>('[aria-hidden="true"] > div')!.style.width).toBe('0%')
  })

  it('usa le percentuali salvate nelle impostazioni', async () => {
    await db.settings.put({ id: 'default', idealPct: { essentials: 50, pleasure: 30, savings: 20 }, soundsEnabled: true })
    await add('2026-11-01', 100000, 'salary', 'income')
    await setup()
    await vi.waitFor(() => expect(bucket('Essenziali').textContent).toContain('su 500,00 € ideali'))
  })

  it('senza entrate mostra l\'invito ad aggiungerne una', async () => {
    await setup()
    expect(await screen.findByText(/Aggiungi un'entrata/)).toBeTruthy()
  })

  it('elenca i movimenti del mese dal più recente', async () => {
    await add('2026-11-03', 1000, 'groceries')
    await add('2026-11-20', 2000, 'restaurants')
    await add('2026-11-10', 3000, 'travel')
    await add('2026-10-31', 4000, 'gifts')
    await setup()

    const list = await screen.findByRole('list', { name: 'Movimenti' })
    await vi.waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(3))
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent!.split('·')[0].trim())).toEqual([
      'Ristoranti',
      'Viaggi',
      'Spesa alimentare',
    ])
  })

  it('il tab Categorie mostra la ripartizione dello stesso mese, con intestazione e frecce visibili', async () => {
    await add('2026-10-05', 2500, 'restaurants')
    const user = await setup()
    await user.click(screen.getByRole('button', { name: 'Mese precedente' }))
    await user.click(screen.getByRole('tab', { name: 'Categorie' }))
    await user.click(screen.getByRole('radio', { name: 'Piacere' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'In Piacere pesa di più Ristoranti: 100%' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ottobre 2026')
    expect(screen.getByRole('button', { name: 'Aggiungi transazione' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Mese successivo' }))
    expect(await screen.findByText('Nessuna spesa in Piacere a Novembre 2026.')).toBeTruthy()
  })

  it('"+" apre una nuova transazione e un movimento apre la modifica', async () => {
    const id = await add('2026-11-03', 1000, 'groceries')
    const onOpen = vi.fn()
    const user = await setup(onOpen)

    await user.click(screen.getByRole('button', { name: 'Aggiungi transazione' }))
    expect(onOpen).toHaveBeenLastCalledWith()

    await user.click(await screen.findByRole('button', { name: /Spesa alimentare/ }))
    expect(onOpen).toHaveBeenLastCalledWith(expect.objectContaining({ id }))
  })
})
