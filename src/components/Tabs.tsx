import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react'

interface Tab {
  id: string
  label: string
  panel: ReactNode
}

interface Props {
  label: string // nome accessibile della tablist
  tabs: Tab[]
  selected: string
  onSelect: (id: string) => void
}

/**
 * Tab con attivazione automatica secondo il pattern ARIA (APG):
 * frecce sinistra/destra, Home e Fine spostano focus e selezione.
 */
export default function Tabs({ label, tabs, selected, onSelect }: Props) {
  const baseId = useId()
  const refs = useRef(new Map<string, HTMLButtonElement>())

  function onKeyDown(e: KeyboardEvent) {
    const index = tabs.findIndex((t) => t.id === selected)
    const next = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onSelect(tabs[next].id)
    refs.current.get(tabs[next].id)!.focus()
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={label} className="flex border-b border-border">
        {tabs.map((t) => {
          const isSelected = t.id === selected
          return (
            <button
              key={t.id}
              ref={(el) => {
                if (el) refs.current.set(t.id, el)
                else refs.current.delete(t.id)
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelect(t.id)}
              onKeyDown={onKeyDown}
              // Selezione indicata da peso del testo e sottolineatura spessa, non solo dal colore
              className={`-mb-px min-h-11 flex-1 border-b-4 px-4 ${
                isSelected ? 'border-primary font-semibold text-text' : 'border-transparent text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {/* Tutti i pannelli restano nel DOM: aria-controls punta sempre a un elemento esistente */}
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${baseId}-panel-${t.id}`}
          aria-labelledby={`${baseId}-tab-${t.id}`}
          hidden={t.id !== selected}
        >
          {t.panel}
        </div>
      ))}
    </div>
  )
}
