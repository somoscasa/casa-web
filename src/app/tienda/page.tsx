import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import TiendaCatalog from "@/components/tienda/TiendaCatalog";
import { PRODUCTOS } from "@/lib/tienda";

export const metadata: Metadata = {
  title: "Tienda — CASA",
  description:
    "Impresiones fine-art, álbumes y cuadros. Tu historia, en papel.",
};

export default function TiendaPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="pg-hero">
          <div className="wrap">
            <Reveal>
              <div className="label">Tienda</div>
              <h1 className="serif pg-hero-title">Tu historia, en papel.</h1>
              <p className="serif-italic pg-hero-sub">
                Impresiones, álbumes y cuadros — hechos a mano.
              </p>
            </Reveal>
          </div>
        </section>

        <TiendaCatalog products={PRODUCTOS} />

        <Footer />
      </main>
    </>
  );
}
