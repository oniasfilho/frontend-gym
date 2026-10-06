'use client'

import { ArrowLeft, ArrowRight, Check, ChevronDown, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { exercisesForPath, supportOf, type ConceptPath } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { Wordmark } from './wordmark'

export type CurriculumView = { kind: 'dashboard' } | { kind: 'concept'; path: ConceptPath } | { kind: 'completion'; path: ConceptPath }

export function ConceptOverview({ path, isSolved, onBack, onStart }: { path: ConceptPath; isSolved: (id: string) => boolean; onBack: () => void; onStart: (index: number) => void }) {
  const lessons = exercisesForPath(path.slug)
  const nextIndex = Math.max(0, lessons.findIndex((lesson) => !isSolved(lesson.id)))
  const supportingConcepts = [...new Set(lessons.flatMap(supportOf))]

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
          </div>
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">Exercises</h2>
          {lessons.length === 0 && <p role="status" className="text-sm text-muted-foreground">Exercises for this path are coming soon. Choose another path to practice.</p>}
          <ol className="overflow-hidden rounded-lg border bg-card">
            {lessons.map((lesson, index) => {
              const complete = isSolved(lesson.id)
              const current = !complete && index === nextIndex
              return <li key={lesson.id} className="border-b last:border-b-0"><button type="button" onClick={() => onStart(index)} className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50', current && 'bg-muted/40')}><span className="w-6 font-mono text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>{complete ? <Check className="text-success" aria-hidden="true" /> : <Circle className={current ? 'text-warning' : 'text-muted-foreground'} aria-hidden="true" />}<span className="min-w-0 flex-1 truncate text-sm">{lesson.title}</span><span className="font-mono text-[11px] text-muted-foreground">{complete ? 'Completed' : current ? 'Current' : 'Not started'}</span></button></li>
            })}
          </ol>
        </section>
        <aside className="flex flex-col gap-4">
          <KnowledgeList title="Supporting techniques" items={supportingConcepts} />
          <Button disabled={lessons.length === 0} onClick={() => onStart(nextIndex)}>{lessons.length === 0 ? 'Coming soon' : path.completed === path.total ? 'Review path' : 'Continue path'}<ArrowRight data-icon="inline-end" /></Button>
        </aside>
      </main>
    </div>
  )
}

function KnowledgeList({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  return <section className="rounded-lg border bg-card p-3"><h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">{title}</h2><ul className={cn('flex flex-col gap-1.5 text-sm', muted && 'text-muted-foreground')}>{items.length ? items.map((item) => <li key={item} className="flex items-center gap-2"><span className="text-muted-foreground">—</span><code className="font-mono text-xs">{item}</code></li>) : <li className="text-muted-foreground">None listed.</li>}</ul></section>
}

export function PathCompletion({ path, practiced, nextPath, onDashboard, onNext, onRepeat }: { path: ConceptPath; practiced: string[]; nextPath?: ConceptPath; onDashboard: () => void; onNext: () => void; onRepeat: () => void }) {
  const focused = path.slug !== 'mixed'
  return (
    <div className="flex h-dvh flex-col bg-background">
      <CurriculumHeader title={`${path.name} completed`} eyebrow="Data Transformation" onBack={onDashboard} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-6">
        <div className="border-b pb-5">
          <span className="font-mono text-xs text-success">PATH COMPLETE · {path.total} / {path.total}</span>
          <h1 className="mt-2 font-mono text-2xl font-semibold">{path.name} completed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{focused ? 'You completed this focused path. Completion means the output matched and the intended learning constraint was satisfied.' : 'You combined previously learned concepts to solve realistic transformations.'}</p>
        </div>
        <KnowledgeList title="You practiced" items={practiced} />
        {nextPath && <div className="rounded-lg border bg-card p-4"><span className="font-mono text-xs text-muted-foreground">NEXT PATH</span><h2 className="mt-1 font-mono text-lg">{nextPath.name}</h2><p className="text-sm text-muted-foreground">{nextPath.description}</p></div>}
        <div className="flex flex-wrap gap-2">
          {nextPath && <Button onClick={onNext}>Continue to {nextPath.name}<ArrowRight data-icon="inline-end" /></Button>}
          <Button variant={nextPath ? 'outline' : 'default'} onClick={onRepeat}>Repeat {path.name}</Button>
          <Button variant="ghost" onClick={onDashboard}>Open dashboard</Button>
        </div>
      </main>
    </div>
  )
}

function CurriculumHeader({ title, eyebrow, onBack }: { title: string; eyebrow: string; onBack: () => void }) {
  return <header className="flex min-h-12 shrink-0 items-center gap-3 border-b px-3"><button type="button" className="font-mono text-sm font-semibold tracking-tight" onClick={onBack}><Wordmark /></button><span className="h-4 w-px bg-border" /><Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft data-icon="inline-start" />Dashboard</Button><div className="ml-auto flex items-center gap-2 text-xs"><span className="hidden text-muted-foreground sm:inline">{eyebrow}</span><ChevronDown className="text-muted-foreground" /><span className="font-mono">{title}</span></div></header>
}
