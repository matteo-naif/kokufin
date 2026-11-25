import type { ReactNode } from 'react'

interface ControlProps {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

interface Props {
  id: string
  label: string
  error?: string
  /** Riceve gli attributi da applicare al campo, già collegati a etichetta ed errore. */
  children: (control: ControlProps) => ReactNode
}

/** Etichetta visibile, campo e messaggio di errore annunciato dallo screen reader. */
export default function Field({ id, label, error, children }: Props) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {children({ id, ...(error && { 'aria-invalid': true, 'aria-describedby': errorId }) })}
      {error && (
        <p id={errorId} role="alert" className="text-text">
          {error}
        </p>
      )}
    </div>
  )
}
