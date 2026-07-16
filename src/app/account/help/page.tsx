"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import { useState } from "react";

const FAQ_ITEMS = [
  { q: "How do I post an outfit?", a: "Tap the + button in the bottom nav bar. Upload a photo or video of your outfit, add a title and optional caption, then tap Post Outfit. You can also add individual clothing pieces to help people shop the fit." },
  { q: "How do I add a fit breakdown?", a: "On the Post Outfit screen, scroll down to Fit Breakdown. Tap any category button (Top, Bottom, Shoes, etc.) to add a piece. For each piece you can add the name, brand, price, a photo, and a shop link." },
  { q: "How do I save outfits?", a: "Tap the bookmark icon on any outfit card or at the top-right of an outfit detail page. Saved outfits appear in your Profile under Saved." },
  { q: "How do I edit my profile?", a: "Go to the Profile tab and tap Edit Profile. You can update your display name, username, bio, profile photo, style tags, and social links." },
  { q: "How do shopping links work?", a: "When adding a piece to a fit breakdown, paste a shop link for that item. Exact match links point to the specific item; Similar style links point to something close in style. Shoppers see a Shop button on each piece in the breakdown." },
  { q: "Why is my upload failing?", a: "Make sure you are signed in and your file is a JPG, PNG, or WEBP image under 10MB (or a video under 100MB). If the problem continues, tap Give Feedback from the Account page to report it." },
  { q: "Can I delete or edit a posted outfit?", a: "Yes. Go to your Profile and tap the Posts tab to see all your posts. From there you can edit details or delete an outfit." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "0.5px solid var(--settings-row-divider)" }} className="last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-medium" style={{ color: "var(--settings-row-text)" }}>{q}</span>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--settings-row-icon)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <p className="text-sm leading-relaxed px-4 pb-4" style={{ color: "var(--settings-row-subtext)" }}>{a}</p>
      )}
    </div>
  );
}

const chevron = (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: "var(--settings-row-icon)", flexShrink: 0 }}>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function HelpPage() {
  return (
    <Layout>
      <div className="settings-header sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <Link href="/account" className="flex items-center justify-center w-8 h-8 rounded-full" aria-label="Back" style={{ color: "var(--page-text-primary)" }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="settings-header-title">Help &amp; Support</span>
      </div>

      <div className="settings-page px-4 py-6 flex flex-col gap-6 pb-32">
        <section>
          <span className="settings-section-label">Frequently Asked Questions</span>
          <div className="settings-card">
            {FAQ_ITEMS.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </section>

        <section>
          <span className="settings-section-label">Contact</span>
          <div className="settings-card">
            <a href="mailto:support@fytd.org?subject=FYTD Support" className="settings-row" style={{ textDecoration: "none" }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="settings-row-icon shrink-0">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <div className="flex-1">
                <p className="settings-row-label">Email Support</p>
                <p className="settings-row-description">support@fytd.org</p>
              </div>
              {chevron}
            </a>
            <a href="mailto:support@fytd.org?subject=FYTD Beta Feedback" className="settings-row" style={{ textDecoration: "none" }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="settings-row-icon shrink-0">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div className="flex-1">
                <p className="settings-row-label">Report a Problem</p>
                <p className="settings-row-description">Tell us about any bugs or issues.</p>
              </div>
              {chevron}
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
}
