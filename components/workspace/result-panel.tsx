'use client'

import { useEffect, useRef, useState } from 'react'
import { CircleCheck, CircleX, Lightbulb, LoaderCircle, TriangleAlert } from 'lucide-react'
import type { DiffEntry } from '@/lib/diff'
import { formatValue } from '@/lib/diff'
import type { Peek, RunOutcome } from '@/lib/runner'
import { cn } from '@/lib/utils'
import { JsonView } from './json-view'
import { Kbd } from './kbd'

export type RunState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; outcome: RunOutcome; diffs: DiffEntry[]; code: string; note?: string }

const KIND_LABEL: Record<DiffEntry['kind'], string> = {
  changed: 'value',
  missing: 'missing',
  unexpected: 'extra',
  type: 'type',
}

function typeName(value: unknown) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function Side({ label, value, includeType }: { label: string; value: unknown; includeType?: boolean }) {
  const [open, setOpen] = useState(false)
  const text = formatValue(value, open ? 20000 : 120)
  const kind = typeName(value)
  const rendered = includeType && kind !== text ? `${kind} ${text}` : text
  const truncated = !open && rendered.endsWith('…')

  return (
    <div className="min-w-0">
      <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-xs break-all text-foreground">{rendered}</div>
      {truncated && (
        <button type="button" className="font-mono text-[11px] text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)}>
          Show full value
        </button>
      )}
    </div>
  )
}

function DiffRow({ entry }: { entry: DiffEntry }) {
  return (
    <li className="flex flex-col gap-2 border-b px-3 py-2 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-16 shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{KIND_LABEL[entry.kind]}</span>
        <code className="truncate font-mono text-xs text-foreground" title={entry.path}>
          {entry.path}
        </code>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {entry.kind !== 'missing' && <Side label="yours" value={entry.actual} includeType={entry.kind === 'type'} />}
        {entry.kind !== 'unexpected' && <Side label="expected" value={entry.expected} includeType={entry.kind === 'type'} />}
      </div>
    </li>
  )
}

function Pane({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-col', className)}>
      <h3 className="px-3 pt-3 pb-1.5 font-mono text-xs text-muted-foreground">{title}</h3>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">{children}</div>
    </div>
  )
}

function Logs({ logs }: { logs: string[] }) {
  if (logs.length === 0) return null
  return (
    <details className="border-t">
      <summary className="cursor-pointer px-3 py-2 font-mono text-xs text-muted-foreground hover:text-foreground">
        console ({logs.length})
      </summary>
      <ol className="flex flex-col px-3 pb-3">
        {logs.map((line, i) => (
          <li key={i} className="border-b border-dashed py-1 font-mono text-xs whitespace-pre-wrap last:border-b-0">
            {line}
          </li>
        ))}
      </ol>
    </details>
  )
}

type Tab = 'result' | 'peek'

