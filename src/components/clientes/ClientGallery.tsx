"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

const PAGE_SIZE = 60;

const Icon = {
  heart: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2 0 3.4 1.1 5.1 3 1.7-1.9 3.1-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" /></svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 20h16" /></svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5l7 7-7 7M21 12H9c-3.3 0-6 2.7-6 6v1" /></svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" /></svg>
  ),
};

function downloadUrl(p: PhotoWithUrl) {
  const name = encodeURIComponent(p.original_filename ?? "foto.jpg");
  return `${p.url}${p.url.includes("?") ? "&" : "?"}download=${name}`;
}

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
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [orderTarget, setOrderTarget] = useState<OrderTarget | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [toast, setToast] = useState<string | null>(null);
  const [slideshow, setSlideshow] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const cart = useGalleryCart(token);
  const canDownload = downloadPermission !== "none";

  useEffect(() => {
    fetch(`/api/clientes/${token}/view`, { method: "POST" }).catch(() => {});
    fetch(`/api/clientes/${token}/favorite`)
      .then((r) => r.json())
      .then((d: { favorites: string[] }) => setFavorites(new Set(d.favorites)))
      .catch(() => {});
  }, [token]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleFavorite = useCallback(
    async (e: React.MouseEvent, photoId: string) => {
      e.stopPropagation();
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
    [token],
  );

  const share = async (url?: string) => {
    const link = url ?? window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      flash("Link copiado");
    } catch {
      /* user cancelled */
    }
  };

  const filteredPhotos = photos.filter(
    (p) =>
      (activeCollection === null || p.collection_id === activeCollection) &&
      (!onlyFavs || favorites.has(p.id)),
  );
  const visiblePhotos = filteredPhotos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPhotos.length;

  const items = filteredPhotos.map((p) => ({
    src: p.url,
    title: undefined,
    sub: p.original_filename ?? undefined,
  }));

  const nav = useCallback(
    (d: number) =>
      setLb((i) =>
        i == null || filteredPhotos.length === 0
          ? i
          : (i + d + filteredPhotos.length) % filteredPhotos.length,
      ),
    [filteredPhotos.length],
  );

  useEffect(() => {
    if (!slideshow || lb == null) return;
    const t = setInterval(() => nav(1), 4000);
    return () => clearInterval(t);
  }, [slideshow, lb, nav]);

  const startSlideshow = () => {
    if (filteredPhotos.length === 0) return;
    setSlideshow(true);
    setLb(0);
  };

  const downloadAll = () => {
    if (!canDownload) return;
    window.location.href = `/api/clientes/${token}/zip`;
  };

  const scrollToGrid = () =>
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const cover = photos[0];
  const dateLabel = eventDate
    ? new Date(eventDate + "T12:00:00").toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const resetPaging = () => setVisibleCount(PAGE_SIZE);

  return (
    <main id="main" className="gp">
      {/* Cover */}
      <section className="gp-cover">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" className="gp-cover-img" />
        )}
        <div className="gp-cover-shade" />
        <div className="gp-cover-body">
          <h1 className="gp-cover-title">{title}</h1>
          {dateLabel && <p className="gp-cover-date">{dateLabel}</p>}
          <button className="gp-cover-btn" onClick={scrollToGrid}>
            Ver galería
          </button>
        </div>
        <div className="gp-cover-mark">CASA</div>
      </section>

      {/* Sticky header */}
      <header className="gp-head" ref={gridRef}>
        <div className="gp-head-l">
          <div className="gp-head-title">{title}</div>
          <div className="gp-head-sub">CASA</div>
        </div>
        <div className="gp-head-r">
          <button
            className={`gp-ico${onlyFavs ? " on" : ""}`}
            onClick={() => {
              setOnlyFavs((v) => !v);
              resetPaging();
            }}
            aria-label={onlyFavs ? "Ver todas" : "Ver mis favoritas"}
            title={onlyFavs ? "Ver todas" : `Mis favoritas (${favorites.size})`}
          >
            {Icon.heart}
            {favorites.size > 0 && <span className="gp-ico-n">{favorites.size}</span>}
          </button>
          {canDownload && (
            <button className="gp-ico" onClick={downloadAll} aria-label="Descargar todo" title="Descargar todo (ZIP)">
              {Icon.download}
            </button>
          )}
          <button className="gp-ico" onClick={() => share()} aria-label="Compartir galería" title="Compartir">
            {Icon.share}
          </button>
          <button className="gp-ico" onClick={startSlideshow} aria-label="Ver presentación" title="Presentación">
            {Icon.play}
          </button>
        </div>
      </header>

      {/* Collections */}
      {collections.length > 0 && (
        <nav className="gp-tabs" aria-label="Colecciones">
          <button
            className={`gp-tab${activeCollection === null ? " on" : ""}`}
            onClick={() => {
              setActiveCollection(null);
              resetPaging();
            }}
          >
            Todas
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              className={`gp-tab${activeCollection === c.id ? " on" : ""}`}
              onClick={() => {
                setActiveCollection(c.id);
                resetPaging();
              }}
            >
              {c.name}
            </button>
          ))}
        </nav>
      )}

      {/* Masonry grid */}
      {visiblePhotos.length === 0 ? (
        <div className="gp-empty">
          {photos.length === 0
            ? "Tu galería se está armando. Volvé en unos días."
            : onlyFavs
              ? "Todavía no marcaste favoritas. Tocá el corazón en las fotos que más te gusten."
              : "No hay fotos en esta sección."}
        </div>
      ) : (
        <div className="gp-grid">
          {visiblePhotos.map((p, i) => (
            <figure key={p.id} className={`gp-cell${watermarkEnabled ? " gp-wm" : ""}`}>
              <button className="gp-cell-btn" onClick={() => setLb(i)} aria-label={`Abrir foto ${i + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.original_filename ?? ""} loading="lazy" decoding="async" />
                {watermarkEnabled && <span className="gp-wm-text">CASA</span>}
              </button>
              <div className="gp-cell-actions">
                <button
                  className={`gp-act${favorites.has(p.id) ? " fav" : ""}`}
                  onClick={(e) => toggleFavorite(e, p.id)}
                  aria-label={favorites.has(p.id) ? "Quitar de favoritas" : "Marcar favorita"}
                >
                  {Icon.heart}
                </button>
                {canDownload && (
                  <a className="gp-act" href={downloadUrl(p)} aria-label="Descargar foto" onClick={(e) => e.stopPropagation()}>
                    {Icon.download}
                  </a>
                )}
                <button className="gp-act" onClick={(e) => { e.stopPropagation(); share(p.url); }} aria-label="Compartir foto">
                  {Icon.share}
                </button>
              </div>
              {storeEnabled && (
                <button
                  className="gp-buy"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrderTarget({ mode: "photo", id: p.id, thumb: p.url, name: p.original_filename });
                  }}
                >
                  Imprimir
                </button>
              )}
            </figure>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="gp-more">
          <button className="gp-more-btn" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Ver más fotos · {filteredPhotos.length - visibleCount} restantes
          </button>
        </div>
      )}

      <footer className="gp-foot">
        <div className="gp-foot-mark">CASA</div>
        {storeEnabled && photos.length > 0 && (
          <button className="gp-foot-link" onClick={() => setOrderTarget({ mode: "album" })}>
            Pedir el álbum de la boda
          </button>
        )}
      </footer>

      <Lightbox
        items={items}
        index={lb}
        onClose={() => {
          setLb(null);
          setSlideshow(false);
        }}
        onNav={nav}
      />

      {toast && <div className="gp-toast" role="status">{toast}</div>}

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

      {storeEnabled && cart.totalItems > 0 && !cartOpen && (
        <button className="gal-cart-fab gp-cart-fab" onClick={() => setCartOpen(true)}>
          <span className="gal-cart-fab-count">{cart.totalItems}</span>
          <span className="gal-cart-fab-label">Mi pedido</span>
          <span className="gal-cart-fab-total">{formatARS(cart.total)}</span>
        </button>
      )}

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
