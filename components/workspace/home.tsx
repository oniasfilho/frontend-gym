'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEnterAnimation } from '@/hooks/use-enter-animation'
import { activityStats, relativeTime, type Activity } from '@/lib/activity'
import type { ConceptPath } from '@/lib/curriculum'
import type { Exercise } from '@/lib/exercises'
import type { ThemeName } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { Shortcut, useKeys } from './kbd'
import { ThemePicker } from './theme-picker'
import { Wordmark } from './wordmark'

export type ResumePoint = {
  path: ConceptPath
  index: number
  exercise: Exercise
  solved: boolean[]
}

const LEVELS = ['bg-neutral-800', 'bg-accent-800', 'bg-accent-700', 'bg-accent-600', 'bg-accent-400']

export function Home({
  paths,
  resume,
  started,
  lastActiveAt,
  activity,
  theme,
  onTheme,
  onResume,
  onOpenPath,
  onJump,
}: {
  paths: ConceptPath[]
  resume: ResumePoint
  /** Anything solved or practiced yet. */
  started: boolean
  lastActiveAt: number | null
  activity: Activity
  theme: ThemeName
  onTheme: (theme: ThemeName) => void
  onResume: () => void
  onOpenPath: (path: ConceptPath) => void
  onJump: () => void
}) {
  const keys = useKeys()
  const stage = useRef<HTMLDivElement>(null)
  useEnterAnimation(stage, 'home')

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, summary, [contenteditable]')) return
      event.preventDefault()
      onResume()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onResume])

  const open = paths.filter((path) => path.total > 0)
  const solved = open.reduce((sum, path) => sum + path.completed, 0)
  const total = open.reduce((sum, path) => sum + path.total, 0)
  const pathsDone = open.filter((path) => path.completed === path.total).length
  const upNext = open.find((path) => path.completed < path.total)
  const stats = useMemo(() => activityStats(activity), [activity])

  return (
    <div
      ref={stage}
      className="flex min-h-dvh flex-col bg-[radial-gradient(1200px_600px_at_0%_-10%,color-mix(in_srgb,var(--color-accent-900)_70%,transparent),transparent_60%),var(--color-bg)]"
    >
      <header className="mx-auto flex w-full max-w-[1120px] items-center gap-4 px-6 py-5 sm:px-10">
        <Wordmark />
        <span className="hidden text-xs text-neutral-500 sm:inline">Data Transformation</span>
        <div className="ml-auto flex items-center gap-3">
          <ThemePicker theme={theme} onPick={onTheme} />
          <Button size="sm" onClick={onJump}>
            Jump to… <Shortcut>{keys.k}</Shortcut>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-20 px-6 pt-12 pb-24 sm:px-10 sm:pt-20">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-x-20 gap-y-12">
          <section aria-label="Continue" className="flex min-w-0 flex-col gap-5">
            <span className="text-[11px] tracking-[0.1em] text-accent uppercase">{started ? 'Continue where you left off' : 'Start here'}</span>
            <div className="flex flex-col gap-2">
              <h1 className="text-[42px] text-balance">{resume.exercise.title}</h1>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-neutral-400">
                <span className="font-mono text-text">{resume.path.name}</span>
                <span className="whitespace-nowrap">
                  Exercise {resume.index + 1} of {resume.solved.length}
                </span>
                {lastActiveAt !== null && <span className="whitespace-nowrap text-neutral-500">· {relativeTime(lastActiveAt)}</span>}
              </div>
            </div>
            <p className="max-w-[560px] text-[15px] leading-[1.6] text-pretty text-neutral-300">{resume.exercise.prompt}</p>
            <div className="flex max-w-[360px] gap-1" aria-hidden="true">
              {resume.solved.map((done, i) => (
                <span key={i} className={cn('h-1 flex-1 rounded-[2px]', done ? 'bg-accent' : i === resume.index ? 'bg-neutral-300' : 'bg-neutral-800')} />
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3.5">
              <Button variant="primary" size="lg" onClick={onResume}>
                Continue <span className="font-mono text-xs opacity-80">↵</span>
              </Button>
              <span className="text-xs text-neutral-500">Press Enter from anywhere on this page</span>
            </div>
          </section>

          <section aria-label="Your progress" className="flex flex-col gap-5 rounded-[10px] bg-surface p-6 shadow-(--shadow-sm)">
            <h2 className="text-base">Your progress</h2>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline gap-2.5">
                <span className="text-[42px] leading-none font-medium tracking-[-0.02em] tabular-nums">{solved}</span>
                <span className="text-[13px] text-neutral-400">of {total} exercises solved</span>
              </div>
              <div className="h-1 overflow-hidden rounded-[2px] bg-neutral-800">
                <div className="h-full rounded-[2px] bg-accent" style={{ width: `${total ? Math.round((solved / total) * 100) : 0}%` }} />
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              <Stat label="Streak" value={stats.streak} unit={stats.streak === 1 ? ' day' : ' days'} />
              <Stat label="Last 7 days" value={stats.week} unit=" solved" />
              <Stat label="Paths done" value={pathsDone} unit={` / ${open.length}`} />
            </dl>
            <div className="flex flex-col gap-2">
              <div className="grid grid-flow-col grid-cols-[repeat(15,11px)] grid-rows-[repeat(7,11px)] gap-[3px] overflow-hidden">
                {stats.cells.map((cell) => (
                  <span key={cell.key} title={cell.future ? undefined : cell.title} className={cn('rounded-[2px]', cell.future ? 'bg-transparent' : LEVELS[cell.level])} />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                <span className="whitespace-nowrap">
                  Last 15 weeks · {stats.activeDays} active {stats.activeDays === 1 ? 'day' : 'days'}
                </span>
                <span className="ml-auto">Less</span>
                {LEVELS.map((level) => (
                  <span key={level} className={cn('size-[9px] rounded-[2px]', level)} />
                ))}
                <span>More</span>
              </div>
            </div>
          </section>
        </div>

        <section aria-label="Paths" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-base">Paths</h2>
            <span className="text-xs text-neutral-500">In suggested order. Open any path; it starts at your first unsolved exercise.</span>
          </div>
          <ol className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-x-10 gap-y-1">
            {paths.map((path, i) => {
              const done = path.total > 0 && path.completed === path.total
              return (
                <li key={path.slug} className="flex">
                  <button
                    type="button"
                    disabled={path.total === 0}
                    onClick={() => onOpenPath(path)}
                    className="-mx-3 grid flex-1 cursor-pointer grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-3 py-3.5 text-left hover:bg-text/5 active:bg-accent/12 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <span className="font-mono text-[11px] text-neutral-500 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-mono text-sm">{path.name}</span>
                      {path === upNext && (
                        <Badge size="sm" className="px-1.5">
                          Up next
                        </Badge>
                      )}
                      {done && (
                        <span className="text-xs text-accent" aria-label="Complete">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400 tabular-nums">{path.total ? `${path.completed} / ${path.total}` : '—'}</span>
                    <span />
                    <span className="truncate text-xs text-neutral-400">{path.description}</span>
                    <span className="h-[3px] w-11 overflow-hidden rounded-[2px] bg-neutral-800">
                      <span className="block h-full bg-accent" style={{ width: `${path.total ? Math.round((path.completed / path.total) * 100) : 0}%` }} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      </main>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] text-neutral-400">{label}</dt>
      <dd className="text-xl font-medium tabular-nums">
        {value}
        <span className="text-xs font-normal text-neutral-400">{unit}</span>
      </dd>
    </div>
  )
}
