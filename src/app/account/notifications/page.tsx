"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import { useState } from "react";

interface ToggleRowProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, enabled, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 gap-4">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${disabled ? "text-neutral-400" : "text-neutral-800"}`}>{label}</p>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
        } ${enabled && !disabled ? "bg-neutral-900" : "bg-neutral-200"}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const [likes,      setLikes]      = useState(true);
  const [saves,      setSaves]      = useState(true);
  const [followers,  setFollowers]  = useState(true);
  const [activity,   setActivity]   = useState(true);
  const [updates,    setUpdates]    = useState(true);

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
        <span className="font-bold text-xl tracking-tight text-neutral-900">Notifications</span>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6">

        <div className="bg-amber-50 rounded-2xl px-4 py-3 text-xs font-medium text-amber-700">
          Push and email notifications are coming soon. Your preferences will be saved when delivery is enabled.
        </div>

        {/* Social */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">Social</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            <ToggleRow label="Likes & saves" description="When someone saves your outfit." enabled={likes} onChange={setLikes} disabled />
            <ToggleRow label="New followers" description="When someone follows you." enabled={followers} onChange={setFollowers} disabled />
          </div>
        </section>

        {/* Activity */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">Activity</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            <ToggleRow label="Outfit activity" description="Comments and reactions on your fits." enabled={activity} onChange={setActivity} disabled />
            <ToggleRow label="Save notifications" description="When others save your outfits." enabled={saves} onChange={setSaves} disabled />
          </div>
        </section>

        {/* FYTD */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">FYTD</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            <ToggleRow label="FYTD updates" description="New features, announcements, and tips." enabled={updates} onChange={setUpdates} disabled />
          </div>
        </section>
      </div>
    </Layout>
  );
}
