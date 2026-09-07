"use client";

import { startTransition, useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import MultiMediaUpload from "@/components/MultiMediaUpload";
import FitBreakdownBuilder, { type Piece } from "@/components/FitBreakdownBuilder";
import StyleTagPicker from "@/components/StyleTagPicker";
import { createOutfit } from "@/app/actions/upload";

// ─────────────────────────────────────────────────────────────────────────────
// Card Style Picker
// ─────────────────────────────────────────────────────────────────────────────

type CardStyleKey = "editorial" | "statement" | "streetwear";

const CARD_STYLES: { key: CardStyleKey; name: string; tagline: string; description: string }[] = [
  {
    key: "editorial",
    name: "Editorial",
    tagline: "Clean title on the photo",
    description: "Your outfit title sits over the image. Piece count shows quietly below.",
  },
  {
    key: "statement",
    name: "Statement",
    tagline: "Price badge front and center",
    description: "Fit value shows as a bold white badge. Best for flexing the total.",
  },
  {
    key: "streetwear",
    name: "Streetwear",
    tagline: "Data above, photo below",
    description: "Piece count and value sit above the image like a data card.",
  },
];

function StylePreview({ styleKey, previewImage }: { styleKey: CardStyleKey; previewImage: string | null }) {
  const img = previewImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={previewImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  ) : null;

  const gradient = previewImage ? null : (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1a1a2a,#0a0a1a)" }} />
  );

  if (styleKey === "editorial") {
    return (
      <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
        {img ?? gradient}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 55%)" }} />
        <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(255,255,255,0.12)", borderRadius: 999, padding: "2px 6px", fontSize: 7, fontWeight: 600, color: "white", letterSpacing: "0.06em", fontFamily: "var(--font-body)" }}>
          TITLE HERO
        </div>
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 500, color: "white", letterSpacing: "-0.01em", marginBottom: 3, lineHeight: 1.1 }}>Outfit Title</div>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em" }}>5 PIECES · $2,590</div>
        </div>
      </div>
    );
  }

  if (styleKey === "statement") {
    return (
      <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
        {img ?? <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#2a1a1a,#1a0a0a)" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 55%)" }} />
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ background: "rgba(0,0,0,0.65)", borderRadius: 999, padding: "3px 7px", fontSize: 7, fontFamily: "monospace", color: "rgba(255,255,255,0.8)", letterSpacing: "0.04em" }}>5pc</div>
          <div style={{ background: "white", borderRadius: 999, padding: "3px 7px", fontSize: 8, fontFamily: "monospace", fontWeight: 700, color: "#0a0a0a", letterSpacing: "0.04em" }}>$2,590</div>
        </div>
        <div style={{ position: "absolute", top: 30, left: 8, fontSize: 7, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", fontFamily: "var(--font-body)" }}>↑ VALUE HERO</div>
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, color: "white", letterSpacing: "-0.01em" }}>Outfit Title</div>
        </div>
      </div>
    );
  }

  // streetwear
  return (
    <div style={{ width: "100%", height: "100%", background: "#111", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "7px 8px 6px", borderBottom: "0.5px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-body)", marginBottom: 2 }}>@username</div>
        <div style={{ fontFamily: "monospace", fontSize: 7, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>5 PCS · $2,590 FIT</div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {img ?? <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1a1a2a,#0a0a1a)" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 55%)" }} />
        <div style={{ position: "absolute", top: 4, right: 6, fontSize: 7, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", fontFamily: "var(--font-body)" }}>DATA FIRST</div>
        <div style={{ position: "absolute", bottom: 6, left: 7 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 10, color: "white", letterSpacing: "-0.01em" }}>Outfit Title</div>
        </div>
      </div>
    </div>
  );
}

function StyleOption({
  style, isSelected, onSelect, previewImage,
}: {
  style: typeof CARD_STYLES[0];
  isSelected: boolean;
  onSelect: () => void;
  previewImage: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: "100%",
        background: isSelected ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: isSelected ? "1.5px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: 0,
        cursor: "pointer",
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
        transition: "all 200ms ease",
        textAlign: "left",
      }}
    >
      {/* Preview */}
      <div style={{ width: 100, height: 120, flexShrink: 0, position: "relative", overflow: "hidden", background: "#1a1a1a" }}>
        <StylePreview styleKey={style.key} previewImage={previewImage} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: "14px 14px 14px 16px", borderLeft: "0.5px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: "var(--page-text-primary)", margin: 0 }}>
            {style.name}
          </p>
          {isSelected && (
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, color: isSelected ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)", margin: "0 0 6px", letterSpacing: "0.01em" }}>
          {style.tagline}
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.5 }}>
          {style.description}
        </p>
      </div>
    </button>
  );
}

function CardStylePicker({
  selectedStyle,
  onSelect,
  previewImage,
}: {
  selectedStyle: CardStyleKey;
  onSelect: (s: CardStyleKey) => void;
  previewImage: string | null;
}) {
  return (
    <div style={{ padding: "0 16px 8px" }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, color: "var(--page-text-primary)", margin: "0 0 3px" }}>Card style</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--page-text-muted)", margin: 0 }}>How your post appears in the feed</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CARD_STYLES.map((style) => (
          <StyleOption
            key={style.key}
            style={style}
            isSelected={selectedStyle === style.key}
            onSelect={() => onSelect(style.key)}
            previewImage={previewImage}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Perfect Breakdown live progress
// ─────────────────────────────────────────────────────────────────────────────

const StarPath = "M6 1L7.545 4.09L11 4.635L8.5 7.07L9.09 10.5L6 8.875L2.91 10.5L3.5 7.07L1 4.635L4.455 4.09L6 1Z";

function BreakdownProgress({ items, title }: { items: Piece[]; title: string }) {
  const criteria = [
    { key: "title",  label: "Post title",            met: title.trim().length > 0 },
    { key: "count",  label: "At least 3 pieces",     met: items.length >= 3 },
    { key: "names",  label: "All pieces named",      met: items.length > 0 && items.every((i) => i.name.trim().length > 0) },
    { key: "brands", label: "All pieces have a brand", met: items.length > 0 && items.every((i) => i.brand.trim().length > 0) },
    { key: "prices", label: "All pieces have a price", met: items.length > 0 && items.every((i) => parseFloat(i.price) > 0) },
    { key: "links",  label: "At least one shop link", met: items.some((i) => i.shopLink.trim().length > 0) },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  const isPerfect = metCount === criteria.length;
  const progress = (metCount / criteria.length) * 100;

  if (items.length === 0) return null;

  return (
    <div style={{
      margin: "0 16px 16px",
      padding: 14,
      background: isPerfect ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.04)",
      border: isPerfect ? "0.5px solid rgba(255,215,0,0.3)" : "0.5px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      transition: "all 300ms ease",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d={StarPath} fill={isPerfect ? "#FFD700" : "rgba(255,255,255,0.2)"} stroke={isPerfect ? "#FFD700" : "rgba(255,255,255,0.2)"} strokeWidth="0.5" />
          </svg>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: isPerfect ? "#FFD700" : "var(--page-text-secondary)", letterSpacing: "0.02em" }}>
            {isPerfect ? "Perfect Breakdown earned!" : "Perfect Breakdown"}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: isPerfect ? "#FFD700" : "var(--page-text-muted)", letterSpacing: "0.04em" }}>
          {metCount}/{criteria.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 999, marginBottom: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: isPerfect ? "#FFD700" : "rgba(255,255,255,0.4)", borderRadius: 999, transition: "width 400ms ease, background 400ms ease" }} />
      </div>

      {/* Criteria */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {criteria.map((c) => (
          <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              background: c.met ? (isPerfect ? "#FFD700" : "rgba(255,255,255,0.9)") : "rgba(255,255,255,0.08)",
              border: c.met ? "none" : "0.5px solid rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 250ms ease",
            }}>
              {c.met && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3L3 5L7 1" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: c.met ? (isPerfect ? "rgba(255,215,0,0.9)" : "var(--page-text-primary)") : "var(--page-text-muted)", transition: "color 250ms ease" }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {isPerfect && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "0.5px solid rgba(255,215,0,0.2)", fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,215,0,0.7)", lineHeight: 1.4 }}>
          ✦ Your post will display the Perfect Breakdown badge in the feed and on your profile.
        </div>
      )}
    </div>
  );
}

