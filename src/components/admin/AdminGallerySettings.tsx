"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  title: string;
  is_active: boolean;
  expires_at: string | null;
  download_permission: "none" | "web" | "original";
  watermark_enabled: boolean;
};

function argDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

export default function AdminGallerySettings({
  galleryId,
  initial,
}: {
  galleryId: string;
  initial: Settings;
}) {
  const router = useRouter();
  const [s, setS] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/galleries/${galleryId}/settings`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...s,
          expires_at: s.expires_at || null,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("No se pudo guardar. Revisá tu conexión y probá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="adm-settings">
      <div className="label adm-settings-title">Configuración</div>

      <div className="adm-settings-grid">
        {/* Title */}
        <div className="adm-settings-field">
          <label className="adm-settings-label">Título de la galería</label>
          <input
            type="text"
            className="adm-input"
            value={s.title}
            onChange={(e) => setS((p) => ({ ...p, title: e.target.value }))}
          />
        </div>

        {/* Active toggle */}
        <div className="adm-settings-field">
          <label className="adm-settings-label">Estado</label>
          <div className="adm-toggle-row">
            <button
              className={`adm-toggle ${s.is_active ? "on" : "off"}`}
              onClick={() => setS((p) => ({ ...p, is_active: !p.is_active }))}
            >
              <span className="adm-toggle-knob" />
            </button>
            <span className="adm-toggle-label">
              {s.is_active ? "Activa — cliente puede verla" : "Inactiva — cliente no puede entrar"}
            </span>
          </div>
        </div>

        {/* Expiry date */}
        <div className="adm-settings-field">
          <label className="adm-settings-label">Fecha de expiración (opcional)</label>
          <input
            type="date"
            className="adm-input"
            value={s.expires_at ? argDate(s.expires_at) : ""}
            onChange={(e) =>
              setS((p) => ({
                ...p,
                expires_at: e.target.value ? e.target.value + "T23:59:59-03:00" : null,
              }))
            }
          />
          <span className="adm-settings-hint">
            La galería se bloquea a las 23:59 (hora de Argentina) de ese día.
          </span>
        </div>

        {/* Download permission */}
        <div className="adm-settings-field">
          <label className="adm-settings-label">Permiso de descarga</label>
          <div className="adm-radio-group">
            {(["original", "none"] as const).map((v) => (
              <label key={v} className="adm-radio">
                <input
                  type="radio"
                  name="dl"
                  checked={s.download_permission === v}
                  onChange={() => setS((p) => ({ ...p, download_permission: v }))}
                />
                <span>
                  {v === "original" && "Descarga completa (original)"}
                  {v === "none" && "Sin descarga"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Watermark */}
        <div className="adm-settings-field">
          <label className="adm-settings-label">Marca de agua</label>
          <div className="adm-toggle-row">
            <button
              className={`adm-toggle ${s.watermark_enabled ? "on" : "off"}`}
              onClick={() => setS((p) => ({ ...p, watermark_enabled: !p.watermark_enabled }))}
            >
              <span className="adm-toggle-knob" />
            </button>
            <span className="adm-toggle-label">
              {s.watermark_enabled
                ? "Activa — se muestra CASA sobre las fotos"
                : "Desactivada — fotos sin marca"}
            </span>
          </div>
          <span className="adm-settings-hint">
            La marca es visual en pantalla. El ZIP siempre descarga los originales sin marca.
          </span>
        </div>
      </div>

      {error && <p className="cl-err" style={{ marginTop: 16 }}>{error}</p>}
      <button
        className="btn btn-dark"
        onClick={save}
        disabled={saving}
        style={{ marginTop: 24 }}
      >
        {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar configuración"}
      </button>
    </section>
  );
}