function PeekView({ peeks, dimmed }: { peeks: Peek[]; dimmed: boolean }) {
  if (peeks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <p>Click a line number to add a breakpoint, or wrap any value to see its shape here while you type:</p>
        <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">
          {'peek(scan)  ·  peek(scan, "after map")  ·  return peek(A.map(...))'}
        </code>
      </div>
    )
  }
  // A breakpoint inside a loop peeks once per pass, so number repeated labels.
  const hits = new Map<string, number>()
  const hitNumbers = peeks.map((p) => {
    const count = (hits.get(p.label) ?? 0) + 1
    hits.set(p.label, count)
    return count
  })
  return (
    <ol className={cn('flex flex-col transition-opacity', dimmed && 'opacity-50')}>
      {peeks.map((p, i) => (
        <li key={i} className="border-b last:border-b-0">
          <h3 className="flex items-center gap-2 px-3 pt-3 pb-1.5 font-mono text-xs">
            <span className="text-foreground">{p.label}</span>
            {hits.get(p.label)! > 1 && <span className="text-muted-foreground tabular-nums">{hitNumbers[i]}/{hits.get(p.label)}</span>}
            <span className="text-muted-foreground">{typeName(p.value)}</span>
            {Array.isArray(p.value) && <span className="text-muted-foreground">[{p.value.length}]</span>}
          </h3>
          <div className="px-3 pb-3">
            <JsonView value={p.value} />
          </div>
        </li>
      ))}
    </ol>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex h-full items-center gap-1.5 border-b-2 px-1 font-mono text-xs transition-colors',
        active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function ResultPanel({
  state,
  expected,
  isStale,
  approach,
  solution,
  peekSample,
  successTitle = 'Correct',
  successHint,
  focus,
  focusViolation,
}: {
  state: RunState
  expected: unknown
  isStale: boolean
  approach?: string
  solution?: string
  peekSample: string
  successTitle?: string
  successHint?: string
  focus?: string
  focusViolation?: string | null
}) {
  const [tab, setTab] = useState<Tab>('result')
  const lastPeeks = useRef<Peek[]>([])
  const [prevPeekCount, setPrevPeekCount] = useState(0)

  const livePeeks = state.status === 'done' ? state.outcome.peeks : null
  const compileFailed = state.status === 'done' && !state.outcome.ok && state.outcome.phase === 'compile'
  const peeks = livePeeks && !compileFailed ? livePeeks : lastPeeks.current
  const peekCount = peeks.length

  if (peekCount !== prevPeekCount) {
    setPrevPeekCount(peekCount)
    if (prevPeekCount === 0 && peekCount > 0) setTab('peek')
  }

  useEffect(() => {
    if (livePeeks && !compileFailed) lastPeeks.current = livePeeks
  }, [livePeeks, compileFailed])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="tablist" aria-label="Output" className="flex h-9 shrink-0 items-stretch gap-4 border-b px-3">
        <TabButton active={tab === 'result'} onClick={() => setTab('result')}>
          Result
        </TabButton>
        <TabButton active={tab === 'peek'} onClick={() => setTab('peek')}>
          Peek
          {peekCount > 0 && (
            <span className="rounded bg-muted px-1 text-[0.6875rem] leading-4 text-muted-foreground">{peekCount}</span>
          )}
        </TabButton>
      </div>
      <div role="tabpanel" className="min-h-0 flex-1 overflow-auto">
        {tab === 'result' ? (
          <ResultView
            state={state}
            expected={expected}
            isStale={isStale}
            approach={approach}
            solution={solution}
            peekSample={peekSample}
            successTitle={successTitle}
            successHint={successHint}
            focus={focus}
            focusViolation={focusViolation}
          />
        ) : (
          <PeekView peeks={peeks} dimmed={compileFailed} />
        )}
      </div>
    </div>
  )
}

