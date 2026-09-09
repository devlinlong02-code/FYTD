import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AI_MODEL = "claude-sonnet-4-5";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("[scrape-product] API key present:", !!apiKey, "| prefix:", apiKey?.substring(0, 14));

    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[scrape-product] auth user:", user?.id ?? "none");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let url: string;
    try {
      ({ url } = await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!url || !url.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Step 1: Try to extract og:image and price from the page HTML (silent fail)
    let imageUrl: string | null = null;
    let price: number | null = null;
    try {
      const pageRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Sec-Fetch-Mode": "navigate",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (pageRes.ok) {
        const html = await pageRes.text();

        // Image extraction — ordered from most to least reliable
        const imagePatterns = [
          /property="og:image"\s+content="([^"]+)"/,
          /content="([^"]+)"\s+property="og:image"/,
          /property="og:image:url"\s+content="([^"]+)"/,
          /content="([^"]+)"\s+property="og:image:url"/,
          /name="twitter:image"\s+content="([^"]+)"/,
          /content="([^"]+)"\s+name="twitter:image"/,
          /name="twitter:image:src"\s+content="([^"]+)"/,
          /"image"\s*:\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
          /"image"\s*:\s*\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
          /property="product:image"\s+content="([^"]+)"/,
          /itemprop="image"\s+content="([^"]+)"/,
          /rel="preload"\s+as="image"\s+href="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
          /data-src="(https?:\/\/[^"]+\/products\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
          /src="(https?:\/\/[^"]+\/products\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
        ];
        for (const pattern of imagePatterns) {
          const match = html.match(pattern);
          if (match?.[1]?.startsWith("http")) { imageUrl = match[1]; break; }
        }
        if (imageUrl) {
          try {
            new URL(imageUrl); // validate — throws if malformed
          } catch {
            imageUrl = null;
          }
        }

        // Price extraction
        const pricePatterns = [
          /property="product:price:amount"\s+content="([^"]+)"/,
          /content="([^"]+)"\s+property="product:price:amount"/,
          /itemprop="price"\s+content="([^"]+)"/,
          /content="([^"]+)"\s+itemprop="price"/,
          /data-price="([^"]+)"/,
          /data-product-price="([^"]+)"/,
          /"price":\s*"(\d+\.?\d*)"/,
          /"price":\s*(\d+\.?\d*)/,
        ];
        for (const pattern of pricePatterns) {
          const match = html.match(pattern);
          if (match?.[1]) {
            const raw = parseFloat(match[1].replace(/[^0-9.]/g, ""));
            if (!isNaN(raw) && raw > 0) {
              // Shopify stores price in cents — divide if unreasonably large
              price = raw > 100000 ? raw / 100 : raw;
              break;
            }
          }
        }
      }
      console.log("[scrape-product] og:image:", imageUrl ?? "not found", "| price:", price ?? "not found");
    } catch {
      console.log("[scrape-product] page fetch skipped (blocked or timeout)");
    }

    // Step 2: Claude analyzes URL for name/brand/category
    console.log("[scrape-product] analyzing URL:", url);
    console.log("[scrape-product] calling Anthropic, model:", AI_MODEL);

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `You are a fashion expert helping identify products from URLs for a fashion app called FYTD.

Analyze this product URL and extract as much information as possible from the URL structure, path, slugs, and your knowledge of this brand and their products.

URL: ${url}

Return ONLY raw JSON, no markdown, no explanation:
{
  "item_name": "product name extracted from URL slug or known product",
  "brand": "brand name from domain or URL",
  "category": "one of: Top, Bottom, Outerwear, Footwear, Accessory, Bag, Other",
  "price": null,
  "confidence": "high/medium/low",
  "shop_link": "${url}"
}

Rules:
- Extract brand from domain: nike.com = Nike, ssense.com = SSENSE, grailed.com = Grailed, stockx.com = StockX, asos.com = ASOS, zara.com = Zara etc
- Extract product name from URL slug: "air-force-1-low" = "Air Force 1 Low", "box-logo-hoodie" = "Box Logo Hoodie"
- Convert hyphens and underscores to spaces and title case
- Infer category from product name keywords (hoodie/tee/shirt = Top, pants/jeans/shorts = Bottom, sneakers/boots = Footwear, jacket/coat = Outerwear, bag/backpack = Bag, hat/belt/watch = Accessory)
- Always set price to null since you cannot verify current pricing
- Set confidence based on how much you could extract: high = clear brand + product name identifiable, medium = brand clear but product name vague, low = minimal information extractable
- If URL contains no useful product information return: {"error": "Could not identify product from this URL"}`,
        }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    console.log("[scrape-product] Anthropic status:", aiRes.status);

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      console.error("[scrape-product] Anthropic error:", aiRes.status, errBody);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const aiText = aiData.content?.[0]?.text ?? "{}";
    console.log("[scrape-product] Anthropic response:", aiText);

    const parsed = JSON.parse(aiText.replace(/```json|```/g, "").trim());

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 422 });
    }

    return NextResponse.json({
      item_name: parsed.item_name || null,
      brand: parsed.brand || null,
      category: parsed.category || "Other",
      price,
      confidence: parsed.confidence || "low",
      image_url: imageUrl,
      shop_link: parsed.shop_link || url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[scrape-product] route crashed:", message, err instanceof Error ? err.stack : "");
    return NextResponse.json({ error: "Could not analyze this URL", message }, { status: 500 });
  }
}
