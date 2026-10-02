import { TIPOS_INCIDENTE } from "@/data/sitio";
import { formatearFechaLarga, formatearNumero } from "@/lib/format";
import type { Reporte } from "@/types";

/**
 * Comprobante de un reporte.
 *
 * Se imprime con tipografía monoespaciada y reglas discontinuas, imitando un
 * ticket. Los folios son lo que el vecino cita después en la asamblea, así
 * que el bloque de folio es lo más destacado del comprobante.
 */
export function Comprobante({
  reporte,
  nombreTienda,
  className,
}: {
  reporte: Reporte;
  nombreTienda: string;
  className?: string;
}) {
  return (
    <div
      className={
        className ??
        "rounded-lg border border-dashed border-[var(--borde-fuerte)] bg-[var(--hundido)] p-5"
      }
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-xs text-[var(--tinta-tenue)]">Folio</p>
        <p className="font-mono text-2xl font-semibold text-[var(--tinta)]">
          {formatearNumero(reporte.folio)}
        </p>
      </div>

      <dl className="mt-4 space-y-2.5 border-t border-dashed border-[var(--borde-fuerte)] pt-4 font-mono text-xs">
        {[
          ["Tienda", nombreTienda],
          ["Tipo", TIPOS_INCIDENTE[reporte.tipo].etiqueta],
          ["Estado", reporte.estado === "activo" ? "Activo" : "Resuelto"],
          ["Registro", formatearFechaLarga(reporte.creadoEn)],
          [" remitido por", reporte.anonimo ? "Vecino anónimo" : "Vecino identificado"],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-[var(--tinta-tenue)]">{rotulo}</dt>
            <dd className="text-right text-[var(--tinta)]">{valor}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 border-t border-dashed border-[var(--borde-fuerte)] pt-4 text-sm leading-relaxed text-[var(--tinta-suave)]">
        {reporte.descripcion}
      </p>
    </div>
  );
}
