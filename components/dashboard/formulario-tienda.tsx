"use client";

import { CheckIcon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox, Label } from "@/components/ui/form-controls";
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIAS,
  obtenerCategoria,
  PRODUCTOS_RESTRINGIDOS_GLOBALES,
} from "@/data/tiendas";
import { DIAS } from "@/lib/dias";
import {
  borradorDeTienda,
  borradorVacio,
  validarTienda,
  type BorradorTienda,
  type ErroresTienda,
} from "@/lib/tienda-formulario";
import { seleccionarGuardando, usePanel } from "@/store/use-panel";
import type { DiaSemana, Tienda } from "@/types";

/**
 * Formulario de alta y edición de comercios.
 *
 * El horario se captura como dos campos de hora por día en vez de un texto
 * libre: al construirlos con `<input type="time">` el navegador garantiza el
 * formato, y `validarTienda` solo tiene que comprobar que el cierre sea
 * posterior a la apertura. El resumen que ve el usuario en la ficha se arma
 * después, en `construirTienda`.
 *
 * Lo que se valida aquí es la misma validación que corre en el servidor: el
 * navegador avisa rápido, pero quien decide es `/api/tiendas`.
 */
export function FormularioTienda({
  onCerrar,
  tienda,
}: {
  onCerrar: () => void;
  tienda?: Tienda;
}) {
  const agregarTienda = usePanel((estado) => estado.agregarTienda);
  const actualizarTienda = usePanel((estado) => estado.actualizarTienda);
  const guardando = usePanel(seleccionarGuardando);

  const [borrador, setBorrador] = useState<BorradorTienda>(() =>
    tienda ? borradorDeTienda(tienda) : borradorVacio(),
  );
  const [errores, setErrores] = useState<ErroresTienda>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardada, setGuardada] = useState<string | null>(null);

  function actualizar<K extends keyof BorradorTienda>(
    campo: K,
    valor: BorradorTienda[K],
  ) {
    setBorrador((b) => ({ ...b, [campo]: valor }));
    // El error del campo desaparece en cuanto el usuario lo corrige.
    setErrores((e) => ({ ...e, [campo]: undefined }));
  }

  function cambiarCategoria(id: string) {
    const categoria = obtenerCategoria(id);
    setBorrador((b) => ({
      ...b,
      categoria: categoria.id,
      // El rubro propone qué puede vender. Los productos quedan seleccionables
      // para que la Junta ajuste de una tienda a otra.
      productosPermitidos: tienda
        ? b.productosPermitidos
        : categoria.productosSugeridos,
    }));
    setErrores((e) => ({ ...e, categoria: undefined }));
  }

  function cambiarDia(
    dia: DiaSemana,
    campo: "activo" | "rango",
    valor: boolean | string,
  ) {
    setBorrador((b) => {
      const actual = b.horarioSemanal[dia];
      return {
        ...b,
        horarioSemanal: {
          ...b.horarioSemanal,
          [dia]:
            campo === "activo"
              ? { ...actual, activo: valor as boolean }
              : { ...actual, rango: valor as string },
        },
      };
    });
    setErrores((e) => ({ ...e, horarioSemanal: undefined }));
  }

  function alternarProducto(
    producto: string,
    campo: "productosPermitidos" | "productosRestringidos" = "productosPermitidos",
  ) {
    setBorrador((b) => ({
      ...b,
      [campo]: b[campo].includes(producto)
        ? b[campo].filter((p) => p !== producto)
        : [...b[campo], producto],
    }));
    if (campo === "productosPermitidos") {
      setErrores((e) => ({ ...e, productosPermitidos: undefined }));
    }
  }

  async function manejarEnvio(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardada(null);

    const encontrados = validarTienda(borrador);
    setErrores(encontrados);

    if (Object.keys(encontrados).length > 0) {
      setErrorGeneral("Revisa los campos marcados antes de guardar.");
      return;
    }

    try {
      const guardada = tienda
        ? await actualizarTienda(tienda.id, borrador)
        : await agregarTienda(borrador);
      setGuardada(guardada.nombre);
      if (!tienda) setBorrador(borradorVacio());
      setErrorGeneral(null);
    } catch (error) {
      setErrorGeneral(
        error instanceof Error
          ? error.message
          : tienda
            ? "No se pudo actualizar la tienda."
            : "No se pudo registrar la tienda.",
      );
    }
  }

  const descripcionCategoria = obtenerCategoria(borrador.categoria);
  const metricasIncompletas =
    borrador.residentesBeneficiados.trim() === "" ||
    borrador.ahorroMensualEstimado.trim() === "";

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6"
    >
      {errorGeneral ? (
        <p
          role="alert"
          className="mb-5 rounded-md border border-[var(--terracota)] bg-[var(--terracota-lavado)] px-3.5 py-2.5 text-sm text-[var(--terracota-tinta)]"
        >
          {errorGeneral}
        </p>
      ) : null}

      {guardada ? (
        <p
          role="status"
          className="mb-5 rounded-md border border-[color-mix(in_oklab,var(--verde)_35%,transparent)] bg-[var(--verde-lavado)] px-3.5 py-2.5 text-sm text-[var(--verde-tinta)]"
        >
          <CheckIcon className="mr-1.5 inline size-4 align-[-3px]" aria-hidden />
          {guardada} {tienda ? "se actualizó" : "quedó guardada"} correctamente.
          {tienda
            ? " La ficha y sus indicadores ya reflejan los cambios."
            : " Ya está disponible en Comercios."}
        </p>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      <fieldset className="border-0 p-0">
        <legend className="font-serif text-base font-semibold text-[var(--tinta)]">
          Identificación
        </legend>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Nombre de la tienda"
            htmlFor="t-nombre"
            error={errores.nombre}
            obligatorio
          >
            <Input
              id="t-nombre"
              value={borrador.nombre}
              onChange={(e) => actualizar("nombre", e.target.value)}
              placeholder="Ej.: Tienda La Esquina"
              aria-invalid={errores.nombre ? true : undefined}
            />
          </Campo>

          <Campo
            etiqueta="Dueño o encargado"
            htmlFor="t-dueno"
            error={errores.dueno}
            obligatorio
          >
            <Input
              id="t-dueno"
              value={borrador.dueno}
              onChange={(e) => actualizar("dueno", e.target.value)}
              placeholder="Nombre completo"
              aria-invalid={errores.dueno ? true : undefined}
            />
          </Campo>

          <Campo etiqueta="Rubro" htmlFor="t-categoria" obligatorio>
            <Select value={borrador.categoria} onValueChange={cambiarCategoria}>
              <SelectTrigger id="t-categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-[var(--tinta-tenue)]">
              {descripcionCategoria.resumen}
            </p>
          </Campo>

          <Campo
            etiqueta="Autorizado desde"
            htmlFor="t-fecha"
            ayuda="Se muestra como fecha legible en la ficha."
          >
            <Input
              id="t-fecha"
              type="date"
              value={borrador.autorizadosDesde}
              onChange={(e) => actualizar("autorizadosDesde", e.target.value)}
            />
          </Campo>
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      <fieldset className="mt-7 border-0 border-t border-[var(--borde)] p-0 pt-6">
        <legend className="font-serif text-base font-semibold text-[var(--tinta)]">
          Ubicación
        </legend>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Pasaje" htmlFor="t-pasaje" error={errores.pasaje} obligatorio>
            <Input
              id="t-pasaje"
              value={borrador.pasaje}
              onChange={(e) => actualizar("pasaje", e.target.value)}
              placeholder="Ej.: Pasaje Los Almendros"
              aria-invalid={errores.pasaje ? true : undefined}
            />
          </Campo>

          <Campo etiqueta="Casa o puesto" htmlFor="t-casa" error={errores.casa} obligatorio>
            <Input
              id="t-casa"
              value={borrador.casa}
              onChange={(e) => actualizar("casa", e.target.value)}
              placeholder="Ej.: Casa 14"
              aria-invalid={errores.casa ? true : undefined}
            />
          </Campo>

          <Campo
            etiqueta="Referencia"
            htmlFor="t-referencia"
            ayuda="Ayuda a ubicarla para quien no conoce la residencial."
            clase="sm:col-span-2"
          >
            <Input
              id="t-referencia"
              value={borrador.referencia}
              onChange={(e) => actualizar("referencia", e.target.value)}
              placeholder="Ej.: Junto a la parada del transporte público"
            />
          </Campo>

          <Campo
            etiqueta="Latitud"
            htmlFor="t-lat"
            error={errores.lat}
            ayuda="Opcional. Sirve para ubicar el punto en el plano de la residencial."
          >
            <Input
              id="t-lat"
              inputMode="decimal"
              value={borrador.lat}
              onChange={(e) => actualizar("lat", e.target.value)}
              placeholder="13.6921"
              aria-invalid={errores.lat ? true : undefined}
            />
          </Campo>

          <Campo
            etiqueta="Longitud"
            htmlFor="t-lng"
            error={errores.lng}
            ayuda="Opcional."
          >
            <Input
              id="t-lng"
              inputMode="decimal"
              value={borrador.lng}
              onChange={(e) => actualizar("lng", e.target.value)}
              placeholder="-89.2184"
              aria-invalid={errores.lng ? true : undefined}
            />
          </Campo>
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      <fieldset className="mt-7 border-0 border-t border-[var(--borde)] p-0 pt-6">
        <legend className="font-serif text-base font-semibold text-[var(--tinta)]">
          Horario autorizado
        </legend>
        <p className="mt-1.5 text-sm text-[var(--tinta-suave)]">
          Marca cada día y ajusta apertura y cierre. La Junta revisa este
          horario, por eso el resumen de la ficha se arma a partir de lo que
          marques aquí.
        </p>

        {errores.horarioSemanal ? (
          <p
            role="alert"
            className="mt-3 rounded-md bg-[var(--terracota-lavado)] px-3 py-2 text-sm text-[var(--terracota-tinta)]"
          >
            {errores.horarioSemanal}
          </p>
        ) : null}

        <ul className="mt-4 divide-y divide-[var(--borde)] border-y border-[var(--borde)]">
          {DIAS.map((dia) => {
            const dato = borrador.horarioSemanal[dia.id];
            const [apertura, cierre] = dato.rango.split("–").map((p) => p.trim());

            return (
              <li
                key={dia.id}
                className="flex flex-wrap items-center gap-3 py-2.5 sm:gap-4"
              >
                <div className="flex min-w-28 items-center gap-2.5">
                  <Checkbox
                    id={`t-dia-${dia.id}`}
                    checked={dato.activo}
                    onCheckedChange={(v) =>
                      cambiarDia(dia.id, "activo", v === true)
                    }
                  />
                  <Label htmlFor={`t-dia-${dia.id}`}>{dia.nombre}</Label>
                </div>

                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="time"
                    value={apertura}
                    disabled={!dato.activo}
                    onChange={(e) =>
                      cambiarDia(
                        dia.id,
                        "rango",
                        `${e.target.value} – ${cierre || "18:00"}`,
                      )
                    }
                    aria-label={`Apertura, ${dia.nombre}`}
                    className="h-9 rounded-md border border-[var(--borde-fuerte)] bg-[var(--superficie)] px-2 font-mono text-xs text-[var(--tinta)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--bosque)] disabled:opacity-40"
                  />
                  <span aria-hidden className="text-[var(--tinta-tenue)]">
                    –
                  </span>
                  <input
                    type="time"
                    value={cierre}
                    disabled={!dato.activo}
                    onChange={(e) =>
                      cambiarDia(
                        dia.id,
                        "rango",
                        `${apertura || "06:00"} – ${e.target.value}`,
                      )
                    }
                    aria-label={`Cierre, ${dia.nombre}`}
                    className="h-9 rounded-md border border-[var(--borde-fuerte)] bg-[var(--superficie)] px-2 font-mono text-xs text-[var(--tinta)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--bosque)] disabled:opacity-40"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      <fieldset className="mt-7 border-0 border-t border-[var(--borde)] p-0 pt-6">
        <legend className="font-serif text-base font-semibold text-[var(--tinta)]">
          Qué puede vender
        </legend>
        <p className="mt-1.5 text-sm text-[var(--tinta-suave)]">
          Se propone lo habitual del rubro{" "}
          <strong className="font-medium text-[var(--tinta)]">
            {descripcionCategoria.etiqueta.toLowerCase()}
          </strong>
          . Desmarca lo que no aplique y lo que quieras agregar.
        </p>

        {errores.productosPermitidos ? (
          <p
            role="alert"
            className="mt-3 rounded-md bg-[var(--terracota-lavado)] px-3 py-2 text-sm text-[var(--terracota-tinta)]"
          >
            {errores.productosPermitidos}
          </p>
        ) : null}

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {descripcionCategoria.productosSugeridos.map((producto) => (
            <li key={producto}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-[var(--borde)] px-3 py-2 text-sm text-[var(--tinta)] transition-colors hover:bg-[var(--hundido)]">
                <Checkbox
                  checked={borrador.productosPermitidos.includes(producto)}
                  onCheckedChange={() => alternarProducto(producto)}
                />
                {producto}
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-4 max-w-sm">
          <Label htmlFor="t-producto">Otro producto</Label>
          <div className="mt-1.5">
            <ProductoExtra
              valor={borrador.productosPermitidos}
              onAgregar={(producto) => alternarProducto(producto)}
            />
          </div>
        </div>

        {borrador.productosPermitidos.some(
          (producto) => !descripcionCategoria.productosSugeridos.includes(producto),
        ) ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {borrador.productosPermitidos
              .filter((producto) => !descripcionCategoria.productosSugeridos.includes(producto))
              .map((producto) => (
                <li key={producto} className="flex items-center gap-1 rounded-md border border-[var(--borde)] px-2 py-1 text-xs">
                  <span>{producto}</span>
                  <Button
                    type="button"
                    variant="fantasma"
                    size="iconoSm"
                    aria-label={`Quitar ${producto}`}
                    onClick={() => alternarProducto(producto)}
                  >
                    <XIcon aria-hidden />
                  </Button>
                </li>
              ))}
          </ul>
        ) : null}

        <div className="mt-5 border-t border-[var(--borde)] pt-5">
          <h3 className="text-sm font-semibold text-[var(--tinta)]">
            Productos no autorizados
          </h3>
          <p className="mt-1 text-xs text-[var(--tinta-suave)]">
            Selecciona las restricciones aplicables a este comercio.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ...new Set([
                ...PRODUCTOS_RESTRINGIDOS_GLOBALES,
                ...borrador.productosRestringidos,
              ]),
            ].map((producto) => (
              <li key={producto}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-[var(--borde)] px-3 py-2 text-sm text-[var(--tinta)] transition-colors hover:bg-[var(--hundido)]">
                  <Checkbox
                    checked={borrador.productosRestringidos.includes(producto)}
                    onCheckedChange={() =>
                      alternarProducto(producto, "productosRestringidos")
                    }
                  />
                  {producto}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      <fieldset className="mt-7 border-0 border-t border-[var(--borde)] p-0 pt-6">
        <legend className="font-serif text-base font-semibold text-[var(--tinta)]">
          Cifras de la tienda
        </legend>
        <p className="mt-1.5 text-sm text-[var(--tinta-suave)]">
          Alimentan el tab Beneficio. Si las dejas vacías se registran en cero y
          la ficha lo muestra así, sin inventar datos.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Residentes" htmlFor="t-residentes">
            <Input
              id="t-residentes"
              inputMode="numeric"
              value={borrador.residentesBeneficiados}
              onChange={(e) => actualizar("residentesBeneficiados", e.target.value)}
              placeholder="0"
            />
          </Campo>

          <Campo etiqueta="Ahorro mensual" htmlFor="t-ahorro" ayuda="USD por familia">
            <Input
              id="t-ahorro"
              inputMode="decimal"
              value={borrador.ahorroMensualEstimado}
              onChange={(e) => actualizar("ahorroMensualEstimado", e.target.value)}
              placeholder="0.00"
            />
          </Campo>

          <Campo etiqueta="Aporte a cuota" htmlFor="t-cuota" ayuda="USD al mes">
            <Input
              id="t-cuota"
              inputMode="decimal"
              value={borrador.ingresoProyectadoCuota}
              onChange={(e) => actualizar("ingresoProyectadoCuota", e.target.value)}
              placeholder="0.00"
            />
          </Campo>

          <Campo etiqueta="Minutos de trayecto" htmlFor="t-minutos">
            <Input
              id="t-minutos"
              inputMode="numeric"
              value={borrador.minutosTrayectoEvitado}
              onChange={(e) => actualizar("minutosTrayectoEvitado", e.target.value)}
              placeholder="0"
            />
          </Campo>

          <Campo etiqueta="Viajes por semana" htmlFor="t-viajes">
            <Input
              id="t-viajes"
              inputMode="numeric"
              value={borrador.viajesSemanalesEvitados}
              onChange={(e) => actualizar("viajesSemanalesEvitados", e.target.value)}
              placeholder="0"
            />
          </Campo>
        </div>
      </fieldset>

      {/* ---------------------------------------------------------------- */}
      <fieldset className="mt-7 border-0 border-t border-[var(--borde)] p-0 pt-6">
        <legend className="font-serif text-base font-semibold text-[var(--tinta)]">
          Nota
        </legend>
        <Campo etiqueta="Contexto de la tienda" htmlFor="t-nota" clase="mt-4">
          <Textarea
            id="t-nota"
            value={borrador.nota}
            onChange={(e) => actualizar("nota", e.target.value)}
            placeholder="Qué la distingue, por qué abre temprano, qué resuelve."
          />
        </Campo>
      </fieldset>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[var(--borde)] pt-5">
        <Button type="submit" disabled={guardando}>
          {tienda ? <SaveIcon aria-hidden /> : <PlusIcon aria-hidden />}
          {guardando
            ? "Guardando…"
            : tienda
              ? "Guardar cambios"
              : "Registrar tienda"}
        </Button>
        <Button type="button" variant="fantasma" onClick={onCerrar} disabled={guardando}>
          <XIcon aria-hidden />
          Cancelar
        </Button>

        {!tienda && metricasIncompletas ? (
          <p className="text-xs text-[var(--tinta-tenue)]">
            Las cifras de la tienda quedaron en cero.
          </p>
        ) : null}
      </div>
    </form>
  );
}

/** Campo con etiqueta, error y ayuda. Reutilizado en todo el formulario. */
function Campo({
  etiqueta,
  htmlFor,
  error,
  ayuda,
  obligatorio = false,
  clase,
  children,
}: {
  etiqueta: string;
  htmlFor: string;
  error?: string;
  ayuda?: string;
  obligatorio?: boolean;
  clase?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clase}>
      <Label htmlFor={htmlFor}>
        {etiqueta}
        {obligatorio ? (
          <span className="ml-1 text-[var(--terracota-tinta)]" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-[var(--terracota-tinta)]">
          {error}
        </p>
      ) : ayuda ? (
        <p className="mt-1.5 text-xs text-[var(--tinta-tenue)]">{ayuda}</p>
      ) : null}
    </div>
  );
}

/**
 * Entrada para agregar un producto que no viene en la lista del rubro.
 *
 * Es un `div` y no un `form`: un formulario dentro de otro es HTML inválido y
 * el botón se dispararía en el submit del formulario principal, guardando la
 * tienda a medio llenar.
 */
function ProductoExtra({
  valor,
  onAgregar,
}: {
  valor: string[];
  onAgregar: (producto: string) => void;
}) {
  const [texto, setTexto] = useState("");

  function agregar() {
    const limpio = texto.trim();
    if (limpio.length < 3 || valor.includes(limpio)) {
      setTexto("");
      return;
    }
    onAgregar(limpio);
    setTexto("");
  }

  return (
    <div className="flex w-full gap-2">
      <Input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            agregar();
          }
        }}
        placeholder="Nombre del producto"
        aria-label="Agregar otro producto"
      />
      <Button
        type="button"
        variant="secundario"
        size="icono"
        onClick={agregar}
        aria-label="Agregar producto"
      >
        <PlusIcon aria-hidden />
      </Button>
    </div>
  );
}
