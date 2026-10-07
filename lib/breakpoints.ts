import { parser } from '@lezer/javascript'
import type { SyntaxNode } from '@lezer/common'

// Turns breakpoint lines and peek() calls into line-tagged __peekAt() calls before a run.
// The editor's source is never changed, and no edit adds a newline, so line numbers hold.

const tsParser = parser.configure({ dialect: 'ts' })
const STATEMENTS = new Set(['VariableDeclaration', 'ReturnStatement', 'ExpressionStatement', 'IfStatement', 'WhileStatement', 'ForStatement'])
// Calls whose return value is less useful than the collection they change.
const MUTATORS = new Set(['push', 'unshift', 'pop', 'shift', 'splice', 'sort', 'reverse', 'fill', 'set', 'add', 'delete', 'clear'])
const MAX_LABEL = 40

type Edit = { at: number; text: string; close: boolean; depth: number }

function lineStarts(source: string) {
  const starts = [0]
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') starts.push(i + 1)
  return starts
}

function lineAt(starts: number[], pos: number) {
  let low = 0
  let high = starts.length - 1
  while (low < high) {
    const mid = (low + high + 1) >> 1
    if (starts[mid] <= pos) low = mid
    else high = mid - 1
  }
  return low + 1
}

/** Source text as a short one-line label, quoted for insertion into code. */
function labelOf(text: string) {
  const flat = text.replace(/\s+/g, ' ').trim()
  return JSON.stringify(flat.length > MAX_LABEL ? `${flat.slice(0, MAX_LABEL - 1)}…` : flat)
}

function peekAt(line: number, label: string) {
  return `__peekAt(${line}, ${label})`
}

/** The outermost statement starting on each line, keyed by 1-based line number. */
function statementsByLine(source: string) {
  const starts = lineStarts(source)
  const byLine = new Map<number, { node: SyntaxNode; depth: number }>()
  let depth = 0
  tsParser.parse(source).iterate({
    enter(ref) {
      depth++
      if (!STATEMENTS.has(ref.name) || ref.node.parent?.name === 'ForSpec') return
      const line = lineAt(starts, ref.from)
      if (!byLine.has(line)) byLine.set(line, { node: ref.node, depth })
    },
    leave() {
      depth--
    },
  })
  return byLine
}

function children(node: SyntaxNode) {
  const list: SyntaxNode[] = []
  for (let child = node.firstChild; child; child = child.nextSibling) list.push(child)
  return list
}

function bindingNames(pattern: SyntaxNode, source: string) {
  if (pattern.name === 'VariableDefinition' || pattern.name === 'VariableName') return source.slice(pattern.from, pattern.to)
  const names: string[] = []
  const cursor = pattern.cursor()
  while (cursor.next() && cursor.from < pattern.to) {
    if (cursor.name === 'VariableDefinition') names.push(source.slice(cursor.from, cursor.to))
  }
  if (names.length === 0) return null
  return pattern.name === 'ArrayPattern' ? `[${names.join(', ')}]` : `{ ${names.join(', ')} }`
}

function wrap(node: SyntaxNode, line: number, label: string, depth: number): Edit[] {
  return [
    { at: node.from, text: `${peekAt(line, label)}((`, close: false, depth },
    { at: node.to, text: '))', close: true, depth },
  ]
}

