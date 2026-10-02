import { ComoFunciona } from "@/components/landing/como-funciona";
import { Hero } from "@/components/landing/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { METADATOS } from "@/data/sitio";

export default function Portada() {
  return (
    <>
      <SiteHeader seccion="inicio" />
      <main id="contenido" className="flex-1">
        <Hero />
        <ComoFunciona />
      </main>
      <SiteFooter />
    </>
  );
}

export const metadata = {
  description: METADATOS.descripcion,
};
