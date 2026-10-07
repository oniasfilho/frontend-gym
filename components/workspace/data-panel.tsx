'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { describeValue, formatValue } from '@/lib/format-value'
import { cn } from '@/lib/utils'

const BODY = 'm-0 rounded-lg px-3.5 py-3 font-mono text-[13px] leading-[1.6] whitespace-pre-wrap break-words'

export function ValueBlock({
  label,
  value,
  expected = false,
  editable = false,
  dirty = false,
  notice,
  onValueChange,
  onRestore,
  onHide,
}: {
  label: string
  value: unknown
  expected?: boolean
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
    <section aria-label={label} className="reveal flex flex-col gap-1.5">
      <div className="flex min-h-6 items-center gap-2">
        <span className={cn('font-mono text-xs font-medium', expected && 'text-accent-300')}>{label}</span>
        <span className="truncate text-[11px] text-neutral-500">{error ?? (notice ? 'unavailable' : describeValue(value))}</span>
        <div className="ml-auto flex items-center gap-0.5">
          {dirty && onRestore && (
            <Button
              variant="quiet"
              size="xs"
              className="reveal-item"
              data-keep
              onClick={() => {
                setEditing(false)
                onRestore()
              }}
            >
              Restore sample
            </Button>
          )}
          {editable && (
            <Button variant="quiet" size="xs" className="reveal-item" data-keep={editing || undefined} onClick={() => (editing ? setEditing(false) : startEditing())}>
              {editing ? 'Done' : 'Edit'}
            </Button>
          )}
          {!editing && !notice && (
            <Button variant="quiet" size="xs" className="reveal-item" onClick={copy} aria-label={`Copy ${label} as JSON`}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
          {onHide && (
            <Button variant="quiet" size="xs" className="reveal-item" onClick={onHide}>
              Hide
            </Button>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          value={text}
          onChange={(event) => updateText(event.target.value)}
          spellCheck={false}
          autoFocus
          rows={Math.min(Math.max(text.split('\n').length, 3), 18)}
          aria-label={`Edit ${label} as JSON`}
          className={cn(BODY, 'resize-y bg-surface text-neutral-200 caret-accent shadow-[inset_0_0_0_1px_var(--color-neutral-800)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:outline-none')}
        />
      ) : (
        <pre
          className={cn(
            BODY,
            expected ? 'bg-accent-900 text-accent-100 shadow-[inset_0_0_0_1px_var(--color-accent-800)]' : 'bg-surface text-neutral-200',
            notice && 'font-sans text-sm text-neutral-300',
          )}
        >
          {notice ?? formatValue(value)}
        </pre>
      )}
    </section>
  )
}
