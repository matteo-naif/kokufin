// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { db } from '@/data/db'

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
afterEach(() => {
  cleanup()
  toast.dismiss()
})

/** Avvia l'app all'indirizzo `hash`, con il mese come voce precedente quando serve. */
async function start(hash = '#/') {
  history.replaceState(null, '', `/${hash}`)
  render(<App />)
  return userEvent.setup()
}

function h1() {
  return screen.getByRole('heading', { level: 1 }).textContent
}

/** Tasto Indietro: history.back() è asincrono, si aspetta la vista attesa. */
async function back(expectedH1: string) {
  history.back()
  await waitFor(() => expect(h1()).toBe(expectedH1))
}

describe('App: navigazione', () => {
  it('apre le impostazioni a #/settings e torna al mese con Indietro', async () => {
    const user = await start()
    await screen.findByRole('list', { name: 'Bucket' })
    await user.click(screen.getByRole('button', { name: 'Impostazioni' }))

    expect(location.hash).toBe('#/settings')
    expect(await screen.findByRole('heading', { level: 1, name: 'Impostazioni' })).toBeTruthy()
    await back('Novembre 2026')
    expect(location.hash).toBe('#/')
  })

  it('apre la nuova transazione a #/transactions/new; Annulla toglie la vista dalla cronologia', async () => {
    const user = await start()
    await user.click(await screen.findByRole('button', { name: 'Aggiungi transazione' }))
    expect(location.hash).toBe('#/transactions/new')
    expect(h1()).toBe('Nuova transazione')

    const length = history.length
    await user.click(screen.getByRole('button', { name: 'Annulla' }))
    await waitFor(() => expect(h1()).toBe('Novembre 2026'))
    expect(location.hash).toBe('#/')
    // tornati indietro, non una nuova voce: Indietro non riapre il form
    expect(history.length).toBe(length)
  })

  it('apre la modifica a #/transactions/{id} con i dati della transazione', async () => {
    const id = await db.transactions.add({ date: '2026-11-03', amountCents: 500, kind: 'expense', categoryId: 'groceries' })
    const user = await start()
    await user.click(await screen.findByRole('button', { name: /Spesa alimentare/ }))

    expect(location.hash).toBe(`#/transactions/${id}`)
    expect(h1()).toBe('Modifica transazione')
    expect((screen.getByLabelText('Importo (€)') as HTMLInputElement).value).toBe('5,00')
  })

  it('mantiene mese e tab tornando dalle impostazioni', async () => {
    const user = await start()
    await user.click(await screen.findByRole('button', { name: 'Mese precedente' }))
    await user.click(screen.getByRole('tab', { name: 'Categorie' }))
    await user.click(screen.getByRole('button', { name: 'Impostazioni' }))
    await screen.findByRole('heading', { level: 1, name: 'Impostazioni' })

    await back('Ottobre 2026')
    expect(screen.getByRole('tab', { name: 'Categorie' }).getAttribute('aria-selected')).toBe('true')
  })

  it('con una transazione inesistente mostra il mese', async () => {
    await start('#/transactions/999')
    await waitFor(() => expect(location.hash).toBe('#/'))
    expect(h1()).toBe('Novembre 2026')
  })

  it('con un indirizzo sconosciuto mostra il mese', async () => {
    await start('#/nope')
    await waitFor(() => expect(location.hash).toBe('#/'))
    expect(h1()).toBe('Novembre 2026')
  })

  it('aperta direttamente una vista secondaria, Salva porta al mese senza uscire dall\'app', async () => {
    const user = await start('#/settings')
    await user.click(await screen.findByRole('button', { name: 'Salva' }))

    await waitFor(() => expect(h1()).toBe('Novembre 2026'))
    expect(location.hash).toBe('#/')
  })
})
