"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  const h2Style: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--page-text-primary)", letterSpacing: "-0.02em", margin: "36px 0 12px", paddingTop: 24, borderTop: "0.5px solid var(--page-border)" };
  const h3Style: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--page-text-primary)", margin: "20px 0 8px", letterSpacing: "0.01em" };
  const pStyle: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: 14, color: "var(--page-text-secondary)", lineHeight: 1.7, margin: "0 0 14px" };
  const liStyle: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: 14, color: "var(--page-text-secondary)", lineHeight: 1.7, marginBottom: 6 };
  const ulStyle: React.CSSProperties = { margin: "8px 0 16px", paddingLeft: 20 };
  const strongStyle: React.CSSProperties = { color: "var(--page-text-primary)", fontWeight: 600 };

  return (
    <div style={{ background: "var(--page-bg)", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--page-bg)", borderBottom: "0.5px solid var(--page-border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: "var(--page-text-primary)" }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, color: "var(--page-text-primary)", margin: 0 }}>
          Terms of Service
        </h1>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}>

        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--page-text-muted)", letterSpacing: "0.06em", marginBottom: 32 }}>
          Effective Date: July 15, 2025 · Last Updated: July 15, 2025
        </p>

        {/* 1 */}
        <h2 style={{ ...h2Style, margin: "0 0 12px", paddingTop: 0, borderTop: "none" }}>1. Acceptance of Terms</h2>
        <p style={pStyle}>These Terms govern your use of FYTD at fytd.org. By creating an account you agree to be bound by these Terms. Operated by Devlin, Washington State.</p>

        {/* 2 */}
        <h2 style={h2Style}>2. Eligibility</h2>
        <ul style={ulStyle}>
          <li style={liStyle}>Must be 13 or older.</li>
          <li style={liStyle}>Users under 18 need parental review and agreement.</li>
          <li style={liStyle}>Cannot use FYTD if previously banned or legally prohibited.</li>
        </ul>

        {/* 3 */}
        <h2 style={h2Style}>3. Your Account</h2>
        <p style={pStyle}>Provide accurate information. Keep password confidential. Do not share credentials. Notify us of unauthorized access. You are responsible for all activity under your account.</p>
        <p style={pStyle}><strong style={strongStyle}>Username rules:</strong> no impersonation, no offensive usernames, no trademark infringement. We may reclaim usernames that violate Terms.</p>

        {/* 4 */}
        <h2 style={h2Style}>4. Content and Conduct</h2>
        <p style={pStyle}>You retain ownership of Your Content. By posting you grant FYTD a non-exclusive, royalty-free, worldwide license to display and distribute Your Content to operate and promote the Platform.</p>

        <h3 style={h3Style}>Content must NOT include:</h3>
        <p style={pStyle}><strong style={strongStyle}>Illegal content:</strong> no copyright infringement, no illegal activity promotion.</p>
        <p style={pStyle}><strong style={strongStyle}>Harmful content:</strong> no nudity or sexual content, no graphic violence, no self-harm promotion, no content sexualizing minors — zero tolerance, immediate permanent termination and law enforcement reporting.</p>
        <p style={pStyle}><strong style={strongStyle}>Harassing content:</strong> no bullying, threats, or harassment; no hate speech based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin; no doxxing.</p>
        <p style={pStyle}><strong style={strongStyle}>Deceptive content:</strong> no impersonation, no misinformation, no falsified breakdown data.</p>
        <p style={pStyle}><strong style={strongStyle}>Spam:</strong> no repetitive unsolicited content, no bots or inauthentic engagement.</p>

        <h3 style={h3Style}>Fit Breakdown Accuracy</h3>
        <p style={pStyle}>Breakdown information including prices, brands, and links must be accurate to the best of your knowledge. Deliberately falsifying breakdown data may result in account action.</p>

        <h3 style={h3Style}>Prohibited Conduct</h3>
        <ul style={ulStyle}>
          {["No hacking", "No scraping", "No automated tools", "No reverse engineering", "No security circumvention"].map((i) => (
            <li key={i} style={liStyle}>{i}</li>
          ))}
        </ul>

        {/* 5 */}
        <h2 style={h2Style}>5. Intellectual Property</h2>
        <p style={pStyle}>FYTD&apos;s design, code, logos, and branding are owned by FYTD. Copyright infringement notices to <a href="mailto:legal@fytd.org" style={{ color: "var(--page-text-primary)", textDecoration: "underline", textUnderlineOffset: 3 }}>legal@fytd.org</a>.</p>

        {/* 6 */}
        <h2 style={h2Style}>6. Privacy</h2>
        <p style={pStyle}>Governed by our <a href="/privacy" style={{ color: "var(--page-text-primary)", textDecoration: "underline", textUnderlineOffset: 3 }}>Privacy Policy</a> at fytd.org/privacy.</p>

        {/* 7 */}
        <h2 style={h2Style}>7. AI Features</h2>
        <p style={pStyle}>AI identification is not always accurate. Review and correct AI-generated breakdown information before posting. You are responsible for accuracy.</p>

        {/* 8 */}
        <h2 style={h2Style}>8. Messaging</h2>
        <p style={pStyle}>No spam, harassment, illegal content, or deceptive solicitation in messages. Messages are private.</p>

        {/* 9 */}
        <h2 style={h2Style}>9. Reporting and Enforcement</h2>
        <p style={pStyle}>Report violations through in-app tools.</p>
        <p style={pStyle}><strong style={strongStyle}>Enforcement actions:</strong> content removal, warning, temporary suspension, permanent termination, law enforcement reporting for illegal activity.</p>
        <p style={pStyle}><strong style={strongStyle}>Zero tolerance:</strong> CSAM results in immediate permanent termination and law enforcement reporting.</p>
        <p style={pStyle}><strong style={strongStyle}>Appeals:</strong> contact <a href="mailto:legal@fytd.org" style={{ color: "var(--page-text-primary)", textDecoration: "underline", textUnderlineOffset: 3 }}>legal@fytd.org</a> with your username and description.</p>

        {/* 10 */}
        <h2 style={h2Style}>10. Third-Party Links</h2>
        <p style={pStyle}>Not responsible for third-party retailer content or practices.</p>

        {/* 11 */}
        <h2 style={h2Style}>11. Disclaimers</h2>
        <p style={pStyle}>Platform provided as-is. No guarantee of uninterrupted access. We do not verify accuracy of user-submitted breakdown data. Always verify prices and availability with retailers directly. Disclaimer of warranties to maximum extent permitted by law.</p>

        {/* 12 */}
        <h2 style={h2Style}>12. Limitation of Liability</h2>
        <p style={pStyle}>Not liable for indirect, incidental, or consequential damages. Maximum liability is the greater of $100 or amount paid in the prior 12 months.</p>

        {/* 13 */}
        <h2 style={h2Style}>13. Indemnification</h2>
        <p style={pStyle}>You agree to indemnify FYTD against claims arising from Your Content or your violations.</p>

        {/* 14 */}
        <h2 style={h2Style}>14. Governing Law</h2>
        <p style={pStyle}>Washington State law governs. Disputes resolved by binding arbitration in Washington State. Class action waiver applies.</p>

        {/* 15 */}
        <h2 style={h2Style}>15. Termination</h2>
        <p style={pStyle}>You may terminate through the Settings page. We may terminate for any reason including Terms violations.</p>

        {/* 16 */}
        <h2 style={h2Style}>16. Changes to Terms</h2>
        <p style={pStyle}>Material changes notified by updated date and email.</p>

        {/* 17 */}
        <h2 style={h2Style}>17. Contact</h2>
        <ul style={ulStyle}>
          {[
            { label: "legal@fytd.org", href: "mailto:legal@fytd.org" },
            { label: "privacy@fytd.org", href: "mailto:privacy@fytd.org" },
            { label: "security@fytd.org", href: "mailto:security@fytd.org" },
          ].map(({ label, href }) => (
            <li key={label} style={liStyle}>
              <a href={href} style={{ color: "var(--page-text-primary)", textDecoration: "underline", textUnderlineOffset: 3 }}>{label}</a>
            </li>
          ))}
        </ul>
        <p style={pStyle}>fytd.org · Washington State, United States</p>
      </div>
    </div>
  );
}
