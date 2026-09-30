export type DiffKind = 'changed' | 'missing' | 'unexpected' | 'type'

export type DiffEntry = {
  path: string
  kind: DiffKind
  expected?: unknown
  actual?: unknown
}

const MAX_ENTRIES = 50

function kindOf(value: unknown) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

function joinKey(path: string, key: string) {
  return IDENTIFIER.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`
}

function walk(expected: unknown, actual: unknown, path: string, out: DiffEntry[]) {
  if (out.length >= MAX_ENTRIES) return
  const expectedKind = kindOf(expected)
  const actualKind = kindOf(actual)
  if (expectedKind !== actualKind) { out.push({ path, kind: 'type', expected, actual }); return }
  if (expectedKind === 'array') {
    const e = expected as unknown[]; const a = actual as unknown[]; const length = Math.max(e.length, a.length)
    for (let i=0;i<length;i++) { const itemPath=`${path}[${i}]`; if (i>=a.length) out.push({path:itemPath,kind:'missing',expected:e[i]}); else if (i>=e.length) out.push({path:itemPath,kind:'unexpected',actual:a[i]}); else walk(e[i],a[i],itemPath,out) }
    return
  }
  if (expectedKind === 'object') {
    const e=expected as Record<string,unknown>; const a=actual as Record<string,unknown>; const keys=new Set([...Object.keys(e),...Object.keys(a)])
    for (const key of keys) { const keyPath=joinKey(path,key); if (!(key in a)) out.push({path:keyPath,kind:'missing',expected:e[key]}); else if (!(key in e)) out.push({path:keyPath,kind:'unexpected',actual:a[key]}); else walk(e[key],a[key],keyPath,out) }
    return
  }
  if (!Object.is(expected,actual)) out.push({path,kind:'changed',expected,actual})
}

export function structuralDiff(expected: unknown, actual: unknown): DiffEntry[] { const out: DiffEntry[]=[]; walk(expected,actual,'result',out); return out }
export function formatValue(value: unknown,max=80): string { if (value===undefined) return 'undefined'; let text:string; try { text=JSON.stringify(value) ?? String(value) } catch { text=String(value) } return text.length>max?`${text.slice(0,max-1)}…`:text }
export function toJson(value: unknown): string { if (value===undefined) return 'undefined'; try { return JSON.stringify(value,null,2) ?? String(value) } catch { return String(value) } }
