"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import { useState } from "react";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 999,
        background: checked && !disabled ? "var(--btn-primary-bg)" : "var(--page-surface)",
        border: "0.5px solid var(--page-border)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 200ms ease",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: checked ? "calc(100% - 22px)" : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: checked && !disabled ? "var(--btn-primary-text)" : "white",
        transition: "left 200ms ease",
      }} />
    </button>
  );
}

function ToggleRow({ label, description, enabled, onChange, disabled }: { label: string; description?: string; enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="settings-toggle-row">
      <div className="flex-1 min-w-0">
        <p className="settings-row-label">{label}</p>
        {description && <p className="settings-row-description">{description}</p>}
      </div>
      <Toggle checked={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function NotificationsPage() {
  const [likes, setLikes] = useState(true);
  const [saves, setSaves] = useState(true);
  const [followers, setFollowers] = useState(true);
  const [activity, setActivity] = useState(true);
  const [updates, setUpdates] = useState(true);

  return (
    <Layout>
      <div className="settings-header sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <Link href="/account" className="flex items-center justify-center w-8 h-8 rounded-full" aria-label="Back" style={{ color: "var(--page-text-primary)" }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="settings-header-title">Notifications</span>
      </div>

      <div className="settings-page px-4 py-6 flex flex-col gap-6 pb-32">
        <div style={{ background: "rgba(245,158,11,0.1)", border: "0.5px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "12px 16px" }}>
          <p className="text-xs font-medium" style={{ color: "rgb(217,119,6)" }}>
            Push and email notifications are coming soon. Your preferences will be saved when delivery is enabled.
          </p>
        </div>

        <section>
          <span className="settings-section-label">Social</span>
          <div className="settings-card">
            <ToggleRow label="Likes &amp; saves" description="When someone saves your outfit." enabled={likes} onChange={setLikes} disabled />
            <ToggleRow label="New followers" description="When someone follows you." enabled={followers} onChange={setFollowers} disabled />
          </div>
        </section>

        <section>
          <span className="settings-section-label">Activity</span>
          <div className="settings-card">
            <ToggleRow label="Outfit activity" description="Comments and reactions on your fits." enabled={activity} onChange={setActivity} disabled />
            <ToggleRow label="Save notifications" description="When others save your outfits." enabled={saves} onChange={setSaves} disabled />
          </div>
        </section>

        <section>
          <span className="settings-section-label">FYTD</span>
          <div className="settings-card">
            <ToggleRow label="FYTD updates" description="New features, announcements, and tips." enabled={updates} onChange={setUpdates} disabled />
          </div>
        </section>
      </div>
    </Layout>
  );
}
