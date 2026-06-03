import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center brutal-border rounded-none text-sm font-bold uppercase tracking-wider whitespace-nowrap outline-none select-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 transition-transform active:translate-y-[4px] active:translate-x-[4px] active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-black brutal-shadow hover:bg-white hover:text-black",
        outline: "bg-white text-black brutal-shadow hover:bg-black hover:text-white",
        secondary: "bg-transparent text-black brutal-shadow hover:bg-black hover:text-white",
        ghost: "border-transparent bg-transparent hover:border-black hover:bg-muted",
        destructive: "bg-destructive text-white brutal-shadow hover:bg-white hover:text-destructive",
        link: "text-black underline-offset-4 hover:underline border-none shadow-none",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-lg",
        icon: "h-12 w-12",
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
