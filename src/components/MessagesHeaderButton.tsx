"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MessagesHeaderButton() {
  const [unread, setUnread] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathname = usePathname();

  // Resolve user once
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const fetchUnread = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    // Get all conversation IDs the user participates in
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

    if (!convs || convs.length === 0) { setUnread(0); return; }

    const convIds = convs.map((c) => c.id as string);

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .eq("read", false)
      .neq("sender_id", userId);

    setUnread(count ?? 0);
  }, [userId]);

  // Fetch on mount and start 30s polling
  useEffect(() => {
    if (!userId) return;
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, fetchUnread]);

  // Reset badge to 0 when on /messages (user is reading messages)
  useEffect(() => {
    if (pathname.startsWith("/messages")) {
      setUnread(0);
    }
  }, [pathname]);

  const label = unread === 0 ? "" : unread > 9 ? "9+" : String(unread);

  return (
    <Link
      href="/messages"
      aria-label="Messages"
      className="relative flex items-center justify-center w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200"
    >
      {/* MessageCircle icon */}
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>

      {/* Unread badge */}
      {unread > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-neutral-900 text-white rounded-full flex items-center justify-center leading-none"
          style={{ fontSize: 9, fontWeight: 700, padding: "0 3px" }}
        >
          {label}
        </span>
      )}
    </Link>
  );
}
