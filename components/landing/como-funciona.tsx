import { PASOS } from "@/data/sitio";

/**
 * Flujo de trabajo de la plataforma.
 */
export function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20"
    >
      <div className="max-w-2xl">
        <h2
          id="como-funciona-titulo"
          className="font-serif text-2xl font-semibold text-balance text-[var(--tinta)] sm:text-3xl"
        >
          Cómo funciona la plataforma
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--tinta-suave)]">
          Un flujo centralizado para mantener cada registro completo y al día.
        </p>
      </div>

      <ol className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2">
        {PASOS.map((paso) => (
          <li
            key={paso.numero}
            className="border-t border-[var(--borde-fuerte)] pt-4"
          >
            <p className="font-mono text-sm text-[var(--mostaza-tinta)]">
              {paso.numero}
            </p>
            <h3 className="mt-2 font-serif text-lg font-semibold text-[var(--tinta)]">
              {paso.titulo}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--tinta-suave)]">
              {paso.detalle}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
