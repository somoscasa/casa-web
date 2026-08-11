import Link from "next/link";
import Reveal from "@/components/Reveal";
import { PACKAGES, TESTIMONIALS, FAQ_BODAS } from "@/lib/site";
import HeroHeader from "@/components/landing/HeroHeader";
import Marquee from "@/components/landing/Marquee";
import PortfolioGallery from "@/components/landing/PortfolioGallery";
import CounterSection from "@/components/landing/CounterSection";
import ProcessSteps from "@/components/landing/ProcessSteps";
import InstagramStrip from "@/components/landing/InstagramStrip";
import LandingFooter from "@/components/landing/LandingFooter";
import ContactSection from "@/components/landing/ContactSection";

export default function HomePage() {
  return (
    <div className="lo-grain">
      <HeroHeader />
      <main>
        {/* Hero */}
        <section className="lo-hero">
          <div className="lo-hero-media">
            <div className="lo-ph" />
          </div>
          <div className="lo-hero-veil" />
          <div className="label" style={{ color: "#e2b79f" }}>
            Fotografia &middot; Video &middot; Bodas
          </div>
          <h1>CASA</h1>
          <p className="lo-tagline">Sentite en casa</p>
          <p className="lo-sub">Fotografia &middot; Video &middot; Bodas</p>
          <div className="lo-ctas">
            <Link href="/portfolio" className="lo-btn lo-btn-light">
              Ver Portfolio
            </Link>
            <Link href="/contacto" className="lo-btn lo-btn-fill">
              Reservar Fecha
            </Link>
          </div>
        </section>

        {/* Marquee */}
        <Marquee />

        {/* Portfolio gallery */}
        <PortfolioGallery />

        {/* Numbers */}
        <CounterSection />

        {/* Process */}
        <ProcessSteps />

        {/* About */}
        <section className="lo-about" id="nosotros">
          <div className="wrap">
            <Reveal>
              <div className="label" style={{ color: "var(--siena)" }}>
                Nosotros
              </div>
              <h2>Somos un estudio chico con ideas grandes.</h2>
              <p>
                Filmamos y fotografiamos bodas con un enfoque editorial y
                documental. Cuidamos la luz, los gestos y el ritmo. Lo demas
                &mdash;si te divertis, si bailas, si lloras&mdash; ya lo trae el
                dia. Nos importa que te sientas comodo. Si estas comodo, las
                fotos cambian.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Packages */}
        <section className="lo-sec" id="servicios">
          <div className="wrap">
            <div className="lo-sec-head">
              <div className="label">Servicios</div>
              <h2>Tres formas de trabajar juntos.</h2>
            </div>
            <Reveal>
              <div className="lo-pkgs">
                {PACKAGES.map((p) => (
                  <div
                    key={p.id}
                    className={`lo-pkg${p.highlight ? " lo-hl" : ""}`}
                  >
                    <div className="label">{p.name}</div>
                    {p.badge && (
                      <div
                        className="label"
                        style={{
                          color: "var(--siena)",
                          fontSize: 9,
                          marginBottom: 8,
                        }}
                      >
                        {p.badge}
                      </div>
                    )}
                    <h3>{p.name}</h3>
                    <p className="lo-desc">{p.blurb}</p>
                    <ul>
                      {(p.homeFeatures ?? p.features).map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <Link
                      href="/contacto"
                      className="lo-btn lo-btn-fill"
                      style={{ alignSelf: "flex-start" }}
                    >
                      Consultar
                    </Link>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Testimonials */}
        <section className="lo-sec">
          <div className="wrap">
            <div className="lo-sec-head">
              <div className="label">Testimonios</div>
              <h2>Lo que dicen las parejas.</h2>
            </div>
            <Reveal>
              <div className="lo-testi-grid">
                {TESTIMONIALS.map((t, i) => (
                  <div className="lo-testi" key={i}>
                    <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                    <cite>{t.attr}</cite>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="lo-sec">
          <div className="wrap">
            <div className="lo-sec-head">
              <div className="label">Preguntas frecuentes</div>
              <h2>Todo lo que necesitas saber.</h2>
            </div>
            <div className="lo-faq">
              {FAQ_BODAS.map((item, i) => (
                <details key={i}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Instagram */}
        <InstagramStrip />

        {/* Contact */}
        <ContactSection />
      </main>

      <LandingFooter />
    </div>
  );
}
