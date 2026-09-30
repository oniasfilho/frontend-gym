import { Separator } from 'react-resizable-panels'
import { cn } from '@/lib/utils'

export function Gutter({ className }: { className?: string }) {
  return (
    <Separator
      className={cn(
        'group relative flex shrink-0 items-center justify-center outline-none',
        'aria-[orientation=vertical]:w-3 aria-[orientation=vertical]:cursor-col-resize',
        'aria-[orientation=horizontal]:h-3 aria-[orientation=horizontal]:cursor-row-resize',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'rounded-full bg-transparent transition-colors',
          'group-hover:bg-border group-focus-visible:bg-ring group-data-[separator=active]:bg-ring',
          'group-aria-[orientation=vertical]:h-8 group-aria-[orientation=vertical]:w-1',
          'group-aria-[orientation=horizontal]:h-1 group-aria-[orientation=horizontal]:w-8',
        )}
      />
    </Separator>
  )
}
