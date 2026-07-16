import Link from "next/link";
import Layout from "@/components/Layout";

function Row({ label, description, badge }: { label: string; description?: string; badge?: string }) {
  return (
    <div className="settings-toggle-row items-start">
      <div className="flex-1 min-w-0 pr-3">
        <p className="settings-row-label">{label}</p>
        {description && <p className="settings-row-description">{description}</p>}
      </div>
      {badge && (
        <span className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-full" style={{ color: "var(--page-text-muted)", background: "var(--page-surface)" }}>
          {badge}
        </span>
      )}
    </div>
  );
}

export default function PrivacySettingsPage() {
  return (
    <Layout>
      <div className="settings-header sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <Link href="/account" className="flex items-center justify-center w-8 h-8 rounded-full" aria-label="Back" style={{ color: "var(--page-text-primary)" }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="settings-header-title">Privacy</span>
      </div>

      <div className="settings-page px-4 py-6 flex flex-col gap-6 pb-32">
        <section>
          <span className="settings-section-label">Profile</span>
          <div className="settings-card">
            <Row label="Profile visibility" description="Your profile and outfits are visible to everyone." badge="Public" />
            <Row label="Private profile" description="Restrict your profile to approved followers only." badge="Coming soon" />
            <Row label="Show saved outfits" description="Allow others to see your saved fits." badge="Coming soon" />
          </div>
        </section>

        <section>
          <span className="settings-section-label">Discoverability</span>
          <div className="settings-card">
            <Row label="Appear in search" description="Your profile and outfits can appear in search results." badge="On" />
            <Row label="Blocked accounts" description="Manage accounts you have blocked." badge="Coming soon" />
          </div>
        </section>

        <section>
          <span className="settings-section-label">Your Data</span>
          <div className="settings-card">
            <Row label="Request account data" description="Download a copy of your FYTD data." badge="Coming soon" />
            <Row label="Delete account" description="Email support@fytd.org to request account deletion. We'll remove your data within 30 days." badge="By request" />
          </div>
        </section>

        <p className="text-center text-[10px] pb-2 settings-version-text">
          FYTD takes your privacy seriously. Full privacy controls coming in a future update.
        </p>
      </div>
    </Layout>
  );
}
