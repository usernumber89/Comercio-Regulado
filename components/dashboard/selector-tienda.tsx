"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

import { calcularCumplimiento } from "@/lib/cumplimiento";
import { cn } from "@/lib/utils";
import { useCatalogoTiendas, usePanel } from "@/store/use-panel";

/**
 * Selector de tienda.
 *
 * Implementa el patrón de radiogroup: un solo elemento del grupo es
 * seleccionable y las flechas del teclado lo recorren, que es lo que espera
 * la especificación ARIA para un grupo de opciones exclusivas. Elegir una
 * tienda cambia el estado global, así que las cuatro pestañas se actualizan a
 * la vez sin recargar la página.
 */
export function SelectorTienda() {
  const tiendaId = usePanel((estado) => estado.tiendaId);
  const reportes = usePanel((estado) => estado.reportes);
  const setTienda = usePanel((estado) => estado.setTienda);
  const tiendas = useCatalogoTiendas();

  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  function manejarTeclado(evento: React.KeyboardEvent<HTMLDivElement>) {
    const direccion =
      evento.key === "ArrowRight" || evento.key === "ArrowDown"
        ? 1
        : evento.key === "ArrowLeft" || evento.key === "ArrowUp"
          ? -1
          : 0;

    if (direccion === 0) return;
    evento.preventDefault();

    const actual = tiendas.findIndex((t) => t.id === tiendaId);
    const siguiente = (actual + direccion + tiendas.length) % tiendas.length;
    setTienda(tiendas[siguiente].id);
    botones.current[siguiente]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tienda seleccionada"
      onKeyDown={manejarTeclado}
      className="grid gap-2 sm:grid-cols-2"
    >
      {tiendas.map((tienda, indice) => {
        const activa = tienda.id === tiendaId;
        const cumplimiento = calcularCumplimiento(reportes, tienda.id);

        return (
          <button
            key={tienda.id}
            ref={(nodo) => {
              botones.current[indice] = nodo;
            }}
            type="button"
            role="radio"
            aria-checked={activa}
            tabIndex={activa ? 0 : -1}
            onClick={() => setTienda(tienda.id)}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              activa
                ? "border-[var(--bosque)] bg-[var(--bosque-lavado)]"
                : "border-[var(--borde)] bg-[var(--superficie)] hover:border-[var(--borde-fuerte)]",
            )}
          >
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-md font-mono text-sm font-semibold transition-colors",
                activa
                  ? "bg-[var(--bosque)] text-[var(--papel)]"
                  : "bg-[var(--hundido)] text-[var(--tinta-suave)] group-hover:text-[var(--tinta)]",
              )}
              aria-hidden
            >
              {tienda.iniciales}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[var(--tinta)]">
                {tienda.nombre}
              </span>
              <span className="block truncate text-xs text-[var(--tinta-tenue)]">
                {tienda.ubicacion.pasaje} · {tienda.ubicacion.casa}
              </span>
            </span>

            <span className="flex shrink-0 flex-col items-end gap-1">
              <span
                className="flex items-center gap-1.5 font-mono text-xs text-[var(--tinta-suave)]"
                title={`Puntaje de cumplimiento: ${cumplimiento.puntaje}`}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: cumplimiento.color }}
                  aria-hidden
                />
                {cumplimiento.puntaje}
              </span>
              <span className="font-mono text-[0.6875rem] text-[var(--tinta-tenue)]">
                {cumplimiento.activos} activo
                {cumplimiento.activos === 1 ? "" : "s"}
              </span>
            </span>

            {activa ? (
              <motion.span
                layoutId="tienda-activa"
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-[var(--bosque)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
