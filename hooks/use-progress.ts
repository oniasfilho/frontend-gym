'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'reshape:progress:v1'

type View = 'exercise' | 'summary'

type Progress = {
  pathSlug: string
  index: number
  drafts: Record<string, string>
  solved: Record<string, string | true>
  view: View
  lastActiveAt: number | null
}

const EMPTY: Progress = { pathSlug: 'for-of', index: 0, drafts: {}, solved: {}, view: 'exercise', lastActiveAt: null }

function read(): Progress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Progress> & { solved?: Record<string, unknown> }
    const solved: Progress['solved'] = {}
    for (const [id, value] of Object.entries(parsed.solved ?? {})) {
      if (value === true) solved[id] = true
      else if (typeof value === 'string') solved[id] = value
    }
    return {
      pathSlug: typeof parsed.pathSlug === 'string' ? parsed.pathSlug : EMPTY.pathSlug,
      index: typeof parsed.index === 'number' && Number.isInteger(parsed.index) ? parsed.index : 0,
      drafts: parsed.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {},
      solved,
      view: parsed.view === 'summary' ? 'summary' : 'exercise',
      lastActiveAt: typeof parsed.lastActiveAt === 'number' ? parsed.lastActiveAt : null,
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

  const setIndex = useCallback((index: number) => setProgress((p) => ({ ...p, index, view: 'exercise', lastActiveAt: Date.now() })), [])

  const selectPath = useCallback((pathSlug: string, index: number) => {
    setProgress((p) => ({ ...p, pathSlug, index, view: 'exercise', lastActiveAt: Date.now() }))
  }, [])

  const openSummary = useCallback(() => setProgress((p) => ({ ...p, view: 'summary' })), [])

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

  const resetAll = useCallback(() => setProgress(EMPTY), [])

  const markSolved = useCallback((id: string, code: string) => {
    setProgress((p) => (p.solved[id] === code ? p : { ...p, solved: { ...p.solved, [id]: code }, lastActiveAt: Date.now() }))
  }, [])

  const isSolved = useCallback(
    (id: string, code: string) => {
      const flag = progress.solved[id]
      return flag === true || flag === code
    },
    [progress.solved],
  )

  return { ...progress, hydrated, selectPath, setIndex, openSummary, setDraft, resetDraft, resetAll, markSolved, isSolved }
}
