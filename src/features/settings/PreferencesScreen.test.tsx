// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Toaster from '@/components/Toaster'
import { db, DEFAULT_SETTINGS, getSettings } from '@/data/db'
import PreferencesScreen from '@/features/settings/PreferencesScreen'

beforeEach(async () => {
  await db.settings.clear()
})
// Lo stato dei toast di sonner è globale: senza dismiss un toast passa al test successivo
afterEach(() => {
  cleanup()
  toast.dismiss()
})

async function setup() {
  const onSaved = vi.fn()
  const onBack = vi.fn()
  render(
    <>
      <PreferencesScreen onSaved={onSaved} onBack={onBack} />
      <Toaster />
    </>,
  )
  await screen.findByRole('group', { name: 'Percentuali ideali' })
  return { user: userEvent.setup(), onSaved, onBack }
}

function pct(name: string) {
  return screen.getByLabelText(`${name} (%)`) as HTMLInputElement
}

async function replace(user: ReturnType<typeof userEvent.setup>, input: HTMLInputElement, value: string) {
  await user.clear(input)
  if (value) await user.type(input, value)
}

describe('PreferencesScreen', () => {
  it('ha un solo h1 e la regione main', async () => {
    await setup()
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Preferenze'])
    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('ha un paragrafo introduttivo che spiega cosa si può fare', async () => {
    await setup()
    expect(screen.getByText(/Scegli quanta parte delle entrate.*suoni dei pulsanti/)).toBeTruthy()
  })

  it('mostra i valori di default: 30 / 20 / 50, totale 100% e suoni attivi', async () => {
    await setup()
    expect([pct('Spese essenziali').value, pct('Spese di piacere').value, pct('Risparmi').value]).toEqual(['30', '20', '50'])
    expect(screen.getByText('Totale: 100%')).toBeTruthy()
    expect((screen.getByRole('switch', { name: 'Suoni' }) as HTMLInputElement).checked).toBe(true)
  })

  it('mostra i valori salvati', async () => {
    await db.settings.put({ id: 'default', idealPct: { essentials: 50, pleasure: 30, savings: 20 }, soundsEnabled: false })
    await setup()
    expect([pct('Spese essenziali').value, pct('Spese di piacere').value, pct('Risparmi').value]).toEqual(['50', '30', '20'])
    expect((screen.getByRole('switch', { name: 'Suoni' }) as HTMLInputElement).checked).toBe(false)
  })

  it('con somma diversa da 100 blocca il salvataggio e mostra il totale corrente', async () => {
    const { user, onSaved } = await setup()
    await replace(user, pct('Spese essenziali'), '40')
    expect(screen.getByText('Totale: 110%')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onSaved).not.toHaveBeenCalled()
    expect(await db.settings.count()).toBe(0)
    const error = screen.getByRole('alert')
    expect(error.textContent).toMatch(/somma deve essere 100%.*110%/)
    // errore associato al gruppo dei campi e focus sul primo campo
    expect(screen.getByRole('group', { name: 'Percentuali ideali' }).getAttribute('aria-describedby')).toContain(error.id)
    expect(document.activeElement).toBe(pct('Spese essenziali'))
    expect(screen.queryByText('Impostazioni salvate')).toBeNull()
  })

  it.each(['', '2,5', '101'])('blocca il salvataggio con percentuale %j e mostra l\'errore sul campo', async (value) => {
    const { user, onSaved } = await setup()
    const input = pct('Spese di piacere')
    await replace(user, input, value)
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onSaved).not.toHaveBeenCalled()
    const error = screen.getByRole('alert')
    expect(error.textContent).toBe('Inserisci un numero intero da 0 a 100.')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe(error.id)
  })

  it('salva percentuali e suoni disattivati, e la scelta resta salvata', async () => {
    const { user, onSaved } = await setup()
    await replace(user, pct('Spese essenziali'), '50')
    await replace(user, pct('Spese di piacere'), '30')
    await replace(user, pct('Risparmi'), '20')
    await user.click(screen.getByRole('switch', { name: 'Suoni' }))
    expect((screen.getByRole('switch', { name: 'Suoni' }) as HTMLInputElement).checked).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onSaved).toHaveBeenCalled()
    expect(await screen.findByText('Impostazioni salvate')).toBeTruthy()
    expect(await getSettings()).toEqual({
      id: 'default',
      idealPct: { essentials: 50, pleasure: 30, savings: 20 },
      soundsEnabled: false,
    })
  })

  it('la freccia Indietro torna indietro senza salvare; non c\'è il pulsante Annulla', async () => {
    const { user, onSaved, onBack } = await setup()
    expect(screen.queryByRole('button', { name: 'Annulla' })).toBeNull()
    await replace(user, pct('Spese essenziali'), '10')
    await user.click(screen.getByRole('button', { name: 'Indietro' }))

    expect(onBack).toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
