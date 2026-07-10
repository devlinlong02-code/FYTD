import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AI_MODEL = "claude-sonnet-4-5";
const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const PROMPT = `You are a fashion expert analyzing a full outfit photo for FYTD.

Identify ALL visible clothing items and accessories. Return ONLY a JSON array, no markdown, no explanation:

[
  {
    "item_name": "specific descriptive name",
    "brand": "brand name if identifiable, null if not",
    "category": "one of: Top, Bottom, Outerwear, Footwear, Accessory, Bag, Other",
    "confidence": "high/medium/low",
    "notes": "brief detail under 40 chars"
  }
]

Rules:
- Include every visible piece top to bottom: tops, bottoms, shoes, outerwear, bags, hats, jewelry, belts, socks if visible
- Order from top to bottom of the outfit
- Be specific: not "pants" but "Straight Leg Jeans" or "Cargo Pants"
- Only identify brands when logo or distinctive design is clearly visible
- Maximum 8 items
- If no outfit visible return []`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let imageBase64: string, mediaType: string;
    try {
      ({ imageBase64, mediaType } = await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: "Missing imageBase64 or mediaType" }, { status: 400 });
    }

    if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: PROMPT },
          ],
        }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.error("[analyze-outfit] Anthropic error:", res.status);
      return NextResponse.json([], { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "[]";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    console.error("[analyze-outfit] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json([], { status: 500 });
  }
}
