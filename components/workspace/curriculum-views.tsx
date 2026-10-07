'use client'

import { useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEnterAnimation } from '@/hooks/use-enter-animation'
import type { ConceptPath } from '@/lib/curriculum'
import { Wordmark } from './wordmark'

export function PathComplete({
  path,
  exercises,
  nextPath,
  onNext,
  onHome,
}: {
  path: ConceptPath
  exercises: { id: string; title: string; solved: boolean }[]
  nextPath?: ConceptPath
  onNext: () => void
  onHome: () => void
}) {
  const stage = useRef<HTMLDivElement>(null)
  useEnterAnimation(stage, `done:${path.slug}`)
  const solved = exercises.filter((item) => item.solved).length

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onHome()
        return
      }
      if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, summary, [contenteditable]')) return
      event.preventDefault()
      if (nextPath) onNext()
      else onHome()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [nextPath, onHome, onNext])

  return (
    <div ref={stage} className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-[640px] items-center px-6 py-5">
        <button type="button" title="Home (Esc)" onClick={onHome} className="cursor-pointer">
          <Wordmark />
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-[640px] flex-col gap-[22px] px-6 pt-[12vh] pb-16">
        <span className="text-[11px] tracking-[0.1em] text-accent uppercase">Path complete</span>
        <h1 className="font-mono text-[42px] font-medium tracking-[-0.02em]">{path.name}</h1>
        <p className="text-[15px] text-neutral-300">
          {solved} of {exercises.length} solved.{solved < exercises.length && ' Skipped exercises stay open in the path.'}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {exercises.map((item) => (
            <Badge key={item.id} render={<li />} variant={item.solved ? 'accent' : 'neutral'}>
              {item.solved ? '✓' : '○'} {item.title}
            </Badge>
          ))}
        </ul>
        {nextPath ? (
          <div className="mt-[18px] flex flex-col gap-3">
            <span className="text-xs text-neutral-400">Up next</span>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xl">{nextPath.name}</span>
              <span className="text-sm text-neutral-300">{nextPath.description}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Button variant="primary" size="lg" onClick={onNext}>
                Start {nextPath.name} <span className="font-mono text-xs opacity-80">↵</span>
              </Button>
              <Button size="lg" className="px-4" onClick={onHome}>
                Home
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="primary" size="lg" onClick={onHome}>
              Back home ↵
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
