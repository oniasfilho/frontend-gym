'use client'

import { useState } from 'react'
import { Check, Copy, Pencil, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { JsonView } from './json-view'

function describe(value: unknown) {
  if (Array.isArray(value)) return `array · ${value.length}`
  if (value && typeof value === 'object') return `object · ${Object.keys(value).length} keys`
  return typeof value
}

export function DataPanel({
  letter,
  label,
  value,
  emphasis = false,
  className,
  editable = false,
  dirty = false,
  notice,
  onValueChange,
  onRestore,
  onHide,
}: {
  letter: string
  label: string
  value: unknown
  emphasis?: boolean
  className?: string
  editable?: boolean
  dirty?: boolean
  notice?: string | null
  onValueChange?: (value: unknown) => void
  onRestore?: () => void
  onHide?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  function startEditing() {
    setText(JSON.stringify(value, null, 2))
    setError(null)
    setEditing(true)
  }

  function updateText(next: string) {
    setText(next)
    try {
      onValueChange?.(JSON.parse(next))
      setError(null)
    } catch {
      setError('Invalid JSON')
    }
  }

  return (
    <section
      aria-label={`${letter}: ${label}`}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card',
        emphasis && 'border-foreground/20',
        className,
      )}
    >
      <header className="flex h-9 shrink-0 items-center gap-2 border-b px-3">
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded font-mono text-xs font-semibold',
            emphasis ? 'bg-foreground text-background' : 'bg-muted text-foreground',
          )}
        >
          {letter}
        </span>
        <span className="font-mono text-xs text-foreground">{label}</span>
        <span className="truncate font-mono text-xs text-muted-foreground">{error ?? (notice ? 'unavailable' : describe(value))}</span>
        <div className="ml-auto flex items-center gap-1">
          {dirty && onRestore && (
            <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={onRestore}>
              <RotateCcw data-icon="inline-start" />
              Sample
            </Button>
          )}
          {editable && (
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground"
              onClick={() => (editing ? setEditing(false) : startEditing())}
            >
              <Pencil data-icon="inline-start" />
              {editing ? 'Done' : 'Edit'}
            </Button>
          )}
          {onHide && (
            <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={onHide}>
              Hide
            </Button>
          )}
          {!editing && !notice && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              onClick={copy}
              aria-label={`Copy ${letter} as JSON`}
            >
              {copied ? <Check /> : <Copy />}
            </Button>
          )}
        </div>
      </header>
      {editing ? (
        <textarea
          value={text}
          onChange={(event) => updateText(event.target.value)}
          spellCheck={false}
          aria-label={`Edit ${letter} as JSON`}
          className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-5 outline-none"
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-3">
          {notice ? <p className="text-sm text-pretty text-destructive">{notice}</p> : <JsonView value={value} />}
        </div>
      )}
    </section>
  )
}
