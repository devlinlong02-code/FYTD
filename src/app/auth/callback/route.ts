import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  // Read type from URL; default to "signup" since we only use this callback for signup confirmation
  const type = (url.searchParams.get("type") ?? "signup") as EmailOtpType;
  const next = url.searchParams.get("next") ?? "/";
  const errorParam = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  if (process.env.NODE_ENV !== "production") console.log("[callback] reached — params:", {
    hasCode: !!code,
    hasTokenHash: !!tokenHash,
    type,
    error: errorParam,
    error_code: errorCode,
    error_description: errorDescription,
  });

  // Supabase forwarded an auth error via query params (PKCE flow errors come here)
  if (errorParam) {
    console.error("[callback] Supabase query-param error:", errorParam, errorCode, errorDescription);
    const isExpired =
      errorCode === "otp_expired" ||
      errorCode === "otp_disabled" ||
      (errorParam === "access_denied" &&
        (errorDescription?.toLowerCase().includes("expired") ||
          errorDescription?.toLowerCase().includes("invalid")));
    if (isExpired) {
      if (process.env.NODE_ENV !== "production") console.log("[callback] OTP expired — redirecting to resend screen");
      return NextResponse.redirect(`${origin}/auth/signup?resend=true`);
    }
    // Already confirmed or some other access error
    const msg = "Your email is already confirmed. Try signing in.";
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(msg)}`);
  }

  // PKCE code flow
  if (code) {
    if (process.env.NODE_ENV !== "production") console.log("[callback] exchangeCodeForSession");
    let response = NextResponse.next({ request });
    const supabase = buildSupabaseClient(request, (r) => { response = r; });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[callback] exchangeCodeForSession failed:", error.message);
      return loginError(origin, error.message);
    }
    if (process.env.NODE_ENV !== "production") console.log("[callback] exchangeCodeForSession succeeded");
    return buildSuccessRedirect(supabase, origin, next, response);
  }

  // Token-hash / OTP flow (used by resend() since it doesn't include a PKCE challenge)
  if (tokenHash) {
    if (process.env.NODE_ENV !== "production") console.log("[callback] verifyOtp, type:", type);
    let response = NextResponse.next({ request });
    const supabase = buildSupabaseClient(request, (r) => { response = r; });
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("[callback] verifyOtp failed:", error.message);
      // If the "signup" type failed, try "email" — some Supabase versions use different type names
      if (type === "signup") {
        if (process.env.NODE_ENV !== "production") console.log("[callback] retrying verifyOtp with type: email");
        const { error: error2 } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "email",
        });
        if (!error2) {
          if (process.env.NODE_ENV !== "production") console.log("[callback] verifyOtp with type:email succeeded");
          return buildSuccessRedirect(supabase, origin, next, response);
        }
        console.error("[callback] verifyOtp type:email also failed:", error2.message);
      }
      return loginError(origin, error.message);
    }
    if (process.env.NODE_ENV !== "production") console.log("[callback] verifyOtp succeeded");
    return buildSuccessRedirect(supabase, origin, next, response);
  }

  // Neither code nor token_hash — likely implicit flow (hash fragment) from resend().
  // The browser strips hash fragments before the HTTP request, so we can't read them
  // server-side. Serve an HTML page with a script that reads the fragment and posts
  // the tokens to /api/auth/set-session to complete the session setup server-side.
  if (process.env.NODE_ENV !== "production") console.log("[callback] no code or token_hash — serving hash-fragment handler");
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Confirming your account…</title>
  <style>
    body { margin: 0; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; font-family: -apple-system, sans-serif; background: #fff; }
    p { color: #a3a3a3; font-size: 0.875rem; }
  </style>
</head>
<body>
  <p>Confirming your account…</p>
  <script>
    (function () {
      var hash = location.hash.slice(1);
      var params = new URLSearchParams(hash);
      var at = params.get('access_token');
      var rt = params.get('refresh_token');
      var hashError = params.get('error');
      var hashErrorCode = params.get('error_code');
      console.log('[callback-client] hash present:', !!hash,
        '| has access_token:', !!at,
        '| hash error:', hashError,
        '| error_code:', hashErrorCode);

      // Supabase sends OTP errors as hash fragments in implicit flow
      if (hashError === 'access_denied') {
        var isExpired = hashErrorCode === 'otp_expired' || hashErrorCode === 'otp_disabled';
        if (isExpired) {
          // Expired link — send to resend screen so user can request a new email
          location.replace('/auth/signup?resend=true');
          return;
        }
        // Already confirmed or other access error
        location.replace('/auth/login?error=' + encodeURIComponent(
          'Your email is already confirmed. Try signing in.'
        ));
        return;
      }

      if (!at || !rt) {
        location.replace('/auth/login?error=' + encodeURIComponent(
          'Invalid or expired confirmation link. Request a new confirmation email or try signing in.'
        ));
        return;
      }

      fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: at, refresh_token: rt })
      })
      .then(function (r) { return r.json(); })
      .then(function (d) { location.replace(d.redirect || '/'); })
      .catch(function () {
        location.replace('/auth/login?error=' + encodeURIComponent(
          'Confirmation failed. Please try signing in.'
        ));
      });
    })();
  </script>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// --- helpers ---

function buildSupabaseClient(
  request: NextRequest,
  setResponse: (r: NextResponse) => void
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          const next = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => next.cookies.set(name, value, options));
          setResponse(next);
        },
      },
    }
  );
}

async function buildSuccessRedirect(
  supabase: ReturnType<typeof createServerClient>,
  origin: string,
  next: string,
  cookieResponse: NextResponse
): Promise<NextResponse> {
  let destination = next;

  if (next === "/") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user.id)
        .single();
      destination = profile?.profile_completed ? "/" : "/onboarding";
    }
  }

  if (process.env.NODE_ENV !== "production") console.log("[callback] success — redirecting to:", destination);

  const redirectResponse = NextResponse.redirect(`${origin}${destination}`);
  cookieResponse.cookies.getAll().forEach(({ name, value }) => {
    redirectResponse.cookies.set(name, value);
  });
  return redirectResponse;
}

function loginError(origin: string, supabaseMessage: string): NextResponse {
  const lower = supabaseMessage.toLowerCase();
  const isExpired =
    lower.includes("expired") ||
    lower.includes("invalid") ||
    lower.includes("otp") ||
    lower.includes("token");
  const isAlreadyUsed = lower.includes("already");

  if (isExpired) {
    return NextResponse.redirect(`${origin}/auth/signup?resend=true`);
  }

  const msg = isAlreadyUsed
    ? "Your email is already confirmed. Try signing in."
    : "Invalid or expired confirmation link. Request a new confirmation email or try signing in.";

  return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(msg)}`);
}
