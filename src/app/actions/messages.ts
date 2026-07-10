"use server";

import { createClient } from "@/lib/supabase/server";

export interface ConversationParticipant {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface ConversationRow {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  last_message_at: string;
  last_message_preview: string | null;
  status: string;
  otherUser: ConversationParticipant;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  deleted: boolean;
  reactions: Record<string, string>;
  created_at: string;
}

export async function getOrCreateConversation(otherUserId: string): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Not authenticated" };

  // Check for existing conversation in either direction (including hidden ones)
  const { data: existing } = await supabase
    .from("conversations")
    .select("id, hidden_by")
    .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    // If current user had hidden this conversation, unhide it
    const hiddenBy = (existing.hidden_by ?? []) as string[];
    if (hiddenBy.includes(user.id)) {
      await supabase
        .from("conversations")
        .update({ hidden_by: hiddenBy.filter((id) => id !== user.id) })
        .eq("id", existing.id);
    }
    return { id: existing.id as string };
  }

  // Check if target follows current user (determines request vs active)
  const { data: followsBack } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", otherUserId)
    .eq("following_id", user.id)
    .maybeSingle();

  const status = followsBack ? "active" : "request";

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({ participant_1: user.id, participant_2: otherUserId, status, initiated_by: user.id })
    .select("id")
    .single();

  if (createError || !created) {
    console.error("[getOrCreateConversation] insert error:", createError?.message);
    return { error: "Failed to create conversation" };
  }

  return { id: created.id as string };
}

export async function getConversations(): Promise<{ active: ConversationRow[]; requests: ConversationRow[] }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return { active: [], requests: [] };

  const { data: rows, error } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2, created_at, last_message_at, last_message_preview, status, hidden_by, initiated_by")
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .neq("status", "declined")
    .order("last_message_at", { ascending: false });

  if (error || !rows) {
    console.error("[getConversations] query error:", error?.message);
    return { active: [], requests: [] };
  }

  // Filter out hidden conversations for this user
  const visible = rows.filter((r) => {
    const hidden = (r.hidden_by ?? []) as string[];
    return !hidden.includes(user.id);
  });

  const otherIds = visible.map((r) =>
    r.participant_1 === user.id ? r.participant_2 : r.participant_1
  ) as string[];
  const uniqueOtherIds = [...new Set(otherIds)];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", uniqueOtherIds);

  const profileMap = new Map<string, ConversationParticipant>();
  (profiles ?? []).forEach((p) => {
    profileMap.set(p.id as string, {
      id: p.id as string,
      display_name: p.display_name as string | null,
      username: p.username as string | null,
      avatar_url: p.avatar_url as string | null,
    });
  });

  const toRow = (r: typeof rows[0]): ConversationRow => {
    const otherId = r.participant_1 === user.id ? r.participant_2 : r.participant_1;
    return {
      id: r.id as string,
      participant_1: r.participant_1 as string,
      participant_2: r.participant_2 as string,
      created_at: r.created_at as string,
      last_message_at: r.last_message_at as string,
      last_message_preview: r.last_message_preview as string | null,
      status: (r.status as string) ?? "active",
      otherUser: profileMap.get(otherId as string) ?? {
        id: otherId as string,
        display_name: null,
        username: null,
        avatar_url: null,
      },
    };
  };

  const active = visible.filter((r) => {
    if ((r.status ?? "active") === "active") return true;
    // Sender sees their own outbound requests in the active list
    if (r.status === "request" && (r.initiated_by as string | null) === user.id) return true;
    return false;
  }).map(toRow);

  // Requests are only shown to the recipient (not the sender)
  const requests = visible.filter((r) =>
    r.status === "request" && (r.initiated_by as string | null) !== user.id
  ).map(toRow);

  return { active, requests };
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, read, deleted, reactions, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getMessages] query error:", error.message);
    return [];
  }

  // Mark unread messages (from others) as read
  const unreadIds = (messages ?? [])
    .filter((m) => !m.read && m.sender_id !== user.id)
    .map((m) => m.id as string);

  if (unreadIds.length > 0) {
    await supabase.from("messages").update({ read: true }).in("id", unreadIds);
  }

  return (messages ?? []).map((m) => ({
    id: m.id as string,
    conversation_id: m.conversation_id as string,
    sender_id: m.sender_id as string,
    content: m.content as string,
    read: m.read as boolean,
    deleted: (m.deleted as boolean) ?? false,
    reactions: (m.reactions as Record<string, string>) ?? {},
    created_at: m.created_at as string,
  }));
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return { success: false, error: "Not authenticated" };

  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Message cannot be empty" };
  if (trimmed.length > 2000) return { success: false, error: "Message too long" };

  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: trimmed,
  });

  if (insertError) {
    console.error("[sendMessage] insert error:", insertError.message);
    return { success: false, error: "Failed to send message" };
  }

  // Fetch conversation to find the recipient and check hidden_by
  const { data: conv } = await supabase
    .from("conversations")
    .select("participant_1, participant_2, hidden_by")
    .eq("id", conversationId)
    .maybeSingle();

  if (conv) {
    const recipientId = (conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1) as string;
    const hiddenBy = (conv.hidden_by ?? []) as string[];
    // Unhide for recipient if they previously hid this conversation
    const updatedHiddenBy = hiddenBy.filter((id) => id !== recipientId);

    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: trimmed.slice(0, 100),
        ...(updatedHiddenBy.length !== hiddenBy.length ? { hidden_by: updatedHiddenBy } : {}),
      })
      .eq("id", conversationId);
  } else {
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString(), last_message_preview: trimmed.slice(0, 100) })
      .eq("id", conversationId);
  }

  return { success: true };
}

export async function softDeleteMessage(messageId: string): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false };

  const { error } = await supabase
    .from("messages")
    .update({ deleted: true, content: "" })
    .eq("id", messageId)
    .eq("sender_id", user.id);

  return { success: !error };
}

export async function reactToMessage(
  messageId: string,
  reactions: Record<string, string>
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false };

  const { error } = await supabase
    .from("messages")
    .update({ reactions })
    .eq("id", messageId);

  return { success: !error };
}

export async function hideConversation(conversationId: string): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false };

  const { error } = await supabase.rpc("hide_conversation_for_user", {
    conversation_id: conversationId,
    user_id: user.id,
  });

  return { success: !error };
}

export async function updateConversationStatus(
  conversationId: string,
  status: "active" | "declined"
): Promise<{ success: boolean; errorMessage?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, errorMessage: "Not authenticated" };

  // Use only eq("id") — RLS policy already restricts updates to participants
  const { error } = await supabase
    .from("conversations")
    .update({ status })
    .eq("id", conversationId);

  if (error) {
    console.error("[updateConversationStatus] update failed:", error.message, error.code);
    return { success: false, errorMessage: error.message };
  }

  return { success: true };
}

export async function getMessageSettings(): Promise<{
  read_receipts_enabled: boolean;
  allow_message_requests: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { read_receipts_enabled: true, allow_message_requests: true };

  const { data } = await supabase
    .from("profiles")
    .select("read_receipts_enabled, allow_message_requests")
    .eq("id", user.id)
    .maybeSingle();

  return {
    read_receipts_enabled: (data?.read_receipts_enabled as boolean) ?? true,
    allow_message_requests: (data?.allow_message_requests as boolean) ?? true,
  };
}

export async function updateMessageSettings(settings: {
  read_receipts_enabled?: boolean;
  allow_message_requests?: boolean;
}): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase.from("profiles").update(settings).eq("id", user.id);
  return { success: !error };
}
