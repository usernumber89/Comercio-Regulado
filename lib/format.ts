const DIA_MS = 86_400_000;

const moneda = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monedaEntera = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("es-SV");

const fechaCorta = new Intl.DateTimeFormat("es-SV", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const fechaLarga = new Intl.DateTimeFormat("es-SV", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** $28.50 */
export function formatearMoneda(valor: number): string {
  return moneda.format(valor);
}

/** $17, redondeado. Para cifras grandes donde los centavos son ruido. */
export function formatearMonedaEntera(valor: number): string {
  return monedaEntera.format(valor);
}

/** 1,240 */
export function formatearNumero(valor: number): string {
  return decimal.format(valor);
}

/** 24 mar 2026 */
export function formatearFecha(iso: string): string {
  return fechaCorta.format(new Date(iso));
}

/** 24 de marzo de 2026 */
export function formatearFechaLarga(iso: string): string {
  return fechaLarga.format(new Date(iso));
}

/**
 * Distancia relativa en días naturales.
 *
 * Se trunca a medianoche en lugar de dividir milisegundos crudos: así el
 * servidor y el cliente coinciden aunque el render cruce la medianoche, lo
 * que evita discrepancias de hidratación en la lista de reportes.
 */
function diasDeDiferencia(iso: string, ahora: number): number {
  const inicio = (marca: number) => {
    const d = new Date(marca);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.round((inicio(ahora) - inicio(new Date(iso).getTime())) / DIA_MS);
}

/** "hace 5 días", "hace 3 meses". */
export function tiempoRelativo(iso: string, ahora = Date.now()): string {
  const dias = diasDeDiferencia(iso, ahora);

  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 31) {
    const semanas = Math.floor(dias / 7);
    return semanas === 1 ? "hace 1 semana" : `hace ${semanas} semanas`;
  }
  if (dias < 365) {
    const meses = Math.floor(dias / 30);
    return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
  }
  const anios = Math.floor(dias / 365);
  return anios === 1 ? "hace 1 año" : `hace ${anios} años`;
}

/** Rango con guion largo, como en los horarios de la ficha. */
export function formatearRango(desde: string, hasta: string): string {
  return `${desde} – ${hasta}`;
}
