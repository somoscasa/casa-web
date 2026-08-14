"use client";

import { useState } from "react";
import { PORTFOLIO } from "@/lib/site";

const items = PORTFOLIO.slice(0, 4);

export default function PortfolioGallery() {
  const [active, setActive] = useState(0);

  return (
    <section className="lo-sec">
      <div className="wrap">
        <div className="lo-sec-head">
          <div className="label">Portfolio</div>
          <h2>Una historia por contar.</h2>
        </div>
        <div className="lo-gal">
          <div className="lo-gal-list">
            {items.map((item, i) => (
              <button
                key={item.id}
                className={`lo-gal-item${i === active ? " lo-on" : ""}`}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
              >
                <span className="lo-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="lo-t">{item.title}</span>
              </button>
            ))}
          </div>
          <div>
            <div className="lo-gal-stage">
              {items.map((item, i) => (
                <img
                  key={item.id}
                  src={item.src}
                  alt={item.title}
                  width={735}
                  height={1103}
                  loading={i === 0 ? "eager" : "lazy"}
                  className={i === active ? "lo-on" : ""}
                />
              ))}
            </div>
            <div className="lo-gal-cap">{items[active].sub}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
