"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "How do I post an outfit?",
    a: "Tap the + button in the bottom nav bar. Upload a photo or video of your outfit, add a title and optional caption, then tap Post Outfit. You can also add individual clothing pieces to help people shop the fit.",
  },
  {
    q: "How do I add a fit breakdown?",
    a: "On the Post Outfit screen, scroll down to Fit Breakdown. Tap any category button (Top, Bottom, Shoes, etc.) to add a piece. For each piece you can add the name, brand, price, a photo, and a shop link.",
  },
  {
    q: "How do I save outfits?",
    a: "Tap the bookmark icon on any outfit card or at the top-right of an outfit detail page. Saved outfits appear in your Profile under Saved.",
  },
  {
    q: "How do I edit my profile?",
    a: "Go to the Profile tab and tap Edit Profile. You can update your display name, username, bio, profile photo, style tags, and social links.",
  },
  {
    q: "How do shopping links work?",
    a: "When adding a piece to a fit breakdown, paste a shop link for that item. Exact match links point to the specific item; Similar style links point to something close in style. Shoppers see a Shop button on each piece in the breakdown.",
  },
  {
    q: "Why is my upload failing?",
    a: "Make sure you are signed in and your file is a JPG, PNG, or WEBP image under 10MB (or a video under 50MB). If the problem continues, tap Give Feedback from the Account page to report it.",
  },
  {
    q: "Can I delete or edit a posted outfit?",
    a: "Yes. Go to Account → My Outfits to see all your posts. From there you can edit details or delete an outfit.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-50 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-medium text-neutral-800">{q}</span>
        <svg
          width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          className={`text-neutral-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <p className="text-sm text-neutral-500 leading-relaxed px-4 pb-4">{a}</p>
      )}
    </div>
  );
}

export default function HelpPage() {
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
        <span className="font-bold text-xl tracking-tight text-neutral-900">Help & Support</span>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6">

        {/* FAQ */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">Frequently Asked Questions</h2>
          <div className="bg-white rounded-2xl border border-neutral-100">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">Contact</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            <a
              href="mailto:devlinlong02@gmail.com?subject=FYTD Support"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400 shrink-0">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-800">Email Support</p>
                <p className="text-xs text-neutral-400">devlinlong02@gmail.com</p>
              </div>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300 shrink-0">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <a
              href="mailto:devlinlong02@gmail.com?subject=FYTD Beta Feedback"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400 shrink-0">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-800">Report a Problem</p>
                <p className="text-xs text-neutral-400">Tell us about any bugs or issues.</p>
              </div>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300 shrink-0">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
}
