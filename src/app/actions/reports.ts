"use server";

import { createClient } from "@/lib/supabase/server";

interface SubmitReportInput {
  type: "user" | "post";
  targetId: string;
  reason: string;
  details?: string;
}

export async function submitReport(input: SubmitReportInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to submit a report." };
  }

  const { type, targetId, reason, details } = input;

  if (type === "user") {
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: targetId,
      reason,
      details: details ?? null,
    });
    if (error) {
      console.error("[submitReport] insert error:", error.message);
      return { success: false, error: "Failed to submit report. Please try again." };
    }
  } else {
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      outfit_id: targetId,
      reason,
      details: details ?? null,
    });
    if (error) {
      console.error("[submitReport] insert error:", error.message);
      return { success: false, error: "Failed to submit report. Please try again." };
    }
  }

  return { success: true };
}
