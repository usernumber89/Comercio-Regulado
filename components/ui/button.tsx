import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Base shadcn/ui reestilada con la paleta del proyecto.
 *
 * Nota: shadcn no es una librería, son archivos que se copian al proyecto.
 * Estos conservan su API y su estructura (`cva`, `Slot`, `data-slot`) pero
 * los tokens por defecto se reemplazaron por las variables de
 * `app/globals.css`.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "font-sans font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bosque)]",
    "dark:focus-visible:outline-[var(--bosque-fuerte)]",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
    "active:translate-y-px",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bosque)] text-[var(--papel)] shadow-[var(--sombra-tenue)] hover:bg-[var(--bosque-fuerte)]",
        secundario:
          "border border-[var(--borde-fuerte)] bg-[var(--superficie)] text-[var(--tinta)] hover:border-[var(--bosque)] hover:bg-[var(--bosque-lavado)]",
        fantasma:
          "text-[var(--tinta-suave)] hover:bg-[var(--hundido)] hover:text-[var(--tinta)]",
        contorno:
          "border border-[var(--borde)] bg-transparent text-[var(--tinta)] hover:border-[var(--borde-fuerte)] hover:bg-[var(--superficie)]",
        atencion:
          "border border-[var(--terracota)] bg-[var(--terracota-lavado)] text-[var(--terracota-tinta)] hover:bg-[var(--terracota)] hover:text-[var(--papel)]",
        enlace: "h-auto p-0 text-[var(--bosque-tinta)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-sm px-3 text-[0.8125rem]",
        default: "h-10 px-4 text-sm",
        lg: "h-12 rounded-lg px-6 text-base",
        icono: "size-10",
        iconoSm: "size-8 rounded-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
