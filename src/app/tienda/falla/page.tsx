import Link from "next/link";
import Header from "@/components/Header";

export const metadata = {
  title: "Pedido no completado — CASA",
  robots: { index: false, follow: false },
};

export default function Falla() {
  return (
    <>
      <Header />
      <main id="main" className="section center" style={{ paddingTop: 160, paddingBottom: 160 }}>
        <div className="wrap">
          <h1 className="serif" style={{ fontSize: 48, margin: "0 0 22px" }}>
            No pudimos confirmar tu pedido.
          </h1>
          <p className="body" style={{ color: "var(--ceniza)", marginBottom: 36 }}>
            Si querés volver a intentarlo, lo arrancamos de nuevo desde la tienda.
          </p>
          <Link href="/tienda" className="btn btn-dark">
            Volver a la tienda
          </Link>
        </div>
      </main>
    </>
  );
}
