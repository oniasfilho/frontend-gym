'use client'

import { useEffect, useMemo, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import type { SyntaxNode } from '@lezer/common'
import {
  Decoration,
  EditorView,
  GutterMarker,
  ViewPlugin,
  WidgetType,
  gutter,
  hoverTooltip,
  keymap,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import { Prec, RangeSet, RangeSetBuilder, StateEffect, StateField, type EditorState } from '@codemirror/state'
import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete'
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

/** Text shown after the end of a line: a peeked value, or a note about a watched line. */
export type Ghost = { line: number; text: string; tone: 'value' | 'dim' | 'note' }

// — Watches (breakpoints) —

const toggleBreakpoint = StateEffect.define<number>()

class WatchLineMarker extends GutterMarker {}
const watchLineMarker = new WatchLineMarker()

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
      set = present ? set.update({ filter: (from) => from !== effect.value }) : set.update({ add: [watchLineMarker.range(effect.value)] })
    }
    return set
  },
  provide: (field) =>
    EditorView.decorations.compute([field], (state) => {
      const lines: number[] = []
      for (let cursor = state.field(field).iter(); cursor.value; cursor.next()) lines.push(cursor.from)
      return Decoration.set([...new Set(lines)].map((from) => Decoration.line({ class: 'cm-watch-line' }).range(from)))
    }),
})

const watchable = StateField.define<Set<number>>({
  create: (state) => breakableLines(state.doc.toString()),
  update: (lines, tr) => (tr.docChanged ? breakableLines(tr.state.doc.toString()) : lines),
})

function isWatched(state: EditorState, lineStart: number) {
  let present = false
  state.field(breakpoints).between(lineStart, lineStart, () => {
    present = true
  })
  return present
}

function breakpointLines(state: EditorState) {
  const lines = new Set<number>()
  for (let cursor = state.field(breakpoints).iter(); cursor.value; cursor.next()) lines.add(state.doc.lineAt(cursor.from).number)
  return [...lines].sort((a, b) => a - b)
}

function toggleWatchAt(view: EditorView, pos: number) {
  const line = view.state.doc.lineAt(pos)
  if (isWatched(view.state, line.from) || view.state.field(watchable).has(line.number)) view.dispatch({ effects: toggleBreakpoint.of(line.from) })
  return true
}

class WatchMarker extends GutterMarker {
  constructor(
    readonly number: number,
    readonly watched: boolean,
    readonly canWatch: boolean,
    readonly shortcut: string,
  ) {
    super()
  }

  eq(other: WatchMarker) {
    return other.number === this.number && other.watched === this.watched && other.canWatch === this.canWatch && other.shortcut === this.shortcut
  }

  toDOM() {
    const root = document.createElement('span')
    root.className = this.watched ? 'cm-watch cm-watch-on' : this.canWatch ? 'cm-watch' : 'cm-watch cm-watch-off'
    root.title = this.watched ? `Stop watching line ${this.number}` : this.canWatch ? `Watch line ${this.number} (${this.shortcut})` : 'Nothing to watch on this line'
    const dot = document.createElement('span')
    dot.className = 'cm-watch-dot'
    const number = document.createElement('span')
    number.className = 'cm-watch-number'
    number.textContent = String(this.number)
    root.append(dot, number)
    return root
  }
}

function watchGutter(shortcut: string) {
  return gutter({
    class: 'cm-watch-gutter',
    lineMarker(view, line) {
      const number = view.state.doc.lineAt(line.from).number
      return new WatchMarker(number, isWatched(view.state, line.from), view.state.field(watchable).has(number), shortcut)
    },
    lineMarkerChange: (update) => update.docChanged || update.startState.field(breakpoints) !== update.state.field(breakpoints),
    initialSpacer: () => new WatchMarker(9, false, true, shortcut),
    domEventHandlers: { mousedown: (view, line) => toggleWatchAt(view, line.from) },
  })
}

// — Inline peek values —

const setGhosts = StateEffect.define<Ghost[]>()

class GhostWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly tone: Ghost['tone'],
  ) {
    super()
  }

  eq(other: GhostWidget) {
    return other.text === this.text && other.tone === this.tone
  }

  toDOM() {
    const element = document.createElement('span')
    element.className = `cm-ghost cm-ghost-${this.tone}`
    element.textContent = this.text
    element.setAttribute('aria-hidden', 'true')
    return element
  }
}

// Ghosts are anchored to line starts so they follow their line until the next run replaces them.
const ghosts = StateField.define<{ from: number; ghost: Ghost }[]>({
  create: () => [],
  update(placed, tr) {
    for (const effect of tr.effects) {
      if (!effect.is(setGhosts)) continue
      const doc = tr.state.doc
      return effect.value.filter((ghost) => ghost.line >= 1 && ghost.line <= doc.lines).map((ghost) => ({ from: doc.line(ghost.line).from, ghost }))
    }
    if (!tr.docChanged) return placed
    // A whole-document replace (reset, types toggle) leaves no line to follow.
    if (tr.changes.touchesRange(0, tr.startState.doc.length) === 'cover') return []
    return placed.map((item) => ({ ...item, from: tr.changes.mapPos(item.from, -1) }))
  },
  provide: (field) =>
    EditorView.decorations.compute([field], (state) =>
      Decoration.set(
        state.field(field).map(({ from, ghost }) => Decoration.widget({ widget: new GhostWidget(ghost.text, ghost.tone), side: 1 }).range(state.doc.lineAt(from).to)),
        true,
      ),
    ),
})

