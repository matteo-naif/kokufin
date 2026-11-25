// Importi salvati come interi in centesimi, sempre positivi.

const AMOUNT = /^(\d+)(?:[.,](\d{1,2}))?$/

/** Converte l'importo digitato in centesimi. Null se vuoto, zero, negativo o malformato. */
export function parseAmount(input: string): number | null {
  const match = AMOUNT.exec(input.trim())
  if (!match) return null
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return cents > 0 ? cents : null
}

const EUR = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: false })

export function formatCents(cents: number): string {
  return EUR.format(cents / 100)
}
