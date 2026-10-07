'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Shortcut, useKeys } from './kbd'
import { Wordmark } from './wordmark'

export type ExerciseLink = { id: string; title: string; solved: boolean }

export function TopBar({
  pathName,
  position,
  exercises,
  onHome,
  onJump,
  onSelect,
}: {
  pathName: string
  position: number
  exercises: ExerciseLink[]
  onHome: () => void
  onJump: () => void
  onSelect: (index: number) => void
}) {
  const keys = useKeys()
  return (
    <header className="rule-b flex items-center gap-3.5 px-4 py-2.5">
      <button type="button" title="Home (Esc)" onClick={onHome} className="-ml-1.5 cursor-pointer rounded-md px-1.5 py-1 hover:bg-text/7">
        <Wordmark />
      </button>
      <button
        type="button"
        title={`Switch path or exercise (${keys.k})`}
        onClick={onJump}
        className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[13px] text-neutral-300 hover:bg-text/7 hover:text-text"
      >
        <span className="truncate font-mono text-text">{pathName}</span>
        <span className="whitespace-nowrap text-neutral-500 tabular-nums">
          {position + 1} / {exercises.length}
        </span>
        <span aria-hidden="true" className="text-[10px] text-neutral-500">
          ▾
        </span>
      </button>
      <nav aria-label="Exercises in this path" className="hidden max-w-[420px] flex-1 gap-0.5 sm:flex">
        {exercises.map((item, i) => {
          const label = `${i + 1}. ${item.title}${item.solved ? ' ✓' : ''}`
          return (
            <button
              key={item.id}
              type="button"
              title={label}
              aria-label={label}
              aria-current={i === position ? 'step' : undefined}
              onClick={() => onSelect(i)}
              className="max-w-10 flex-1 cursor-pointer px-px py-2.5"
            >
              <span
                className={cn(
                  'block h-1 rounded-[2px]',
                  item.solved ? 'bg-accent' : i === position ? 'bg-neutral-300' : 'bg-neutral-800',
                  i === position && 'shadow-[0_0_0_2px_var(--color-bg),0_0_0_3px_var(--color-neutral-500)]',
                )}
              />
            </button>
          )
        })}
      </nav>
      <Button size="sm" className="ml-auto" onClick={onJump}>
        Jump <Shortcut>{keys.k}</Shortcut>
      </Button>
    </header>
  )
}
