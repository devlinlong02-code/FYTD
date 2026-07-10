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

    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedId);

    if (!error) {
      setBlocked((prev) => prev.filter((b) => b.blocked_id !== blockedId));
      showToast("User unblocked");
    }
    setUnblocking(null);
  }

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/settings"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          aria-label="Back"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="font-bold text-xl tracking-tight text-neutral-900">Blocked Accounts</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
        </div>
      ) : blocked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <p className="text-sm font-medium text-neutral-500">No blocked accounts</p>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-3">
          {blocked.map((b) => {
            const name = b.display_name ?? b.username ?? "User";
            return (
              <div key={b.blocked_id} className="flex items-center gap-3 py-2">
                <Avatar avatarUrl={b.avatar_url} displayName={name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{name}</p>
                  {b.username && <p className="text-xs text-neutral-400">@{b.username}</p>}
                </div>
                <button
                  onClick={() => handleUnblock(b.blocked_id)}
                  disabled={unblocking === b.blocked_id}
                  className="shrink-0 text-xs font-semibold px-4 py-2 rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
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
