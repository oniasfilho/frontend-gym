'use client'

import { BookOpen, CircleCheck, Command, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/lib/exercises'
import { cn } from '@/lib/utils'
import { ExerciseMenu, type ExerciseLink } from './exercise-menu'
import { LearningConstraints } from './learning-controls'

const DIFFICULTY_STYLE: Record<Exercise['difficulty'], string> = {
  easy: 'text-success border-success/30',
  medium: 'text-warning border-warning/30',
  hard: 'text-destructive border-destructive/30',
}

export function TopBar({ exercise, pathName, position, total, solved, solvedCount, view, links, onSelect, onResetProgress, onOpenPaths, onOpenConcept, onOpenCommands }: { exercise: Exercise; pathName: string; position: number; total: number; solved: boolean; solvedCount: number; view: 'exercise' | 'summary'; links: ExerciseLink[]; onSelect: (index: number) => void; onResetProgress: () => void; onOpenPaths: () => void; onOpenConcept: () => void; onOpenCommands: () => void }) {
  const { resolvedTheme, setTheme } = useTheme()
  const focus = exercise.tags[0]
  const support = exercise.tags.slice(1)

  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2">
      <button type="button" className="font-mono text-sm font-semibold tracking-tight" onClick={onOpenPaths}>reshape<span className="text-muted-foreground">()</span></button>
      <span className="h-6 w-px bg-border" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <button type="button" onClick={onOpenConcept} className="w-fit font-mono text-[11px] text-muted-foreground hover:text-foreground">Data Transformation / {pathName}</button>
        <div className="flex min-w-0 items-center gap-2"><h1 className="truncate text-sm font-medium">{view === 'summary' ? 'Path summary' : exercise.title}</h1>{view === 'exercise' && solved && <CircleCheck className="text-success" aria-label="Solved" />}</div>
      </div>
      {view === 'exercise' && <div className="hidden items-center gap-2 lg:flex"><Badge variant="outline" className="font-mono border-foreground/25 bg-foreground/5">Focus: {focus}</Badge>{support.length > 0 && <span className="font-mono text-[11px] text-muted-foreground">Support: {support.join(' · ')}</span>}<Badge variant="outline" className={cn('font-mono capitalize', DIFFICULTY_STYLE[exercise.difficulty])}>{exercise.difficulty}</Badge></div>}
      <div className="ml-auto flex items-center gap-1.5">
        {view === 'exercise' && <LearningConstraints focus={focus} support={support} />}
        <Button variant="ghost" size="icon-sm" aria-label="Open command palette" onClick={onOpenCommands}><Command /></Button>
        <ExerciseMenu position={position} total={total} solvedCount={solvedCount} current={position} exercises={links} onSelect={onSelect} onResetProgress={onResetProgress} />
        <Button variant="ghost" size="icon-sm" aria-label="Open path navigator" onClick={onOpenPaths}><BookOpen /></Button>
        <Button variant="ghost" size="icon-sm" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}><Sun className="hidden dark:block" /><Moon className="dark:hidden" /></Button>
      </div>
    </header>
  )
}
