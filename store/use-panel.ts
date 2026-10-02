"use client";

import { useMemo } from "react";
import { create } from "zustand";

import * as api from "@/lib/cliente-api";
import type { BorradorTienda } from "@/lib/tienda-formulario";
import type { Reporte, Resena, TabId, TipoIncidente, Tienda, TiendaId } from "@/types";

/* ==========================================================================
   ESTADO DEL TABLERO
   --------------------------------------------------------------------------
   Antes de la base de datos, los reportes y los comercios dados de alta se
   guardaban en el `localStorage` del navegador: cada persona tenía su propia
   copia y los datos se perdían al cambiar de equipo.

   Ahora el store no guarda nada. Solo mantiene lo que es de esta pantalla
   (tienda abierta, pestaña, meses del slider) y lo que llegó de la base.
   Las acciones escriben por la API y reemplazan el estado por lo que el
   servidor devolvió, de modo que lo que se ve es siempre lo que quedó
   guardado en la base de datos.
   ========================================================================== */

const MESES_POR_DEFECTO = 6;

export interface DatosReporte {
  tiendaId: TiendaId;
  tipo: TipoIncidente;
  descripcion: string;
  anonimo: boolean;
}

/** Lo que escribe quien opina sobre una tienda. */
export interface DatosOpinion {
  tiendaId: TiendaId;
  estrellas: number;
  comentario: string;
  autor: string;
  anonimo: boolean;
}

/** Lo que devuelve el servidor al guardar una opinión. */
export interface OpinionRecibida {
  resena: Resena;
  /** La denuncia que abrió, si la opinión fue de una sola estrella. */
  reporte: Reporte | null;
}

export interface PanelState {
  /** Tienda abierta en el tablero. Cambiarla actualiza todas las pestañas. */
  tiendaId: TiendaId;
  /** Pestaña activa. Vive en el estado para no recargar la página. */
  tab: TabId;
  /** Meses de comercio interno activo, 1 a 12. Alimenta el tab Beneficio. */
  mesesActivos: number;
  /** Catálogo completo, tal como está en la base de datos. */
  tiendas: Tienda[];
  /** Historial completo de denuncias, de la base de datos. */
  reportes: Reporte[];
  /** Reseñas públicas de todas las tiendas. */
  resenas: Resena[];
  /** `true` hasta que llega la primera lectura de la base. */
  cargando: boolean;
  /** `true` mientras se guarda algo: los botones se desactivan. */
  guardando: boolean;
  /** Mensaje de la última operación que falló, o `null`. */
  error: string | null;

  setTienda: (tiendaId: TiendaId) => void;
  setTab: (tab: TabId) => void;
  setMesesActivos: (meses: number) => void;

  /**
   * Lee el catálogo y las denuncias desde la base de datos.
   *
   * Es lo primero que hace el tablero al abrirse. Va por HTTP a `/api/estado`
   * en vez de leer un archivo del disco porque el store vive en el navegador:
   * el servidor es el único que puede abrir la base.
   */
  cargarEstado: () => Promise<void>;

  /**
   * Deja el store con lo que el servidor acaba de devolver.
   *
   * Se usa después de escribir: en vez de suponer qué cambió, se reemplaza
   * con la respuesta del servidor, que es lo que quedó en la base.
   */
  hidratar: (estado: { tiendas: Tienda[]; reportes: Reporte[]; resenas: Resena[] }) => void;

  registrarReporte: (datos: DatosReporte) => Promise<Reporte>;
  registrarSeguimientoReporte: (
    id: string,
    datos: Parameters<typeof api.registrarSeguimientoReporte>[1],
  ) => Promise<void>;
  /** Guarda una reseña. Si es de una estrella, también devuelve su denuncia. */
  registrarResena: (datos: DatosOpinion) => Promise<OpinionRecibida>;
  alternarEstadoReporte: (id: string) => Promise<void>;
  /** Da de alta una tienda y la deja seleccionada. Devuelve la creada. */
  agregarTienda: (borrador: BorradorTienda) => Promise<Tienda>;
  /** Actualiza la ficha de una tienda existente. */
  actualizarTienda: (id: TiendaId, borrador: BorradorTienda) => Promise<Tienda>;
  /** Elimina un comercio y sus denuncias. */
  eliminarTienda: (id: TiendaId) => Promise<void>;
}

