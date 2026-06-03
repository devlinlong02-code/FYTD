"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthPrompt } from "@/context/AuthPromptContext";

interface LikeButtonProps {
  outfitId: string;
  currentUserId: string | null;
  initialLiked?: boolean;
  initialCount?: number;
  showCount?: boolean;
  size?: "sm" | "md";
}

export default function LikeButton({
  outfitId,
  currentUserId,
  initialLiked = false,
  initialCount = 0,
  showCount = false,
  size = "md",
}: LikeButtonProps) {
  const { openPrompt, authLoaded, isAuthenticated } = useAuthPrompt();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleClick = useCallback(async () => {
    if (pending) return;

    if (authLoaded && !isAuthenticated) {
      openPrompt("like");
      return;
    }
    if (!currentUserId) {
      openPrompt("like");
      return;
    }

    setPending(true);
    const nextLiked = !liked;

    // Optimistic update
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    if (nextLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }

    try {
      const supabase = createClient();
      if (nextLiked) {
        await supabase.from("likes").insert({
          user_id: currentUserId,
          outfit_id: outfitId,
        });
        // Fetch outfit owner and notify
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
            type: "like",
            outfit_id: outfitId,
          });
        }
      } else {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("outfit_id", outfitId);
      }
    } catch {
      // Revert on error
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
    } finally {
      setPending(false);
    }
  }, [pending, liked, currentUserId, outfitId, authLoaded, isAuthenticated, openPrompt]);

  const iconSize = size === "sm" ? 18 : 22;

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={liked ? "Unlike" : "Like"}
      className="flex items-center gap-1.5 transition-opacity disabled:opacity-60"
      style={{
        transform: animating ? "scale(1.25)" : "scale(1)",
        transition: "transform 150ms ease-out",
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={liked ? "#000000" : "none"}
        stroke="#000000"
        strokeWidth="1.8"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showCount && count > 0 && (
        <span className="text-sm font-medium text-neutral-900 tabular-nums">{count}</span>
      )}
    </button>
  );
}
