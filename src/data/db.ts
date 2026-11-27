import Dexie, { type EntityTable } from 'dexie'
import type { Bucket } from '@/config/categories'

export interface Transaction {
  id: number
  date: string // ISO YYYY-MM-DD
  amountCents: number // intero, sempre positivo
  kind: 'income' | 'expense'
  categoryId: string
  note?: string
}

export interface Settings {
  id: 'default'
  idealPct: Record<Bucket, number> // somma 100
  soundsEnabled: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'default',
  idealPct: { essentials: 30, pleasure: 20, savings: 50 },
  soundsEnabled: true,
}

export const db = new Dexie('kokufin') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  settings: EntityTable<Settings, 'id'>
}

db.version(1).stores({
  transactions: '++id, date',
  settings: 'id',
})

/** Transazioni del mese `YYYY-MM`. */
export function transactionsInMonth(month: string): Promise<Transaction[]> {
  return db.transactions.where('date').startsWith(month).toArray()
}

/** Impostazioni salvate; i campi mancanti (record salvato prima che esistessero) prendono il default. */
export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await db.settings.get('default')) }
}