// — Syntax colors —

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.self], color: 'var(--color-accent-400)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.function(t.definition(t.variableName))], color: 'var(--syn-fn)' },
  { tag: [t.variableName, t.definition(t.variableName)], color: 'var(--color-neutral-100)' },
  { tag: [t.propertyName, t.definition(t.propertyName)], color: 'var(--color-neutral-300)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--syn-str)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--syn-num)' },
  { tag: [t.operator, t.function(t.punctuation)], color: 'var(--color-accent-300)' },
  { tag: [t.punctuation, t.derefOperator], color: 'var(--color-neutral-500)' },
  { tag: t.comment, color: 'var(--color-neutral-600)', fontStyle: 'italic' },
  { tag: [t.typeName, t.className], color: 'var(--color-neutral-400)' },
])

const LITERALS = new Set(['undefined', 'NaN', 'Infinity'])
const paramMark = Decoration.mark({ class: 'cm-param' })
const literalMark = Decoration.mark({ class: 'cm-literal' })

function isParameter(node: SyntaxNode) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.name === 'ParamList') return true
    if (!parent.name.includes('Pattern') && parent.name !== 'PatternProperty') return false
  }
  return false
}

// Parameters read in italics wherever their name appears, like the design's tokenizer.
function nameDecorations(state: EditorState) {
  const tree = syntaxTree(state)
  const doc = state.doc
  const params = new Set<string>()
  tree.iterate({
    enter(node) {
      if (node.name === 'VariableDefinition' && isParameter(node.node)) params.add(doc.sliceString(node.from, node.to))
    },
  })
  const builder = new RangeSetBuilder<Decoration>()
  tree.iterate({
    enter(node) {
      if (node.name !== 'VariableName' && node.name !== 'VariableDefinition') return
      const name = doc.sliceString(node.from, node.to)
      if (node.name === 'VariableName' && LITERALS.has(name)) builder.add(node.from, node.to, literalMark)
      else if (params.has(name) && !(node.node.parent?.name === 'CallExpression' && node.node.parent.firstChild?.from === node.from)) builder.add(node.from, node.to, paramMark)
    },
  })
  return builder.finish()
}

const names = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = nameDecorations(view.state)
    }
    update(update: ViewUpdate) {
      if (update.docChanged || syntaxTree(update.startState) !== syntaxTree(update.state)) this.decorations = nameDecorations(update.state)
    }
  },
  { decorations: (plugin) => plugin.decorations },
)

const tint = (color: string, amount: number) => `color-mix(in srgb, var(${color}) ${amount}%, transparent)`

