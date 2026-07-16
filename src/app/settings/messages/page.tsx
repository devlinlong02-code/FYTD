"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getMessageSettings, updateMessageSettings } from "@/app/actions/messages";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-label="Toggle"
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 999,
        background: checked ? "var(--btn-primary-bg)" : "var(--page-surface)",
        border: "0.5px solid var(--page-border)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 200ms ease",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: checked ? "calc(100% - 22px)" : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: checked ? "var(--btn-primary-text)" : "white",
        transition: "left 200ms ease",
      }} />
    </button>
  );
}

export default function MessageSettingsPage() {
  const [readReceipts, setReadReceipts] = useState(true);
  const [allowRequests, setAllowRequests] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMessageSettings().then((s) => {
      setReadReceipts(s.read_receipts_enabled);
      setAllowRequests(s.allow_message_requests);
      setLoading(false);
    });
  }, []);

  async function save(patch: Parameters<typeof updateMessageSettings>[0]) {
    setSaving(true);
    await updateMessageSettings(patch);
    setSaving(false);
  }

  return (
    <Layout>
      <div className="settings-header sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <Link href="/settings" className="flex items-center justify-center w-8 h-8 rounded-full" aria-label="Back" style={{ color: "var(--page-text-primary)" }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="settings-header-title">Messages</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--page-border)", borderTopColor: "var(--page-text-primary)" }} />
        </div>
      ) : (
        <div className="settings-page px-4 py-5 pb-32">
          <div className="settings-card">
            <div className="settings-toggle-row">
              <div className="flex-1 min-w-0">
                <p className="settings-row-label">Read receipts</p>
                <p className="settings-row-description">Let others know when you&apos;ve read their messages</p>
              </div>
              <Toggle checked={readReceipts} disabled={saving} onChange={() => { setReadReceipts((v) => !v); save({ read_receipts_enabled: !readReceipts }); }} />
            </div>
            <div className="settings-toggle-row">
              <div className="flex-1 min-w-0">
                <p className="settings-row-label">Message requests</p>
                <p className="settings-row-description">Allow people you don&apos;t follow to message you</p>
              </div>
              <Toggle checked={allowRequests} disabled={saving} onChange={() => { setAllowRequests((v) => !v); save({ allow_message_requests: !allowRequests }); }} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
