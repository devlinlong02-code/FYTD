"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string | null;
  initialIsFollowing?: boolean;
  size?: "sm" | "md";
  variant?: "default" | "overlay";
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  targetUserId,
  currentUserId,
  initialIsFollowing = false,
  size = "md",
  variant = "default",
  className = "",
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [hovered, setHovered] = useState(false);
  const [pending, setPending] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!currentUserId || currentUserId === targetUserId) return null;

  const handleClick = async () => {
    if (pending) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setPending(true);
    const supabase = createClient();
    const nextFollowing = !isFollowing;

    // Optimistic update
    setIsFollowing(nextFollowing);
    onFollowChange?.(nextFollowing);

    try {
      if (nextFollowing) {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        // Notify the followed user
        await supabase.from("notifications").insert({
          recipient_id: targetUserId,
          actor_id: currentUserId,
          type: "follow",
        });
      } else {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);
      }
    } catch {
      // Revert on error
      setIsFollowing(!nextFollowing);
      onFollowChange?.(!nextFollowing);
    } finally {
      setPending(false);
    }
  };

  const p = size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-5 py-2 text-sm";
  const base = `${p} rounded-full font-medium transition-all duration-150 disabled:opacity-60 ${className}`;
  const isOverlay = variant === "overlay";

  const animClass = isAnimating ? "animate-follow-squeeze" : "";

  if (isFollowing) {
    const followingClass = isOverlay
      ? `${base} ${animClass}`
      : `${base} ${animClass} border ${hovered ? "bg-white border-neutral-400 text-neutral-700" : "bg-white border-neutral-900 text-neutral-900"}`;
    const followingStyle = isOverlay
      ? {
          background: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)",
          border: "1px solid rgba(255,255,255,0.9)",
          color: "#000",
          backdropFilter: "blur(4px)",
        }
      : undefined;
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={pending}
        className={followingClass}
        style={followingStyle}
      >
        {hovered ? "Unfollow" : "Following"}
      </button>
    );
  }

  const followClass = isOverlay
    ? `${base} ${animClass}`
    : `${base} ${animClass} bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-700`;
  const followStyle = isOverlay
    ? {
        background: "rgba(255,255,255,0.15)",
        border: "1px solid rgba(255,255,255,0.6)",
        color: "#fff",
        backdropFilter: "blur(4px)",
      }
    : undefined;

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={followClass}
      style={followStyle}
    >
      Follow
    </button>
  );
}
