"use client";

import { useEffect } from "react";

import { usePanel } from "@/store/use-panel";

/**
 * Carga los datos desde la base de datos.
 *
 * Se monta una sola vez, en el layout raíz. Al abrirse pide `/api/estado` y
 * deja el catálogo de comercios y el historial de denuncias en el store, que
 * es lo que pintan el tablero y el canal de quejas.
 *
 * Mientras la petición viaja, las páginas que dependen de estos datos
 * muestran un estado de carga. No hace falta coordinarse con el HTML del
 * servidor: el servidor también los dibuja vacíos, así que el primer render
 * del cliente coincide con él y no hay salto de hidratación.
 */
export function CargaDatos() {
  const cargarEstado = usePanel((estado) => estado.cargarEstado);

  useEffect(() => {
    void cargarEstado();
  }, [cargarEstado]);

  return null;
}