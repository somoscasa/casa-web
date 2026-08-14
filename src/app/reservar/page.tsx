import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import ReservaForm from "@/components/ReservaForm";
import { PACKAGES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reservar — CASA",
  description:
    "Reservá tu fecha con una seña del 40%. Pago seguro vía MercadoPago.",
  robots: { index: false, follow: false },
};

const MP_PUBLIC = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";
const DEPOSIT_AMOUNT = Number(process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT ?? "0");

export default function ReservarPage() {
  const mpReady = Boolean(MP_PUBLIC && DEPOSIT_AMOUNT > 0);

  return (
    <>
      <Header />
      <main id="main">
        <section className="pg-hero">
          <div className="wrap">
            <Reveal>
              <div className="label">Reservar</div>
              <h1 className="serif pg-hero-title">Tu fecha, asegurada.</h1>
              <p className="serif-italic pg-hero-sub">
                Una seña del 40% y la fecha queda bloqueada a tu nombre.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap" style={{ maxWidth: 720 }}>
            {mpReady ? (
              <ReservaForm packages={PACKAGES} depositAmount={DEPOSIT_AMOUNT} />
            ) : (
              <div
                className="fsc"
                style={{ borderColor: "var(--ceniza-line)", textAlign: "center" }}
              >
                <div className="label">Próximamente</div>
                <h2
                  className="serif"
                  style={{
                    fontSize: 36,
                    lineHeight: 1.1,
                    margin: "14px 0 18px",
                  }}
                >
                  Reservas online — en breve.
                </h2>
                <p className="body" style={{ color: "var(--ceniza)" }}>
                  Estamos terminando de habilitar el pago con MercadoPago.
                  Mientras tanto, escribinos por{" "}
                  <a
                    href="https://wa.me/5491139295625"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--siena)" }}
                  >
                    WhatsApp
                  </a>{" "}
                  o por mail y lo arreglamos en el momento.
                </p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
