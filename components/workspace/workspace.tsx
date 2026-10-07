'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { EditorView } from '@codemirror/view'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { exercises as allExercises } from '@/lib/exercises'
import { formatCode } from '@/lib/format-code'
import { withDeclarations, withoutDeclarations } from '@/lib/shape'
import { structuralDiff } from '@/lib/diff'
import { sameJson } from '@/lib/json'
import { breakableLines } from '@/lib/breakpoints'
import { groupPeeks, inlineText } from '@/lib/peeks'
import { canCompile, runSolution, type Peek } from '@/lib/runner'
import { applyTheme, DEFAULT_THEME, THEME_NAMES } from '@/lib/themes'
import { useProgress } from '@/hooks/use-progress'
import { celebrate, useEnterAnimation } from '@/hooks/use-enter-animation'
import { cn } from '@/lib/utils'
import { conceptPaths, exercisesForPath, focusOf, nextPathAfter, supportOf, type ConceptPath } from '@/lib/curriculum'
import type { Ghost } from './code-editor'
import { PathComplete } from './curriculum-views'
import { ValueBlock } from './data-panel'
import { Home } from './home'
import { JumpPalette, type JumpItem } from './jump-palette'
import { Shortcut, useIsMac, useKeys } from './kbd'
import { OutputPanel, type OutputTab, type RunState } from './result-panel'
import { TopBar, type ExerciseLink } from './top-bar'

const CodeEditor = dynamic(() => import('./code-editor').then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <div className="h-full" />,
})

type View = 'home' | 'practice' | 'done'
type InputSide = 'A' | 'B'
type Overrides = Record<string, { A?: unknown; B?: unknown }>
/** What Peek and the inline values show: the latest run that compiled. */
type PeekState = { peeks: Peek[]; code: string; dimmed: boolean; ran: boolean }

const NO_BREAKPOINTS: number[] = []
const NO_PEEKS: PeekState = { peeks: [], code: '', dimmed: false, ran: false }

function requestProgressReset(action: () => void) {
  if (window.confirm('Clear every draft and solved exercise saved in this browser?')) action()
}

