import "dotenv/config";
import { defineConfig } from "prisma/config";

/* ==========================================================================
   CONFIGURACIÓN DE LA CLI DE PRISMA
   --------------------------------------------------------------------------
   Este archivo solo lo usa la terminal (`npx prisma ...`). La aplicación no
   lee nada de aquí: su conexión la arma `lib/db.ts` con el adaptador de Neon.

   Se separan dos URLs porque en Neon hay dos caminos distintos:

     DATABASE_URL  Host con `-pooler` (PgBouncer). Lo usa la aplicación en
                   tiempo de ejecución, que abre y cierra conexiones por cada
                   petición y aguanta miles a la vez.

     DIRECT_URL    Host sin `-pooler`. La conexión directa al Postgres, la
                   única que puede crear tablas. La usa la CLI para migrar.

   Se leen con `process.env` y no con el ayudante `env()` de Prisma a
   propósito: `prisma generate` corre en cada `npm install` —incluido el de un
   despliegue donde todavía no existe la base— y no debe fallar porque falte
   una variable.
   ========================================================================== */

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
    // `prisma migrate dev` necesita una base aparte donde ensayar el cambio
    // antes de tocar la real. En Neon lo normal es apuntar esto a una rama
    // (branch) y dejar la rama principal intacta.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
