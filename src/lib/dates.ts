/** Data locale di oggi in formato `YYYY-MM-DD`. */
export function today(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** `YYYY-MM-DD` → `YYYY-MM`. */
export function monthOf(date: string): string {
  return date.slice(0, 7)
}

/** Sposta un mese `YYYY-MM` di `delta` mesi. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const index = y * 12 + (m - 1) + delta
  const year = Math.floor(index / 12)
  return `${year}-${String((index % 12) + 1).padStart(2, '0')}`
}

/** `YYYY-MM` → "Novembre 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const label = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1))
  return label[0].toUpperCase() + label.slice(1)
}
