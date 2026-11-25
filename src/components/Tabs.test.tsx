// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import Tabs from '@/components/Tabs'

afterEach(cleanup)

function Harness() {
  const [selected, setSelected] = useState('a')
  return (
    <Tabs
      label="Vista"
      selected={selected}
      onSelect={setSelected}
      tabs={[
        { id: 'a', label: 'Primo', panel: <p>Contenuto primo</p> },
        { id: 'b', label: 'Secondo', panel: <p>Contenuto secondo</p> },
      ]}
    />
  )
}

describe('Tabs', () => {
  it('espone tablist, tab e tabpanel collegati', () => {
    render(<Harness />)
    expect(screen.getByRole('tablist', { name: 'Vista' })).toBeTruthy()
    const tab = screen.getByRole('tab', { name: 'Primo' })
    expect(tab.getAttribute('aria-selected')).toBe('true')
    const panel = screen.getByRole('tabpanel', { name: 'Primo' })
    expect(tab.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.textContent).toBe('Contenuto primo')
    expect(screen.getByText('Contenuto secondo').closest('[role="tabpanel"]')!.hasAttribute('hidden')).toBe(true)
    // ogni tab controlla un pannello esistente
    for (const t of screen.getAllByRole('tab')) expect(document.getElementById(t.getAttribute('aria-controls')!)).toBeTruthy()
  })

  it('solo il tab selezionato è nella sequenza del Tab', () => {
    render(<Harness />)
    expect(screen.getByRole('tab', { name: 'Primo' }).tabIndex).toBe(0)
    expect(screen.getByRole('tab', { name: 'Secondo' }).tabIndex).toBe(-1)
  })

  it('frecce, Home e Fine attivano e mettono a fuoco i tab', async () => {
    render(<Harness />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Primo' }))

    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Secondo', selected: true }))
    expect(screen.getByText('Contenuto secondo')).toBeTruthy()

    await user.keyboard('{ArrowRight}') // ricomincia dal primo
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Primo', selected: true }))

    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Secondo', selected: true }))

    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Primo', selected: true }))

    await user.keyboard('{End}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Secondo', selected: true }))
  })

  it('il clic seleziona il tab', async () => {
    render(<Harness />)
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Secondo' }))
    expect(screen.getByText('Contenuto secondo')).toBeTruthy()
  })
})
