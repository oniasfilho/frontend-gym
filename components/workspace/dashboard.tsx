'use client'

import { useEffect } from 'react'
import { ArrowRight, Check, ChevronDown, Circle, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { tracks, type ConceptPath } from '@/lib/curriculum'
import type { Exercise } from '@/lib/exercises'
import { cn } from '@/lib/utils'
import { Kbd } from './kbd'
import { Wordmark } from './wordmark'
import { DIFFICULTY_STYLE } from './top-bar'

export type ResumePoint = {
  path: ConceptPath
  index: number
  exercise: Exercise
  solved: boolean[]
  lastActiveAt: number | null
}

const LABEL = 'font-mono text-[11px] uppercase tracking-wide text-muted-foreground'
const COUNT = 'shrink-0 font-mono text-[11px] whitespace-nowrap tabular-nums text-muted-foreground'
// bg-muted/50 composites to roughly bg-card in dark mode, so tint the card itself instead.
const CARD_HOVER = 'hover:border-foreground/20 hover:bg-[color-mix(in_oklab,var(--color-foreground)_4%,var(--color-card))]'

const activeTrack = tracks[0]

function percent(path: ConceptPath) {
  return path.total ? (path.completed / path.total) * 100 : 0
}

function statusLabel(path: ConceptPath) {
  if (path.total === 0) return 'Coming soon'
  if (path.status === 'completed') return 'Completed'
  if (path.status === 'in-progress') return 'In progress'
  return 'Not started'
}

function relativeTime(timestamp: number) {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function Dashboard({
  paths,
  resume,
  hydrated,
  onResume,
  onOpenPath,
}: {
  paths: ConceptPath[]
  resume: ResumePoint
  hydrated: boolean
  onResume: () => void
  onOpenPath: (path: ConceptPath) => void
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const focused = paths.filter((path) => path.slug !== 'mixed')
  const mixed = paths.find((path) => path.slug === 'mixed')
  const upNext = focused.find((path) => path.completed < path.total)
  const completeCount = paths.filter((path) => path.status === 'completed').length
  const number = (path: ConceptPath) => String(paths.indexOf(path) + 1).padStart(2, '0')

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!hydrated || event.key !== 'Enter' || event.defaultPrevented || event.isComposing) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, [contenteditable]')) return
      event.preventDefault()
      onResume()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hydrated, onResume])

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2">
        <span className="font-mono text-sm font-semibold tracking-tight">
          <Wordmark />
        </span>
        <span className="h-6 w-px bg-border" aria-hidden="true" />
        {/* Becomes a track dropdown once a second track exists. */}
        <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'pointer-events-none')}>
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">Track</span>
          <span className="text-[13px]">{activeTrack.name}</span>
          <ChevronDown className="text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onResume}>
            Workspace
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 px-6 pt-8 pb-14">
        <h1 className="sr-only">Dashboard</h1>
        {hydrated && (
          <>
            <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-3">
              <ContinueCard resume={resume} onResume={onResume} />
              <TrackProgress paths={paths} completeCount={completeCount} />
            </section>

            {tracks.length > 1 && <TrackList paths={paths} />}

            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold tracking-tight">Concept paths</h2>
                  <p className="max-w-[560px] text-sm leading-relaxed text-pretty text-muted-foreground">
                    Numbered in the suggested learning order. Any path can be opened; Mixed Practice combines everything.
                  </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {completeCount} / {paths.length} paths complete
                </span>
              </div>
              <ol className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2">
                {focused.map((path) => (
                  <li key={path.slug} className="flex">
                    <PathCard path={path} number={number(path)} upNext={path === upNext} onOpen={() => onOpenPath(path)} />
                  </li>
                ))}
              </ol>
              {mixed && (
                <button
                  type="button"
                  disabled={mixed.total === 0}
                  onClick={() => onOpenPath(mixed)}
                  className="flex w-full flex-wrap items-center gap-5 rounded-lg border border-dashed border-foreground/20 p-4 text-left transition-colors hover:bg-card disabled:pointer-events-none disabled:opacity-60"
                >
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{number(mixed)}</span>
                  <span className="flex min-w-[220px] flex-1 flex-col gap-0.5">
                    <span className="font-mono text-[15px] font-medium">{mixed.name}</span>
                    <span className="text-[13px] text-muted-foreground">{mixed.description} Best after the focused paths.</span>
                  </span>
                  <span className={COUNT}>
                    {mixed.total === 0 ? 'Coming soon' : `${mixed.completed} / ${mixed.total}`}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function ContinueCard({ resume, onResume }: { resume: ResumePoint; onResume: () => void }) {
  const { path, index, exercise, solved, lastActiveAt } = resume
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className={LABEL}>Continue where you left off</span>
        {lastActiveAt !== null && <span className="font-mono text-[11px] text-muted-foreground">{relativeTime(lastActiveAt)}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] text-muted-foreground">
          {activeTrack.name} / {path.name} · Exercise {index + 1} of {solved.length}
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[22px] leading-tight font-medium tracking-tight">{exercise.title}</h2>
          <Badge variant="outline" className={cn('font-mono text-[11px]', DIFFICULTY_STYLE[exercise.difficulty])}>
            {exercise.difficulty}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {solved.map((done, i) => (
          <span key={i} className={cn('h-1 flex-1 rounded-[2px]', i === index ? 'bg-foreground' : done ? 'bg-success' : 'bg-muted')} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" className="px-3.5" onClick={onResume}>
          Resume
          <ArrowRight data-icon="inline-end" />
        </Button>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Kbd>↵</Kbd>
          resume
        </span>
      </div>
    </div>
  )
}

function TrackProgress({ paths, completeCount }: { paths: ConceptPath[]; completeCount: number }) {
  const solved = paths.reduce((sum, path) => sum + path.completed, 0)
  const total = paths.reduce((sum, path) => sum + path.total, 0)
  const inProgressCount = paths.filter((path) => path.status === 'in-progress').length
  const notStartedCount = paths.filter((path) => path.completed === 0).length

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <span className={LABEL}>Track progress</span>
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] leading-tight font-medium tracking-tight tabular-nums">{solved}</span>
        <span className="font-mono text-[13px] text-muted-foreground">/ {total} exercises solved</span>
      </div>
      <div className="flex h-7 items-end gap-0.5" aria-hidden="true">
        {paths.map((path) => (
          <span key={path.slug} title={path.name} className="flex h-full flex-1 flex-col justify-end overflow-hidden rounded-[2px] bg-muted">
            <span className={path.status === 'completed' ? 'bg-success' : 'bg-warning'} style={{ height: `${percent(path)}%` }} />
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 font-mono text-[11px] text-muted-foreground">
        <LegendItem swatch="bg-success">{completeCount} paths complete</LegendItem>
        <LegendItem swatch="bg-warning">{inProgressCount} in progress</LegendItem>
        <LegendItem swatch="bg-muted">{notStartedCount} not started</LegendItem>
      </div>
    </div>
  )
}

function LegendItem({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-[2px]', swatch)} aria-hidden="true" />
      {children}
    </span>
  )
}

function TrackList({ paths }: { paths: ConceptPath[] }) {
  const total = paths.reduce((sum, path) => sum + path.total, 0)
  return (
    <section className="flex flex-col gap-3">
      <span className={LABEL}>Tracks</span>
      <div className="flex flex-wrap gap-2">
        {tracks.map((track) => (
          <button
            key={track.slug}
            type="button"
            disabled={track.comingSoon}
            aria-current={track === activeTrack ? 'true' : undefined}
            className={cn(
              'flex min-w-[180px] flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left',
              track === activeTrack ? 'border-foreground/25 bg-card' : 'bg-transparent opacity-55',
            )}
          >
            <span className="text-[13px] font-medium">{track.name}</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {track.comingSoon ? 'Coming soon' : track === activeTrack ? `${paths.length} paths · ${total} exercises` : ''}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function PathCard({ path, number, upNext, onOpen }: { path: ConceptPath; number: string; upNext: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      disabled={path.total === 0}
      onClick={onOpen}
      className={cn(
        'flex min-h-[132px] w-full flex-col gap-2.5 rounded-lg border bg-card p-3.5 text-left transition-colors disabled:pointer-events-none disabled:opacity-60',
        CARD_HOVER,
        upNext && 'border-foreground/30',
      )}
    >
      <span className="flex w-full items-center gap-2">
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{number}</span>
        {upNext && <span className="rounded-md border border-foreground/25 bg-foreground/5 px-1.5 font-mono text-[10px]">Up next</span>}
        <span
          className={cn(
            'ml-auto flex items-center gap-1 text-[11px]',
            path.status === 'completed' ? 'text-success' : path.status === 'in-progress' ? 'text-warning' : 'text-muted-foreground',
          )}
        >
          {path.status === 'completed' && <Check className="size-[13px]" aria-hidden="true" />}
          {path.status === 'in-progress' && <Circle className="size-3" aria-hidden="true" />}
          {statusLabel(path)}
        </span>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-mono text-[15px] font-medium">{path.name}</span>
        <span className="text-[13px] leading-snug text-muted-foreground">{path.description}</span>
      </span>
      <span className="mt-auto flex w-full items-center gap-2.5">
        <span className="h-1 flex-1 overflow-hidden rounded-[2px] bg-muted">
          <span className={cn('block h-full', path.status === 'completed' ? 'bg-success' : 'bg-warning')} style={{ width: `${percent(path)}%` }} />
        </span>
        <span className={COUNT}>
          {path.completed} / {path.total}
        </span>
      </span>
    </button>
  )
}
