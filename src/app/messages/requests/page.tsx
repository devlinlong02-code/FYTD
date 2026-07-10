"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import Avatar from "@/components/Avatar";
import { getConversations, updateConversationStatus } from "@/app/actions/messages";
import type { ConversationRow } from "@/app/actions/messages";
import { useToast } from "@/context/ToastContext";

export default function MessageRequestsPage() {
  const [requests, setRequests] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    getConversations().then(({ requests }) => {
      setRequests(requests);
      setLoading(false);
    });
  }, []);

  async function handleAccept(convId: string) {
    setPending(convId);
    const result = await updateConversationStatus(convId, "active");
    if (!result.success) {
      showToast("Could not accept — try again");
      setPending(null);
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== convId));
    showToast("Request accepted");
    setPending(null);
    // Navigate back so the server-rendered inbox re-fetches with updated status
    router.push("/messages");
    router.refresh();
  }

  async function handleDecline(convId: string) {
    setPending(convId);
    const result = await updateConversationStatus(convId, "declined");
    if (!result.success) {
      showToast("Could not decline — try again");
      setPending(null);
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== convId));
    showToast("Request declined");
    setPending(null);
  }

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/messages"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          aria-label="Back"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="font-bold text-xl tracking-tight text-neutral-900">Message Requests</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <p className="text-sm text-neutral-400">No pending requests</p>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-4">
          <p className="text-xs text-neutral-400">
            These people aren&apos;t in your following list. They can&apos;t see your messages until you accept.
          </p>
          {requests.map((req) => {
            const other = req.otherUser;
            const displayName = other.display_name ?? other.username ?? "User";
            return (
              <div key={req.id} className="bg-neutral-50 rounded-2xl p-4 flex flex-col gap-3">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => router.push(`/profile/${other.username ?? other.id}`)}
                >
                  <Avatar avatarUrl={other.avatar_url} displayName={displayName} size={44} />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{displayName}</p>
                    {other.username && <p className="text-xs text-neutral-400">@{other.username}</p>}
                  </div>
                </div>
                {req.last_message_preview && (
                  <p className="text-sm text-neutral-500 leading-relaxed">{req.last_message_preview}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={pending === req.id}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(req.id)}
                    disabled={pending === req.id}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
