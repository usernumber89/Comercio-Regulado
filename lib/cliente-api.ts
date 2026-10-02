import type { BorradorTienda } from "@/lib/tienda-formulario";
import type {
  EstadoSistema,
  Reporte,
  Resena,
  TipoIncidente,
  TipoSeguimientoReporte,
  Tienda,
} from "@/types";

/* ==========================================================================
   LLAMADAS A LA BASE DE DATOS DESDE EL NAVEGADOR
   --------------------------------------------------------------------------
   Una función por operación. Todas devuelven lo que el servidor ya guardó,
   no una estimación local: el estado que ve el usuario siempre es el que
   quedó en la base.
   ========================================================================== */

async function pedir<T>(url: string, opciones?: RequestInit): Promise<T> {
  const respuesta = await fetch(url, {
    ...opciones,
    headers: { "Content-Type": "application/json", ...opciones?.headers },
  });

  const datos = (await respuesta.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!respuesta.ok) {
    throw new Error(datos.error ?? "No se pudo completar la operación.");
  }

  return datos as T;
}

/** Catálogo de comercios, denuncias y reseñas, tal como están guardados. */
export async function obtenerEstado(): Promise<EstadoSistema> {
  return pedir<EstadoSistema>("/api/estado", { cache: "no-store" });
}

/**
 * Registra una reseña.
 *
 * Devuelve la reseña y, si era de una sola estrella, también la denuncia que
 * se abrió con ella: quien la escribió tiene que ver el folio para poder
 * seguirla.
 */
export async function registrarResena(datos: {
  tiendaId: string;
  estrellas: number;
  comentario: string;
  autor: string;
  anonimo: boolean;
}): Promise<{ resena: Resena; reporte: Reporte | null }> {
  return pedir<{ resena: Resena; reporte: Reporte | null }>("/api/resenas", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

/** Registra una denuncia. Devuelve el reporte con su folio. */
export async function registrarReporte(datos: {
  tiendaId: string;
  tipo: TipoIncidente;
  descripcion: string;
  anonimo: boolean;
}): Promise<Reporte> {
  const { reporte } = await pedir<{ reporte: Reporte }>("/api/reportes", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  return reporte;
}

/** Resuelve o reabre una denuncia. */
export async function alternarEstadoReporte(id: string): Promise<Reporte> {
  const { reporte } = await pedir<{ reporte: Reporte }>(
    `/api/reportes/${encodeURIComponent(id)}`,
    { method: "PATCH" },
  );

  return reporte;
}

export async function registrarSeguimientoReporte(
  id: string,
  datos: {
    tipo: Exclude<TipoSeguimientoReporte, "reapertura">;
    detalle: string;
    responsable: string;
    fechaLimite?: string;
    evidenciaUrl?: string;
  },
): Promise<Reporte> {
  const { reporte } = await pedir<{ reporte: Reporte }>(
    `/api/reportes/${encodeURIComponent(id)}/seguimiento`,
    { method: "POST", body: JSON.stringify(datos) },
  );

  return reporte;
}

/** Da de alta un comercio. */
export async function crearTienda(borrador: BorradorTienda): Promise<Tienda> {
  const { tienda } = await pedir<{ tienda: Tienda }>("/api/tiendas", {
    method: "POST",
    body: JSON.stringify(borrador),
  });

  return tienda;
}

/** Guarda los cambios de un comercio existente. */
export async function actualizarTienda(
  id: string,
  borrador: BorradorTienda,
): Promise<Tienda> {
  const { tienda } = await pedir<{ tienda: Tienda }>(
    `/api/tiendas/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(borrador) },
  );
  return tienda;
}

/** Elimina un comercio dado de alta y sus denuncias. */
export async function eliminarTienda(id: string): Promise<void> {
  await pedir<{ ok: true }>(`/api/tiendas/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
