'use client'

import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const subscribe = () => () => {}

export function useIsMac() {
  return useSyncExternalStore(
    subscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => true,
  )
}

export function Kbd({
  children,
  mod = false,
  shift = false,
  className,
}: {
  children: React.ReactNode
  mod?: boolean
  shift?: boolean
  className?: string
}) {
  const isMac = useIsMac()
  const parts = [mod && (isMac ? '⌘' : 'Ctrl'), shift && (isMac ? '⇧' : 'Shift'), children].filter(Boolean)
  return (
    <kbd
      className={cn(
        'inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground',
        className,
      )}
    >
      {parts.map((part, i) => (
        <span key={i}>{part}</span>
      ))}
    </kbd>
  )
}
