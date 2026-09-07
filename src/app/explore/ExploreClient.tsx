"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FollowButton from "@/components/FollowButton";
import { createClient } from "@/lib/supabase/client";
import type { Outfit } from "@/types";
import type { RisingCreator } from "@/app/actions/follows";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TrendingStyle {
  tag: string;
  label: string;
  topImage: string | null;
  count: number;
}

interface CreatorWithPost extends RisingCreator {
  bestImage: string | null;
}

interface ProfileResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  followers_count: number | null;
}

interface FitResult {
  id: string;
  title: string;
  image_url: string | null;
}

export interface ExploreClientProps {
  risingCreators: RisingCreator[];
  todaysFits: Outfit[];
  mostSavedFits: Outfit[];
  savedIds: string[];
  isAuthenticated: boolean;
  currentUserId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const HERO_MOMENTS = [
  {
    title: "The Breakdown",
    subtitle: "Every piece. Every price. Tap to shop.",
    gradient: "linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 100%)",
    action: "Explore fits",
    route: null,
  },
  {
    title: "Summer Fits",
    subtitle: "What the community is wearing right now",
    gradient: "linear-gradient(160deg, #111827 0%, #0a0a0a 100%)",
    action: "See fits",
    route: "/?style=summer",
  },
  {
    title: "Streetwear Season",
    subtitle: "The best street looks this week",
    gradient: "linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 100%)",
    action: "Browse looks",
    route: "/?style=streetwear",
  },
  {
    title: "Clean & Minimal",
    subtitle: "Less is more. The minimalist edits.",
    gradient: "linear-gradient(160deg, #1c1c1c 0%, #0a0a0a 100%)",
    action: "View edits",
    route: "/?style=minimal",
  },
];

const STYLE_TAGS = [
  { tag: "streetwear",     label: "Streetwear" },
  { tag: "minimal",        label: "Minimal" },
  { tag: "old money",      label: "Old Money" },
  { tag: "casual",         label: "Casual" },
  { tag: "gym fit",        label: "Gym Fit" },
  { tag: "formal",         label: "Formal" },
  { tag: "athleisure",     label: "Athleisure" },
  { tag: "campus",         label: "Campus" },
  { tag: "vintage",        label: "Vintage" },
  { tag: "clean fit",      label: "Clean Fit" },
  { tag: "business casual",label: "Business Casual" },
  { tag: "y2k",            label: "Y2K" },
  { tag: "grunge",         label: "Grunge" },
  { tag: "preppy",         label: "Preppy" },
  { tag: "dark academia",  label: "Dark Academia" },
  { tag: "coastal",        label: "Coastal" },
  { tag: "night out",      label: "Night Out" },
  { tag: "going out",      label: "Going Out" },
  { tag: "festival",       label: "Festival" },
  { tag: "date night",     label: "Date Night" },
  { tag: "summer",         label: "Summer" },
  { tag: "gorpcore",       label: "Gorpcore" },
  { tag: "workwear",       label: "Workwear" },
  { tag: "luxury",         label: "Luxury" },
  { tag: "resort",         label: "Resort" },
];

const STYLE_EDITS = [
  {
    title: "The Streetwear Edit",
    subtitle: "Oversized. Layered. On point.",
    tag: "streetwear",
    gradient: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
  },
  {
    title: "Clean & Minimal",
    subtitle: "White tees and wide legs.",
    tag: "minimal",
    gradient: "linear-gradient(135deg, #2a2a2a 0%, #111 100%)",
  },
  {
    title: "Old Money Aesthetic",
    subtitle: "Quiet luxury. Loud taste.",
    tag: "old money",
    gradient: "linear-gradient(135deg, #1a1a2a 0%, #0a0a0a 100%)",
  },
  {
    title: "Going Out Fits",
    subtitle: "Dressed up. Nowhere to be.",
    tag: "going out",
    gradient: "linear-gradient(135deg, #0a0a1a 0%, #1a1a1a 100%)",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getFitValue(items: Outfit["items"]): string | null {
  const total = items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  return total > 0 ? `$${total.toLocaleString()}` : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-5 pb-3">
      <div className="flex-1 h-px" style={{ background: "var(--page-border)" }} />
      <span
        className="font-data text-[9px] font-semibold tracking-[0.16em] uppercase whitespace-nowrap"
        style={{ color: "var(--page-text-muted)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--page-border)" }} />
    </div>
  );
}

function HeroBanner({
  heroIndex,
  setHeroIndex,
  router,
}: {
  heroIndex: number;
  setHeroIndex: (i: number) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const moment = HERO_MOMENTS[heroIndex];
  return (
    <div className="px-3 pt-3">
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer select-none"
        style={{ background: moment.gradient, minHeight: 200, padding: "28px 22px 22px" }}
        onClick={() => moment.route && router.push(moment.route)}
      >
        {/* Decorative line */}
        <div className="absolute top-5 right-5 flex items-center gap-2 opacity-20">
          <div className="w-9 h-px bg-white" />
          <div className="w-1 h-1 rounded-full bg-white" />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 mb-5">
          <p
            className="font-data text-[9px] font-semibold tracking-[0.14em] uppercase m-0"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            FYTD — FIND YOUR FIT DAILY
          </p>
          <h2
            className="font-editorial m-0 leading-[1.05] tracking-[-0.03em]"
            style={{ fontSize: 30, color: "white", fontWeight: 600 }}
          >
            {moment.title}
          </h2>
          <p className="text-[13px] m-0 leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>
            {moment.subtitle}
          </p>
          <div
            className="flex items-center gap-1.5 mt-1 font-semibold text-white border-b w-fit pb-0.5 text-[11px] tracking-[0.04em]"
            style={{ borderColor: "rgba(255,255,255,0.35)" }}
          >
            <span>{moment.action}</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {HERO_MOMENTS.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setHeroIndex(i); }}
              className="border-none cursor-pointer p-0 transition-all duration-200"
              style={{
                width: i === heroIndex ? 16 : 5,
                height: 5,
                borderRadius: 999,
                background: i === heroIndex ? "white" : "rgba(255,255,255,0.3)",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendingThisWeek({
  styles,
  router,
}: {
  styles: TrendingStyle[];
  router: ReturnType<typeof useRouter>;
}) {
  if (styles.length === 0) return null;
  return (
    <div>
      <SectionRule label="Trending this week" />
      <div className="flex gap-2.5 px-3 pb-1 overflow-x-auto no-scrollbar">
        {styles.map((style) => (
          <button
            key={style.tag}
            onClick={() => router.push(`/?style=${encodeURIComponent(style.tag)}`)}
            className="flex-shrink-0 relative border-none bg-transparent p-0 cursor-pointer text-left"
            style={{ width: 120 }}
          >
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ width: 120, aspectRatio: "3/4", background: "rgba(0,0,0,0.07)" }}
            >
              {style.topImage ? (
                <Image src={style.topImage} alt={style.label} fill className="object-cover" sizes="120px" />
              ) : (
                <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#1a1a1a,#333)" }} />
              )}
              {/* gradient overlay */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.15) 50%,transparent 100%)" }}
              />
              {/* text */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <p className="font-editorial m-0 text-white leading-tight" style={{ fontSize: 13, fontWeight: 500 }}>
                  {style.label}
                </p>
                {style.count > 0 && (
                  <p className="font-data m-0 mt-0.5" style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.04em" }}>
                    +{style.count} fits
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RisingCreators({
  creators,
  currentUserId,
  router,
}: {
  creators: CreatorWithPost[];
  currentUserId: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  if (creators.length === 0) return null;
  return (
    <div>
      <SectionRule label="Rising creators" />
      <div className="flex gap-2.5 px-3 pb-1 overflow-x-auto no-scrollbar">
        {creators.map((creator) => (
          <div key={creator.id} className="flex-shrink-0 relative" style={{ width: 190 }}>
            {/* card background */}
            <button
              className="relative border-none p-0 bg-transparent cursor-pointer block"
              style={{ width: 190, aspectRatio: "3/4", borderRadius: 14, overflow: "hidden", background: "rgba(0,0,0,0.07)" }}
              onClick={() => creator.username && router.push(`/profile/${creator.username}`)}
              aria-label={creator.display_name ?? creator.username ?? "Creator"}
            >
              {creator.bestImage ? (
                <Image src={creator.bestImage} alt={creator.display_name ?? ""} fill className="object-cover" sizes="190px" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-editorial text-5xl"
                  style={{ background: "linear-gradient(135deg,#1a1a1a,#2d2d2d)", color: "rgba(255,255,255,0.15)" }}
                >
                  {(creator.username ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.25) 40%,transparent 70%)" }}
              />
            </button>

            {/* info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
              <button
                onClick={() => creator.username && router.push(`/profile/${creator.username}`)}
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 text-left flex-1 min-w-0"
              >
                <div
                  className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold"
                  style={{ width: 34, height: 34, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.45)", fontSize: 13 }}
                >
                  {creator.avatar_url ? (
                    <Image src={creator.avatar_url} alt="" width={34} height={34} className="object-cover w-full h-full" />
                  ) : (
                    (creator.username ?? "?")[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-editorial m-0 text-white truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-0.01em" }}>
                    {creator.display_name || creator.username}
                  </p>
                  <p className="font-data m-0 mt-0.5 truncate" style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
                    {(creator.followers_count ?? 0) > 0
                      ? `${(creator.followers_count ?? 0).toLocaleString()} followers`
                      : "New creator"}
                  </p>
                </div>
              </button>
              <FollowButton
                targetUserId={creator.id}
                currentUserId={currentUserId}
                variant="overlay"
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StyleEdits({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div>
      <SectionRule label="Style edits" />
      <div className="flex flex-col gap-0.5 px-3">
        {STYLE_EDITS.map((edit) => (
          <button
            key={edit.tag}
            onClick={() => router.push(`/?style=${encodeURIComponent(edit.tag)}`)}
            className="relative w-full text-left border-none cursor-pointer flex items-center justify-between overflow-hidden"
            style={{ background: edit.gradient, borderRadius: 12, padding: "18px 18px", minHeight: 88 }}
          >
            <div className="flex-1">
              <p className="font-data m-0 mb-1" style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                — {edit.tag.toUpperCase()} —
              </p>
              <h3 className="font-editorial m-0 mb-1 leading-tight text-white" style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.02em" }}>
                {edit.title}
              </h3>
              <p className="m-0" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                {edit.subtitle}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FitsGrid({
  fits,
  router,
}: {
  fits: Outfit[];
  router: ReturnType<typeof useRouter>;
}) {
  if (fits.length === 0) return null;
  return (
    <div>
      <SectionRule label="Latest fits" />
      <div className="grid grid-cols-2 gap-px">
        {fits.map((fit) => {
          const pieceCount = fit.items.length;
          const fitValue = getFitValue(fit.items);
          const handle = fit.creatorHandle?.replace("@", "");
          return (
            <button
              key={fit.id}
              onClick={() => router.push(`/outfit/${fit.id}`)}
              className="bg-transparent border-none p-0 text-left cursor-pointer flex flex-col"
            >
              {/* Image */}
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4", background: "var(--page-surface)" }}>
                {fit.image && (
                  <Image src={fit.image} alt={fit.title} fill className="object-cover" sizes="50vw" />
                )}
                {/* overlay */}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top,rgba(0,0,0,0.38) 0%,transparent 45%)" }}
                />
                {/* breakdown badge */}
                {pieceCount > 0 && (
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span
                      className="font-data text-white"
                      style={{ fontSize: 9, letterSpacing: "0.04em", background: "rgba(0,0,0,0.52)", borderRadius: 999, padding: "3px 7px", backdropFilter: "blur(4px)" }}
                    >
                      {pieceCount}pc
                    </span>
                    {fitValue && (
                      <span
                        className="font-data text-white"
                        style={{ fontSize: 9, letterSpacing: "0.04em", background: "rgba(0,0,0,0.52)", borderRadius: 999, padding: "3px 7px", backdropFilter: "blur(4px)" }}
                      >
                        {fitValue}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="px-2 pt-2 pb-3" style={{ background: "var(--page-bg)" }}>
                <p className="font-editorial m-0 mb-1 truncate" style={{ fontSize: 13, color: "var(--page-text-primary)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                  {fit.title}
                </p>
                <div className="flex items-center gap-1">
                  <div
                    className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ width: 16, height: 16, background: "var(--page-surface)", fontSize: 7, fontWeight: 600, color: "var(--page-text-muted)" }}
                  >
                    {fit.creatorAvatar ? (
                      <Image src={fit.creatorAvatar} alt="" width={16} height={16} className="object-cover w-full h-full" />
                    ) : (
                      (handle ?? "?")[0]?.toUpperCase()
                    )}
                  </div>
                  <span className="truncate" style={{ fontSize: 11, color: "var(--page-text-muted)", fontFamily: "inherit" }}>
                    @{handle}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchResults({
  query,
  profiles,
  fits,
  isLoading,
  activeTab,
  onTabChange,
  currentUserId,
  router,
}: {
  query: string;
  profiles: ProfileResult[];
  fits: FitResult[];
  isLoading: boolean;
  activeTab: "people" | "fits";
  onTabChange: (t: "people" | "fits") => void;
  currentUserId: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="pb-20">
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--page-border)" }}>
        {(["people", "fits"] as const).map((tab) => {
          const count = tab === "people" ? profiles.length : fits.length;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-transparent border-none border-b-2 cursor-pointer transition-colors"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: activeTab === tab ? "var(--page-text-primary)" : "var(--page-text-muted)",
                borderBottomColor: activeTab === tab ? "var(--page-text-primary)" : "transparent",
                borderBottomWidth: 1.5,
              }}
            >
              {tab === "people" ? "People" : "Fits"}
              {count > 0 && (
                <span className="font-data" style={{ fontSize: 10, color: "var(--page-text-muted)" }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--page-border)", borderTopColor: "var(--page-text-primary)" }} />
        </div>
      ) : activeTab === "people" ? (
        profiles.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: "var(--page-text-muted)" }}>No people found for &ldquo;{query}&rdquo;</p>
        ) : (
          <div>
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{ borderBottom: "0.5px solid var(--page-border)" }}
              >
                <button
                  onClick={() => p.username && router.push(`/profile/${p.username}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-0"
                >
                  <div
                    className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ width: 44, height: 44, background: "var(--page-surface)", fontSize: 16, fontWeight: 500, color: "var(--page-text-muted)" }}
                  >
                    {p.avatar_url ? (
                      <Image src={p.avatar_url} alt="" width={44} height={44} className="object-cover w-full h-full" />
                    ) : (
                      (p.username ?? "?")[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-editorial m-0 mb-0.5 truncate" style={{ fontSize: 14, color: "var(--page-text-primary)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                      {p.display_name || p.username}
                    </p>
                    <p className="m-0" style={{ fontSize: 12, color: "var(--page-text-muted)" }}>
                      @{p.username}
                      {(p.followers_count ?? 0) > 0 && (
                        <span style={{ color: "var(--page-text-muted)" }}> · {(p.followers_count ?? 0).toLocaleString()} followers</span>
                      )}
                    </p>
                  </div>
                </button>
                <FollowButton targetUserId={p.id} currentUserId={currentUserId} size="sm" />
              </div>
            ))}
          </div>
        )
      ) : (
        fits.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: "var(--page-text-muted)" }}>No fits found for &ldquo;{query}&rdquo;</p>
        ) : (
          <div className="grid grid-cols-2 gap-px">
            {fits.map((fit) => (
              <button
                key={fit.id}
                onClick={() => router.push(`/outfit/${fit.id}`)}
                className="bg-transparent border-none p-0 cursor-pointer text-left flex flex-col"
              >
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4", background: "var(--page-surface)" }}>
                  {fit.image_url && (
                    <Image src={fit.image_url} alt={fit.title} fill className="object-cover" sizes="50vw" />
                  )}
                </div>
                <div className="px-2 pt-2 pb-3" style={{ background: "var(--page-bg)" }}>
                  <p className="font-editorial m-0 truncate" style={{ fontSize: 12, color: "var(--page-text-primary)", fontWeight: 500 }}>{fit.title}</p>
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ExploreClient({
  risingCreators,
  todaysFits,
  currentUserId,
}: ExploreClientProps) {
  const router = useRouter();

  // ── Hero ───────────────────────────────────────────────────────────────────
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_MOMENTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  // ── Trending styles (client-fetched) ───────────────────────────────────────
  const [trendingStyles, setTrendingStyles] = useState<TrendingStyle[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all(
      STYLE_TAGS.map(async ({ tag, label }) => {
        const [{ data: topPosts }, { count }] = await Promise.all([
          supabase
            .from("outfits")
            .select("image_url")
            .eq("style_tag", tag)
            .eq("published", true)
            .order("likes_count", { ascending: false })
            .limit(1),
          supabase
            .from("outfits")
            .select("*", { count: "exact", head: true })
            .eq("style_tag", tag)
            .eq("published", true),
        ]);
        return {
          tag,
          label,
          topImage: (topPosts?.[0]?.image_url as string | null) ?? null,
          count: count ?? 0,
        };
      })
    ).then((results) =>
      setTrendingStyles(results.filter((s) => s.count > 0).sort((a, b) => b.count - a.count))
    );
  }, []);

  // ── Creator best posts (client-fetched) ────────────────────────────────────
  const [creatorsWithPosts, setCreatorsWithPosts] = useState<CreatorWithPost[]>([]);

  useEffect(() => {
    if (risingCreators.length === 0) return;
    const supabase = createClient();
    Promise.all(
      risingCreators.map(async (creator) => {
        const { data } = await supabase
          .from("outfits")
          .select("image_url")
          .eq("creator_id", creator.id)
          .eq("published", true)
          .order("likes_count", { ascending: false })
          .limit(1);
        return { ...creator, bestImage: (data?.[0]?.image_url as string | null) ?? null };
      })
    ).then(setCreatorsWithPosts);
  }, [risingCreators]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [profileResults, setProfileResults] = useState<ProfileResult[]>([]);
  const [fitResults, setFitResults] = useState<FitResult[]>([]);
  const [searchTab, setSearchTab] = useState<"people" | "fits">("people");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const KNOWN_STYLE_TAGS = ["streetwear", "minimal", "old money", "casual", "gym fit", "formal", "summer", "clean", "vintage", "gorpcore", "athleisure", "luxury", "going out"];

  const runSearch = useCallback(async (term: string) => {
    const supabase = createClient();
    const [{ data: profiles }, { data: titleFits }, { data: tagFits }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, followers_count")
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .order("followers_count", { ascending: false })
        .limit(20),
      supabase
        .from("outfits")
        .select("id, title, image_url")
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .eq("published", true)
        .order("likes_count", { ascending: false })
        .limit(20),
      supabase
        .from("outfits")
        .select("id, title, image_url")
        .eq("style_tag", term.toLowerCase())
        .eq("published", true)
        .order("likes_count", { ascending: false })
        .limit(20),
    ]);
    setProfileResults((profiles ?? []) as ProfileResult[]);
    // Merge title + tag results, deduplicate by id
    const allFits = [...(titleFits ?? []), ...(tagFits ?? [])];
    const seen = new Set<string>();
    const dedupedFits = allFits.filter((f) => {
      if (seen.has(f.id as string)) return false;
      seen.add(f.id as string);
      return true;
    });
    setFitResults(
      dedupedFits.map((f) => ({
        id: f.id as string,
        title: f.title as string,
        image_url: f.image_url as string | null,
      }))
    );
    setIsSearchLoading(false);
  }, []);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (!value.trim()) {
      setIsSearchActive(false);
      setProfileResults([]);
      setFitResults([]);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      return;
    }
    setIsSearchActive(true);
    setIsSearchLoading(true);
    const trimmed = value.trim().toLowerCase();
    setSearchTab(KNOWN_STYLE_TAGS.some((t) => t === trimmed || trimmed.includes(t)) ? "fits" : "people");
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runSearch(value.trim()), 300);
  }

  function clearSearch() {
    setSearchQuery("");
    setIsSearchActive(false);
    setProfileResults([]);
    setFitResults([]);
    setIsSearchLoading(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }

  return (
    <div className="pb-20">
      {/* ── Sticky search bar ─────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 px-3 py-2.5"
        style={{
          background: "var(--page-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "0.5px solid var(--page-border)",
        }}
      >
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2.5"
          style={{ background: "var(--page-surface)" }}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: "var(--page-text-muted)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search people, styles, brands…"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: "var(--page-text-primary)" }}
          />
          {searchQuery && (
            <button onClick={clearSearch} className="bg-transparent border-none cursor-pointer p-0 flex items-center" style={{ color: "var(--page-text-muted)" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Search results ─────────────────────────────────────────────────── */}
      {isSearchActive ? (
        <SearchResults
          query={searchQuery}
          profiles={profileResults}
          fits={fitResults}
          isLoading={isSearchLoading}
          activeTab={searchTab}
          onTabChange={setSearchTab}
          currentUserId={currentUserId}
          router={router}
        />
      ) : (
        /* ── Discovery mode ───────────────────────────────────────────────── */
        <div>
          <HeroBanner heroIndex={heroIndex} setHeroIndex={setHeroIndex} router={router} />
          <TrendingThisWeek styles={trendingStyles} router={router} />
          <RisingCreators creators={creatorsWithPosts} currentUserId={currentUserId} router={router} />
          <StyleEdits router={router} />
          <FitsGrid fits={todaysFits} router={router} />
        </div>
      )}
    </div>
  );
}
