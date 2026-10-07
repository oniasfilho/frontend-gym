'use client'

import { useEffect, type RefObject } from 'react'

const EASE = 'cubic-bezier(.2,.7,.2,1)'

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Fades the element up into place whenever `key` changes. */
export function useEnterAnimation(ref: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return
    ref.current.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE })
  }, [ref, key])
}

export function popIn(element: HTMLElement | null) {
  if (!element || prefersReducedMotion()) return
  element.animate([{ opacity: 0, transform: 'translateY(-6px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: EASE })
}

/** The output panel glow and primary button pulse that follow a first pass. */
export function celebrate(panel: HTMLElement | null, button: HTMLElement | null) {
  panel?.animate(
    [
      { boxShadow: '0 0 0 1px var(--color-accent), 0 0 32px color-mix(in srgb, var(--color-accent) 35%, transparent)' },
      { boxShadow: '0 0 0 1px transparent' },
    ],
    { duration: 1100, easing: 'ease-out' },
  )
  if (!button || prefersReducedMotion()) return
  button.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' })
}
