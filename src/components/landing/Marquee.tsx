"use client";

const ITEMS = ["Bodas", "Eventos Sociales", "Fotografia", "Video"];

export default function Marquee() {
  const track = [...ITEMS, ...ITEMS];
  return (
    <div className="lo-marquee">
      <div className="lo-marquee-track">
        {track.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}
