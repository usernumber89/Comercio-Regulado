"use client";

import { RotateCcwIcon, SendIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { DialogoTicket } from "@/components/dashboard/dialogo-ticket";
import { SeguimientoReporte } from "@/components/dashboard/seguimiento-reporte";
import { Button } from "@/components/ui/button";
import { Checkbox, Label } from "@/components/ui/form-controls";
import { Textarea } from "@/components/ui/input";
import { Insignia } from "@/components/ui/insignia";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIPOS_INCIDENTE } from "@/data/sitio";
import { calcularCumplimiento } from "@/lib/cumplimiento";
import { formatearNumero, tiempoRelativo } from "@/lib/format";
import { seleccionarGuardando, useCatalogoTiendas, usePanel } from "@/store/use-panel";
import type { Reporte, TipoIncidente } from "@/types";

const DESCRIPCION_MINIMA = 12;

const ESTADOS = Object.keys(TIPOS_INCIDENTE) as TipoIncidente[];

function tonoDeEstado(estado: Reporte["estado"]) {
  return estado === "activo" ? "terracota" : "verde";
}

/**
 * Pestaña de quejas: alta de reportes e historial.
 *
 * Registrar una denuncia escribe en la base de datos por la API y, como el
 * puntaje de cumplimiento se deriva de ese mismo historial, la pestaña de
 * Cumplimiento refleja el cambio en cuanto se vuelve a abrir. No hay dos
 * fuentes de verdad.
 */
