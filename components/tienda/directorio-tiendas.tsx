"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TarjetaTienda } from "@/components/tienda/tarjeta-tienda";
import { CATEGORIAS } from "@/data/tiendas";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tienda } from "@/types";

const TODAS = "todas";

/**
 * Directorio de comercios con buscador.
 *
 * El filtro corre en el navegador: el directorio no cambia seguido y son pocas
 * tarjetas, así que un viaje a la base por cada tecla sería absurdo.
 */
export function DirectorioTiendas({ tiendas }: { tiendas: Tienda[] }) {
  const [consulta, setConsulta] = useState("");
  const [categoria, setCategoria] = useState(TODAS);

  const visibles = useMemo(() => {
    const texto = consulta.trim().toLowerCase();

    return tiendas.filter((tienda) => {
      if (categoria !== TODAS && tienda.categoria !== categoria) return false;
      if (!texto) return true;

      return (
        tienda.nombre.toLowerCase().includes(texto) ||
        tienda.dueno.toLowerCase().includes(texto) ||
        tienda.codigo.toLowerCase().includes(texto) ||
        tienda.ubicacion.pasaje.toLowerCase().includes(texto) ||
        tienda.ubicacion.casa.toLowerCase().includes(texto)
      );
    });
  }, [tiendas, consulta, categoria]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--tinta-tenue)]"
          />
          <Input
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
            placeholder="Buscar por nombre, código o ubicación"
            aria-label="Buscar un comercio"
            className="pl-9"
          />
        </div>

        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger aria-label="Filtrar por rubro" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todos los rubros</SelectItem>
            {CATEGORIAS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 font-mono text-xs text-[var(--tinta-tenue)]" role="status">
        {visibles.length} resultado{visibles.length === 1 ? "" : "s"}
      </p>

      {tiendas.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-[var(--borde-fuerte)] px-4 py-10 text-center">
          <p className="text-sm font-medium text-[var(--tinta)]">
            Aún no hay comercios registrados.
          </p>
          <p className="mt-2 text-sm text-[var(--tinta-suave)]">
            El directorio estará disponible cuando se publique el primer comercio.
          </p>
          <Link href="/configuracion" className="mt-4 inline-block text-sm font-semibold text-[var(--mostaza-tinta)] hover:underline">
            Agregar el primer comercio
          </Link>
        </div>
      ) : visibles.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-[var(--borde-fuerte)] px-4 py-10 text-center text-sm text-[var(--tinta-tenue)]">
          Ningún comercio coincide con esa búsqueda.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {visibles.map((tienda) => (
            <li key={tienda.id}>
              <TarjetaTienda tienda={tienda} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
