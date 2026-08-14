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
            Tu pago está en revisión.
          </h1>
          <p className="body" style={{ color: "var(--ceniza)", maxWidth: 540, margin: "0 auto 36px" }}>
            MercadoPago todavía no confirmó tu pago. En cuanto se acredite, te
            avisamos por mail y queda tu fecha bloqueada.
          </p>
          <Link href="/" className="btn btn-dark">
            Volver al inicio
          </Link>
        </div>
      </main>
    </>
  );
}
