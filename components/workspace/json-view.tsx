'use client'

import { useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function KeyLabel({ name, quoted }: { name: string; quoted: boolean }) {
  if (!quoted) return <span className="text-muted-foreground">{name} </span>
  return (
    <>
      <span className="text-muted-foreground">"{name}"</span>
      <span className="text-muted-foreground/60">: </span>
    </>
  )
}

function Primitive({ value }: { value: unknown }) {
  if (typeof value === 'string') return <span>{JSON.stringify(value)}</span>
  if (value === null) return <span className="font-medium">null</span>
  return <span className="font-medium">{String(value)}</span>
}

function Collection({
  name,
  quoted,
  depth,
  openText,
  closeText,
  count,
  children,
}: {
  name?: string
  quoted?: boolean
  depth: number
  openText: string
  closeText: string
  count: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(depth < 2)
  const empty = count === 0

  return (
    <div>
      <div className="flex items-start gap-0.5">
        {!empty && (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? 'Collapse' : 'Expand'}
            onClick={() => setOpen((value) => !value)}
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className={cn('size-3 transition-transform', open && 'rotate-90')} />
          </button>
        )}
        <div className={cn(empty && 'pl-4')}>
          {name !== undefined && <KeyLabel name={name} quoted={Boolean(quoted)} />}
          {empty || !open ? (
            <span className="text-muted-foreground/60">{empty ? `${openText}${closeText}` : `${openText}${count}${closeText}`}</span>
          ) : (
            <span className="text-muted-foreground/60">{openText}</span>
          )}
        </div>
      </div>
      {open && !empty && (
        <>
          <div className="ml-4 border-l border-border pl-2">{children}</div>
          <div className="pl-4 text-muted-foreground/60">{closeText}</div>
        </>
      )}
    </div>
  )
}

function JsonNode({
  name,
  quoted,
  value,
  depth,
}: {
  name?: string
  quoted?: boolean
  value: unknown
  depth: number
}) {
  if (Array.isArray(value)) {
    return (
      <Collection name={name} quoted={quoted} depth={depth} openText="[" closeText="]" count={value.length}>
        {value.map((item, index) => (
          <JsonNode key={index} name={`[${index}]`} value={item} depth={depth + 1} />
        ))}
      </Collection>
    )
  }

  if (isRecord(value)) {
    const entries = Object.entries(value)
    return (
      <Collection name={name} quoted={quoted} depth={depth} openText="{" closeText="}" count={entries.length}>
        {entries.map(([key, item]) => (
          <JsonNode key={key} name={key} quoted value={item} depth={depth + 1} />
        ))}
      </Collection>
    )
  }

  return (
    <div className="pl-4">
      {name !== undefined && <KeyLabel name={name} quoted={Boolean(quoted)} />}
      <Primitive value={value} />
    </div>
  )
}

export function JsonView({ value, className }: { value: unknown; className?: string }) {
  return (
    <div className={cn('font-mono text-[13px] leading-5 break-all text-foreground', className)}>
      <JsonNode value={value} depth={0} />
    </div>
  )
}
