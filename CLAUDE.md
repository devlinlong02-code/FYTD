@AGENTS.md

# FYTD — Find Your 'Fit Daily

## What this app is

FYTD is a fashion discovery and shopping app. The core loop: browse outfits → open an outfit → see the full clothing breakdown → shop exact or similar items. Think TikTok scrolling meets Pinterest inspiration meets LTK shopping clarity.

## Tech stack

- **Next.js 16** (Turbopack, App Router) — read `node_modules/next/dist/docs/` before using unfamiliar APIs
- **React 19** — `cache()` for server-side memoization; avoid `useActionState` for auth forms (see below)
- **Tailwind CSS v4** — uses `@import "tailwindcss"` in globals.css, not `@tailwind` directives
- **TypeScript**
- **Supabase** — auth (email/password), PostgreSQL database, Row Level Security, Storage
- **`@supabase/ssr`** — SSR-compatible client; `cookies()` is async and must be awaited

## Project structure

```
src/
  app/
    page.tsx                      # Homepage — server component, fetches outfits + saved IDs
    explore/
      page.tsx                    # Server wrapper — fetches all outfits, passes to ExploreClient
      ExploreClient.tsx           # Client component — search/filter UI with useState
    outfit/[id]/
      page.tsx                    # Outfit detail — server component, uses getOutfitById
      OutfitSaveButton.tsx        # Async server component — fetches saved state, renders DbSaveButton
    saved/page.tsx                # Server component — shows saved outfits; login prompt if logged out
    profile/page.tsx              # Server component — real profile, posted outfits, saved section
    account/page.tsx              # Server component — profile preview with avatar, quick links, settings
    account/edit/
      page.tsx                    # Server wrapper — fetches profile, passes to EditProfileForm
      EditProfileForm.tsx         # Client form — avatar upload, username, bio, style tags, social links
    account/notifications/page.tsx  # Client — disabled toggles with Coming Soon banner (delivery not yet built)
    account/privacy/page.tsx        # Server — profile visibility + discoverability settings (Coming Soon items)
    account/help/page.tsx           # Client — FAQ accordion + email contact/report links
    account/about/page.tsx          # Server — FYTD mission, version info, legal placeholders
    onboarding/
      page.tsx                    # Server wrapper — redirects if profile_completed; else shows setup
      ProfileSetupForm.tsx        # Client form — first-time profile setup (avatar, name, style, socials)
    auth/
      login/page.tsx              # Client-side login — calls signInWithPassword directly; checks
                                  # profile_completed and redirects to /onboarding for new users
      signup/page.tsx             # Fully client-side signup — controlled inputs via useState; calls
                                  # supabase.auth.signUp() from browser client; shows ConfirmScreen on
                                  # email confirmation required, ResendScreen for expired links
      actions.ts                  # logout server action only (login + signup are client-side)
      callback/route.ts           # GET handler — handles 5 cases: query-param error, ?code= (PKCE),
                                  # ?token_hash= (OTP), hash-fragment implicit flow, fallback
    api/
      auth/
        set-session/route.ts      # POST handler — accepts {access_token, refresh_token} from implicit-
                                  # flow confirmation emails; calls supabase.auth.setSession() server-
                                  # side to set cookies; returns {redirect} JSON
    admin/
      upload/page.tsx             # Post outfit form — media upload + fit breakdown builder
    onboarding/                   # (see above)
    analytics/page.tsx            # Creator analytics — views, saves, clicks
    actions/
      outfits.ts                  # getOutfits(tag?), getOutfitById(id), getCreatorOutfits()
      saved.ts                    # toggleSave(outfitId), getSavedOutfitIds()
      clicks.ts                   # trackClick(outfitItemId, outfitId)
      views.ts                    # trackView(outfitId)
      upload.ts                   # createOutfit() — any authenticated user can post
      profile.ts                  # updateProfile() — avatar, username, bio, style_tags, social links,
                                  # profile_completed; action_type="skip" marks complete without saving
      outfit-mutations.ts         # editOutfit(), deleteOutfit()
      analytics.ts                # getAnalytics() — view/save/click counts per outfit
    AuthPromptContext.tsx         # Global auth state + bottom-sheet prompt — authLoaded flag prevents
                                  # flashing; openPrompt() is no-op until first getSession() resolves
    layout.tsx                    # Root layout — wraps body in AuthPromptProvider
    globals.css                   # Tailwind import + no-scrollbar + safe-area utilities
  components/
    Layout.tsx                    # max-w-md wrapper + MobileNav
    MobileNav.tsx                 # Fixed bottom nav — Home, Explore, + Post (circular), Profile, Account
                                  # Post/Profile/Account use openPrompt() if not authenticated
    OutfitCard.tsx                # "use client" feed card — uses MediaCarousel; save button + creator info overlaid via z-20
    TakeDownButton.tsx            # "use client" — owner-only soft-delete UI. variant="dots" (⋯ icon on cards) or "menu-item" (text row). Both sheets rendered via createPortal(…, document.body). Calls takeDownOutfit, redirects to /profile on success.
    MediaCarousel.tsx             # "use client" — swipeable sliding-rail carousel for feed + detail. touch-action:pan-y + setPointerCapture for full-area swipe. Live dragOffset state for drag preview. hasDragged ref prevents Link navigation on swipe. Muted state shared via useEffect iterating videoRefs Map. No arrow buttons.
    MultiMediaUpload.tsx          # "use client" — multi-file upload (up to 5). Upload-on-select to outfit-images bucket. Parent notified via useEffect (not inside setItems updaters — avoids React render-cycle violation). Preview strip with cover badge, remove button, error state, add-more button.
    VideoDetailHero.tsx           # SUPERSEDED by MediaCarousel — kept but no longer used in routing
    ProductCard.tsx               # Item card — "use client", variant="grid"|"list", tracks clicks; shop link uses normalizeExternalUrl + <a target="_blank"> (never Next.js Link)
    MediaRenderer.tsx             # Renders <Image> or <video autoPlay muted loop> based on mediaType
    MediaUpload.tsx               # Outfit media upload — images (10MB) + videos (configurable via NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB, default 100MB), bucket: outfit-images
    ImageUpload.tsx               # Item photo upload — images only (10MB), bucket: outfit-images
    FitBreakdownBuilder.tsx       # Quick category buttons → opens PieceEditorModal; shows piece cards
    PieceEditorModal.tsx          # Bottom sheet — add/edit a single piece (name, category, brand,
                                  # price, image, shop link, link type). Rendered via createPortal
                                  # into document.body so it is never inside the upload <form>.
                                  # imageKey increments on every open to remount ImageUpload fresh.
    AvatarUpload.tsx              # Circular avatar upload — bucket: outfit-images, path: avatars/{userId}/profile
    StyleTagSelector.tsx          # 12 clickable style chip buttons (Streetwear, Minimal, Old Money…)
    AuthPromptSheet.tsx           # Bottom sheet — action-specific copy, Sign In + Create Account CTAs
    CreatorBadge.tsx              # Avatar + name + handle; colorScheme="dark"|"light" prop (light = white text + drop-shadow for use over dark images)
    DbSaveButton.tsx              # Auth-aware save — calls openPrompt("save") if not authenticated
    SignOutButton.tsx             # Client component — calls logout server action via form
    FilterBar.tsx                 # Filter chips — URL-based (Link) or callback mode (onSelect prop)
    SearchBar.tsx                 # Text input with search icon
    SaveButton.tsx                # Bookmark toggle (presentational)
    TagPill.tsx                   # Aesthetic tag chip (active/inactive states)
    ProfileHeader.tsx             # Avatar, name, handle, bio, location, style tags, stats row; accepts socialLinks prop for IG/TikTok/website icons
  context/
    AuthPromptContext.tsx         # (lives in src/app/ — see above)
  data/
    outfits.ts                    # 12 mock outfits (fallback when Supabase not configured)
    user.ts                       # mockUser — fallback profile data
  hooks/
    useSavedOutfits.ts            # localStorage-backed saved IDs (legacy, replaced by DB)
  lib/
    dal.ts                        # getSession, getProfile, isCreator — React cache(), server-only
    links.ts                      # normalizeExternalUrl(value) — prepends https:// if no protocol; returns null for empty
    supabase/
      client.ts                   # createBrowserClient — for client components
      server.ts                   # createServerClient — async cookies(), for server components
  types/
    index.ts                      # Outfit (+ mediaType), OutfitItem, AestheticTag types
proxy.ts                          # Next.js 16 route protection — protects /account /admin /analytics
                                  # /onboarding. Named export `proxy`, not default.
supabase/
  migrations/
    001_initial.sql               # Full schema + RLS + handle_new_user trigger
    002_phase3.sql                # outfit_views, social_links, view/save count triggers
    003_beta_prep.sql             # Sets is_creator=TRUE for all users; adds beta_feedback table
    004_media.sql                 # Adds media_type TEXT DEFAULT 'image' to outfits
    005_profile_enhancements.sql  # Adds instagram_url, tiktok_url, website_url, profile_completed
                                  # to profiles; avatars storage bucket + RLS policies
    006_outfit_media_storage.sql  # Creates outfit-images storage bucket + RLS policies
    007_video_upload_limit.sql    # Sets outfit-images bucket file_size_limit to 200MB (requires Supabase Pro; Free plan caps at 50MB)
    008_outfit_media.sql          # Creates outfit_media table (multi-media per post); RLS; backfills existing posts from outfits.image_url
    009_soft_delete.sql           # Adds deleted_at timestamptz to outfits (nullable; NULL = active)
    014_fix_takedown_policy.sql   # Fixes RLS: outfits_select_own — owners can see own posts in any state;
                                  # single clean outfits_owner_update USING (creator_id = auth.uid()) only
  seed.sql                        # 12 mock outfits as SQL (replace creator_id UUID before running)
.env.local.example                # Template for Supabase env vars
```

