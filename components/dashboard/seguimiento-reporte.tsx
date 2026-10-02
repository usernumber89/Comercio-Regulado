"use client";

import {
  AlertTriangleIcon,
  CheckIcon,
  ClipboardListIcon,
  Clock3Icon,
  HistoryIcon,
  LinkIcon,
  MapPinIcon,
  PaperclipIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/form-controls";
import { Input, Textarea } from "@/components/ui/input";
import { formatearNumero, tiempoRelativo } from "@/lib/format";
import { seleccionarGuardando, usePanel } from "@/store/use-panel";
import type { Reporte, TipoSeguimientoReporte } from "@/types";

type TipoEvento = Exclude<TipoSeguimientoReporte, "reapertura">;

const ETIQUETAS: Record<TipoSeguimientoReporte, string> = {
  accion: "Plan correctivo asignado",
  ronda: "Ronda preventiva",
  evidencia: "Evidencia registrada",
  resolucion: "Reporte resuelto",
  reapertura: "Reporte reabierto",
};

function fechaLegible(fecha: string): string {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(fecha));
}

export function SeguimientoReporte({ reporte }: { reporte: Reporte }) {
  const guardarSeguimiento = usePanel((estado) => estado.registrarSeguimientoReporte);
  const guardando = usePanel(seleccionarGuardando);
  const [abierto, setAbierto] = useState(false);
  const [modoActividad, setModoActividad] = useState<"ronda" | "evidencia">("ronda");
  const [plan, setPlan] = useState(reporte.accionCorrectiva ?? "");
  const [responsablePlan, setResponsablePlan] = useState(reporte.responsable ?? "");
  const [fechaLimite, setFechaLimite] = useState(
    reporte.fechaLimite?.slice(0, 10) ?? "",
  );
  const [detalleActividad, setDetalleActividad] = useState("");
  const [responsableActividad, setResponsableActividad] = useState(
    reporte.responsable ?? "",
  );
  const [enlaceActividad, setEnlaceActividad] = useState("");
  const [detalleResolucion, setDetalleResolucion] = useState("");
  const [responsableResolucion, setResponsableResolucion] = useState(
    reporte.responsable ?? "",
  );
  const [enlaceResolucion, setEnlaceResolucion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function registrar(datos: {
    tipo: TipoEvento;
    detalle: string;
    responsable: string;
    fechaLimite?: string;
    evidenciaUrl?: string;
  }) {
    setError(null);
    setMensaje(null);

    try {
      await guardarSeguimiento(reporte.id, datos);
      setMensaje("Seguimiento guardado en la bitácora.");
      return true;
    } catch (fallo) {
      setError(
        fallo instanceof Error ? fallo.message : "No se pudo guardar el seguimiento.",
      );
      return false;
    }
  }

  async function guardarPlan(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    await registrar({
      tipo: "accion",
      detalle: plan,
      responsable: responsablePlan,
      fechaLimite,
    });
  }

  async function guardarActividad(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const guardado = await registrar({
      tipo: modoActividad,
      detalle: detalleActividad,
      responsable: responsableActividad,
      evidenciaUrl: enlaceActividad,
    });
    if (guardado) {
      setDetalleActividad("");
      setEnlaceActividad("");
    }
  }

  async function resolver(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const guardado = await registrar({
      tipo: "resolucion",
      detalle: detalleResolucion,
      responsable: responsableResolucion,
      evidenciaUrl: enlaceResolucion,
    });
    if (guardado) {
      setDetalleResolucion("");
      setEnlaceResolucion("");
    }
  }

  const activo = reporte.estado === "activo";

  return (
    <>
      <Button
        type="button"
        variant="secundario"
        size="sm"
        onClick={() => setAbierto(true)}
        aria-label={`Abrir seguimiento del reporte ${formatearNumero(reporte.folio)}`}
      >
        <ClipboardListIcon aria-hidden />
        Seguimiento
        {reporte.seguimientos.length > 0 ? (
          <span className="font-mono text-xs text-[var(--tinta-tenue)]">
            {reporte.seguimientos.length}
          </span>
        ) : null}
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <p className="font-mono text-xs text-[var(--tinta-tenue)]">
              Folio {formatearNumero(reporte.folio)}
            </p>
            <DialogTitle>Seguimiento del reporte</DialogTitle>
            <DialogDescription>
              Asigna una acción, documenta las rondas y conserva la evidencia en
              una bitácora fechada.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-[var(--semaforo-rojo)] bg-[var(--semaforo-rojo-fondo)] p-3 text-sm text-[var(--semaforo-rojo)]"
            >
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}
          {mensaje ? (
            <p role="status" className="text-sm text-[var(--semaforo-verde)]">
              {mensaje}
            </p>
          ) : null}

          {activo ? (
            <div className="space-y-5">
              <section aria-labelledby={`plan-${reporte.id}`}>
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardListIcon className="size-4 text-[var(--tinta-tenue)]" aria-hidden />
                  <h3
                    id={`plan-${reporte.id}`}
                    className="text-sm font-semibold text-[var(--tinta)]"
                  >
                    Acción correctiva
                  </h3>
                </div>
                <form onSubmit={guardarPlan} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`plan-detalle-${reporte.id}`}>Medida acordada</Label>
                    <Textarea
                      id={`plan-detalle-${reporte.id}`}
                      required
                      minLength={8}
                      maxLength={800}
                      value={plan}
                      onChange={(evento) => setPlan(evento.target.value)}
                      placeholder="Describe qué debe corregirse y cómo se verificará."
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`plan-responsable-${reporte.id}`}>
                        Responsable asignado
                      </Label>
                      <Input
                        id={`plan-responsable-${reporte.id}`}
                        required
                        maxLength={100}
                        value={responsablePlan}
                        onChange={(evento) => setResponsablePlan(evento.target.value)}
                        placeholder="Nombre o cargo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`plan-fecha-${reporte.id}`}>Fecha límite</Label>
                      <Input
                        id={`plan-fecha-${reporte.id}`}
                        type="date"
                        required
                        value={fechaLimite}
                        onChange={(evento) => setFechaLimite(evento.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="secundario" disabled={guardando}>
                    <CheckIcon aria-hidden />
                    {guardando ? "Guardando…" : "Guardar asignación"}
                  </Button>
                </form>
              </section>

              <section
                aria-labelledby={`actividad-${reporte.id}`}
                className="border-t border-[var(--borde)] pt-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <MapPinIcon className="size-4 text-[var(--tinta-tenue)]" aria-hidden />
                  <h3
                    id={`actividad-${reporte.id}`}
                    className="text-sm font-semibold text-[var(--tinta)]"
                  >
                    Ronda y evidencia
                  </h3>
                </div>
                <div className="mb-3 inline-flex rounded-md border border-[var(--borde)] p-0.5">
                  {([
                    ["ronda", "Registrar ronda"],
                    ["evidencia", "Añadir evidencia"],
                  ] as const).map(([modo, etiqueta]) => (
                    <button
                      key={modo}
                      type="button"
                      aria-pressed={modoActividad === modo}
                      onClick={() => setModoActividad(modo)}
                      className={
                        modoActividad === modo
                          ? "rounded-sm bg-[var(--bosque-lavado)] px-3 py-1.5 text-xs font-medium text-[var(--bosque-tinta)]"
                          : "rounded-sm px-3 py-1.5 text-xs font-medium text-[var(--tinta-tenue)] hover:text-[var(--tinta)]"
                      }
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>
                <form onSubmit={guardarActividad} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`actividad-detalle-${reporte.id}`}>
                      {modoActividad === "ronda"
                        ? "Resultado de la ronda"
                        : "Descripción de la evidencia"}
                    </Label>
                    <Textarea
                      id={`actividad-detalle-${reporte.id}`}
                      required
                      minLength={8}
                      maxLength={800}
                      value={detalleActividad}
                      onChange={(evento) => setDetalleActividad(evento.target.value)}
                      placeholder={
                        modoActividad === "ronda"
                          ? "Indica cuándo se supervisó y qué se observó."
                          : "Explica qué demuestra el documento o fotografía."
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`actividad-responsable-${reporte.id}`}>
                        Personal que registra
                      </Label>
                      <Input
                        id={`actividad-responsable-${reporte.id}`}
                        required={modoActividad === "ronda"}
                        maxLength={100}
                        value={responsableActividad}
                        onChange={(evento) => setResponsableActividad(evento.target.value)}
                        placeholder="Nombre o cargo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`actividad-enlace-${reporte.id}`}>
                        Enlace a evidencia
                        {modoActividad === "ronda" ? (
                          <span className="font-normal"> (opcional)</span>
                        ) : null}
                      </Label>
                      <Input
                        id={`actividad-enlace-${reporte.id}`}
                        type="url"
                        required={modoActividad === "evidencia"}
                        value={enlaceActividad}
                        onChange={(evento) => setEnlaceActividad(evento.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="secundario" disabled={guardando}>
                    {modoActividad === "ronda" ? (
                      <MapPinIcon aria-hidden />
                    ) : (
                      <PaperclipIcon aria-hidden />
                    )}
                    {guardando ? "Guardando…" : "Añadir a la bitácora"}
                  </Button>
                </form>
              </section>

              <section
                aria-labelledby={`resolver-${reporte.id}`}
                className="border-t border-[var(--borde)] pt-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <CheckIcon className="size-4 text-[var(--tinta-tenue)]" aria-hidden />
                  <h3
                    id={`resolver-${reporte.id}`}
                    className="text-sm font-semibold text-[var(--tinta)]"
                  >
                    Cerrar reporte
                  </h3>
                </div>
                <form onSubmit={resolver} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`resolucion-detalle-${reporte.id}`}>
                      Resultado y verificación
                    </Label>
                    <Textarea
                      id={`resolucion-detalle-${reporte.id}`}
                      required
                      minLength={8}
                      maxLength={800}
                      value={detalleResolucion}
                      onChange={(evento) => setDetalleResolucion(evento.target.value)}
                      placeholder="Describe qué se corrigió y cómo se comprobó."
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`resolucion-responsable-${reporte.id}`}>
                        Personal que verifica
                      </Label>
                      <Input
                        id={`resolucion-responsable-${reporte.id}`}
                        required
                        maxLength={100}
                        value={responsableResolucion}
                        onChange={(evento) => setResponsableResolucion(evento.target.value)}
                        placeholder="Nombre o cargo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`resolucion-enlace-${reporte.id}`}>
                        Enlace a evidencia
                      </Label>
                      <Input
                        id={`resolucion-enlace-${reporte.id}`}
                        type="url"
                        required
                        value={enlaceResolucion}
                        onChange={(evento) => setEnlaceResolucion(evento.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={guardando}>
                    <CheckIcon aria-hidden />
                    {guardando ? "Guardando…" : "Resolver con registro"}
                  </Button>
                </form>
              </section>
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-md border border-[var(--semaforo-verde)] bg-[var(--semaforo-verde-fondo)] p-3 text-sm text-[var(--semaforo-verde)]">
              <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              Reporte resuelto. El historial se conserva y el puntaje se actualiza.
            </p>
          )}

          <section
            aria-labelledby={`bitacora-${reporte.id}`}
            className="border-t border-[var(--borde)] pt-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3
                id={`bitacora-${reporte.id}`}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--tinta)]"
              >
                <HistoryIcon className="size-4 text-[var(--tinta-tenue)]" aria-hidden />
                Bitácora
              </h3>
              <span className="font-mono text-xs text-[var(--tinta-tenue)]">
                {reporte.seguimientos.length} evento
                {reporte.seguimientos.length === 1 ? "" : "s"}
              </span>
            </div>
            {reporte.accionCorrectiva ? (
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-l-2 border-[var(--bosque)] pl-3 text-xs">
                <span className="font-medium text-[var(--tinta)]">
                  Asignado a {reporte.responsable}
                </span>
                {reporte.fechaLimite ? (
                  <span className="flex items-center gap-1 text-[var(--tinta-tenue)]">
                    <Clock3Icon className="size-3.5" aria-hidden />
                    Vence {fechaLegible(reporte.fechaLimite)}
                  </span>
                ) : null}
                <p className="w-full text-[var(--tinta-suave)]">
                  {reporte.accionCorrectiva}
                </p>
              </div>
            ) : null}
            {reporte.seguimientos.length > 0 ? (
              <ol className="space-y-3">
                {reporte.seguimientos.map((evento) => (
                  <li key={evento.id} className="flex min-w-0 gap-2.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--borde-fuerte)]" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <p className="text-xs font-semibold text-[var(--tinta)]">
                          {ETIQUETAS[evento.tipo]}
                        </p>
                        <time
                          dateTime={evento.creadoEn}
                          className="font-mono text-[0.6875rem] text-[var(--tinta-tenue)]"
                        >
                          {tiempoRelativo(evento.creadoEn)}
                        </time>
                      </div>
                      <p className="mt-0.5 break-words text-xs leading-relaxed text-[var(--tinta-suave)]">
                        {evento.detalle}
                      </p>
                      {evento.responsable ? (
                        <p className="mt-1 text-[0.6875rem] text-[var(--tinta-tenue)]">
                          Registrado por {evento.responsable}
                        </p>
                      ) : null}
                      {evento.evidenciaUrl ? (
                        <a
                          href={evento.evidenciaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--bosque-tinta)] underline underline-offset-2"
                        >
                          <LinkIcon className="size-3.5" aria-hidden />
                          Abrir evidencia
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[var(--tinta-tenue)]">
                Todavía no hay eventos en la bitácora.
              </p>
            )}
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
}