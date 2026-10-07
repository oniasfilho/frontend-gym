'use client'

import type { ReactNode, Ref } from 'react'
import { Group, Panel, Separator, useDefaultLayout, type LayoutStorage } from 'react-resizable-panels'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

// Remembering the split is a convenience; the layout works without storage.
const storage: LayoutStorage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {}
  },
}

// Shadows (the editor ring, the pass glow) must not be clipped by the panel.
const UNCLIPPED = { overflow: 'visible' } as const

/**
 * The exercise beside the editor and output, with draggable dividers between them.
 * Below two-column width everything stacks and the page scrolls.
 * Mount only on the client: the saved layout is read from localStorage.
 */
export function PracticeLayout({ stageRef, exercise, editor, output }: { stageRef: Ref<HTMLElement>; exercise: ReactNode; editor: ReactNode; output: ReactNode }) {
  const split = useMediaQuery('(min-width: 728px)')
  const columns = useDefaultLayout({ id: 'practice-columns', storage })
  const rows = useDefaultLayout({ id: 'practice-rows', storage })

  if (!split) {
    return (
      <main ref={stageRef} className="flex min-h-0 flex-col gap-4 overflow-auto p-4">
        {exercise}
        <section aria-label="Solution" className="flex min-h-[420px] flex-col gap-3">
          <div className="flex min-h-[200px] flex-1 flex-col">{editor}</div>
          <div className="flex h-[38%] min-h-[170px] flex-none flex-col">{output}</div>
        </section>
      </main>
    )
  }

  return (
    <main ref={stageRef} className="min-h-0 p-4">
      <Group orientation="horizontal" id="practice-columns" defaultLayout={columns.defaultLayout} onLayoutChanged={columns.onLayoutChanged} className="h-full">
        <Panel id="exercise" defaultSize="50" minSize={260} className="flex flex-col">
          {exercise}
        </Panel>
        <ResizeHandle />
        <Panel id="solution" minSize={360} style={UNCLIPPED} className="flex flex-col">
          <section aria-label="Solution" className="flex min-h-0 flex-1 flex-col">
            <Group orientation="vertical" id="practice-rows" defaultLayout={rows.defaultLayout} onLayoutChanged={rows.onLayoutChanged} className="min-h-0 flex-1">
              <Panel id="editor" defaultSize="62" minSize={140} style={UNCLIPPED} className="flex flex-col">
                {editor}
              </Panel>
              <ResizeHandle />
              <Panel id="output" minSize={120} style={UNCLIPPED} className="flex flex-col">
                {output}
              </Panel>
            </Group>
          </section>
        </Panel>
      </Group>
    </main>
  )
}

function ResizeHandle({ className }: { className?: string }) {
  return (
    <Separator
      className={cn(
        'group relative flex shrink-0 items-center justify-center outline-none',
        'aria-[orientation=vertical]:w-4 aria-[orientation=vertical]:cursor-col-resize',
        'aria-[orientation=horizontal]:h-3 aria-[orientation=horizontal]:cursor-row-resize',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'rounded-full bg-neutral-800 transition-colors',
          'group-hover:bg-neutral-600 group-focus-visible:bg-accent group-data-[separator=active]:bg-accent',
          'group-aria-[orientation=vertical]:h-8 group-aria-[orientation=vertical]:w-1',
          'group-aria-[orientation=horizontal]:h-1 group-aria-[orientation=horizontal]:w-8',
        )}
      />
    </Separator>
  )
}
