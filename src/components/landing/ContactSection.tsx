"use client";

export default function ContactSection() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: conectar a Supabase
  };

  return (
    <section className="lo-sec" id="contacto" aria-labelledby="contact-heading">
      <div className="wrap">
        <div className="lo-sec-head">
          <div className="label">Contacto</div>
          <h2 id="contact-heading">Contanos sobre ustedes</h2>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ maxWidth: 600, margin: "0 auto" }}
        >
          <div className="lo-field">
            <label htmlFor="ct-nombre">Nombre</label>
            <input id="ct-nombre" type="text" placeholder="Tu nombre y el de tu pareja" />
          </div>
          <div className="lo-field">
            <label htmlFor="ct-fecha">Fecha</label>
            <input id="ct-fecha" type="text" placeholder="DD / MM / AAAA o aproximada" />
          </div>
          <div className="lo-field">
            <label htmlFor="ct-mensaje">Mensaje</label>
            <textarea id="ct-mensaje" rows={4} placeholder="Contanos sobre su evento..." />
          </div>
          <button type="submit" className="lo-btn lo-btn-fill" style={{ marginTop: 10 }}>
            Enviar consulta
          </button>
        </form>
      </div>
    </section>
  );
}
