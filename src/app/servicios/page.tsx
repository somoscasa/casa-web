import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import PackageCard from "@/components/PackageCard";
import { PACKAGES, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Servicios — CASA",
  description:
    "Tres paquetes para bodas, sin precios cerrados. Cada historia tiene su forma.",
};

export default function ServiciosPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="pg-hero">
          <div className="wrap">
            <Reveal>
              <div className="label">Servicios</div>
              <h1 className="serif pg-hero-title">Fotografía & Video.</h1>
              <p className="serif-italic pg-hero-sub">
                Cobertura de bodas en Buenos Aires y todo el país.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="pk-grid">
              {PACKAGES.map((p, i) => (
                <Reveal key={p.id} delay={i * 90}>
                  <PackageCard pkg={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section sv-custom">
          <div className="wrap">
            <Reveal className="sv-custom-inner">
              <div className="label">A medida</div>
              <h2 className="serif sv-custom-title">
                Tu día no entra en una grilla.
              </h2>
              <p className="body sv-custom-body">
                Cada historia es distinta. Más allá de los paquetes, sumamos
                servicios sueltos —una sesión de pareja, un getting ready,
                drone, un álbum impreso— y armamos la cobertura exacta que tu
                boda necesita. Contanos qué te imaginás y lo construimos juntos.
              </p>
              <div className="sv-custom-actions">
                <Link href="/contacto" className="btn btn-dark">
                  Armemos tu paquete
                </Link>
                <a
                  className="link-arrow"
                  href={SITE.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hablemos por WhatsApp <span className="arr">→</span>
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
