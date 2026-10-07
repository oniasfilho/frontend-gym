'use client'

import { useMemo, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { syntaxTree } from '@codemirror/language'
import { Decoration, EditorView, GutterMarker, gutter, hoverTooltip, keymap, lineNumbers } from '@codemirror/view'
import { Prec, RangeSet, StateEffect, StateField } from '@codemirror/state'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import { useTheme } from 'next-themes'
import {
  ARRAY_METHODS,
  aliasShapes,
  formatShape,
  parseReceiver,
  resolveExpr,
  resolveShape,
  shapeDetail,
  type Param,
  type Shape,
} from '@/lib/shape'
import { breakableLines } from '@/lib/breakpoints'

class BreakpointMarker extends GutterMarker {
  toDOM() {
    const dot = document.createElement('span')
    dot.className = 'cm-breakpoint'
    return dot
  }
}

const breakpointMarker = new BreakpointMarker()
const toggleBreakpoint = StateEffect.define<number>()

const breakpoints = StateField.define<RangeSet<GutterMarker>>({
  create: () => RangeSet.empty,
  update(set, tr) {
    set = set.map(tr.changes)
    for (const effect of tr.effects) {
      if (!effect.is(toggleBreakpoint)) continue
      let present = false
      set.between(effect.value, effect.value, () => {
        present = true
      })
      set = present ? set.update({ filter: (from) => from !== effect.value }) : set.update({ add: [breakpointMarker.range(effect.value)] })
    }
    return set
  },
  provide: (field) =>
    EditorView.decorations.compute([field], (state) => {
      const lines: number[] = []
      for (let cursor = state.field(field).iter(); cursor.value; cursor.next()) lines.push(cursor.from)
      return Decoration.set([...new Set(lines)].map((from) => Decoration.line({ class: 'cm-breakpoint-line' }).range(from)))
    }),
})

function breakpointLines(view: EditorView) {
  const lines = new Set<number>()
  for (let cursor = view.state.field(breakpoints).iter(); cursor.value; cursor.next()) lines.add(view.state.doc.lineAt(cursor.from).number)
  return [...lines].sort((a, b) => a - b)
}

function onGutterClick(view: EditorView, line: { from: number }) {
  const number = view.state.doc.lineAt(line.from).number
  let present = false
  view.state.field(breakpoints).between(line.from, line.from, () => {
    present = true
  })
  if (present || breakableLines(view.state.doc.toString()).has(number)) view.dispatch({ effects: toggleBreakpoint.of(line.from) })
  return true
}

const surface = EditorView.theme({
  '&': { height: '100%', fontSize: '13.5px', backgroundColor: 'transparent' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
  '.cm-gutters': { backgroundColor: 'transparent', borderRight: 'none' },
  '.cm-breakpoint-gutter .cm-gutterElement': { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', paddingLeft: '6px', cursor: 'pointer' },
  '.cm-lineNumbers .cm-gutterElement': { cursor: 'pointer' },
  '.cm-breakpoint': { width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: 'var(--destructive)' },
  '.cm-breakpoint-line': { backgroundColor: 'color-mix(in oklab, var(--destructive) 10%, transparent)' },
  '.cm-content': { paddingBlock: '12px' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'color-mix(in oklab, var(--muted) 60%, transparent)' },
  '.cm-tooltip': {
    overflow: 'hidden',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--popover)',
    boxShadow: '0 10px 30px color-mix(in oklab, black 18%, transparent)',
  },
  '.cm-shape-hover': { maxWidth: '28rem', maxHeight: '18rem', overflow: 'auto', padding: '8px 10px' },
  '.cm-shape-hover-label': {
    marginBottom: '4px',
    color: 'var(--muted-foreground)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
  },
  '.cm-shape-hover-body': {
    margin: 0,
    color: 'var(--popover-foreground)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    lineHeight: '1.55',
    whiteSpace: 'pre',
  },
})

export function CodeEditor({
  value,
  onChange,
  onRun,
  onNext,
  onBeautify,
  breakpoints: initialBreakpoints,
  onBreakpointsChange,
  params,
}: {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  onNext: () => void
  onBeautify: () => void
  /** Restored when the editor mounts; afterwards the editor owns them and reports changes. */
  breakpoints: number[]
  onBreakpointsChange: (lines: number[]) => void
  params: Param[]
}) {
  const { resolvedTheme } = useTheme()
  const handlers = useRef({ onRun, onNext, onBeautify, onBreakpointsChange })
  handlers.current = { onRun, onNext, onBeautify, onBreakpointsChange }

  const extensions = useMemo(() => {
    const support = javascript({ typescript: true })
    return [
      support,
      support.language.data.of({ autocomplete: shapeCompletions(params) }),
      hoverTooltip(shapeHover(params), { hideOnChange: true }),
      Prec.highest(surface),
      EditorView.lineWrapping,
      breakpoints,
      gutter({
        class: 'cm-breakpoint-gutter',
        markers: (view) => view.state.field(breakpoints),
        initialSpacer: () => breakpointMarker,
        domEventHandlers: { mousedown: onGutterClick },
      }),
      lineNumbers({ domEventHandlers: { mousedown: onGutterClick } }),
      EditorView.updateListener.of((update) => {
        if (update.startState.field(breakpoints) === update.state.field(breakpoints)) return
        const before = new Set<number>()
        for (let cursor = update.startState.field(breakpoints).iter(); cursor.value; cursor.next()) before.add(update.startState.doc.lineAt(cursor.from).number)
        const after = breakpointLines(update.view)
        if (after.length !== before.size || after.some((line) => !before.has(line))) handlers.current.onBreakpointsChange(after)
      }),
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              handlers.current.onRun()
              return true
            },
          },
          {
            key: 'Mod-Shift-Enter',
            run: () => {
              handlers.current.onNext()
              return true
            },
          },
          {
            key: 'Shift-Alt-f',
            run: () => {
              handlers.current.onBeautify()
              return true
            },
          },
        ]),
      ),
    ]
  }, [params])

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={resolvedTheme === 'dark' ? githubDark : githubLight}
      extensions={extensions}
      height="100%"
      className="h-full"
      autoFocus
      aria-label="Solution editor"
      basicSetup={{ foldGutter: false, lineNumbers: false, highlightActiveLineGutter: true, tabSize: 2 }}
      onCreateEditor={(view) => {
        const restore = initialBreakpoints.filter((line) => line <= view.state.doc.lines)
        if (restore.length) view.dispatch({ effects: restore.map((line) => toggleBreakpoint.of(view.state.doc.line(line).from)) })
        const doc = view.state.doc.toString()
        const signature = doc.lastIndexOf('function solve')
        const brace = doc.indexOf('{\n', signature)
        if (signature < 0 || brace < 0) return
        const innerEnd = doc.indexOf('\n', brace + 2)
        view.dispatch({ selection: { anchor: innerEnd === -1 ? brace + 2 : innerEnd } })
      }}
    />
  )
}

