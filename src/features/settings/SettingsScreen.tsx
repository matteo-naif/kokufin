import { CaretRightIcon } from '@phosphor-icons/react'
import type { MouseEvent } from 'react'
import ScreenHeader from '@/components/ScreenHeader'

interface Props {
  onOpen: (path: string) => void
  onBack: () => void
}

const SECTIONS = [
  { id: 'preferences', name: 'Preferenze', description: 'Percentuali ideali e suoni' },
  { id: 'backup', name: 'Backup', description: 'Esporta e importa i dati' },
]

/** Indice delle impostazioni, come su Android: ogni voce apre la pagina della sezione (spec settings). */
export default function SettingsScreen({ onOpen, onBack }: Props) {
  // Link veri (href con #) per lo screen reader; la navigazione passa da onOpen, che salva lo stato della cronologia
  function open(e: MouseEvent, path: string) {
    e.preventDefault()
    onOpen(path)
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <ScreenHeader title="Impostazioni" onBack={onBack} />
      <ul aria-label="Sezioni" className="flex flex-col border-y border-separator">
        {SECTIONS.map((s) => (
          <li key={s.id} className="border-b border-separator last:border-b-0">
            {/* Nome della voce come nome del link e descrizione letta dopo, come sezione e sottotitolo su Android */}
            <a
              href={`#/settings/${s.id}`}
              onClick={(e) => open(e, `/settings/${s.id}`)}
              aria-labelledby={`${s.id}-name`}
              aria-describedby={`${s.id}-description`}
              className="flex min-h-11 items-center justify-between gap-4 py-3"
            >
              <span className="flex flex-col">
                <span id={`${s.id}-name`} className="font-semibold">
                  {s.name}
                </span>
                <span id={`${s.id}-description`} className="text-text-secondary">
                  {s.description}
                </span>
              </span>
              <CaretRightIcon className="shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
