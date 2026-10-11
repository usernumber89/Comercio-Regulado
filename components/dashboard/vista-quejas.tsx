"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { PestanaQuejas } from "@/components/dashboard/pestana-quejas";
import { SelectorTienda } from "@/components/dashboard/selector-tienda";
import { Button } from "@/components/ui/button";
import { Insignia } from "@/components/ui/insignia";
import { formatearNumero } from "@/lib/format";
import {
  seleccionarCargando,
  useCatalogoTiendas,
  usePanel,
} from "@/store/use-panel";

/**
 * Vista dedicada de quejas.
 *
 * Existe para poder mandar un enlace directo por WhatsApp sin obligar a
 * quien lo recibe a recorrer el tablero. Si la URL trae `?folio=`, se
 * muestra el comprobante de ese reporte arriba del formulario.
 *
 * El folio se busca contra el historial que llegó de la base de datos, así
 * que un enlace compartido funciona en el teléfono de cualquiera: no depende
 * del navegador desde el que se generó.
 */
export function VistaQuejas({ folio }: { folio: number | null }) {
  const tiendaId = usePanel((estado) => estado.tiendaId);
  const reportes = usePanel((estado) => estado.reportes);
  const cargando = usePanel(seleccionarCargando);
  const catalogo = useCatalogoTiendas();
  const tienda = catalogo.find((t) => t.id === tiendaId);

  const referenciado =
    folio === null ? null : (reportes.find((r) => r.folio === folio) ?? null);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="font-mono text-xs text-[var(--tinta-tenue)]">
        Canal de quejas · Comercio Regulado
      </p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-balance text-[var(--tinta)] sm:text-3xl">
        Reportar un incidente
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--tinta-suave)] sm:text-base">
        Cualquier visitante puede reportar un incidente sin crear una cuenta
        ni registrar un comercio. Selecciona un comercio del directorio y
        describe lo ocurrido; cada reporte recibe un folio verificable para
        que la Junta pueda revisarlo.
      </p>

      {referenciado ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="filete-bosque mt-5 rounded-lg border border-[var(--borde)] bg-[var(--bosque-lavado)] p-4"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <Insignia tono="bosque">Folio compartido</Insignia>
            <p className="font-mono text-sm font-semibold text-[var(--tinta)]">
              {formatearNumero(referenciado.folio)}
            </p>
            <Insignia tono={referenciado.estado === "activo" ? "terracota" : "verde"}>
              {referenciado.estado === "activo" ? "Activo" : "Resuelto"}
            </Insignia>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--tinta-suave)]">
            {referenciado.descripcion}
          </p>
        </motion.div>
      ) : null}

      {catalogo.length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-[var(--tinta)]">
            Comercio que se está reportando
          </h2>
          <SelectorTienda />
        </div>
      ) : null}

      {tiendaId && !cargando ? (
        <div className="mt-6">
          <PestanaQuejas tiendaId={tiendaId} />
        </div>
      ) : catalogo.length === 0 && !cargando ? (
        <div className="mt-6 rounded-lg border border-dashed border-[var(--borde-fuerte)] px-5 py-8 text-center">
          <p className="text-sm font-medium text-[var(--tinta)]">
            Todavía no hay comercios en el directorio.
          </p>
          <p className="mt-2 text-sm text-[var(--tinta-suave)]">
            Para enviar un reporte, selecciona un comercio del directorio. No
            necesitas crear una cuenta ni registrar el comercio.
          </p>
          <Button asChild variant="contorno" className="mt-4">
            <Link href="/tiendas">Ver el directorio</Link>
          </Button>
        </div>
      ) : (
        <p
          className="mt-6 rounded-lg border border-dashed border-[var(--borde-fuerte)] px-4 py-8 text-center text-sm text-[var(--tinta-tenue)]"
          role="status"
        >
          Consultando la base de datos…
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--borde)] pt-5">
        <Button asChild variant="contorno" size="sm">
          <Link href={tienda ? `/dashboard/${tienda.id}` : "/tiendas"}>
            {tienda ? `Volver a gestión de ${tienda.nombre}` : "Ver comercios"}
          </Link>
        </Button>
        {tienda ? (
          <Button asChild variant="fantasma" size="sm">
            <Link href={`/tiendas/${tienda.id}`}>
              Ver la ficha pública de {tienda.nombre}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