const surface = EditorView.theme(
  {
    '&': { height: '100%', fontSize: '13.5px', color: 'var(--color-neutral-100)', backgroundColor: 'transparent' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '21px' },
    '.cm-content': { padding: '14px 14px 14px 4px', caretColor: 'var(--color-accent-300)' },
    '.cm-content:focus-visible': { outline: 'none' },
    '.cm-cursor, .cm-dropCursor': { borderLeft: '2px solid var(--color-accent-300)' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: tint('--color-accent', 30),
    },
    '.cm-activeLine': { backgroundColor: tint('--color-text', 3) },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': { backgroundColor: tint('--color-accent', 22), outline: 'none' },
    '.cm-param': { color: 'var(--syn-param)', fontStyle: 'italic' },
    '.cm-literal': { color: 'var(--syn-num)' },

    '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent' },
    '.cm-watch-gutter .cm-gutterElement': { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 10px', cursor: 'pointer' },
    '.cm-watch-gutter .cm-gutterElement:has(.cm-watch-off)': { cursor: 'default' },
    '.cm-watch': { display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--color-neutral-700)' },
    '.cm-activeLineGutter .cm-watch': { color: 'var(--color-neutral-500)' },
    '.cm-gutterElement:hover .cm-watch:not(.cm-watch-off), .cm-watch.cm-watch-on': { color: 'var(--color-accent-300)' },
    '.cm-watch-dot': { width: '7px', height: '7px', borderRadius: '50%' },
    '.cm-watch-on .cm-watch-dot': { backgroundColor: 'var(--color-accent)' },
    '.cm-watch-number': { minWidth: '2ch', textAlign: 'right' },
    '.cm-watch-line': { backgroundColor: tint('--color-accent', 9) },

    '.cm-ghost': {
      display: 'inline-block',
      maxWidth: 'calc(100% - 3ch)',
      marginLeft: '3ch',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'pre',
      verticalAlign: 'top',
      fontSize: '12px',
      pointerEvents: 'none',
      userSelect: 'none',
    },
    '.cm-ghost-value': { color: 'var(--color-accent-300)' },
    '.cm-ghost-dim, .cm-ghost-note': { color: 'var(--color-neutral-600)' },

    '.cm-tooltip': {
      overflow: 'hidden',
      border: 'none',
      borderRadius: '10px',
      color: 'var(--color-text)',
      backgroundColor: 'var(--color-surface)',
      boxShadow: 'var(--shadow-md)',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul': { padding: '4px', fontFamily: 'var(--font-mono)', fontSize: '12.5px' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li': { padding: '3px 8px', borderRadius: '6px' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': { color: 'var(--color-text)', backgroundColor: tint('--color-accent', 16) },
    '.cm-completionMatchedText': { textDecoration: 'none', color: 'var(--color-accent-300)' },
    '.cm-completionDetail': { color: 'var(--color-neutral-500)', fontStyle: 'normal' },
    '.cm-shape-hover': { maxWidth: '28rem', maxHeight: '18rem', overflow: 'auto', padding: '8px 10px' },
    '.cm-shape-hover-label': { marginBottom: '4px', color: 'var(--color-neutral-400)', fontFamily: 'var(--font-mono)', fontSize: '11px' },
    '.cm-shape-hover-body': {
      margin: 0,
      color: 'var(--color-neutral-200)',
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      lineHeight: '1.55',
      whiteSpace: 'pre',
    },

    '.cm-panels': { color: 'var(--color-text)', backgroundColor: 'var(--color-surface)' },
    '.cm-panels.cm-panels-bottom': { borderTop: '1px solid var(--color-divider)' },
    '.cm-panels.cm-panels-top': { borderBottom: '1px solid var(--color-divider)' },
    '.cm-textfield': { border: '1px solid var(--color-divider)', borderRadius: '6px', backgroundColor: 'var(--color-bg)' },
    '.cm-button': { border: '1px solid var(--color-divider)', borderRadius: '6px', backgroundImage: 'none', backgroundColor: 'transparent', color: 'var(--color-text)' },
    '.cm-searchMatch': { backgroundColor: tint('--color-accent', 20), outline: 'none' },
    '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: tint('--color-accent', 38) },
  },
  { dark: true },
)

const editorTheme = [surface, syntaxHighlighting(highlight)]

export function CodeEditor({
  value,
  onChange,
  onPrimary,
  onNext,
  onBeautify,
  breakpoints: initialBreakpoints,
  onBreakpointsChange,
  params,
  ghosts: ghostList,
  watchShortcut,
  onReady,
}: {
  value: string
  onChange: (value: string) => void
  /** Run, or move on when the answer is already correct. */
  onPrimary: () => void
  onNext: () => void
  onBeautify: () => void
  /** Restored when the editor mounts; afterwards the editor owns them and reports changes. */
  breakpoints: number[]
  onBreakpointsChange: (lines: number[]) => void
  params: Param[]
  ghosts: Ghost[]
  watchShortcut: string
  onReady?: (view: EditorView | null) => void
}) {
  const handlers = useRef({ onPrimary, onNext, onBeautify, onBreakpointsChange })
  handlers.current = { onPrimary, onNext, onBeautify, onBreakpointsChange }
  const viewRef = useRef<EditorView | null>(null)
  const ghostsRef = useRef(ghostList)
  ghostsRef.current = ghostList

  const extensions = useMemo(() => {
    const support = javascript({ typescript: true })
    return [
      support,
      support.language.data.of({ autocomplete: shapeCompletions(params) }),
      hoverTooltip(shapeHover(params), { hideOnChange: true }),
      EditorView.lineWrapping,
      names,
      breakpoints,
      watchable,
      ghosts,
      watchGutter(watchShortcut),
      EditorView.updateListener.of((update) => {
        if (update.startState.field(breakpoints) === update.state.field(breakpoints)) return
        const before = breakpointLines(update.startState)
        const after = breakpointLines(update.state)
        if (after.length !== before.length || after.some((line, i) => line !== before[i])) handlers.current.onBreakpointsChange(after)
      }),
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              handlers.current.onPrimary()
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
          { key: 'Mod-.', run: (view) => toggleWatchAt(view, view.state.selection.main.head) },
        ]),
      ),
    ]
  }, [params, watchShortcut])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: setGhosts.of(ghostList) })
  }, [ghostList])

  useEffect(() => () => onReady?.(null), [onReady])

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={editorTheme}
      extensions={extensions}
      height="100%"
      className="h-full"
      autoFocus
      aria-label="Solution editor"
      basicSetup={{ foldGutter: false, lineNumbers: false, highlightActiveLineGutter: true, tabSize: 2 }}
      onCreateEditor={(view) => {
        viewRef.current = view
        onReady?.(view)
        const restore = initialBreakpoints.filter((line) => line <= view.state.doc.lines)
        if (restore.length) view.dispatch({ effects: restore.map((line) => toggleBreakpoint.of(view.state.doc.line(line).from)) })
        // Coming back to an exercise shows its last values again.
        if (ghostsRef.current.length) view.dispatch({ effects: setGhosts.of(ghostsRef.current) })
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
