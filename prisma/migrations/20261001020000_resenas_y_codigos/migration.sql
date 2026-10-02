-- ===========================================================================
-- Reseñas y códigos de tienda
-- ---------------------------------------------------------------------------
-- Tres cosas:
--
--   1. La secuencia `codigo_tienda_seq`, que da el código corto y único de
--      cada tienda (`EPS-0001`). Es una secuencia y no un autoincremental de
--      la columna porque el código tiene prefijo y ceros a la izquierda, y
--      `GENERATED ALWAYS AS IDENTITY` no puede formatear un texto.
--
--   2. El relleno de las tiendas que ya existían. La columna se añade primero
--      sin `NOT NULL`, porque `ADD COLUMN NOT NULL` falla si la tabla tiene
--      filas y esta base ya tenía el catálogo cargado; se les asigna un código
--      en orden de creación y al final se cierra la columna.
--
--   3. La tabla de reseñas. Es opinión pública: de una a cinco estrellas, con
--      comentario opcional y sin moderation. Una reseña de una estrella es
--      además una denuncia, y esa denuncia se escribe aparte en `Reporte` para
--      que tenga folio y la pueda resolver la Junta.
-- ===========================================================================

CREATE SEQUENCE "codigo_tienda_seq";

ALTER TABLE "Tienda" ADD COLUMN "codigo" TEXT;

-- PostgreSQL no deja usar una función de ventana directamente en el `UPDATE`,
-- así que se numeran las filas en un CTE y se cruzan con un `FROM`.
WITH numeradas AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "creadaEn", id) AS numero
  FROM "Tienda"
)
UPDATE "Tienda" AS tienda
SET "codigo" = 'EPS-' || LPAD(numeradas.numero::text, 4, '0')
FROM numeradas
WHERE tienda.id = numeradas.id;

SELECT setval(
  '"codigo_tienda_seq"',
  GREATEST(
    COALESCE((SELECT MAX(substring("codigo" from 5)::int) FROM "Tienda"), 0),
    0
  ),
  true
);

ALTER TABLE "Tienda" ALTER COLUMN "codigo" SET NOT NULL;

CREATE TABLE "Resena" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "estrellas" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL DEFAULT '',
    "autor" TEXT NOT NULL DEFAULT '',
    "anonimo" BOOLEAN NOT NULL DEFAULT true,
    "denuncia" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resena_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Resena_tiendaId_idx" ON "Resena"("tiendaId");

CREATE INDEX "Resena_creadoEn_idx" ON "Resena"("creadoEn");

CREATE UNIQUE INDEX "Tienda_codigo_key" ON "Tienda"("codigo");

ALTER TABLE "Resena" ADD CONSTRAINT "Resena_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
