import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createBackup, parseBackup, restoreBackup } from '@/data/backup'
import { db, DEFAULT_SETTINGS, getSettings, type Transaction } from '@/data/db'

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
