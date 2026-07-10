"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { getMessages, sendMessage, softDeleteMessage, reactToMessage } from "@/app/actions/messages";
import type { MessageRow } from "@/app/actions/messages";

interface OtherUser {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface ConversationClientProps {
  conversationId: string;
  otherUser: OtherUser;
  currentUserId: string;
  initialMessages: MessageRow[];
  otherUserReadReceipts?: boolean;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Reaction count for a message
function reactionCount(reactions: Record<string, string>): number {
  return Object.keys(reactions).length;
}

export default function ConversationClient({
  conversationId,
  otherUser,
  currentUserId,
  initialMessages,
  otherUserReadReceipts = true,
}: ConversationClientProps) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Long-press menu
  const [menuMsg, setMenuMsg] = useState<MessageRow | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayName = otherUser.display_name ?? otherUser.username ?? "User";

  useEffect(() => { setMounted(true); }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll every 5 seconds
  const fetchMessages = useCallback(async () => {
    const fresh = await getMessages(conversationId);
    setMessages(fresh);
  }, [conversationId]);

  useEffect(() => {
    pollingRef.current = setInterval(fetchMessages, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages]);

  // ── Send ────────────────────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput("");

    const optimistic: MessageRow = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: trimmed,
      read: false,
      deleted: false,
      reactions: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendMessage(conversationId, trimmed);
    setSending(false);

    if (result.success) {
      const fresh = await getMessages(conversationId);
      setMessages(fresh);
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ── Long press ───────────────────────────────────────────────────────────────
  function startLongPress(msg: MessageRow) {
    longPressTimer.current = setTimeout(() => setMenuMsg(msg), 450);
  }
  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  // ── Reactions ─────────────────────────────────────────────────────────────────
  async function handleReact(msg: MessageRow) {
    const next = { ...msg.reactions };
    if (next[currentUserId]) {
      delete next[currentUserId];
    } else {
      next[currentUserId] = "❤️";
    }
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, reactions: next } : m));
    setMenuMsg(null);
    await reactToMessage(msg.id, next);
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  function isWithinDeleteWindow(createdAt: string): boolean {
    return Date.now() - new Date(createdAt).getTime() < 10 * 60 * 1000;
  }

  async function handleDelete(msg: MessageRow) {
    if (!isWithinDeleteWindow(msg.created_at)) return;
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, deleted: true, content: "" } : m));
    setMenuMsg(null);
    await softDeleteMessage(msg.id);
  }

  // ── Read receipt helpers ──────────────────────────────────────────────────────
  const myMessages = messages.filter((m) => m.sender_id === currentUserId && !m.deleted);
  const lastMyMsg = myMessages[myMessages.length - 1];
  const lastMyMsgIsRead = lastMyMsg?.read ?? false;

  // The action menu sheet
  const menuSheet = menuMsg && mounted ? createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-[9999]" onClick={() => setMenuMsg(null)} />
      <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-white rounded-t-3xl max-w-md mx-auto overflow-hidden">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-neutral-200" />
        </div>
        <div className="pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {/* React */}
          <button
            onClick={() => handleReact(menuMsg)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors text-left"
          >
            <span className="text-xl">❤️</span>
            <span className="text-sm font-medium text-neutral-900">
              {menuMsg.reactions?.[currentUserId] ? "Remove reaction" : "React"}
            </span>
          </button>
          {/* Delete (own messages only, within 10 minutes) */}
          {menuMsg.sender_id === currentUserId && isWithinDeleteWindow(menuMsg.created_at) && (
            <button
              onClick={() => handleDelete(menuMsg)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors text-left"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-red-500">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
              <span className="text-sm font-medium text-red-500">Delete message</span>
            </button>
          )}
          <button
            onClick={() => setMenuMsg(null)}
            className="w-full flex items-center justify-center px-5 py-4 text-sm font-medium text-neutral-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 88 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-100 mb-3">
              {otherUser.avatar_url ? (
                <Image src={otherUser.avatar_url} alt={displayName} width={56} height={56} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-base font-bold text-neutral-400">{(displayName[0] ?? "?").toUpperCase()}</span>
                </div>
              )}
            </div>
            <p className="text-sm font-semibold text-neutral-900">{displayName}</p>
            {otherUser.username && <p className="text-xs text-neutral-400 mt-0.5">@{otherUser.username}</p>}
            <p className="text-xs text-neutral-400 mt-4">Say hi!</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {messages.map((msg, i) => {
            const isSent = msg.sender_id === currentUserId;
            const isLastFromMe = msg.id === lastMyMsg?.id;
            const reactCount = reactionCount(msg.reactions ?? {});
            const showTimestamp = i === 0 ||
              new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 5 * 60 * 1000;

            return (
              <div key={msg.id}>
                {/* Timestamp group header */}
                {showTimestamp && (
                  <div className="flex justify-center py-3">
                    <span className="text-[10px] text-neutral-400">{formatTime(msg.created_at)}</span>
                  </div>
                )}

                <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-0.5`}>
                  <div
                    className={`max-w-[75%] flex flex-col ${isSent ? "items-end" : "items-start"}`}
                    onMouseDown={() => startLongPress(msg)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={() => startLongPress(msg)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                  >
                    {/* Message bubble */}
                    {msg.deleted ? (
                      <div
                        style={{
                          borderRadius: 18,
                          ...(isSent ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
                          padding: "10px 14px",
                          background: isSent ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)",
                          color: "rgba(0,0,0,0.3)",
                          fontStyle: "italic",
                        }}
                      >
                        <p className="text-sm">Message deleted</p>
                      </div>
                    ) : (
                      <div
                        style={{
                          borderRadius: 18,
                          ...(isSent ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
                          padding: "10px 14px",
                          background: isSent ? "#000" : "#f4f4f4",
                          color: isSent ? "#fff" : "#000",
                          cursor: "default",
                          userSelect: "none",
                        }}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    )}

                    {/* Reaction bubble */}
                    {reactCount > 0 && (
                      <div
                        className={`flex items-center gap-0.5 mt-0.5 ${isSent ? "mr-1" : "ml-1"}`}
                        onClick={() => !msg.deleted && handleReact(msg)}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className="flex items-center gap-0.5 bg-white border border-neutral-200 rounded-full shadow-sm"
                          style={{ padding: "2px 7px" }}
                        >
                          <span style={{ fontSize: 12 }}>❤️</span>
                          {reactCount > 1 && (
                            <span className="text-[10px] font-medium text-neutral-500">{reactCount}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Read receipt — only on last sent message */}
                    {isSent && isLastFromMe && !msg.deleted && (
                      <div className="flex justify-end mt-1 mr-1">
                        {otherUserReadReceipts && lastMyMsgIsRead ? (
                          <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-neutral-200">
                            {otherUser.avatar_url ? (
                              <Image src={otherUser.avatar_url} alt="read" width={14} height={14} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span style={{ fontSize: 6, color: "white", fontWeight: 700 }}>
                                  {(otherUser.username?.[0] ?? "?").toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-300">Sent</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-neutral-100 px-4 flex items-end gap-3 max-w-md mx-auto"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)", paddingTop: 12 }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 bg-neutral-50 max-h-32 overflow-y-auto"
          style={{ lineHeight: "1.4" }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          aria-label="Send"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {menuSheet}
    </div>
  );
}
