export type Shape =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'null' }
  | { kind: 'unknown' }
  | { kind: 'union'; options: Shape[] }
  | { kind: 'array'; element: Shape }
  | { kind: 'record'; value: Shape }
  | { kind: 'object'; fields: { name: string; optional: boolean; shape: Shape }[] }

export type Param = { name: string; shape: Shape }

const RESERVED = new Set([
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Function',
  'Record',
  'Date',
  'Map',
  'Set',
  'Promise',
  'Partial',
  'Required',
  'Pick',
  'Omit',
])

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

function pascal(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function singular(label: string) {
  const name = pascal(label)
  if (name.endsWith('ies')) return `${name.slice(0, -3)}y`
  if (name.endsWith('s') && !name.endsWith('ss')) return name.slice(0, -1)
  return `${name}Item`
}

function uniqueName(base: string, used: Set<string>) {
  let name = base
  let n = 2
  while (used.has(name) || RESERVED.has(name)) {
    name = `${base}${n}`
    n += 1
  }
  used.add(name)
  return name
}

function isLookup(value: Record<string, unknown>) {
  const keys = Object.keys(value)
  if (keys.length === 0) return false
  if (keys.some((key) => !IDENTIFIER.test(key))) return true
  return keys.every((key) => /^[A-Z0-9_]+$/.test(key))
}

export function inferShape(value: unknown): Shape {
  if (value === null) return { kind: 'null' }
  if (Array.isArray(value)) return { kind: 'array', element: mergeShapes(value.map(inferShape)) }
  if (value instanceof Map) return { kind: 'record', value: mergeShapes([...value.values()].map(inferShape)) }
  switch (typeof value) {
    case 'string':
      return { kind: 'string' }
    case 'number':
      return { kind: 'number' }
    case 'boolean':
      return { kind: 'boolean' }
    case 'object':
      return objectShape(value as Record<string, unknown>)
    default:
      return { kind: 'unknown' }
  }
}

function objectShape(value: Record<string, unknown>): Shape {
  if (isLookup(value)) {
    return { kind: 'record', value: mergeShapes(Object.values(value).map(inferShape)) }
  }
  return {
    kind: 'object',
    fields: Object.keys(value).map((name) => ({
      name,
      optional: false,
      shape: inferShape(value[name]),
    })),
  }
}

function mergeShapes(shapes: Shape[]): Shape {
  const known = shapes.filter((shape) => shape.kind !== 'unknown')
  if (known.length === 0) return { kind: 'unknown' }
  return mergeKnown(known)
}

function mergeKnown(shapes: Shape[]): Shape {
  if (shapes.every((shape) => shape.kind === 'array')) {
    return { kind: 'array', element: mergeShapes(shapes.map((shape) => (shape as { element: Shape }).element)) }
  }
  if (shapes.every((shape) => shape.kind === 'object')) {
    return mergeObjects(shapes as Extract<Shape, { kind: 'object' }>[])
  }
  if (shapes.every((shape) => shape.kind === 'record')) {
    return { kind: 'record', value: mergeShapes(shapes.map((shape) => (shape as { value: Shape }).value)) }
  }
  const first = shapes[0]
  if (shapes.every((shape) => shape.kind === first.kind) && (first.kind === 'string' || first.kind === 'number' || first.kind === 'boolean' || first.kind === 'null')) {
    return first
  }
  const options = dedupe(shapes.flatMap((shape) => (shape.kind === 'union' ? shape.options : [shape])))
  if (options.length === 1) return options[0]
  return { kind: 'union', options }
}

function mergeObjects(shapes: Extract<Shape, { kind: 'object' }>[]): Shape {
  const names: string[] = []
  const seen = new Set<string>()
  for (const shape of shapes) {
    for (const field of shape.fields) {
      if (seen.has(field.name)) continue
      seen.add(field.name)
      names.push(field.name)
    }
  }
  return {
    kind: 'object',
    fields: names.map((name) => {
      const present = shapes.filter((shape) => shape.fields.some((field) => field.name === name))
      return {
        name,
        optional: present.length < shapes.length,
        shape: mergeShapes(present.map((shape) => shape.fields.find((field) => field.name === name)!.shape)),
      }
    }),
  }
}

function dedupe(shapes: Shape[]) {
  const out: Shape[] = []
  const seen = new Set<string>()
  for (const shape of shapes) {
    const key = JSON.stringify(shape)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(shape)
  }
  return out
}

export function formatShape(shape: Shape) {
  return printInline(shape, 0)
}

function printInline(shape: Shape, indent: number): string {
  switch (shape.kind) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'unknown':
      return shape.kind
    case 'union':
      return shape.options.map((option) => printInline(option, indent)).join(' | ')
    case 'array': {
      const element = printInline(shape.element, indent)
      return shape.element.kind === 'union' ? `(${element})[]` : `${element}[]`
    }
    case 'record':
      return `Record<string, ${printInline(shape.value, indent)}>`
    case 'object':
      return printObject(shape, indent)
  }
}

function printObject(shape: Extract<Shape, { kind: 'object' }>, indent: number) {
  if (shape.fields.length === 0) return '{}'
  const pad = '  '.repeat(indent)
  const inner = '  '.repeat(indent + 1)
  const lines = shape.fields.map((field) => `${inner}${field.name}${field.optional ? '?' : ''}: ${printInline(field.shape, indent + 1)}`)
  return `{\n${lines.join('\n')}\n${pad}}`
}

function declaration(label: string, shape: Shape, used: Set<string>) {
  if (shape.kind === 'array' && shape.element.kind === 'object') {
    const name = uniqueName(singular(label), used)
    return { typeName: `${name}[]`, decl: `type ${name} = ${printObject(shape.element, 0)}` }
  }
  if (shape.kind === 'object') {
    const name = uniqueName(pascal(label), used)
    return { typeName: name, decl: `type ${name} = ${printObject(shape, 0)}` }
  }
  return { typeName: printInline(shape, 0), decl: '' }
}

