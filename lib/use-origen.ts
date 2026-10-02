"use client";

import { useSyncExternalStore } from "react";

import { SITIO_URL } from "@/data/sitio";

/** Se suscribe a nada: el origen no cambia durante la vida de la página. */
const suscribir = () => () => {};

const leerCliente = () => window.location.origin;

/**
 * Origen real del sitio, seguro para renderizar en el servidor.
 *
 * Sirve para armar URLs absolutas —el destino del QR y el enlace que se
 * comparte por WhatsApp— de modo que funcionen igual en localhost, en una IP
 * de red y en el despliegue. `useSyncExternalStore` es lo correcto aquí en
 * lugar de leer `window` en un efecto: el servidor devuelve `SITIO_URL`, el
 * cliente devuelve el origen real, y React resuelve la diferencia durante la
 * hidratación sin adivinar nada.
 */
export function useOrigen(): string {
  return useSyncExternalStore(suscribir, leerCliente, () => SITIO_URL);
}
