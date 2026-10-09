"use client";

import dynamic from "next/dynamic";
import { MapPinIcon } from "lucide-react";

import { obtenerCategoria } from "@/data/tiendas";
import type { Tienda } from "@/types";

const MapaInteractivo = dynamic(
  () => import("@/components/tienda/mapa-interactivo"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[420px] place-items-center bg-[var(--hundido)] text-sm text-[var(--tinta-tenue)]">
        Cargando mapa…
      </div>
    ),
  },
);

export function MapaTiendas({
  tiendas,
  ordenTiendas,
}: {
  tiendas: Tienda[];
  ordenTiendas: Tienda[];
}) {
  const tieneCoordenadasReales = (tienda: Tienda) => {
    const coordenadas = tienda.ubicacion.coordenadas;
    return Boolean(
      coordenadas &&
        Number.isFinite(coordenadas.lat) &&
        Number.isFinite(coordenadas.lng) &&
        coordenadas.lat >= -90 &&
        coordenadas.lat <= 90 &&
        coordenadas.lng >= -180 &&
        coordenadas.lng <= 180,
    );
  };
  const cantidadIlustrativa = tiendas.filter(
    (tienda) => !tieneCoordenadasReales(tienda),
  ).length;
  const categoriasVisibles = [...new Set(tiendas.map((tienda) => tienda.categoria))];

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-[var(--borde)] bg-[var(--superficie)] shadow-[var(--sombra-media)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--borde)] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--mostaza-lavado)] text-[var(--mostaza-tinta)]">
            <MapPinIcon aria-hidden className="size-5" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-semibold text-[var(--tinta)]">
              Comercios en la residencial
            </h2>
            <p className="mt-0.5 text-sm text-[var(--tinta-suave)]">
              {tiendas.length} comercio{tiendas.length === 1 ? "" : "s"}
              {cantidadIlustrativa > 0
                ? ` · ${cantidadIlustrativa} punto${cantidadIlustrativa === 1 ? "" : "s"} de ejemplo`
                : ""}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-[var(--borde)] bg-[var(--hundido)] px-3 py-1.5 text-xs font-medium text-[var(--tinta-suave)]">
          Puerta del Bálsamo · Etapa 1
        </span>
      </div>

      <MapaInteractivo tiendas={tiendas} ordenTiendas={ordenTiendas} />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[var(--borde)] px-4 py-3 sm:px-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tinta-tenue)]">
          Rubros
        </span>
        {categoriasVisibles.map((categoria) => (
          <span
            key={categoria}
            className="inline-flex items-center gap-2 text-xs text-[var(--tinta-suave)]"
          >
            <span
              aria-hidden
              className="size-2.5 rounded-full ring-2 ring-white shadow-sm"
              style={{
                backgroundColor: {
                  abarrotes: "#00788e",
                  panaderia: "#b3492e",
                  carniceria: "#9c3d24",
                  fruteria: "#307748",
                  lacteos: "#526276",
                  ferreteria: "#a16207",
                  farmacia: "#15803d",
                  salon: "#7c3aed",
                  otro: "#68788a",
                }[categoria],
              }}
            />
            {obtenerCategoria(categoria).etiqueta}
          </span>
        ))}
        {cantidadIlustrativa > 0 ? (
          <span className="inline-flex items-center gap-2 text-xs text-[var(--tinta-suave)]">
            <span
              aria-hidden
              className="size-3 rounded-full border-2 border-dashed border-[var(--semaforo-amarillo)]"
            />
            Punto ilustrativo
          </span>
        ) : null}
      </div>

      {cantidadIlustrativa > 0 ? (
        <p className="border-t border-[var(--borde)] bg-[var(--hundido)] px-4 py-3 text-xs leading-relaxed text-[var(--tinta-suave)] sm:px-5">
          Los marcadores con borde discontinuo aún no están guardados en los
          perfiles. La mayoría son puntos ficticios distribuidos según el
          croquis; el comercio 3 usa la coordenada que compartiste. Confirma
          cualquier punto antes de tomarlo como ubicación exacta.
        </p>
      ) : null}
    </section>
  );
}
