"use client";

import { useEffect, useState } from "react";

type Post = { id: string; src: string; permalink: string; caption: string };

export default function InstagramStrip() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/instagram")
      .then((r) => r.json())
      .then((j) => {
        if (j.data?.length) setPosts(j.data);
      })
      .catch(() => {});
  }, []);

  const items = posts.length > 0 ? posts : Array.from({ length: 16 });
  const hasPosts = posts.length > 0;

  return (
    <section className="lo-ig">
      <div className="label">Instagram</div>
      <a
        href="https://www.instagram.com/somos.casa.ok/"
        target="_blank"
        rel="noopener noreferrer"
        className="lo-sec-head"
        style={{ marginBottom: 0, paddingBottom: 0, textDecoration: "none", color: "inherit" }}
      >
        <h2 style={{ margin: 0 }}>@somos.casa.ok</h2>
      </a>
      <div className="lo-ig-strip">
        <div className="lo-ig-track">
          {items.map((item, i) =>
            hasPosts ? (
              <a
                key={(item as Post).id}
                href={(item as Post).permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="lo-ig-post"
              >
                <img
                  src={(item as Post).src}
                  alt={(item as Post).caption}
                  loading="lazy"
                />
              </a>
            ) : (
              <div key={i} className="lo-ph" />
            )
          )}
        </div>
      </div>
    </section>
  );
}
