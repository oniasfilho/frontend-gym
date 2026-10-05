'use client'

import { ArrowLeft, ArrowRight, Check, ChevronDown, Circle, LockKeyhole } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { conceptPaths, filterExercises, prerequisitesFor, type ConceptPath } from '@/lib/curriculum'
import { cn } from '@/lib/utils'

export type CurriculumView = { kind: 'navigator' } | { kind: 'concept'; path: ConceptPath } | { kind: 'completion'; path: ConceptPath }

const STATUS_LABEL = {
  completed: 'Completed',
  'in-progress': 'In progress',
  available: 'Available',
  'not-started': 'Not started',
}

export function PathNavigator({ onOpen, onBack }: { onOpen: (path: ConceptPath) => void; onBack: () => void }) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <CurriculumHeader onBack={onBack} title="Data Transformation" eyebrow="JavaScript / TypeScript" />
      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-auto px-4 py-6 md:px-8">
        <div className="mb-5 flex items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-balance">Concept paths</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">One concept at a time. Each path may reuse earlier knowledge, but never depends on a concept introduced later.</p>
          </div>
          <span className="hidden font-mono text-xs text-muted-foreground md:block">03 / 18 paths active</span>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="hidden grid-cols-[3rem_1.1fr_1.4fr_8rem_8rem_1.5rem] gap-3 border-b bg-muted/30 px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground md:grid">
            <span>No.</span><span>Concept</span><span>Purpose</span><span>Progress</span><span>Status</span><span />
          </div>
          <ol>
            {conceptPaths.map((path, index) => (
              <li key={path.slug} className="border-b last:border-b-0">
                <button type="button" onClick={() => onOpen(path)} className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 md:grid-cols-[3rem_1.1fr_1.4fr_8rem_8rem_1.5rem]">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  <span className="font-mono text-sm font-medium">{path.name}</span>
                  <span className="hidden text-sm text-muted-foreground md:block">{path.description}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{path.completed} / {path.total}</span>
                  <span className="hidden items-center gap-2 text-xs md:flex">
                    {path.status === 'completed' ? <Check className="text-success" aria-hidden="true" /> : path.status === 'not-started' ? <LockKeyhole className="text-muted-foreground" aria-hidden="true" /> : <Circle className={path.status === 'in-progress' ? 'text-warning' : 'text-muted-foreground'} aria-hidden="true" />}
                    {STATUS_LABEL[path.status]}
                  </span>
                  <ArrowRight className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">Sequence indicates prerequisite direction: for...of → map → filter → find → … → Mixed Practice</p>
      </main>
    </div>
  )
}

export function ConceptOverview({ path, onBack, onStart }: { path: ConceptPath; onBack: () => void; onStart: (index: number) => void }) {
  const prerequisites = prerequisitesFor(path)
  const isFilter = path.slug === 'filter'
  const lessons = isFilter ? filterExercises : Array.from({ length: path.total }, (_, index) => `${path.name} exercise ${String(index + 1).padStart(2, '0')}`)
  const future = conceptPaths.slice(conceptPaths.findIndex((item) => item.slug === path.slug) + 1, -1).slice(0, 5)

  return (
    <div className="flex h-dvh flex-col bg-background">
      <CurriculumHeader onBack={onBack} title={path.name} eyebrow="Data Transformation" />
      <main className="mx-auto grid min-h-0 w-full max-w-5xl flex-1 gap-6 overflow-auto px-4 py-6 md:grid-cols-[1fr_18rem] md:px-8">
        <section className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 border-b pb-5">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">Focus: {path.name}</Badge>
              <span className="font-mono text-xs text-muted-foreground">{path.completed} / {path.total} complete</span>
            </div>
            <div><h1 className="font-mono text-2xl font-semibold tracking-tight">{path.name}</h1><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{path.description}</p></div>
            {path.status === 'not-started' && prerequisites.length > 0 && <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm"><span className="font-medium text-warning">Recommended prerequisite.</span> This path assumes familiarity with {prerequisites.slice(-3).join(', ')}. You can continue anyway.</div>}
          </div>
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">Exercises</h2>
          <ol className="overflow-hidden rounded-lg border bg-card">
            {lessons.map((title, index) => {
              const complete = index < path.completed
              const current = index === path.completed
              return <li key={title} className="border-b last:border-b-0"><button type="button" onClick={() => onStart(Math.min(index, 9))} className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50', current && 'bg-muted/40')}><span className="w-6 font-mono text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>{complete ? <Check className="text-success" aria-hidden="true" /> : <Circle className={current ? 'text-warning' : 'text-muted-foreground'} aria-hidden="true" />}<span className="min-w-0 flex-1 truncate text-sm">{title}</span><span className="font-mono text-[11px] text-muted-foreground">{complete ? 'Completed' : current ? 'Current' : 'Not started'}</span></button></li>
            })}
          </ol>
        </section>
        <aside className="flex flex-col gap-4">
          <KnowledgeList title="Allowed knowledge" items={[...prerequisites.slice(-6), 'basic objects', 'arrays', 'conditionals']} />
          <KnowledgeList title="This path does not require" items={future.map((item) => item.name)} muted />
          <Button onClick={() => onStart(Math.min(path.completed, 9))}>Continue path<ArrowRight data-icon="inline-end" /></Button>
        </aside>
      </main>
    </div>
  )
}

function KnowledgeList({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  return <section className="rounded-lg border bg-card p-3"><h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">{title}</h2><ul className={cn('flex flex-col gap-1.5 text-sm', muted && 'text-muted-foreground')}>{items.length ? items.map((item) => <li key={item} className="flex items-center gap-2"><span className="text-muted-foreground">—</span><code className="font-mono text-xs">{item}</code></li>) : <li className="text-muted-foreground">No prerequisites.</li>}</ul></section>
}

export function PathCompletion({ path, onNavigator, onNext, onRepeat }: { path: ConceptPath; onNavigator: () => void; onNext: () => void; onRepeat: () => void }) {
  return <div className="flex h-dvh flex-col bg-background"><CurriculumHeader title={`${path.name} completed`} eyebrow="Data Transformation" onBack={onNavigator} /><main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-6"><div className="border-b pb-5"><span className="font-mono text-xs text-success">PATH COMPLETE · {path.total} / {path.total}</span><h1 className="mt-2 font-mono text-2xl font-semibold">{path.name} completed</h1><p className="mt-2 text-sm text-muted-foreground">You completed this focused path. Completion means the output matched and the intended learning constraint was satisfied.</p></div><KnowledgeList title="You practiced" items={['selection predicates', 'boolean conditions', 'preserving collection order', 'combining selection with earlier concepts']} /><div className="rounded-lg border bg-card p-4"><span className="font-mono text-xs text-muted-foreground">NEXT PATH</span><h2 className="mt-1 font-mono text-lg">find</h2><p className="text-sm text-muted-foreground">Return the first matching item.</p></div><div className="flex flex-wrap gap-2"><Button onClick={onNext}>Continue to find<ArrowRight data-icon="inline-end" /></Button><Button variant="outline" onClick={onRepeat}>Repeat {path.name}</Button><Button variant="ghost" onClick={onNavigator}>Open path navigator</Button></div></main></div>
}

function CurriculumHeader({ title, eyebrow, onBack }: { title: string; eyebrow: string; onBack: () => void }) {
  return <header className="flex min-h-12 shrink-0 items-center gap-3 border-b px-3"><button type="button" className="font-mono text-sm font-semibold tracking-tight" onClick={onBack}>reshape<span className="text-muted-foreground">()</span></button><span className="h-4 w-px bg-border" /><Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft data-icon="inline-start" />Workspace</Button><div className="ml-auto flex items-center gap-2 text-xs"><span className="hidden text-muted-foreground sm:inline">{eyebrow}</span><ChevronDown className="text-muted-foreground" /><span className="font-mono">{title}</span></div></header>
}
