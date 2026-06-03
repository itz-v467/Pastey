import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[120px] w-full rounded-none border-[3px] border-black bg-white px-4 py-4 text-lg font-sans transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 brutal-shadow resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
