import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { CargaDatos } from "@/components/carga-datos";
import { ProveedorTema } from "@/components/theme/proveedor-tema";
import { METADATOS, SITIO_URL } from "@/data/sitio";

import "./globals.css";

/* IBM Plex aporta una jerarquía tipográfica coherente para interfaz y datos. */
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: {
    default: METADATOS.tituloPagina,
    template: `%s · ${METADATOS.titulo}`,
  },
  description: METADATOS.descripcion,
  keywords: [...METADATOS.palabrasClave],
  applicationName: METADATOS.titulo,
  authors: [{ name: "Comercio Regulado" }],
  openGraph: {
    type: "website",
    locale: "es_SV",
    url: "/",
    siteName: METADATOS.titulo,
    title: METADATOS.tituloPagina,
    description: METADATOS.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: METADATOS.tituloPagina,
    description: METADATOS.descripcion,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#101a2a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <ProveedorTema
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CargaDatos />
          {children}
        </ProveedorTema>
      </body>
    </html>
  );
}
