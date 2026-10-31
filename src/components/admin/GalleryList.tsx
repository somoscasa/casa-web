"use client";

import Link from "next/link";
import { useState } from "react";

export type GalleryListItem = {
  id: string;
  title: string;
  email: string | null;
  code: string;
  photos: number;
  active: boolean;
  expired: boolean;
  eventDate: string | null;
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function GalleryList({ items }: { items: GalleryListItem[] }) {
  const [q, setQ] = useState("");
  const query = norm(q.trim());
  const shown = query
    ? items.filter((g) => norm(`${g.title} ${g.email ?? ""} ${g.code}`).includes(query))
    : items;

  return (
    <>
      <div className="adm-search">
        <input
          type="search"
          className="adm-input"
          placeholder="Buscar por nombre, mail o código"
          aria-label="Buscar galerías"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="label">
          {query ? `${shown.length} de ${items.length}` : `${items.length} ${items.length === 1 ? "galería" : "galerías"}`}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="serif-italic adm-cli-empty">Ninguna galería coincide con &ldquo;{q}&rdquo;.</p>
      ) : (
        <ul className="adm-list">
          {shown.map((g) => (
            <li key={g.id} className="adm-row">
              <div>
                <div className="serif adm-row-title">{g.title}</div>
                <div className="label adm-row-meta">
                  {g.email && <>{g.email} · </>}
                  {g.photos} fotos · código {g.code} ·{" "}
                  {g.expired ? "vencida" : g.active ? "activa" : "pausada"}
                  {g.eventDate && <> · {new Date(g.eventDate + "T12:00:00").toLocaleDateString("es-AR")}</>}
                </div>
              </div>
              <div className="adm-row-actions">
                <Link href={`/clientes/${g.code}`} target="_blank" className="link-arrow">
                  Ver galería <span className="arr">→</span>
                </Link>
                <Link href={`/admin/galerias/${g.id}`} className="btn btn-outline adm-row-btn">
                  Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
