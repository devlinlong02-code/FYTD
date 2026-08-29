# FYTD — Find Your 'Fit Daily

> **The breakdown is the content.** FYTD is a fashion-native social platform where every outfit is fully documented — piece by piece, price by price — so anyone can shop the exact look they see.

🌐 **Live at [fytd.org](https://fytd.org)** · Currently in private beta

---

## What Makes FYTD Different

Every other fashion platform treats the outfit as a photo. FYTD treats it as a record.

When a creator posts on FYTD, they build a **fit breakdown** — a structured, item-by-item documentation of everything they're wearing. Each breakdown item includes the piece name, brand, category, price, a shop link, and an optional "How I Found It" story. The AI can scan a photo or scrape a product URL to auto-fill breakdown data, or creators can enter it manually.

The result: every post is a fully shoppable, fully documented outfit. No more "where is that from?" with no answer.

---

## Core Features

### Outfit Breakdown System
- Item-by-item documentation with name, brand, category, price, and shop link
- Per-item Q&A threads — anyone who owns or knows the piece can answer questions from the community
- Per-item save counts — track which individual pieces resonate most
- **Perfect Breakdown Badge** — automatically awarded when a post meets all five quality criteria: title, 3+ items, every item named and branded, every item priced, at least one shop link

### AI-Powered Creation
- Photo scanning to auto-detect and identify clothing items
- Product URL scraping to auto-fill breakdown data from shop pages
- Powered by Anthropic's Claude API

### Creator Profile & Wardrobe Intelligence
- Cumulative documented wardrobe — every post adds to a creator's closet record
- **Closet valuation** — automatically calculated and updated with every priced breakdown posted
- Style identity built through a curated 25-category tag system (Streetwear, Gorpcore, Dark Academia, Coquette, Old Money, and more)

### Full Social Layer
- Following / followers
- Likes, comments with GIF support (Giphy integration), saves
- Direct messaging
- Push notifications
- Search and discovery
- For You page and Explore page fed by style tag algorithm

### Three Creator Card Styles
Creators choose how their breakdown data is presented to match their aesthetic:
- **Editorial** — clean, magazine-style layout
- **Statement** — bold, high-impact presentation
- **Streetwear** — raw, culture-forward styling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL + Row Level Security) |
| Storage | Supabase Storage |
| Deployment | Vercel |
| AI Features | Anthropic Claude API |
| Email | Resend |
| GIF Support | Giphy API |

---

## Architecture Highlights

- **Relational content model** — posts link to breakdowns, breakdowns link to items, items link to Q&A threads and individual save records. Every layer is queryable and independently meaningful.
- **Real-time closet valuation** — aggregate pricing updates automatically as creators post new priced breakdowns, giving each profile a living financial snapshot of their wardrobe.
- **Style discovery algorithm** — the 25-category single-select tag system feeds a clean For You page and Explore discovery engine, surfacing content by aesthetic rather than recency alone.
- **Quality incentive system** — the Perfect Breakdown Badge is awarded programmatically, not manually, creating a built-in engagement mechanic that rewards thorough documentation.
- **AI integration in the creation flow** — Claude API is embedded directly into the post creation experience, reducing friction at the highest drop-off point in content creation.

---

## Platform Details

- **Status:** Private beta, pre-first creator outreach wave
- **Target users:** Fashion creators aged 13+
- **Based in:** Washington State
- **Live domain:** [fytd.org](https://fytd.org)

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/devlinlong02-code/FYTD.git
cd FYTD

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase, Anthropic, Resend, and Giphy keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_GIPHY_API_KEY=
```

---

## Built By

**Devlin Long** — Founder & Developer  
MIS + Business Analytics & AI · University of Washington Bothell  
[fytd.org](https://fytd.org) · [GitHub](https://github.com/devlinlong02-code)
