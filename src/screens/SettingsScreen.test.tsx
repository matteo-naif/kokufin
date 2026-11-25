// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Toaster from '@/components/Toaster'
import { db, DEFAULT_SETTINGS, getSettings, type Transaction } from '@/data/db'
import SettingsScreen from '@/screens/SettingsScreen'

// jsdom non implementa <dialog>: stub minimo
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

beforeEach(async () => {
  await db.settings.clear()
  await db.transactions.clear()
})
// Lo stato dei toast di sonner è globale: senza dismiss un toast passa al test successivo
afterEach(() => {
  cleanup()
  toast.dismiss()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function setup() {
  const onDone = vi.fn()
  render(
    <>
      <SettingsScreen onDone={onDone} />
      <Toaster />
    </>,
  )
  await screen.findByRole('group', { name: 'Percentuali ideali' })
  return { user: userEvent.setup(), onDone }
}

function pct(name: string) {
  return screen.getByLabelText(`${name} (%)`) as HTMLInputElement
}

async function replace(user: ReturnType<typeof userEvent.setup>, input: HTMLInputElement, value: string) {
  await user.clear(input)
  if (value) await user.type(input, value)
}

describe('SettingsScreen', () => {
  it('ha un solo h1 e la regione main', async () => {
    await setup()
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Impostazioni'])
    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('mostra i valori di default: 30 / 20 / 50, totale 100% e suoni attivi', async () => {
    await setup()
    expect([pct('Essenziali').value, pct('Piacere').value, pct('Risparmi').value]).toEqual(['30', '20', '50'])
    expect(screen.getByText('Totale: 100%')).toBeTruthy()
    expect((screen.getByRole('switch', { name: 'Suoni' }) as HTMLInputElement).checked).toBe(true)
  })

  it('mostra i valori salvati', async () => {
    await db.settings.put({ id: 'default', idealPct: { essentials: 50, pleasure: 30, savings: 20 }, soundsEnabled: false })
    await setup()
    expect([pct('Essenziali').value, pct('Piacere').value, pct('Risparmi').value]).toEqual(['50', '30', '20'])
    expect((screen.getByRole('switch', { name: 'Suoni' }) as HTMLInputElement).checked).toBe(false)
  })

  it('con somma diversa da 100 blocca il salvataggio e mostra il totale corrente', async () => {
    const { user, onDone } = await setup()
    await replace(user, pct('Essenziali'), '40')
    expect(screen.getByText('Totale: 110%')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onDone).not.toHaveBeenCalled()
    expect(await db.settings.count()).toBe(0)
    const error = screen.getByRole('alert')
    expect(error.textContent).toMatch(/somma deve essere 100%.*110%/)
    // errore associato al gruppo dei campi e focus sul primo campo
    expect(screen.getByRole('group', { name: 'Percentuali ideali' }).getAttribute('aria-describedby')).toContain(error.id)
    expect(document.activeElement).toBe(pct('Essenziali'))
    expect(screen.queryByText('Impostazioni salvate')).toBeNull()
  })

  it.each(['', '2,5', '101'])('blocca il salvataggio con percentuale %j e mostra l\'errore sul campo', async (value) => {
    const { user, onDone } = await setup()
    const input = pct('Piacere')
    await replace(user, input, value)
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onDone).not.toHaveBeenCalled()
    const error = screen.getByRole('alert')
    expect(error.textContent).toBe('Inserisci un numero intero da 0 a 100.')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe(error.id)
  })

  it('salva percentuali e suoni disattivati, e la scelta resta salvata', async () => {
    const { user, onDone } = await setup()
    await replace(user, pct('Essenziali'), '50')
    await replace(user, pct('Piacere'), '30')
    await replace(user, pct('Risparmi'), '20')
    await user.click(screen.getByRole('switch', { name: 'Suoni' }))
    expect((screen.getByRole('switch', { name: 'Suoni' }) as HTMLInputElement).checked).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onDone).toHaveBeenCalled()
    expect(await screen.findByText('Impostazioni salvate')).toBeTruthy()
    expect(await getSettings()).toEqual({
      id: 'default',
      idealPct: { essentials: 50, pleasure: 30, savings: 20 },
      soundsEnabled: false,
    })
  })

  it('Annulla torna indietro senza salvare', async () => {
    const { user, onDone } = await setup()
    await replace(user, pct('Essenziali'), '10')
    await user.click(screen.getByRole('button', { name: 'Annulla' }))

    expect(onDone).toHaveBeenCalled()
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('SettingsScreen, backup', () => {
  const TX: Transaction = { id: 1, date: '2026-11-03', amountCents: 4590, kind: 'expense', categoryId: 'restaurants' }
  const BACKUP = {
    app: 'kokufin',
    version: 1,
    transactions: [TX],
    settings: { idealPct: { essentials: 50, pleasure: 30, savings: 20 }, soundsEnabled: false },
  }
  const OLD_TX: Transaction = { id: 7, date: '2026-10-01', amountCents: 100, kind: 'expense', categoryId: 'gifts' }

  function fileInput() {
    return document.querySelector('input[type="file"]') as HTMLInputElement
  }

  function jsonFile(content: string) {
    return new File([content], 'backup.json', { type: 'application/json' })
  }

  it('ha la sezione Backup con titolo h2 e i pulsanti Esporta e Importa', async () => {
    await setup()
    const section = screen.getByRole('region', { name: 'Backup' })
    expect(within(section).getByRole('heading', { level: 2 }).textContent).toBe('Backup')
    expect(within(section).getByRole('button', { name: 'Esporta' })).toBeTruthy()
    expect(within(section).getByRole('button', { name: 'Importa' })).toBeTruthy()
  })

  // Spec backup, scenario "Esportazione": sul telefono il foglio di condivisione
  it('Esporta propone di condividere il file con transazioni e impostazioni', async () => {
    await db.transactions.add(TX)
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, canShare: () => true, share })
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Esporta' }))

    await vi.waitFor(() => expect(share).toHaveBeenCalled())
    const file: File = share.mock.calls[0][0].files[0]
    expect(file.name).toMatch(/^kokufin-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const content = JSON.parse(await file.text())
    expect(content.transactions).toEqual([TX])
    expect(content.settings).toEqual({ idealPct: DEFAULT_SETTINGS.idealPct, soundsEnabled: true })
  })

  // Spec backup, scenario "Esportazione": senza condivisione il file si scarica
  it('Esporta scarica il file se la condivisione non è disponibile', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:backup')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Esporta' }))

    await vi.waitFor(() => expect(click).toHaveBeenCalled())
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toMatch(/^kokufin-backup-.*\.json$/)
    expect(link.href).toBe('blob:backup')
  })

  // Spec backup, scenario "Ripristino"
  it('con un backup valido e la conferma sostituisce i dati attuali', async () => {
    await db.transactions.add(OLD_TX)
    const { user, onDone } = await setup()
    await user.upload(fileInput(), jsonFile(JSON.stringify(BACKUP)))

    const dialog = await screen.findByRole('dialog', { name: 'Sostituire tutti i dati con quelli del backup?' })
    expect(dialog.contains(document.activeElement)).toBe(true)
    await user.click(within(dialog).getByRole('button', { name: 'Ripristina' }))

    expect(await screen.findByText('Dati ripristinati')).toBeTruthy()
    expect(onDone).toHaveBeenCalled()
    expect(await db.transactions.toArray()).toEqual([TX])
    expect(await getSettings()).toEqual({ id: 'default', ...BACKUP.settings })
  })

  it('Annulla nella conferma lascia i dati invariati e riporta il focus su Importa', async () => {
    await db.transactions.add(OLD_TX)
    const { user, onDone } = await setup()
    await user.upload(fileInput(), jsonFile(JSON.stringify(BACKUP)))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Annulla' }))

    expect(onDone).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Importa' }))
    expect(await db.transactions.toArray()).toEqual([OLD_TX])
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  // Spec backup, scenario "File non valido"
  it('con un file non valido lascia i dati invariati e mostra un errore', async () => {
    await db.transactions.add(OLD_TX)
    const { user, onDone } = await setup()
    await user.upload(fileInput(), jsonFile('{"app": "altro"}'))

    const error = await screen.findByRole('alert')
    expect(error.textContent).toMatch(/non è un backup di Kokufin valido/)
    // errore associato al pulsante Importa, che riceve il focus
    const importButton = screen.getByRole('button', { name: 'Importa' })
    expect(importButton.getAttribute('aria-describedby')).toBe(error.id)
    expect(document.activeElement).toBe(importButton)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onDone).not.toHaveBeenCalled()
    expect(await db.transactions.toArray()).toEqual([OLD_TX])
  })
})
