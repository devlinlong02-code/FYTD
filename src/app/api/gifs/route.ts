import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      console.error("[GIF API] GIPHY_API_KEY not configured");
      return NextResponse.json({ error: "Giphy API not configured" }, { status: 503 });
    }

    const url = query
      ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=pg-13&lang=en`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&offset=${offset}&rating=pg-13`;

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GIF API] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to fetch GIFs" }, { status: 500 });
  }
}
