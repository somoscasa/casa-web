import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import PortfolioGrid from "@/components/PortfolioGrid";
import { PORTFOLIO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Portfolio — CASA",
  description: "El trabajo. Fotografía y video editorial para bodas.",
};

export default function PortfolioPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="pg-hero">
          <div className="wrap">
            <Reveal>
              <div className="label">Portfolio</div>
              <h1 className="serif pg-hero-title">El trabajo.</h1>
            </Reveal>
          </div>
        </section>

        <PortfolioGrid items={PORTFOLIO} />

        <Footer />
      </main>
    </>
  );
}
