"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { FormularioTienda } from "@/components/dashboard/formulario-tienda";
import { Button } from "@/components/ui/button";
import { Insignia } from "@/components/ui/insignia";
import { CATEGORIAS, obtenerCategoria } from "@/data/tiendas";
import { calcularCumplimiento } from "@/lib/cumplimiento";
import { formatearMoneda, formatearNumero } from "@/lib/format";
import {
  seleccionarCargando,
  seleccionarGuardando,
  useCatalogoTiendas,
  usePanel,
} from "@/store/use-panel";

/**
 * Alta y baja de comercios.
 *
 * Los registros y sus denuncias se almacenan en la base de datos.
 */
export function PestanaTiendas({ inicialAbierto = false }: { inicialAbierto?: boolean }) {
  const catalogo = useCatalogoTiendas();
  const reportes = usePanel((estado) => estado.reportes);
  const cargando = usePanel(seleccionarCargando);
  const eliminarTienda = usePanel((estado) => estado.eliminarTienda);
  const guardando = usePanel(seleccionarGuardando);

  const [abierto, setAbierto] = useState(inicialAbierto);

  return (
    <div className="space-y-8">
      <section aria-labelledby="tiendas-alta">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="tiendas-alta"
              className="font-serif text-lg font-semibold text-[var(--tinta)]"
            >
              Registrar un comercio
            </h2>
            <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[var(--tinta-suave)]">
              Da de alta una tienda con su información, ubicación, rubro y
              horario. Queda con una ficha completa, código QR y puntaje de
              cumplimiento desde el primer día.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="formulario-alta"
          >
            <PlusIcon aria-hidden />
            {abierto ? "Cerrar formulario" : "Agregar tienda"}
          </Button>
        </div>

        {abierto ? (
          <div id="formulario-alta" className="mt-5">
            <FormularioTienda onCerrar={() => setAbierto(false)} />
          </div>
        ) : null}
      </section>

      <section aria-labelledby="tiendas-propias">
        <h2
          id="tiendas-propias"
          className="font-serif text-lg font-semibold text-[var(--tinta)]"
        >
          Comercios registrados
        </h2>

        {cargando ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-3 rounded-lg border border-dashed border-[var(--borde-fuerte)] px-4 py-8 text-center text-sm text-[var(--tinta-tenue)]"
          >
            Consultando el catálogo…
          </p>
        ) : catalogo.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-[var(--borde-fuerte)] px-4 py-8 text-center text-sm text-[var(--tinta-tenue)]">
            Todavía no hay comercios dados de alta. Usa el botón de arriba para
            registrar el primero.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {catalogo.map((tienda) => {
              const cumplimiento = calcularCumplimiento(reportes, tienda.id);
              const categoria = obtenerCategoria(tienda.categoria);

              return (
                <li
                  key={tienda.id}
                  className="flex flex-wrap items-start gap-4 rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-4"
                >
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--bosque-lavado)] font-mono text-sm font-semibold text-[var(--bosque-tinta)]"
                    aria-hidden
                  >
                    {tienda.iniciales}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[var(--tinta)]">
                        {tienda.nombre}
                      </p>
                      <Insignia tono="bosque">{categoria.etiqueta}</Insignia>
                      <Insignia
                        tono={
                          cumplimiento.rango === "optimo"
                            ? "verde"
                            : cumplimiento.rango === "observacion"
                              ? "mostaza"
                              : "terracota"
                        }
                      >
                        {cumplimiento.puntaje} pts
                      </Insignia>
                    </div>

                    <p className="mt-1 text-sm text-[var(--tinta-suave)]">
                      {tienda.dueno} · {tienda.ubicacion.pasaje},{" "}
                      {tienda.ubicacion.casa}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-[var(--tinta-tenue)]">
                      {tienda.horarioAutorizado} ·{" "}
                      {formatearNumero(tienda.metricas.residentesBeneficiados)}{" "}
                      residentes · {formatearMoneda(tienda.metricas.ahorroMensualEstimado)}{" "}
                      de ahorro
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="fantasma"
                    size="sm"
                    disabled={guardando}
                    onClick={() => void eliminarTienda(tienda.id)}
                    aria-label={`Eliminar ${tienda.nombre}`}
                    className="text-[var(--terracota-tinta)] hover:bg-[var(--terracota-lavado)] hover:text-[var(--terracota-tinta)]"
                  >
                    <Trash2Icon aria-hidden />
                    Eliminar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs leading-relaxed text-[var(--tinta-tenue)]">
        Hay {CATEGORIAS.length} rubros disponibles. Cada nuevo comercio empieza
        con un historial de cumplimiento limpio.
      </p>
    </div>
  );
}
