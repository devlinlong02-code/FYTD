"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hideConversation } from "@/app/actions/messages";
import { useToast } from "@/context/ToastContext";

interface Props {
  conversationId: string;
  otherUser: { id: string; display_name: string | null; username: string | null };
  currentUserId: string;
  initialIsMuted: boolean;
}

export default function ConversationInfoClient({
  conversationId,
  otherUser,
  currentUserId,
  initialIsMuted,
}: Props) {
  const [isMuted, setIsMuted] = useState(initialIsMuted);
  const [toggling, setToggling] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleMuteToggle() {
    if (toggling) return;
    setToggling(true);
    const supabase = createClient();
    const { data: conv } = await supabase
      .from("conversations")
      .select("muted_by")
      .eq("id", conversationId)
      .maybeSingle();

    const mutedBy = ((conv?.muted_by ?? []) as string[]);
    let next: string[];
    if (isMuted) {
      next = mutedBy.filter((id) => id !== currentUserId);
    } else {
      next = [...mutedBy, currentUserId];
    }
    await supabase.from("conversations").update({ muted_by: next }).eq("id", conversationId);
    setIsMuted(!isMuted);
    setToggling(false);
  }

  async function handleBlock() {
    if (!confirm(`Block ${otherUser.display_name ?? otherUser.username ?? "this user"}?`)) return;
    const supabase = createClient();
    await supabase.from("blocks").insert({ blocker_id: currentUserId, blocked_id: otherUser.id });
    await hideConversation(conversationId);
    showToast("User blocked");
    router.push("/");
  }

  async function handleDeleteConversation() {
    if (!confirm("Remove this conversation from your inbox?")) return;
    await hideConversation(conversationId);
    showToast("Conversation removed");
    router.push("/messages");
  }

  const rowCls = "flex items-center justify-between px-5 py-4 border-b border-neutral-50";

  return (
    <div className="divide-y divide-neutral-50">
      {/* Mute toggle */}
      <div className={rowCls}>
        <div>
          <p className="text-sm font-medium text-neutral-900">Mute notifications</p>
          <p className="text-xs text-neutral-400 mt-0.5">Stop notifications from this conversation</p>
        </div>
        <button
          onClick={handleMuteToggle}
          disabled={toggling}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isMuted ? "bg-neutral-900" : "bg-neutral-200"}`}
          aria-label="Toggle mute"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isMuted ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </button>
      </div>

      {/* Block */}
      <button onClick={handleBlock} className={`${rowCls} w-full text-left hover:bg-neutral-50 transition-colors`}>
        <p className="text-sm font-medium text-neutral-700">Block user</p>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {/* Delete conversation */}
      <button onClick={handleDeleteConversation} className={`${rowCls} w-full text-left hover:bg-neutral-50 transition-colors`}>
        <p className="text-sm font-medium text-red-500">Delete conversation</p>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}
