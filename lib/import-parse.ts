// Pure parsers for the catalog CSVs — no node/fs/__dirname deps so they are unit-testable.
// Money is integer RUPEES.

/** "₹1,902" -> 1902; "" / "—" -> null. */
export function parseINR(raw: string): number | null {
  const digits = (raw ?? '').replace(/[^0-9]/g, '')
  return digits.length ? parseInt(digits, 10) : null
}

/** "₹2499 - ₹4299" -> {min,max}; "₹1,902" -> equal min/max; "" -> nulls. */
export function parseSaleRange(raw: string): { min: number | null; max: number | null } {
  const parts = (raw ?? '')
    .split(/[-–]/)
    .map((p) => parseINR(p))
    .filter((n): n is number => n != null)
  if (parts.length === 0) return { min: null, max: null }
  if (parts.length === 1) return { min: parts[0], max: parts[0] }
  return { min: Math.min(...parts), max: Math.max(...parts) }
}

/** "47% OFF" -> 47; "" -> null. */
export function parsePercent(raw: string): number | null {
  const m = (raw ?? '').match(/(\d+)\s*%/)
  return m ? parseInt(m[1], 10) : null
}

/** Trailing numeric id of a product_url. */
export function pidFromUrl(url: string): string | null {
  const m = (url ?? '').match(/(\d{4,})(?:\.html)?\/?$/)
  return m ? m[1] : null
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Minimal RFC-4180-ish CSV parser (quoted fields, commas, "" escapes). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      if (field.length || row.length) {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      }
    } else field += c
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  const header = rows.shift() ?? []
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

const FABRIC_WORDS = ['Cotton', 'Linen', 'Silk', 'Viscose', 'Lyocell', 'Handloom', 'Chambray', 'Honeycomb', 'Woven']
export function deriveFabric(name: string): string {
  const found = FABRIC_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(name))
  return found.length ? found.join(' ') : 'Cotton'
}
