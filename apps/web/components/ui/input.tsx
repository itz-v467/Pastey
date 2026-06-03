import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-14 w-full min-w-0 rounded-none border-[3px] border-black bg-white px-4 py-2 text-lg font-sans transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 brutal-shadow",
        className
      )}
      {...props}
    />
  )
}

export { Input }
