"use client";

import { AlertTriangleIcon, StarIcon } from "lucide-react";

import { Insignia } from "@/components/ui/insignia";
import { tiempoRelativo } from "@/lib/format";
import type { Opinion, Resena } from "@/types";
import { cn } from "@/lib/utils";

function Estrellas({ valor, grande = false }: { valor: number; grande?: boolean }) {
  const v = Math.round(Math.max(0, Math.min(5, valor)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${v} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          className={cn(
            grande ? "size-5" : "size-3.5",
            n <= v
              ? "fill-[var(--mostaza)] stroke-[var(--mostaza)]"
              : "fill-transparent stroke-[var(--borde-fuerte)]",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function ResumenOpinion({ opinion }: { opinion: Opinion }) {
  const { promedio, total, reparto } = opinion;

  if (total === 0) {
    return (
      <p className="text-sm text-[var(--tinta-tenue)]">
        Esta tienda todavía no tiene reseñas. La primera opinión puede ayudar a
        la comunidad.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
      <div>
        <div className="flex items-baseline gap-2">
          <p className="font-serif text-4xl font-semibold text-[var(--tinta)]">
            {promedio.toFixed(1)}
          </p>
          <Estrellas valor={promedio} grande />
        </div>
        <p className="mt-1 text-sm text-[var(--tinta-suave)]">
          {total} reseña{total === 1 ? "" : "s"}
        </p>
      </div>

      <ul className="flex min-w-[200px] flex-col gap-1.5">
        {reparto.map(({ estrellas, cantidad }) => {
          const porcentaje = total === 0 ? 0 : Math.round((cantidad / total) * 100);
          return (
            <li key={estrellas} className="flex items-center gap-2.5 text-xs">
              <span className="w-6 text-right text-[var(--tinta-suave)]">
                {estrellas}★
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--hundido)]">
                <div
                  className="h-full rounded-full bg-[var(--mostaza)]"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <span className="w-6 text-right text-[var(--tinta-tenue)]">
                {cantidad}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ListaResenas({ resenas }: { resenas: Resena[] }) {
  if (resenas.length === 0) return null;

  return (
    <ul className="flex flex-col gap-4">
      {resenas.map((r) => (
        <li
          key={r.id}
          className="rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Estrellas valor={r.estrellas} />
              {r.denuncia ? (
                <Insignia tono="terracota">
                  <AlertTriangleIcon aria-hidden className="size-3.5" />
                  Denuncia
                </Insignia>
              ) : null}
              {r.anonimo ? (
                <p className="text-xs text-[var(--tinta-tenue)]">Anónimo</p>
              ) : (
                <p className="text-sm font-medium text-[var(--tinta)]">
                  {r.autor}
                </p>
              )}
            </div>
            <p className="text-xs text-[var(--tinta-tenue)]">
              {tiempoRelativo(r.creadoEn)}
            </p>
          </div>

          {r.comentario ? (
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--tinta-suave)]">
              {r.comentario}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
