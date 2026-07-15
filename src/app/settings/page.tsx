import Link from "next/link";
import Layout from "@/components/Layout";
import SignOutButton from "@/components/SignOutButton";
import AppearanceRow from "@/components/AppearanceRow";
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

const chevron = (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="settings-row-chevron">
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
      <div className="settings-header sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Back to profile"
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full transition-colors"
          style={{ color: "var(--settings-header-text)" }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="settings-header-title">Settings</span>
      </div>

      <div className="settings-page px-4 py-5 flex flex-col gap-4 pb-32">

        {/* Account identity */}
        <div className="settings-card">
          <div className="flex items-center gap-3.5 px-4 py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                 style={{ background: "var(--btn-primary-bg)" }}>
              <span className="text-base font-bold" style={{ color: "var(--btn-primary-text)" }}>
                {(displayName[0] ?? "?").toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="settings-identity-name truncate">{displayName}</p>
              <p className="settings-identity-handle mt-0.5">@{username}</p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <AppearanceRow />
        </div>

        {/* Settings sections */}
        {SETTINGS_SECTIONS.map((section, si) => (
          <div key={si} className="settings-card">
            {section.items.map(({ label, href, icon }) => (
              <Link key={label} href={href} className="settings-row">
                <span className="settings-row-icon">{icon}</span>
                <span className="settings-row-text flex-1">{label}</span>
                {chevron}
              </Link>
            ))}
          </div>
        ))}

        {/* Danger zone */}
        <div className="settings-card">
          <a
            href="mailto:support@fytd.org?subject=Account Deletion Request"
            className="settings-row"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="shrink-0" style={{ color: "var(--page-text-danger)" }}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            <span className="flex-1" style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--page-text-danger)" }}>
              Delete Account
            </span>
            {chevron}
          </a>
        </div>

        <SignOutButton />

        <p className="text-center text-[10px] pb-2 settings-version-text">
          FYTD v0.4 · Find Your &apos;Fit Daily · Private Beta
        </p>
      </div>
    </Layout>
  );
}
