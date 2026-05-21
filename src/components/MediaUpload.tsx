"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALL_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];

const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB ?? 100);

const IMAGE_MAX = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const VIDEO_MAX = MAX_VIDEO_SIZE_MB * 1024 * 1024;

interface Props {
  onUpload: (url: string, type: "image" | "video") => void;
  onClear: () => void;
  currentUrl?: string;
  currentType?: "image" | "video";
}

export default function MediaUpload({ onUpload, onClear, currentUrl, currentType }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [previewType, setPreviewType] = useState<"image" | "video">(currentType ?? "image");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      setError("Please upload a JPG, PNG, WEBP, MP4, MOV, or WEBM file.");
      return;
    }
    if (isImage && file.size > IMAGE_MAX) {
      setError("Images must be under 10MB.");
      return;
    }
    if (isVideo && file.size > VIDEO_MAX) {
      setError("Videos must be under 50MB.");
      return;
    }

    const mediaType: "image" | "video" = isImage ? "image" : "video";
    setPreview(URL.createObjectURL(file));
    setPreviewType(mediaType);
    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in. Please log in and try again.");

      const ext = file.name.split(".").pop()?.toLowerCase() ?? (isImage ? "jpg" : "mp4");
      const folder = isImage ? "images" : "videos";
      const path = `outfits/${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("outfit-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadErr) {
        console.error("[MediaUpload] Supabase storage error:", uploadErr);
        throw uploadErr;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("outfit-images")
        .getPublicUrl(path);

      onUpload(publicUrl, mediaType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[MediaUpload] Upload failed:", msg);
      // Map common Supabase storage errors to friendly messages
      if (msg.includes("not found") || msg.includes("NoSuchBucket")) {
        setError("Storage not configured. Contact support.");
      } else if (msg.includes("security policy") || msg.includes("unauthorized") || msg.includes("Unauthorized")) {
        setError("Upload not allowed. Make sure you are signed in.");
      } else if (msg.includes("Not signed in")) {
        setError("Please sign in to upload media.");
      } else if (msg.includes("too large") || msg.includes("EntityTooLarge")) {
        setError(isImage ? "Image must be under 10MB." : "Video must be under 50MB.");
      } else {
        setError(`Upload failed: ${msg}`);
      }
      setPreview(null);
      onClear();
    } finally {
      setUploading(false);
    }
  }, [onUpload, onClear]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALL_TYPES.join(",")}
        className="sr-only"
        onChange={handleChange}
        tabIndex={-1}
      />

      {preview ? (
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900">
          {previewType === "video" ? (
            <video
              src={preview}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image src={preview} alt="Outfit preview" fill className="object-cover" sizes="448px" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-xs font-medium">Uploading…</p>
            </div>
          )}

          {!uploading && (
            <>
              {previewType === "video" && (
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span className="text-white text-[10px] font-semibold">Video</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          onClick={openPicker}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-neutral-400 hover:bg-neutral-100 transition-colors"
        >
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
          </div>
          <div className="text-center px-6">
            <p className="text-sm font-semibold text-neutral-700">Upload photo or video</p>
            <p className="text-xs text-neutral-400 mt-1">Choose from camera roll or files</p>
            <p className="text-[10px] text-neutral-300 mt-1.5">JPG, PNG, WEBP · MP4, MOV · Max 10MB / 50MB</p>
          </div>
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-500 mt-2">{error}</p>}
    </div>
  );
}
