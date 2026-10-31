"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteGalleryButton({
  galleryId,
  title,
  photoCount,
}: {
  galleryId: string;
  title: string;
  photoCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = typed.trim().toUpperCase() === "BORRAR";

  const remove = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/galleries/${galleryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      router.replace("/admin?borrada=1");
      router.refresh();
    } catch {
      setError("No se pudo borrar la galería. Revisá tu conexión y probá de nuevo; no se perdió nada.");
      setBusy(false);
    }
  };

  return (
    <section className="adm-danger">
      <div className="label adm-settings-title">Borrar galería</div>
      <p className="adm-settings-hint">
        Borra la galería, sus {photoCount} {photoCount === 1 ? "foto" : "fotos"}, colecciones y
        favoritos, y libera ese espacio en Supabase. Los novios ya no van a poder entrar. Los
        pedidos de impresión se conservan. <strong>No se puede deshacer.</strong> Si solo querés
        cerrarla un tiempo, usá &ldquo;Estado: Inactiva&rdquo; en la configuración.
      </p>

      {!open ? (
        <button className="btn adm-danger-btn" onClick={() => setOpen(true)}>
          Borrar esta galería
        </button>
      ) : (
        <div className="adm-danger-confirm">
          <label className="adm-settings-label" htmlFor="del-confirm">
            Para borrar &ldquo;{title}&rdquo;, escribí BORRAR
          </label>
          <input
            id="del-confirm"
            className="adm-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoFocus
            disabled={busy}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn adm-danger-btn" onClick={remove} disabled={!ready || busy}>
              {busy ? "Borrando… no cierres la página" : "Borrar definitivamente"}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              disabled={busy}
            >
              Cancelar
            </button>
          </div>
          {error && <p className="cl-err" style={{ marginTop: 12 }}>{error}</p>}
        </div>
      )}
    </section>
  );
}
