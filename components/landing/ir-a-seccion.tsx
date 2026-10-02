"use client";

import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Enlace que se desplaza dentro de la misma página.
 *
 * Se usa en vez de un ancla `#id` pelada para poder respetar
 * `prefers-reduced-motion`: con movimiento reducido el salto es inmediato.
 */
export function IrASeccion({
  objetivo,
  children,
  className,
}: {
  objetivo: string;
  children: ReactNode;
  className?: string;
}) {
  const reducido = useReducedMotion();

  return (
    <a
      href={`#${objetivo}`}
      className={className}
      onClick={(evento) => {
        const destino = document.getElementById(objetivo);
        if (!destino) return;
        evento.preventDefault();
        destino.scrollIntoView({
          behavior: reducido ? "auto" : "smooth",
          block: "start",
        });
        // Mueve el foco para que la navegación con teclado siga la vista.
        destino.setAttribute("tabindex", "-1");
        destino.focus({ preventScroll: true });
      }}
    >
      {children}
    </a>
  );
}
