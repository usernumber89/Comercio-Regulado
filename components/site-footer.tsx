import Link from "next/link";

import { Marca } from "@/components/site-header";
import { PIE } from "@/data/sitio";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--borde)]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5 text-[var(--tinta)]">
            <Marca />
            <span className="font-serif text-lg font-semibold">Comercio Regulado</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--tinta-suave)]">
            {PIE.descripcion}
          </p>
        </div>

        {PIE.secciones.map((seccion) => (
          <nav key={seccion.titulo} aria-label={seccion.titulo}>
            <h2 className="text-sm font-semibold text-[var(--tinta)]">
              {seccion.titulo}
            </h2>
            <ul className="mt-3 space-y-2">
              {seccion.enlaces.map((enlace) => (
                <li key={`${seccion.titulo}-${enlace.texto}`}>
                  <Link
                    href={enlace.href}
                    className="text-sm text-[var(--tinta-suave)] underline-offset-4 transition-colors hover:text-[var(--bosque-tinta)] hover:underline"
                  >
                    {enlace.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-[var(--borde)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-4 sm:px-6">
          <p className="font-mono text-xs text-[var(--tinta-tenue)]">
            Gestión y seguimiento de comercios
          </p>
        </div>
      </div>
    </footer>
  );
}