## Data model

```ts
OutfitItem {
  id, category, brand, name, price, image, shopLink
  shopType: "exact" | "similar"   // drives Shop Exact vs Shop Similar button
}

Outfit {
  id, title, creatorName, creatorHandle, creatorAvatar
  image, mediaType?: "image" | "video"   // mediaType drives MediaRenderer
  description, tags, items: OutfitItem[]
}

AestheticTag = "streetwear" | "clean fit" | "old money" | "minimal"
             | "gym fit" | "casual" | "formal" | "summer"
```

## Key design decisions

- **Mobile-first**, max-width 448px (`max-w-md`), centered on desktop
- **`proxy.ts`** (not `middleware.ts`) — Next.js 16 route protection. Protects `/account`, `/admin`, `/analytics`, `/onboarding`. Named export `proxy`, not default.
- **`params` in dynamic routes are `Promise<{ id: string }>`** — always `await` them (Next.js 16)
- **URL-based filtering on homepage** — `searchParams.tag` drives `getOutfits(tag)` server-side
- **Client-side filtering on explore** — `ExploreClient.tsx` holds search/tag state; data fetched server-side
- **`FilterBar`** — URL-based (`<Link>`, no `onSelect`) or callback mode (pass `onSelect`)
- **`OutfitCard`** — accepts `savedIds: string[]` and `isAuthenticated: boolean`; uses `MediaRenderer` for image/video
- **`MediaRenderer`** — renders `<Image>` or `<video autoPlay muted loop playsInline>` based on `mediaType`
- **`ProductCard`** — `"use client"`, `variant="grid"|"list"`, calls `trackClick` on shop button
- **`DbSaveButton`** — calls `openPrompt("save")` if not authenticated (no redirect); calls `toggleSave` if logged in
- **`AuthPromptContext`** — lives in `src/app/AuthPromptContext.tsx`. Tracks `isAuthenticated`, `authLoaded`. `openPrompt()` is a no-op until `authLoaded = true` (prevents flash). Subscribes to `onAuthStateChange`. Renders `AuthPromptSheet` at provider root.
- **`authLoaded` pattern** — MobileNav and DbSaveButton only intercept when `authLoaded && !isAuthenticated`. Prevents showing auth prompt to logged-in users on first render.
- **Login is client-side** — `login/page.tsx` calls `supabase.auth.signInWithPassword()` directly via browser client. After success: checks `profile_completed`; if false and `next === "/"`, redirects to `/onboarding`. Then calls `router.refresh()` + `router.push(destination)`.
- **`OutfitSaveButton`** — async server component on detail page; fetches saved state and renders `DbSaveButton`
- **DAL (`lib/dal.ts`)** — `getSession`, `getProfile`, `isCreator` use React `cache()`. `server-only`. `isCreator` checks `is_creator === true || is_admin === true`.
- **Posting is open to all authenticated users** — `createOutfit()` in `upload.ts` only checks `getSession()`, not `isCreator()`. RLS on `outfits` allows insert when `creator_id = auth.uid()`.
- **`profile_completed`** — new users start with `false`; set to `true` after onboarding form submit or skip. Login page redirects to `/onboarding` on fresh login (`next === "/"`) if `false`.
- **`ProductCard` variants**: `"grid"` (vertical, default) for feeds; `"list"` (horizontal) for detail breakdown
- **`shopType: "similar"`** — outlined button + amber "Similar" badge; `"exact"` — filled black button
- **Storage buckets**: `outfit-images` — one bucket for everything: outfit photos/videos, outfit item photos, and profile avatars. Public read. Authenticated users upload to their own folder; RLS checks `(storage.foldername(name))[2] = auth.uid()` (second path segment = userId in all upload paths).
- **`AvatarUpload`** — uploads to `outfit-images` bucket at path `avatars/{userId}/profile` with `upsert: true`. Path puts userId at segment [2] to satisfy the existing RLS policy. Appends `?t={Date.now()}` to bust CDN cache after update.
- **`FitBreakdownBuilder` + `PieceEditorModal`** — quick category buttons open a bottom-sheet modal. Pieces stored as JSON in hidden `items_json` input. Fit breakdown is optional on post. `PieceEditorModal` renders via `createPortal(…, document.body)` so it is never inside the upload `<form>` DOM tree — prevents close button or URL inputs from submitting the outer form. `imageKey` state increments on every `isOpen → true` transition, remounting `ImageUpload` fresh so no prior image carries over when opening the modal for a new piece.
- **`normalizeExternalUrl`** (`src/lib/links.ts`) — prepends `https://` to any URL missing a protocol; returns `null` for empty/null. Called before saving shop links in `PieceEditorModal` and `createOutfit`, and before rendering in `ProductCard`. Ensures bare domains like `berlinc.co` open as `https://berlinc.co` and never become internal routes.
- **External shop links** — always rendered as `<a href={normalizeExternalUrl(…)} target="_blank" rel="noopener noreferrer">`, never as Next.js `<Link>`. Internal FYTD routes still use `<Link>`.
- **Images allowed in `next.config.ts`**: Unsplash, i.pravatar.cc, and Supabase Storage hostname (dynamic from `NEXT_PUBLIC_SUPABASE_URL`)
- **Video upload limit** — `NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB` env var (default `100`). `MediaUpload` reads this at runtime via `process.env`. Set to `50` on Supabase Free plan; Pro plan supports higher (bucket limit set to 200MB via migration 007). Error messages reference the configured value dynamically.
- **Video audio preservation** — No client-side processing; files upload to Supabase Storage as-is. Feed videos muted by default (browser autoplay policy); small mute/unmute button on video cards. Detail page video has dedicated mute button via `VideoDetailHero`. React's `muted` prop doesn't update the DOM element after mount — always use `videoRef.current.muted = value` via `useEffect`.
- **`OutfitCard` is a client component** — uses `MediaCarousel` for all media. Gradient + creator info + save button layered via `z-20` above the carousel.
- **`MediaCarousel`** — sliding rail (`width: count*100%`, `translateX(-safeIndex/count * 100% + dragOffset px)`). `touch-action: pan-y` routes horizontal touch to JS while allowing vertical scroll. `setPointerCapture` keeps events in-element during drag. `hasDragged` ref read by `onClickCapture` to cancel link navigation on swipe. Live `dragOffset` state gives immediate drag feedback; resets to 0 on pointer-up. Muted state shared across slides via single `isMuted` state + `useEffect` iterating `videoRefs` Map. No arrow buttons.
- **Soft delete / Take Down** — `takeDownOutfit` sets `published = false` AND `deleted_at = now()` (falls back without `deleted_at` if migration 009 not applied). Setting `published = false` means all existing `.eq("published", true)` feed filters automatically exclude taken-down posts — no query changes needed. `getCreatorOutfits` also filters `published = true` so taken-down posts disappear from the owner's profile too. `TakeDownButton` sheets rendered via `createPortal(…, document.body)` (z-[9999]) so they are never clipped by parent overflow styles.
- **`outfit-mutations.ts` auth** — `takeDownOutfit`, `updateOutfit`, `deleteOutfit` each create their own `supabase` client and call `supabase.auth.getUser()` on that same instance (not `getSession()` from DAL which uses a separate cached client). This is required for RLS to resolve `auth.uid()` correctly in the same request context.
- **RLS — owner SELECT policy** — `outfits_select_own` uses `USING (creator_id = auth.uid())` with NO `published` or `deleted_at` conditions. This allows PostgREST's write-then-read CTE pattern to succeed after take-down sets `published = false`. Without this, the post-update read-back fails and returns a spurious RLS violation error.
- **Ownership check** — `Outfit.creatorId` (UUID from DB row) compared with `getSession().id` in the detail page server component. `OutfitCard` accepts `isOwner?: boolean` — profile page passes `isOwner` for the "My Outfits" grid (all shown there are the user's own). Non-owners never see `TakeDownButton`.
- **Multi-media post flow** — `MultiMediaUpload` uploads each file immediately on selection. `media_items_json` carried to `createOutfit` via FormData built explicitly in `handleSubmit` (not hidden DOM inputs — avoids timing races). Server inserts into `outfit_media` after creating the `outfits` row. If migration 008 not run, falls back to `outfits.image_url`. `MultiMediaUpload` notifies parent via `useEffect([items, …])` — never inside `setItems` updaters (React render-cycle violation).
- **`admin/upload/page.tsx`** post submit — `handleSubmit` always calls `e.preventDefault()`, builds `FormData` from React state, dispatches via `startTransition(() => action(fd))`. No hidden inputs, no `action={…}` on the `<form>` element.
- **`createOutfit` error handling** — `outfit_items` insert failure now deletes the orphaned `outfits` row and returns an error to the user (previously silently logged). `outfit_media` insert failure is non-fatal (logs warning, post still visible via `image_url` fallback).
- **`updateProfile` schema fallback** — three-tier: individual columns (migration 005) → `social_links` JSONB (migration 002) → bare minimum. Detects missing columns via Supabase schema cache error message. Logs warning pointing to exact migration to run.
- **Social link normalization** — `profile.ts` normalizes Instagram handles (`@name` → URL), TikTok handles, bare domains → `https://`. Null/empty clears the field.
- **`dbRowToOutfit` avatar fallback** — uses `https://i.pravatar.cc/150?u=${username}` (unique per username, not a fixed seed) so different users get different placeholder avatars.
- **`createOutfit` redirect** — returns `{ outfitId: string }` on success instead of calling `redirect()`. Upload page navigates via `router.push()` in `useEffect` to avoid silent failure with `useActionState`.
- **Social links on Profile** — `profile/page.tsx` reads from individual columns (005) with fallback to `social_links` JSONB (002) using `col in profileObj` (not `??`) to distinguish null-column from absent-column. Passes `socialLinks` to `ProfileHeader`.
- **`redirect()` must never be called inside a `useActionState` server action** — `redirect()` throws a `NEXT_REDIRECT` which Next.js serializes as an HTML redirect page. React's server action deserializer receives this HTML and throws `"Unexpected token '<', '<!DOCTYPE...'"`. Instead, return `{ redirectTo: "/path" }` state and navigate with `router.push()` in a client-side `useEffect`. Server actions NOT bound to `useActionState` (like `logout`) can still call `redirect()` safely.
- **Signup is fully client-side** — `auth/signup/page.tsx` uses `useState` for all fields (controlled inputs) and calls `createClient().auth.signUp()` from the browser. `emailRedirectTo` is `window.location.origin + "/auth/callback"`. On error: sets error state, all field values preserved. On success with no session: shows `ConfirmScreen`. Do NOT use `useActionState` for signup — it resets uncontrolled form inputs after every action call, wiping user input on errors.
- **Login form state** — on any auth error, password is cleared (`setPassword("")`) but email is preserved. If `authError.message === "Email not confirmed"`, sets `emailUnconfirmed` state and shows a "Resend confirmation email" link to `/auth/signup?resend=true&email=${encodeURIComponent(email)}`.
- **`ResendScreen`** — accepts `initialEmail?: string` prop; `SignupInner` reads `?email=` from `useSearchParams()` and passes it so the email field is pre-filled when arriving from the login "Email not confirmed" link.
- **Auth callback — implicit flow** — `resend()` in `@supabase/auth-js` does NOT include a PKCE code_challenge. Supabase therefore uses implicit flow for resent confirmation emails, returning tokens/errors as URL hash fragments (e.g. `#access_token=...` or `#error=access_denied&error_code=otp_expired`). Route handlers never receive hash fragments (browsers strip them). When `/auth/callback` receives no code/token_hash/error query params, it returns an HTML page with an inline script that reads `window.location.hash`, handles errors (`otp_expired` → resend screen, `already confirmed` → login), and POSTs `{access_token, refresh_token}` to `/api/auth/set-session`.
- **`/api/auth/set-session`** — POST Route Handler. Accepts `{access_token, refresh_token}` from the implicit-flow client script. Creates a `createServerClient` with explicit cookie management, calls `supabase.auth.setSession()`, checks `profile_completed`, and returns `{redirect: "/onboarding"|"/"}`. Copies session cookies onto the JSON response. Does NOT use service role key.
- **`createBrowserClient` uses PKCE** — `@supabase/ssr` hardcodes `flowType: "pkce"` in `createBrowserClient`, so `signUp()` from the browser client sends a `code_challenge` and Supabase uses PKCE flow (tokens delivered via `?code=` query param to `/auth/callback`).
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — use the JWT anon key from Supabase Dashboard → Project Settings → API (starts with `eyJ`). The newer `sb_publishable_...` publishable key format may also work with `@supabase/supabase-js@2.100+` but the JWT format is the canonical value for `@supabase/ssr`.
- **`NEXT_PUBLIC_SITE_URL`** — set in Vercel env vars for production (`https://fytd.org`). Signup uses `window.location.origin` client-side (no server env var needed for the callback URL). Add `https://fytd.org/auth/callback` and `http://localhost:3000/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs.
- **Resend SMTP** — `src/lib/resend.ts` exports `getResendClient()` (throws with clear message if `RESEND_API_KEY` is missing) and `getFromEmail()`. The `RESEND_API_KEY` is server-only (no `NEXT_PUBLIC_` prefix). For Supabase auth emails, the Resend API key is entered as the SMTP password in Supabase Dashboard → Project Settings → Auth → SMTP (host: `smtp.resend.com`, port: `465`, user: `resend`). The `resend` npm package (`src/lib/resend.ts`) is for future direct transactional emails.

## Database schema (Supabase)

Tables: `profiles`, `outfits`, `outfit_items`, `saved_outfits`, `click_events`, `outfit_views`, `beta_feedback`

**`profiles`** — auto-created via `handle_new_user()` trigger:
- `username`, `display_name`, `avatar_url`, `bio`, `location`, `style_tags text[]`
- `instagram_url`, `tiktok_url`, `website_url`
- `profile_completed boolean DEFAULT false`
- `is_creator boolean`, `is_admin boolean`

**`outfits`** — `creator_id` FK to profiles, `tags text[]`, `published bool`, `media_type text` (`'image'|'video'`), `image_url text` (primary/cover media, kept for backward compat)

**`outfit_media`** — `outfit_id` FK to outfits (cascade), `media_url`, `media_type`, `position int`, `storage_path`. One row per photo/video. New posts insert all media here; old posts backfilled with position=0. Queries fetch this and fallback to `outfits.image_url` if table missing.

**`outfit_items`** — FK to outfits, `shop_type text` (`'exact'|'similar'`), `display_order int`

**`saved_outfits`** — junction: `user_id + outfit_id` (unique)

**`click_events`** — `outfit_item_id`, `outfit_id`, `user_id` (nullable)

**`outfit_views`** — `outfit_id`, `user_id` (nullable), view tracking

RLS: published outfits are public; users manage own saves/profile; any authenticated user can insert outfits (creator_id = auth.uid()).

## Auth flow

1. Signup → client-side `supabase.auth.signUp()` (browser client, PKCE flow) → `handle_new_user()` trigger auto-creates `profiles` row with `profile_completed = false`
2. Email confirmation (if enabled) → user clicks link → `/auth/callback`:
   - **Initial signup link** (PKCE): arrives with `?code=` → `exchangeCodeForSession()` → session set via cookies → redirect
   - **Resent confirmation link** (implicit flow): arrives with no query params but hash fragment → callback serves HTML page → client script reads `#access_token=...` → POSTs to `/api/auth/set-session` → session set via cookies → redirect
   - **Expired link**: `#error=access_denied&error_code=otp_expired` in hash → redirected to `/auth/signup?resend=true`
3. Login → client-side `signInWithPassword()` → checks `profile_completed` → routes to `/onboarding` (new users) or `next` (returning users)
4. `proxy.ts` refreshes session cookie on every request; redirects unauthenticated users from protected routes
5. `getSession()` in DAL returns authenticated user or null (never throws)

## Phase status

**Phases 1–4 — complete (private beta).** Full feature set:
- Homepage feed (featured card + 2-col grid, URL-based tag filter)
- Outfit detail with product breakdown, Shop Exact / Shop Similar, click tracking
- Explore (server fetch + client search/filter)
- Photo and video outfit posts with `MediaRenderer`
- Fit breakdown builder (compact quick-add with modal editor)
- Real file uploads to Supabase Storage (`outfit-images` bucket)
- Profile onboarding flow (`/onboarding`) for new users
- Edit profile (`/account/edit`) — avatar, username, bio, style tags, social links
- Saved outfits page (DB-backed, login prompt when logged out)
- Profile page — posted outfits + saved section + Edit Profile button
- Account page — avatar preview, quick links, settings, feedback, sign out
- MobileNav: Home, Explore, + Post (circular black button), Profile, Account
- Guest browsing with `AuthPromptSheet` — no full-page walls, bottom sheet on gated action
- `AuthPromptContext` with `authLoaded` flag — no premature auth prompts
- Supabase auth (login + signup fully client-side with controlled inputs, logout server action, email callback with implicit-flow hash-fragment handling)
- Custom domain `fytd.org` connected to Vercel; `NEXT_PUBLIC_SITE_URL=https://fytd.org` set in Vercel env vars
- Resend SMTP integration ready (`src/lib/resend.ts`); configure in Supabase dashboard before beta email delivery
- Analytics page (`/analytics`)
- Admin outfit list + edit/delete (`/admin/outfits`)
- Settings pages — Notifications, Privacy, Help & Support, About FYTD (all under `/account/`)
- Configurable video upload limit via `NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB` (default 100MB)
- Social links on profile (Instagram, TikTok, website) with URL normalization + schema fallback
- Creator badge color scheme (light/dark) for readability over dark images
- Multi-media outfit posts (up to 5 photos/videos); stored in `outfit_media`; swipeable `MediaCarousel` on feed + detail page
- `Outfit.media: OutfitMedia[]` — primary media array; `Outfit.image` / `Outfit.mediaType` kept as backward-compat aliases for the first item
- Shop link normalization (`src/lib/links.ts`) — bare domains stored and rendered as `https://…`; open in new tab via `<a>`, never Next.js `<Link>`
- `PieceEditorModal` portal — rendered outside the upload `<form>` via `createPortal`; image resets cleanly between pieces via `imageKey`
- `createOutfit` atomic error handling — fit breakdown insert failure rolls back orphaned outfit row and surfaces error to user

**Phase 5 — not started.** Candidates: follow system, dynamic public creator profiles (`/u/[handle]`), profile themes, pinned outfits, creator verification badges, brand/media kit.

## Commands

```bash
npm run dev     # start dev server (Turbopack)
npm run build   # production build (runs TypeScript check)
npm run lint    # eslint
vercel --prod   # deploy to production
```

## Environment setup

Copy `.env.local.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # JWT anon key from Supabase → Project Settings → API
SUPABASE_SERVICE_ROLE_KEY=

# Video upload size limit in MB (default 100; set to 50 on Supabase Free plan)
NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB=100

# Production domain — drives emailRedirectTo in signup. Set in Vercel; leave unset locally.
NEXT_PUBLIC_SITE_URL=https://fytd.org

# Resend — server-only, never NEXT_PUBLIC_. Also paste into Supabase SMTP settings as password.
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@fytd.org
```

Run migrations **in order** in the Supabase SQL Editor:
1. `001_initial.sql` — schema, RLS, trigger
2. `002_phase3.sql` — views, social links
3. `003_beta_prep.sql` — sets is_creator=TRUE for all users
4. `004_media.sql` — media_type column
5. `005_profile_enhancements.sql` — profile_completed, social URLs, avatars bucket
6. `006_outfit_media_storage.sql` — outfit-images bucket + policies
7. `007_video_upload_limit.sql` — sets bucket file_size_limit to 200MB (**Pro plan only**; skip on Free)
8. `008_outfit_media.sql` — outfit_media table for multi-photo/video posts
9. `009_soft_delete.sql` — deleted_at column for soft-delete / take-down
10. `014_fix_takedown_policy.sql` — fixes RLS so owners can take down their own posts without spurious errors

**Storage buckets** (must exist before uploads work):
- `outfit-images` — public; created by migration 006
- avatars are stored inside `outfit-images` under the `avatars/` prefix — no separate bucket needed

**Supabase Free plan file size cap**: 50MB per file (global). To support larger videos, upgrade to Pro and raise the limit in Dashboard → Storage → Settings before running migration 007.

App runs with mock data when Supabase env vars are not set.
