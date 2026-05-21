import Link from "next/link";
import Layout from "@/components/Layout";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-50 last:border-0">
      <p className="text-sm font-medium text-neutral-700">{label}</p>
      <p className="text-sm text-neutral-400">{value}</p>
    </div>
  );
}

function PlaceholderRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-50 last:border-0">
      <p className="text-sm font-medium text-neutral-700">{label}</p>
      <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
        Coming soon
      </span>
    </div>
  );
}

export default function AboutPage() {
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
        <span className="font-bold text-xl tracking-tight text-neutral-900">About FYTD</span>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6">

        {/* Logo / identity */}
        <div className="flex flex-col items-center pt-4 pb-2 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl tracking-tighter">FYTD</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-neutral-900">Find Your &apos;Fit Daily</p>
            <p className="text-xs text-neutral-400 mt-0.5">Version 0.4 · Private Beta</p>
          </div>
        </div>

        {/* Mission */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">What is FYTD?</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 px-4 py-4">
            <p className="text-sm text-neutral-600 leading-relaxed">
              FYTD is a fashion discovery platform built to help people find outfit inspiration, break down every piece in a fit, and shop exact or similar items faster.
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed mt-3">
              Creators post outfits with a full fit breakdown — brand, price, and shop link for every piece. Followers can save looks, explore aesthetics, and shop the exact items or find similar styles.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">How Fit Breakdowns Work</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 px-4 py-4 flex flex-col gap-3">
            {[
              { step: "1", text: "Creator posts a photo or video of their outfit." },
              { step: "2", text: "Creator adds each clothing piece: name, brand, price, and shop link." },
              { step: "3", text: "Followers browse the fit and tap Shop Exact or Shop Similar on any piece." },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </span>
                <p className="text-sm text-neutral-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* App info */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">App Info</h2>
          <div className="bg-white rounded-2xl border border-neutral-100">
            <InfoRow label="Version" value="0.4.0 (Beta)" />
            <InfoRow label="Platform" value="Web · iOS · Android" />
            <InfoRow label="Stage" value="Private Beta" />
          </div>
        </section>

        {/* Legal */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">Legal</h2>
          <div className="bg-white rounded-2xl border border-neutral-100">
            <PlaceholderRow label="Terms of Service" />
            <PlaceholderRow label="Privacy Policy" />
            <PlaceholderRow label="Cookie Policy" />
          </div>
        </section>

        <p className="text-center text-[10px] text-neutral-300 pb-2">
          Made with ♥ · FYTD Private Beta
        </p>
      </div>
    </Layout>
  );
}
