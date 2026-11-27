// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Toaster from '@/components/Toaster'
import { db, DEFAULT_SETTINGS, getSettings, type Transaction } from '@/data/db'
import BackupScreen from '@/screens/BackupScreen'

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
  const onRestored = vi.fn()
  const onBack = vi.fn()
  render(
    <>
      <BackupScreen onRestored={onRestored} onBack={onBack} />
      <Toaster />
    </>,
  )
  await screen.findByRole('heading', { level: 1, name: 'Backup' })
  return { user: userEvent.setup(), onRestored, onBack }
}

describe('BackupScreen', () => {
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

  it('ha un solo h1, la regione main e i pulsanti Esporta e Importa', async () => {
    await setup()
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Backup'])
    const main = screen.getByRole('main')
    expect(within(main).getByRole('button', { name: 'Esporta' })).toBeTruthy()
    expect(within(main).getByRole('button', { name: 'Importa' })).toBeTruthy()
  })

  it('la freccia Indietro torna indietro', async () => {
    const { user, onBack, onRestored } = await setup()
    await user.click(screen.getByRole('button', { name: 'Indietro' }))
    expect(onBack).toHaveBeenCalled()
    expect(onRestored).not.toHaveBeenCalled()
  })

  it('ha un paragrafo introduttivo che spiega cosa si può fare', async () => {
    await setup()
    expect(screen.getByText(/Esporta salva transazioni e impostazioni.*Importa sostituisce tutti i dati/)).toBeTruthy()
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

  // Bug: con NotAllowedError da navigator.share l'esportazione falliva senza file
  it('Esporta scarica il file se la condivisione viene rifiutata', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
    vi.stubGlobal('navigator', { ...navigator, canShare: () => true, share })
    URL.createObjectURL = vi.fn(() => 'blob:backup')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Esporta' }))

    await vi.waitFor(() => expect(click).toHaveBeenCalled())
    expect(share).toHaveBeenCalled()
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toMatch(/^kokufin-backup-.*\.json$/)
  })

  it('Esporta non scarica il file se l\'utente annulla la condivisione', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError'))
    vi.stubGlobal('navigator', { ...navigator, canShare: () => true, share })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Esporta' }))

    await vi.waitFor(() => expect(share).toHaveBeenCalled())
    expect(click).not.toHaveBeenCalled()
  })

  // Spec backup, scenario "Ripristino"
  it('con un backup valido e la conferma sostituisce i dati attuali', async () => {
    await db.transactions.add(OLD_TX)
    const { user, onRestored } = await setup()
    await user.upload(fileInput(), jsonFile(JSON.stringify(BACKUP)))

    const dialog = await screen.findByRole('dialog', { name: 'Sostituire tutti i dati con quelli del backup?' })
    expect(dialog.contains(document.activeElement)).toBe(true)
    await user.click(within(dialog).getByRole('button', { name: 'Ripristina' }))

    expect(await screen.findByText('Dati ripristinati')).toBeTruthy()
    expect(onRestored).toHaveBeenCalled()
    expect(await db.transactions.toArray()).toEqual([TX])
    expect(await getSettings()).toEqual({ id: 'default', ...BACKUP.settings })
  })

  it('Annulla nella conferma lascia i dati invariati e riporta il focus su Importa', async () => {
    await db.transactions.add(OLD_TX)
    const { user, onRestored } = await setup()
    await user.upload(fileInput(), jsonFile(JSON.stringify(BACKUP)))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Annulla' }))

    expect(onRestored).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Importa' }))
    expect(await db.transactions.toArray()).toEqual([OLD_TX])
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  // Spec backup, scenario "File non valido"
  it('con un file non valido lascia i dati invariati e mostra un errore', async () => {
    await db.transactions.add(OLD_TX)
    const { user, onRestored } = await setup()
    await user.upload(fileInput(), jsonFile('{"app": "altro"}'))

    const error = await screen.findByRole('alert')
    expect(error.textContent).toMatch(/non è un backup di Kokufin valido/)
    // errore associato al pulsante Importa, che riceve il focus
    const importButton = screen.getByRole('button', { name: 'Importa' })
    expect(importButton.getAttribute('aria-describedby')).toBe(error.id)
    expect(document.activeElement).toBe(importButton)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onRestored).not.toHaveBeenCalled()
    expect(await db.transactions.toArray()).toEqual([OLD_TX])
  })

  // Bug: un doppio tocco su Ripristina ripristinava due volte e tornava indietro due volte
  it('un doppio tocco su Ripristina ripristina una volta sola', async () => {
    const { user, onRestored } = await setup()
    await user.upload(fileInput(), jsonFile(JSON.stringify(BACKUP)))
    await user.dblClick(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Ripristina' }))

    await vi.waitFor(() => expect(onRestored).toHaveBeenCalled())
    expect(onRestored).toHaveBeenCalledTimes(1)
  })

  it('se il ripristino fallisce mostra un errore e non torna al mese', async () => {
    vi.spyOn(db.transactions, 'bulkAdd').mockRejectedValue(new Error('QuotaExceededError'))
    await db.transactions.add(OLD_TX)
    const { user, onRestored } = await setup()
    await user.upload(fileInput(), jsonFile(JSON.stringify(BACKUP)))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Ripristina' }))

    expect(await screen.findByText('Ripristino non riuscito. I dati non sono stati modificati.')).toBeTruthy()
    expect(onRestored).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Importa' }))
    expect(await db.transactions.toArray()).toEqual([OLD_TX])
  })

  it('se l\'esportazione fallisce mostra un errore', async () => {
    vi.spyOn(db.transactions, 'toArray').mockRejectedValue(new Error('UnknownError'))
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Esporta' }))

    expect(await screen.findByText('Esportazione non riuscita. Riprova.')).toBeTruthy()
  })

  // Bug: revocare l'indirizzo subito dopo il click poteva annullare il download
  it('Esporta non revoca l\'indirizzo del file subito dopo il download', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:backup')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Esporta' }))

    await vi.waitFor(() => expect(click).toHaveBeenCalled())
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})
