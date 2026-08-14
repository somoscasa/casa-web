import Link from "next/link";
import Header from "@/components/Header";

export const metadata = {
  title: "Reserva no completada — CASA",
  robots: { index: false, follow: false },
};

export default function Falla() {
  return (
    <>
      <Header />
      <main id="main" className="section center" style={{ paddingTop: 160, paddingBottom: 160 }}>
        <div className="wrap">
          <h1 className="serif" style={{ fontSize: 48, margin: "0 0 22px" }}>
            No pudimos confirmar el pago.
          </h1>
          <p className="body" style={{ color: "var(--ceniza)", marginBottom: 36 }}>
            Si querés volver a intentarlo, podés empezar de nuevo. Si tenés
            dudas, escribinos por WhatsApp.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/reservar" className="btn btn-dark">
              Volver a intentar
            </Link>
            <a
              href="https://wa.me/5491139295625"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
