'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, Check, Command, CornerDownLeft, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kbd } from './kbd'

export function LearningConstraints({ focus, support }: { focus: string; support: string[] }) {
  const [open, setOpen] = useState(false)
  return <div className="relative"><Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setOpen((value) => !value)} aria-expanded={open}><BookOpen data-icon="inline-start" />Constraints</Button>{open && <div className="absolute right-0 top-8 z-30 w-80 rounded-lg border bg-popover p-3 shadow-lg"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-xs font-medium">Learning constraints</span><button type="button" onClick={() => setOpen(false)} aria-label="Close constraints"><X className="text-muted-foreground" /></button></div><dl className="flex flex-col gap-3 text-sm"><div><dt className="font-mono text-[11px] uppercase text-muted-foreground">Focus</dt><dd className="mt-1"><Badge variant="outline" className="font-mono">{focus}()</Badge></dd></div><div><dt className="font-mono text-[11px] uppercase text-muted-foreground">Expected approach</dt><dd className="mt-1 text-muted-foreground">Use {focus}() as the primary transformation mechanism.</dd></div><div><dt className="font-mono text-[11px] uppercase text-muted-foreground">Allowed support</dt><dd className="mt-1 font-mono text-xs text-muted-foreground">property access · boolean expressions · {support.join(' · ')}</dd></div><div><dt className="font-mono text-[11px] uppercase text-muted-foreground">Avoid here</dt><dd className="mt-1 font-mono text-xs text-warning">reduce() · Object.entries() · Object.fromEntries()</dd></div></dl></div>}</div>
}

export type CommandAction = { label: string; group: string; shortcut?: React.ReactNode; action: () => void }

export function CommandPalette({ open, onOpenChange, actions }: { open: boolean; onOpenChange: (open: boolean) => void; actions: CommandAction[] }) {
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) window.setTimeout(() => input.current?.focus(), 0); else setQuery('') }, [open])
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); onOpenChange(!open) } if (event.key === 'Escape') onOpenChange(false) }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [onOpenChange, open])
  if (!open) return null
  const filtered = actions.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
  return <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) onOpenChange(false) }}><section role="dialog" aria-modal="true" aria-label="Command palette" className="w-full max-w-xl overflow-hidden rounded-lg border bg-popover shadow-2xl"><div className="flex h-12 items-center gap-2 border-b px-3"><Search className="text-muted-foreground" aria-hidden="true" /><input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a command…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><Kbd>esc</Kbd></div><ul className="max-h-80 overflow-auto p-1.5">{filtered.map((item, index) => <li key={`${item.group}-${item.label}`}><button type="button" className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none" onClick={() => { item.action(); onOpenChange(false) }}><Command className="text-muted-foreground" aria-hidden="true" /><span className="flex-1">{item.label}</span><span className="font-mono text-[10px] uppercase text-muted-foreground">{item.group}</span>{item.shortcut}</button></li>)}{filtered.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">No matching commands.</li>}</ul><footer className="flex items-center gap-2 border-t px-3 py-2 font-mono text-[10px] text-muted-foreground"><CornerDownLeft aria-hidden="true" /> select <Check aria-hidden="true" /> execute</footer></section></div>
}
