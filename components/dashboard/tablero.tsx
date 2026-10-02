"use client";

import { AlertTriangleIcon, RotateCcwIcon, StoreIcon } from "lucide-react";
import { MotionConfig } from "framer-motion";

import { PestanaBeneficio } from "@/components/dashboard/pestana-beneficio";
import { PestanaCumplimiento } from "@/components/dashboard/pestana-cumplimiento";
import { PestanaPerfil } from "@/components/dashboard/pestana-perfil";
import { PestanaQuejas } from "@/components/dashboard/pestana-quejas";
import { PestanaTiendas } from "@/components/dashboard/pestana-tiendas";
import { ContenedorPestana, PestanasLista } from "@/components/dashboard/pestanas";
import { SelectorTienda } from "@/components/dashboard/selector-tienda";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { seleccionarCargando, seleccionarError, usePanel, useTiendaActual } from "@/store/use-panel";

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
export function Tablero() {
  const tab = usePanel((estado) => estado.tab);
  const setTab = usePanel((estado) => estado.setTab);
  const cargando = usePanel(seleccionarCargando);
  const error = usePanel(seleccionarError);
  const cargarEstado = usePanel((estado) => estado.cargarEstado);

  // Resuelto contra el catálogo completo, así una tienda dada de alta desde
  // el formulario se abre con los datos cargados.
  const tienda = useTiendaActual();

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
        <section className="max-w-2xl rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-6 shadow-[var(--sombra-tenue)] sm:p-8">
          <span className="grid size-11 place-items-center rounded-md bg-[var(--bosque-lavado)] text-[var(--bosque-tinta)]">
            <StoreIcon aria-hidden />
          </span>
          <p className="mt-6 text-sm font-semibold text-[var(--mostaza-tinta)]">
            Configuración inicial
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--tinta)] sm:text-3xl">
            Registra tu primer comercio
          </h1>
          <p className="mt-3 max-w-prose text-sm leading-6 text-[var(--tinta-suave)]">
            Completa su ficha para administrar horarios, incidencias y cumplimiento desde este panel.
          </p>
        </section>
        <div className="mt-8 max-w-5xl">
          <PestanaTiendas inicialAbierto />
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[var(--tinta)] sm:text-3xl">
              Tablero de fichas
            </h1>
            <p className="mt-1.5 text-sm text-[var(--tinta-suave)]">
              Cambiar de tienda actualiza todas las pestañas a la vez.
            </p>
          </div>
          <p className="font-mono text-xs text-[var(--tinta-tenue)]">
            {tienda.horarioAutorizado} · {tienda.ubicacion.pasaje}
          </p>
        </div>

        <div className="mt-6">
          <SelectorTienda />
        </div>

        <Tabs
          value={tab}
          onValueChange={(valor) => setTab(valor as typeof tab)}
          className="mt-8"
        >
          <PestanasLista valor={tab} />

          <TabsContent value="perfil">
            <ContenedorPestana key="perfil">
              <PestanaPerfil tienda={tienda} />
            </ContenedorPestana>
          </TabsContent>

          <TabsContent value="quejas">
            <ContenedorPestana key="quejas">
              <PestanaQuejas tiendaId={tienda.id} />
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

          <TabsContent value="tiendas">
            <ContenedorPestana key="tiendas">
              <PestanaTiendas />
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