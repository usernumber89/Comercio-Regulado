import Link from "next/link";
import { ArrowRightIcon, ExternalLinkIcon, MapPinIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Insignia } from "@/components/ui/insignia";
import { obtenerCategoria } from "@/data/tiendas";

/** Tarjeta de un comercio dentro del directorio. */
export function TarjetaTienda({ tienda }: { tienda: import("@/types").Tienda }) {
  const categoria = obtenerCategoria(tienda.categoria);

  return (
    <article className="flex h-full flex-col rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 shadow-[var(--sombra-tenue)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-[var(--tinta-tenue)]">
            {tienda.codigo}
          </p>
          <h2 className="mt-1 truncate font-serif text-lg font-semibold text-[var(--tinta)] hover:text-[var(--bosque-tinta)]">
            <Link href={`/dashboard/${tienda.id}`}>
            {tienda.nombre}
            </Link>
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

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-[var(--tinta-tenue)]">
        <span className="min-w-0">Gestiona perfil, quejas, cumplimiento y beneficio.</span>
      </p>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--borde)] pt-4">
        <Button asChild size="sm">
          <Link href={`/dashboard/${tienda.id}`}>
            Abrir gestión
            <ArrowRightIcon aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="contorno" size="sm">
          <Link href={`/tiendas/${tienda.id}`}>
            Ficha pública
            <ExternalLinkIcon aria-hidden />
          </Link>
        </Button>
      </div>
    </article>
  );
}
