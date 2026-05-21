import Link from "next/link";
import Avatar from "@/components/Avatar";
import Layout from "@/components/Layout";
import OutfitCard from "@/components/OutfitCard";
import SignOutButton from "@/components/SignOutButton";
import { getProfile, getSession } from "@/lib/dal";
import { getOutfits, getCreatorOutfits } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";

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

export default async function AccountPage() {
  const [profile, user, savedIds, allOutfits, postedOutfits] = await Promise.all([
    getProfile(),
    getSession(),
    getSavedOutfitIds(),
    getOutfits(),
    getCreatorOutfits(),
  ]);

  const displayName = profile?.display_name ?? user?.email ?? "User";
  const username = profile?.username ?? user?.email?.split("@")[0] ?? "user";
  const bio = profile?.bio ?? "";
  const location = profile?.location ?? "";

  const savedOutfits = allOutfits.filter((o) => savedIds.includes(o.id));

  const isAuthenticated = !!user;

  if (!user) {
    return (
      <Layout>
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
          <span className="font-bold text-xl tracking-tight text-neutral-900">Account</span>
        </div>
        <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Sign in to your account</h2>
          <p className="text-sm text-neutral-400 mb-8">Manage your profile, outfits, and settings.</p>
          <Link
            href="/auth/login?next=/account"
            className="w-full max-w-xs py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold text-center hover:bg-neutral-700 transition-colors"
          >
            Sign In
          </Link>
          <Link href="/auth/signup" className="mt-3 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            Create an account
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <span className="font-bold text-xl tracking-tight text-neutral-900">Account</span>
      </div>

      <div className="px-4 py-5 flex flex-col gap-6">

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
          {[
            { label: "My Outfits", href: "/admin/outfits", icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></> },
            { label: "Analytics", href: "/analytics", icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> },
          ].map(({ label, href, icon }) => (
            <Link key={label} href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400 shrink-0">{icon}</svg>
              <span className="text-sm font-medium text-neutral-700 flex-1">{label}</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300 shrink-0">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Profile info preview */}
        <div>
          <h2 className="text-sm font-bold text-neutral-900 mb-3">Profile</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            {/* Avatar + name row */}
            <div className="flex items-center gap-3.5 px-4 py-4 border-b border-neutral-50">
              <Avatar
                avatarUrl={profile?.avatar_url}
                displayName={displayName}
                size={56}
                className="ring-2 ring-neutral-100"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
                <p className="text-xs text-neutral-400">@{username}</p>
              </div>
            </div>
            {/* Bio + location */}
            {[
              { label: "Bio", value: bio || "—" },
              { label: "Location", value: location || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-neutral-50 last:border-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 w-20 shrink-0">{label}</p>
                <p className="text-sm text-neutral-700 flex-1 truncate text-right">{value}</p>
              </div>
            ))}
          </div>
          <Link href="/account/edit" className="block text-center text-xs font-semibold text-neutral-500 hover:text-neutral-900 mt-2 transition-colors">
            Edit Profile →
          </Link>
        </div>

        {/* Saved outfits */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold text-neutral-900">Saved Outfits</h2>
            <Link href="/saved" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
              See all →
            </Link>
          </div>

          {savedOutfits.length === 0 ? (
            <div className="bg-neutral-50 rounded-2xl px-4 py-8 text-center">
              <p className="text-neutral-400 text-sm">No saved outfits yet.</p>
              <Link href="/" className="mt-2 inline-block text-sm font-semibold text-neutral-900 underline underline-offset-2">
                Browse the feed
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {savedOutfits.slice(0, 4).map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  savedIds={savedIds}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>

        {/* My outfits */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold text-neutral-900">My Outfits</h2>
            <Link href="/profile" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
              See all →
            </Link>
          </div>

          {postedOutfits.length === 0 ? (
            <div className="bg-neutral-50 rounded-2xl px-4 py-8 text-center">
              <p className="text-neutral-400 text-sm">No outfits posted yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {postedOutfits.slice(0, 2).map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  savedIds={savedIds}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div>
          <h2 className="text-sm font-bold text-neutral-900 mb-3">Settings</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            {SETTINGS_ITEMS.map(({ label, href, icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors"
              >
                <span className="text-neutral-400 shrink-0">{icon}</span>
                <span className="text-sm font-medium text-neutral-700 flex-1">{label}</span>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300 shrink-0">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Beta feedback */}
        <a
          href="mailto:devlinlong02@gmail.com?subject=FYTD Beta Feedback"
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-colors"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400 shrink-0">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-medium text-neutral-700 flex-1">Give Feedback</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300 shrink-0">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </a>

        <SignOutButton />

        <p className="text-center text-[10px] text-neutral-300 pb-2">
          FYTD v0.4 · Find Your &apos;Fit Daily · Private Beta
        </p>
      </div>
    </Layout>
  );
}
