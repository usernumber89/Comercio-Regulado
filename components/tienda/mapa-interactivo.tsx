"use client";

import Link from "next/link";
import { divIcon } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";

import { obtenerCategoria } from "@/data/tiendas";
import type { CategoriaTienda, Tienda } from "@/types";

const CENTRO_RESIDENCIAL: [number, number] = [13.6428919, -89.2721176];
const LIMITES_RESIDENCIAL: [[number, number], [number, number]] = [
  [13.641563, -89.2727948],
  [13.6442571, -89.2713087],
];

const CENTRO_PORTALES_DEL_BOSQUE: [number, number] = [
  13.6418607,
  -89.2733509,
];

const PUNTOS_ILUSTRATIVOS: [number, number][] = [
  [13.64316, -89.27231],
  CENTRO_PORTALES_DEL_BOSQUE,
  [13.6426111, -89.2723889],
  [13.64296, -89.27243],
  [13.64293, -89.27219],
  [13.64291, -89.27187],
  [13.64287, -89.27164],
  [13.64273, -89.27249],
  [13.6427, -89.27225],
  [13.64268, -89.27198],
  [13.64265, -89.27171],
  [13.64249, -89.27243],
  [13.64247, -89.27217],
  [13.64244, -89.27191],
  [13.64228, -89.27236],
  [13.64227, -89.2721],
  [13.64225, -89.27184],
  [13.64208, -89.27228],
  [13.64206, -89.27202],
  [13.64204, -89.27176],
];

const COLORES: Record<CategoriaTienda, string> = {
  abarrotes: "#00788e",
  panaderia: "#b3492e",
  carniceria: "#9c3d24",
  fruteria: "#307748",
  lacteos: "#526276",
  ferreteria: "#a16207",
  farmacia: "#15803d",
  salon: "#7c3aed",
  otro: "#68788a",
};

function puntoIlustrativo(indice: number): [number, number] {
  if (indice < PUNTOS_ILUSTRATIVOS.length) {
    return PUNTOS_ILUSTRATIVOS[indice];
  }

  const extra = indice - PUNTOS_ILUSTRATIVOS.length;
  const angulo = extra * 2.399963229728653;
  const radio = 0.00012 + 0.00022 * Math.sqrt((extra % 24) / 23);
  return [
    13.64258 + Math.sin(angulo) * radio,
    -89.27205 + Math.cos(angulo) * radio * 1.4,
  ];
}

function iconoResidencial() {
  return divIcon({
    className: "icono-pin-residencial",
    html: `<svg width="34" height="42" viewBox="0 0 34 42" style="display:block;filter:drop-shadow(0 2px 3px rgba(21,37,63,.35))" aria-hidden="true">
      <path d="M17 1C8.2 1 1 8.2 1 17c0 11 16 24 16 24s16-13 16-24C33 8.2 25.8 1 17 1Z" fill="#15253f" stroke="white" stroke-width="2"/>
      <circle cx="17" cy="16" r="6" fill="white"/>
    </svg>`,
    iconSize: [34, 42],
    iconAnchor: [17, 38],
    popupAnchor: [0, -38],
  });
}

function iconoComercio(color: string, numero: number, ilustrativo: boolean) {
  const trazo = ilustrativo ? "#a16207" : "#ffffff";
  const guiones = ilustrativo ? 'stroke-dasharray="3 2"' : "";

  return divIcon({
    className: "icono-pin-comercio",
    html: `<svg width="36" height="44" viewBox="0 0 40 48" style="display:block;filter:drop-shadow(0 2px 3px rgba(21,37,63,.3))" role="img" aria-label="Comercio ${numero}">
      <path d="M20 2C10.1 2 2 10.1 2 20c0 12.4 18 26 18 26s18-13.6 18-26C38 10.1 29.9 2 20 2Z" fill="${color}" stroke="${trazo}" stroke-width="3" ${guiones}/>
      <circle cx="20" cy="19" r="11" fill="white" fill-opacity=".96"/>
      <text x="20" y="23" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${color}">${numero}</text>
    </svg>`,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -40],
  });
}

