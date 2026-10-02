import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Insignia de estado. No es un "eyebrow": tiene fondo lavado y borde del
 * mismo tono para leerse como etiqueta de estado, no como título.
 */
const insigniaVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tono: {
        neutro: "border-[var(--borde-fuerte)] bg-[var(--hundido)] text-[var(--tinta-suave)]",
        bosque:
          "border-[color-mix(in_oklab,var(--bosque)_35%,transparent)] bg-[var(--bosque-lavado)] text-[var(--bosque-tinta)]",
        mostaza:
          "border-[color-mix(in_oklab,var(--mostaza)_40%,transparent)] bg-[var(--mostaza-lavado)] text-[var(--mostaza-tinta)]",
        terracota:
          "border-[color-mix(in_oklab,var(--terracota)_38%,transparent)] bg-[var(--terracota-lavado)] text-[var(--terracota-tinta)]",
        verde:
          "border-[color-mix(in_oklab,var(--verde)_35%,transparent)] bg-[var(--verde-lavado)] text-[var(--verde-tinta)]",
      },
    },
    defaultVariants: { tono: "neutro" },
  },
);

function Insignia({
  className,
  tono,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof insigniaVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="insignia"
      className={cn(insigniaVariants({ tono }), className)}
      {...props}
    />
  );
}

export { Insignia, insigniaVariants };
