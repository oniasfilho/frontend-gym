'use client'

import { useEffect, useState } from 'react'
import { THEME_NAMES, THEME_SWATCHES, type ThemeName } from '@/lib/themes'
import { cn } from '@/lib/utils'

export function ThemeSwatch({ theme, selected }: { theme: ThemeName; selected?: boolean }) {
  const { bg, accent } = THEME_SWATCHES[theme]
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-3.5 w-[26px] shrink-0 overflow-hidden rounded',
        selected ? 'shadow-[0_0_0_2px_var(--color-surface),0_0_0_3px_var(--color-text)]' : 'shadow-[0_0_0_1px_var(--color-neutral-700)]',
      )}
    >
      <span className="flex-1" style={{ background: bg }} />
      <span className="flex-1" style={{ background: accent }} />
    </span>
  )
}

export function ThemePicker({ theme, onPick }: { theme: ThemeName; onPick: (theme: ThemeName) => void }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        title="Theme"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-text/8"
      >
        <span className="size-2.5 rounded-full shadow-[0_0_0_1px_var(--color-neutral-700)]" style={{ background: THEME_SWATCHES[theme].accent }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />
          <div role="menu" aria-label="Theme" className="absolute top-9 right-0 z-41 flex w-[190px] flex-col gap-0.5 rounded-[10px] bg-surface p-1.5 shadow-(--shadow-md)">
            <span className="px-2 pt-1 pb-1.5 text-[11px] text-neutral-400">Theme</span>
            {THEME_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                role="menuitemradio"
                aria-checked={name === theme}
                onClick={() => {
                  onPick(name)
                  setOpen(false)
                }}
                className={cn('flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-text/7', name === theme && 'font-medium')}
              >
                <ThemeSwatch theme={name} selected={name === theme} />
                {name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
