"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Marca como visible el primer elemento que intersecta el viewport.
 *
 * Envuelve un `IntersectionObserver` real (no una animación temporizada) para
 * disparar los contadores de la portada solo cuando el bloque entra en
 * pantalla, que es lo que pide el caso.
 */
export function useInViewOnce<T extends Element>(
  opciones: IntersectionObserverInit & { margen?: string } = {},
) {
  const { margen = "0px 0px -15% 0px", threshold = 0.25, ...resto } = opciones;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || visible) return;

    // Sin soporte para IntersectionObserver no hay nada que observar: se
    // muestra de inmediato. El `setState` va diferido un turno para no
    // encadenar un render extra dentro del propio efecto.
    if (typeof IntersectionObserver === "undefined") {
      const id = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(id);
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setVisible(true);
            observador.disconnect();
            return;
          }
        }
      },
      { root: resto.root ?? null, rootMargin: margen, threshold },
    );

    observador.observe(elemento);
    return () => observador.disconnect();
  }, [visible, margen, threshold, resto.root]);

  return { ref, visible };
}
