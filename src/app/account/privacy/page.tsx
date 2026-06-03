import Link from "next/link";
import Layout from "@/components/Layout";

function Row({ label, description, badge }: { label: string; description?: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      {badge && (
        <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full shrink-0">
          {badge}
        </span>
      )}
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/account"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors shrink-0"
          aria-label="Back"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="font-bold text-xl tracking-tight text-neutral-900">Privacy</span>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6">

        {/* Profile visibility */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">Profile</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            <Row
              label="Profile visibility"
              description="Your profile and outfits are visible to everyone."
              badge="Public"
            />
            <Row
              label="Private profile"
              description="Restrict your profile to approved followers only."
              badge="Coming soon"
            />
            <Row
              label="Show saved outfits"
              description="Allow others to see your saved fits."
              badge="Coming soon"
            />
          </div>
        </section>

        {/* Discoverability */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">Discoverability</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            <Row
              label="Appear in search"
              description="Your profile and outfits can appear in search results."
              badge="On"
            />
            <Row
              label="Blocked accounts"
              description="Manage accounts you have blocked."
              badge="Coming soon"
            />
          </div>
        </section>

        {/* Data */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">Your Data</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            <Row
              label="Request account data"
              description="Download a copy of your FYTD data."
              badge="Coming soon"
            />
            <Row
              label="Delete account"
              description="Email support@fytd.org to request account deletion. We'll remove your data within 30 days."
              badge="By request"
            />
          </div>
        </section>

        <p className="text-center text-[10px] text-neutral-300 pb-2">
          FYTD takes your privacy seriously. Full privacy controls coming in a future update.
        </p>
      </div>
    </Layout>
  );
}
