import * as React from "react"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & {
  decorative?: boolean;
  orientation?: "horizontal" | "vertical";
}
>(({ className, decorative, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    role={decorative ? "none" : "separator"}
    aria-orientation={orientation}
    {...props}
  />
))
Separator.displayName = "Separator"

export { Separator }
