import { NextResponse } from "next/server";

const TOKEN = process.env.INSTAGRAM_TOKEN ?? "";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const LIMIT = 20;

export const revalidate = 3600; // revalidate every hour

export async function GET() {
  if (!TOKEN) {
    return NextResponse.json({ data: [] });
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${LIMIT}&access_token=${TOKEN}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      console.error("Instagram API error:", res.status, await res.text());
      return NextResponse.json({ data: [] });
    }

    const json = await res.json();
    const data = (json.data ?? [])
      .filter((p: any) => p.media_type === "IMAGE" || p.media_type === "CAROUSEL_ALBUM")
      .map((p: any) => ({
        id: p.id,
        src: p.media_url,
        permalink: p.permalink,
        caption: p.caption?.slice(0, 100) ?? "",
      }));

    return NextResponse.json({ data });
  } catch (e) {
    console.error("Instagram fetch failed:", e);
    return NextResponse.json({ data: [] });
  }
}
