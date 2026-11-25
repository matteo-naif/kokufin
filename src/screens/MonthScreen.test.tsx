// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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
  // Dati caricati: con entrate compaiono i bucket, senza entrate solo l'invito
  await vi.waitFor(() =>
    expect(screen.queryByRole('list', { name: 'Bucket' }) ?? screen.queryByText(/Aggiungi un'entrata/)).toBeTruthy(),
  )
  return userEvent.setup()
}

function bucket(name: string) {
  const list = screen.getByRole('list', { name: 'Bucket' })
  return within(list).getAllByRole('listitem').find((li) => li.textContent!.startsWith(name))!
}

/** Barra decorativa del bucket: riempimento e tacca dell'ideale. */
function bar(name: string) {
  const [fill, ideal] = bucket(name).querySelectorAll<HTMLElement>('[aria-hidden="true"] > div')
  return { fill, ideal }
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
    await vi.waitFor(() => expect(bucket('Risparmi').textContent).toContain('1000,00'))

    await user.click(screen.getByRole('button', { name: 'Mese precedente' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Ottobre 2026' })).toBeTruthy()
    await vi.waitFor(() => expect(bucket('Risparmi').textContent).toContain('3000,00'))

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

  it('Essenziali entro l\'ideale: speso, quanto resta, nessuna icona', async () => {
    await add('2026-11-01', 100000, 'salary', 'income') // ideale Essenziali 30% = 300 €
    await add('2026-11-02', 20000, 'housing')
    await setup()

    await vi.waitFor(() => expect(bucket('Essenziali').textContent).toContain('Essenziali200,00\u00a0€'))
    expect(bucket('Essenziali').textContent).toContain('Hai a disposizione ancora 100,00\u00a0€')
    expect(bucket('Essenziali').querySelector('svg')).toBeNull()
  })

  it('Essenziali oltre l\'ideale: speso, sforamento e icona di avviso', async () => {
    await add('2026-11-01', 100000, 'salary', 'income') // ideale Essenziali 30% = 300 €
    await add('2026-11-02', 35000, 'housing')
    await setup()

    await vi.waitFor(() => expect(bucket('Essenziali').textContent).toContain('Essenziali350,00\u00a0€'))
    expect(bucket('Essenziali').textContent).toContain('Hai sforato di 50,00\u00a0€')
    expect(bucket('Essenziali').querySelector('svg[aria-hidden="true"]')).toBeTruthy()
  })

  it('Risparmi calcolato: entrate − Essenziali − Piacere, accanto al nome e senza riga sotto', async () => {
    await add('2026-11-25', 180000, 'salary', 'income')
    await add('2026-11-25', 20000, 'utilities')
    await add('2026-11-25', 2300, 'gifts')
    await setup()

    await vi.waitFor(() => expect(bucket('Risparmi').textContent).toBe('Risparmi1577,00\u00a0€'))
    expect(bucket('Risparmi').querySelector('svg')).toBeNull()
  })

  it('Risparmi negativo: segno meno e barra vuota', async () => {
    await add('2026-11-01', 10000, 'salary', 'income')
    await add('2026-11-02', 12000, 'housing')
    await setup()

    await vi.waitFor(() => expect(bucket('Risparmi').textContent).toContain('Risparmi-20,00\u00a0€'))
    expect(bar('Risparmi').fill.style.width).toBe('0%')
  })

  it('le barre hanno una sola scala sulle entrate, con la tacca sull\'ideale', async () => {
    await add('2026-11-01', 100000, 'salary', 'income')
    await add('2026-11-02', 25000, 'housing')
    await setup()

    await vi.waitFor(() => expect(bar('Essenziali').fill.style.width).toBe('25%'))
    expect(bar('Essenziali').ideal.style.left).toBe('30%')
    expect(bar('Piacere').ideal.style.left).toBe('20%')
    expect(bar('Risparmi').fill.style.width).toBe('75%')
    expect(bar('Risparmi').ideal.style.left).toBe('50%')
  })

  it('spese oltre le entrate: la barra si ferma alla larghezza piena', async () => {
    await add('2026-11-01', 10000, 'salary', 'income')
    await add('2026-11-02', 15000, 'housing')
    await setup()

    await vi.waitFor(() => expect(bar('Essenziali').fill.style.width).toBe('100%'))
    expect(bucket('Essenziali').textContent).toContain('Hai sforato di 120,00\u00a0€')
  })

  it('usa le percentuali salvate nelle impostazioni', async () => {
    await db.settings.put({ id: 'default', idealPct: { essentials: 50, pleasure: 30, savings: 20 }, soundsEnabled: true })
    await add('2026-11-01', 100000, 'salary', 'income')
    await setup()
    await vi.waitFor(() => expect(bucket('Essenziali').textContent).toContain('Hai a disposizione ancora 500,00\u00a0€'))
    expect(bar('Essenziali').ideal.style.left).toBe('50%')
  })

  it('senza entrate mostra solo l\'invito ad aggiungerne una, senza bucket', async () => {
    await setup()
    expect(screen.getByText(/Aggiungi un'entrata/)).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Bucket' })).toBeNull()
  })

  it('senza entrate ma con spese nasconde i bucket e lascia le spese nei movimenti', async () => {
    await add('2026-11-03', 20000, 'groceries')
    await setup()
    expect(screen.getByText(/Aggiungi un'entrata/)).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Bucket' })).toBeNull()
    expect(screen.getByRole('list', { name: 'Movimenti' }).textContent).toContain('200,00')
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

    const pleasure = await screen.findByRole('region', { name: 'Piacere' })
    await vi.waitFor(() => expect(within(pleasure).getByRole('listitem').textContent).toBe('Ristoranti25,00\u00a0€'))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ottobre 2026')
    expect(screen.getByRole('button', { name: 'Aggiungi transazione' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Mese successivo' }))
    expect(await screen.findByText('Nessuna spesa a Novembre 2026.')).toBeTruthy()
  })

  it('il FAB si stringe scorrendo in basso oltre 100 px e torna esteso scorrendo in alto', async () => {
    await setup()
    const label = screen.getByTestId('fab-label')
    const scrollTo = (y: number) => {
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
      fireEvent.scroll(window)
    }
    const extended = () => !label.className.includes('max-w-0')

    expect(label.textContent).toBe('Aggiungi')
    expect(extended()).toBe(true)

    scrollTo(80) // entro i primi 100 px resta esteso
    expect(extended()).toBe(true)

    scrollTo(300)
    expect(extended()).toBe(false)
    expect(screen.getByRole('button', { name: 'Aggiungi transazione' })).toBeTruthy()

    scrollTo(250)
    expect(extended()).toBe(true)

    scrollTo(400)
    scrollTo(50)
    expect(extended()).toBe(true)
    scrollTo(0)
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
