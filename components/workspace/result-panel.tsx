'use client'

import type { Ref } from 'react'
import { Badge } from '@/components/ui/badge'
import type { DiffEntry } from '@/lib/diff'
import { formatShort, formatValue } from '@/lib/format-value'
import type { PeekGroup } from '@/lib/peeks'
import type { RunOutcome } from '@/lib/runner'
import { cn } from '@/lib/utils'
import { useKeys } from './kbd'

export type RunState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; outcome: RunOutcome; diffs: DiffEntry[]; code: string; note?: string }

export type OutputTab = 'result' | 'peek'

const KIND_LABEL: Record<DiffEntry['kind'], string> = {
  changed: 'value',
  missing: 'missing',
  unexpected: 'extra',
  type: 'type',
}

const MONO_GRID = 'grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 font-mono text-[12.5px] leading-[1.6]'

function Dot({ className }: { className: string }) {
  return <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', className)} />
}

function Status({ dot, children, className }: { dot: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]', className)}>
      <Dot className={dot} />
      {children}
    </div>
  )
}

function Logs({ logs }: { logs: string[] }) {
  if (logs.length === 0) return null
  return (
    <details className="text-xs text-neutral-400">
      <summary>console ({logs.length})</summary>
      <ol className="mt-2 flex flex-col gap-1">
        {logs.map((line, i) => (
          <li key={i} className="rounded-md bg-bg px-2 py-1 font-mono text-[12px] leading-[1.6] whitespace-pre-wrap text-neutral-200">
            {line}
          </li>
        ))}
      </ol>
    </details>
  )
}

export function OutputPanel({
  ref,
  className,
  tab,
  onTab,
  state,
  expected,
  correct,
  isStale,
  approach,
  solution,
  successTitle,
  successHint,
  nextHint,
  focus,
  focusViolation,
  groups,
  peekCount,
  dimmed,
  peekSample,
}: {
  ref?: Ref<HTMLDivElement>
  className?: string
  tab: OutputTab
  onTab: (tab: OutputTab) => void
  state: RunState
  expected: unknown
  /** The latest run matches the current code and passes. */
  correct: boolean
  isStale: boolean
  approach?: string
  solution?: string
  successTitle: string
  successHint?: string
  /** "⌘↵ next exercise", or empty when moving on isn't possible yet. */
  nextHint: string
  focus: string
  focusViolation: string | null
  groups: PeekGroup[]
  peekCount: number
  dimmed: boolean
  peekSample: string
}) {
  const keys = useKeys()
  const failed = state.status === 'done' && (!state.outcome.ok || Boolean(state.note) || state.diffs.length > 0 || Boolean(focusViolation))
  const resultDot = correct ? 'bg-accent' : failed ? 'bg-neutral-300' : 'bg-neutral-600'

  return (
    <div ref={ref} className={cn('flex flex-col overflow-hidden rounded-[10px] bg-surface', className)}>
      <div role="tablist" aria-label="Output" className="rule-b flex flex-none items-center gap-0.5 px-2 pt-1.5">
        <TabButton active={tab === 'result'} onClick={() => onTab('result')}>
          <Dot className={resultDot} />
          Result
        </TabButton>
        <TabButton active={tab === 'peek'} onClick={() => onTab('peek')}>
          Peek
          {peekCount > 0 && (
            <Badge size="sm" className="tabular-nums">
              {peekCount}
            </Badge>
          )}
        </TabButton>
        <span className="ml-auto truncate pr-1.5 font-mono text-[11px] whitespace-nowrap text-neutral-500">{keys.dot} watch line</span>
      </div>
      <div role="tabpanel" aria-live={tab === 'result' ? 'polite' : undefined} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto px-3.5 py-3">
        {tab === 'result' ? (
          <ResultView
            state={state}
            expected={expected}
            correct={correct}
            isStale={isStale}
            approach={approach}
            solution={solution}
            successTitle={successTitle}
            successHint={successHint}
            nextHint={nextHint}
            focus={focus}
            focusViolation={focusViolation}
            runKey={keys.enter}
          />
        ) : (
          <PeekView groups={groups} dimmed={dimmed} correct={correct} peekSample={peekSample} onShowResult={() => onTab('result')} />
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-[7px] px-2.5 py-[7px] text-xs font-medium transition-colors hover:text-text',
        active ? 'text-text shadow-[inset_0_-2px_0_var(--color-accent)]' : 'text-neutral-400',
      )}
    >
      {children}
    </button>
  )
}

