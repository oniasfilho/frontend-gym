'use client'

import { useCallback, useEffect, useState } from 'react'
import { dayKey, type Activity } from '@/lib/activity'
import { isThemeName, type ThemeName } from '@/lib/themes'

// app/layout.tsx reads the theme from this key before first paint.
const STORAGE_KEY = 'reshape:progress:v1'

type Progress = {
  pathSlug: string
  index: number
  drafts: Record<string, string>
  solved: Record<string, string | true>
  lastActiveAt: number | null
  /** First solves per local day, keyed YYYY-MM-DD. */
  activity: Activity
  theme: ThemeName | null
}

const EMPTY: Progress = { pathSlug: 'for-of', index: 0, drafts: {}, solved: {}, lastActiveAt: null, activity: {}, theme: null }

function read(): Progress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Progress> & { solved?: Record<string, unknown>; activity?: Record<string, unknown> }
    const solved: Progress['solved'] = {}
    for (const [id, value] of Object.entries(parsed.solved ?? {})) {
      if (value === true) solved[id] = true
      else if (typeof value === 'string') solved[id] = value
    }
    const activity: Activity = {}
    for (const [day, count] of Object.entries(parsed.activity ?? {})) {
      if (typeof count === 'number' && count > 0) activity[day] = count
    }
    return {
      pathSlug: typeof parsed.pathSlug === 'string' ? parsed.pathSlug : EMPTY.pathSlug,
      index: typeof parsed.index === 'number' && Number.isInteger(parsed.index) ? parsed.index : 0,
      drafts: parsed.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {},
      solved,
      lastActiveAt: typeof parsed.lastActiveAt === 'number' ? parsed.lastActiveAt : null,
      activity,
      theme: isThemeName(parsed.theme) ? parsed.theme : null,
    }
  } catch {
    return EMPTY
  }
}

export function useProgress(total: number) {
  const [progress, setProgress] = useState<Progress>(EMPTY)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = read()
    setProgress({ ...stored, index: Math.min(Math.max(stored.index, 0), Math.max(total - 1, 0)) })
    setHydrated(true)
  }, [total])

  useEffect(() => {
    if (!hydrated) return
    const id = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    }, 250)
    return () => window.clearTimeout(id)
  }, [progress, hydrated])

  const setIndex = useCallback((index: number) => setProgress((p) => ({ ...p, index, lastActiveAt: Date.now() })), [])

  const selectPath = useCallback((pathSlug: string, index: number) => {
    setProgress((p) => ({ ...p, pathSlug, index, lastActiveAt: Date.now() }))
  }, [])

  const setDraft = useCallback((id: string, code: string) => {
    setProgress((p) => {
      if (p.solved[id] !== true) return { ...p, drafts: { ...p.drafts, [id]: code }, lastActiveAt: Date.now() }
      const solved = { ...p.solved }
      delete solved[id]
      return { ...p, solved, drafts: { ...p.drafts, [id]: code }, lastActiveAt: Date.now() }
    })
  }, [])

  const resetDraft = useCallback((id: string) => {
    setProgress((p) => {
      const drafts = { ...p.drafts }
      const solved = { ...p.solved }
      delete drafts[id]
      delete solved[id]
      return { ...p, drafts, solved }
    })
  }, [])

  // The theme is a preference, not progress, so it survives a reset.
  const resetAll = useCallback(() => setProgress((p) => ({ ...EMPTY, theme: p.theme })), [])

  const markSolved = useCallback((id: string, code: string) => {
    setProgress((p) => {
      if (p.solved[id] === code) return p
      // Only a first solve counts towards activity; re-solving after an edit does not.
      const today = dayKey(new Date())
      const activity = p.solved[id] === undefined ? { ...p.activity, [today]: (p.activity[today] ?? 0) + 1 } : p.activity
      return { ...p, solved: { ...p.solved, [id]: code }, activity, lastActiveAt: Date.now() }
    })
  }, [])

  const setTheme = useCallback((theme: ThemeName) => setProgress((p) => ({ ...p, theme })), [])

  const isSolved = useCallback(
    (id: string, code: string) => {
      const flag = progress.solved[id]
      return flag === true || flag === code
    },
    [progress.solved],
  )

  return { ...progress, hydrated, selectPath, setIndex, setDraft, resetDraft, resetAll, markSolved, setTheme, isSolved }
}
