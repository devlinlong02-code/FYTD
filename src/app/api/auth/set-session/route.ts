import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const access_token: string | undefined = body?.access_token;
    const refresh_token: string | undefined = body?.refresh_token;

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { redirect: "/auth/login?error=" + encodeURIComponent("Invalid confirmation link. Please try again.") },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV !== "production") console.log("[set-session] received token exchange request");

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

    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) {
      console.error("[set-session] setSession failed:", sessionError.message);
      return NextResponse.json({
        redirect:
          "/auth/login?error=" +
          encodeURIComponent(
            "Invalid or expired confirmation link. Request a new confirmation email or try signing in."
          ),
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let destination = "/";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user.id)
        .single();
      destination = profile?.profile_completed ? "/" : "/onboarding";
    }

    if (process.env.NODE_ENV !== "production") console.log("[set-session] success — destination:", destination);

    const jsonResponse = NextResponse.json({ redirect: destination });
    response.cookies.getAll().forEach(({ name, value }) => {
      jsonResponse.cookies.set(name, value);
    });
    return jsonResponse;
  } catch (err) {
    console.error("[set-session] unexpected error:", err);
    return NextResponse.json({
      redirect:
        "/auth/login?error=" +
        encodeURIComponent("Confirmation failed. Please try signing in."),
    });
  }
}
