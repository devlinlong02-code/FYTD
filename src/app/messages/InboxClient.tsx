"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Avatar from "@/components/Avatar";
import { hideConversation, getOrCreateConversation } from "@/app/actions/messages";
import type { ConversationRow } from "@/app/actions/messages";
import { useToast } from "@/context/ToastContext";
import { formatTime } from "@/lib/formatTime";
import { createClient } from "@/lib/supabase/client";

interface SearchProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface InboxClientProps {
  active: ConversationRow[];
  requests: ConversationRow[];
  currentUserId: string;
}

export default function InboxClient({ active: initialActive, requests, currentUserId }: InboxClientProps) {
  const [active, setActive] = useState(initialActive);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [startingConvFor, setStartingConvFor] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleDelete(convId: string) {
    if (!confirm("Remove this conversation from your inbox?")) return;
    setActive((prev) => prev.filter((c) => c.id !== convId));
    await hideConversation(convId);
    showToast("Conversation removed");
  }

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearchLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${q.trim()}%,display_name.ilike.%${q.trim()}%`)
      .neq("id", currentUserId)
      .limit(15);
    setSearchResults((data ?? []) as SearchProfile[]);
    setSearchLoading(false);
  }, [currentUserId]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (!value.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      setSearchLoading(false);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      return;
    }
    setIsSearching(true);
    setSearchLoading(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => runSearch(value), 300);
  }

  function clearSearch() {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
    setSearchLoading(false);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  }

  async function handleStartConversation(targetUserId: string) {
    setStartingConvFor(targetUserId);
    try {
      const result = await getOrCreateConversation(targetUserId);
      if ("error" in result) {
        showToast("Could not start conversation. Try again.");
        return;
      }
      clearSearch();
      router.push(`/messages/${result.id}`);
    } finally {
      setStartingConvFor(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <span className="font-bold text-xl tracking-tight text-neutral-900">Messages</span>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2.5"
          style={{ background: "rgba(0,0,0,0.05)" }}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: "rgba(0,0,0,0.35)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search people…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="shrink-0 text-neutral-400 hover:text-neutral-600">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {isSearching ? (
        <div>
          {searchLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-400">
              No people found for &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {searchResults.map((user) => {
                const name = user.display_name || user.username || "User";
                const loading = startingConvFor === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => handleStartConversation(user.id)}
                    disabled={!!startingConvFor}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors text-left disabled:opacity-60"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={name}
                          width={44}
                          height={44}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-base font-semibold text-neutral-400">
                          {name[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{name}</p>
                      {user.username && (
                        <p className="text-xs text-neutral-400 truncate">@{user.username}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-neutral-200 border-t-neutral-500 animate-spin" />
                      ) : (
                        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ color: "rgba(0,0,0,0.3)" }}>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Message requests */}
          {requests.length > 0 && (
            <button
              onClick={() => router.push("/messages/requests")}
              className="w-full flex items-center justify-between px-4 py-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-neutral-900">Message requests</p>
                  <p className="text-xs text-neutral-400">{requests.length} pending</p>
                </div>
              </div>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300 shrink-0">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}

          {/* Active conversations or empty state */}
          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-neutral-900 mb-2">No messages yet</h2>
              <p className="text-sm text-neutral-400">Search for someone above to start a conversation.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {active.map((conv) => {
                const other = conv.otherUser;
                const displayName = other.display_name ?? other.username ?? "User";
                return (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 px-4 py-4 hover:bg-neutral-50 transition-colors group"
                  >
                    <button
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      onClick={() => router.push(`/messages/${conv.id}`)}
                    >
                      <Avatar avatarUrl={other.avatar_url} displayName={displayName} size={48} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-neutral-900 truncate">{displayName}</span>
                          <span className="text-xs text-neutral-400 shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                        </div>
                        <p className="text-sm text-neutral-400 truncate">
                          {conv.last_message_preview ?? "No messages yet"}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDelete(conv.id)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Remove conversation"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
