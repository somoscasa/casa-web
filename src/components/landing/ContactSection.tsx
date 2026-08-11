"use client";

export default function ContactSection() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: conectar a Supabase
  };

  return (
    <section className="lo-sec" id="contacto">
      <div className="wrap">
        <div className="lo-sec-head">
          <div className="label">Contacto</div>
          <h2>Contanos sobre ustedes</h2>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ maxWidth: 600, margin: "0 auto" }}
        >
          <div className="lo-field">
            <label>Nombre</label>
            <input type="text" placeholder="Tu nombre y el de tu pareja" />
          </div>
          <div className="lo-field">
            <label>Fecha</label>
            <input type="text" placeholder="DD / MM / AAAA o aproximada" />
          </div>
          <div className="lo-field">
            <label>Mensaje</label>
            <textarea rows={4} placeholder="Contanos sobre su evento..." />
          </div>
          <button type="submit" className="lo-btn lo-btn-fill" style={{ marginTop: 10 }}>
            Enviar consulta
          </button>
        </form>
      </div>
    </section>
  );
}