function edgesOf(node: SyntaxNode, line: number, depth: number, source: string): Edit[] | null {
  const text = (part: SyntaxNode) => source.slice(part.from, part.to)
  const parts = children(node)

  switch (node.name) {
    case 'VariableDeclaration': {
      const edits = parts.flatMap((part, i) => {
        if (parts[i - 1]?.name !== 'Equals') return []
        const binding = parts.slice(0, i - 1).reverse().find((item) => item.name === 'VariableDefinition' || item.name.endsWith('Pattern'))
        return wrap(part, line, labelOf(binding ? text(binding) : text(part)), depth)
      })
      return edits.length ? edits : null
    }
    case 'ReturnStatement': {
      const value = parts.find((part) => part.name !== 'return' && part.name !== ';')
      return value ? wrap(value, line, '"return"', depth) : null
    }
    case 'ExpressionStatement': {
      const expr = parts[0]
      const callee = expr.name === 'CallExpression' ? expr.firstChild : null
      const method = callee?.name === 'MemberExpression' ? callee.lastChild : null
      const receiver = callee && method ? source.slice(callee.from, method.from).replace(/\??\.$/, '') : ''
      if (method && MUTATORS.has(text(method)) && /^[\w$.]+$/.test(receiver)) {
        const braced = node.parent?.name !== 'Block' && node.parent?.name !== 'Script'
        return [
          ...(braced ? [{ at: node.from, text: '{', close: false, depth }] : []),
          { at: node.to, text: `;${peekAt(line, labelOf(receiver))}(${receiver});${braced ? '}' : ''}`, close: true, depth },
        ]
      }
      // An assignment or update reads best under the name it changes.
      const target = expr.name === 'AssignmentExpression' ? expr.firstChild : expr.name === 'PostfixExpression' || expr.name === 'UnaryExpression' ? expr.getChild('VariableName') : null
      return wrap(expr, line, labelOf(text(target ?? expr)), depth)
    }
    case 'IfStatement':
    case 'WhileStatement': {
      const condition = node.getChild('ParenthesizedExpression')
      const inner = condition && children(condition).find((part) => part.name !== '(' && part.name !== ')')
      return inner ? wrap(inner, line, labelOf(text(inner)), depth) : null
    }
    case 'ForStatement': {
      const spec = parts[1]
      const body = parts[2]
      if (!spec || !body) return null
      let binding: string | null = null
      if (spec.name === 'ForSpec') {
        const declaration = spec.getChild('VariableDeclaration')
        const names = declaration?.getChildren('VariableDefinition').map((name) => source.slice(name.from, name.to)) ?? []
        binding = names.length === 1 ? names[0] : names.length ? `{ ${names.join(', ')} }` : null
      } else {
        const target = children(spec).find((part) => !['(', 'const', 'let', 'var'].includes(part.name))
        binding = target ? bindingNames(target, source) : null
      }
      if (!binding) return null
      const call = `${peekAt(line, labelOf(binding))}(${binding});`
      if (body.name === 'Block') return [{ at: body.from + 1, text: call, close: false, depth: depth + 1 }]
      return [
        { at: body.from, text: `{${call}`, close: false, depth },
        { at: body.to, text: '}', close: true, depth },
      ]
    }
  }
  return null
}

/** Rewrites each `peek(value, label?)` to carry its line, with the value's source text as the default label. */
function tagPeeks(source: string) {
  const starts = lineStarts(source)
  const edits: { from: number; to: number; text: string }[] = []
  tsParser.parse(source).iterate({
    enter(ref) {
      if (ref.name !== 'CallExpression') return
      const callee = ref.node.firstChild
      if (callee?.name !== 'VariableName' || source.slice(callee.from, callee.to) !== 'peek') return
      const first = ref.node.getChild('ArgList')?.firstChild?.nextSibling
      const label = first && first.name !== ')' ? labelOf(source.slice(first.from, first.to)) : 'undefined'
      edits.push({ from: callee.from, to: callee.to, text: peekAt(lineAt(starts, callee.from), label) })
    },
  })
  let out = ''
  let cursor = 0
  for (const edit of edits) {
    out += source.slice(cursor, edit.from) + edit.text
    cursor = edit.to
  }
  return out + source.slice(cursor)
}

/** 1-based line numbers that can hold a breakpoint. */
export function breakableLines(source: string) {
  const lines = new Set<number>()
  for (const [line, { node, depth }] of statementsByLine(source)) if (edgesOf(node, line, depth, source)) lines.add(line)
  return lines
}

/** Returns `source` with its peek() calls tagged by line and a capture inserted for each breakpoint line. */
export function instrument(source: string, lines: number[]) {
  const tagged = tagPeeks(source)
  const statements = statementsByLine(tagged)
  const edits = lines.flatMap((line) => {
    const statement = statements.get(line)
    return statement ? edgesOf(statement.node, line, statement.depth, tagged) ?? [] : []
  })
  // At a shared position, close inner statements first, then open outer ones first.
  edits.sort((a, b) => a.at - b.at || Number(b.close) - Number(a.close) || (a.close ? b.depth - a.depth : a.depth - b.depth))
  let out = ''
  let cursor = 0
  for (const edit of edits) {
    out += tagged.slice(cursor, edit.at) + edit.text
    cursor = edit.at
  }
  return out + tagged.slice(cursor)
}
