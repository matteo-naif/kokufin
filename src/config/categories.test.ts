import { describe, expect, it } from 'vitest'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/config/categories'

describe('categorie', () => {
  it('hanno id unici tra spese ed entrate', () => {
    const ids = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('coprono tutti e tre i bucket', () => {
    const buckets = new Set(EXPENSE_CATEGORIES.map((c) => c.bucket))
    expect([...buckets].sort()).toEqual(['essentials', 'pleasure', 'savings'])
  })
})
