"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import GifPicker from "@/components/GifPicker";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  content: string | null;
  gif_url: string | null;
  gif_preview_url: string | null;
  gif_width: number | null;
  gif_height: number | null;
  likes_count: number;
  parent_id: string | null;
  created_at: string;
  profile: CommentProfile;
  replies?: Comment[];
  isLiked?: boolean;
}

interface SelectedGif {
  url: string;
  preview: string;
  width: number;
  height: number;
}

interface CommentsSectionProps {
  outfitId: string;
  currentUserId: string | null;
  currentUserUsername?: string;
  currentUserAvatar?: string | null;
  isOutfitOwner?: boolean;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function CommentAvatar({ url, name, size = 30 }: { url?: string | null; name: string; size?: number }) {
  const initial = (name || "?")[0].toUpperCase();
  const cls = `rounded-full overflow-hidden bg-neutral-100 flex-shrink-0 flex items-center justify-center`;
  const style = { width: size, height: size };

  if (url) {
    return (
      <div className={cls} style={style}>
        <Image src={url} alt={name} width={size} height={size} className="object-cover w-full h-full" />
      </div>
    );
  }
  return (
    <div className={cls + " bg-neutral-900"} style={style}>
      <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>{initial}</span>
    </div>
  );
}

// ─── Options sheet ───────────────────────────────────────────────────────────

function OptionsSheet({
  canDelete,
  onDelete,
  onReport,
  onClose,
}: {
  canDelete: boolean;
  onDelete: () => void;
  onReport: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-md mx-auto bg-white rounded-t-2xl p-2 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-8 h-1 bg-black/10 rounded-full mx-auto mb-4" />
        {canDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-red-500 text-sm font-medium hover:bg-black/[0.02] rounded-xl transition-colors"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
            Delete comment
          </button>
        )}
        <button
          onClick={onReport}
          className="flex items-center gap-3 w-full px-4 py-3.5 text-neutral-900 text-sm font-medium hover:bg-black/[0.02] rounded-xl transition-colors"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          Report comment
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-full px-4 py-3.5 text-black/40 text-sm font-medium mt-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Comment row ─────────────────────────────────────────────────────────────

function CommentRow({
  comment,
  currentUserId,
  canDeleteAny,
  onLike,
  onReply,
  onDelete,
  onReport,
  showReplies,
  onToggleReplies,
  isReply = false,
}: {
  comment: Comment;
  currentUserId: string | null;
  canDeleteAny: boolean;
  onLike: (id: string, liked: boolean) => void;
  onReply: (id: string, username: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  showReplies: boolean;
  onToggleReplies: () => void;
  isReply?: boolean;
}) {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const isOwn = currentUserId === comment.user_id;
  const canDelete = isOwn || canDeleteAny;
  const name = comment.profile.username || comment.profile.display_name || "user";
  const replyCount = comment.replies?.length ?? 0;
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  function handleLike() {
    if (!currentUserId) return;
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 380);
    onLike(comment.id, !!comment.isLiked);
  }

  return (
    <div className={`comment-row${isReply ? " comment-reply" : ""}`}>
      {/* Avatar */}
      <button className="self-start" onClick={() => router.push(`/profile/${name}`)}>
        <CommentAvatar url={comment.profile.avatar_url} name={name} size={isReply ? 26 : 30} />
      </button>

      {/* Body */}
      <div className="comment-content">
        <div className="comment-meta">
          <button
            className="comment-username"
            onClick={() => router.push(`/profile/${name}`)}
          >
            {name}
          </button>
          <span className="comment-time">{timeAgo}</span>
        </div>

        {comment.content && (
          <p className="comment-text">{comment.content}</p>
        )}

        {comment.gif_url && (
          <div className="comment-gif-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={comment.gif_url}
              alt="GIF"
              className="comment-gif"
            />
          </div>
        )}

        {/* Actions */}
        <div className="comment-actions">
          {!isReply && currentUserId && (
            <button className="comment-action-btn" onClick={() => onReply(comment.id, name)}>
              Reply
            </button>
          )}

          <button className="comment-like-btn" onClick={handleLike}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-all ${likeAnim ? "scale-150" : "scale-100"} ${comment.isLiked ? "fill-black stroke-black" : "fill-none stroke-black/40"}`}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {comment.likes_count > 0 && (
              <span className="comment-like-count">{comment.likes_count}</span>
            )}
          </button>

          <button className="comment-more-btn ml-auto" onClick={() => setShowOptions(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-black/30">
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>

        {/* Replies toggle */}
        {!isReply && replyCount > 0 && (
          <button className="comment-replies-toggle" onClick={onToggleReplies}>
            <div className="reply-toggle-line" />
            <span>{showReplies ? "Hide replies" : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}</span>
          </button>
        )}

        {/* Replies list */}
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies-list">
            {comment.replies.map((reply) => (
              <CommentRow
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                canDeleteAny={canDeleteAny}
                onLike={onLike}
                onReply={onReply}
                onDelete={onDelete}
                onReport={onReport}
                showReplies={false}
                onToggleReplies={() => {}}
                isReply
              />
            ))}
          </div>
        )}
      </div>

      {showOptions && (
        <OptionsSheet
          canDelete={canDelete}
          onDelete={() => { onDelete(comment.id); setShowOptions(false); }}
          onReport={() => { onReport(comment.id); setShowOptions(false); }}
          onClose={() => setShowOptions(false)}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommentsSection({
  outfitId,
  currentUserId,
  currentUserUsername,
  currentUserAvatar,
  isOutfitOwner = false,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [selectedGif, setSelectedGif] = useState<SelectedGif | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchComments = useCallback(async () => {
    const { data: top } = await supabase
      .from("comments")
      .select("id, user_id, outfit_id, content, gif_url, gif_preview_url, gif_width, gif_height, likes_count, parent_id, created_at, profiles!comments_user_id_fkey(id, username, display_name, avatar_url)")
      .eq("outfit_id", outfitId)
      .is("parent_id", null)
      .order("created_at", { ascending: true });

    if (!top) { setLoading(false); return; }

    const parentIds = top.map((c) => c.id);
    const { data: allReplies } = parentIds.length
      ? await supabase
          .from("comments")
          .select("id, user_id, outfit_id, content, gif_url, gif_preview_url, gif_width, gif_height, likes_count, parent_id, created_at, profiles!comments_user_id_fkey(id, username, display_name, avatar_url)")
          .in("parent_id", parentIds)
          .order("created_at", { ascending: true })
      : { data: [] };

    // Build like set for current user
    const allIds = [...top.map((c) => c.id), ...(allReplies ?? []).map((r) => r.id)];
    let likedIds = new Set<string>();
    if (currentUserId && allIds.length) {
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", currentUserId)
        .in("comment_id", allIds);
      likedIds = new Set(likes?.map((l) => l.comment_id) ?? []);
    }

    function toComment(row: Record<string, unknown>): Comment {
      const p = (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) as Record<string, unknown> ?? {};
      return {
        id: row.id as string,
        user_id: row.user_id as string,
        outfit_id: row.outfit_id as string,
        content: row.content as string | null,
        gif_url: row.gif_url as string | null,
        gif_preview_url: row.gif_preview_url as string | null,
        gif_width: row.gif_width as number | null,
        gif_height: row.gif_height as number | null,
        likes_count: (row.likes_count as number) ?? 0,
        parent_id: row.parent_id as string | null,
        created_at: row.created_at as string,
        isLiked: likedIds.has(row.id as string),
        profile: {
          id: (p.id ?? "") as string,
          username: p.username as string | null,
          display_name: p.display_name as string | null,
          avatar_url: p.avatar_url as string | null,
        },
      };
    }

    const repliesByParent = new Map<string, Comment[]>();
    for (const r of allReplies ?? []) {
      const reply = toComment(r as Record<string, unknown>);
      const arr = repliesByParent.get(reply.parent_id!) ?? [];
      arr.push(reply);
      repliesByParent.set(reply.parent_id!, arr);
    }

    const built = top.map((c) => ({
      ...toComment(c as Record<string, unknown>),
      replies: repliesByParent.get(c.id) ?? [],
    }));

    setComments(built);
    setLoading(false);
  }, [outfitId, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchComments();

    // INSERT/UPDATE: filter by outfit_id works because the row still exists
    // DELETE: no filter — Supabase can't filter on deleted rows; handle by id in the callback
    const channel = supabase
      .channel(`comments:${outfitId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `outfit_id=eq.${outfitId}` }, fetchComments)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "comments", filter: `outfit_id=eq.${outfitId}` }, fetchComments)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "comments" }, (payload) => {
        const deletedId = (payload.old as { id: string }).id;
        setComments((prev) =>
          prev
            .filter((c) => c.id !== deletedId)
            .map((c) => ({ ...c, replies: c.replies?.filter((r) => r.id !== deletedId) ?? [] }))
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [outfitId, fetchComments]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if ((!text.trim() && !selectedGif) || posting || !currentUserId) return;
    setPosting(true);

    const content = text.trim() || null;
    const gif = selectedGif;
    const parentId = replyingTo?.id ?? null;

    setText("");
    setSelectedGif(null);
    setReplyingTo(null);
    setShowGifPicker(false);

    try {
      const { data: inserted, error } = await supabase
        .from("comments")
        .insert({
          user_id: currentUserId,
          outfit_id: outfitId,
          content,
          parent_id: parentId,
          gif_url: gif?.url ?? null,
          gif_preview_url: gif?.preview ?? null,
          gif_width: gif?.width ?? null,
          gif_height: gif?.height ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Auto-expand replies if this was a reply
      if (parentId) {
        setExpandedReplies((prev) => new Set(prev).add(parentId));
      }

      // Notify outfit owner
      const { data: outfitRow } = await supabase.from("outfits").select("creator_id").eq("id", outfitId).maybeSingle();
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

      // Notify parent commenter if this is a reply
      if (parentId) {
        const { data: parentRow } = await supabase
          .from("comments")
          .select("user_id")
          .eq("id", parentId)
          .maybeSingle();
        const parentAuthorId = parentRow?.user_id as string | undefined;
        if (parentAuthorId && parentAuthorId !== currentUserId && parentAuthorId !== ownerId) {
          await supabase.from("notifications").insert({
            recipient_id: parentAuthorId,
            actor_id: currentUserId,
            type: "reply",
            outfit_id: outfitId,
            comment_id: inserted.id,
          });
        }
      }

      await fetchComments();
    } catch {
      setText(content ?? "");
      setSelectedGif(gif);
    } finally {
      setPosting(false);
    }
  };

  // ── Like ───────────────────────────────────────────────────────────────────

  function handleLike(commentId: string, isLiked: boolean) {
    if (!currentUserId) return;

    // Optimistic
    function updateTree(list: Comment[]): Comment[] {
      return list.map((c) => {
        if (c.id === commentId) {
          return { ...c, isLiked: !isLiked, likes_count: isLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1 };
        }
        return { ...c, replies: c.replies ? updateTree(c.replies) : [] };
      });
    }
    setComments((prev) => updateTree(prev));

    if (isLiked) {
      supabase.from("comment_likes").delete().eq("user_id", currentUserId).eq("comment_id", commentId);
    } else {
      supabase.from("comment_likes").insert({ user_id: currentUserId, comment_id: commentId });
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(commentId: string) {
    const snapshot = comments;
    // Optimistic removal
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({ ...c, replies: c.replies?.filter((r) => r.id !== commentId) ?? [] }))
    );
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) {
      console.error("[CommentsSection] delete failed:", error.message);
      setComments(snapshot); // revert optimistic update
    }
  }

  // ── Reply ──────────────────────────────────────────────────────────────────

  function handleReply(commentId: string, username: string) {
    setReplyingTo({ id: commentId, username });
    setText(`@${username} `);
    inputRef.current?.focus();
  }

  // ── Report ─────────────────────────────────────────────────────────────────

  async function handleReport(commentId: string) {
    if (!currentUserId) return;
    await supabase.from("reports").insert({
      reporter_id: currentUserId,
      target_type: "comment",
      target_id: commentId,
    }).maybeSingle();
  }

  function toggleReplies(commentId: string) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  }

  const count = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length ?? 0), 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-0 pt-6 pb-4">
      <h2 className="text-[15px] font-semibold text-neutral-900 mb-4 px-4">
        Comments{count > 0 ? ` · ${count}` : ""}
      </h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-6 px-4">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col">
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              canDeleteAny={isOutfitOwner}
              onLike={handleLike}
              onReply={handleReply}
              onDelete={handleDelete}
              onReport={handleReport}
              showReplies={expandedReplies.has(comment.id)}
              onToggleReplies={() => toggleReplies(comment.id)}
            />
          ))}
        </div>
      )}

      {/* Input area */}
      {currentUserId ? (
        <div className="comment-input-container">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="reply-indicator">
              <span>Replying to <strong>@{replyingTo.username}</strong></span>
              <button onClick={() => { setReplyingTo(null); setText(""); }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* GIF preview */}
          {selectedGif && (
            <div className="gif-preview-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedGif.preview} alt="GIF" className="gif-preview" />
              <button onClick={() => setSelectedGif(null)} className="gif-preview-remove">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Input row */}
          <div className="comment-input-row">
            <CommentAvatar url={currentUserAvatar} name={currentUserUsername ?? "you"} size={30} />
            <div className="comment-input-wrap">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder={replyingTo ? `Reply to @${replyingTo.username}…` : "Add a comment…"}
                maxLength={500}
                className="comment-input"
              />
              <button
                onClick={() => setShowGifPicker((v) => !v)}
                className={`gif-btn${showGifPicker ? " active" : ""}`}
                title="Add GIF"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="2" width="20" height="20" rx="4" />
                  <path d="M9 12v-3H7v6h2M11 9v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zM17 9h2M17 12h1.5M17 15h2" />
                </svg>
              </button>
            </div>
            {(text.trim() || selectedGif) && (
              <button onClick={handleSubmit} disabled={posting} className="comment-send-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            )}
          </div>

          {/* GIF picker */}
          {showGifPicker && (
            <GifPicker
              onSelect={(gif) => { setSelectedGif(gif); setShowGifPicker(false); }}
              onClose={() => setShowGifPicker(false)}
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-400 text-center mt-4 px-4">Sign in to comment</p>
      )}
    </div>
  );
}
