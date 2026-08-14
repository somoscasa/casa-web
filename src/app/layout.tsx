import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CASA — Estudio Audiovisual · Villa Crespo",
  description:
    "CASA es un estudio audiovisual de Villa Crespo, Buenos Aires. Fotografía y video para bodas. Sentite en casa.",
  metadataBase: new URL("https://casa-web-chi.vercel.app"),
  openGraph: {
    title: "CASA — Estudio Audiovisual",
    description: "Fotografía y video para bodas en Buenos Aires.",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/portfolio/01-ceremonia.jpeg", width: 735, height: 1103, alt: "CASA — Fotografía de bodas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CASA — Estudio Audiovisual",
    description: "Fotografía y video para bodas en Buenos Aires.",
    images: ["/portfolio/01-ceremonia.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main" className="skip-link">Saltar al contenido</a>
        {children}
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "CASA — Estudio Audiovisual",
              description: "Fotografía y video editorial para bodas en Buenos Aires.",
              url: "https://casa-web-chi.vercel.app",
              image: "https://casa-web-chi.vercel.app/portfolio/01-ceremonia.jpeg",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Villa Crespo",
                addressRegion: "Buenos Aires",
                addressCountry: "AR",
              },
              telephone: "+5491139295625",
              email: "somoscasa.ar@gmail.com",
              sameAs: ["https://www.instagram.com/somos.casa.ok/"],
            }),
          }}
        />
      </body>
    </html>
  );
}
