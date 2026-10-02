"use client";

import { Contador } from "@/components/contador";
import { Label } from "@/components/ui/form-controls";
import { Slider } from "@/components/ui/slider";
import { formatearMoneda } from "@/lib/format";
import { useCatalogoTiendas, usePanel } from "@/store/use-panel";
import type { Tienda } from "@/types";

/**
 * Pestaña de beneficio económico.
 *
 * Las cifras salen de la ficha de cada tienda, que a su vez sale de la base
 * de datos. El control de meses solo cambia el horizonte de proyección: no
 * inventa tasas ni factores, multiplica los valores ya configurados, que es
 * lo que hace auditable la cifra.
 */
export function PestanaBeneficio({ tienda }: { tienda: Tienda }) {
  const meses = usePanel((estado) => estado.mesesActivos);
  const setMeses = usePanel((estado) => estado.setMesesActivos);
  const catalogo = useCatalogoTiendas();

  const ahorroMes = tienda.metricas.ahorroMensualEstimado;
  const cuotaMes = tienda.metricas.ingresoProyectadoCuota;

  // Totales de todos los comercios, para la comparación.
  const ahorroMesTotal = catalogo.reduce(
    (suma, t) => suma + t.metricas.ahorroMensualEstimado,
    0,
  );
  const cuotaMesTotal = catalogo.reduce(
    (suma, t) => suma + t.metricas.ingresoProyectadoCuota,
    0,
  );

  const ahorroAcumulado = ahorroMes * meses;
  const cuotaAcumulada = cuotaMes * meses;
  const ahorroAcumuladoTotal = ahorroMesTotal * meses;
  const cuotaAcumuladaTotal = cuotaMesTotal * meses;

  // Escala común para que las dos barras sean comparables entre sí.
  const escalaBarras = Math.max(ahorroAcumuladoTotal, cuotaAcumuladaTotal, 1);

  const minutosSemanales =
    tienda.metricas.minutosTrayectoEvitado * tienda.metricas.viajesSemanalesEvitados;
  const horasAnuales = Math.round((minutosSemanales * 52) / 60);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Cifra principal: panel lavado, no una tarjeta más. */}
        <div className="filete-bosque rounded-lg border border-[var(--borde)] bg-[var(--bosque-lavado)] p-5 lg:col-span-5 sm:p-6">
          <p className="text-sm text-[var(--tinta-suave)]">
            Ahorro mensual estimado para los residentes que compran aquí
          </p>
          <Contador
            valor={ahorroMes}
            formato="moneda"
            className="mt-2 block font-serif text-4xl font-semibold text-[var(--tinta)] sm:text-5xl"
          />
          <p className="mt-3 text-xs leading-relaxed text-[var(--tinta-tenue)]">
            Incluye pasaje, transporte y el sobreprecio del mercado externo.
                    Cifra estimada a partir de las compras declaradas por cada comercio.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          <Cifra
            etiqueta="Residentes beneficiados"
            valor={tienda.metricas.residentesBeneficiados}
            formato="numero"
            pie="compran en esta tienda al menos una vez por semana"
          />
          <Cifra
            etiqueta="Ingreso proyectado a cuota de condominio"
            valor={cuotaMes}
            formato="moneda"
            pie="al mes, si la Junta Directiva acepta el aporte"
          />
          <Cifra
            etiqueta="Tiempo de trayecto evitado"
            valor={minutosSemanales}
            formato="minutos"
            pie="por semana y por familia, frente al mercado externo"
            destacado
          />
          <Cifra
            etiqueta="Horas recuperadas al año"
            valor={horasAnuales}
            formato="horas"
            pie="sumando 52 semanas a ritmo constante"
          />
        </div>
      </div>

      <section
        aria-labelledby="beneficio-proyeccion"
        className="rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2
            id="beneficio-proyeccion"
            className="font-serif text-lg font-semibold text-[var(--tinta)]"
          >
            Proyección según el tiempo de operación
          </h2>
          <p className="font-mono text-xs text-[var(--tinta-tenue)]">
            {tienda.nombre}
          </p>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-4">
            <Label htmlFor="meses">Meses de comercio interno activo</Label>
            <span className="font-mono text-sm font-semibold text-[var(--bosque-tinta)]">
              {meses} {meses === 1 ? "mes" : "meses"}
            </span>
          </div>

          <Slider
            id="meses"
            className="mt-3"
            min={1}
            max={12}
            step={1}
            value={[meses]}
            onValueChange={(valor) => setMeses(valor[0] ?? 1)}
            aria-label="Meses de comercio interno activo"
          />

          <div
            className="mt-1 flex justify-between font-mono text-xs text-[var(--tinta-tenue)]"
            aria-hidden
          >
            <span>1</span>
            <span>12</span>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="border-t-2 border-t-[var(--verde)] pt-3">
            <dt className="text-sm text-[var(--tinta-suave)]">
              Ahorro acumulado de los residentes
            </dt>
            <dd>
              <Contador
                valor={ahorroAcumulado}
                formato="moneda"
                animarAlEntrar={false}
                className="mt-1 block font-serif text-3xl font-semibold text-[var(--tinta)]"
              />
            </dd>
          </div>
          <div className="border-t-2 border-t-[var(--mostaza)] pt-3">
            <dt className="text-sm text-[var(--tinta-suave)]">
              Aporte acumulado al condominio
            </dt>
            <dd>
              <Contador
                valor={cuotaAcumulada}
                formato="moneda"
                animarAlEntrar={false}
                className="mt-1 block font-serif text-3xl font-semibold text-[var(--tinta)]"
              />
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-[var(--borde)] pt-5">
          <h3 className="text-sm font-medium text-[var(--tinta)]">
            Todos los comercios en {meses} {meses === 1 ? "mes" : "meses"}
          </h3>

          <ul className="mt-3 space-y-3.5">
            {[
              {
                rotulo: "Ahorro acumulado de los residentes",
                valor: ahorroAcumuladoTotal,
                color: "var(--verde-tinta)",
              },
              {
                rotulo: "Aporte acumulado al condominio",
                valor: cuotaAcumuladaTotal,
                color: "var(--mostaza-tinta)",
              },
            ].map((barra) => {
              const porcentaje = Math.max(
                2,
                Math.round((barra.valor / escalaBarras) * 100),
              );
              return (
                <li key={barra.rotulo}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-[var(--tinta-suave)]">
                      {barra.rotulo}
                    </span>
                    <span className="shrink-0 font-mono text-xs font-semibold text-[var(--tinta)]">
                      {formatearMoneda(barra.valor)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[var(--hundido)]"
                    role="img"
                    aria-label={`${barra.rotulo}: ${formatearMoneda(barra.valor)}`}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${porcentaje}%`,
                        backgroundColor: barra.color,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-[var(--tinta-tenue)]">
            El comercio regulado devuelve dinero a los vecinos y, en paralelo,
            genera ingreso para la cuota. Cerrar las tiendas elimina el
            ahorro y no garantiza el ingreso.
          </p>
        </div>
      </section>
    </div>
  );
}

function Cifra({
  etiqueta,
  valor,
  formato,
  pie,
  destacado = false,
}: {
  etiqueta: string;
  valor: number;
  formato: "numero" | "moneda" | "minutos" | "horas";
  pie: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={
        destacado
          ? "filete-mostaza rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5"
          : "rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5"
      }
    >
      <p className="text-sm text-[var(--tinta-suave)]">{etiqueta}</p>
      <Contador
        valor={valor}
        formato={formato}
        className="mt-2 block font-serif text-3xl font-semibold text-[var(--tinta)]"
      />
      <p className="mt-2 text-xs leading-relaxed text-[var(--tinta-tenue)]">
        {pie}
      </p>
    </div>
  );
}
