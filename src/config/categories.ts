// Gli id non si cambiano mai: le transazioni salvate li usano come riferimento.
// I name si possono modificare liberamente.

export type Bucket = 'essentials' | 'pleasure' | 'savings'

export interface Category {
  id: string
  name: string
}

export interface ExpenseCategory extends Category {
  bucket: Bucket
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

  { id: 'emergency-fund', name: 'Fondo emergenza', bucket: 'savings' },
  { id: 'investments', name: 'Investimenti', bucket: 'savings' },
  { id: 'pension', name: 'Pensione', bucket: 'savings' },
]

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Stipendio' },
  { id: 'extra', name: 'Entrate extra' },
  { id: 'refunds', name: 'Rimborsi' },
]
