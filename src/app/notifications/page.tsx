import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { getSession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import Layout from "@/components/Layout";

interface NotificationRow {
  id: string;
  type: "like" | "comment" | "follow";
  read: boolean;
  created_at: string;
  outfit_id: string | null;
  comment_id: string | null;
  actor: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  outfit_title: string | null;
}

function NotificationAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null | undefined;
  displayName: string;
}) {
  const initial = (displayName || "?")[0].toUpperCase();
  if (avatarUrl) {
    return (
      <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-neutral-100">
        <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="40px" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 shrink-0 rounded-full bg-neutral-900 flex items-center justify-center">
      <span className="text-white text-sm font-bold">{initial}</span>
    </div>
  );
}

function buildDescription(n: NotificationRow, actorName: string): string {
  switch (n.type) {
    case "like":
      return `${actorName} liked your outfit${n.outfit_title ? ` "${n.outfit_title}"` : ""}.`;
    case "comment":
      return `${actorName} commented on${n.outfit_title ? ` "${n.outfit_title}"` : " your outfit"}.`;
    case "follow":
      return `${actorName} started following you.`;
    default:
      return `${actorName} interacted with you.`;
  }
}

function buildHref(n: NotificationRow): string {
  if ((n.type === "like" || n.type === "comment") && n.outfit_id) {
    return `/outfit/${n.outfit_id}`;
  }
  if (n.type === "follow" && n.actor) {
    return `/profile`;
  }
  return "/";
}

export default async function NotificationsPage() {
  const user = await getSession();
  if (!user) {
    redirect("/auth/login?next=/notifications");
  }

  const supabase = await createClient();

  // Fetch notifications with actor profile and outfit title
  const { data: rows } = await supabase
    .from("notifications")
    .select(
      `id, type, read, created_at, outfit_id, comment_id,
       profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url),
       outfits(title)`
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications: NotificationRow[] = (rows ?? []).map((row) => {
    const actor = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const outfit = Array.isArray(row.outfits) ? row.outfits[0] : row.outfits;
    return {
      id: row.id,
      type: row.type as "like" | "comment" | "follow",
      read: row.read,
      created_at: row.created_at,
      outfit_id: row.outfit_id ?? null,
      comment_id: row.comment_id ?? null,
      actor: actor
        ? {
            id: actor.id as string,
            username: (actor.username ?? null) as string | null,
            display_name: (actor.display_name ?? null) as string | null,
            avatar_url: (actor.avatar_url ?? null) as string | null,
          }
        : null,
      outfit_title: (outfit?.title ?? null) as string | null,
    };
  });

  // Mark all as read
  if (notifications.some((n) => !n.read)) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", user.id)
      .eq("read", false);
  }

  return (
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <span className="font-bold text-xl tracking-tight text-neutral-900">Notifications</span>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-5">
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              className="text-neutral-400"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-neutral-900 text-sm font-bold mb-1.5 tracking-tight">
            No notifications yet
          </p>
          <p className="text-neutral-400 text-xs leading-relaxed max-w-[200px]">
            When someone likes, comments, or follows you, it will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {notifications.map((n) => {
            const actorName =
              n.actor?.display_name || n.actor?.username || "Someone";
            const description = buildDescription(n, actorName);
            const href = buildHref(n);
            const timeAgo = formatDistanceToNow(new Date(n.created_at), {
              addSuffix: true,
            });

            return (
              <li key={n.id}>
                <Link
                  href={href}
                  className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-neutral-50 ${
                    !n.read ? "bg-neutral-50" : ""
                  }`}
                >
                  <NotificationAvatar
                    avatarUrl={n.actor?.avatar_url}
                    displayName={actorName}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 leading-snug">
                      {description}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">{timeAgo}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-neutral-900 shrink-0 mt-1.5" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Layout>
  );
}
