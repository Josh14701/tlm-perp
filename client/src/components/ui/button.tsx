import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-[transform,background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  " hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "border border-primary-border bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(15,23,42,0.18)]",
        destructive:
          "border border-destructive-border bg-destructive/95 text-destructive-foreground shadow-[0_14px_30px_rgba(239,68,68,0.22)]",
        outline:
          "border border-border bg-white text-foreground shadow-[0_8px_18px_rgba(148,163,184,0.12)] active:shadow-none dark:bg-card dark:text-foreground",
        secondary: "border border-secondary-border bg-secondary text-secondary-foreground shadow-[0_8px_18px_rgba(148,163,184,0.08)]",
        ghost: "border border-transparent bg-transparent hover:bg-muted dark:hover:bg-muted/70",
      },
      // Heights are set as "min" heights, because sometimes Ai will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-10 px-4 py-2.5",
        sm: "min-h-8 rounded-xl px-3 text-xs",
        lg: "min-h-11 rounded-2xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
