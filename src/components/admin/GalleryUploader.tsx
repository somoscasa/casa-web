"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type Progress = {
  total: number;
  done: number;
  ok: number;
  running: boolean;
  skipped: string[];
  errors: { file: string; error: string }[];
};

const CONCURRENCY = 4;
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = new Set(["jpg", "jpeg", "png", "webp"]);

function friendlyError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("exceeded") || m.includes("too large") || m.includes("payload")) return "la foto pesa demasiado (máximo 50 MB)";
  if (m.includes("quota") || m.includes("storage limit")) return "se llenó el espacio de Supabase";
  if (m.includes("failed to fetch") || m.includes("network")) return "se cortó la conexión";
  if (m.includes("row-level security") || m.includes("unauthorized") || m.includes("jwt")) return "tu sesión expiró, volvé a entrar al Admin";
  return msg;
}

export default function GalleryUploader({
  galleryId,
  existingCount,
  existingNames,
}: {
  galleryId: string;
  existingCount: number;
  existingNames: string[];
}) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const running = progress?.running ?? false;

  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  const handle = async (list: FileList) => {
    if (running || list.length === 0) return;
    const files = Array.from(list);
    const known = new Set(existingNames.map((n) => n.toLowerCase()));
    const skipped: string[] = [];
    const errors: Progress["errors"] = [];
    const queue: File[] = [];

    for (const f of files) {
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      if (!ALLOWED.has(ext)) {
        errors.push({ file: f.name, error: ext === "heic" || ext === "heif" ? "formato HEIC no se ve en navegadores, exportala como JPG" : "formato no admitido (usá JPG, PNG o WEBP)" });
      } else if (f.size > MAX_BYTES) {
        errors.push({ file: f.name, error: "pesa más de 50 MB, exportala más liviana" });
      } else if (known.has(f.name.toLowerCase())) {
        skipped.push(f.name);
      } else {
        known.add(f.name.toLowerCase());
        queue.push(f);
      }
    }

    setProgress({ total: queue.length, done: 0, ok: 0, running: queue.length > 0, skipped, errors: [...errors] });
    if (queue.length === 0) return;

    const supabase = getBrowserSupabase();
    let done = 0;
    let ok = 0;

    const uploadOne = async (f: File, idx: number) => {
      const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase();
      const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const path = `${galleryId}/${stamp}.${ext}`;

      let upErr: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { error } = await supabase.storage.from("photos").upload(path, f, {
            contentType: f.type || "image/jpeg",
            cacheControl: "3600",
            upsert: false,
          });
          upErr = error ? error.message : null;
          // A retry after a dropped response can find the file already stored.
          if (upErr && attempt > 0 && /already exists|duplicate/i.test(upErr)) upErr = null;
        } catch (e) {
          upErr = e instanceof Error ? e.message : "network";
        }
        if (!upErr || !/fetch|network|timeout|50\d/i.test(upErr)) break;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }

      if (upErr) {
        errors.push({ file: f.name, error: friendlyError(upErr) });
      } else {
        const res = await fetch(`/api/admin/galleries/${galleryId}/photos`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            storage_path: path,
            original_filename: f.name,
            sort_order: existingCount + idx,
          }),
        }).catch(() => null);
        if (!res?.ok) {
          const j = res ? await res.json().catch(() => ({})) : {};
          errors.push({ file: f.name, error: friendlyError(j?.error ?? "no se pudo registrar la foto") });
          await supabase.storage.from("photos").remove([path]);
        } else {
          ok++;
        }
      }

      done++;
      setProgress((p) => (p ? { ...p, done, ok, errors: [...errors] } : p));
    };

    let next = 0;
    const worker = async () => {
      while (next < queue.length) {
        const i = next++;
        await uploadOne(queue[i], i);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setProgress((p) => (p ? { ...p, running: false } : p));
    router.refresh();
  };

  const pct = progress && progress.total > 0 ? (progress.done / progress.total) * 100 : 100;

  return (
    <section className="adm-uploader">
      <div className="label">Subir fotos</div>
      <p className="cl-card-sub" style={{ margin: "8px 0 18px" }}>
        Soltá las fotos acá o seleccionalas (JPG, PNG o WEBP, hasta 50 MB cada una). Se guardan
        tal cual, sin perder calidad. Si una foto ya está en la galería, se saltea.
      </p>

      <label
        className="adm-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handle(e.dataTransfer.files);
        }}
        style={running ? { opacity: 0.5, pointerEvents: "none" } : undefined}
      >
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) handle(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="serif" style={{ fontSize: 22 }}>
          {running ? "Subiendo…" : "Arrastrá fotos acá"}
        </span>
        <span className="label" style={{ marginTop: 6 }}>
          o
        </span>
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: 16 }}
          onClick={() => ref.current?.click()}
          disabled={running}
        >
          Seleccionar archivos
        </button>
      </label>

      {progress && (
        <div className="adm-progress">
          <div className="label">
            {progress.running
              ? `Subiendo ${progress.done} de ${progress.total} — no cierres esta página`
              : `Listo: ${progress.ok} ${progress.ok === 1 ? "foto subida" : "fotos subidas"}`}
          </div>
          <div className="adm-progress-bar">
            <div className="adm-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          {progress.skipped.length > 0 && (
            <p className="adm-settings-hint" style={{ marginTop: 12 }}>
              {progress.skipped.length === 1
                ? "1 foto ya estaba en la galería y no se volvió a subir."
                : `${progress.skipped.length} fotos ya estaban en la galería y no se volvieron a subir.`}
            </p>
          )}
          {progress.errors.length > 0 && (
            <>
              <p className="cl-err" style={{ marginTop: 12 }}>
                {progress.errors.length} {progress.errors.length === 1 ? "foto no se subió" : "fotos no se subieron"}:
              </p>
              <ul className="cl-err" style={{ marginTop: 6, listStyle: "none", maxHeight: 200, overflow: "auto" }}>
                {progress.errors.map((e, i) => (
                  <li key={i}>
                    {e.file}: {e.error}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
