import { type RefObject, useEffect, useId, useRef, useState } from 'react'
import { primaryButtonClass, secondaryButtonClass } from '@/components/styles'

interface Props {
  open: boolean
  title: string
  confirmLabel: string
  /**
   * Il pulsante di conferma resta disattivato dopo il tocco: al termine il genitore cambia vista.
   * Si riattiva se la promessa fallisce o se il dialog si chiude.
   */
  onConfirm: () => Promise<void>
  onClose: () => void
  /** Elemento che riceve di nuovo il focus alla chiusura. */
  returnFocusRef: RefObject<HTMLElement | null>
}

/**
 * Conferma modale. Il focus entra su "Annulla", resta nel dialog finché è aperto
 * (comportamento nativo di showModal) e torna su returnFocusRef alla chiusura.
 */
export default function ConfirmDialog({ open, title, confirmLabel, onConfirm, onClose, returnFocusRef }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  // Conferma in corso: un doppio tocco non esegue l'azione due volte
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await onConfirm()
    } catch (e) {
      setBusy(false)
      throw e
    }
  }

  useEffect(() => {
    if (!open) {
      // Chiuso dal genitore (per esempio dopo un errore): si chiude anche il dialog nativo
      if (dialogRef.current!.open) dialogRef.current!.close()
      return
    }
    if (!dialogRef.current!.open) dialogRef.current!.showModal() // StrictMode esegue l'effetto due volte
    cancelRef.current!.focus()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={() => {
        setBusy(false)
        onClose()
        returnFocusRef.current?.focus()
      }}
      className="m-auto max-w-sm rounded bg-bg p-6 text-text backdrop:bg-text/50"
    >
      <h2 id={titleId} className="mb-6 text-xl font-bold">
        {title}
      </h2>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={confirm} disabled={busy} className={primaryButtonClass}>
          {confirmLabel}
        </button>
        <button ref={cancelRef} type="button" onClick={() => dialogRef.current!.close()} className={secondaryButtonClass}>
          Annulla
        </button>
      </div>
    </dialog>
  )
}
