import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <section
          className="section center"
          style={{ paddingTop: 160, paddingBottom: 160 }}
        >
          <div className="wrap">
            <div className="label">404</div>
            <h1
              className="serif"
              style={{ fontSize: 64, lineHeight: 1, margin: "16px 0 22px" }}
            >
              No encontramos esa página.
            </h1>
            <p
              className="serif-italic"
              style={{
                fontSize: 22,
                color: "var(--ceniza)",
                margin: "0 0 44px",
              }}
            >
              Quizás se fue de fiesta.
            </p>
            <Link href="/" className="btn btn-dark cta-btn">
              Volver al inicio
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
