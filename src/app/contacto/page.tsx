import type { Metadata } from "next";
import Header from "@/components/Header";
import ContactForm from "@/components/ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto — CASA",
  description: "Escribinos para consultar tu fecha.",
};

export default function ContactoPage() {
  return (
    <>
      <Header />
      <main id="main" className="page-contacto">
        <div className="ct-left">
          <div className="ct-left-inner">
            <div className="wordmark ct-mark">CASA</div>
            <h1 className="serif ct-title">Hablemos.</h1>
            <div className="ct-info">
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp · {SITE.whatsappRaw}
              </a>
              <span>{SITE.city}</span>
              <span className="ct-hours">L–V 10–19h · Sáb 10–14h</span>
            </div>
            <p className="serif-italic ct-foot-tag">{SITE.tagline}</p>
          </div>
        </div>

        <div className="ct-right">
          <ContactForm />
        </div>
      </main>
    </>
  );
}
