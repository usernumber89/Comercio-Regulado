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
  ShieldAlertIcon,
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
import { Checkbox, Label } from "@/components/ui/form-controls";
import { Input, Textarea } from "@/components/ui/input";
import { TIPOS_INCIDENTE } from "@/data/sitio";
import { sumarDiasHabiles } from "@/lib/cumplimiento";
import { formatearNumero, tiempoRelativo } from "@/lib/format";
import { seleccionarGuardando, usePanel } from "@/store/use-panel";
import type {
  CategoriaConducta,
  GravedadInfraccion,
  Reporte,
  TipoSeguimientoReporte,
} from "@/types";

type TipoEvento = Exclude<TipoSeguimientoReporte, "reapertura">;

const ETIQUETAS: Record<TipoSeguimientoReporte, string> = {
  accion: "Plan correctivo asignado",
  ronda: "Ronda preventiva",
  evidencia: "Evidencia registrada",
  resolucion: "Reporte resuelto",
  medida_preventiva: "Medida preventiva temporal",
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
  const validarReporte = usePanel((estado) => estado.validarReporte);
  const registrarSubsanacion = usePanel((estado) => estado.registrarSubsanacion);
  const resolverImpugnacion = usePanel((estado) => estado.resolverImpugnacionReporte);
  const registrarSancion = usePanel((estado) => estado.registrarSancionReporte);
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
  const [detalleMedidaPreventiva, setDetalleMedidaPreventiva] = useState("");
  const [responsableMedidaPreventiva, setResponsableMedidaPreventiva] = useState("");
  const [vigenciaMedidaPreventiva, setVigenciaMedidaPreventiva] = useState("");
  const [peligroSaludSeguridadConfirmado, setPeligroSaludSeguridadConfirmado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [revisor, setRevisor] = useState("");
  const [rolRevisor, setRolRevisor] = useState<"administrador" | "comision_arbitro">("comision_arbitro");
  const [declaracionImparcialidad, setDeclaracionImparcialidad] = useState(false);
  const [resolucionImpugnacion, setResolucionImpugnacion] = useState("");
  const [tipoSancion, setTipoSancion] = useState<Reporte["sanciones"][number]["tipo"]>("amonestacion_escrita");
  const [motivoSancion, setMotivoSancion] = useState("");
  const [resolucionSancion, setResolucionSancion] = useState("");
  const [fechaAudiencia, setFechaAudiencia] = useState(new Date().toISOString().slice(0, 10));
  const [diasSuspension, setDiasSuspension] = useState("15");
  const [clasificacionConfirmada, setClasificacionConfirmada] = useState(false);
  const [categoriaOtra, setCategoriaOtra] = useState<CategoriaConducta>("sanitaria_productos");
  const [gravedadOtra, setGravedadOtra] = useState<GravedadInfraccion>("grave");

  async function ejecutar(
    operacion: () => Promise<Reporte>,
    exito: string,
  ) {
    setError(null);
    setMensaje(null);
    try {
      await operacion();
      setMensaje(exito);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo actualizar el expediente.");
    }
  }

  async function registrarDecisionSancion(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    await ejecutar(
      () =>
        registrarSancion(reporte.id, {
          tipo: tipoSancion,
          motivo: motivoSancion,
          resolucion: resolucionSancion,
          audienciaEn: fechaAudiencia,
          diasSuspension: tipoSancion === "suspension" ? Number(diasSuspension) : null,
        }),
      "Resolución sancionatoria guardada en el expediente.",
    );
  }

  async function resolverRecurso(confirmar: boolean) {
    await ejecutar(
      () =>
        resolverImpugnacion(reporte.id, {
          confirmar,
          revisor,
          rol: rolRevisor,
          declaracionImparcialidad,
          resolucion: resolucionImpugnacion,
        }),
      confirmar
        ? "Calificación confirmada. Se notificará la resolución al comerciante."
        : "Reporte revocado. La calificación quedó sin efecto.",
    );
  }

  async function registrar(datos: {
    tipo: TipoEvento;
    detalle: string;
    responsable: string;
    fechaLimite?: string;
    evidenciaUrl?: string;
    vigenteHasta?: string;
    peligroSaludSeguridad?: boolean;
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

  async function registrarMedidaPreventiva(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const guardado = await registrar({
      tipo: "medida_preventiva",
      detalle: detalleMedidaPreventiva,
      responsable: responsableMedidaPreventiva,
      vigenteHasta: vigenciaMedidaPreventiva,
      peligroSaludSeguridad: peligroSaludSeguridadConfirmado,
    });
    if (guardado) {
      setDetalleMedidaPreventiva("");
      setVigenciaMedidaPreventiva("");
      setPeligroSaludSeguridadConfirmado(false);
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

          <section aria-labelledby={`calificacion-${reporte.id}`} className="space-y-4 border-t border-[var(--borde)] pt-4">
            <div>
              <h3 id={`calificacion-${reporte.id}`} className="flex items-center gap-2 text-sm font-semibold text-[var(--tinta)]">
                <ShieldAlertIcon className="size-4 text-[var(--tinta-tenue)]" aria-hidden />
                Calificación y procedimiento
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--tinta-tenue)]">
                {TIPOS_INCIDENTE[reporte.tipo].etiqueta} · la revisión asigna gravedad y categoría conforme al reglamento.
              </p>
            </div>

            {!reporte.validado ? (
              <div className="rounded-md border border-[var(--borde)] bg-[var(--hundido)] p-3">
                <p className="text-sm text-[var(--tinta-suave)]">
                  Pendiente de verificación. Los reportes no validados no descuentan puntos ni permiten imponer sanciones.
                </p>
                {reporte.tipo === "otro" ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`categoria-otra-${reporte.id}`}>Categoría de conducta</Label>
                      <select id={`categoria-otra-${reporte.id}`} value={categoriaOtra} onChange={(evento) => setCategoriaOtra(evento.target.value as CategoriaConducta)} className="h-10 w-full rounded-md border border-[var(--borde-fuerte)] bg-[var(--superficie)] px-3 text-sm text-[var(--tinta)]">
                        <option value="horarios_proveedores">Horarios y Proveedores</option>
                        <option value="convivencia_ruidos_circulacion">Convivencia, Ruidos y Circulación</option>
                        <option value="sanitaria_productos">Sanitaria y Productos Autorizados</option>
                        <option value="publicidad_fachadas">Publicidad y Fachadas</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`gravedad-otra-${reporte.id}`}>Gravedad comprobada</Label>
                      <select id={`gravedad-otra-${reporte.id}`} value={gravedadOtra} onChange={(evento) => setGravedadOtra(evento.target.value as GravedadInfraccion)} className="h-10 w-full rounded-md border border-[var(--borde-fuerte)] bg-[var(--superficie)] px-3 text-sm text-[var(--tinta)]">
                        <option value="leve">Leve · 10 puntos</option>
                        <option value="grave">Grave · 20 puntos</option>
                        <option value="muy_grave">Muy grave · 40 puntos</option>
                      </select>
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 flex items-start gap-2">
                  <Checkbox id={`verificada-${reporte.id}`} checked={clasificacionConfirmada} onCheckedChange={(valor) => setClasificacionConfirmada(valor === true)} />
                  <Label htmlFor={`verificada-${reporte.id}`} className="font-normal leading-relaxed">
                    Verifiqué los hechos y que la conducta encaja en el reglamento. Desacato excluye discrepancias respetuosas y recursos formales; alteración arquitectónica requiere modificación estructural permanente, demolición o alteración de fachada/elemento portante exterior.
                  </Label>
                </div>
                <Button
                  type="button"
                  className="mt-3"
                  disabled={guardando || !clasificacionConfirmada}
                  onClick={() => void ejecutar(
                    () => validarReporte(reporte.id, {
                      confirmadaClasificacion: clasificacionConfirmada,
                      ...(reporte.tipo === "otro"
                        ? { categoria: categoriaOtra, gravedad: gravedadOtra }
                        : {}),
                    }),
                    "Reporte validado y calificado. El comerciante puede impugnarlo durante cinco días hábiles.",
                  )}
                >
                  <CheckIcon aria-hidden />
                  {guardando ? "Validando…" : "Validar y calificar"}
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-[var(--borde)] bg-[var(--hundido)] p-3">
                <p className="text-sm font-medium text-[var(--tinta)]">
                  {reporte.gravedad === "leve"
                    ? "Infracción leve · −10 puntos (−5 con subsanación a tiempo)"
                    : reporte.gravedad === "grave"
                      ? "Infracción grave · −20 puntos"
                      : "Infracción muy grave · −40 puntos"}
                </p>
                <p className="mt-1 text-xs text-[var(--tinta-tenue)]">
                  Notificada {reporte.validadoEn ? tiempoRelativo(reporte.validadoEn) : ""}
                  {reporte.fechaSubsanacion
                    ? ` · subsanación hasta ${fechaLegible(reporte.fechaSubsanacion)}`
                    : ""}
                </p>
                {reporte.gravedad === "muy_grave" ? (
                  <p role="alert" className="mt-2 text-sm font-medium text-[var(--terracota-tinta)]">
                    Evaluación y audiencia prioritaria de Junta dentro de cinco días hábiles, aun si el puntaje permanece Amarillo.
                  </p>
                ) : null}
                {reporte.gravedad === "leve" && !reporte.subsanadoEn ? (
                  <Button
                    type="button"
                    variant="secundario"
                    size="sm"
                    className="mt-3"
                    disabled={guardando}
                    onClick={() => void ejecutar(
                      () => registrarSubsanacion(reporte.id),
                      "Subsanación registrada. Si se completó en plazo, la deducción baja a cinco puntos.",
                    )}
                  >
                    Registrar subsanación verificada
                  </Button>
                ) : null}
                {reporte.subsanadoEn ? (
                  <p className="mt-2 text-xs text-[var(--semaforo-verde)]">
                    Subsanación verificada {tiempoRelativo(reporte.subsanadoEn)}
                  </p>
                ) : null}
              </div>
            )}

            {reporte.impugnacionEstado === "pendiente" ? (
              <div className="space-y-3 rounded-md border border-[var(--semaforo-amarillo)] bg-[var(--semaforo-amarillo-fondo)] p-3">
                <p className="text-sm font-semibold text-[var(--tinta)]">
                  Impugnación en trámite · puntaje y sanciones suspendidos
                </p>
                <p className="text-sm leading-relaxed text-[var(--tinta-suave)]">
                  {reporte.impugnacionMotivo}
                </p>
                {reporte.impugnacionEn ? (
                  <p className="text-xs text-[var(--tinta-tenue)]">
                    Acuse inmediato · resolver antes de {fechaLegible(
                      new Date(
                        sumarDiasHabiles(new Date(reporte.impugnacionEn), 10),
                      ).toISOString(),
                    )}
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`revisor-${reporte.id}`}>Nombre del revisor imparcial</Label>
                    <Input id={`revisor-${reporte.id}`} required minLength={3} maxLength={100} value={revisor} onChange={(evento) => setRevisor(evento.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`rol-revisor-${reporte.id}`}>Órgano revisor</Label>
                    <select
                      id={`rol-revisor-${reporte.id}`}
                      value={rolRevisor}
                      onChange={(evento) => setRolRevisor(evento.target.value as typeof rolRevisor)}
                      className="h-10 w-full rounded-md border border-[var(--borde-fuerte)] bg-[var(--superficie)] px-3 text-sm text-[var(--tinta)]"
                    >
                      <option value="comision_arbitro">Comisión Árbitro de la Junta</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id={`imparcial-${reporte.id}`} checked={declaracionImparcialidad} onCheckedChange={(valor) => setDeclaracionImparcialidad(valor === true)} />
                  <Label htmlFor={`imparcial-${reporte.id}`} className="font-normal leading-relaxed">
                    Declaro que no soy reportante ni resido en una vivienda colindante al establecimiento y que carezco de conflicto de interés.
                  </Label>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`resolucion-impugnacion-${reporte.id}`}>Resolución motivada</Label>
                  <Textarea
                    id={`resolucion-impugnacion-${reporte.id}`}
                    required
                    minLength={20}
                    maxLength={1500}
                    value={resolucionImpugnacion}
                    onChange={(evento) => setResolucionImpugnacion(evento.target.value)}
                    placeholder="Explica la revisión realizada y los motivos para confirmar o revocar la calificación."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={guardando || !declaracionImparcialidad || revisor.trim().length < 3 || resolucionImpugnacion.trim().length < 20} onClick={() => void resolverRecurso(false)}>
                    Revocar reporte
                  </Button>
                  <Button type="button" variant="secundario" disabled={guardando || !declaracionImparcialidad || revisor.trim().length < 3 || resolucionImpugnacion.trim().length < 20} onClick={() => void resolverRecurso(true)}>
                    Confirmar calificación
                  </Button>
                </div>
              </div>
            ) : reporte.impugnacionEstado !== "ninguna" ? (
              <p className="text-xs text-[var(--tinta-tenue)]">
                Impugnación {reporte.impugnacionEstado === "confirmada" ? "resuelta: calificación confirmada" : "resuelta: reporte revocado"}
                {reporte.revisorImpugnacion ? ` por ${reporte.revisorImpugnacion} (${reporte.rolRevisorImpugnacion === "comision_arbitro" ? "Comisión Árbitro" : "Administración"})` : ""}
                {reporte.resolucionImpugnacion ? ` · Resolución: ${reporte.resolucionImpugnacion}` : ""}
              </p>
            ) : null}

            {reporte.validado && reporte.impugnacionEstado === "pendiente" ? (
              <form
                onSubmit={registrarMedidaPreventiva}
                className="space-y-3 rounded-md border border-[var(--semaforo-rojo)] bg-[var(--semaforo-rojo-fondo)] p-3"
              >
                <div>
                  <h4 className="text-sm font-semibold text-[var(--tinta)]">Medida preventiva temporal</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--tinta-suave)]">
                    Durante la impugnación solo se permite cuando exista peligro para la salud o la seguridad. No equivale a una sanción formal.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`detalle-medida-${reporte.id}`}>Peligro identificado y medida adoptada</Label>
                  <Textarea
                    id={`detalle-medida-${reporte.id}`}
                    required
                    minLength={20}
                    maxLength={800}
                    value={detalleMedidaPreventiva}
                    onChange={(evento) => setDetalleMedidaPreventiva(evento.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`responsable-medida-${reporte.id}`}>Responsable</Label>
                    <Input
                      id={`responsable-medida-${reporte.id}`}
                      required
                      maxLength={100}
                      value={responsableMedidaPreventiva}
                      onChange={(evento) => setResponsableMedidaPreventiva(evento.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`vigencia-medida-${reporte.id}`}>Vigente hasta</Label>
                    <Input
                      id={`vigencia-medida-${reporte.id}`}
                      type="date"
                      required
                      value={vigenciaMedidaPreventiva}
                      onChange={(evento) => setVigenciaMedidaPreventiva(evento.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id={`peligro-medida-${reporte.id}`}
                    checked={peligroSaludSeguridadConfirmado}
                    onCheckedChange={(valor) => setPeligroSaludSeguridadConfirmado(valor === true)}
                  />
                  <Label htmlFor={`peligro-medida-${reporte.id}`} className="font-normal leading-relaxed">
                    Confirmo que existe un peligro actual para la salud o la seguridad y que la medida es temporal.
                  </Label>
                </div>
                <Button type="submit" disabled={guardando || !peligroSaludSeguridadConfirmado}>
                  Registrar medida preventiva
                </Button>
              </form>
            ) : null}

            {reporte.validado && reporte.impugnacionEstado !== "pendiente" ? (
              <details className="rounded-md border border-[var(--borde)] p-3">
                <summary className="cursor-pointer text-sm font-medium text-[var(--tinta)]">
                  Registrar resolución formal de Junta
                </summary>
                <form onSubmit={registrarDecisionSancion} className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`sancion-tipo-${reporte.id}`}>Tipo de resolución</Label>
                      <select
                        id={`sancion-tipo-${reporte.id}`}
                        value={tipoSancion}
                        onChange={(evento) => setTipoSancion(evento.target.value as typeof tipoSancion)}
                        className="h-10 w-full rounded-md border border-[var(--borde-fuerte)] bg-[var(--superficie)] px-3 text-sm text-[var(--tinta)]"
                      >
                        <option value="amonestacion_escrita">Amonestación escrita</option>
                        <option value="suspension">Suspensión temporal</option>
                        <option value="revocacion">Revocación definitiva</option>
                        <option value="medida_correctiva">Medida correctiva</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`audiencia-${reporte.id}`}>Fecha de audiencia previa</Label>
                      <Input id={`audiencia-${reporte.id}`} type="date" required value={fechaAudiencia} onChange={(evento) => setFechaAudiencia(evento.target.value)} />
                    </div>
                  </div>
                  {tipoSancion === "suspension" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor={`dias-suspension-${reporte.id}`}>Duración (días calendario)</Label>
                      <Input id={`dias-suspension-${reporte.id}`} type="number" min={15} max={reporte.gravedad === "muy_grave" ? 30 : 15} required value={diasSuspension} onChange={(evento) => setDiasSuspension(evento.target.value)} />
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor={`motivo-sancion-${reporte.id}`}>Motivo y fundamento</Label>
                    <Textarea id={`motivo-sancion-${reporte.id}`} minLength={12} maxLength={1000} required value={motivoSancion} onChange={(evento) => setMotivoSancion(evento.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`resolucion-sancion-${reporte.id}`}>Resolución motivada</Label>
                    <Textarea id={`resolucion-sancion-${reporte.id}`} minLength={12} maxLength={1500} required value={resolucionSancion} onChange={(evento) => setResolucionSancion(evento.target.value)} />
                  </div>
                  <Button type="submit" variant="secundario" disabled={guardando}>
                    Guardar resolución de Junta
                  </Button>
                </form>
              </details>
            ) : null}

            {reporte.sanciones.length > 0 ? (
              <ul className="space-y-2 border-t border-[var(--borde)] pt-3" aria-label="Historial sancionatorio vigente">
                {reporte.sanciones
                  .map((sancion) => (
                    <li key={sancion.id} className="text-xs leading-relaxed text-[var(--tinta-suave)]">
                      <span className="font-semibold">{sancion.tipo.replaceAll("_", " ")}</span>
                      {" · "}{sancion.resolucion} · {tiempoRelativo(sancion.creadaEn)}
                      {sancion.plazoCumplimiento ? (
                        <span> · plazo final hasta {fechaLegible(sancion.plazoCumplimiento)}</span>
                      ) : null}
                    </li>
                  ))}
              </ul>
            ) : null}
          </section>

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
                      {evento.peligroSaludSeguridad ? (
                        <p className="mt-1 text-[0.6875rem] font-medium text-[var(--semaforo-rojo)]">
                          Peligro para la salud o seguridad confirmado
                          {evento.vigenteHasta ? ` · vigente hasta ${fechaLegible(evento.vigenteHasta)}` : ""}
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