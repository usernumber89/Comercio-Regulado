import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/prisma/generated/client";

/* ==========================================================================
   CONEXIÓN A LA BASE DE DATOS
   --------------------------------------------------------------------------
   PostgreSQL en Neon, con Prisma. Las tablas están descritas en
   `prisma/schema.prisma` y las reglas de negocio en `lib/repositorio.ts`;
   aquí solo hay una cosa: el cliente.

   Por qué el adaptador de Neon y no `pg`: Neon es Postgres serverless. La
   aplicación abre y cierra una conexión por cada petición, y en un despliegue
   serverless eso multiplicaría los sockets del Postgres. El driver de Neon
   habla por HTTP con un pooler (PgBouncer) delante, así que aguanta miles de
   conexiones simultáneas y cada consulta es una llamada web.

   Eso tiene dos consecuencias prácticas:

     · Cada consulta es una ida y vuelta a la red. Antes, en SQLite, leer era
      instantáneo; ahora hay que esperarla, y una vista de 200 ms se nota.
     · Las transacciones interactivas (las que se quedan abiertas mientras se
       decide algo) no están disponibles sobre HTTP. Por eso el folio de los
       reportes lo pone una secuencia de PostgreSQL y no un
       `MAX(folio) + 1` dentro de una transacción: así no hace falta ninguna.

   Para cualquiera que abra el proyecto por primera vez:
     1. Crear el proyecto en neon.tech y copiar las dos URL a `.env`.
     2. npm install
     3. npm run db:migrar         (crea las tablas)
    4. npm run dev

   Este módulo solo se usa en el servidor. Importarlo desde un Client
   Component rompería el build: el cliente de Prisma habla con la base y no
   puede viajar al navegador.
   ========================================================================== */

interface ContenedorGlobal {
  __comercioRegulado?: PrismaClient;
}

/**
 * Cliente único.
 *
 * Se guarda en `globalThis` porque en desarrollo Next.js recarga los módulos
 * en caliente: sin esto cada recarga abriría un cliente nuevo. En producción
 * Next.js mantiene el módulo vivo entre peticiones, así que hay uno solo por
 * instancia del servidor.
 */
export function obtenerPrisma(): PrismaClient {
  const global = globalThis as ContenedorGlobal;
  if (global.__comercioRegulado) return global.__comercioRegulado;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Falta la variable de entorno DATABASE_URL. Copia .env.example a .env y pega ahí la conexión de Neon.",
    );
  }

  const cliente = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  global.__comercioRegulado = cliente;
  return cliente;
}
