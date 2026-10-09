"use client";

import dynamic from "next/dynamic";
import { MapPinIcon } from "lucide-react";

import type { Tienda } from "@/types";

const MapaInteractivo = dynamic(
  () => import("@/components/tienda/mapa-interactivo"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[280px] place-items-center bg-[var(--hundido)] text-sm text-[var(--tinta-tenue)]">
        Cargando mapa…
      </div>
    ),
  },
);

export function MapaUbicacionTienda({
  tienda,
  tiendas,
}: {
  tienda: Tienda;
  tiendas: Tienda[];
}) {
  const coordenadas = tienda.ubicacion.coordenadas;
  const tieneUbicacionReal = Boolean(
    coordenadas &&
      Number.isFinite(coordenadas.lat) &&
      Number.isFinite(coordenadas.lng) &&
      coordenadas.lat >= -90 &&
      coordenadas.lat <= 90 &&
      coordenadas.lng >= -180 &&
      coordenadas.lng <= 180,
  );

  return (
    <section
      aria-labelledby="ubicacion-comercio"
      className="mt-8 overflow-hidden rounded-xl border border-[var(--borde)] bg-[var(--superficie)] shadow-[var(--sombra-tenue)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--mostaza-lavado)] text-[var(--mostaza-tinta)]">
            <MapPinIcon aria-hidden className="size-5" />
          </span>
          <div>
            <h2
              id="ubicacion-comercio"
              className="font-serif text-lg font-semibold text-[var(--tinta)]"
            >
              Ubicación del comercio
            </h2>
            <p className="mt-0.5 text-sm text-[var(--tinta-suave)]">
              {tienda.ubicacion.pasaje}, {tienda.ubicacion.casa}
            </p>
          </div>
        </div>
        {!tieneUbicacionReal ? (
          <span className="rounded-full border border-[var(--semaforo-amarillo)]/40 bg-[var(--semaforo-amarillo-fondo)] px-3 py-1.5 text-xs font-medium text-[var(--semaforo-amarillo)]">
            Punto ilustrativo
          </span>
        ) : null}
      </div>

      <MapaInteractivo
        tiendas={[tienda]}
        ordenTiendas={tiendas}
        altura={280}
      />

      {!tieneUbicacionReal ? (
        <p className="border-t border-[var(--borde)] bg-[var(--hundido)] px-4 py-3 text-xs leading-relaxed text-[var(--tinta-suave)] sm:px-5">
          Esta ubicación es ficticia y se muestra como ejemplo basado en el
          croquis de la residencial. No es un punto verificado; consulta con la
          administración para confirmar la dirección exacta.
        </p>
      ) : null}
    </section>
  );
}
