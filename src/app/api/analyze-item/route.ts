import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AI_MODEL = "claude-sonnet-4-5";
const PROMPT = `You are a fashion expert analyzing a clothing item photo for a fashion app called FYTD.

Analyze this image and identify the fashion item shown. Return ONLY a JSON object with no markdown, no explanation, no preamble. Just the raw JSON.

Return this exact structure:
{
  "item_name": "specific product name or descriptive name if unknown",
  "brand": "brand name if visible or identifiable, null if unknown",
  "category": "one of: Top, Bottom, Outerwear, Footwear, Accessory, Bag, Other",
  "confidence": "high/medium/low",
  "how_i_found_it": null
}

Rules:
- For item_name: be specific. Not just "sneaker" but "Low Top Sneaker" or "Air Force 1" if identifiable
- For brand: only include if you can clearly identify it from logo, design language, or distinctive features. Otherwise null
- For category: pick the single best match
- Always return null for how_i_found_it — only the user knows how they found or bought the item, the AI cannot know this
- If you cannot identify any fashion item in the image, return {"error": "No fashion item detected"}`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("[analyze-item] API key present:", !!apiKey, "| prefix:", apiKey?.substring(0, 14));

    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[analyze-item] auth user:", user?.id ?? "none");
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

    if (imageBase64.length > 6_000_000) {
      return NextResponse.json({ error: "Image too large. Please use a smaller image." }, { status: 400 });
    }

    console.log("[analyze-item] image size:", imageBase64.length, "| mediaType:", mediaType);
    console.log("[analyze-item] calling Anthropic, model:", AI_MODEL);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 1000,
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

    console.log("[analyze-item] Anthropic status:", res.status);

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[analyze-item] Anthropic error:", res.status, errBody);
      return NextResponse.json({ error: "AI service error", status: res.status }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    console.log("[analyze-item] raw response:", text);

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze-item] route crashed:", message, err instanceof Error ? err.stack : "");
    return NextResponse.json({ error: "AI analysis failed", message }, { status: 500 });
  }
}
