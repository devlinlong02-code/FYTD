import Link from "next/link";
import Layout from "@/components/Layout";
import SignOutButton from "@/components/SignOutButton";
import { getProfile, getSession } from "@/lib/dal";
import { redirect } from "next/navigation";

const SETTINGS_SECTIONS = [
  {
    items: [
      {
        label: "Edit Profile",
        href: "/account/edit",
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ),
      },
      {
        label: "Change Password",
        href: "/settings/change-password",
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ),
      },
    ],
  },
  {
    items: [
      {
        label: "Messages",
        href: "/settings/messages",
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        label: "Notification Preferences",
        href: "/account/notifications",
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
      {
        label: "Privacy Settings",
        href: "/account/privacy",
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
      {
        label: "Blocked Accounts",
        href: "/settings/blocked",
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        ),
      },
    ],
  },
  {
    items: [
      {
        label: "Help & Support",
        href: "/account/help",
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
      {
        label: "About FYTD",
        href: "/account/about",
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      },
    ],
  },
];

const ChevronRight = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300 shrink-0">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export default async function SettingsPage() {
  const [user, profile] = await Promise.all([getSession(), getProfile()]);

  if (!user) redirect("/auth/login?next=/settings");

  const displayName = profile?.display_name ?? "User";
  const username = profile?.username ?? "user";

  return (
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/profile"
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full hover:bg-black/5 transition-colors"
          aria-label="Back to profile"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="font-bold text-xl tracking-tight text-neutral-900">Settings</span>
      </div>

      <div className="px-4 py-5 flex flex-col gap-4 pb-32">
        {/* Account identity */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="flex items-center gap-3.5 px-4 py-4">
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
              <span className="text-white text-base font-bold">{(displayName[0] ?? "?").toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
              <p className="text-xs text-neutral-400">@{username}</p>
            </div>
          </div>
        </div>

        {/* Settings sections */}
        {SETTINGS_SECTIONS.map((section, si) => (
          <div key={si} className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            {section.items.map(({ label, href, icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors"
              >
                <span className="text-neutral-400 shrink-0">{icon}</span>
                <span className="text-sm font-medium text-neutral-700 flex-1">{label}</span>
                <ChevronRight />
              </Link>
            ))}
          </div>
        ))}

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
          <a
            href="mailto:support@fytd.org?subject=Account Deletion Request"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-red-400 shrink-0">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            <span className="text-sm font-medium text-red-500 flex-1">Delete Account</span>
            <ChevronRight />
          </a>
        </div>

        <SignOutButton />

        <p className="text-center text-[10px] text-neutral-300 pb-2">
          FYTD v0.4 · Find Your &apos;Fit Daily · Private Beta
        </p>
      </div>
    </Layout>
  );
}