function ResultView({
  state,
  expected,
  isStale,
  approach,
  solution,
  peekSample,
  successTitle,
  successHint,
  focus,
  focusViolation,
}: {
  state: RunState
  expected: unknown
  isStale: boolean
  approach?: string
  solution?: string
  peekSample: string
  successTitle: string
  successHint?: string
  focus?: string
  focusViolation?: string | null
}) {
  if (state.status === 'idle') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          Press <Kbd mod>Enter</Kbd> to run your solution
        </p>
        <p>
          Click a line number to add a breakpoint and inspect that line while you type, or wrap a value in{' '}
          <code className="font-mono text-xs text-foreground">peek()</code>.
        </p>
        <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">{peekSample}</code>
      </div>
    )
  }

  if (state.status === 'running') {
    return (
      <div className="flex h-full items-center justify-center gap-2 p-6 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Running…
      </div>
    )
  }

  const { outcome, diffs, note } = state
  const stale = isStale ? <span className="font-mono text-xs text-muted-foreground">edited since last run</span> : null

  if (outcome.ok && note) {
    return (
      <div className="flex h-full min-h-0 flex-col" role="status" aria-live="polite">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
          <TriangleAlert className="size-4 text-destructive" aria-hidden="true" />
          <span className="truncate text-sm font-medium text-destructive">{note}</span>
          <span className="ml-auto">{stale}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <Pane title="yours">
            <JsonView value={outcome.value} />
          </Pane>
        </div>
        <Logs logs={outcome.logs} />
      </div>
    )
  }

  if (!outcome.ok) {
    return (
      <div className="flex h-full min-h-0 flex-col" role="status" aria-live="polite">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
          <TriangleAlert className="size-4 text-destructive" aria-hidden="true" />
          <span className="text-sm font-medium text-destructive">
            {outcome.phase === 'compile' ? 'Compile error' : outcome.phase === 'timeout' ? 'Timed out' : 'Runtime error'}
          </span>
          <span className="ml-auto">{stale}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <pre className="rounded-md bg-destructive/10 p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-destructive">
            <span className="font-semibold">{outcome.name}:</span> {outcome.message}
          </pre>
        </div>
        <Logs logs={outcome.logs} />
      </div>
    )
  }

  const correct = diffs.length === 0

  if (correct && focusViolation && !isStale) {
    return (
      <div className="flex h-full min-h-0 flex-col" role="status" aria-live="polite">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
          <Lightbulb className="text-warning" aria-hidden="true" />
          <span className="text-sm font-medium">Correct output</span>
          <span className="font-mono text-xs text-warning">learning constraint not satisfied</span>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3 p-5">
          <p className="text-sm text-muted-foreground">The expected output matched. This exercise is focused on <code className="font-mono text-foreground">{focus}()</code>, but your solution appears to use <code className="font-mono text-warning">{focusViolation}()</code>.</p>
          <p className="text-sm text-muted-foreground">Try solving it with the intended transformation. This is instructional feedback, not a compiler error.</p>
          <div className="flex gap-2"><button type="button" className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">Review focus</button><button type="button" className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Try again</button></div>
        </div>
        <Logs logs={outcome.logs} />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col" role="status" aria-live="polite">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
        {correct ? (
          <>
            <CircleCheck className="size-4 text-success" aria-hidden="true" />
            <span className="text-sm font-medium text-success">{successTitle}</span>
          </>
        ) : (
          <>
            <CircleX className="size-4 text-destructive" aria-hidden="true" />
            <span className="text-sm font-medium text-destructive">Incorrect</span>
            <span className="font-mono text-xs text-muted-foreground">
              {diffs.length >= 50 ? '50+' : diffs.length} {diffs.length === 1 ? 'difference' : 'differences'}
            </span>
          </>
        )}
        <span className="font-mono text-xs text-muted-foreground">{outcome.durationMs.toFixed(1)}ms</span>
        <span className="ml-auto">{stale}</span>
      </div>

      {correct && !isStale && (approach || successHint || solution) && (
        <div className="border-b">
          {approach && <p className="px-3 py-2 text-sm text-pretty text-muted-foreground">{approach}</p>}
          {successHint && (
            <p className={cn('px-3 pb-2 text-sm text-pretty text-muted-foreground', !approach && 'pt-2')}>{successHint}</p>
          )}
          {solution && (
            <details>
              <summary className="cursor-pointer px-3 py-2 font-mono text-xs text-muted-foreground hover:text-foreground">
                Reference
              </summary>
              <pre className="overflow-auto px-3 pb-3 font-mono text-xs leading-5 whitespace-pre">{solution}</pre>
            </details>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {!correct && (
          <div className="border-b">
            <div className="px-3 pt-3 pb-1.5 font-mono text-xs text-muted-foreground">differences</div>
            <ul className="mx-3 mb-3 rounded-md border">
              {diffs.map((entry, i) => (
                <DiffRow key={`${entry.path}-${i}`} entry={entry} />
              ))}
            </ul>
          </div>
        )}
        <div className={cn('grid min-h-0', !correct && 'md:grid-cols-2 md:divide-x')}>
          <Pane title="yours">
            <JsonView value={outcome.value} />
          </Pane>
          {!correct && (
            <Pane title="expected" className="border-t md:border-t-0">
              <JsonView value={expected} />
            </Pane>
          )}
        </div>
      </div>
      <Logs logs={outcome.logs} />
    </div>
  )
}
