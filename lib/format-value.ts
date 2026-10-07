const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

function isPrimitive(value: unknown) {
  return value === null || typeof value !== 'object'
}

function primitive(value: unknown) {
  if (value === undefined) return 'undefined'
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value)
  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') return String(value)
  return JSON.stringify(value)
}

function key(name: string) {
  return IDENTIFIER.test(name) ? name : JSON.stringify(name)
}

/**
 * Readable value text: arrays of primitives and objects of primitives stay on one line,
 * anything deeper indents two spaces per level.
 */
export function formatValue(value: unknown, indent = ''): string {
  if (isPrimitive(value)) return primitive(value)
  const next = `${indent}  `
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const flat = `[${value.map((item) => formatValue(item, next)).join(', ')}]`
    if (value.every(isPrimitive) || (flat.length < 64 && !flat.includes('\n'))) return flat
    return `[\n${value.map((item) => next + formatValue(item, next)).join(',\n')}\n${indent}]`
  }
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (keys.length === 0) return '{}'
  if (keys.every((name) => isPrimitive(record[name]))) {
    return `{ ${keys.map((name) => `${key(name)}: ${primitive(record[name])}`).join(', ')} }`
  }
  return `{\n${keys.map((name) => `${next}${key(name)}: ${formatValue(record[name], next)}`).join(',\n')}\n${indent}}`
}

/** One-line version for inline peeks, cut at `max` characters. */
export function formatShort(value: unknown, max = 56) {
  const text = formatValue(value).replace(/\s*\n\s*/g, ' ')
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** "array · 3 items", "object · 4 keys", "number". */
export function describeValue(value: unknown) {
  if (Array.isArray(value)) return `array · ${value.length} ${value.length === 1 ? 'item' : 'items'}`
  if (value && typeof value === 'object') {
    const count = Object.keys(value).length
    return `object · ${count} ${count === 1 ? 'key' : 'keys'}`
  }
  return value === null ? 'null' : typeof value
}