function ResultView({
  state,
  expected,
  correct,
  isStale,
  approach,
  solution,
  successTitle,
  successHint,
  nextHint,
  focus,
  focusViolation,
  runKey,
}: {
  state: RunState
  expected: unknown
  correct: boolean
  isStale: boolean
  approach?: string
  solution?: string
  successTitle: string
  successHint?: string
  nextHint: string
  focus: string
  focusViolation: string | null
  runKey: string
}) {
  if (state.status === 'idle') {
    return (
      <Status dot="bg-neutral-600" className="text-neutral-400">
        Start typing. Your answer is checked as you go.
      </Status>
    )
  }

  if (state.status === 'running') {
    return (
      <Status dot="bg-neutral-600 animate-pulse" className="text-neutral-400">
        Running…
      </Status>
    )
  }

  const { outcome, diffs, note } = state
  const stale = isStale ? (
    <span className="text-[11px] text-neutral-500">
      Edited since last check · {runKey} to run
    </span>
  ) : null

  if (outcome.ok && note) {
    return (
      <>
        <Status dot="bg-neutral-300">
          <span className="font-medium">{note}</span>
        </Status>
        <div className={MONO_GRID}>
          <span className="text-neutral-500">yours</span>
          <span className="whitespace-pre-wrap">{formatValue(outcome.value)}</span>
        </div>
        {stale}
        <Logs logs={outcome.logs} />
      </>
    )
  }

  if (!outcome.ok) {
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <Status dot="bg-neutral-300">
            <span className="font-medium">Doesn&apos;t run yet</span>
          </Status>
          <code className="font-mono text-[12.5px] leading-normal whitespace-pre-wrap text-neutral-300">
            {outcome.name}: {outcome.message}
          </code>
        </div>
        {stale}
        <Logs logs={outcome.logs} />
      </>
    )
  }

  const passed = diffs.length === 0

  if (passed && focusViolation && !isStale) {
    return (
      <>
        <Status dot="bg-neutral-300">
          <span className="font-medium">Correct output</span>
          <span className="text-neutral-400">learning constraint not satisfied</span>
        </Status>
        <p className="text-[13px] leading-[1.55] text-pretty text-neutral-300">
          This exercise is focused on <code className="font-mono text-text">{focus}()</code>, but your solution appears to use{' '}
          <code className="font-mono text-text">{focusViolation}()</code>. Try solving it with the intended transformation.
        </p>
        <Logs logs={outcome.logs} />
      </>
    )
  }

  if (passed) {
    return (
      <>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-800 text-xs text-accent-200">
              ✓
            </span>
            <span className="text-[15px] font-medium text-accent-200">{successTitle}</span>
            {correct && nextHint && <span className="ml-auto text-xs whitespace-nowrap text-neutral-400">{nextHint}</span>}
          </div>
          {!isStale && approach && <p className="text-[13px] leading-[1.55] text-pretty text-neutral-300">{approach}</p>}
          {!isStale && successHint && <p className="text-[13px] leading-[1.55] text-pretty text-neutral-400">{successHint}</p>}
          {!isStale && solution && (
            <details className="text-xs text-neutral-400">
              <summary>Compare with the reference</summary>
              <pre className="mt-2 font-mono text-[12.5px] leading-[1.6] whitespace-pre-wrap text-neutral-200">{solution}</pre>
            </details>
          )}
        </div>
        {stale}
        <Logs logs={outcome.logs} />
      </>
    )
  }

  if (outcome.value === undefined) {
    return (
      <>
        <Status dot="bg-neutral-500" className="text-neutral-300">
          solve() returns nothing yet. Add a <code className="font-mono text-text">return</code>.
        </Status>
        {stale}
        <Logs logs={outcome.logs} />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Status dot="bg-neutral-300">
          <span className="font-medium">Close, not yet</span>
          <span className="text-neutral-400">
            {diffs.length >= 50 ? '50+' : diffs.length} {diffs.length === 1 ? 'difference' : 'differences'}
          </span>
        </Status>
        <div className={cn(MONO_GRID, 'gap-y-1')}>
          <span className="text-neutral-500">yours</span>
          <span className="whitespace-pre-wrap text-text">{formatValue(outcome.value)}</span>
          <span className="text-accent-300">wanted</span>
          <span className="whitespace-pre-wrap text-accent-200">{formatValue(expected)}</span>
        </div>
        <details className="text-xs text-neutral-400">
          <summary>Show each difference</summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {diffs.map((entry, i) => (
              <li key={`${entry.path}-${i}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 font-mono text-[12px] leading-[1.6]">
                <span className="text-neutral-500">{KIND_LABEL[entry.kind]}</span>
                <span className="min-w-0 break-words text-neutral-300">
                  {entry.path}
                  {entry.kind !== 'missing' && <span className="text-neutral-500"> · yours </span>}
                  {entry.kind !== 'missing' && <span className="text-text">{formatShort(entry.actual, 80)}</span>}
                  {entry.kind !== 'unexpected' && <span className="text-neutral-500"> · wanted </span>}
                  {entry.kind !== 'unexpected' && <span className="text-accent-200">{formatShort(entry.expected, 80)}</span>}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </div>
      {stale}
      <Logs logs={outcome.logs} />
    </>
  )
}

function PeekView({
  groups,
  dimmed,
  correct,
  peekSample,
  onShowResult,
}: {
  groups: PeekGroup[]
  dimmed: boolean
  correct: boolean
  peekSample: string
  onShowResult: () => void
}) {
  return (
    <>
      {correct && (
        <button
          type="button"
          onClick={onShowResult}
          className="flex cursor-pointer items-center gap-2 self-start rounded-lg bg-accent-900 px-2.5 py-[5px] text-xs font-medium text-accent-200 shadow-[inset_0_0_0_1px_var(--color-accent-800)] hover:bg-accent-800"
        >
          ✓ Correct · see result
        </button>
      )}
      {groups.length === 0 && (
        <div className="flex max-w-[520px] flex-col gap-2.5 text-[13px] leading-[1.55] text-neutral-300">
          <span>
            See what your code is doing while you type. Click a line number to watch that line, or wrap any value in{' '}
            <code className="font-mono text-text">peek()</code>. Values show next to the code and here, one row per pass through a loop.
          </span>
          <code className="self-start rounded-md bg-bg px-2 py-1 font-mono text-xs text-neutral-200">{peekSample}</code>
        </div>
      )}
      {dimmed && <span className="text-[11px] text-neutral-500">Showing the last run that compiled</span>}
      <div className={cn('flex flex-col gap-3.5 transition-opacity', dimmed && 'opacity-50')}>
        {groups.map((group) => (
          <div key={`${group.line ?? ''}-${group.label}`} className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2.5 font-mono text-xs">
              {group.line !== undefined && <span className="text-neutral-500">line {group.line}</span>}
              <span className="min-w-0 truncate text-accent-300">{group.label === 'return' ? 'return value' : group.label}</span>
              {group.values.length > 1 && <span className="text-neutral-500">{group.values.length} passes</span>}
            </div>
            <div className={cn(MONO_GRID, 'gap-y-0.5')}>
              {group.values.slice(0, 30).map((value, i) => (
                <PeekRow key={i} index={group.values.length > 1 ? `#${i + 1}` : ''} value={value} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function PeekRow({ index, value }: { index: string; value: unknown }) {
  return (
    <>
      <span className="text-neutral-600 tabular-nums">{index}</span>
      <span className="whitespace-pre-wrap text-neutral-100">{formatValue(value)}</span>
    </>
  )
}
