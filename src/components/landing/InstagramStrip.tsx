"use client";

export default function InstagramStrip() {
  const boxes = Array.from({ length: 16 });
  return (
    <section className="lo-ig">
      <div className="label">Instagram</div>
      <h2
        className="lo-sec-head"
        style={{ marginBottom: 0, paddingBottom: 0 }}
      >
        @somos.casa.ok
      </h2>
      <div className="lo-ig-strip">
        <div className="lo-ig-track">
          {boxes.map((_, i) => (
            <div key={i} className="lo-ph" />
          ))}
        </div>
      </div>
    </section>
  );
}
