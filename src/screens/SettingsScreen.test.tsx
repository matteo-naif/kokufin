// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SettingsScreen from '@/screens/SettingsScreen'

afterEach(cleanup)

function setup() {
  const onOpen = vi.fn()
  const onBack = vi.fn()
  render(<SettingsScreen onOpen={onOpen} onBack={onBack} />)
  return { user: userEvent.setup(), onOpen, onBack }
}

describe('SettingsScreen', () => {
  it('ha un solo h1 e la regione main', () => {
    setup()
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Impostazioni'])
    expect(screen.getByRole('main')).toBeTruthy()
  })

  // Spec settings, scenario "Voci accessibili": link con nome e descrizione
  it('elenca le sezioni Preferenze e Backup come link con nome e descrizione', () => {
    setup()
    const links = within(screen.getByRole('list', { name: 'Sezioni' })).getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual(['PreferenzePercentuali ideali e suoni', 'BackupEsporta e importa i dati'])
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['#/settings/preferences', '#/settings/backup'])
    expect(links.map((l) => [l.getAttribute('aria-labelledby'), l.getAttribute('aria-describedby')].map((id) => document.getElementById(id!)!.textContent))).toEqual([
      ['Preferenze', 'Percentuali ideali e suoni'],
      ['Backup', 'Esporta e importa i dati'],
    ])
    expect(screen.getByRole('link', { name: 'Preferenze' }).className).toContain('min-h-11')
  })

  // Spec settings, scenario "Apertura di una sezione"
  it.each([
    ['Preferenze', '/settings/preferences'],
    ['Backup', '/settings/backup'],
  ])('toccando %s apre la sezione', async (name, path) => {
    const { user, onOpen } = setup()
    await user.click(screen.getByRole('link', { name }))
    expect(onOpen).toHaveBeenCalledWith(path)
  })

  it('con la tastiera Invio apre la sezione', async () => {
    const { user, onOpen } = setup()
    screen.getByRole('link', { name: 'Backup' }).focus()
    await user.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledWith('/settings/backup')
  })

  it('la freccia Indietro torna indietro', async () => {
    const { user, onBack } = setup()
    await user.click(screen.getByRole('button', { name: 'Indietro' }))
    expect(onBack).toHaveBeenCalled()
  })
})