export const usePanel = create<PanelState>()((set, get) => ({
  tiendaId: "",
  tab: "perfil",
  mesesActivos: MESES_POR_DEFECTO,
  tiendas: [],
  reportes: [],
  resenas: [],
  cargando: true,
  guardando: false,
  error: null,

  setTienda: (tiendaId) => set({ tiendaId }),
  setTab: (tab) => set({ tab }),

  setMesesActivos: (meses) =>
    set({ mesesActivos: Math.min(12, Math.max(1, Math.round(meses))) }),

  cargarEstado: async () => {
    set({ cargando: true, error: null });
    try {
      get().hidratar(await api.obtenerEstado());
    } catch (fallo) {
      set({
        error:
          fallo instanceof Error
            ? fallo.message
            : "No se pudo leer la base de datos.",
      });
    } finally {
      set({ cargando: false });
    }
  },

  hidratar: ({ tiendas, reportes, resenas }) => {
    const actual = get().tiendaId;
    const sigue = tiendas.some((t) => t.id === actual);
    set({ tiendas, reportes, resenas, tiendaId: sigue ? actual : (tiendas[0]?.id ?? "") });
  },

  registrarReporte: async (datos) => {
    set({ guardando: true });
    try {
      const reporte = await api.registrarReporte(datos);
      set((estado) => ({ reportes: [reporte, ...estado.reportes] }));
      return reporte;
    } finally {
      set({ guardando: false });
    }
  },

  alternarEstadoReporte: async (id) => {
    const reporte = await api.alternarEstadoReporte(id);
    set((estado) => ({
      reportes: estado.reportes.map((r) => (r.id === id ? reporte : r)),
    }));
  },

  registrarSeguimientoReporte: async (id, datos) => {
    set({ guardando: true });
    try {
      const reporte = await api.registrarSeguimientoReporte(id, datos);
      set((estado) => ({
        reportes: estado.reportes.map((actual) =>
          actual.id === id ? reporte : actual,
        ),
      }));
    } finally {
      set({ guardando: false });
    }
  },

  registrarResena: async (datos) => {
    set({ guardando: true });
    try {
      const guardada = await api.registrarResena(datos);
      set((estado) => ({
        resenas: [guardada.resena, ...estado.resenas],
        // La denuncia de una reseña de una estrella entra también en el
        // historial, para que el tablero la vea y la pueda resolver.
        reportes: guardada.reporte
          ? [guardada.reporte, ...estado.reportes]
          : estado.reportes,
      }));
      return guardada;
    } finally {
      set({ guardando: false });
    }
  },

  agregarTienda: async (borrador) => {
    set({ guardando: true });
    try {
      const tienda = await api.crearTienda(borrador);
      set((estado) => ({ tiendas: [...estado.tiendas, tienda], tiendaId: tienda.id }));
      return tienda;
    } finally {
      set({ guardando: false });
    }
  },

  actualizarTienda: async (id, borrador) => {
    set({ guardando: true });
    try {
      const tienda = await api.actualizarTienda(id, borrador);
      set((estado) => ({
        tiendas: estado.tiendas.map((actual) =>
          actual.id === id ? tienda : actual,
        ),
      }));
      return tienda;
    } finally {
      set({ guardando: false });
    }
  },

  eliminarTienda: async (id) => {
    set({ guardando: true });
    try {
      await api.eliminarTienda(id);
      set((estado) => {
        const tiendas = estado.tiendas.filter((t) => t.id !== id);
        return {
          tiendas,
          reportes: estado.reportes.filter((r) => r.tiendaId !== id),
          tiendaId: estado.tiendaId === id ? (tiendas[0]?.id ?? "") : estado.tiendaId,
        };
      });
    } finally {
      set({ guardando: false });
    }
  },

}));

/* Selectores derivados. Se mantienen fuera del store para no recrearlos. */

export const seleccionarTiendaId = (estado: PanelState) => estado.tiendaId;
export const seleccionarTab = (estado: PanelState) => estado.tab;
export const seleccionarMeses = (estado: PanelState) => estado.mesesActivos;
export const seleccionarReportes = (estado: PanelState) => estado.reportes;
export const seleccionarResenas = (estado: PanelState) => estado.resenas;
export const seleccionarTiendas = (estado: PanelState) => estado.tiendas;
export const seleccionarGuardando = (estado: PanelState) => estado.guardando;
export const seleccionarCargando = (estado: PanelState) => estado.cargando;
export const seleccionarError = (estado: PanelState) => estado.error;

/** Catálogo completo. Ahora viene entero de la base, no de dos fuentes. */
export function useCatalogoTiendas(): Tienda[] {
  return usePanel(seleccionarTiendas);
}

/**
 * Reseñas de una tienda.
 *
 * Las lee del store y no de la base porque el tablero ya tiene la lista entera:
 * el filtro es local y evita otro viaje.
 */
export function useResenasDe(tiendaId: TiendaId): Resena[] {
  const resenas = usePanel(seleccionarResenas);
  return useMemo(() => resenas.filter((r) => r.tiendaId === tiendaId), [resenas, tiendaId]);
}

/**
 * Tienda abierta en el tablero.
 *
 * Devuelve `null` solo durante el primer render del servidor, antes de que el
 * tablero hydrated con lo que leyó la página. El tablero muestra un estado de
 * carga en ese momento en lugar de una ficha vacía.
 */
export function useTiendaActual(): Tienda | null {
  const id = usePanel(seleccionarTiendaId);
  const tiendas = usePanel(seleccionarTiendas);

  return useMemo(() => tiendas.find((t) => t.id === id) ?? null, [tiendas, id]);
}