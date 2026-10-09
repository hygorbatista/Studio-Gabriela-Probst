import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Ajustado ao design system: cantos retos, rótulo maiúsculo e altura mínima de 44px no painel.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline:
          "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-white",
        ghost: "text-foreground hover:bg-muted",
        destructive:
          "border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-white",
        link: "h-auto px-0 normal-case tracking-normal text-primary underline underline-offset-4 decoration-1 hover:text-primary-hover",
      },
      size: {
        default: "h-12 gap-2 px-6",
        sm: "h-11 gap-2 px-4",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
