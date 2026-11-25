import { Toaster as SonnerToaster } from 'sonner'

/**
 * Contenitore dei toast. Stile senza i default di sonner (testi in px, colori fuori palette):
 * classi Tailwind con i colori semantici e testi in rem. Ogni toast ha testo e icona.
 * sonner annuncia i toast allo screen reader con una regione aria-live="polite".
 */
export default function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      customAriaLabel="Notifiche"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'flex w-full items-center gap-3 rounded border p-4 text-base font-semibold',
          success: 'border-success bg-success-surface text-success',
          error: 'border-error bg-error-surface text-error',
          warning: 'border-warning bg-warning-surface text-warning',
          info: 'border-info bg-info-surface text-info',
        },
      }}
    />
  )
}