function shapeCompletions(params: Param[]): (context: CompletionContext) => CompletionResult | null {
  return (context) => {
    const node = syntaxTree(context.state).resolveInner(context.pos, -1)
    if (node.name === 'String' || node.name === 'TemplateString' || node.name === 'LineComment' || node.name === 'BlockComment' || node.name === 'Comment') {
      return null
    }
    const before = context.state.sliceDoc(0, context.pos)
    const match = before.match(/(?:^|[^.\w$])((?:[A-Za-z_$][\w$]*)(?:\s*(?:\??\.\s*[A-Za-z_$][\w$]*|\[[^\]]*\])*)*)\s*\??\.\s*([\w$]*)$/)
    if (!match) return null
    const parsed = parseReceiver(match[1].replace(/\s+/g, ''))
    if (!parsed) return null
    const root = aliasShapes(context.state.doc.toString(), params).get(parsed.root)
    if (!root) return null
    const shape = resolveShape(root, parsed.steps)
    if (!shape) return null
    const options = completionsFor(shape)
    if (options.length === 0) return null
    return { from: context.pos - match[2].length, options, validFor: /^[\w$]*$/ }
  }
}

const CHAIN = /((?:[A-Za-z_$][\w$]*)(?:\s*(?:\??\.\s*[A-Za-z_$][\w$]*|\[[^\]]*\])*)*)$/

function shapeHover(params: Param[]) {
  return (view: EditorView, pos: number, side: -1 | 1) => {
    const line = view.state.doc.lineAt(pos)
    let from = pos
    let to = pos
    const text = line.text
    while (from > line.from && /[\w$]/.test(text[from - line.from - 1])) from -= 1
    while (to < line.to && /[\w$]/.test(text[to - line.from])) to += 1
    if (from === to || (from === pos && side < 0) || (to === pos && side > 0)) return null
    const node = syntaxTree(view.state).resolveInner(from, 1)
    if (node.name === 'String' || node.name === 'TemplateString' || node.name === 'LineComment' || node.name === 'BlockComment' || node.name === 'Comment') {
      return null
    }
    const expr = CHAIN.exec(view.state.sliceDoc(0, to))?.[1]
    if (!expr) return null
    const shape = resolveExpr(expr.replace(/\?\./g, '.'), aliasShapes(view.state.doc.toString(), params))
    if (!shape) return null
    const label = expr.replace(/\s+/g, '')
    return {
      pos: from,
      end: to,
      create() {
        const dom = document.createElement('div')
        dom.className = 'cm-shape-hover'
        const title = document.createElement('div')
        title.className = 'cm-shape-hover-label'
        title.textContent = label
        const body = document.createElement('pre')
        body.className = 'cm-shape-hover-body'
        body.textContent = formatShape(shape)
        dom.append(title, body)
        return { dom }
      },
    }
  }
}

function completionsFor(shape: Shape): { label: string; type: string; detail?: string; boost?: number }[] {
  if (shape.kind === 'union') {
    const byLabel = new Map<string, { label: string; type: string; detail?: string; boost?: number }>()
    for (const option of shape.options) {
      for (const item of completionsFor(option)) byLabel.set(item.label, item)
    }
    return [...byLabel.values()]
  }
  if (shape.kind === 'array') {
    return ARRAY_METHODS.map((name) => ({
      label: name,
      type: name === 'length' ? 'property' : 'method',
      detail: name === 'length' ? 'number' : undefined,
    }))
  }
  if (shape.kind === 'object') {
    return shape.fields.map((field) => ({
      label: field.name,
      type: 'property',
      detail: `${shapeDetail(field.shape)}${field.optional ? '?' : ''}`,
      boost: 10,
    }))
  }
  return []
}
