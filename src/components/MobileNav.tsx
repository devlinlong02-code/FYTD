"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthPrompt, type ActionType } from "@/context/AuthPromptContext";

type NavItem = {
  href: string;
  label: string;
  requiresAuth?: ActionType;
  plus?: boolean;
  icon: (active: boolean) => React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (active) => (
      <svg width="20" height="20" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: (active) => (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} viewBox="0 0 24 24">
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
    href: "/profile",
    label: "Profile",
    requiresAuth: "profile",
    icon: (active) => (
      <svg width="20" height="20" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Account",
    requiresAuth: "account",
    icon: (active) => (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, authLoaded, openPrompt } = useAuthPrompt();

  const handleClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.requiresAuth && authLoaded && !isAuthenticated) {
      e.preventDefault();
      openPrompt(item.requiresAuth);
    } else {
      router.push(item.href);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-100 safe-b">
      <div className="flex items-center justify-around px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          if (item.plus) {
            return (
              <button
                key={item.href}
                onClick={(e) => handleClick(item, e)}
                className="flex flex-col items-center gap-0.5 py-1 px-3"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center shadow-md">
                  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <span className="text-[9px] font-medium text-neutral-400">{item.label}</span>
              </button>
            );
          }

          if (item.requiresAuth) {
            return (
              <button
                key={item.href}
                onClick={(e) => handleClick(item, e)}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                  active ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {item.icon(active)}
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                active ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              {item.icon(active)}
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
