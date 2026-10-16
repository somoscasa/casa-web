"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type AdminPhoto = {
  id: string;
  url: string;
  original_filename: string | null;
  sort_order: number;
  collection_id: string | null;
  favorites_count: number;
};

export type Collection = { id: string; name: string };

const Ico = {
  drag: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" /></svg>,
  folder: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h6l2 2h10v10H3z" /></svg>,
  trash: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>,
  cover: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6" /></svg>,
  heart: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2 0 3.4 1.1 5.1 3 1.7-1.9 3.1-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" /></svg>,
};

function SortablePhoto({
  photo,
  galleryId,
  onDelete,
  collections,
  onAssignCollection,
  isCover,
  onMakeCover,
  selected,
  selecting,
  onToggleSelect,
}: {
  photo: AdminPhoto;
  galleryId: string;
  onDelete: (id: string) => void;
  collections: Collection[];
  onAssignCollection: (photoId: string, collectionId: string | null) => void;
  isCover: boolean;
  onMakeCover: (photoId: string) => void;
  selected: boolean;
  selecting: boolean;
  onToggleSelect: (photoId: string, shift: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });
  const [deleting, setDeleting] = useState(false);
  const [showCollMenu, setShowCollMenu] = useState(false);
  const [ratio, setRatio] = useState(1.5);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
    flexGrow: ratio,
    ["--r" as string]: ratio,
  } as React.CSSProperties;
  const collName = collections.find((c) => c.id === photo.collection_id)?.name;

  const handleDelete = async () => {
    if (!confirm(`Borrar "${photo.original_filename ?? "esta foto"}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/galleries/${galleryId}/photos/${photo.id}`,
        { method: "DELETE" }
      );
      if (res.ok) onDelete(photo.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`adm-pg-cell${selected ? " is-sel" : ""}${selecting ? " is-selecting" : ""}`}
      onClickCapture={(e) => {
        if (!selecting) return;
        e.preventDefault();
        e.stopPropagation();
        onToggleSelect(photo.id, e.shiftKey);
      }}
    >
      <button
        type="button"
        className="adm-pg-check"
        aria-pressed={selected}
        aria-label={selected ? "Quitar de la selección" : "Seleccionar foto"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(photo.id, e.shiftKey);
        }}
      >
        {selected && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
      </button>
      <div className="adm-pg-drag" {...attributes} {...listeners} title="Arrastrar para reordenar" aria-label="Arrastrar para reordenar">
        {Ico.drag}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.original_filename ?? ""}
        className="adm-pg-img"
        loading="lazy"
        decoding="async"
        ref={(el) => {
          // Image may finish loading before hydration, so onLoad alone can miss it.
          if (el?.complete && el.naturalWidth) setRatio(el.naturalWidth / el.naturalHeight);
        }}
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (w && h) setRatio(w / h);
        }}
      />

      {photo.favorites_count > 0 && (
        <div className="adm-pg-fav" title="Veces marcada como favorita">
          {Ico.heart} {photo.favorites_count}
        </div>
      )}

      {isCover ? (
        <div className="adm-pg-chip adm-pg-chip-cover">Portada</div>
      ) : (
        collName && <div className="adm-pg-chip">{collName}</div>
      )}

      <div className="adm-pg-overlay">
        <div className="adm-pg-name">{photo.original_filename ?? "foto"}</div>
        <div className="adm-pg-actions">
          {collections.length > 0 && (
            <div style={{ position: "relative" }}>
              <button
                className="adm-pg-btn"
                onClick={() => setShowCollMenu((v) => !v)}
                title="Asignar colección"
                aria-label="Asignar colección"
              >
                {Ico.folder}
              </button>
              {showCollMenu && (
                <div className="adm-pg-coll-menu">
                  <button
                    className="adm-pg-coll-item"
                    onClick={() => {
                      onAssignCollection(photo.id, null);
                      setShowCollMenu(false);
                    }}
                  >
                    Sin colección
                  </button>
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      className={`adm-pg-coll-item ${photo.collection_id === c.id ? "active" : ""}`}
                      onClick={() => {
                        onAssignCollection(photo.id, c.id);
                        setShowCollMenu(false);
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isCover && (
            <button
              className="adm-pg-btn adm-pg-cover-btn"
              onClick={() => onMakeCover(photo.id)}
              title="Usar como portada"
              aria-label="Usar como portada"
            >
              {Ico.cover}
              <span>Portada</span>
            </button>
          )}

          {/* Delete */}
          <button
            className="adm-pg-btn adm-pg-del"
            onClick={handleDelete}
            disabled={deleting}
            title="Borrar foto"
            aria-label="Borrar foto"
          >
            {deleting ? "…" : Ico.trash}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPhotoGrid({
  galleryId,
  initialPhotos,
  collections,
}: {
  galleryId: string;
  initialPhotos: AdminPhoto[];
  collections: Collection[];
}) {
  const PAGE_SIZE = 100;
  const router = useRouter();
  const [photos, setPhotos] = useState<AdminPhoto[]>(initialPhotos);
  const [saving, setSaving] = useState(false);
  const [filterColl, setFilterColl] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastClicked, setLastClicked] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const selecting = selected.size > 0;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(photos, oldIndex, newIndex);
      setPhotos(reordered);

      setSaving(true);
      try {
        await fetch(`/api/admin/galleries/${galleryId}/reorder`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ order: reordered.map((p) => p.id) }),
        });
      } finally {
        setSaving(false);
      }
    },
    [photos, galleryId]
  );

  const handleMakeCover = useCallback(
    async (photoId: string) => {
      const idx = photos.findIndex((p) => p.id === photoId);
      if (idx <= 0) return;
      const reordered = arrayMove(photos, idx, 0);
      setPhotos(reordered);
      setSaving(true);
      try {
        await fetch(`/api/admin/galleries/${galleryId}/reorder`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ order: reordered.map((p) => p.id) }),
        });
        router.refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        setSaving(false);
      }
    },
    [photos, galleryId, router]
  );

  const handleDelete = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  const handleAssignCollection = useCallback(
    async (photoId: string, collectionId: string | null) => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, collection_id: collectionId } : p))
      );
      await fetch(`/api/admin/photos/${photoId}/collection`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collection_id: collectionId }),
      });
    },
    []
  );

  const filteredPhotos =
    filterColl === null
      ? photos
      : filterColl === "none"
        ? photos.filter((p) => !p.collection_id)
        : photos.filter((p) => p.collection_id === filterColl);

  const toggleSelect = (photoId: string, shift: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shift && lastClicked) {
        const a = filteredPhotos.findIndex((p) => p.id === lastClicked);
        const b = filteredPhotos.findIndex((p) => p.id === photoId);
        if (a >= 0 && b >= 0) {
          const [from, to] = a < b ? [a, b] : [b, a];
          for (let i = from; i <= to; i++) next.add(filteredPhotos[i].id);
          return next;
        }
      }
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
    setLastClicked(photoId);
  };

  const selectAll = () => setSelected(new Set(filteredPhotos.map((p) => p.id)));
  const clearSelection = () => {
    setSelected(new Set());
    setMoveOpen(false);
  };

  const bulk = async (payload: { action: "delete" } | { action: "move"; collection_id: string | null }) => {
    const ids = Array.from(selected);
    const res = await fetch(`/api/admin/galleries/${galleryId}/photos/bulk`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, ids }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`No se pudo completar: ${j?.error ?? res.status}. Recargá la página y probá de nuevo.`);
      return false;
    }
    return true;
  };

  const bulkDelete = async () => {
    const n = selected.size;
    if (!confirm(`¿Borrar ${n} ${n === 1 ? "foto" : "fotos"}? Esto no se puede deshacer.`)) return;
    setBulkBusy(`Borrando ${n} fotos…`);
    try {
      if (await bulk({ action: "delete" })) {
        const gone = new Set(selected);
        const wasCover = gone.has(photos[0]?.id);
        setPhotos((prev) => prev.filter((p) => !gone.has(p.id)));
        clearSelection();
        if (wasCover) router.refresh();
      }
    } finally {
      setBulkBusy(null);
    }
  };

  const bulkMove = async (collectionId: string | null) => {
    setMoveOpen(false);
    const n = selected.size;
    setBulkBusy(`Moviendo ${n} fotos…`);
    try {
      if (await bulk({ action: "move", collection_id: collectionId })) {
        const moved = new Set(selected);
        setPhotos((prev) => prev.map((p) => (moved.has(p.id) ? { ...p, collection_id: collectionId } : p)));
        clearSelection();
      }
    } finally {
      setBulkBusy(null);
    }
  };
  const visiblePhotos = filteredPhotos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPhotos.length;

  return (
    <section style={{ marginTop: 48 }}>
      <div className="adm-pg-header">
        <div className="label">
          Fotos · {photos.length}
          {saving && <span style={{ color: "var(--ceniza)", marginLeft: 12 }}>Guardando orden…</span>}
        </div>

        {/* Collection filter tabs */}
        {collections.length > 0 && (
          <div className="adm-pg-tabs">
            <button
              className={`adm-pg-tab ${filterColl === null ? "active" : ""}`}
              onClick={() => { setFilterColl(null); setVisibleCount(PAGE_SIZE); clearSelection(); }}
            >
              Todas
            </button>
            <button
              className={`adm-pg-tab ${filterColl === "none" ? "active" : ""}`}
              onClick={() => { setFilterColl("none"); setVisibleCount(PAGE_SIZE); clearSelection(); }}
            >
              Sin colección
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                className={`adm-pg-tab ${filterColl === c.id ? "active" : ""}`}
                onClick={() => { setFilterColl(c.id); setVisibleCount(PAGE_SIZE); clearSelection(); }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <div className={`adm-sel-bar${selecting ? " on" : ""}`}>
          {selecting ? (
            <>
              <span className="adm-sel-count">
                {selected.size} {selected.size === 1 ? "seleccionada" : "seleccionadas"}
              </span>
              {selected.size < filteredPhotos.length && (
                <button className="adm-sel-link" onClick={selectAll}>
                  Seleccionar todas ({filteredPhotos.length})
                </button>
              )}
              <button className="adm-sel-link" onClick={clearSelection}>Cancelar</button>
              <span className="adm-sel-spacer" />
              {bulkBusy ? (
                <span className="adm-sel-count">{bulkBusy}</span>
              ) : (
                <>
                  <div style={{ position: "relative" }}>
                    <button className="adm-sel-btn" onClick={() => setMoveOpen((v) => !v)}>
                      Mover a…
                    </button>
                    {moveOpen && (
                      <div className="adm-sel-menu">
                        {collections.length === 0 && (
                          <div className="adm-sel-menu-empty">
                            Primero creá una colección (ej. Civil, Boda) en la sección Colecciones.
                          </div>
                        )}
                        {collections.map((c) => (
                          <button key={c.id} onClick={() => bulkMove(c.id)}>{c.name}</button>
                        ))}
                        <button onClick={() => bulkMove(null)}>Sin colección</button>
                      </div>
                    )}
                  </div>
                  <button className="adm-sel-btn adm-sel-del" onClick={bulkDelete}>Borrar</button>
                </>
              )}
            </>
          ) : (
            <>
              <span className="adm-sel-hint">Tocá el círculo de una foto para seleccionarla. Con Shift + clic marcás varias seguidas.</span>
              <span className="adm-sel-spacer" />
              <button className="adm-sel-btn" onClick={selectAll}>
                Seleccionar todas ({filteredPhotos.length})
              </button>
            </>
          )}
        </div>
      )}

      {photos.length === 0 ? (
        <p className="serif-italic" style={{ color: "var(--ceniza)" }}>
          Todavía no hay fotos. Subí las primeras arriba.
        </p>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visiblePhotos.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="adm-pg-grid">
                {visiblePhotos.map((photo) => (
                  <SortablePhoto
                    key={photo.id}
                    photo={photo}
                    galleryId={galleryId}
                    onDelete={handleDelete}
                    collections={collections}
                    onAssignCollection={handleAssignCollection}
                    isCover={photo.id === photos[0]?.id}
                    onMakeCover={handleMakeCover}
                    selected={selected.has(photo.id)}
                    selecting={selecting}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {hasMore && (
            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <button
                className="btn btn-outline"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Cargar más ({filteredPhotos.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
