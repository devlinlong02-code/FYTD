import Link from "next/link";
import Layout from "@/components/Layout";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-toggle-row">
      <p className="settings-row-label">{label}</p>
      <p className="settings-row-description">{value}</p>
    </div>
  );
}

const chevron = (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: "var(--settings-row-icon)", flexShrink: 0 }}>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function AboutPage() {
  return (
    <Layout>
      <div className="settings-header sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <Link href="/account" className="flex items-center justify-center w-8 h-8 rounded-full" aria-label="Back" style={{ color: "var(--page-text-primary)" }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="settings-header-title">About FYTD</span>
      </div>

      <div className="settings-page px-4 py-6 flex flex-col gap-6 pb-32">

        {/* Logo / identity */}
        <div className="flex flex-col items-center pt-4 pb-2 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--btn-primary-bg)" }}>
            <span className="font-black text-xl tracking-tighter" style={{ color: "var(--btn-primary-text)" }}>FYTD</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg" style={{ color: "var(--page-text-primary)" }}>Find Your &apos;Fit Daily</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--page-text-muted)" }}>Version 0.4 · Private Beta</p>
          </div>
        </div>

        {/* Mission */}
        <section>
          <span className="settings-section-label">What is FYTD?</span>
          <div className="settings-card" style={{ padding: "14px 16px" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--settings-row-subtext)", marginBottom: 12 }}>
              FYTD is a fashion discovery platform built to help people find outfit inspiration, break down every piece in a fit, and shop exact or similar items faster.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--settings-row-subtext)" }}>
              Creators post outfits with a full fit breakdown — brand, price, and shop link for every piece. Followers can save looks, explore aesthetics, and shop the exact items or find similar styles.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section>
          <span className="settings-section-label">How Fit Breakdowns Work</span>
          <div className="settings-card" style={{ padding: "14px 16px" }}>
            {[
              { step: "1", text: "Creator posts a photo or video of their outfit." },
              { step: "2", text: "Creator adds each clothing piece: name, brand, price, and shop link." },
              { step: "3", text: "Followers browse the fit and tap Shop Exact or Shop Similar on any piece." },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3 mb-3 last:mb-0">
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}>
                  {step}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "var(--settings-row-subtext)" }}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* App info */}
        <section>
          <span className="settings-section-label">App Info</span>
          <div className="settings-card">
            <InfoRow label="Version" value="0.4.0 (Beta)" />
            <InfoRow label="Platform" value="Web · iOS · Android" />
            <InfoRow label="Stage" value="Private Beta" />
          </div>
        </section>

        {/* Legal */}
        <section>
          <span className="settings-section-label">Legal</span>
          <div className="settings-card">
            <Link href="/terms" className="settings-row" style={{ textDecoration: "none" }}>
              <span className="settings-row-text flex-1">Terms of Service</span>
              {chevron}
            </Link>
            <Link href="/privacy" className="settings-row" style={{ textDecoration: "none" }}>
              <span className="settings-row-text flex-1">Privacy Policy</span>
              {chevron}
            </Link>
          </div>
        </section>

        <p className="text-center text-[10px] pb-2 settings-version-text">
          Made with ♥ · FYTD Private Beta
        </p>
      </div>
    </Layout>
  );
}
