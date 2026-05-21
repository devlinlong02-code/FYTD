"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please confirm your email before signing in. Check your inbox.",
  "User already registered": "An account with this email already exists.",
  "Password should be at least 6 characters": "Password must be at least 8 characters.",
};

function friendlyError(message: string): string {
  return AUTH_ERRORS[message] ?? message ?? "Something went wrong. Try again.";
}

export async function login(
  _prev: { error: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/";

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: friendlyError(error.message) };

  redirect(next);
}

type SignupState = { error: string | null; confirm?: boolean; email?: string; redirectTo?: string } | null;

export async function signup(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const displayName = (formData.get("display_name") as string)?.trim();

  if (!email || !password || !username)
    return { error: "All fields are required." };

  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  if (!/^[a-z0-9_]+$/.test(username))
    return { error: "Username can only contain letters, numbers, and underscores." };

  try {
    // NEXT_PUBLIC_SITE_URL is set in Vercel env vars for production (https://fytd.org).
    // Fall back to the request host so local dev works without any env var.
    let emailRedirectTo: string;
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      emailRedirectTo = `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/auth/callback`;
    } else {
      const headersList = await headers();
      const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
      const proto = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      emailRedirectTo = `${proto}://${host}/auth/callback`;
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { username, display_name: displayName || username },
      },
    });
    console.log("[signup] emailRedirectTo:", emailRedirectTo);
    console.log("[signup] result — user:", data?.user?.id, "session:", !!data?.session, "error:", error?.message);

    if (error) {
      const msg = error.message ?? "";
      // Surface email delivery failures clearly — usually means SMTP is not configured
      const friendly = msg.includes("sending confirmation email") || msg.includes("email")
        ? "Account created but the confirmation email failed to send. Please configure SMTP in the Supabase dashboard (Settings → Auth → SMTP)."
        : friendlyError(msg);
      return { error: friendly };
    }

    // No session means email confirmation is required — show inbox prompt
    if (!data?.session) {
      return { error: null, confirm: true, email };
    }

    // Session returned immediately (email confirmation disabled) — signal client to redirect.
    // We return state instead of calling redirect() because redirect() inside useActionState
    // returns an HTML page that React tries to parse as a server action response.
    return { error: null, redirectTo: "/" };
  } catch (err) {
    console.error("[signup] unexpected error:", err);
    return { error: "Signup failed. Please try again." };
  }
}

export async function resendConfirmation(
  _prev: { error: string | null; sent?: boolean } | null,
  formData: FormData
): Promise<{ error: string | null; sent?: boolean }> {
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "Email is required." };

  try {
    let emailRedirectTo: string;
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      emailRedirectTo = `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/auth/callback`;
    } else {
      const headersList = await headers();
      const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
      const proto = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      emailRedirectTo = `${proto}://${host}/auth/callback`;
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });

    if (error) return { error: friendlyError(error.message) };
    return { error: null, sent: true };
  } catch (err) {
    console.error("[resendConfirmation] unexpected error:", err);
    return { error: "Failed to resend. Please try again." };
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
