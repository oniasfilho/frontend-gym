'use client'

import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const subscribe = () => () => {}

function detectMac() {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return /mac|iphone|ipad/i.test(nav.userAgentData?.platform || nav.platform || nav.userAgent)
}

export function useIsMac() {
  return useSyncExternalStore(subscribe, detectMac, () => true)
}

const MAC_KEYS = { k: '⌘K', enter: '⌘↵', dot: '⌘.', alt: '⌥← ⌥→' }
const OTHER_KEYS = { k: 'Ctrl K', enter: 'Ctrl ↵', dot: 'Ctrl .', alt: 'Alt ← Alt →' }

/** Shortcut labels in the platform's own form. */
export function useKeys() {
  return useIsMac() ? MAC_KEYS : OTHER_KEYS
}

export function Shortcut({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[11px] text-neutral-400', className)}>{children}</span>
}