interface UploadedMedia {
  media_url: string;
  media_type: "image" | "video";
  position: number;
  thumbnail_url?: string;
}

export default function PostOutfitPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createOutfit, null);

  // All form state is controlled so it survives failed submissions
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [styleTag, setStyleTag] = useState("");
  const [mediaItems, setMediaItems] = useState<UploadedMedia[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [cardStyle, setCardStyle] = useState<"editorial" | "statement" | "streetwear">("editorial");
  const [mediaError, setMediaError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isFullSuccess = !!(state?.outfitId && !state?.error);
  const isPartialSuccess = !!(state?.outfitId && state?.error);
  const isSuccess = isFullSuccess || isPartialSuccess;
  const errorMsg = !state?.outfitId && state?.error ? state.error : null;

  useEffect(() => {
    if (isFullSuccess && state?.outfitId) {
      router.push(`/outfit/${state.outfitId}`);
    }
  }, [isFullSuccess, state, router]);

  const handleMediaChange = useCallback((items: UploadedMedia[]) => {
    setMediaItems(items);
    if (items.length > 0) setMediaError(false);
  }, []);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const hasUploaded = mediaItems.some((m) => m.media_url);
    if (!hasUploaded) {
      setMediaError(true);
      return;
    }

    // Build FormData from current React state so there is no hidden-input timing race
    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("style_tag", styleTag);
    fd.set("media_items_json", JSON.stringify(mediaItems));
    fd.set("items_json", JSON.stringify(pieces));
    fd.set("card_style", cardStyle);

    startTransition(() => { action(fd); });
  };

  return (
    <Layout>
      <div className="sticky top-0 z-30 backdrop-blur-md px-4 py-3" style={{ background: "var(--page-bg)", borderBottom: "0.5px solid var(--page-border)" }}>
        <span className="font-bold text-xl tracking-tight" style={{ color: "var(--page-text-primary)" }}>Post Outfit</span>
      </div>

      {/* Sticky error banner */}
      {errorMsg && (
        <div className="sticky top-[53px] z-20 bg-red-50 border-b border-red-100 px-4 py-3 flex items-start gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-red-500 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-red-700">
            {errorMsg ?? "Post failed. Your draft is still saved — fix the issue and try again."}
          </p>
        </div>
      )}

      {/* Partial success — outfit saved but breakdown failed */}
      {isPartialSuccess && state?.outfitId && (
        <div className="sticky top-[53px] z-20 bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-start gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-amber-500 shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">{state.error}</p>
            <Link href={`/outfit/${state.outfitId}`} className="text-xs font-semibold text-amber-900 underline underline-offset-2 mt-1 inline-block">
              View your post →
            </Link>
          </div>
        </div>
      )}

      {/* Full success overlay */}
      {isFullSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4" style={{ background: "var(--page-bg)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--btn-primary-bg)" }}>
            <svg width="24" height="24" fill="none" stroke="var(--btn-primary-text)" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-base font-bold" style={{ color: "var(--page-text-primary)" }}>Outfit posted!</p>
          <p className="text-sm" style={{ color: "var(--page-text-muted)" }}>Taking you there now…</p>
        </div>
      )}

      <div className="px-4 py-6">
        <p className="text-sm mb-6" style={{ color: "var(--page-text-secondary)" }}>Share a fit and add the pieces people can shop.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">

          {/* 1. Media */}
          <section>
            <h2 className="text-sm font-bold mb-1" style={{ color: "var(--page-text-primary)" }}>
              Photos or Videos <span style={{ color: "#ff4444" }}>*</span>
            </h2>
            <p className="text-xs mb-3" style={{ color: "var(--page-text-muted)" }}>Add up to 5 photos or videos — first one is the cover.</p>
            <MultiMediaUpload
              onChange={handleMediaChange}
              onUploadingChange={setUploading}
            />
            {mediaError && (
              <p className="text-sm text-red-500 font-medium mt-2">Please upload at least one photo or video before posting.</p>
            )}
          </section>

          {/* 2. Details */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-bold" style={{ color: "var(--page-text-primary)" }}>Details</h2>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--page-text-secondary)" }}>
                Title <span style={{ color: "#ff4444" }}>*</span>
              </label>
              <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Tokyo Streetwear"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                style={{ border: "0.5px solid var(--page-border)" }}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--page-text-secondary)" }}>
                  Caption
                </label>
                <span className="text-[10px] tabular-nums" style={{ color: description.length > 480 ? "#ff4444" : "var(--page-text-muted)" }}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Add a caption or describe the vibe…"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none resize-none"
                style={{ border: "0.5px solid var(--page-border)" }}
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--page-text-secondary)" }}>
                Style
              </label>
              <StyleTagPicker value={styleTag} onChange={setStyleTag} />
            </div>
          </section>

          {/* 3. Fit Breakdown */}
          <section>
            {(() => {
              const coverImageUrl = mediaItems.find((m) => m.media_type === "image")?.media_url ?? mediaItems[0]?.media_url;
              return <FitBreakdownBuilder pieces={pieces} onChange={setPieces} outfitImageUrl={coverImageUrl} />;
            })()}
          </section>

          {/* 4. Card Style */}
          <section>
            <CardStylePicker
              selectedStyle={cardStyle}
              onSelect={setCardStyle}
              previewImage={mediaItems.find((m) => m.media_type === "image")?.media_url ?? null}
            />
            <div style={{ margin: "0 16px 16px", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
                💡 This controls how your post looks in the feed. You can only set this when posting — it cannot be changed after.
              </p>
            </div>
          </section>

          {/* Perfect Breakdown progress indicator */}
          <BreakdownProgress items={pieces} title={title} />

          {uploading && (
            <p className="text-xs text-center -mb-4" style={{ color: "var(--page-text-muted)" }}>
              Wait for all files to finish uploading before posting.
            </p>
          )}

          <button
            type="submit"
            disabled={pending || isSuccess || uploading}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
          >
            {pending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing…
              </>
            ) : pieces.length > 0 ? (
              `Post Outfit · ${pieces.length} piece${pieces.length !== 1 ? "s" : ""}`
            ) : (
              "Post Outfit"
            )}
          </button>

          {pieces.length === 0 && !pending && (
            <p className="text-center text-xs -mt-4" style={{ color: "var(--page-text-muted)" }}>
              You can add the fit breakdown now or post first and edit later.
            </p>
          )}
        </form>
      </div>
    </Layout>
  );
}
