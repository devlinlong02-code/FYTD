import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/dal";
import { getMessages } from "@/app/actions/messages";
import { createClient } from "@/lib/supabase/server";
import ConversationClient from "./ConversationClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getConversationWithParticipants(conversationId: string, currentUserId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) return null;

  const otherId =
    data.participant_1 === currentUserId ? data.participant_2 : data.participant_1;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .eq("id", otherId)
    .maybeSingle();

  if (!profile) return null;

  return {
    conversationId: data.id as string,
    otherUser: {
      id: profile.id as string,
      display_name: profile.display_name as string | null,
      username: profile.username as string | null,
      avatar_url: profile.avatar_url as string | null,
    },
  };
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getSession();

  if (!user) redirect(`/auth/login?next=/messages/${id}`);

  const [conversation, messages] = await Promise.all([
    getConversationWithParticipants(id, user.id),
    getMessages(id),
  ]);

  if (!conversation) notFound();

  const displayName =
    conversation.otherUser.display_name ??
    conversation.otherUser.username ??
    "User";

  return (
    <div className="relative max-w-md mx-auto min-h-[100dvh] bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/messages"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors shrink-0"
          aria-label="Back to messages"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <Link href={`/messages/${id}/info`} className="flex-1 min-w-0">
          <span className="font-bold text-base tracking-tight text-neutral-900 block truncate">
            {displayName}
          </span>
          {conversation.otherUser.username && (
            <span className="text-xs text-neutral-400">@{conversation.otherUser.username}</span>
          )}
        </Link>
        <Link
          href={`/messages/${id}/info`}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors shrink-0"
          aria-label="Conversation details"
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </Link>
      </div>

      <ConversationClient
        conversationId={conversation.conversationId}
        otherUser={conversation.otherUser}
        currentUserId={user.id}
        initialMessages={messages}
      />
    </div>
  );
}
