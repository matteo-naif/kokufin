import { ArrowLeftIcon } from '@phosphor-icons/react'

interface Props {
  title: string
  onBack: () => void
}

/** Intestazione delle viste secondarie: freccia indietro accanto al titolo (spec navigation). */
export default function ScreenHeader({ title, onBack }: Props) {
  return (
    <header className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Indietro"
        onClick={onBack}
        className="flex size-11 shrink-0 items-center justify-center rounded border border-border"
      >
        <ArrowLeftIcon />
      </button>
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  )
}
