CREATE TYPE "TipoSeguimientoReporte" AS ENUM (
    'accion',
    'ronda',
    'evidencia',
    'resolucion',
    'reapertura'
);

ALTER TABLE "Reporte"
ADD COLUMN "accionCorrectiva" TEXT,
ADD COLUMN "responsable" TEXT,
ADD COLUMN "fechaLimite" TIMESTAMP(3);

CREATE TABLE "SeguimientoReporte" (
    "id" TEXT NOT NULL,
    "reporteId" TEXT NOT NULL,
    "tipo" "TipoSeguimientoReporte" NOT NULL,
    "detalle" TEXT NOT NULL,
    "responsable" TEXT,
    "evidenciaUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeguimientoReporte_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SeguimientoReporte_reporteId_creadoEn_idx"
ON "SeguimientoReporte"("reporteId", "creadoEn");

ALTER TABLE "SeguimientoReporte"
ADD CONSTRAINT "SeguimientoReporte_reporteId_fkey"
FOREIGN KEY ("reporteId") REFERENCES "Reporte"("id")
ON DELETE CASCADE ON UPDATE CASCADE;