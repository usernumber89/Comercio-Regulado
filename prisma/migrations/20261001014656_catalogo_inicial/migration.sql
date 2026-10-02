-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('abarrotes', 'panaderia', 'carniceria', 'fruteria', 'lacteos', 'ferreteria', 'farmacia', 'salon', 'otro');

-- CreateEnum
CREATE TYPE "TipoIncidente" AS ENUM ('ruido', 'basura', 'estacionamiento', 'seguridad', 'otro');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('activo', 'resuelto');

-- CreateTable
CREATE TABLE "Tienda" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dueno" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'Comerciante autorizado',
    "iniciales" TEXT NOT NULL DEFAULT '??',
    "categoria" "Categoria" NOT NULL,
    "pasaje" TEXT NOT NULL DEFAULT '',
    "casa" TEXT NOT NULL DEFAULT '',
    "referencia" TEXT NOT NULL DEFAULT '',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "horarioAutorizado" TEXT NOT NULL DEFAULT '',
    "autorizadoDesde" TEXT NOT NULL DEFAULT '',
    "horarioSemanal" JSONB NOT NULL DEFAULT '{}',
    "productosPermitidos" JSONB NOT NULL DEFAULT '[]',
    "productosRestringidos" JSONB NOT NULL DEFAULT '[]',
    "ahorroMensual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "residentesBeneficiados" INTEGER NOT NULL DEFAULT 0,
    "ingresoCuota" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minutosTrayecto" INTEGER NOT NULL DEFAULT 0,
    "viajesSemanales" INTEGER NOT NULL DEFAULT 0,
    "nota" TEXT NOT NULL DEFAULT '',
    "base" BOOLEAN NOT NULL DEFAULT false,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "folio" SERIAL NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "tipo" "TipoIncidente" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "anonimo" BOOLEAN NOT NULL DEFAULT false,
    "estado" "Estado" NOT NULL DEFAULT 'activo',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "base" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reporte_folio_key" ON "Reporte"("folio");

-- CreateIndex
CREATE INDEX "Reporte_tiendaId_idx" ON "Reporte"("tiendaId");

-- CreateIndex
CREATE INDEX "Reporte_creadoEn_idx" ON "Reporte"("creadoEn");

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
