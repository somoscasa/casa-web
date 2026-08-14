import Link from "next/link";
import Header from "@/components/Header";

export const metadata = {
  title: "Reserva confirmada — CASA",
  robots: { index: false, follow: false },
};

export default function Exito() {
  return (
    <>
      <Header />
      <main id="main" className="section center" style={{ paddingTop: 160, paddingBottom: 160 }}>
        <div className="wrap">
          <div
            className="ct-sent-mark"
            style={{ margin: "0 auto 28px" }}
            aria-hidden
          >
            ✓
          </div>
          <h1 className="serif" style={{ fontSize: 56, margin: "0 0 22px" }}>
            Reservaste tu fecha.
          </h1>
          <p
            className="body"
            style={{ color: "var(--ceniza)", maxWidth: 540, margin: "0 auto 36px" }}
          >
            Te llega el comprobante por mail en los próximos minutos. Te
            contactamos en menos de 48hs para coordinar todo.
          </p>
          <Link href="/" className="btn btn-dark">
            Volver al inicio
          </Link>
        </div>
      </main>
    </>
  );
}
