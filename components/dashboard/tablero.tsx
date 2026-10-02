"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { MotionConfig } from "framer-motion";

import { PestanaBeneficio } from "@/components/dashboard/pestana-beneficio";
import { PestanaCumplimiento } from "@/components/dashboard/pestana-cumplimiento";
import { PestanaPerfil } from "@/components/dashboard/pestana-perfil";
import { PestanaQuejas } from "@/components/dashboard/pestana-quejas";
import { ContenedorPestana, PestanasLista } from "@/components/dashboard/pestanas";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { seleccionarCargando, seleccionarError, usePanel } from "@/store/use-panel";

/**
 * Tablero de fichas.
 *
 * Tienda activa y pestaña activa viven en el store, así que todo se actualiza
 * en el cliente sin navegación. `MotionConfig reducedMotion="user"` hace que
 * framer-motion respete la preferencia del sistema en todo el subárbol: con
 * movimiento reducido las transiciones se saltan.
 *
 * El contenido sale de la base de datos: `CargaDatos` la pide al montar y
 * este componente solo muestra lo que ya llegó.
 */
export function Tablero({
  tiendaId,
  administrador,
}: {
  tiendaId: string;
  administrador: boolean;
}) {
  const tab = usePanel((estado) => estado.tab);
  const setTab = usePanel((estado) => estado.setTab);
  const setTienda = usePanel((estado) => estado.setTienda);
  const cargando = usePanel(seleccionarCargando);
  const error = usePanel(seleccionarError);
  const cargarEstado = usePanel((estado) => estado.cargarEstado);

  const tienda = usePanel(
    (estado) => estado.tiendas.find((actual) => actual.id === tiendaId) ?? null,
  );

  useEffect(() => {
    setTienda(tiendaId);
    setTab("perfil");
  }, [setTab, setTienda, tiendaId]);

  if (error) {
    return (
      <AvisoCarga
        titulo="No se pudo leer la base de datos"
        detalle={error}
        alReintentar={() => void cargarEstado()}
      />
    );
  }

  if (cargando) return <EsqueletoTablero />;

  if (!tienda) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="text-sm text-[var(--tinta-suave)]">
          No se encontró este comercio. <Link href="/tiendas" className="font-medium text-[var(--bosque-tinta)] underline underline-offset-2">Volver a comercios</Link>
        </p>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/tiendas"
          className="text-xs font-medium text-[var(--tinta-tenue)] hover:text-[var(--tinta)]"
        >
          ← Todos los comercios
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-[var(--tinta-tenue)]">
              {tienda.codigo} · {tienda.ubicacion.pasaje}, {tienda.ubicacion.casa}
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-[var(--tinta)] sm:text-3xl">
              {tienda.nombre}
            </h1>
          </div>
          <p className="font-mono text-xs text-[var(--tinta-tenue)]">
            {tienda.horarioAutorizado}
          </p>
        </div>

        <Tabs
          value={tab}
          onValueChange={(valor) => setTab(valor as typeof tab)}
          className="mt-8"
        >
          <PestanasLista valor={tab} />

          <TabsContent value="perfil">
            <ContenedorPestana key="perfil">
              <PestanaPerfil tienda={tienda} editable={administrador} />
            </ContenedorPestana>
          </TabsContent>

          <TabsContent value="quejas">
            <ContenedorPestana key="quejas">
              <PestanaQuejas tiendaId={tienda.id} administrador={administrador} />
            </ContenedorPestana>
          </TabsContent>

          <TabsContent value="cumplimiento">
            <ContenedorPestana key="cumplimiento">
              <PestanaCumplimiento tienda={tienda} />
            </ContenedorPestana>
          </TabsContent>

          <TabsContent value="beneficio">
            <ContenedorPestana key="beneficio">
              <PestanaBeneficio tienda={tienda} />
            </ContenedorPestana>
          </TabsContent>

        </Tabs>
      </div>
    </MotionConfig>
  );
}

/** Lo que se ve mientras la base de datos responde. */
function EsqueletoTablero() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-[var(--tinta-suave)]">
        Consultando la base de datos…
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {[0, 1].map((indice) => (
          <div
            key={indice}
            aria-hidden
            className="h-[4.5rem] animate-pulse rounded-lg border border-[var(--borde)] bg-[var(--hundido)]"
          />
        ))}
      </div>
      <div
        aria-hidden
        className="mt-8 h-64 animate-pulse rounded-lg border border-[var(--borde)] bg-[var(--hundido)]"
      />
    </div>
  );
}

/** Fallo de lectura, con la opción de volver a intentarlo. */
export function AvisoCarga({
  titulo,
  detalle,
  alReintentar,
}: {
  titulo: string;
  detalle: string;
  alReintentar: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-lg border border-[var(--terracota)] bg-[var(--terracota-lavado)] p-5">
        <p className="flex items-center gap-2 font-medium text-[var(--terracota-tinta)]">
          <AlertTriangleIcon className="size-4" aria-hidden />
          {titulo}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--terracota-tinta)]">
          {detalle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--terracota-tinta)]">
          Revisa que <code>DATABASE_URL</code> en <code>.env</code> apunte a la
            base de Neon y que las tablas estén creadas con{" "}
            <code>npm run db:migrar</code>.
        </p>
        <div className="mt-4">
          <Button type="button" variant="contorno" onClick={alReintentar}>
            <RotateCcwIcon aria-hidden />
            Intentar de nuevo
          </Button>
        </div>
      </div>
    </div>
  );
}