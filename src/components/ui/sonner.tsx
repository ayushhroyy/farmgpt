"use client";

import * as React from "react";
import * as SonnerPrimitive from "sonner";

type ToasterProps = React.ComponentPropsWithoutRef<
  typeof SonnerPrimitive.Toaster
>;

const Toaster = React.forwardRef<
  React.ElementRef<typeof SonnerPrimitive.Toaster>,
  ToasterProps
>(({ ...props }, ref) => {
  return (
    <SonnerPrimitive.Toaster
      ref={ref}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
});
Toaster.displayName = SonnerPrimitive.Toaster.displayName;

export { Toaster };
