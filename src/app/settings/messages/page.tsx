"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getMessageSettings, updateMessageSettings } from "@/app/actions/messages";

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

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      disabled={saving || loading}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-neutral-900" : "bg-neutral-200"}`}
      aria-label="Toggle"
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/settings"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          aria-label="Back"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="font-bold text-xl tracking-tight text-neutral-900">Messages</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-5 flex flex-col gap-3 pb-32">
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            {/* Read receipts */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-neutral-900">Read receipts</p>
                <p className="text-xs text-neutral-400 mt-0.5">Let others know when you&apos;ve read their messages</p>
              </div>
              <Toggle
                checked={readReceipts}
                onChange={() => {
                  setReadReceipts((v) => !v);
                  save({ read_receipts_enabled: !readReceipts });
                }}
              />
            </div>
            {/* Message requests */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-neutral-900">Message requests</p>
                <p className="text-xs text-neutral-400 mt-0.5">Allow people you don&apos;t follow to message you</p>
              </div>
              <Toggle
                checked={allowRequests}
                onChange={() => {
                  setAllowRequests((v) => !v);
                  save({ allow_message_requests: !allowRequests });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
