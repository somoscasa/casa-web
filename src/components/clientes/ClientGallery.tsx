"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import Lightbox from "@/components/Lightbox";
import { useGalleryCart } from "./galleryCart";
import OrderModal, { type OrderTarget } from "./OrderModal";
import GalleryCartDrawer from "./GalleryCartDrawer";
import { formatARS } from "@/lib/gallery-shop";

export type PhotoWithUrl = {
  id: string;
  url: string;
  original_filename: string | null;
  collection_id: string | null;
};

export type GalleryCollection = { id: string; name: string };

export default function ClientGallery({
  token,
  title,
  eventDate,
  photos,
  collections,
  watermarkEnabled,
  downloadPermission,
  storeEnabled = true,
}: {
  token: string;
  title: string;
  eventDate: string | null;
  photos: PhotoWithUrl[];
  collections: GalleryCollection[];
  watermarkEnabled: boolean;
  downloadPermission: "none" | "web" | "original";
  storeEnabled?: boolean;
}) {
  const [lb, setLb] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [orderTarget, setOrderTarget] = useState<OrderTarget | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useGalleryCart(token);

  // Track view + load favorites on mount
  useEffect(() => {
    fetch(`/api/clientes/${token}/view`, { method: "POST" }).catch(() => {});
    fetch(`/api/clientes/${token}/favorite`)
      .then((r) => r.json())
      .then((d: { favorites: string[] }) => setFavorites(new Set(d.favorites)))
      .catch(() => {});
  }, [token]);

  const toggleFavorite = useCallback(
    async (e: React.MouseEvent, photoId: string) => {
      e.stopPropagation();
      // Optimistic update
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(photoId)) next.delete(photoId);
        else next.add(photoId);
        return next;
      });
      await fetch(`/api/clientes/${token}/favorite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photo_id: photoId }),
      });
    },
    [token]
  );

  const openPhotoOrder = useCallback(
    (e: React.MouseEvent, p: PhotoWithUrl) => {
      e.stopPropagation();
      setOrderTarget({ mode: "photo", id: p.id, thumb: p.url, name: p.original_filename });
    },
    []
  );

  const visiblePhotos =
    activeCollection === null
      ? photos
      : photos.filter((p) => p.collection_id === activeCollection);

  const items = visiblePhotos.map((p) => ({
    src: p.url,
    title: undefined,
    sub: p.original_filename ?? undefined,
  }));

  const nav = (d: number) =>
    setLb((i) => (i == null ? i : (i + d + visiblePhotos.length) % visiblePhotos.length));

  const downloadAll = () => {
    if (downloadPermission === "none") return;
    window.location.href = `/api/clientes/${token}/zip`;
  };

  return (
    <main id="main" className="gal">
      <header className="gal-head">
        <Link href="/" className="wordmark gal-mark" aria-label="CASA">
          CASA
        </Link>
        <span className="gal-head-c label">Galería privada</span>
        <div className="gal-head-r">
          <Link href="/" className="gal-logout">
            Salir
          </Link>
        </div>
      </header>

      <div className="gal-title-bar">
        <div className="wrap gal-title-inner">
          <h1 className="serif gal-title">{title}</h1>
          {eventDate && (
            <span className="gal-date">
              {new Date(eventDate).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Collection filter tabs */}
      {collections.length > 0 && (
        <div className="gal-coll-bar">
          <div className="wrap gal-coll-tabs">
            <button
              className={`gal-coll-tab ${activeCollection === null ? "active" : ""}`}
              onClick={() => setActiveCollection(null)}
            >
              Todas
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                className={`gal-coll-tab ${activeCollection === c.id ? "active" : ""}`}
                onClick={() => setActiveCollection(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {visiblePhotos.length === 0 ? (
        <div className="gal-empty serif-italic">
          {photos.length === 0
            ? "Tu galería se está armando. Volvé en unos días."
            : "No hay fotos en esta sección."}
        </div>
      ) : (
        <div className="gal-grid">
          {visiblePhotos.map((p, i) => (
            <div key={p.id} className={`gal-cell${watermarkEnabled ? " gal-wm" : ""}`}>
              <button
                className="gal-cell-btn"
                onClick={() => setLb(i)}
                aria-label={`Foto ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.original_filename ?? ""} loading="lazy" />
                {watermarkEnabled && <div className="gal-wm-text">CASA</div>}
              </button>
              <button
                className={`gal-fav-btn${favorites.has(p.id) ? " active" : ""}`}
                onClick={(e) => toggleFavorite(e, p.id)}
                aria-label={favorites.has(p.id) ? "Quitar favorito" : "Marcar favorito"}
              >
                ♥
              </button>
              {storeEnabled && (
                <button
                  className="gal-buy-btn"
                  onClick={(e) => openPhotoOrder(e, p)}
                  aria-label="Pedir impresión de esta foto"
                >
                  Pedir impresión
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {visiblePhotos.length > 0 && (
        <div className="gal-bar">
          <div className="gal-bar-count">
            <span className="gal-bar-num">{visiblePhotos.length}</span> fotos
            {favorites.size > 0 && (
              <span className="gal-bar-fav"> · ♥ {favorites.size}</span>
            )}
          </div>
          <div className="gal-bar-actions">
            {storeEnabled && (
              <button
                className="btn btn-outline gal-bar-btn"
                onClick={() => setOrderTarget({ mode: "album" })}
              >
                Pedir álbum de la boda
              </button>
            )}
            {downloadPermission !== "none" && (
              <button className="btn btn-dark gal-bar-btn" onClick={downloadAll}>
                Descargar todo (ZIP)
              </button>
            )}
          </div>
        </div>
      )}

      <Lightbox
        items={items}
        index={lb}
        onClose={() => setLb(null)}
        onNav={nav}
      />

      {/* Store: order modal */}
      {storeEnabled && orderTarget && (
        <OrderModal
          target={orderTarget}
          onClose={() => setOrderTarget(null)}
          onAdd={(product, qty, photo) => {
            cart.add(product, qty, photo);
            setCartOpen(true);
          }}
        />
      )}

      {/* Store: floating cart button */}
      {storeEnabled && cart.totalItems > 0 && !cartOpen && (
        <button className="gal-cart-fab" onClick={() => setCartOpen(true)}>
          <span className="gal-cart-fab-count">{cart.totalItems}</span>
          <span className="gal-cart-fab-label">Mi pedido</span>
          <span className="gal-cart-fab-total">{formatARS(cart.total)}</span>
        </button>
      )}

      {/* Store: cart drawer */}
      {storeEnabled && cartOpen && (
        <GalleryCartDrawer
          token={token}
          items={cart.items}
          total={cart.total}
          onClose={() => setCartOpen(false)}
          onRemove={cart.remove}
          onSetQty={cart.setQty}
          onClear={cart.clear}
        />
      )}
    </main>
  );
}
