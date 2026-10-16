"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type Progress = {
  total: number;
  done: number;
  current: string | null;
  errors: { file: string; error: string }[];
};

export default function GalleryUploader({
  galleryId,
  existingCount,
}: {
  galleryId: string;
  existingCount: number;
}) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  const handle = async (files: FileList) => {
    if (files.length === 0) return;
    setProgress({
      total: files.length,
      done: 0,
      current: null,
      errors: [],
    });

    const supabase = getBrowserSupabase();
    const errors: Progress["errors"] = [];
    let done = 0;
    const CONCURRENCY = 4;

    const uploadOne = async (f: File, idx: number) => {
      const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase();
      const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const path = `${galleryId}/${stamp}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("photos")
        .upload(path, f, {
          contentType: f.type || "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (upErr) {
        errors.push({ file: f.name, error: upErr.message });
      } else {
        const res = await fetch(`/api/admin/galleries/${galleryId}/photos`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            storage_path: path,
            original_filename: f.name,
            sort_order: existingCount + idx,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          errors.push({ file: f.name, error: j?.error ?? "db_error" });
          await supabase.storage.from("photos").remove([path]);
        }
      }

      done++;
      setProgress((p) => ({ ...(p as Progress), done, current: f.name, errors }));
    };

    // Process in concurrent batches of CONCURRENCY
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = Array.from(files).slice(i, i + CONCURRENCY);
      await Promise.all(batch.map((f, j) => uploadOne(f, i + j)));
    }

    setProgress((p) => (p ? { ...p, current: null } : p));
    router.refresh();
  };

  return (
    <section className="adm-uploader">
      <div className="label">Subir fotos</div>
      <p className="cl-card-sub" style={{ margin: "8px 0 18px" }}>
        Soltá las fotos acá o seleccionalas. Se guardan en privado y solo tu
        cliente puede verlas con su link.
      </p>

      <label
        className="adm-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handle(e.dataTransfer.files);
        }}
      >
        <input
          ref={ref}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && handle(e.target.files)}
        />
        <span className="serif" style={{ fontSize: 22 }}>
          Arrastrá fotos acá
        </span>
        <span className="label" style={{ marginTop: 6 }}>
          o
        </span>
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: 16 }}
          onClick={() => ref.current?.click()}
        >
          Seleccionar archivos
        </button>
      </label>

      {progress && (
        <div className="adm-progress">
          <div className="label">
            {progress.done} / {progress.total} ·{" "}
            {progress.current ?? "Listo"}
          </div>
          <div className="adm-progress-bar">
            <div
              className="adm-progress-fill"
              style={{
                width: `${(progress.done / progress.total) * 100}%`,
              }}
            />
          </div>
          {progress.errors.length > 0 && (
            <ul className="cl-err" style={{ marginTop: 12, listStyle: "none" }}>
              {progress.errors.map((e, i) => (
                <li key={i}>
                  {e.file}: {e.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
