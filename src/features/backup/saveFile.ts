import { registerPlugin } from '@capacitor/core'

/** Plugin locale Android (SaveFilePlugin.java): finestra di sistema "Salva con nome". */
interface SaveFilePlugin {
  /** Scrive `data` nel file scelto dall'utente; `saved` è false se la finestra viene chiusa. */
  save(options: { name: string; data: string }): Promise<{ saved: boolean }>
}

export const SaveFile = registerPlugin<SaveFilePlugin>('SaveFile')
