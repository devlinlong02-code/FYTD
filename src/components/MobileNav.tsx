"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuthPrompt, type ActionType } from "@/context/AuthPromptContext";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  requiresAuth?: ActionType;
  plus?: boolean;
  notifications?: boolean;
  icon: (active: boolean) => React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (active) => (
      <svg width="22" height="22" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: (_active) => (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: "/admin/upload",
    label: "Post",
    requiresAuth: "create",
    plus: true,
    icon: () => null,
  },
  {
    href: "/notifications",
    label: "Activity",
    requiresAuth: "account",
    notifications: true,
    icon: (active) => (
      <svg width="22" height="22" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    requiresAuth: "profile",
    icon: (active) => (
      <svg width="22" height="22" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

function PostButton({ item, handleClick }: { item: NavItem; handleClick: (item: NavItem, e: React.MouseEvent) => void }) {
  const [isAnimating, setIsAnimating] = useState(false);
  return (
    <button
      onClick={(e) => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 150);
        handleClick(item, e);
      }}
      className="flex flex-col items-center justify-center flex-1 h-full"
      aria-label={item.label}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center ${isAnimating ? "animate-button-tap" : ""}`}
        style={{ background: "var(--feed-post-btn-bg)" }}
      >
        <svg width="18" height="18" fill="none" stroke="var(--feed-post-btn-icon)" strokeWidth="2.5" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    </button>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, authLoaded, openPrompt } = useAuthPrompt();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoaded || !isAuthenticated) {
      setUserId(null);
      setUnreadCount(0);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, [authLoaded, isAuthenticated]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const supabase = createClient();
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    } catch {
      // silent — badge failing is non-critical
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    const supabase = createClient();
    const channel = supabase
      .channel(`nav-notifs-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        () => setUnreadCount((prev) => prev + 1)
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadCount]);

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();
  }, [pathname, userId, fetchUnreadCount]);

  const handleClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.requiresAuth && authLoaded && !isAuthenticated) {
      e.preventDefault();
      openPrompt(item.requiresAuth);
    } else {
      router.push(item.href);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: "var(--feed-nav-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--feed-nav-border)",
        height: 56,
      }}
    >
      <div
        className="flex flex-row w-full h-full items-center justify-around"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));

          if (item.plus) {
            return (
              <PostButton key={item.href} item={item} handleClick={handleClick} />
            );
          }

          if (item.requiresAuth) {
            return (
              <button
                key={item.href}
                onClick={(e) => handleClick(item, e)}
                className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
                style={{ color: active ? "var(--feed-nav-active)" : "var(--feed-nav-icon)" }}
                aria-label={item.label}
              >
                <div className="relative flex flex-col items-center gap-1">
                  <div className="relative">
                    {item.icon(active)}
                    {item.notifications && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--feed-nav-active)" }}>
                        <span className="text-[9px] font-bold leading-none" style={{ color: "var(--feed-nav-bg)" }}>
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      </span>
                    )}
                  </div>
                  <span
                    className="w-1 h-1 rounded-full transition-opacity duration-150"
                    style={{ background: "var(--feed-nav-dot)", opacity: active ? 1 : 0 }}
                  />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
              style={{ color: active ? "var(--feed-nav-active)" : "var(--feed-nav-icon)" }}
              aria-label={item.label}
            >
              <div className="flex flex-col items-center gap-1">
                {item.icon(active)}
                <span
                  className="w-1 h-1 rounded-full transition-opacity duration-150"
                  style={{ background: "var(--feed-nav-dot)", opacity: active ? 1 : 0 }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
