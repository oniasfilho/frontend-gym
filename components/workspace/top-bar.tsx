'use client'

import { CircleCheck, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/lib/exercises'
import { cn } from '@/lib/utils'
import { ExerciseMenu, type ExerciseLink } from './exercise-menu'

const DIFFICULTY_STYLE: Record<Exercise['difficulty'], string> = {
  easy: 'text-success border-success/30',
  medium: 'text-warning border-warning/30',
  hard: 'text-destructive border-destructive/30',
}

export function TopBar({
  exercise,
  position,
  total,
  solved,
  solvedCount,
  view,
  links,
  onSelect,
  onResetProgress,
}: {
  exercise: Exercise
  position: number
  total: number
  solved: boolean
  solvedCount: number
  view: 'exercise' | 'summary'
  links: ExerciseLink[]
  onSelect: (index: number) => void
  onResetProgress: () => void
}) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-3 py-2">
      <span className="font-mono text-sm font-semibold tracking-tight">
        reshape<span className="text-muted-foreground">()</span>
      </span>
      <span className="h-4 w-px bg-border" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="truncate text-sm font-medium">{view === 'summary' ? 'Practice set' : exercise.title}</h1>
        {view === 'exercise' && solved && <CircleCheck className="size-4 shrink-0 text-success" aria-label="Solved" />}
      </div>
      {view === 'exercise' && (
        <Badge variant="outline" className={cn('font-mono capitalize', DIFFICULTY_STYLE[exercise.difficulty])}>
          {exercise.difficulty}
        </Badge>
      )}
      {view === 'exercise' && (
        <ul className="hidden items-center gap-1.5 lg:flex" aria-label="Concepts">
          {exercise.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary" className="font-mono font-normal">
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline">
          {solvedCount}/{total} solved
        </span>
        <ExerciseMenu
          position={position}
          total={total}
          solvedCount={solvedCount}
          current={position}
          exercises={links}
          onSelect={onSelect}
          onResetProgress={onResetProgress}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </Button>
      </div>
    </header>
  )
}
