'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, BroomSparkles, ChevronLeft, Circle, CircleCheck, LoaderCircle, Play, RotateCcw, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exercises } from '@/lib/exercises'
import { formatCode } from '@/lib/format-code'
import { withDeclarations, withoutDeclarations } from '@/lib/shape'
import { structuralDiff } from '@/lib/diff'
import { sameJson } from '@/lib/json'
import { canCompile, runSolution } from '@/lib/runner'
import { Group, Panel } from 'react-resizable-panels'
import { useProgress } from '@/hooks/use-progress'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { DataPanel } from './data-panel'
import { ExerciseMenu, requestProgressReset, type ExerciseLink } from './exercise-menu'
import { Gutter } from './gutter'
import { Kbd } from './kbd'
import { ResultPanel, type RunState } from './result-panel'
import { TopBar } from './top-bar'

const CodeEditor = dynamic(() => import('./code-editor').then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-muted/40" />,
})

type MobilePane = 'inputs' | 'code' | 'output'
type InputSide = 'A' | 'B'
type Overrides = Record<string, { A?: unknown; B?: unknown }>

export function Workspace() {
  const progress = useProgress(exercises.length)
  const { index, drafts, view, hydrated, setIndex, openSummary, setDraft, resetDraft, resetAll, markSolved, isSolved } = progress
  const exercise = exercises[index]
  const code = drafts[exercise.id] ?? exercise.starter
  const solvedNow = isSolved(exercise.id, code)

  const [run, setRun] = useState<RunState>({ status: 'idle' })
  const [overrides, setOverrides] = useState<Overrides>({})
  const [showExpected, setShowExpected] = useState(true)
  const [mobilePane, setMobilePane] = useState<MobilePane>('code')
  const [isFormatting, setIsFormatting] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)
  const runId = useRef(0)
  const liveTimer = useRef<number | undefined>(undefined)
  const formatting = useRef(false)
  const codeRef = useRef(code)
  const exerciseIdRef = useRef(exercise.id)
  codeRef.current = code
  exerciseIdRef.current = exercise.id

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
    difficulty: item.difficulty,
    solved: isSolved(item.id, drafts[item.id] ?? item.starter),
  }))
  const solvedCount = links.filter((item) => item.solved).length

  const runSource = useCallback(
    async (source: string, { live }: { live: boolean }) => {
      window.clearTimeout(liveTimer.current)
      const id = ++runId.current
      if (!live) setRun({ status: 'running' })
      const outcome = await runSolution(source, valueA, valueB)
      if (id !== runId.current) return
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
      if (outcome.ok && diffs.length === 0 && !hasOverride) markSolved(exercise.id, source)
      setRun({ status: 'done', outcome, diffs, code: source })
    },
    [exercise.id, expectedResult, hasOverride, markSolved, valueA, valueB],
  )

  const execute = useCallback(() => {
    setMobilePane('output')
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
    [exercise.id, runSource, setDraft],
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
    for (const item of exercises) {
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
    setRun({ status: 'idle' })
  }, [])

  const goTo = useCallback(
    (nextIndex: number) => {
      stopRun()
      setFormatError(null)
      setMobilePane('code')
      setIndex(nextIndex)
    },
    [setIndex, stopRun],
  )

  const finishSet = useCallback(() => {
    stopRun()
    openSummary()
  }, [openSummary, stopRun])

  const goNext = useCallback(() => {
    if (index >= exercises.length - 1) finishSet()
    else goTo(index + 1)
  }, [finishSet, goTo, index])

  const goPrev = useCallback(() => {
    if (index > 0) goTo(index - 1)
  }, [goTo, index])

  const closeSummary = useCallback(() => {
    stopRun()
    setMobilePane('code')
    setIndex(index)
  }, [index, setIndex, stopRun])

  const runMatches = run.status === 'done' && run.outcome.ok && !run.note && run.diffs.length === 0 && run.code === code
  const canAdvance = (!hasOverride && runMatches) || solvedNow
  const lastExercise = index === exercises.length - 1

  const next = useCallback(() => {
    if (canAdvance) goNext()
  }, [canAdvance, goNext])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (view === 'summary' || event.defaultPrevented || event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      if (event.shiftKey) next()
      else void execute()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [execute, next, view])

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
    setMobilePane('code')
    stopRun()
  }, [resetAll, stopRun])

  const isStale = run.status === 'done' && run.code !== code
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const peekSample = `peek(${exercise.labels.A})  ·  peek(${exercise.labels.A}, "after map")`

  const goal = (
    <p className="shrink-0 text-sm leading-relaxed text-pretty text-muted-foreground">
      <span className="font-medium text-foreground">Goal: </span>
      {exercise.prompt}
    </p>
  )
  const panelA = (
    <DataPanel
      key={`${exercise.id}-A`}
      letter="A"
      label={exercise.labels.A}
      value={valueA}
      className="min-h-0 flex-1"
      editable
      dirty={Boolean(override && 'A' in override)}
      onValueChange={(value) => updateInput('A', value)}
      onRestore={() => clearInput('A')}
    />
  )
  const panelB = (
    <DataPanel
      key={`${exercise.id}-B`}
      letter="B"
      label={exercise.labels.B}
      value={valueB}
      className="min-h-0 flex-1"
      editable
      dirty={Boolean(override && 'B' in override)}
      onValueChange={(value) => updateInput('B', value)}
      onRestore={() => clearInput('B')}
    />
  )
  const panelC = (
    <DataPanel
      key={`${exercise.id}-C`}
      letter="C"
      label="expected"
      value={expectedResult.value}
      emphasis
      className="min-h-0 flex-1"
      notice={expectedResult.error}
      onHide={() => setShowExpected(false)}
    />
  )
  const editor = (
    <section aria-label="Solution" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
      <header className="flex h-9 shrink-0 items-center gap-2 border-b px-3">
        <span className="font-mono text-xs text-foreground">solution.ts</span>
        <span className="truncate font-mono text-xs text-muted-foreground">
          {`solve(${exercise.labels.A}, ${exercise.labels.B})`}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {formatError && (
            <span className="hidden text-xs text-destructive sm:inline" role="alert" title={formatError}>
              Couldn&apos;t format
            </span>
          )}
          {exercise.declarations && (
            <Button
              variant={code.startsWith(`${exercise.declarations}\n\n`) ? 'secondary' : 'ghost'}
              size="xs"
              className={code.startsWith(`${exercise.declarations}\n\n`) ? undefined : 'text-muted-foreground'}
              aria-pressed={code.startsWith(`${exercise.declarations}\n\n`)}
              onClick={() => {
                const visible = code.startsWith(`${exercise.declarations}\n\n`)
                const next = visible ? withoutDeclarations(code, exercise.declarations) : withDeclarations(code, exercise.declarations)
                setFormatError(null)
                if (isSolved(exercise.id, code)) markSolved(exercise.id, next)
                setDraft(exercise.id, next)
              }}
            >
              Types
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => void beautify()}
            disabled={isFormatting}
            title={formatError ?? 'Beautify code (Shift+Alt+F)'}
          >
            {isFormatting ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <BroomSparkles data-icon="inline-start" />
            )}
            Beautify
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => {
              setFormatError(null)
              resetDraft(exercise.id)
            }}
            disabled={code === exercise.starter}
          >
            <RotateCcw data-icon="inline-start" />
            Reset
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        {hydrated && (
          <CodeEditor
            key={exercise.id}
            value={code}
            params={exercise.params}
            onChange={handleChange}
            onRun={() => void execute()}
            onNext={next}
            onBeautify={() => void beautify()}
          />
        )}
      </div>
    </section>
  )
  const result = (
    <section aria-label="Result" className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
      <ResultPanel
        state={run}
        expected={expectedResult.value}
        isStale={isStale}
        approach={exercise.approach}
        solution={exercise.solution}
        peekSample={peekSample}
        successTitle={hasOverride ? 'Matches these inputs' : 'Correct'}
        successHint={hasOverride && !solvedNow ? 'Restore the sample to record this exercise.' : undefined}
      />
    </section>
  )

  const topBar = (
    <TopBar
      exercise={exercise}
      position={index}
      total={exercises.length}
      solved={solvedNow}
      solvedCount={solvedCount}
      view={view}
      links={links}
      onSelect={goTo}
      onResetProgress={clearProgress}
    />
  )

  if (view === 'summary') {
    return (
      <div className="flex h-dvh flex-col">
        {topBar}
        <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-4 overflow-auto p-6">
          <div>
            <h2 className="text-lg font-medium">
              {solvedCount} of {exercises.length} solved
            </h2>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">
              You reached the end of the set. Open any exercise to review it.
            </p>
          </div>
          <ul className="overflow-hidden rounded-lg border">
            {links.map((item, itemIndex) => (
              <li key={item.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => goTo(itemIndex)}
                >
                  {item.solved ? (
                    <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <span className="font-mono text-xs text-muted-foreground capitalize">{item.difficulty}</span>
                </button>
              </li>
            ))}
          </ul>
          <Button variant="ghost" className="self-start" onClick={() => requestProgressReset(clearProgress)}>
            Reset progress
          </Button>
        </main>
        <footer className="flex h-14 shrink-0 items-center border-t px-3">
          <Button variant="outline" onClick={closeSummary}>
            <ChevronLeft data-icon="inline-start" />
            Back
          </Button>
        </footer>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col">
      {topBar}

      {isDesktop ? (
        <main className="flex min-h-0 flex-1 flex-col p-3">
          <Group orientation="horizontal" id="workspace-columns" className="min-h-0 flex-1">
            <Panel id="data" defaultSize="42" minSize="20" className="flex flex-col gap-3">
              {goal}
              {showExpected ? (
                <Group orientation="vertical" id="workspace-data" className="min-h-0 flex-1">
                  <Panel id="a" minSize="10" className="flex flex-col">
                    {panelA}
                  </Panel>
                  <Gutter />
                  <Panel id="b" minSize="10" className="flex flex-col">
                    {panelB}
                  </Panel>
                  <Gutter />
                  <Panel id="c" minSize="10" className="flex flex-col">
                    {panelC}
                  </Panel>
                </Group>
              ) : (
                <Group orientation="vertical" id="workspace-data-ab" className="min-h-0 flex-1">
                  <Panel id="a" minSize="10" className="flex flex-col">
                    {panelA}
                  </Panel>
                  <Gutter />
                  <Panel id="b" minSize="10" className="flex flex-col">
                    {panelB}
                  </Panel>
                </Group>
              )}
              {!showExpected && (
                <Button variant="outline" size="sm" className="self-start" onClick={() => setShowExpected(true)}>
                  Show expected
                </Button>
              )}
            </Panel>
            <Gutter />
            <Panel id="work" minSize="25">
              <Group orientation="vertical" id="workspace-work" className="h-full">
                <Panel id="editor" defaultSize="60" minSize="15" className="flex flex-col">
                  {editor}
                </Panel>
                <Gutter />
                <Panel id="result" minSize="10" className="flex flex-col">
                  {result}
                </Panel>
              </Group>
            </Panel>
          </Group>
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="px-3 pt-3">{goal}</div>
          <div role="tablist" aria-label="Workspace" className="flex h-9 shrink-0 items-stretch gap-4 border-b px-3">
            {(
              [
                ['inputs', 'Inputs'],
                ['code', 'Code'],
                ['output', 'Output'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mobilePane === id}
                onClick={() => setMobilePane(id)}
                className={cn(
                  'flex h-full items-center border-b-2 px-1 font-mono text-xs',
                  mobilePane === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-3">
            {mobilePane === 'inputs' && (
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
                <div className="flex h-64 shrink-0 flex-col">{panelA}</div>
                <div className="flex h-56 shrink-0 flex-col">{panelB}</div>
                {showExpected ? (
                  <div className="flex h-56 shrink-0 flex-col">{panelC}</div>
                ) : (
                  <Button variant="outline" size="sm" className="self-start" onClick={() => setShowExpected(true)}>
                    Show expected
                  </Button>
                )}
              </div>
            )}
            {mobilePane === 'code' && editor}
            {mobilePane === 'output' && result}
          </div>
        </main>
      )}

      <footer className="flex h-14 shrink-0 items-center gap-2 border-t px-3">
        <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
          <span className="flex items-center gap-1.5">
            <Kbd mod>Enter</Kbd> run
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd mod shift>
              Enter
            </Kbd>{' '}
            {lastExercise ? 'finish' : 'next'}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" onClick={goPrev} disabled={index === 0} aria-label="Previous exercise">
            <ChevronLeft data-icon="inline-start" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button variant="ghost" onClick={goNext} aria-label="Skip this exercise and leave it unsolved">
            <SkipForward data-icon="inline-start" />
            Skip
          </Button>
          <Button variant={canAdvance ? 'outline' : 'default'} onClick={() => void execute()} disabled={run.status === 'running'} className="min-w-24">
            <Play data-icon="inline-start" />
            Run
          </Button>
          <Button variant={canAdvance ? 'default' : 'outline'} onClick={next} disabled={!canAdvance}>
            {lastExercise ? 'Finish' : 'Next'}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
