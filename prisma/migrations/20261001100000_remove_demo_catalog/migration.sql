-- Remove only the original demo catalog and its associated activity.
DELETE FROM "Resena"
WHERE "tiendaId" IN (SELECT "id" FROM "Tienda" WHERE "base" = true);

DELETE FROM "Reporte"
WHERE "base" = true
   OR "tiendaId" IN (SELECT "id" FROM "Tienda" WHERE "base" = true);

DELETE FROM "Tienda" WHERE "base" = true;