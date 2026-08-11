import { SITE } from "@/lib/site";

export default function LandingFooter() {
  return (
    <footer className="lo-footer">
      <div className="wrap">
        <div className="lo-ft-top">
          <div className="lo-ft-logo">C A S A</div>
          <div className="lo-ft-cols">
            <div>
              <div className="label lo-ft-h">Navegacion</div>
              <a href="/portfolio">Portfolio</a>
              <a href="/servicios">Servicios</a>
              <a href="/bodas">Bodas</a>
              <a href="/nosotros">Nosotros</a>
            </div>
            <div>
              <div className="label lo-ft-h">Contacto</div>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
                {SITE.whatsappRaw}
              </a>
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
                {SITE.instagramHandle}
              </a>
            </div>
            <div>
              <div className="label lo-ft-h">Legal</div>
              <a href="#">Privacidad</a>
              <a href="#">Terminos</a>
            </div>
          </div>
        </div>
        <div className="lo-ft-bottom">
          <span>&copy; {new Date().getFullYear()} CASA. Todos los derechos reservados.</span>
          <span>{SITE.city}</span>
        </div>
      </div>
    </footer>
  );
}
