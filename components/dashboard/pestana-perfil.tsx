"use client";

import { motion } from "framer-motion";
import { PencilIcon } from "lucide-react";
import { useState } from "react";

import { CodigoQR } from "@/components/dashboard/codigo-qr";
import { FormularioTienda } from "@/components/dashboard/formulario-tienda";
import { Button } from "@/components/ui/button";
import { Insignia } from "@/components/ui/insignia";
import { DIAS } from "@/lib/dias";
import { cn } from "@/lib/utils";
import type { Tienda } from "@/types";

/**
 * Pestaña de perfil: quién es la persona autorizada, qué puede vender y
 * cuándo abre.
 *
 * La identidad usa un avatar de iniciales en lugar de una foto: aquí no
 * incluye imágenes de personas reales, y además evita que la ficha parezca
 * una perfil falso de una persona concreta.
 */
export function PestanaPerfil({
  tienda,
  editable = false,
}: {
  tienda: Tienda;
  editable?: boolean;
}) {
  const activos = Object.values(tienda.horarioSemanal).filter((d) => d.activo);
  const [editando, setEditando] = useState(false);

  return (
    <div className="space-y-8">
      {editable && editando ? (
        <FormularioTienda
          key={tienda.id}
          tienda={tienda}
          onCerrar={() => setEditando(false)}
        />
      ) : (
        <>
          {editable ? (
            <div className="flex justify-end">
              <Button type="button" variant="contorno" onClick={() => setEditando(true)}>
                <PencilIcon aria-hidden />
                Editar información
              </Button>
            </div>
          ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <motion.section
          aria-labelledby="perfil-identidad"
          className="filete-bosque rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 shadow-[var(--sombra-tenue)] sm:p-6"
        >
          <div className="flex items-start gap-4">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-lg bg-[var(--bosque)] font-mono text-lg font-semibold text-[var(--papel)]"
              aria-hidden
            >
              {tienda.iniciales}
            </span>

            <div className="min-w-0">
              <h2
                id="perfil-identidad"
                className="font-serif text-xl font-semibold text-balance text-[var(--tinta)] sm:text-2xl"
              >
                {tienda.nombre}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--tinta-suave)]">
                {tienda.dueno}
              </p>
              <p className="mt-1.5 text-xs text-[var(--tinta-tenue)]">
                {tienda.rol}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Insignia tono="verde">
              <span
                className="size-1.5 rounded-full bg-[var(--verde)]"
                aria-hidden
              />
              Autorización vigente
            </Insignia>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[var(--tinta-suave)]">
            {tienda.nota}
          </p>

          <dl className="mt-5 divide-y divide-[var(--borde)] border-t border-[var(--borde)]">
            {[
              [
                "Ubicación",
                `${tienda.ubicacion.pasaje}, ${tienda.ubicacion.casa}`,
              ],
              ["Horario autorizado", tienda.horarioAutorizado],
              ["Días autorizados", `${activos.length} de 7`],
              ["Autorizada desde", tienda.autorizadoDesde],
            ].map(([rotulo, valor]) => (
              <div
                key={rotulo}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                <dt className="font-mono text-xs text-[var(--tinta-tenue)]">
                  {rotulo}
                </dt>
                <dd className="text-right text-sm text-[var(--tinta)]">{valor}</dd>
              </div>
            ))}
          </dl>
        </motion.section>

        <div className="space-y-6">
          <section aria-labelledby="perfil-horario">
            <h3
              id="perfil-horario"
              className="font-serif text-lg font-semibold text-[var(--tinta)]"
            >
              Horario semanal
            </h3>

            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DIAS.map((dia) => {
                const horario = tienda.horarioSemanal[dia.id];
                return (
                  <li
                    key={dia.id}
                    className={cn(
                      "rounded-md border px-2.5 py-2",
                      horario.activo
                        ? "border-[color-mix(in_oklab,var(--bosque)_28%,transparent)] bg-[var(--bosque-lavado)]"
                        : "border-[var(--borde)] bg-[var(--hundido)]",
                    )}
                  >
                    <span
                      className={cn(
                        "block font-mono text-xs",
                        horario.activo
                          ? "text-[var(--bosque-tinta)]"
                          : "text-[var(--tinta-tenue)]",
                      )}
                    >
                      {dia.etiqueta}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-xs",
                        horario.activo
                          ? "text-[var(--tinta)]"
                          : "text-[var(--tinta-tenue)] line-through decoration-[var(--borde-fuerte)]",
                      )}
                    >
                      {horario.rango}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="perfil-productos">
            <h3
              id="perfil-productos"
              className="font-serif text-lg font-semibold text-[var(--tinta)]"
            >
              Productos permitidos
            </h3>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {tienda.productosPermitidos.map((producto) => (
                <li key={producto}>
                  <Insignia tono="bosque" className="rounded-md">
                    {producto}
                  </Insignia>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 font-serif text-lg font-semibold text-[var(--tinta)]">
              No autorizados
            </h3>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {tienda.productosRestringidos.map((producto) => (
                <li key={producto}>
                  <Insignia tono="terracota" className="rounded-md">
                    {producto}
                  </Insignia>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
        </>
      )}

      <section
        aria-labelledby="perfil-qr"
        className="rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 shadow-[var(--sombra-tenue)] sm:p-6"
      >
        <h2 id="perfil-qr" className="sr-only">
          Código de verificación
        </h2>
        <CodigoQR tienda={tienda} />
      </section>
    </div>
  );
}
