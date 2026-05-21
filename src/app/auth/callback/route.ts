import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  // Default to "email" — some Supabase versions omit the type param
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  const next = url.searchParams.get("next") ?? "/";
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  console.log("[callback] received:", {
    hasCode: !!code,
    hasTokenHash: !!tokenHash,
    type,
    errorParam,
    errorDescription,
  });

  // Supabase forwarded an auth error (expired link, already-used link, etc.)
  if (errorParam) {
    console.error("[callback] Supabase error param:", errorParam, errorDescription);
    const isExpired =
      errorParam === "access_denied" &&
      (errorDescription?.toLowerCase().includes("expired") ||
        errorDescription?.toLowerCase().includes("invalid"));
    if (isExpired) {
      // Expired — user needs a new link, send them to the resend flow
      return NextResponse.redirect(`${origin}/auth/signup?resend=true`);
    }
    // Already confirmed or some other error — signing in is the right move
    const msg = "Confirmation link has already been used. Please sign in.";
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(msg)}`);
  }

  // Nothing usable in the URL — malformed or wrong destination
  if (!code && !tokenHash) {
    console.error("[callback] no code or token_hash found in URL");
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(
        "Invalid confirmation link. Please try signing up again or request a new confirmation email."
      )}`
    );
  }

  // Build a Route-Handler-safe Supabase client.
  // Cookies must be explicitly copied from request → response so the session
  // survives the redirect. Using NextResponse.next() here (not cookies() from
  // next/headers) guarantees Set-Cookie headers appear on the redirect response.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // --- PKCE code flow (Supabase default with @supabase/ssr) ---
  if (code) {
    console.log("[callback] exchangeCodeForSession");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[callback] exchangeCodeForSession failed:", error.message);
      return loginError(origin, error.message);
    }
    console.log("[callback] exchangeCodeForSession succeeded");
    return buildSuccessRedirect(supabase, origin, next, response);
  }

  // --- Token-hash flow (OTP / implicit — used by some Supabase email templates) ---
  if (tokenHash) {
    console.log("[callback] verifyOtp, type:", type);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("[callback] verifyOtp failed:", error.message);
      return loginError(origin, error.message);
    }
    console.log("[callback] verifyOtp succeeded");
    return buildSuccessRedirect(supabase, origin, next, response);
  }

  // Unreachable — guarded above — but satisfies TypeScript
  return loginError(origin, "Unknown error.");
}

// --- helpers ---

async function buildSuccessRedirect(
  supabase: ReturnType<typeof createServerClient>,
  origin: string,
  next: string,
  cookieResponse: NextResponse
): Promise<NextResponse> {
  let destination = next;

  if (next === "/") {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user.id)
        .single();
      destination = profile?.profile_completed ? "/" : "/onboarding";
    }
  }

  console.log("[callback] success — redirecting to:", destination);

  const redirectResponse = NextResponse.redirect(`${origin}${destination}`);
  // Copy session cookies set during the exchange onto the redirect response
  cookieResponse.cookies.getAll().forEach(({ name, value }) => {
    redirectResponse.cookies.set(name, value);
  });
  return redirectResponse;
}

function loginError(origin: string, supabaseMessage: string): NextResponse {
  const isExpired =
    supabaseMessage.toLowerCase().includes("expired") ||
    supabaseMessage.toLowerCase().includes("invalid");
  const isAlreadyUsed = supabaseMessage.toLowerCase().includes("already");

  if (isExpired) {
    // Send to resend flow — user needs a new link
    return NextResponse.redirect(`${origin}/auth/signup?resend=true`);
  }

  const msg = isAlreadyUsed
    ? "Confirmation link has already been used. Please sign in."
    : "Could not confirm your account. Please try again or request a new confirmation email.";

  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent(msg)}`
  );
}
