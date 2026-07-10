"use client";

import { startTransition, useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import MultiMediaUpload from "@/components/MultiMediaUpload";
import FitBreakdownBuilder, { type Piece } from "@/components/FitBreakdownBuilder";
import { createOutfit } from "@/app/actions/upload";

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
  const [tags, setTags] = useState("");
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
    fd.set("tags", tags);
    fd.set("media_items_json", JSON.stringify(mediaItems));
    fd.set("items_json", JSON.stringify(pieces));
    fd.set("card_style", cardStyle);

    startTransition(() => { action(fd); });
  };

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <span className="font-bold text-xl tracking-tight text-neutral-900">Post Outfit</span>
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
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center">
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-base font-bold text-neutral-900">Outfit posted!</p>
          <p className="text-sm text-neutral-400">Taking you there now…</p>
        </div>
      )}

      <div className="px-4 py-6">
        <p className="text-sm text-neutral-400 mb-6">Share a fit and add the pieces people can shop.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">

          {/* 1. Media */}
          <section>
            <h2 className="text-sm font-bold text-neutral-900 mb-1">
              Photos or Videos <span className="text-red-400">*</span>
            </h2>
            <p className="text-xs text-neutral-400 mb-3">Add up to 5 photos or videos — first one is the cover.</p>
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
            <h2 className="text-sm font-bold text-neutral-900">Details</h2>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Tokyo Streetwear"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Caption
                </label>
                <span className={`text-[10px] tabular-nums ${description.length > 480 ? "text-red-400 font-semibold" : "text-neutral-300"}`}>
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
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                Tags <span className="text-neutral-300 normal-case">(comma-separated)</span>
              </label>
              <input
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="streetwear, minimal, casual"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
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
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
              Card Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["editorial", "statement", "streetwear"] as const).map((style) => {
                const labels: Record<string, { title: string; desc: string }> = {
                  editorial: { title: "Editorial", desc: "Clean & minimal" },
                  statement: { title: "Statement", desc: "Value as hero" },
                  streetwear: { title: "Streetwear", desc: "Data header" },
                };
                const active = cardStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setCardStyle(style)}
                    className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 transition-all"
                    style={{
                      border: active ? "2px solid #0a0a0a" : "1.5px solid rgba(0,0,0,0.12)",
                      background: active ? "#0a0a0a" : "transparent",
                    }}
                  >
                    {/* Mini preview */}
                    <div className="w-full rounded overflow-hidden" style={{ aspectRatio: "3/4", background: "#111", position: "relative" }}>
                      {style === "statement" && (
                        <div style={{ position: "absolute", top: 4, left: 4, background: "white", borderRadius: 999, padding: "2px 5px", fontSize: 6, fontWeight: 700, color: "#0a0a0a", fontFamily: "monospace", zIndex: 1 }}>$$$</div>
                      )}
                      {style === "streetwear" && (
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", padding: "3px 5px", fontSize: 5, color: "rgba(255,255,255,0.6)", fontFamily: "monospace", zIndex: 1 }}>5pc · $2k</div>
                      )}
                      {style === "editorial" && (
                        <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, zIndex: 1 }}>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.5)", borderRadius: 2, marginBottom: 2, width: "80%" }} />
                          <div style={{ height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 2, width: "50%" }} />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold m-0" style={{ color: active ? "white" : "#0a0a0a" }}>{labels[style].title}</p>
                    <p className="text-[9px] m-0" style={{ color: active ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)" }}>{labels[style].desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {uploading && (
            <p className="text-xs text-neutral-400 text-center -mb-4">
              Wait for all files to finish uploading before posting.
            </p>
          )}

          <button
            type="submit"
            disabled={pending || isSuccess || uploading}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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
            <p className="text-center text-xs text-neutral-400 -mt-4">
              You can add the fit breakdown now or post first and edit later.
            </p>
          )}
        </form>
      </div>
    </Layout>
  );
}
