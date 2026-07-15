import Link from "next/link";
import Avatar from "@/components/Avatar";
import Layout from "@/components/Layout";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggleRow from "@/components/ThemeToggleRow";
import { getProfile, getSession } from "@/lib/dal";

const SETTINGS_ITEMS = [
  {
    label: "Notifications",
    href: "/account/notifications",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Privacy",
    href: "/account/privacy",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
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
];

const QUICK_LINKS = [
  {
    label: "View Profile",
    href: "/profile",
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  },
];

const chevron = (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="settings-row-chevron">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export default async function AccountPage() {
  const [profile, user] = await Promise.all([
    getProfile(),
    getSession(),
  ]);

  if (!user) {
    return (
      <Layout>
        <div className="settings-header sticky top-0 z-30 px-4 py-3">
          <span className="settings-header-title">Account</span>
        </div>
        <div className="settings-page flex flex-col items-center justify-center py-32 px-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "var(--page-surface)" }}>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" style={{ color: "var(--page-icon)" }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--page-text-primary)" }}>Sign in to your account</h2>
          <p className="text-sm mb-8" style={{ color: "var(--page-text-muted)" }}>Manage your profile, outfits, and settings.</p>
          <Link
            href="/auth/login?next=/account"
            className="w-full max-w-xs py-3 rounded-2xl text-sm font-semibold text-center"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
          >
            Sign In
          </Link>
          <Link href="/auth/signup" className="mt-3 text-sm font-medium" style={{ color: "var(--page-text-muted)" }}>
            Create an account
          </Link>
        </div>
      </Layout>
    );
  }

  const displayName = profile?.display_name ?? "User";
  const username = profile?.username ?? "user";

  return (
    <Layout>
      {/* Header */}
      <div className="settings-header sticky top-0 z-30 px-4 py-3">
        <span className="settings-header-title">Account</span>
      </div>

      <div className="settings-page px-4 py-5 flex flex-col gap-4">

        {/* Identity row */}
        <div className="settings-card">
          <div className="flex items-center gap-3.5 px-4 py-4">
            <Avatar
              avatarUrl={profile?.avatar_url}
              displayName={displayName}
              size={52}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="settings-identity-name truncate">{displayName}</p>
              <p className="settings-identity-handle mt-0.5">@{username}</p>
            </div>
            <Link
              href="/account/edit"
              className="shrink-0 text-xs font-semibold"
              style={{ color: "var(--settings-row-subtext)" }}
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Quick links */}
        <div className="settings-card">
          {QUICK_LINKS.map(({ label, href, icon }) => (
            <Link key={label} href={href} className="settings-row">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="settings-row-icon">{icon}</svg>
              <span className="settings-row-text flex-1">{label}</span>
              {chevron}
            </Link>
          ))}
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <ThemeToggleRow />
        </div>

        {/* Settings */}
        <div className="settings-card">
          {SETTINGS_ITEMS.map(({ label, href, icon }) => (
            <Link key={label} href={href} className="settings-row">
              <span className="settings-row-icon">{icon}</span>
              <span className="settings-row-text flex-1">{label}</span>
              {chevron}
            </Link>
          ))}
        </div>

        {/* Beta feedback */}
        <div className="settings-card">
          <a href="mailto:feedback@fytd.org?subject=FYTD Beta Feedback" className="settings-row">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="settings-row-icon">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="settings-row-text flex-1">Give Feedback</span>
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
