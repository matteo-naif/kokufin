// Gli id non si cambiano mai: le transazioni salvate li usano come riferimento.
// I name si possono modificare liberamente.

export type Bucket = 'essentials' | 'pleasure' | 'savings'

/** Bucket a cui appartengono le categorie di spesa. Risparmi non si registra: si calcola. */
export type SpendingBucket = Exclude<Bucket, 'savings'>

/** Bucket nell'ordine in cui compaiono, con il nome mostrato all'utente. */
export const BUCKETS: { id: Bucket; name: string }[] = [
  { id: 'essentials', name: 'Spese essenziali' },
  { id: 'pleasure', name: 'Spese di piacere' },
  { id: 'savings', name: 'Risparmi' },
]

/** Bucket delle spese, senza Risparmi: Risparmi non ha categorie, si calcola dalle entrate. */
export const SPENDING_BUCKETS = BUCKETS.filter((b): b is { id: SpendingBucket; name: string } => b.id !== 'savings')

export interface Category {
  id: string
  name: string
}

export interface ExpenseCategory extends Category {
  bucket: SpendingBucket
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'housing', name: 'Casa (affitto/mutuo)', bucket: 'essentials' },
  { id: 'utilities', name: 'Bollette', bucket: 'essentials' },
  { id: 'groceries', name: 'Spesa alimentare', bucket: 'essentials' },
  { id: 'transport', name: 'Trasporti', bucket: 'essentials' },
  { id: 'health', name: 'Salute', bucket: 'essentials' },
  { id: 'phone-internet', name: 'Telefono e internet', bucket: 'essentials' },
  { id: 'insurance', name: 'Assicurazioni', bucket: 'essentials' },

  { id: 'restaurants', name: 'Ristoranti', bucket: 'pleasure' },
  { id: 'entertainment', name: 'Svago', bucket: 'pleasure' },
  { id: 'travel', name: 'Viaggi', bucket: 'pleasure' },
  { id: 'clothing', name: 'Abbigliamento', bucket: 'pleasure' },
  { id: 'subscriptions', name: 'Abbonamenti', bucket: 'pleasure' },
  { id: 'gifts', name: 'Regali', bucket: 'pleasure' },
]

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Stipendio' },
  { id: 'extra', name: 'Entrate extra' },
  { id: 'refunds', name: 'Rimborsi' },
]

export const CATEGORY_NAME = new Map([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.id, c.name]))
