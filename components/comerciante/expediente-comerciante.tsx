"use client";

import { LogOutIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Insignia } from "@/components/ui/insignia";
import { Textarea } from "@/components/ui/input";
import { impugnarReporte } from "@/lib/cliente-api";
import { calcularCumplimiento } from "@/lib/cumplimiento";
import { formatearNumero, tiempoRelativo } from "@/lib/format";
import type { Reporte } from "@/types";

function puntosTexto(reporte: Reporte): string {
  if (!reporte.gravedad) return "Sin calificación";
  if (reporte.gravedad === "leve") {
    const subsanacionEnPlazo =
      reporte.subsanadoEn &&
      reporte.fechaSubsanacion &&
      new Date(reporte.subsanadoEn).getTime() <=
        new Date(reporte.fechaSubsanacion).getTime();
    return `Leve · −${subsanacionEnPlazo ? 5 : 10} puntos`;
  }
  if (reporte.gravedad === "grave") return "Grave · −20 puntos";
  return "Muy grave · −40 puntos";
}

export function ExpedienteComerciante({
  nombre,
  tiendaId,
  reportesIniciales,
  puntaje,
  estadoSemaforo,
}: {
  nombre: string;
  tiendaId: string;
  reportesIniciales: Reporte[];
  puntaje: number;
  estadoSemaforo: string;
}) {
  const router = useRouter();
  const [reportes, setReportes] = useState(reportesIniciales);
  const [puntajeActual, setPuntajeActual] = useState(puntaje);
  const [estadoActual, setEstadoActual] = useState(estadoSemaforo);
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  async function impugnar(id: string) {
    setError(null);
    setMensaje(null);
    setGuardando(id);
    try {
      const reporte = await impugnarReporte(id, motivos[id] ?? "");
      const siguientes = reportes.map((actual) => actual.id === id ? reporte : actual);
      setReportes(siguientes);
      const resultado = calcularCumplimiento(siguientes, tiendaId);
      setPuntajeActual(resultado.puntaje);
      setEstadoActual(resultado.etiqueta);
      setMotivos((actuales) => ({ ...actuales, [id]: "" }));
      setMensaje(`Impugnación del folio ${formatearNumero(reporte.folio)} recibida. El reporte queda suspendido mientras se revisa.`);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo enviar la impugnación.");
    } finally {
      setGuardando(null);
    }
  }

  async function salir() {
    setGuardando("salir");
    try {
      const respuesta = await fetch("/api/comerciante/sesion", { method: "DELETE" });
      if (!respuesta.ok) throw new Error("No se pudo cerrar la sesión.");
      router.replace("/comerciante");
      router.refresh();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo cerrar la sesión.");
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-4xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5">
        <div>
          <p className="font-mono text-xs text-[var(--tinta-tenue)]">Expediente del comercio</p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-[var(--tinta)]">{nombre}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p className="font-mono text-lg font-semibold text-[var(--tinta)]">{puntajeActual} / 100</p>
            <Insignia tono={puntajeActual >= 80 ? "verde" : puntajeActual >= 40 ? "mostaza" : "terracota"}>
              {estadoActual}
            </Insignia>
          </div>
          <Button type="button" variant="contorno" size="sm" onClick={() => void salir()} disabled={guardando === "salir"}>
            <LogOutIcon aria-hidden />
            {guardando === "salir" ? "Saliendo…" : "Cerrar sesión"}
          </Button>
        </div>
      </header>

      {error ? <p role="alert" className="text-sm text-[var(--terracota-tinta)]">{error}</p> : null}
      {mensaje ? <p role="status" className="text-sm text-[var(--semaforo-verde)]">{mensaje}</p> : null}

      <section aria-labelledby="expediente-reportes">
        <h2 id="expediente-reportes" className="font-serif text-lg font-semibold text-[var(--tinta)]">
          Reportes, calificaciones e impugnaciones
        </h2>
        <p className="mt-1 text-sm text-[var(--tinta-suave)]">
          Puedes impugnar cualquier reporte o calificación dentro de cinco días hábiles desde su notificación. Mientras se resuelve, el puntaje y las sanciones formales quedan suspendidos.
        </p>
        <p className="mt-1 text-xs text-[var(--tinta-tenue)]">
          Los plazos del portal cuentan todos los días excepto los domingos.
        </p>
        <ul className="mt-4 space-y-3">
          {reportes.length === 0 ? (
            <li className="rounded-lg border border-dashed border-[var(--borde-fuerte)] p-6 text-center text-sm text-[var(--tinta-tenue)]">
              No hay reportes en tu expediente.
            </li>
          ) : null}
          {reportes.map((reporte) => {
            const puedeImpugnar =
              reporte.validado &&
              reporte.impugnacionEstado === "ninguna";
            const sanciones = reporte.sanciones;
            return (
              <li key={reporte.id} className="rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-[var(--tinta)]">
                    Folio {formatearNumero(reporte.folio)}
                  </span>
                  <Insignia tono={!reporte.validado ? "neutro" : reporte.impugnacionEstado === "pendiente" ? "mostaza" : "bosque"}>
                    {!reporte.validado
                      ? "Pendiente de validación"
                      : reporte.impugnacionEstado === "pendiente"
                        ? "Impugnación en trámite · suspendido"
                        : reporte.impugnacionEstado === "confirmada"
                          ? "Impugnación confirmada"
                          : reporte.impugnacionEstado === "revocada"
                            ? "Reporte revocado"
                            : "Notificado"}
                  </Insignia>
                  <span className="ml-auto font-mono text-xs text-[var(--tinta-tenue)]">
                    {tiempoRelativo(reporte.creadoEn)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--tinta-suave)]">{reporte.descripcion}</p>
                {reporte.validado ? (
                  <p className="mt-2 text-sm font-medium text-[var(--tinta)]">
                    {puntosTexto(reporte)}
                    {reporte.fechaSubsanacion ? (
                      <span className="font-normal text-[var(--tinta-tenue)]">
                        {" "}· subsanación antes del {new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(reporte.fechaSubsanacion))}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                {reporte.impugnacionMotivo ? (
                  <p className="mt-2 rounded-md bg-[var(--hundido)] p-3 text-sm">
                    <span className="font-medium">Motivo de impugnación: </span>
                    {reporte.impugnacionMotivo}
                  </p>
                ) : null}
                {reporte.resolucionImpugnacion ? (
                  <p className="mt-2 rounded-md bg-[var(--hundido)] p-3 text-sm">
                    <span className="font-medium">Resolución de impugnación: </span>
                    {reporte.resolucionImpugnacion}
                  </p>
                ) : null}
                {reporte.impugnacionEn && reporte.impugnacionEstado === "pendiente" ? (
                  <p className="mt-2 text-xs text-[var(--tinta-tenue)]">
                    Acuse de recibo emitido · {tiempoRelativo(reporte.impugnacionEn)}
                  </p>
                ) : null}
                {sanciones.length > 0 ? (
                  <ul className="mt-3 border-t border-[var(--borde)] pt-3">
                    {sanciones.map((sancion) => (
                      <li key={sancion.id} className="text-sm">
                        <span className="font-medium">{sancion.tipo.replaceAll("_", " ")}</span>
                        {" · "}{sancion.resolucion}
                        {sancion.plazoCumplimiento ? (
                          <span> · plazo final hasta {new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(sancion.plazoCumplimiento))}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {puedeImpugnar ? (
                  <div className="mt-4 space-y-2 border-t border-[var(--borde)] pt-3">
                    <label htmlFor={`impugnacion-${reporte.id}`} className="block text-sm font-medium text-[var(--tinta)]">
                      Motivo de impugnación
                    </label>
                    <Textarea
                      id={`impugnacion-${reporte.id}`}
                      minLength={20}
                      maxLength={1500}
                      required
                      value={motivos[reporte.id] ?? ""}
                      onChange={(evento) => setMotivos((actuales) => ({ ...actuales, [reporte.id]: evento.target.value }))}
                      placeholder="Explica los hechos o la calificación que solicitas revisar."
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={guardando !== null || (motivos[reporte.id] ?? "").trim().length < 20}
                      onClick={() => void impugnar(reporte.id)}
                    >
                      <SendIcon aria-hidden />
                      {guardando === reporte.id ? "Enviando…" : "Impugnar reporte"}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
      <p className="text-xs leading-relaxed text-[var(--tinta-tenue)]">
        El historial de amonestaciones y sanciones formales se conserva durante seis meses. Las intervenciones arquitectónicas menores, no estructurales o temporales no son infracción muy grave.
      </p>
    </div>
  );
}