export function Workspace() {
  const progress = useProgress(allExercises.length)
  const { drafts, hydrated, setIndex, selectPath, setDraft, resetDraft, resetAll, markSolved, isSolved } = progress
  const keys = useKeys()
  const isMac = useIsMac()
  const theme = progress.theme ?? DEFAULT_THEME
  const solvedFlags = (slug: string) => exercisesForPath(slug).map((item) => isSolved(item.id, drafts[item.id] ?? item.starter))
  const paths: ConceptPath[] = conceptPaths.map((path) => {
    const completed = solvedFlags(path.slug).filter(Boolean).length
    return { ...path, completed, status: completed > 0 && completed === path.total ? 'completed' : completed > 0 ? 'in-progress' : path.total ? 'available' : 'not-started' }
  })
  const activePath = paths.find((path) => path.slug === progress.pathSlug && path.total > 0) ?? paths[paths.length - 1]
  const exercises = exercisesForPath(activePath.slug)
  const index = Math.min(Math.max(progress.index, 0), exercises.length - 1)
  const exercise = exercises[index]
  const code = drafts[exercise.id] ?? exercise.starter
  const solvedNow = isSolved(exercise.id, code)

  const [view, setView] = useState<View>('home')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [run, setRun] = useState<RunState>({ status: 'idle' })
  const [peekState, setPeekState] = useState<PeekState>(NO_PEEKS)
  const [tab, setTab] = useState<OutputTab>('result')
  const [overrides, setOverrides] = useState<Overrides>({})
  const [showExpected, setShowExpected] = useState(true)
  const [isFormatting, setIsFormatting] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)
  // Breakpoints belong to the open exercise only; switching exercises clears them.
  const [breakpointState, setBreakpointState] = useState({ id: exercise.id, lines: NO_BREAKPOINTS })
  if (breakpointState.id !== exercise.id) setBreakpointState({ id: exercise.id, lines: NO_BREAKPOINTS })
  const breakpoints = breakpointState.id === exercise.id ? breakpointState.lines : NO_BREAKPOINTS
  const breakpointsRef = useRef(breakpoints)
  breakpointsRef.current = breakpoints
  const runId = useRef(0)
  const liveTimer = useRef<number | undefined>(undefined)
  const formatting = useRef(false)
  const codeRef = useRef(code)
  const exerciseIdRef = useRef(exercise.id)
  codeRef.current = code
  exerciseIdRef.current = exercise.id
  const editorView = useRef<EditorView | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  // The last passing code that was celebrated, and the peek count of the last compiled run.
  const celebrated = useRef<string | null>(null)
  const lastPeekCount = useRef(0)

  useEnterAnimation(stageRef, `${view}:${activePath.slug}:${index}`)

  useEffect(() => {
    if (hydrated) applyTheme(theme)
  }, [hydrated, theme])

  const override = overrides[exercise.id]
  const valueA = override && 'A' in override ? override.A : exercise.A
  const valueB = override && 'B' in override ? override.B : exercise.B
  const hasOverride = Boolean(override && ('A' in override || 'B' in override))

  const expectedResult = useMemo(() => {
    try {
      return { value: exercise.reference(structuredClone(valueA), structuredClone(valueB)), error: null as string | null }
    } catch {
      return { value: undefined, error: "These inputs don't match the shape this exercise runs against." }
    }
  }, [exercise, valueA, valueB])

  const links: ExerciseLink[] = exercises.map((item) => ({
    id: item.id,
    title: item.title,
    solved: isSolved(item.id, drafts[item.id] ?? item.starter),
  }))

  const runSource = useCallback(
    async (source: string, { live }: { live: boolean }) => {
      window.clearTimeout(liveTimer.current)
      const id = ++runId.current
      if (!live) setRun({ status: 'running' })
      const outcome = await runSolution(source, valueA, valueB, breakpointsRef.current)
      if (id !== runId.current) return
      const compiled = outcome.ok || outcome.phase !== 'compile'
      // A run that doesn't compile keeps the last good values on screen, dimmed.
      setPeekState((prev) => (compiled ? { peeks: outcome.peeks, code: source, dimmed: false, ran: true } : { ...prev, dimmed: prev.peeks.length > 0, ran: true }))
      if (expectedResult.error) {
        setRun({
          status: 'done',
          outcome,
          diffs: [],
          code: source,
          note: outcome.ok ? expectedResult.error : undefined,
        })
        return
      }
      const diffs = outcome.ok ? structuralDiff(expectedResult.value, outcome.value) : []
      const focusViolation = exercise.path === 'filter' && /\.reduce\s*\(/.test(source)
      const passed = outcome.ok && diffs.length === 0 && !focusViolation
      if (passed && !hasOverride) markSolved(exercise.id, source)
      setRun({ status: 'done', outcome, diffs, code: source })

      const key = `${exercise.id}\n${source}`
      if (passed && celebrated.current !== key) {
        celebrated.current = key
        setTab('result')
        celebrate(outputRef.current, primaryRef.current)
      } else if (!passed && compiled && lastPeekCount.current === 0 && outcome.peeks.length > 0) {
        setTab('peek')
      }
      if (compiled) lastPeekCount.current = outcome.peeks.length
    },
    [exercise.id, exercise.path, expectedResult, hasOverride, markSolved, valueA, valueB],
  )

  const execute = useCallback(() => {
    outputRef.current?.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 220 })
    return runSource(code, { live: false })
  }, [code, runSource])

  const handleChange = useCallback(
    (value: string) => {
      if (value === code) return
      setFormatError(null)
      setDraft(exercise.id, value)
      window.clearTimeout(liveTimer.current)
      liveTimer.current = window.setTimeout(() => {
        if (!canCompile(value)) return
        void runSource(value, { live: true })
      }, 350)
    },
    [code, exercise.id, runSource, setDraft],
  )

  const changeBreakpoints = useCallback(
    (lines: number[]) => {
      const current = breakpointsRef.current
      if (lines.length === current.length && lines.every((line, i) => line === current[i])) return
      breakpointsRef.current = lines
      setBreakpointState({ id: exerciseIdRef.current, lines })
      if (lines.length > current.length) setTab('peek')
      // Edits can move breakpoints before the new code reaches codeRef, so read the editor's own copy.
      window.clearTimeout(liveTimer.current)
      liveTimer.current = window.setTimeout(() => {
        const source = editorView.current?.state.doc.toString() ?? codeRef.current
        if (canCompile(source)) void runSource(source, { live: true })
      })
    },
    [runSource],
  )

  const beautify = useCallback(async () => {
    if (formatting.current) return

    const source = codeRef.current
    const exerciseId = exerciseIdRef.current
    const wasSolved = isSolved(exerciseId, source)
    formatting.current = true
    setIsFormatting(true)
    setFormatError(null)

    try {
      const formatted = await formatCode(source)
      if (exerciseIdRef.current !== exerciseId || codeRef.current !== source) return
      if (formatted === source) return

      handleChange(formatted)
      if (wasSolved) markSolved(exerciseId, formatted)
    } catch (error) {
      if (exerciseIdRef.current !== exerciseId || codeRef.current !== source) return
      setFormatError(error instanceof Error ? error.message : 'The code could not be formatted.')
    } finally {
      formatting.current = false
      setIsFormatting(false)
    }
  }, [handleChange, isSolved, markSolved])

  useEffect(() => () => window.clearTimeout(liveTimer.current), [])

  const migrated = useRef(false)
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  useEffect(() => {
    if (!hydrated || migrated.current) return
    migrated.current = true
    const stored = draftsRef.current
    for (const item of allExercises) {
      const draft = stored[item.id]
      if (!item.declarations || !draft) continue
      if (draft === withDeclarations(item.starter, item.declarations)) resetDraft(item.id)
    }
  }, [hydrated, resetDraft])

  const seenInputs = useRef<string | null>(null)
  useEffect(() => {
    const key = `${exercise.id}\n${JSON.stringify(valueA)}\n${JSON.stringify(valueB)}`
    if (seenInputs.current === null || seenInputs.current === key) {
      seenInputs.current = key
      return
    }
    const previousId = seenInputs.current.slice(0, seenInputs.current.indexOf('\n'))
    seenInputs.current = key
    if (previousId !== exercise.id) return
    const source = codeRef.current
    if (!canCompile(source)) return
    void runSource(source, { live: true })
  }, [exercise.id, runSource, valueA, valueB])

  const stopRun = useCallback(() => {
    window.clearTimeout(liveTimer.current)
    runId.current += 1
    lastPeekCount.current = 0
    setRun({ status: 'idle' })
    setPeekState(NO_PEEKS)
  }, [])

  const goTo = useCallback(
    (nextIndex: number) => {
      stopRun()
      setFormatError(null)
      setIndex(nextIndex)
    },
    [setIndex, stopRun],
  )

  const openExercise = useCallback(
    (slug: string, exerciseIndex: number) => {
      if (!exercisesForPath(slug)[exerciseIndex]) return
      // Coming back to the open exercise keeps its last result.
      if (slug !== activePath.slug || exerciseIndex !== index) {
        stopRun()
        setFormatError(null)
      }
      selectPath(slug, exerciseIndex)
      setView('practice')
    },
    [activePath.slug, index, selectPath, stopRun],
  )

  const firstUnsolved = (path: ConceptPath) => Math.max(solvedFlags(path.slug).indexOf(false), 0)
  const openPath = (path: ConceptPath) => openExercise(path.slug, firstUnsolved(path))

  const goHome = useCallback(() => setView('home'), [])

  const goNext = useCallback(() => {
    if (index < exercises.length - 1) {
      goTo(index + 1)
      return
    }
    stopRun()
    setView('done')
  }, [exercises.length, goTo, index, stopRun])

  const goPrev = useCallback(() => {
    if (index > 0) goTo(index - 1)
  }, [goTo, index])

  const focusViolation = exercise.path === 'filter' && /\.reduce\s*\(/.test(code) ? 'reduce' : null
  const runMatches = run.status === 'done' && run.outcome.ok && !run.note && run.diffs.length === 0 && run.code === code && !focusViolation
  const canAdvance = (!hasOverride && runMatches) || solvedNow
  const lastExercise = index === exercises.length - 1

  const next = useCallback(() => {
    if (canAdvance) goNext()
  }, [canAdvance, goNext])

  // ⌘↵ runs the code, or moves on once the answer is correct.
  const primary = useCallback(() => {
    if (canAdvance) goNext()
    else if (run.status !== 'running') void execute()
  }, [canAdvance, execute, goNext, run.status])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229) return
      const mod = event.metaKey || event.ctrlKey
      if (mod && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }
      if (paletteOpen || view !== 'practice' || event.defaultPrevented) return
      if (mod && event.key === 'Enter') {
        event.preventDefault()
        if (event.shiftKey) next()
        else primary()
        return
      }
      // Plain text fields keep their own arrow and Escape behavior.
      if (event.target instanceof Element && event.target.closest('input, textarea, select')) return
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        goHome()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goHome, goNext, goPrev, next, paletteOpen, primary, view])

  // Closing Jump returns the caret to the editor.
  const paletteWasOpen = useRef(false)
  useEffect(() => {
    if (paletteWasOpen.current && !paletteOpen && view === 'practice') editorView.current?.focus()
    paletteWasOpen.current = paletteOpen
  }, [paletteOpen, view])

  const onEditorReady = useCallback((instance: EditorView | null) => {
    editorView.current = instance
  }, [])

  const updateInput = useCallback(
    (side: InputSide, value: unknown) => {
      const original = side === 'A' ? exercise.A : exercise.B
      setOverrides((prev) => {
        const current = { ...(prev[exercise.id] ?? {}) }
        if (sameJson(value, original)) delete current[side]
        else current[side] = value
        if (!('A' in current) && !('B' in current)) {
          const nextOverrides = { ...prev }
          delete nextOverrides[exercise.id]
          return nextOverrides
        }
        return { ...prev, [exercise.id]: current }
      })
    },
    [exercise],
  )

  const clearInput = useCallback(
    (side: InputSide) => {
      setOverrides((prev) => {
        const current = { ...(prev[exercise.id] ?? {}) }
        delete current[side]
        if (!('A' in current) && !('B' in current)) {
          const nextOverrides = { ...prev }
          delete nextOverrides[exercise.id]
          return nextOverrides
        }
        return { ...prev, [exercise.id]: current }
      })
    },
    [exercise.id],
  )

  const clearProgress = useCallback(() => {
    resetAll()
    setOverrides({})
    setShowExpected(true)
    stopRun()
  }, [resetAll, stopRun])

  const resetSolution = () => {
    setFormatError(null)
    stopRun()
    resetDraft(exercise.id)
  }

  const typesVisible = Boolean(exercise.declarations) && code.startsWith(`${exercise.declarations}\n\n`)
  const toggleTypes = () => {
    const nextCode = typesVisible ? withoutDeclarations(code, exercise.declarations) : withDeclarations(code, exercise.declarations)
    setFormatError(null)
    if (isSolved(exercise.id, code)) markSolved(exercise.id, nextCode)
    setDraft(exercise.id, nextCode)
  }

  const isStale = run.status === 'done' && run.code !== code
  const groups = useMemo(() => groupPeeks(peekState.peeks), [peekState.peeks])
  const peekCount = peekState.peeks.length
  const watchableAtRun = useMemo(() => breakableLines(peekState.code), [peekState.code])
  const ghosts = useMemo<Ghost[]>(() => {
    const byLine = new Map<number, string[]>()
    for (const group of groups) {
      if (group.line !== undefined) byLine.set(group.line, [...(byLine.get(group.line) ?? []), inlineText(group)])
    }
    const list: Ghost[] = [...byLine].map(([line, texts]) => ({ line, text: texts.join('   '), tone: peekState.dimmed ? 'dim' : 'value' }))
    if (peekState.ran) {
      for (const line of breakpoints) {
        if (byLine.has(line)) continue
        list.push({ line, text: watchableAtRun.has(line) ? 'not reached' : 'nothing to watch on this line', tone: 'note' })
      }
    }
    return list
  }, [breakpoints, groups, peekState.dimmed, peekState.ran, watchableAtRun])

  const nextPathEntry = (() => {
    const upcoming = nextPathAfter(activePath.slug)
    return upcoming ? (paths.find((path) => path.slug === upcoming.slug) ?? upcoming) : undefined
  })()

  // Continue opens the current exercise if unsolved, else the path's first unsolved one,
  // else the first unsolved exercise in the next path that has one.
  const resumeTarget = (() => {
    const flags = links.map((item) => item.solved)
    if (!flags[index]) return { path: activePath, index }
    const open = flags.indexOf(false)
    if (open >= 0) return { path: activePath, index: open }
    const at = paths.indexOf(activePath)
    const following = [...paths.slice(at + 1), ...paths.slice(0, at)].find((path) => path.total > 0 && path.completed < path.total)
    return following ? { path: following, index: firstUnsolved(following) } : { path: activePath, index }
  })()

  const resume = () => openExercise(resumeTarget.path.slug, resumeTarget.index)

  const jumpItems = (): { items: JumpItem[]; searchItems: JumpItem[] } => {
    const home: JumpItem = { id: 'home', mark: '⌂', label: 'Home', sub: 'esc', run: goHome }
    const pathItems: JumpItem[] = paths
      .filter((path) => path.total > 0)
      .map((path) => ({ id: `path:${path.slug}`, mark: '→', label: path.name, sub: `${path.completed} / ${path.total}`, mono: true, run: () => openPath(path) }))
    const exerciseItems = (path: ConceptPath): JumpItem[] =>
      exercisesForPath(path.slug).map((item, i) => ({
        id: `exercise:${item.id}`,
        mark: isSolved(item.id, drafts[item.id] ?? item.starter) ? '✓' : '',
        label: item.title,
        sub: `${path.name} · ${i + 1}`,
        run: () => openExercise(path.slug, i),
      }))
    const themeItems: JumpItem[] = THEME_NAMES.map((name) => ({
      id: `theme:${name}`,
      mark: '◐',
      label: `Theme: ${name}`,
      sub: name === theme ? 'current' : 'theme',
      run: () => progress.setTheme(name),
    }))
    const commands: JumpItem[] = [
      ...(view === 'practice'
        ? [
            { id: 'command:beautify', mark: '›', label: 'Beautify code', sub: isMac ? '⇧⌥F' : 'Shift Alt F', run: () => void beautify() },
            ...(exercise.declarations ? [{ id: 'command:types', mark: '›', label: typesVisible ? 'Hide type declarations' : 'Show type declarations', sub: 'command', run: toggleTypes }] : []),
            { id: 'command:expected', mark: '›', label: showExpected ? 'Hide expected output' : 'Show expected output', sub: 'command', run: () => setShowExpected((value) => !value) },
            { id: 'command:reset', mark: '›', label: 'Reset solution', sub: 'command', remember: false, run: resetSolution },
          ]
        : []),
      { id: 'command:reset-all', mark: '›', label: 'Reset all progress', sub: 'command', remember: false, run: () => requestProgressReset(clearProgress) },
    ]
    return {
      items: [home, ...pathItems, ...exerciseItems(activePath)],
      searchItems: [home, ...pathItems, ...paths.flatMap(exerciseItems), ...themeItems, ...commands],
    }
  }

  const palette = paletteOpen && <JumpPalette {...jumpItems()} onClose={() => setPaletteOpen(false)} />

  if (!hydrated) return <div className="min-h-dvh" />

  if (view === 'home') {
    return (
      <>
        <Home
          paths={paths}
          resume={{ path: resumeTarget.path, index: resumeTarget.index, exercise: exercisesForPath(resumeTarget.path.slug)[resumeTarget.index], solved: solvedFlags(resumeTarget.path.slug) }}
          started={progress.lastActiveAt !== null || Object.keys(progress.solved).length > 0}
          lastActiveAt={progress.lastActiveAt}
          activity={progress.activity}
          theme={theme}
          onTheme={progress.setTheme}
          onResume={resume}
          onOpenPath={openPath}
          onJump={() => setPaletteOpen(true)}
        />
        {palette}
      </>
    )
  }

  if (view === 'done') {
    return (
      <>
        <PathComplete path={activePath} exercises={links} nextPath={nextPathEntry} onNext={() => nextPathEntry && openPath(nextPathEntry)} onHome={goHome} />
        {palette}
      </>
    )
  }

  const focus = focusOf(exercise)
  const support = supportOf(exercise)
  const mixed = exercise.path === 'mixed'
  const nextHint = canAdvance ? `${keys.enter} ${lastExercise ? 'finish path' : 'next exercise'}` : ''
  const primaryLabel = canAdvance ? (lastExercise ? 'Finish path' : 'Next') : 'Run'

  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)_auto]">
      <TopBar pathName={activePath.name} position={index} exercises={links} onHome={goHome} onJump={() => setPaletteOpen(true)} onSelect={goTo} />

      <main ref={stageRef} className="grid min-h-0 grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4 overflow-auto p-4">
        {/* Scrolls on its own beside the editor (two columns from 728px); stacked, the page scrolls. */}
        <section aria-label="Exercise" className="flex flex-col gap-[18px] py-2 pr-2 pl-1 min-[728px]:min-h-0 min-[728px]:overflow-auto">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[25px]">{exercise.title}</h1>
              {solvedNow && <Badge>Solved</Badge>}
            </div>
            <p className="text-[15px] leading-[1.6] text-pretty text-neutral-200">{exercise.prompt}</p>
          </div>
          <ValueBlock
            key={`${exercise.id}-A`}
            label={exercise.labels.A}
            value={valueA}
            editable
            dirty={Boolean(override && 'A' in override)}
            onValueChange={(value) => updateInput('A', value)}
            onRestore={() => clearInput('A')}
          />
          {exercise.B !== null && (
            <ValueBlock
              key={`${exercise.id}-B`}
              label={exercise.labels.B}
              value={valueB}
              editable
              dirty={Boolean(override && 'B' in override)}
              onValueChange={(value) => updateInput('B', value)}
              onRestore={() => clearInput('B')}
            />
          )}
          {showExpected ? (
            <ValueBlock label="expected" value={expectedResult.value} expected notice={expectedResult.error} onHide={() => setShowExpected(false)} />
          ) : (
            <Button variant="quiet" size="xs" className="-ml-1.5 self-start" onClick={() => setShowExpected(true)}>
              Show expected
            </Button>
          )}
          <details className="mt-auto text-xs text-neutral-400">
            <summary>Learning constraints</summary>
            <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 leading-[1.6]">
              <dt className="text-neutral-500">Focus</dt>
              <dd className="font-mono text-neutral-200">{mixed ? focus : `${focus}()`}</dd>
              {!mixed && (
                <>
                  <dt className="text-neutral-500">Approach</dt>
                  <dd>Use {focus}() as the primary transformation mechanism.</dd>
                </>
              )}
              <dt className="text-neutral-500">Allowed</dt>
              <dd className="font-mono">{['property access', 'boolean expressions', ...support].join(' · ')}</dd>
              {!mixed && (
                <>
                  <dt className="text-neutral-500">Avoid here</dt>
                  <dd className="font-mono">reduce() · Object.entries() · Object.fromEntries()</dd>
                </>
              )}
            </dl>
          </details>
        </section>

        <section aria-label="Solution" className="flex min-h-[420px] flex-col gap-3">
          <div
            className={cn(
              'flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-[10px] bg-surface transition-shadow duration-300',
              runMatches
                ? 'shadow-[0_0_0_1px_var(--color-accent),0_0_40px_-12px_color-mix(in_srgb,var(--color-accent)_60%,transparent)]'
                : 'shadow-[0_0_0_1px_var(--color-neutral-800)]',
            )}
          >
            <div className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-neutral-400">
              <span className="min-w-0 truncate">
                <span className="text-text">solve</span>({exercise.labels.A}, {exercise.labels.B})
              </span>
              <span className="ml-auto hidden font-sans text-[11px] whitespace-nowrap text-neutral-500 sm:inline" role={formatError ? 'alert' : undefined} title={formatError ?? undefined}>
                {isFormatting ? 'Formatting…' : formatError ? <span className="text-neutral-300">Couldn&apos;t format</span> : 'Click a line number to watch it'}
              </span>
              {exercise.declarations && (
                <Button variant="quiet" size="xs" className={cn('ml-auto sm:ml-0', typesVisible && 'bg-text/7 text-text')} aria-pressed={typesVisible} onClick={toggleTypes}>
                  Types
                </Button>
              )}
              <Button variant="quiet" size="xs" className={cn(!exercise.declarations && 'ml-auto sm:ml-0')} disabled={code === exercise.starter} onClick={resetSolution}>
                Reset
              </Button>
            </div>
            <div className="mx-1 mb-1 min-h-0 flex-1 overflow-hidden rounded-[7px] bg-bg">
              <CodeEditor
                key={exercise.id}
                value={code}
                params={exercise.params}
                onChange={handleChange}
                onPrimary={primary}
                onNext={next}
                onBeautify={() => void beautify()}
                breakpoints={breakpoints}
                onBreakpointsChange={changeBreakpoints}
                ghosts={ghosts}
                watchShortcut={keys.dot}
                onReady={onEditorReady}
              />
            </div>
          </div>

          <OutputPanel
            ref={outputRef}
            tab={tab}
            onTab={setTab}
            state={run}
            expected={expectedResult.value}
            correct={runMatches}
            isStale={isStale}
            approach={exercise.approach}
            solution={exercise.solution}
            successTitle={hasOverride ? 'Matches these inputs' : 'Correct'}
            successHint={hasOverride && !solvedNow ? 'Restore the sample to record this exercise.' : undefined}
            nextHint={nextHint}
            focus={focus}
            focusViolation={focusViolation}
            groups={groups}
            peekCount={peekCount}
            dimmed={peekState.dimmed}
            peekSample={`peek(${exercise.labels.A})  ·  peek(value, "doubled")`}
          />
        </section>
      </main>

      <footer className="rule-t flex items-center gap-2 px-4 py-2.5">
        <div className="hidden gap-4 text-xs whitespace-nowrap text-neutral-500 lg:flex">
          <span>
            <Shortcut className="text-xs">{keys.enter}</Shortcut> {canAdvance ? (lastExercise ? 'finish' : 'next') : 'run'}
          </span>
          <span>
            <Shortcut className="text-xs">{keys.dot}</Shortcut> watch line
          </span>
          <span>
            <Shortcut className="text-xs">{keys.alt}</Shortcut> prev / skip
          </span>
          <span>
            <Shortcut className="text-xs">esc</Shortcut> home
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button aria-label="Previous exercise" disabled={index === 0} onClick={goPrev}>
            ←
          </Button>
          <Button aria-label="Skip this exercise and leave it unsolved" onClick={goNext}>
            Skip
          </Button>
          <Button
            ref={primaryRef}
            variant="primary"
            className={cn('min-w-32 gap-2.5', canAdvance && 'bg-accent/18 hover:bg-accent/24')}
            disabled={!canAdvance && run.status === 'running'}
            onClick={primary}
          >
            {primaryLabel} <span className="font-mono text-[11px] opacity-75">{keys.enter}</span>
          </Button>
        </div>
      </footer>
      {palette}
    </div>
  )
}
