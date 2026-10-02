"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { formatearMoneda, formatearNumero } from "@/lib/format";
import { useInViewOnce } from "@/lib/use-in-view";
import { cn } from "@/lib/utils";

/**
 * Presentaciones disponibles.
 *
 * Es un identificador y no una función a propósito: `Contador` es un Client
 * Component y los Server Components no pueden pasarle callbacks por props. Un
 * string sí cruza la frontera de RSC sin problema.
 */
const FORMATOS = {
  numero: (v: number) => formatearNumero(Math.round(v)),
  moneda: (v: number) => formatearMoneda(v),
  minutos: (v: number) => `${formatearNumero(Math.round(v))} min`,
  horas: (v: number) => `${formatearNumero(Math.round(v))} h`,
} as const;

type FormatoContador = keyof typeof FORMATOS;

interface ContadorProps {
  /** Valor final al que se cuenta. */
  valor: number;
  /** Presentación. Si se pasa, ignora prefijo, sufijo y decimales. */
  formato?: FormatoContador;
  duracionMs?: number;
  /**
   * Espera a que el bloque entre en pantalla para arrancar. Se desactiva en
   * cifras que reaccionan a un control, donde el cambio debe ser inmediato.
   */
  animarAlEntrar?: boolean;
  className?: string;
}

/**
 * Cifra que cuenta desde cero hasta su valor.
 *
 * La primera animación arranca con un IntersectionObserver: si la cifra está
 * fuera de pantalla no se cuenta, y al desplazarse hasta ella sube sola.
 * Los cambios posteriores de `valor` se animan de inmediato, que es lo que
 * necesita el control de meses del tab Beneficio.
 *
 * Con `prefers-reduced-motion` la cifra aparece fija en su valor final.
 */
export function Contador({
  valor,
  formato,
  duracionMs = 1600,
  animarAlEntrar = true,
  className,
}: ContadorProps) {
  const { ref, visible } = useInViewOnce<HTMLSpanElement>();
  const [mostrado, setMostrado] = useState(0);
  const actualRef = useRef(0);
  const arranqueRef = useRef(false);
  const reducido = useReducedMotion();

  const habilitado = animarAlEntrar ? visible : true;

  useEffect(() => {
    if (!habilitado) return;

    if (reducido) {
      actualRef.current = valor;
      arranqueRef.current = true;
      // Diferido un turno: escribir estado sincrónicamente dentro del efecto
      // provocaría un segundo render en cascada en cada cambio de `valor`.
      const id = setTimeout(() => setMostrado(valor), 0);
      return () => clearTimeout(id);
    }

    const desde = arranqueRef.current ? actualRef.current : 0;
    const distancia = Math.abs(valor - desde);
    // Tras el primer conteo los cambios son cortos, para que mover el
    // control de meses se sienta como una respuesta y no como una carga.
    const duracion = arranqueRef.current ? Math.min(duracionMs, 650) : duracionMs;

    const controles = animate(desde, valor, {
      duration: distancia < 0.05 ? 0 : duracion / 1000,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        actualRef.current = v;
        setMostrado(v);
      },
    });

    arranqueRef.current = true;
    return () => controles.stop();
  }, [habilitado, valor, duracionMs, reducido]);

  const texto = FORMATOS[formato ?? "numero"](mostrado);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {texto}
    </span>
  );
}
