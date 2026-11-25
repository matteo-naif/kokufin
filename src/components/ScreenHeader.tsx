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
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  )
}