function coordenadasReales(tienda: Tienda): [number, number] | null {
  const coordenadas = tienda.ubicacion.coordenadas;
  if (
    !coordenadas ||
    !Number.isFinite(coordenadas.lat) ||
    !Number.isFinite(coordenadas.lng) ||
    coordenadas.lat < -90 ||
    coordenadas.lat > 90 ||
    coordenadas.lng < -180 ||
    coordenadas.lng > 180
  ) {
    return null;
  }

  return [coordenadas.lat, coordenadas.lng];
}

function AjustarVista({
  tiendas,
  ordenTiendas,
}: {
  tiendas: Tienda[];
  ordenTiendas: Tienda[];
}) {
  const mapa = useMap();

  useEffect(() => {
    const indices = new Map(ordenTiendas.map((tienda, indice) => [tienda.id, indice]));
    const puntos: [number, number][] = [
      CENTRO_RESIDENCIAL,
      ...tiendas.map((tienda): [number, number] => {
        return (
          coordenadasReales(tienda) ??
          puntoIlustrativo(indices.get(tienda.id) ?? 0)
        );
      }),
    ];

    if (tiendas.length === 0) {
      mapa.fitBounds(LIMITES_RESIDENCIAL, { padding: [24, 24] });
    } else if (puntos.length > 1) {
      mapa.fitBounds(puntos, { padding: [36, 36], maxZoom: 17 });
    }
  }, [mapa, tiendas, ordenTiendas]);

  return null;
}

export default function MapaInteractivo({
  tiendas,
  ordenTiendas,
  altura = 420,
}: {
  tiendas: Tienda[];
  ordenTiendas: Tienda[];
  altura?: number;
}) {
  const indices = new Map(ordenTiendas.map((tienda, indice) => [tienda.id, indice]));

  return (
    <div className="isolate w-full" style={{ height: altura }}>
      <MapContainer
        center={CENTRO_RESIDENCIAL}
        zoom={17}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AjustarVista tiendas={tiendas} ordenTiendas={ordenTiendas} />
        <Marker
          position={CENTRO_RESIDENCIAL}
          icon={iconoResidencial()}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            Puerta del Bálsamo Etapa 1 · referencia aproximada
          </Tooltip>
          <Popup>
            <div className="min-w-40">
              <p className="font-semibold">Puerta del Bálsamo Etapa 1</p>
              <p className="mt-1 text-sm">Nuevo Cuscatlán</p>
              <p className="mt-1 text-xs text-slate-600">
                Pin de referencia aproximada de la residencial; no representa
                una dirección ni un comercio específico.
              </p>
              <p className="mt-2 font-mono text-xs">
                13.6428919, -89.2721176
              </p>
            </div>
          </Popup>
        </Marker>
        {tiendas.map((tienda, posicion) => {
          const reales = coordenadasReales(tienda);
          const esIlustrativa = !reales;
          const indiceTienda = indices.get(tienda.id) ?? posicion;
          const coordenadas = reales ?? puntoIlustrativo(indiceTienda);
          const categoria = obtenerCategoria(tienda.categoria);
          return (
            <Marker
              key={tienda.id}
              position={coordenadas}
              icon={iconoComercio(
                COLORES[tienda.categoria],
                (indices.get(tienda.id) ?? posicion) + 1,
                esIlustrativa,
              )}
            >
              <Popup>
                <div className="min-w-40">
                  <p className="font-semibold">{tienda.nombre}</p>
                  <p className="mt-1 text-sm">{categoria.etiqueta}</p>
                  {esIlustrativa ? (
                    <p className="mt-1 text-xs font-semibold text-amber-800">
                      {indiceTienda === 2
                        ? "Punto indicado · aún no guardado en el perfil"
                        : indiceTienda === 1
                          ? "Ubicación ilustrativa · Portales del Bosque"
                          : "Ubicación ficticia ilustrativa"}
                    </p>
                  ) : null}
                  <p className="text-sm">
                    {tienda.ubicacion.pasaje}, {tienda.ubicacion.casa}
                  </p>
                  <Link
                    href={`/tiendas/${tienda.id}`}
                    className="mt-2 inline-block text-sm font-semibold text-[var(--mostaza-tinta)] underline"
                  >
                    Ver ficha pública
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
