import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import ConversationInfoClient from "./ConversationInfoClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getConversationInfo(conversationId: string, currentUserId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2, muted_by")
    .eq("id", conversationId)
    .maybeSingle();

  if (!data) return null;

  const otherId = data.participant_1 === currentUserId ? data.participant_2 : data.participant_1;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .eq("id", otherId)
    .maybeSingle();

  if (!profile) return null;

  const mutedBy = (data.muted_by ?? []) as string[];

  return {
    conversationId: data.id as string,
    isMuted: mutedBy.includes(currentUserId),
    otherUser: {
      id: profile.id as string,
      display_name: profile.display_name as string | null,
      username: profile.username as string | null,
      avatar_url: profile.avatar_url as string | null,
    },
  };
}

export default async function ConversationInfoPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect(`/auth/login?next=/messages/${id}/info`);

  const info = await getConversationInfo(id, user.id);
  if (!info) notFound();

  const displayName = info.otherUser.display_name ?? info.otherUser.username ?? "User";

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link
          href={`/messages/${id}`}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors shrink-0"
          aria-label="Back"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="font-bold text-base tracking-tight text-neutral-900">Details</span>
      </div>

      {/* Other user summary */}
      <div className="flex flex-col items-center py-8 border-b border-neutral-100">
        <div className="w-18 h-18 rounded-full overflow-hidden bg-neutral-100 mb-3" style={{ width: 72, height: 72 }}>
          {info.otherUser.avatar_url ? (
            <Image src={info.otherUser.avatar_url} alt={displayName} width={72} height={72} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl font-bold text-neutral-400">{(displayName[0] ?? "?").toUpperCase()}</span>
            </div>
          )}
        </div>
        <p className="text-base font-bold text-neutral-900">{displayName}</p>
        {info.otherUser.username && (
          <p className="text-sm text-neutral-400 mt-0.5">@{info.otherUser.username}</p>
        )}
        <Link
          href={`/profile/${info.otherUser.username ?? info.otherUser.id}`}
          className="mt-3 px-5 py-2 text-sm font-semibold border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors"
        >
          View profile
        </Link>
      </div>

      <ConversationInfoClient
        conversationId={id}
        otherUser={info.otherUser}
        currentUserId={user.id}
        initialIsMuted={info.isMuted}
      />
    </div>
  );
}
