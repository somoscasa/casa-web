import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import PackageCard from "@/components/PackageCard";
import EditorialGallery from "@/components/EditorialGallery";
import FAQ from "@/components/FAQ";
import { FAQ_BODAS, GALLERY, PACKAGES, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bodas — CASA",
  description:
    "Fotografía y video editorial para bodas en Buenos Aires. Documental, cálido y honesto.",
};

export default function BodasPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="pg-hero">
          <div className="wrap">
            <Reveal>
              <div className="label">Bodas</div>
              <h1 className="serif pg-hero-title">El día completo, sin guion.</h1>
              <p className="serif-italic pg-hero-sub">
                Cada boda tiene su luz. Nosotros la encontramos.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 40 }}>
          <div className="wrap">
            <Reveal>
              <EditorialGallery photos={GALLERY} />
            </Reveal>
          </div>
        </section>

        <section className="section svc-brief" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="svc-brief-head">
              <Reveal>
                <div className="label">Paquetes</div>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="serif svc-brief-title">
                  Tres caminos. Una sola historia.
                </h2>
              </Reveal>
            </div>

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
                Tu boda no entra en una grilla.
              </h2>
              <p className="body sv-custom-body">
                Sumamos servicios sueltos —drone, álbum impreso, una sesión
                previa, cobertura del civil— y armamos la cobertura exacta que
                necesitás. Cada historia es distinta.
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

        <section className="section">
          <div className="wrap">
            <Reveal>
              <div className="label">FAQ</div>
              <h2
                className="serif"
                style={{ fontSize: 48, lineHeight: 1.05, margin: "14px 0 60px" }}
              >
                Lo que nos preguntan seguido.
              </h2>
            </Reveal>
            <Reveal>
              <FAQ items={FAQ_BODAS} />
            </Reveal>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
