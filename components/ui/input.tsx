import * as React from "react";

import { cn } from "@/lib/utils";

const campoBase = [
  "w-full rounded-md border border-[var(--borde-fuerte)] bg-[var(--superficie)]",
  "px-3 py-2.5 text-sm text-[var(--tinta)] placeholder:text-[var(--tinta-tenue)]",
  "transition-colors hover:border-[var(--borde-fuerte)]",
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--bosque)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(campoBase, "h-10", className)}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(campoBase, "min-h-24 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export { Input, Textarea };
