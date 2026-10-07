import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Nocturne tags.
const badgeVariants = cva('inline-flex w-fit shrink-0 items-center gap-1 rounded-md tracking-[0.02em] whitespace-nowrap', {
  variants: {
    variant: {
      accent: 'bg-accent-800 text-accent-100',
      neutral: 'bg-neutral-800 text-neutral-100',
    },
    size: {
      default: 'px-2.5 py-[3px] text-[11px]',
      sm: 'px-1.5 py-px text-[10px]',
    },
  },
  defaultVariants: { variant: 'accent', size: 'default' },
})

function Badge({ className, variant, size, render, ...props }: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>({ className: cn(badgeVariants({ variant, size }), className) }, props),
    render,
    state: { slot: 'badge', variant },
  })
}

export { Badge, badgeVariants }
