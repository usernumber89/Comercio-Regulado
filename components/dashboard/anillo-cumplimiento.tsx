"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import { cn } from "@/lib/utils";

interface AnilloProps {
  /** 0 a 100. */
  valor: number;
  color: string;
  tamano?: number;
  grosor?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Anillo de progreso en SVG.
 *
 * El trazo se dibuja animando `strokeDashoffset` desde el círculo completo
 * hasta la fracción que corresponde al puntaje. El SVG lleva `role="img"` con
 * una etiqueta, porque el porcentaje también va en texto visible y así ambos
 * canales dicen lo mismo.
 */
export function Anillo({
  valor,
  color,
  tamano = 208,
  grosor = 14,
  className,
  children,
}: AnilloProps) {
  const reducido = useReducedMotion();
  const gradienteId = useId();

  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const fraccion = Math.min(100, Math.max(0, valor)) / 100;
  const desfase = circunferencia * (1 - fraccion);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: tamano, height: tamano }}
    >
      <svg
        width={tamano}
        height={tamano}
        viewBox={`0 0 ${tamano} ${tamano}`}
        role="img"
        aria-label={`Puntaje de cumplimiento: ${Math.round(valor)} de 100`}
        // Gira para que el trazo empiece arriba y avance en sentido horario.
        style={{ transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id={gradienteId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.72" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>

        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke="var(--hundido)"
          strokeWidth={grosor}
        />

        <motion.circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke={`url(#${gradienteId})`}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          initial={{ strokeDashoffset: circunferencia }}
          animate={{ strokeDashoffset: desfase }}
          transition={
            reducido
              ? { duration: 0 }
              : { duration: 1.1, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
