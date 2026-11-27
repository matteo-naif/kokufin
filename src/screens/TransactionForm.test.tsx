// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import IconProvider from '@/components/IconProvider'
import Toaster from '@/components/Toaster'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/config/categories'
import { db, type Transaction } from '@/data/db'
import { today } from '@/data/summary'
import TransactionForm from '@/screens/TransactionForm'

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
  await db.transactions.clear()
})

// Lo stato dei toast di sonner è globale: senza dismiss un toast passa al test successivo
afterEach(() => {
  cleanup()
  toast.dismiss()
})

function setup(transaction?: Transaction) {
  const onDone = vi.fn()
  const onBack = vi.fn()
  render(
    <>
      <TransactionForm transaction={transaction} onDone={onDone} onBack={onBack} />
      <Toaster />
    </>,
    { wrapper: IconProvider },
  )
  return { user: userEvent.setup(), onDone, onBack }
}

describe('TransactionForm', () => {
  // Spec navigation, requisito "Freccia indietro"
  it('ha la freccia Indietro accanto al titolo, che esce senza salvare; non c\'è il pulsante Annulla', async () => {
    const { user, onDone, onBack } = setup()
    expect(screen.queryByRole('button', { name: 'Annulla' })).toBeNull()
    await user.type(screen.getByLabelText('Importo (€)'), '12,50')
    const back = screen.getByRole('button', { name: 'Indietro' })
    expect(back.className).toContain('size-11')
    expect(back.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
    await user.click(back)

    expect(onBack).toHaveBeenCalled()
    expect(onDone).not.toHaveBeenCalled()
    expect(await db.transactions.count()).toBe(0)
  })

  it('salva una spesa con la data di oggi', async () => {
    const { user, onDone } = setup()
    await user.type(screen.getByLabelText('Importo (€)'), '12,50')
    await user.click(screen.getByRole('radio', { name: 'Ristoranti' }))
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onDone).toHaveBeenCalled()
    expect(await screen.findByText('Transazione salvata')).toBeTruthy()
    const saved = await db.transactions.toArray()
    expect(saved).toEqual([
      { id: expect.any(Number), date: today(), amountCents: 1250, kind: 'expense', categoryId: 'restaurants' },
    ])
  })

  it.each(['', '0', '-5'])('blocca il salvataggio con importo %j e mostra l\'errore', async (amount) => {
    const { user, onDone } = setup()
    const input = screen.getByLabelText('Importo (€)')
    if (amount) await user.type(input, amount)
    await user.click(screen.getByRole('radio', { name: 'Ristoranti' }))
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onDone).not.toHaveBeenCalled()
    expect(await db.transactions.count()).toBe(0)
    const error = screen.getByRole('alert')
    expect(error.textContent).toMatch(/importo maggiore di zero/)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe(error.id)
    expect(document.activeElement).toBe(input)
    expect(screen.queryByText('Transazione salvata')).toBeNull()
  })

  it('blocca il salvataggio senza categoria e sposta il focus sulla prima', async () => {
    const { user, onDone } = setup()
    await user.type(screen.getByLabelText('Importo (€)'), '10')
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe('Scegli una categoria.')
    const group = screen.getByRole('group', { name: 'Categoria' })
    expect(document.activeElement).toBe(within(group).getAllByRole('radio')[0])
  })

  it('con tipo Entrata mostra solo le categorie delle entrate', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('radio', { name: 'Entrata' }))

    const group = screen.getByRole('group', { name: 'Categoria' })
    const names = within(group).getAllByRole('radio').map((r) => r.closest('label')!.textContent)
    expect(names).toEqual(INCOME_CATEGORIES.map((c) => c.name))
  })

  it('con tipo Spesa mostra solo le categorie di spesa', () => {
    setup()
    const group = screen.getByRole('group', { name: 'Categoria' })
    expect(within(group).getAllByRole('radio')).toHaveLength(EXPENSE_CATEGORIES.length)
  })

  it('raggruppa le categorie di spesa per bucket', () => {
    setup()
    for (const [bucket, name] of [
      ['essentials', 'Spese essenziali'],
      ['pleasure', 'Spese di piacere'],
    ]) {
      const group = screen.getByRole('group', { name })
      const names = within(group).getAllByRole('radio').map((r) => r.closest('label')!.textContent)
      expect(names).toEqual(EXPENSE_CATEGORIES.filter((c) => c.bucket === bucket).map((c) => c.name))
    }
  })

  it('modifica una transazione esistente', async () => {
    const id = await db.transactions.add({ date: '2026-11-03', amountCents: 500, kind: 'expense', categoryId: 'groceries' })
    const tx = (await db.transactions.get(id))!
    const { user, onDone } = setup(tx)

    const input = screen.getByLabelText('Importo (€)')
    expect((input as HTMLInputElement).value).toBe('5,00')
    await user.clear(input)
    await user.type(input, '7')
    await user.type(screen.getByLabelText('Nota (facoltativa)'), 'mercato')
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(onDone).toHaveBeenCalled()
    expect(await screen.findByText('Transazione salvata')).toBeTruthy()
    expect(await db.transactions.get(id)).toEqual({ ...tx, amountCents: 700, note: 'mercato' })
  })

  it('elimina dopo la conferma, con il focus nella conferma e poi di ritorno', async () => {
    const id = await db.transactions.add({ date: '2026-11-03', amountCents: 500, kind: 'expense', categoryId: 'groceries' })
    const { user, onDone } = setup((await db.transactions.get(id))!)

    const deleteButton = screen.getByRole('button', { name: 'Elimina' })
    await user.click(deleteButton)
    const dialog = screen.getByRole('dialog', { name: 'Eliminare questa transazione?' })
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.click(within(dialog).getByRole('button', { name: 'Annulla' }))
    expect(document.activeElement).toBe(deleteButton)
    expect(await db.transactions.count()).toBe(1)
    expect(screen.queryByText('Transazione eliminata')).toBeNull()

    await user.click(deleteButton)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Elimina' }))
    expect(onDone).toHaveBeenCalled()
    expect(await screen.findByText('Transazione eliminata')).toBeTruthy()
    expect(await db.transactions.count()).toBe(0)
  })

  it('in aggiunta non mostra il pulsante Elimina', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull()
  })

  // Bug: un doppio tocco su Salva aggiungeva due transazioni
  it('un doppio tocco su Salva aggiunge una sola transazione', async () => {
    const { user, onDone } = setup()
    await user.type(screen.getByLabelText('Importo (€)'), '12,50')
    await user.click(screen.getByRole('radio', { name: 'Ristoranti' }))
    await user.dblClick(screen.getByRole('button', { name: 'Salva' }))

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(await db.transactions.count()).toBe(1)
  })

  it('un doppio tocco su Elimina nella conferma elimina una volta sola', async () => {
    const id = await db.transactions.add({ date: '2026-11-03', amountCents: 500, kind: 'expense', categoryId: 'groceries' })
    const { user, onDone } = setup((await db.transactions.get(id))!)
    await user.click(screen.getByRole('button', { name: 'Elimina' }))
    await user.dblClick(within(screen.getByRole('dialog')).getByRole('button', { name: 'Elimina' }))

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
