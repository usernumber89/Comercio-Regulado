import { obtenerEstado } from "@/lib/repositorio";

/**
 * Estado completo del sistema en JSON.
 *
 * Es la misma lectura que hacen el tablero y la ficha pública, expuesta como
 * API para poder abrirla en el navegador (`/api/estado`) y ver qué hay
 * guardado, sin entrar a Prisma Studio.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await obtenerEstado());
}
