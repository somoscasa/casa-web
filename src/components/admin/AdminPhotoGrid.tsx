"use client";

import { useState, useCallback } from "react";
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

function SortablePhoto({
  photo,
  galleryId,
  onDelete,
  collections,
  onAssignCollection,
}: {
  photo: AdminPhoto;
  galleryId: string;
  onDelete: (id: string) => void;
  collections: Collection[];
  onAssignCollection: (photoId: string, collectionId: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });
  const [deleting, setDeleting] = useState(false);
  const [showCollMenu, setShowCollMenu] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

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
    <div ref={setNodeRef} style={style} className="adm-pg-cell">
      {/* Drag handle */}
      <div className="adm-pg-drag" {...attributes} {...listeners} title="Arrastrar para reordenar">
        ⠿
      </div>

      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.original_filename ?? ""} className="adm-pg-img" loading="lazy" />

      {/* Favorites badge */}
      {photo.favorites_count > 0 && (
        <div className="adm-pg-fav">♥ {photo.favorites_count}</div>
      )}

      {/* Overlay actions */}
      <div className="adm-pg-overlay">
        <div className="adm-pg-name">{photo.original_filename ?? "foto"}</div>
        <div className="adm-pg-actions">
          {/* Collection assign */}
          {collections.length > 0 && (
            <div style={{ position: "relative" }}>
              <button
                className="adm-pg-btn"
                onClick={() => setShowCollMenu((v) => !v)}
                title="Asignar colección"
              >
                {photo.collection_id
                  ? (collections.find((c) => c.id === photo.collection_id)?.name ?? "📁")
                  : "📁"}
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

          {/* Delete */}
          <button
            className="adm-pg-btn adm-pg-del"
            onClick={handleDelete}
            disabled={deleting}
            title="Borrar foto"
          >
            {deleting ? "…" : "✕"}
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
  const [photos, setPhotos] = useState<AdminPhoto[]>(initialPhotos);
  const [saving, setSaving] = useState(false);
  const [filterColl, setFilterColl] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
    filterColl === null ? photos : photos.filter((p) => p.collection_id === filterColl);
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
              onClick={() => { setFilterColl(null); setVisibleCount(PAGE_SIZE); }}
            >
              Todas
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                className={`adm-pg-tab ${filterColl === c.id ? "active" : ""}`}
                onClick={() => { setFilterColl(c.id); setVisibleCount(PAGE_SIZE); }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

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
