import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

import { obtenerPrisma } from "@/lib/db";

export const COOKIE_COMERCIANTE = "comercio_regulado_comerciante";
export const DURACION_SESION_COMERCIANTE = 8 * 60 * 60;
const DURACION_INVITACION_MS = 7 * 86_400_000;

function secreto(): string {
  const valor = process.env.ADMIN_SESSION_SECRET ?? "";
  if (Buffer.byteLength(valor, "utf8") < 32) {
    throw new Error("ADMIN_SESSION_SECRET debe tener al menos 32 bytes.");
  }
  return valor;
}

function resumenCodigo(codigo: string): string {
  return createHmac("sha256", secreto()).update(codigo).digest("hex");
}

function derivarClave(password: string, sal: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, sal, 64, (error, resultado) => {
      if (error) reject(error);
      else resolve(resultado);
    });
  });
}

export async function crearInvitacionComerciante(tiendaId: string): Promise<{
  codigo: string;
  expiraEn: Date;
}> {
  const db = obtenerPrisma();

  const ahora = new Date();
  await db.invitacionComerciante.updateMany({
    where: { tiendaId, usadaEn: null, expiraEn: { gt: ahora } },
    data: { expiraEn: ahora },
  });

  const codigo = randomBytes(32).toString("base64url");
  const expiraEn = new Date(ahora.getTime() + DURACION_INVITACION_MS);
  await db.invitacionComerciante.create({
    data: { tiendaId, codigoHash: resumenCodigo(codigo), expiraEn },
  });

  return { codigo, expiraEn };
}

export async function activarCuentaComerciante(
  codigo: string,
  password: string,
): Promise<{ tiendaId: string } | undefined> {
  const db = obtenerPrisma();
  const invitacion = await db.invitacionComerciante.findUnique({
    where: { codigoHash: resumenCodigo(codigo) },
    select: { id: true, tiendaId: true, expiraEn: true, usadaEn: true },
  });
  const ahora = new Date();
  if (!invitacion || invitacion.usadaEn || invitacion.expiraEn <= ahora) {
    return undefined;
  }

  const sal = randomBytes(16);
  const hash = await derivarClave(password, sal);
  const actualizacion = await db.invitacionComerciante.updateMany({
    where: {
      id: invitacion.id,
      usadaEn: null,
      expiraEn: { gt: ahora },
    },
    data: { usadaEn: ahora },
  });
  if (actualizacion.count !== 1) return undefined;

  await db.cuentaComerciante.upsert({
    where: { tiendaId: invitacion.tiendaId },
    create: {
      tiendaId: invitacion.tiendaId,
      passwordHash: `${sal.toString("base64url")}.${hash.toString("base64url")}`,
    },
    update: {
      passwordHash: `${sal.toString("base64url")}.${hash.toString("base64url")}`,
    },
  });

  return { tiendaId: invitacion.tiendaId };
}

export async function validarCredencialesComerciante(
  codigoTienda: string,
  password: string,
): Promise<string | undefined> {
  const cuenta = await obtenerPrisma().cuentaComerciante.findFirst({
    where: { tienda: { codigo: codigoTienda.trim().toUpperCase() } },
    select: { tiendaId: true, passwordHash: true },
  });
  if (!cuenta) return undefined;

  const [salTexto, hashTexto, extra] = cuenta.passwordHash.split(".");
  if (!salTexto || !hashTexto || extra) return undefined;
  const sal = Buffer.from(salTexto, "base64url");
  const hashEsperado = Buffer.from(hashTexto, "base64url");
  const hashRecibido = await derivarClave(password, sal);
  if (
    hashEsperado.length !== hashRecibido.length ||
    !timingSafeEqual(hashEsperado, hashRecibido)
  ) {
    return undefined;
  }
  return cuenta.tiendaId;
}

function firmar(valor: string): Buffer {
  return createHmac("sha256", secreto()).update(valor).digest();
}

export function crearTokenComerciante(tiendaId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      tiendaId,
      expira: Date.now() + DURACION_SESION_COMERCIANTE * 1000,
    }),
  ).toString("base64url");
  return `${payload}.${firmar(payload).toString("base64url")}`;
}

export function tiendaDeTokenComerciante(token: string | undefined): string | undefined {
  if (!token) return undefined;
  const separador = token.lastIndexOf(".");
  if (separador < 1) return undefined;

  const payload = token.slice(0, separador);
  const recibida = Buffer.from(token.slice(separador + 1), "base64url");
  const esperada = firmar(payload);
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) {
    return undefined;
  }

  try {
    const datos: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      !datos ||
      typeof datos !== "object" ||
      !("tiendaId" in datos) ||
      !("expira" in datos) ||
      typeof datos.tiendaId !== "string" ||
      typeof datos.expira !== "number" ||
      !Number.isSafeInteger(datos.expira) ||
      datos.expira <= Date.now()
    ) {
      return undefined;
    }
    return datos.tiendaId;
  } catch {
    return undefined;
  }
}

export async function tiendaSesionComerciante(): Promise<string | undefined> {
  const almacen = await cookies();
  return tiendaDeTokenComerciante(
    almacen.get(COOKIE_COMERCIANTE)?.value,
  );
}
