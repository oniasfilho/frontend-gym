import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Nocturne buttons: an accent outline for the primary action, a divider outline for the rest.
const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent font-medium leading-[1.2] whitespace-nowrap text-text transition-colors select-none disabled:cursor-not-allowed disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'border-accent text-accent hover:bg-accent/12 active:bg-accent/22 disabled:hover:bg-transparent',
        secondary: 'border-divider hover:bg-text/7 active:bg-text/14 disabled:hover:bg-transparent',
        ghost: 'text-accent hover:bg-accent/10 active:bg-accent/18 disabled:hover:bg-transparent',
        quiet: 'text-neutral-400 hover:bg-text/7 hover:text-text disabled:hover:bg-transparent disabled:hover:text-neutral-400',
      },
      size: {
        default: 'px-2.5 py-[5.6px] text-sm',
        sm: 'gap-2 px-[9px] py-[5px] text-xs',
        xs: 'px-1.5 py-0.5 text-xs',
        lg: 'gap-2.5 px-[18px] py-2.5 text-[15px]',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'default' },
  },
)

function Button({ className, variant, size, ...props }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
