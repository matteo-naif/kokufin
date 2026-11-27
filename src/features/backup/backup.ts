import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/config/categories'
import { db, getSettings, type Settings, type Transaction } from '@/data/db'

/** Contenuto del file di backup. Le impostazioni sono salvate senza la chiave del record. */
export interface Backup {
  app: 'kokufin'
  version: 1
  transactions: Transaction[]
  settings: Omit<Settings, 'id'>
}

const CATEGORY_IDS = {
  expense: new Set(EXPENSE_CATEGORIES.map((c) => c.id)),
  income: new Set(INCOME_CATEGORIES.map((c) => c.id)),
}

/** JSON del backup con tutte le transazioni e le impostazioni. */
export async function createBackup(): Promise<string> {
  const { id: _, ...settings } = await getSettings()
  const backup: Backup = { app: 'kokufin', version: 1, transactions: await db.transactions.toArray(), settings }
  return JSON.stringify(backup, null, 2)
}

/** Legge il testo di un file di backup; null se non è un backup valido. */
export function parseBackup(text: string): Backup | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!isRecord(data) || data.app !== 'kokufin' || data.version !== 1) return null
  const { transactions, settings } = data
  if (!Array.isArray(transactions) || !transactions.every(isTransaction) || !isSettings(settings)) return null
  // Due transazioni con lo stesso id non si possono salvare insieme
  if (new Set(transactions.map((t) => t.id)).size !== transactions.length) return null
  return data as unknown as Backup
}

/** Sostituisce tutti i dati con quelli del backup, in un'unica transazione del database. */
export function restoreBackup({ transactions, settings }: Backup): Promise<void> {
  return db.transaction('rw', db.transactions, db.settings, async () => {
    await db.transactions.clear()
    await db.transactions.bulkAdd(transactions)
    // Solo i campi noti: una chiave id nel file sposterebbe le impostazioni su un altro record
    await db.settings.put({ id: 'default', idealPct: settings.idealPct, soundsEnabled: settings.soundsEnabled })
  })
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isTransaction(t: unknown): t is Transaction {
  return (
    isRecord(t) &&
    Number.isInteger(t.id) &&
    (t.id as number) > 0 &&
    typeof t.date === 'string' &&
    isIsoDate(t.date) &&
    Number.isInteger(t.amountCents) &&
    (t.amountCents as number) > 0 &&
    (t.kind === 'income' || t.kind === 'expense') &&
    CATEGORY_IDS[t.kind].has(t.categoryId as string) &&
    (t.note === undefined || typeof t.note === 'string')
  )
}

/** Data YYYY-MM-DD esistente nel calendario (niente 2026-13-01 o 2026-02-30). */
function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s)
}

function isSettings(s: unknown): s is Backup['settings'] {
  if (!isRecord(s) || typeof s.soundsEnabled !== 'boolean' || !isRecord(s.idealPct)) return false
  const pct = [s.idealPct.essentials, s.idealPct.pleasure, s.idealPct.savings]
  return pct.every((p) => Number.isInteger(p) && (p as number) >= 0) && (pct as number[]).reduce((a, b) => a + b) === 100
}
