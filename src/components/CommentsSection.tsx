"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";

interface CommentProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  outfit_id: string;
  content: string;
  created_at: string;
  profile: CommentProfile;
}

interface CommentsSectionProps {
  outfitId: string;
  currentUserId: string | null;
  currentUserUsername?: string;
  currentUserAvatar?: string | null;
}

function CommentAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null | undefined;
  displayName: string;
}) {
  const initial = (displayName || "?")[0].toUpperCase();
  if (avatarUrl) {
    return (
      <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden bg-neutral-100">
        <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="32px" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 shrink-0 rounded-full bg-neutral-900 flex items-center justify-center">
      <span className="text-white text-xs font-bold">{initial}</span>
    </div>
  );
}

export default function CommentsSection({
  outfitId,
  currentUserId,
  currentUserUsername,
  currentUserAvatar,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select(
        "id, user_id, outfit_id, content, created_at, profiles!comments_user_id_fkey(id, username, display_name, avatar_url)"
      )
      .eq("outfit_id", outfitId)
      .order("created_at", { ascending: true });

    if (data) {
      setComments(
        data.map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            id: row.id,
            user_id: row.user_id,
            outfit_id: row.outfit_id,
            content: row.content,
            created_at: row.created_at,
            profile: {
              id: (profile?.id ?? "") as string,
              username: (profile?.username ?? null) as string | null,
              display_name: (profile?.display_name ?? null) as string | null,
              avatar_url: (profile?.avatar_url ?? null) as string | null,
            },
          };
        })
      );
    }
    setLoading(false);
  }, [outfitId]);

  useEffect(() => {
    fetchComments();

    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${outfitId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `outfit_id=eq.${outfitId}`,
        },
        () => {
          // Re-fetch to get joined profile data
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [outfitId, fetchComments]);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUserId || posting) return;
    setPosting(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      user_id: currentUserId,
      outfit_id: outfitId,
      content: trimmed,
      created_at: new Date().toISOString(),
      profile: {
        id: currentUserId,
        username: currentUserUsername ?? null,
        display_name: currentUserUsername ?? null,
        avatar_url: currentUserAvatar ?? null,
      },
    };

    setComments((prev) => [...prev, optimistic]);
    setText("");

    try {
      const supabase = createClient();
      const { data: inserted, error } = await supabase
        .from("comments")
        .insert({ user_id: currentUserId, outfit_id: outfitId, content: trimmed })
        .select("id")
        .single();

      if (error || !inserted) {
        // Remove optimistic on error
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setText(trimmed);
      } else {
        // Replace temp with real id
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, id: inserted.id } : c))
        );

        // Notify outfit owner
        const { data: outfitRow } = await supabase
          .from("outfits")
          .select("creator_id")
          .eq("id", outfitId)
          .maybeSingle();
        const ownerId = outfitRow?.creator_id as string | undefined;
        if (ownerId && ownerId !== currentUserId) {
          await supabase.from("notifications").insert({
            recipient_id: ownerId,
            actor_id: currentUserId,
            type: "comment",
            outfit_id: outfitId,
            comment_id: inserted.id,
          });
        }
      }
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    const supabase = createClient();
    await supabase.from("comments").delete().eq("id", commentId).eq("user_id", currentUserId!);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  const count = comments.length;

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
        Comments{count > 0 ? ` · ${count}` : ""}
      </h2>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
        </div>
      ) : count === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-4">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="flex flex-col gap-4 mb-4">
          {comments.map((comment) => {
            const name =
              comment.profile.display_name ||
              comment.profile.username ||
              "User";
            const isOwn = comment.user_id === currentUserId;
            const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            });
            return (
              <div key={comment.id} className="flex gap-3">
                <CommentAvatar
                  avatarUrl={comment.profile.avatar_url}
                  displayName={name}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-neutral-900 leading-tight">
                      {name}
                    </span>
                    <span className="text-[11px] text-neutral-400 shrink-0">{timeAgo}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="ml-auto shrink-0 text-neutral-300 hover:text-neutral-600 transition-colors text-base leading-none"
                        aria-label="Delete comment"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed mt-0.5">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input or not-logged-in state */}
      {currentUserId ? (
        <div className="flex items-center gap-3 mt-4">
          <CommentAvatar avatarUrl={currentUserAvatar} displayName={currentUserUsername ?? "You"} />
          <div className="flex-1 flex items-center gap-2 bg-neutral-100 rounded-full px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment…"
              maxLength={500}
              className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
            />
            {text.trim() && (
              <button
                onClick={handlePost}
                disabled={posting}
                className="text-xs font-semibold text-neutral-900 shrink-0 disabled:opacity-50 transition-opacity"
              >
                Post
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-400 text-center mt-4">
          Sign in to comment
        </p>
      )}
    </div>
  );
}
