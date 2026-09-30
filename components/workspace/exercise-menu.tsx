'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Circle, CircleCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Difficulty } from '@/lib/exercises'
import { cn } from '@/lib/utils'

export type ExerciseLink = {
  id: string
  title: string
  difficulty: Difficulty
  solved: boolean
}

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: 'text-success',
  medium: 'text-warning',
  hard: 'text-destructive',
}

export function requestProgressReset(action: () => void) {
  if (window.confirm('Clear every draft and solved exercise saved in this browser?')) action()
}

export function ExerciseMenu({
  position,
  total,
  solvedCount,
  current,
  exercises,
  onSelect,
  onResetProgress,
}: {
  position: number
  total: number
  solvedCount: number
  current: number
  exercises: ExerciseLink[]
  onSelect: (index: number) => void
  onResetProgress: () => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <Button
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="font-mono tabular-nums">
          {position + 1} / {total}
        </span>
        <ChevronDown data-icon="inline-end" />
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 flex max-h-[min(70vh,32rem)] w-80 flex-col overflow-hidden rounded-lg border bg-popover">
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <span className="font-mono text-xs text-muted-foreground">
              {solvedCount} / {total} solved
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                requestProgressReset(() => {
                  onResetProgress()
                  setOpen(false)
                })
              }}
            >
              Reset progress
            </Button>
          </div>
          <ul role="listbox" aria-label="Exercises" className="overflow-auto py-1">
            {exercises.map((exercise, index) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === current}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted',
                    index === current && 'bg-muted',
                  )}
                  onClick={() => {
                    onSelect(index)
                    setOpen(false)
                  }}
                >
                  {exercise.solved ? (
                    <CircleCheck className="size-3.5 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{exercise.title}</span>
                  <Badge variant="outline" className={cn('font-mono text-[10px] capitalize', DIFFICULTY_STYLE[exercise.difficulty])}>
                    {exercise.difficulty}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
