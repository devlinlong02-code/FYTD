"use client";

import { useActionState, useState } from "react";
import AvatarUpload from "@/components/AvatarUpload";
import StyleTagSelector from "@/components/StyleTagSelector";
import { updateProfile, type ProfileState } from "@/app/actions/profile";

interface InitialData {
  display_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  style_tags: string[];
}

interface Props {
  userId: string;
  initialData: InitialData;
}

export default function ProfileSetupForm({ userId, initialData }: Props) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null);
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatar_url);
  const [styleTags, setStyleTags] = useState<string[]>(initialData.style_tags);
  const [showSocials, setShowSocials] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-3">FYTD</p>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight mb-2">
          Set up your profile
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Add a photo, username, and style so your fits feel like yours.
        </p>
      </div>

      <form action={action} className="flex-1 px-6 pb-10 flex flex-col gap-8">
        {/* Hidden state fields */}
        <input type="hidden" name="avatar_url" value={avatarUrl} />
        <input type="hidden" name="style_tags" value={JSON.stringify(styleTags)} />
        <input type="hidden" name="is_setup" value="true" />

        {/* Step 1 — Avatar */}
        <section className="flex flex-col items-center pt-2">
          <AvatarUpload
            currentUrl={avatarUrl || undefined}
            userId={userId}
            onUpload={setAvatarUrl}
            size="lg"
          />
        </section>

        {/* Step 2 — Basic identity */}
        <section className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
              Display Name <span className="text-red-400">*</span>
            </label>
            <input
              name="display_name"
              defaultValue={initialData.display_name}
              placeholder="Your Name"
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
              Username <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400 select-none">@</span>
              <input
                name="username"
                defaultValue={initialData.username}
                placeholder="yourhandle"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full rounded-xl border border-neutral-200 pl-8 pr-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1.5 pl-0.5">
              This is how people find you on FYTD.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
              Bio
            </label>
            <textarea
              name="bio"
              defaultValue={initialData.bio}
              rows={2}
              placeholder="Tell people your style in one sentence."
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
            />
          </div>
        </section>

        {/* Step 3 — Style tags */}
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
            Pick your style
          </p>
          <StyleTagSelector selected={styleTags} onChange={setStyleTags} />
        </section>

        {/* Step 4 — Social links (optional, collapsible) */}
        <section>
          {!showSocials ? (
            <button
              type="button"
              onClick={() => setShowSocials(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add social links
            </button>
          ) : (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                Social Links <span className="normal-case font-normal text-neutral-300">(optional)</span>
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { name: "instagram_url", label: "Instagram", placeholder: "@yourhandle" },
                  { name: "tiktok_url", label: "TikTok", placeholder: "@yourhandle" },
                  { name: "website_url", label: "Website", placeholder: "yoursite.com" },
                ].map(({ name, label, placeholder }) => (
                  <div key={name} className="flex items-center gap-3 bg-neutral-50 rounded-xl px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-neutral-400 w-20 shrink-0">{label}</span>
                    <input
                      name={name}
                      placeholder={placeholder}
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Error */}
        {state?.error && (
          <p className="text-sm font-medium text-red-500 bg-red-50 rounded-xl px-4 py-3">
            {state.error}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            name="action_type"
            value="save"
            disabled={pending}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save Profile"}
          </button>

          <button
            type="submit"
            name="action_type"
            value="skip"
            disabled={pending}
            className="w-full py-3 text-sm font-medium text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
}
