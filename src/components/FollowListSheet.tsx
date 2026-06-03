"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Avatar from "@/components/Avatar";
import { getFollowers, getFollowing, toggleFollow, type FollowUser } from "@/app/actions/follows";

interface FollowListSheetProps {
  type: "followers" | "following";
  userId: string;
  isOwnProfile: boolean;
  currentUserId?: string;
  onClose: () => void;
}

export default function FollowListSheet({
  type,
  userId,
  isOwnProfile,
  currentUserId,
  onClose,
}: FollowListSheetProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setLoading(true);
    const fetch = type === "followers" ? getFollowers : getFollowing;
    fetch(userId).then((list) => {
      setUsers(list);
      setLoading(false);
    });
  }, [type, userId]);

  async function handleToggleFollow(targetId: string) {
    if (pending) return;
    setPending(targetId);
    try {
      const result = await toggleFollow(targetId);
      setFollowStates((prev) => ({ ...prev, [targetId]: result.following }));
    } finally {
      setPending(null);
    }
  }

  if (!mounted) return null;

  const title = type === "followers" ? "Followers" : "Following";

  const sheet = (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl max-h-[75vh] flex flex-col" style={{ maxWidth: 448, margin: "0 auto", width: "100%" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-neutral-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 shrink-0">
          <span className="font-bold text-base text-neutral-900">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
            aria-label="Close"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 pb-[env(safe-area-inset-bottom)]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-sm font-medium text-neutral-400">
                {type === "followers" ? "No followers yet." : "Not following anyone yet."}
              </p>
            </div>
          ) : (
            <ul>
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                const showFollowBtn = !isOwnProfile && !isCurrentUser;
                const isFollowed = followStates[user.id] ?? false;

                return (
                  <li key={user.id} className="flex items-center gap-3 px-5 py-3 border-b border-neutral-50 last:border-0">
                    <Avatar
                      avatarUrl={user.avatar_url}
                      displayName={user.display_name ?? user.username ?? "?"}
                      size={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {user.display_name || user.username || "Unknown"}
                      </p>
                      {user.username && (
                        <p className="text-xs text-neutral-400 truncate">@{user.username}</p>
                      )}
                    </div>
                    {showFollowBtn && (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(user.id)}
                        disabled={pending === user.id}
                        className={`shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                          isFollowed
                            ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                            : "bg-neutral-900 text-white hover:bg-neutral-700"
                        }`}
                      >
                        {isFollowed ? "Following" : "Follow"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
