"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useHidratado } from "@/lib/use-hidratado";

/**
 * Interruptor de tema claro/oscuro.
 *
 * El icono solo cambia después de hidratar: antes de eso el servidor no puede
 * saber qué tema eligió el visitante, y adivinarlo provocaría una
 * discrepancia de hidratación. La etiqueta accesible es fija y describe la
 * acción, no el estado, así que nunca miente.
 */
export function InterruptorTema({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hidratado = useHidratado();

  const oscuro = hidratado && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="fantasma"
      size="iconoSm"
      className={className}
      aria-label="Cambiar entre tema claro y oscuro"
      onClick={() => setTheme(oscuro ? "light" : "dark")}
    >
      {oscuro ? <MoonIcon aria-hidden /> : <SunIcon aria-hidden />}
    </Button>
  );
}
