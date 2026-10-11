CREATE TYPE "GravedadInfraccion" AS ENUM ('leve', 'grave', 'muy_grave');
CREATE TYPE "CategoriaConducta" AS ENUM (
    'horarios_proveedores',
    'convivencia_ruidos_circulacion',
    'sanitaria_productos',
    'publicidad_fachadas'
);
CREATE TYPE "EstadoImpugnacion" AS ENUM ('ninguna', 'pendiente', 'confirmada', 'revocada');
CREATE TYPE "TipoSancion" AS ENUM (
    'amonestacion_escrita',
    'suspension',
    'revocacion',
    'medida_correctiva'
);

ALTER TYPE "TipoIncidente" ADD VALUE 'horario_menor';
ALTER TYPE "TipoIncidente" ADD VALUE 'distintivo';
ALTER TYPE "TipoIncidente" ADD VALUE 'empaque_limpieza';
ALTER TYPE "TipoIncidente" ADD VALUE 'venta_visitantes';
ALTER TYPE "TipoIncidente" ADD VALUE 'proveedores_fuera_horario';
ALTER TYPE "TipoIncidente" ADD VALUE 'permisos_sanitarios';
ALTER TYPE "TipoIncidente" ADD VALUE 'productos_no_autorizados';
ALTER TYPE "TipoIncidente" ADD VALUE 'alcohol_tabaco_sustancias';
ALTER TYPE "TipoIncidente" ADD VALUE 'alteracion_arquitectonica';
ALTER TYPE "TipoIncidente" ADD VALUE 'desacato';
ALTER TYPE "TipoSeguimientoReporte" ADD VALUE 'medida_preventiva';

ALTER TABLE "Reporte"
    ADD COLUMN "validado" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "gravedad" "GravedadInfraccion",
    ADD COLUMN "categoriaConducta" "CategoriaConducta",
    ADD COLUMN "validadoEn" TIMESTAMP(3),
    ADD COLUMN "subsanadoEn" TIMESTAMP(3),
    ADD COLUMN "fechaSubsanacion" TIMESTAMP(3),
    ADD COLUMN "impugnacionEstado" "EstadoImpugnacion" NOT NULL DEFAULT 'ninguna',
    ADD COLUMN "impugnacionMotivo" TEXT,
    ADD COLUMN "impugnacionEn" TIMESTAMP(3),
    ADD COLUMN "resueltaImpugnacionEn" TIMESTAMP(3),
    ADD COLUMN "revisorImpugnacion" TEXT,
    ADD COLUMN "rolRevisorImpugnacion" TEXT,
    ADD COLUMN "declaracionImparcialidad" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "resolucionImpugnacion" TEXT;

ALTER TABLE "SeguimientoReporte"
    ADD COLUMN "peligroSaludSeguridad" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "vigenteHasta" TIMESTAMP(3);

CREATE TABLE "Sancion" (
    "id" TEXT NOT NULL,
    "reporteId" TEXT NOT NULL,
    "tipo" "TipoSancion" NOT NULL,
    "motivo" TEXT NOT NULL,
    "resolucion" TEXT NOT NULL,
    "audienciaEn" TIMESTAMP(3) NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenteHasta" TIMESTAMP(3),
    "plazoCumplimiento" TIMESTAMP(3),
    CONSTRAINT "Sancion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Sancion_reporteId_creadaEn_idx" ON "Sancion"("reporteId", "creadaEn");
CREATE INDEX "Sancion_creadaEn_idx" ON "Sancion"("creadaEn");
ALTER TABLE "Sancion"
    ADD CONSTRAINT "Sancion_reporteId_fkey"
    FOREIGN KEY ("reporteId") REFERENCES "Reporte"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CuentaComerciante" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuentaComerciante_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CuentaComerciante_tiendaId_key" ON "CuentaComerciante"("tiendaId");
ALTER TABLE "CuentaComerciante"
    ADD CONSTRAINT "CuentaComerciante_tiendaId_fkey"
    FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InvitacionComerciante" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadaEn" TIMESTAMP(3),
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvitacionComerciante_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InvitacionComerciante_codigoHash_key" ON "InvitacionComerciante"("codigoHash");
CREATE INDEX "InvitacionComerciante_tiendaId_expiraEn_idx"
    ON "InvitacionComerciante"("tiendaId", "expiraEn");
ALTER TABLE "InvitacionComerciante"
    ADD CONSTRAINT "InvitacionComerciante_tiendaId_fkey"
    FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
