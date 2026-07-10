"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Layout from "@/components/Layout";

type NotifType = "like" | "comment" | "follow" | "save" | "reply";
type FilterTab = "all" | "likes" | "comments" | "follows";

interface NotifRow {
  id: string;
  type: NotifType;
  read: boolean;
  created_at: string;
  outfit_id: string | null;
  comment_id: string | null;
  actor: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  outfit: {
    id: string;
    title: string | null;
    image_url: string | null;
  } | null;
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "follows", label: "Follows" },
];

function typeMatchesTab(type: NotifType, tab: FilterTab): boolean {
  if (tab === "all") return true;
  if (tab === "likes") return type === "like" || type === "save";
  if (tab === "comments") return type === "comment" || type === "reply";
  if (tab === "follows") return type === "follow";
  return false;
}

function buildText(n: NotifRow): string {
  const name = n.actor?.display_name || n.actor?.username || "Someone";
  switch (n.type) {
    case "like": return `${name} liked your fit`;
    case "comment": return `${name} commented on your fit`;
    case "reply": return `${name} replied to your comment`;
    case "follow": return `${name} started following you`;
    case "save": return `${name} saved your fit`;
    default: return `${name} interacted with you`;
  }
}

function buildHref(n: NotifRow): string {
  if ((n.type === "like" || n.type === "comment" || n.type === "reply" || n.type === "save") && n.outfit_id) {
    return `/outfit/${n.outfit_id}`;
  }
  if (n.type === "follow" && n.actor?.username) {
    return `/profile/${n.actor.username}`;
  }
  return "/";
}

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
}

function groupByTime(items: NotifRow[]): { label: string; items: NotifRow[] }[] {
  const now = Date.now();
  const today: NotifRow[] = [];
  const week: NotifRow[] = [];
  const earlier: NotifRow[] = [];
  for (const n of items) {
    const diff = now - new Date(n.created_at).getTime();
    if (diff < 86400000) today.push(n);
    else if (diff < 604800000) week.push(n);
    else earlier.push(n);
  }
  return [
    { label: "Today", items: today },
    { label: "This week", items: week },
    { label: "Earlier", items: earlier },
  ].filter((g) => g.items.length > 0);
}

function TypeIcon({ type }: { type: NotifType }) {
  const bg: Record<NotifType, string> = {
    like: "#0A0A0A",
    comment: "#3B82F6",
    reply: "#8B5CF6",
    follow: "#10B981",
    save: "#F59E0B",
  };
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
      style={{ background: bg[type] ?? "#0A0A0A" }}
    >
      {type === "like" && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
      {(type === "comment" || type === "reply") && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
      {type === "follow" && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      )}
      {type === "save" && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100">
      <div className="w-11 h-11 rounded-full bg-neutral-100 shrink-0 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-neutral-100 rounded animate-pulse w-3/4" />
        <div className="h-2 bg-neutral-100 rounded animate-pulse w-1/3" />
      </div>
      <div className="w-11 h-11 rounded-lg bg-neutral-100 animate-pulse shrink-0" />
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fetchAndMarkRead = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login?next=/notifications");
      return;
    }

    const { data } = await supabase
      .from("notifications")
      .select(`
        id, type, read, created_at, outfit_id, comment_id,
        actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url),
        outfit:outfits(id, title, image_url)
      `)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const rows: NotifRow[] = (data ?? []).map((row) => {
      const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;
      const outfit = Array.isArray(row.outfit) ? row.outfit[0] : row.outfit;
      return {
        id: row.id,
        type: row.type as NotifType,
        read: row.read,
        created_at: row.created_at,
        outfit_id: row.outfit_id ?? null,
        comment_id: row.comment_id ?? null,
        actor: actor ?? null,
        outfit: outfit ?? null,
      };
    });

    setNotifications(rows);
    setLoading(false);

    // Mark all unread as read — try with read_at first, fall back without it
    const unreadIds = rows.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      const { error: updateErr } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);
      if (updateErr) {
        // read_at column may not exist yet — fall back
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [router]);

  useEffect(() => {
    fetchAndMarkRead();
  }, [fetchAndMarkRead]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setDeletingId(null);
  }

  const filtered = notifications.filter((n) => typeMatchesTab(n.type, tab));
  const groups = groupByTime(filtered);

  return (
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 pt-4 pb-3">
        <h1
          className="text-2xl font-bold tracking-tight text-neutral-900 mb-3"
          style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)" }}
        >
          Activity
        </h1>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={
                tab === key
                  ? { background: "#0A0A0A", color: "#fff" }
                  : { background: "rgba(10,10,10,0.06)", color: "rgba(10,10,10,0.55)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-5">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p className="text-neutral-900 text-sm font-bold mb-1.5 tracking-tight">No notifications yet</p>
          <p className="text-neutral-400 text-xs leading-relaxed max-w-[200px]">
            When someone likes, comments, or follows you, it will show up here.
          </p>
        </div>
      ) : (
        <div>
          {groups.map(({ label, items }) => (
            <div key={label}>
              {/* Group label */}
              <div className="px-4 pt-5 pb-2">
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase"
                  style={{ color: "rgba(10,10,10,0.35)" }}
                >
                  {label}
                </span>
              </div>

              {items.map((n) => {
                const href = buildHref(n);
                const thumb = n.outfit?.image_url;
                const showThumb = n.type !== "follow" && thumb;

                return (
                  <div
                    key={n.id}
                    className="relative flex items-center gap-3 px-4 py-3.5 border-b border-neutral-50 transition-colors"
                    style={!n.read ? { background: "rgba(0,0,0,0.015)" } : undefined}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Clickable area */}
                    <button
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      onClick={() => router.push(href)}
                    >
                      {/* Avatar + type icon */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-100">
                          {n.actor?.avatar_url ? (
                            <Image
                              src={n.actor.avatar_url}
                              alt={n.actor.display_name ?? n.actor.username ?? ""}
                              width={44}
                              height={44}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white text-base font-bold">
                              {(n.actor?.display_name || n.actor?.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <TypeIcon type={n.type} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-neutral-900 leading-snug line-clamp-2">
                          {buildText(n)}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ fontFamily: "'IBM Plex Mono', monospace", color: "rgba(10,10,10,0.35)" }}
                        >
                          {formatRelative(n.created_at)}
                        </p>
                      </div>
                    </button>

                    {/* Right side */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Delete button on hover */}
                      {hoveredId === n.id && (
                        <button
                          onClick={() => handleDelete(n.id)}
                          disabled={deletingId === n.id}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-red-50 transition-colors"
                          aria-label="Delete notification"
                        >
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-400">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      )}

                      {/* Post thumbnail */}
                      {showThumb && (
                        <button onClick={() => router.push(href)} className="shrink-0">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-100">
                            <Image
                              src={thumb}
                              alt={n.outfit?.title ?? ""}
                              width={44}
                              height={44}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </button>
                      )}

                      {/* Unread dot */}
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