export function describeInputs(labelA: string, valueA: unknown, labelB: string, valueB: unknown) {
  const used = new Set<string>()
  const shapeA = inferShape(valueA)
  const shapeB = inferShape(valueB)
  const a = declaration(labelA, shapeA, used)
  const b = declaration(labelB, shapeB, used)
  const declarations = [a.decl, b.decl].filter(Boolean).join('\n\n')
  const params: [Param, Param] = [
    { name: labelA, shape: shapeA },
    { name: labelB, shape: shapeB },
  ]
  const starter = `function solve(${labelA}: ${a.typeName}, ${labelB}: ${b.typeName}) {\n  \n}\n`
  return { starter, declarations, params }
}

export function withDeclarations(code: string, declarations: string) {
  if (!declarations || code.startsWith(`${declarations}\n`)) return code
  return `${declarations}\n\n${code}`
}

export function withoutDeclarations(code: string, declarations: string) {
  const prefix = `${declarations}\n\n`
  if (!declarations || !code.startsWith(prefix)) return code
  return code.slice(prefix.length)
}

export type Step = { kind: 'prop'; name: string } | { kind: 'index' }

export function parseReceiver(expr: string): { root: string; steps: Step[] } | null {
  const rootMatch = /^[A-Za-z_$][\w$]*/.exec(expr)
  if (!rootMatch) return null
  const root = rootMatch[0]
  const steps: Step[] = []
  let i = root.length
  while (i < expr.length) {
    const char = expr[i]
    if (char === ' ' || char === '\n' || char === '\t') {
      i += 1
      continue
    }
    if (char === '.') {
      i += 1
      while (expr[i] === ' ') i += 1
      const prop = /^[A-Za-z_$][\w$]*/.exec(expr.slice(i))
      if (!prop) return null
      steps.push({ kind: 'prop', name: prop[0] })
      i += prop[0].length
      continue
    }
    if (char === '[') {
      const end = expr.indexOf(']', i)
      if (end < 0) return null
      steps.push({ kind: 'index' })
      i = end + 1
      continue
    }
    return null
  }
  return { root, steps }
}

export function resolveShape(shape: Shape, steps: Step[]): Shape | null {
  let current: Shape | null = shape
  for (const step of steps) {
    if (!current) return null
    current = descend(current, step)
  }
  return current
}

function descend(shape: Shape, step: Step): Shape | null {
  if (shape.kind === 'union') {
    const next = shape.options.map((option) => descend(option, step)).filter((option): option is Shape => option !== null)
    if (next.length === 0) return null
    return mergeShapes(next)
  }
  if (step.kind === 'index') return shape.kind === 'array' ? shape.element : null
  if (shape.kind === 'object') return shape.fields.find((field) => field.name === step.name)?.shape ?? null
  if (shape.kind === 'record' && step.kind === 'prop') return shape.value
  return null
}

export function shapeDetail(shape: Shape): string {
  switch (shape.kind) {
    case 'array':
      return `${shapeDetail(shape.element)}[]`
    case 'record':
      return `Record<string, ${shapeDetail(shape.value)}>`
    case 'object':
      return 'object'
    case 'union':
      return shape.options.map(shapeDetail).join(' | ')
    default:
      return shape.kind
  }
}

export function aliasShapes(doc: string, params: Param[]) {
  const map = new Map<string, Shape>(params.map((param) => [param.name, param.shape]))
  const signature = /function\s+solve\s*\(([^)]*)\)/.exec(doc)
  if (signature) {
    splitParams(signature[1]).forEach((part, index) => {
      const name = /^\s*(?:\.\.\.\s*)?([A-Za-z_$][\w$]*)/.exec(part)?.[1]
      if (name && params[index]) map.set(name, params[index].shape)
    })
  }
  const call = /((?:[A-Za-z_$][\w$]*)(?:\s*(?:\.\s*[A-Za-z_$][\w$]*|\[[^\]]*\])*)*)\s*\.\s*(map|filter|flatMap|forEach|find|some|every|reduce)\s*(?:<[^>]*>)?\s*\(\s*(?:async\s*)?(?:\(\s*)?([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?/g
  for (const match of doc.matchAll(call)) {
    const receiver = resolveExpr(match[1], map)
    if (receiver?.kind !== 'array') continue
    const name = match[2] === 'reduce' ? match[4] : match[3]
    if (name) map.set(name, receiver.element)
  }
  const loop = /for\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s+of\s+([A-Za-z_$][\w$]*)/g
  for (const match of doc.matchAll(loop)) {
    const receiver = map.get(match[2])
    if (receiver?.kind === 'array') map.set(match[1], receiver.element)
  }
  return map
}

function splitParams(list: string) {
  const parts: string[] = []
  let current = ''
  let depth = 0
  for (const char of list) {
    if (char === '<' || char === '(' || char === '{' || char === '[') depth += 1
    if ((char === '>' || char === ')' || char === '}' || char === ']') && depth > 0) depth -= 1
    if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current)
  return parts
}

export function resolveExpr(expr: string, roots: Map<string, Shape>) {
  const parsed = parseReceiver(expr.replace(/\s+/g, ''))
  if (!parsed) return null
  const root = roots.get(parsed.root)
  if (!root) return null
  return resolveShape(root, parsed.steps)
}

export const ARRAY_METHODS = ['map', 'filter', 'flatMap', 'find', 'some', 'every', 'reduce', 'forEach', 'slice', 'concat', 'includes', 'at', 'findIndex', 'join', 'length'] as const
