'use client'

import { useEffect, useRef, useState } from 'react'
import { popIn } from '@/hooks/use-enter-animation'
import { cn } from '@/lib/utils'

export type JumpItem = {
  id: string
  mark: string
  label: string
  sub: string
  mono?: boolean
  /** false keeps the item out of the recent slot, for actions that shouldn't be one ↵ away. */
  remember?: boolean
  run: () => void
}

const RECENT_KEY = 'reshape:jump-recent:v1'

function readRecent() {
  try {
    return window.localStorage.getItem(RECENT_KEY)
  } catch {
    return null
  }
}

function saveRecent(id: string) {
  try {
    window.localStorage.setItem(RECENT_KEY, id)
  } catch {
    // Remembering the last pick is a convenience; the palette works without it.
  }
}

/**
 * ⌘K: jump to Home, a path or an exercise. Searching also reaches themes and commands.
 * The last pick leads the suggestions, so ⌘K ↵ repeats it.
 */
export function JumpPalette({ items, searchItems, onClose }: { items: JumpItem[]; searchItems: JumpItem[]; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [recentId] = useState(readRecent)
  const panel = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    input.current?.focus()
    popIn(panel.current)
  }, [])

  const q = query.trim().toLowerCase()
  // Looked up by id so its label and counts are current.
  const recent = recentId ? searchItems.find((item) => item.id === recentId && item.remember !== false) : undefined
  const suggestions = recent ? [recent, ...items.filter((item) => item.id !== recent.id)] : items
  const results = q ? searchItems.filter((item) => `${item.label} ${item.sub}`.toLowerCase().includes(q)) : suggestions
  const active = Math.min(selected, Math.max(results.length - 1, 0))

  function choose(item: JumpItem) {
    if (item.remember !== false) saveRecent(item.id)
    onClose()
    item.run()
  }

  function move(index: number) {
    setSelected(index)
    list.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      move(Math.min(active + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      move(Math.max(active - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (results[active]) choose(results[active])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-900/55 px-4 pt-[14vh] pb-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Jump to" className="flex w-[min(560px,100%)] flex-col overflow-hidden rounded-[14px] bg-surface shadow-(--shadow-lg)">
        <input
          ref={input}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setSelected(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a path or exercise…"
          aria-label="Search"
          role="combobox"
          aria-expanded="true"
          aria-controls="jump-results"
          aria-activedescendant={results[active] ? `jump-${results[active].id}` : undefined}
          className="rule-b px-[18px] py-4 text-[15px] text-text outline-none placeholder:text-neutral-500 focus-visible:outline-none"
        />
        <ul ref={list} id="jump-results" role="listbox" className="max-h-[380px] overflow-auto p-1.5">
          {results.map((item, index) => (
            <li key={item.id} id={`jump-${item.id}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                tabIndex={-1}
                data-index={index}
                onClick={() => choose(item)}
                onMouseEnter={() => setSelected(index)}
                className={cn('flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-[9px] text-left text-sm text-text', index === active && 'bg-accent/16')}
              >
                <span aria-hidden="true" className="w-3.5 shrink-0 text-xs text-accent">
                  {item.mark}
                </span>
                <span className={cn('min-w-0 flex-1 truncate', item.mono && 'font-mono')}>{item.label}</span>
                {!q && item === recent && <span className="shrink-0 text-[11px] text-neutral-500">recent</span>}
                <span className="shrink-0 font-mono text-[11px] text-neutral-400">{item.sub}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-6 text-[13px] text-neutral-400">Nothing matches “{query.trim()}”.</li>}
        </ul>
        <div className="rule-t flex gap-3.5 px-4 py-[9px] text-[11px] text-neutral-500">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>esc close</span>
          <span className="ml-auto hidden sm:inline">type “theme” to change colors</span>
        </div>
      </div>
    </div>
  )
}
