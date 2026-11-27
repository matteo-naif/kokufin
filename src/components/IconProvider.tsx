import { IconContext } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

// Valori comuni a tutte le icone Phosphor (design.md, "Icone"): peso bold, 20 px in rem,
// nascoste allo screen reader perché il nome lo danno il pulsante o il testo accanto
const ICON_DEFAULTS = { weight: 'bold', size: '1.25rem', 'aria-hidden': true } as const

export default function IconProvider({ children }: { children: ReactNode }) {
  return <IconContext.Provider value={ICON_DEFAULTS}>{children}</IconContext.Provider>
}
