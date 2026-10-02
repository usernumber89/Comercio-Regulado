import Link from "next/link";
import { MapPinIcon, StarIcon } from "lucide-react";

import { Insignia } from "@/components/ui/insignia";
import { obtenerCategoria } from "@/data/tiendas";

/** Tarjeta de un comercio dentro del directorio. */
export function TarjetaTienda({ tienda }: { tienda: import("@/types").Tienda }) {
  const categoria = obtenerCategoria(tienda.categoria);

  return (
    <Link
      href={`/tiendas/${tienda.id}`}
      className="block h-full rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 transition-colors hover:border-[var(--bosque)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-[var(--tinta-tenue)]">
            {tienda.codigo}
          </p>
          <h2 className="mt-1 truncate font-serif text-lg font-semibold text-[var(--tinta)]">
            {tienda.nombre}
          </h2>
        </div>
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--borde-fuerte)] font-serif text-sm font-semibold text-[var(--bosque-tinta)]"
          aria-hidden
        >
          {tienda.iniciales}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Insignia tono="neutro">{categoria.etiqueta}</Insignia>
        <span className="font-mono text-xs text-[var(--tinta-tenue)]">
          {tienda.horarioAutorizado}
        </span>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-sm text-[var(--tinta-suave)]">
        <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--tinta-tenue)]" />
        <span className="truncate">
          {tienda.ubicacion.pasaje}, {tienda.ubicacion.casa}
        </span>
      </p>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--tinta-tenue)]">
        <StarIcon aria-hidden className="size-4" />
        Ver ficha, reseñas y denuncias
      </p>
    </Link>
  );
}
