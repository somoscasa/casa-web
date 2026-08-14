import Link from "next/link";
import Header from "@/components/Header";

export const metadata = {
  title: "Pago en revisión — CASA",
  robots: { index: false, follow: false },
};

export default function Pendiente() {
  return (
    <>
      <Header />
      <main id="main" className="section center" style={{ paddingTop: 160, paddingBottom: 160 }}>
        <div className="wrap">
          <h1 className="serif" style={{ fontSize: 48, margin: "0 0 22px" }}>
            Estamos esperando MercadoPago.
          </h1>
          <p className="body" style={{ color: "var(--ceniza)", maxWidth: 540, margin: "0 auto 36px" }}>
            En cuanto se acredite el pago, te llega el comprobante por mail.
          </p>
          <Link href="/" className="btn btn-dark">
            Volver al inicio
          </Link>
        </div>
      </main>
    </>
  );
}
