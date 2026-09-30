'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'reshape:progress:v1'

type View = 'exercise' | 'summary'

type Progress = {
  index: number
  drafts: Record<string, string>
  solved: Record<string, string | true>
  view: View
}

const EMPTY: Progress = { index: 0, drafts: {}, solved: {}, view: 'exercise' }

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
      index: typeof parsed.index === 'number' ? parsed.index : 0,
      drafts: parsed.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {},
      solved,
      view: parsed.view === 'summary' ? 'summary' : 'exercise',
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

  const setIndex = useCallback((index: number) => setProgress((p) => ({ ...p, index, view: 'exercise' })), [])

  const openSummary = useCallback(() => setProgress((p) => ({ ...p, view: 'summary' })), [])

  const setDraft = useCallback((id: string, code: string) => {
    setProgress((p) => {
      if (p.solved[id] !== true) return { ...p, drafts: { ...p.drafts, [id]: code } }
      const solved = { ...p.solved }
      delete solved[id]
      return { ...p, solved, drafts: { ...p.drafts, [id]: code } }
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
    setProgress((p) => (p.solved[id] === code ? p : { ...p, solved: { ...p.solved, [id]: code } }))
  }, [])

  const isSolved = useCallback(
    (id: string, code: string) => {
      const flag = progress.solved[id]
      return flag === true || flag === code
    },
    [progress.solved],
  )

  return { ...progress, hydrated, setIndex, openSummary, setDraft, resetDraft, resetAll, markSolved, isSolved }
}
