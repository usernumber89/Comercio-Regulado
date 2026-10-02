"use client";

import { motion } from "framer-motion";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TabId } from "@/types";

export const PESTANAS: { id: TabId; etiqueta: string }[] = [
  { id: "perfil", etiqueta: "Perfil" },
  { id: "quejas", etiqueta: "Quejas" },
  { id: "cumplimiento", etiqueta: "Cumplimiento" },
  { id: "beneficio", etiqueta: "Beneficio" },
];

/**
 * Lista de pestañas con indicador deslizante.
 *
 * El indicador usa `layoutId`, así que viaja de un disparador a otro en vez de
 * reaparecer: la pestaña activa siempre se siente conectada a la anterior.
 * Radix aporta la navegación con flechas y el patrón ARIA de tabs.
 */
export function PestanasLista({ valor }: { valor: TabId }) {
  return (
    <TabsList>
      {PESTANAS.map((pestana) => {
        const activa = valor === pestana.id;
        return (
          <TabsTrigger key={pestana.id} value={pestana.id}>
            {activa ? (
              <motion.span
                layoutId="pestana-activa"
                aria-hidden
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-[var(--bosque)]"
                transition={{ type: "spring", stiffness: 460, damping: 36 }}
              />
            ) : null}
            <span className="relative">{pestana.etiqueta}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

/** Contenedor con el margen que deja respirar al contenido de la pestaña. */
export function ContenedorPestana({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn("min-w-0")}
    >
      {children}
    </motion.div>
  );
}
