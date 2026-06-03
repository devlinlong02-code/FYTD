"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import AvatarUpload from "@/components/AvatarUpload";
import StyleTagSelector from "@/components/StyleTagSelector";
import { updateProfile, type ProfileState } from "@/app/actions/profile";

interface InitialData {
  display_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  location: string;
  style_tags: string[];
  instagram_url: string;
  tiktok_url: string;
  website_url: string;
}

export default function EditProfileForm({
  userId,
  initialData,
}: {
  userId: string;
  initialData: InitialData;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null);
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatar_url);
  const [styleTags, setStyleTags] = useState<string[]>(initialData.style_tags);
  const [instagramUrl, setInstagramUrl] = useState(initialData.instagram_url ?? "");
  const [tiktokUrl,    setTiktokUrl]    = useState(initialData.tiktok_url    ?? "");
  const [websiteUrl,   setWebsiteUrl]   = useState(initialData.website_url   ?? "");

  // Scroll to top on success to show the saved banner
  useEffect(() => {
    if (state && "success" in state && state.success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state]);

  return (
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="font-bold text-xl tracking-tight text-neutral-900">Edit Profile</span>
      </div>

      <div className="px-4 py-6">
        {state && "success" in state && state.success && (
          <div className="mb-5 flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Profile saved.
          </div>
        )}

        <form action={action} className="flex flex-col gap-7">
          {/* Hidden state */}
          <input type="hidden" name="avatar_url" value={avatarUrl} />
          <input type="hidden" name="style_tags" value={JSON.stringify(styleTags)} />

          {/* Avatar */}
          <section className="flex justify-center pt-2 pb-1">
            <AvatarUpload
              currentUrl={avatarUrl || undefined}
              userId={userId}
              onUpload={setAvatarUrl}
              size="lg"
            />
          </section>

          {/* Basic identity */}
          <section className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                name="display_name"
                defaultValue={initialData.display_name}
                placeholder="Your Name"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400 select-none">@</span>
                <input
                  name="username"
                  defaultValue={initialData.username}
                  placeholder="yourhandle"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full rounded-xl border border-neutral-200 pl-8 pr-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                Bio
              </label>
              <textarea
                name="bio"
                defaultValue={initialData.bio}
                rows={3}
                placeholder="Tell people your style in one sentence."
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                Location
              </label>
              <input
                name="location"
                defaultValue={initialData.location}
                placeholder="City, State"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </section>

          {/* Style tags */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
              Style
            </p>
            <StyleTagSelector selected={styleTags} onChange={setStyleTags} />
          </section>

          {/* Social links */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
              Social Links
            </p>
            <div className="flex flex-col gap-2">
              {/* Instagram */}
              <div className="flex items-center gap-3 bg-neutral-50 rounded-xl px-3.5 py-2.5">
                <span className="text-xs font-semibold text-neutral-400 w-20 shrink-0">Instagram</span>
                <input
                  name="instagram_url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="@yourhandle or URL"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none min-w-0"
                />
                {instagramUrl && (
                  <button
                    type="button"
                    onClick={() => setInstagramUrl("")}
                    aria-label="Remove Instagram"
                    className="shrink-0 w-5 h-5 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center hover:bg-neutral-300 transition-colors"
                  >
                    <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* TikTok */}
              <div className="flex items-center gap-3 bg-neutral-50 rounded-xl px-3.5 py-2.5">
                <span className="text-xs font-semibold text-neutral-400 w-20 shrink-0">TikTok</span>
                <input
                  name="tiktok_url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="@yourhandle or URL"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none min-w-0"
                />
                {tiktokUrl && (
                  <button
                    type="button"
                    onClick={() => setTiktokUrl("")}
                    aria-label="Remove TikTok"
                    className="shrink-0 w-5 h-5 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center hover:bg-neutral-300 transition-colors"
                  >
                    <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Website */}
              <div className="flex items-center gap-3 bg-neutral-50 rounded-xl px-3.5 py-2.5">
                <span className="text-xs font-semibold text-neutral-400 w-20 shrink-0">Website</span>
                <input
                  name="website_url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="yoursite.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none min-w-0"
                />
                {websiteUrl && (
                  <button
                    type="button"
                    onClick={() => setWebsiteUrl("")}
                    aria-label="Remove website"
                    className="shrink-0 w-5 h-5 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center hover:bg-neutral-300 transition-colors"
                  >
                    <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </section>

          {state?.error && (
            <p className="text-sm font-medium text-red-500 bg-red-50 rounded-xl px-4 py-3">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
