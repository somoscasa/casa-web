import Link from "next/link";
import Header from "@/components/Header";

export const metadata = {
  title: "Pedido confirmado — CASA",
  robots: { index: false, follow: false },
};

export default function Exito() {
  return (
    <>
      <Header />
      <main id="main" className="section center" style={{ paddingTop: 160, paddingBottom: 160 }}>
        <div className="wrap">
          <div className="ct-sent-mark" style={{ margin: "0 auto 28px" }} aria-hidden>
            ✓
          </div>
          <h1 className="serif" style={{ fontSize: 56, margin: "0 0 22px" }}>
            Pedido recibido.
          </h1>
          <p className="body" style={{ color: "var(--ceniza)", maxWidth: 540, margin: "0 auto 36px" }}>
            Te llega el comprobante por mail. Hacemos cada pieza a mano —
            tardan entre 7 y 15 días en estar listas. Te avisamos cuando salen
            para envío.
          </p>
          <Link href="/" className="btn btn-dark">
            Volver al inicio
          </Link>
        </div>
      </main>
    </>
  );
}