export function PestanaQuejas({ tiendaId }: { tiendaId: string }) {
  const reportes = usePanel((estado) => estado.reportes);
  const registrarReporte = usePanel((estado) => estado.registrarReporte);
  const alternarEstado = usePanel((estado) => estado.alternarEstadoReporte);
  const guardando = usePanel(seleccionarGuardando);
  const catalogo = useCatalogoTiendas();

  const [tipo, setTipo] = useState<TipoIncidente>("ruido");
  const [descripcion, setDescripcion] = useState("");
  const [anonimo, setAnonimo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState<Reporte | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  const cumplimiento = useMemo(
    () => calcularCumplimiento(reportes, tiendaId),
    [reportes, tiendaId],
  );

  const historial = useMemo(
    () =>
      reportes
        .filter((r) => r.tiendaId === tiendaId)
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
    [reportes, tiendaId],
  );

  // Puntaje que quedaría si se enviara el formulario tal como está. Se
  // calcula con un reporte sintético, sin tocar el estado real.
  const puntajePronostico = useMemo(() => {
    if (descripcion.trim().length < DESCRIPCION_MINIMA) return cumplimiento.puntaje;
    return Math.max(0, cumplimiento.puntaje - 20);
  }, [cumplimiento.puntaje, descripcion]);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (descripcion.trim().length < DESCRIPCION_MINIMA) {
      setError(
        `Describe el incidente con al menos ${DESCRIPCION_MINIMA} caracteres para que la Junta pueda gestionarlo.`,
      );
      return;
    }

    setError(null);

    try {
      const reporte = await registrarReporte({ tiendaId, tipo, descripcion, anonimo });

      setUltimo(reporte);
      setDialogoAbierto(true);
      setDescripcion("");
      setAnonimo(false);
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar la denuncia.",
      );
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section
        aria-labelledby="quejas-formulario"
        className="rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 shadow-[var(--sombra-tenue)] sm:p-6"
      >
        <h2
          id="quejas-formulario"
          className="font-serif text-lg font-semibold text-[var(--tinta)]"
        >
          Registrar un incidente
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--tinta-suave)]">
          Cada reporte recibe un folio y queda activo durante treinta días.
          Resolverlo devuelve los veinte puntos correspondientes al puntaje.
        </p>

        <form onSubmit={enviar} className="mt-5 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="tipo">Tipo de incidente</Label>
            <Select value={tipo} onValueChange={(valor) => setTipo(valor as TipoIncidente)}>
              <SelectTrigger id="tipo" aria-describedby="tipo-ayuda">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((clave) => (
                  <SelectItem key={clave} value={clave}>
                    {TIPOS_INCIDENTE[clave].etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p
              id="tipo-ayuda"
              className="text-xs leading-relaxed text-[var(--tinta-tenue)]"
            >
              {TIPOS_INCIDENTE[tipo].descripcion}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              placeholder="Ej.: el camión de reparto se detuvo frente a la casa 12 y tapó el paso del carril."
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "descripcion-error" : undefined}
            />
            {error ? (
              <p
                id="descripcion-error"
                role="alert"
                className="text-xs text-[var(--terracota-tinta)]"
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="anonimo"
              checked={anonimo}
              onCheckedChange={(valor) => setAnonimo(valor === true)}
              className="mt-0.5"
            />
            <Label htmlFor="anonimo" className="font-normal leading-snug">
              Reportar de forma anónima
              <span className="mt-0.5 block text-xs text-[var(--tinta-tenue)]">
                El folio se registra igual, pero no se guarda ningún dato del
                vecino que reporta.
              </span>
            </Label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" disabled={guardando}>
              <SendIcon aria-hidden />
              {guardando ? "Guardando…" : "Registrar denuncia"}
            </Button>

            <p className="font-mono text-xs text-[var(--tinta-tenue)]">
              Puntaje {cumplimiento.puntaje}
              {puntajePronostico !== cumplimiento.puntaje ? (
                <span className="text-[var(--mostaza-tinta)]">
                  {" "}
                  · al enviar pasará a {puntajePronostico}
                </span>
              ) : null}
            </p>
          </div>
        </form>
      </section>

      <section aria-labelledby="quejas-historial">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="quejas-historial"
            className="font-serif text-lg font-semibold text-[var(--tinta)]"
          >
            Historial
          </h2>
          <p className="font-mono text-xs text-[var(--tinta-tenue)]">
            {historial.length} registro{historial.length === 1 ? "" : "s"}
          </p>
        </div>

        <ul className="mt-3 space-y-2">
          {historial.length === 0 ? (
            <li className="rounded-lg border border-dashed border-[var(--borde-fuerte)] p-6 text-center text-sm text-[var(--tinta-tenue)]">
              Todavía no hay reportes para esta tienda.
            </li>
          ) : null}

          {historial.map((reporte) => (
            <li
              key={reporte.id}
              className="rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-3.5"
            >
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span className="font-mono text-sm font-semibold text-[var(--tinta)]">
                  {formatearNumero(reporte.folio)}
                </span>
                <span className="text-sm text-[var(--tinta)]">
                  {TIPOS_INCIDENTE[reporte.tipo].etiqueta}
                </span>
                <Insignia tono={tonoDeEstado(reporte.estado)}>
                  {reporte.estado === "activo" ? "Activo" : "Resuelto"}
                </Insignia>
                <span className="ml-auto font-mono text-xs text-[var(--tinta-tenue)]">
                  {tiempoRelativo(reporte.creadoEn)}
                </span>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-[var(--tinta-suave)]">
                {reporte.descripcion}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-[var(--tinta-tenue)]">
                  {reporte.anonimo ? "Anónimo" : "Identificado"}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <SeguimientoReporte reporte={reporte} />
                  {reporte.estado === "resuelto" ? (
                    <Button
                      type="button"
                      variant="fantasma"
                      size="sm"
                      onClick={() => void alternarEstado(reporte.id)}
                      aria-label={`Reabrir el reporte ${reporte.folio}`}
                    >
                    <RotateCcwIcon aria-hidden />
                      Reabrir
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <DialogoTicket
        reporte={ultimo}
        nombreTienda={
          catalogo.find((t) => t.id === tiendaId)?.nombre ?? tiendaId
        }
        abierto={dialogoAbierto}
        onCerrar={() => setDialogoAbierto(false)}
      />
    </div>
  );
}
