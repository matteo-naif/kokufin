import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, DEFAULT_SETTINGS, getSettings, type Transaction } from '@/data/db'
import { createBackup, parseBackup, restoreBackup } from '@/features/backup/backup'

const TX: Transaction[] = [
  { id: 1, date: '2026-11-01', amountCents: 250000, kind: 'income', categoryId: 'salary' },
  { id: 2, date: '2026-11-03', amountCents: 4590, kind: 'expense', categoryId: 'restaurants', note: 'Pizza' },
]
const SETTINGS = { idealPct: { essentials: 50, pleasure: 30, savings: 20 }, soundsEnabled: false }

function backupText(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({ app: 'kokufin', version: 1, transactions: TX, settings: SETTINGS, ...overrides })
}

beforeEach(async () => {
  await db.transactions.clear()
  await db.settings.clear()
})

describe('createBackup', () => {
  it('contiene transazioni e impostazioni salvate', async () => {
    await db.transactions.bulkAdd(TX)
    await db.settings.put({ id: 'default', ...SETTINGS })
    expect(JSON.parse(await createBackup())).toEqual({ app: 'kokufin', version: 1, transactions: TX, settings: SETTINGS })
  })

  it('senza impostazioni salvate usa quelle di default', async () => {
    const { settings } = JSON.parse(await createBackup())
    expect(settings).toEqual({ idealPct: DEFAULT_SETTINGS.idealPct, soundsEnabled: true })
  })
})

describe('parseBackup', () => {
  it('accetta un backup valido', () => {
    expect(parseBackup(backupText())).toEqual({ app: 'kokufin', version: 1, transactions: TX, settings: SETTINGS })
  })

  it('accetta il backup creato da createBackup', async () => {
    await db.transactions.bulkAdd(TX)
    expect(parseBackup(await createBackup())).not.toBeNull()
  })

  // Spec backup, scenario "File non valido"
  it.each([
    ['testo non JSON', 'non è json'],
    ['JSON di altro tipo', '[1, 2]'],
    ['app diversa', backupText({ app: 'altro' })],
    ['versione sconosciuta', backupText({ version: 2 })],
    ['transazioni mancanti', backupText({ transactions: undefined })],
    ['impostazioni mancanti', backupText({ settings: undefined })],
    ['data non ISO', backupText({ transactions: [{ ...TX[0], date: '01/11/2026' }] })],
    ['importo decimale', backupText({ transactions: [{ ...TX[0], amountCents: 12.5 }] })],
    ['importo zero', backupText({ transactions: [{ ...TX[0], amountCents: 0 }] })],
    ['tipo sconosciuto', backupText({ transactions: [{ ...TX[0], kind: 'transfer' }] })],
    ['categoria inesistente', backupText({ transactions: [{ ...TX[0], categoryId: 'boh' }] })],
    ['categoria di spesa su entrata', backupText({ transactions: [{ ...TX[0], categoryId: 'restaurants' }] })],
    ['nota non testuale', backupText({ transactions: [{ ...TX[0], note: 3 }] })],
    ['id duplicati', backupText({ transactions: [TX[0], { ...TX[1], id: 1 }] })],
    ['percentuali con somma diversa da 100', backupText({ settings: { ...SETTINGS, idealPct: { essentials: 50, pleasure: 30, savings: 30 } } })],
    ['suoni non booleano', backupText({ settings: { ...SETTINGS, soundsEnabled: 'sì' } })],
  ])('rifiuta: %s', (_, text) => {
    expect(parseBackup(text)).toBeNull()
  })
})

describe('restoreBackup', () => {
  // Spec backup, scenario "Ripristino"
  it('sostituisce transazioni e impostazioni attuali con quelle del backup', async () => {
    await db.transactions.add({ id: 99, date: '2026-10-10', amountCents: 100, kind: 'expense', categoryId: 'gifts' })
    await restoreBackup(parseBackup(backupText())!)
    expect(await db.transactions.toArray()).toEqual(TX)
    expect(await getSettings()).toEqual({ id: 'default', ...SETTINGS })
  })
})

describe('review: dati del backup', () => {
  // Bug: un id nelle impostazioni del file spostava le impostazioni su un altro record
  it('restoreBackup salva le impostazioni nel record default anche se il file ha un id', async () => {
    await restoreBackup(parseBackup(backupText({ settings: { ...SETTINGS, id: 'x' } }))!)
    expect(await db.settings.toArray()).toEqual([{ id: 'default', ...SETTINGS }])
  })

  // Bug: un record salvato prima dei suoni non aveva soundsEnabled e il backup veniva rifiutato
  it('getSettings completa un record senza soundsEnabled con il default', async () => {
    await db.settings.put({ id: 'default', idealPct: SETTINGS.idealPct } as never)
    expect(await getSettings()).toEqual({ id: 'default', idealPct: SETTINGS.idealPct, soundsEnabled: true })
    expect(parseBackup(await createBackup())).not.toBeNull()
  })

  it.each([
    ['mese inesistente', { date: '2026-13-01' }],
    ['giorno inesistente', { date: '2026-02-30' }],
    ['mese zero', { date: '2026-00-10' }],
    ['id zero', { id: 0 }],
    ['id negativo', { id: -1 }],
  ])('parseBackup rifiuta: %s', (_, override) => {
    expect(parseBackup(backupText({ transactions: [{ ...TX[0], ...override }] }))).toBeNull()
  })

  it('parseBackup accetta il 29 febbraio di un anno bisestile', () => {
    expect(parseBackup(backupText({ transactions: [{ ...TX[0], date: '2028-02-29' }] }))).not.toBeNull()
  })
})
