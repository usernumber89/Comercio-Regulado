import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE_ADMIN = "comercio_regulado_admin";
export const DURACION_SESION_ADMIN = 8 * 60 * 60;

const PASSWORD_MINIMO_BYTES = 12;
const SECRETO_MINIMO_BYTES = 32;

export function autenticacionAdminConfigurada(): boolean {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secreto = process.env.ADMIN_SESSION_SECRET ?? "";

  return (
    Buffer.byteLength(password, "utf8") >= PASSWORD_MINIMO_BYTES &&
    Buffer.byteLength(secreto, "utf8") >= SECRETO_MINIMO_BYTES
  );
}

export function coincidePasswordAdmin(password: string): boolean {
  const configurada = process.env.ADMIN_PASSWORD ?? "";
  const candidata = Buffer.from(password, "utf8");
  const esperada = Buffer.from(configurada, "utf8");

  return (
    autenticacionAdminConfigurada() &&
    candidata.length === esperada.length &&
    timingSafeEqual(candidata, esperada)
  );
}

function firma(expira: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "")
    .update(expira)
    .digest("base64url");
}

export function crearTokenAdmin(): string {
  const expira = String(Date.now() + DURACION_SESION_ADMIN * 1000);
  return `${expira}.${firma(expira)}`;
}

export function tokenAdminValido(token: string | undefined): boolean {
  if (!token || !autenticacionAdminConfigurada()) return false;

  const separador = token.indexOf(".");
  if (separador < 1) return false;

  const expira = token.slice(0, separador);
  const firmaRecibida = Buffer.from(token.slice(separador + 1), "base64url");
  const expiraEn = Number(expira);
  if (!Number.isSafeInteger(expiraEn) || expiraEn <= Date.now()) return false;

  const firmaEsperada = Buffer.from(firma(expira), "base64url");
  return (
    firmaRecibida.length === firmaEsperada.length &&
    timingSafeEqual(firmaRecibida, firmaEsperada)
  );
}

export async function tieneSesionAdmin(): Promise<boolean> {
  if (!autenticacionAdminConfigurada()) return false;
  const almacen = await cookies();
  return tokenAdminValido(almacen.get(COOKIE_ADMIN)?.value);
}