"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploadProps {
  currentUrl?: string;
  userId: string;
  onUpload: (url: string) => void;
  size?: "sm" | "lg";
}

function mapStorageError(msg: string): string {
  if (msg.includes("security policy") || msg.includes("Unauthorized") || msg.includes("unauthorized"))
    return "Upload not allowed. Make sure you are signed in.";
  if (msg.includes("Not signed in") || msg.includes("JWT"))
    return "Please sign in again before uploading.";
  if (msg.includes("too large") || msg.includes("EntityTooLarge"))
    return "Image must be under 5MB.";
  return "Could not upload photo. Your profile was not changed. Try again.";
}

export default function AvatarUpload({
  currentUrl,
  userId: _userId,
  onUpload,
  size = "lg",
}: AvatarUploadProps) {
  const [preview, setPreview] = useState(currentUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const dim = size === "lg" ? "w-28 h-28" : "w-20 h-20";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Photo must be JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setError("");
    setUploading(true);

    // Show local preview immediately; keep it even on failure so the user sees their pick
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const supabase = createClient();

      // Verify the session before attempting upload
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user) {
        throw new Error("Not signed in. Please log in and try again.");
      }

      // Path: avatars/{userId}/profile
      // Uses the outfit-images bucket (already set up + public).
      // RLS on that bucket checks (storage.foldername(name))[2] = auth.uid(),
      // which is satisfied by the "avatars/{userId}/..." structure.
      const path = `avatars/${user.id}/profile`;

      const { error: uploadError } = await supabase.storage
        .from("outfit-images")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error("[AvatarUpload] Supabase storage error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from("outfit-images").getPublicUrl(path);
      // Bust CDN cache so the new image appears immediately
      const bustedUrl = `${publicUrl}?t=${Date.now()}`;
      setPreview(bustedUrl);
      onUpload(bustedUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[AvatarUpload] Upload failed:", msg);
      setError(mapStorageError(msg));
      // Keep the local preview — don't revert to old avatar while the user is still on the form
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`relative ${dim} rounded-full overflow-hidden bg-neutral-100 border-2 border-neutral-200 hover:border-neutral-400 transition-colors group shrink-0`}
        aria-label="Change profile photo"
      >
        {preview ? (
          <Image src={preview} alt="Profile photo" fill className="object-cover" sizes="112px" unoptimized={preview.startsWith("blob:")} />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-neutral-300">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
        )}

        {/* Camera overlay on hover */}
        {!uploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}

        {/* Upload spinner */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>

      {/* Text action */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
      >
        {uploading ? "Uploading…" : preview ? "Change photo" : "Add profile photo"}
      </button>

      {preview && !uploading && (
        <button
          type="button"
          onClick={() => { setPreview(""); onUpload(""); }}
          className="text-xs text-neutral-400 hover:text-red-500 transition-colors -mt-1"
        >
          Remove
        </button>
      )}

      {error && <p className="text-xs font-medium text-red-500 text-center max-w-[200px]">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFile}
        tabIndex={-1}
      />
    </div>
  );
}
