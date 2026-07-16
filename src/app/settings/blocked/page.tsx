"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";

interface BlockedUser {
  blocked_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function BlockedAccountsPage() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("blocks")
        .select("blocked_id, profiles!blocks_blocked_id_fkey(display_name, username, avatar_url)")
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setBlocked(data.map((row) => {
          const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            blocked_id: row.blocked_id as string,
            display_name: (p?.display_name ?? null) as string | null,
            username: (p?.username ?? null) as string | null,
            avatar_url: (p?.avatar_url ?? null) as string | null,
          };
        }));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleUnblock(blockedId: string) {
    if (unblocking) return;
    setUnblocking(blockedId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", blockedId);
    if (!error) { setBlocked((prev) => prev.filter((b) => b.blocked_id !== blockedId)); showToast("User unblocked"); }
    setUnblocking(null);
  }

  return (
    <Layout>
      <div className="settings-header sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <Link href="/settings" className="flex items-center justify-center w-8 h-8 rounded-full" aria-label="Back" style={{ color: "var(--page-text-primary)" }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="settings-header-title">Blocked Accounts</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--page-border)", borderTopColor: "var(--page-text-primary)" }} />
        </div>
      ) : blocked.length === 0 ? (
        <div className="settings-page flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--page-surface)" }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ color: "var(--page-text-muted)" }}>
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--page-text-muted)" }}>No blocked accounts</p>
        </div>
      ) : (
        <div className="settings-page px-4 py-4 pb-32 flex flex-col gap-1">
          {blocked.map((b) => {
            const name = b.display_name ?? b.username ?? "User";
            return (
              <div key={b.blocked_id} className="flex items-center gap-3 py-3" style={{ borderBottom: "0.5px solid var(--page-border)" }}>
                <Avatar avatarUrl={b.avatar_url} displayName={name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--page-text-primary)" }}>{name}</p>
                  {b.username && <p className="text-xs" style={{ color: "var(--page-text-muted)" }}>@{b.username}</p>}
                </div>
                <button
                  onClick={() => handleUnblock(b.blocked_id)}
                  disabled={unblocking === b.blocked_id}
                  className="shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                  style={{ border: "0.5px solid var(--page-border)", color: "var(--page-text-primary)", background: "var(--page-surface)" }}
                >
                  {unblocking === b.blocked_id ? "…" : "Unblock"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
