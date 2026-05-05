import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  /**
   * When true, renders the input with destructive border + ring and sets
   * `aria-invalid`. The component also auto-detects `aria-invalid` from
   * surrounding shadcn `<FormControl>` so most forms don't need to set it.
   *
   * Pair with a `<p className="text-sm text-destructive">` (or `<FormMessage>`)
   * below the input for the message.
   */
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, "aria-invalid": ariaInvalid, ...props }, ref) => {
    const isInvalid = error || ariaInvalid === true || ariaInvalid === "true";
    return (
      <input
        type={type}
        aria-invalid={isInvalid || undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          isInvalid && "border-destructive focus-visible:ring-destructive",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
