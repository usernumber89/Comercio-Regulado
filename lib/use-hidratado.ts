"use client";

import { useSyncExternalStore } from "react";

/** No hay nada a lo que suscribirse: la marca se fija al primer render. */
const suscribir = () => () => {};

/**
 * `true` una vez que el código corre en el cliente.
 *
 * La preferencia de tema se lee de `localStorage` justo después de montar.
 * Mientras eso no ha ocurrido, la pantalla muestra el tema del sistema —el
 * mismo que resolvió el servidor—, de modo que no hay discrepancias de
 * hidratación. Los componentes que dependen de esa preferencia usan esta
 * bandera para distinguir "todavía no sé" de "vale cero".
 *
 * `useSyncExternalStore` con un servidor que devuelve `false` y un cliente que
 * devuelve `true` es la forma canónica de expresar este caso: React sabe que
 * el valor cambia en la hidratación y lo tolera, en vez de detectar un
 * `useEffect` que pinta un segundo render entero.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => true,
    () => false,
  );
}
