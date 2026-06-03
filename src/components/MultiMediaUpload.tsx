"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALL_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];
const IMAGE_MAX_MB = 10;
const VIDEO_MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB ?? 100);
const IMAGE_MAX = IMAGE_MAX_MB * 1024 * 1024;
const VIDEO_MAX = VIDEO_MAX_MB * 1024 * 1024;
const MAX_ITEMS = 5;

interface MediaItem {
  localId: string;
  previewUrl: string;
  media_url: string;
  media_type: "image" | "video";
  position: number;
  thumbnail_url?: string;
  uploading: boolean;
  error: string | null;
}

interface Props {
  onChange: (items: { media_url: string; media_type: "image" | "video"; position: number; thumbnail_url?: string }[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
}

// Extract a JPEG frame blob from a video File at ~1.5s. Returns null on any failure.
function extractVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = objectUrl;

    let settled = false;
    const done = (result: Blob | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    const timeout = setTimeout(() => done(null), 8000);
    video.onerror = () => done(null);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1.5, video.duration * 0.15);
    };

    video.onseeked = () => {
      if (!video.videoWidth || !video.videoHeight) { done(null); return; }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { done(null); return; }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => done(blob), "image/jpeg", 0.82);
    };
  });
}

export default function MultiMediaUpload({ onChange, onUploadingChange }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notify parent after state settles — never inside a setState updater
  useEffect(() => {
    const uploading = items.some((m) => m.uploading);
    onUploadingChange?.(uploading);
    const uploaded = items
      .filter((m) => m.media_url && !m.uploading)
      .map((m) => ({
        media_url: m.media_url,
        media_type: m.media_type,
        position: m.position,
        ...(m.thumbnail_url ? { thumbnail_url: m.thumbnail_url } : {}),
      }));
    onChange(uploaded);
  }, [items, onChange, onUploadingChange]);

  const uploadFile = useCallback(async (file: File, localId: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems((prev) =>
          prev.map((m) =>
            m.localId === localId ? { ...m, uploading: false, error: "Please sign in to upload." } : m
          )
        );
        return;
      }

      const isImage = IMAGE_TYPES.includes(file.type);
      const ext = file.name.split(".").pop()?.toLowerCase() ?? (isImage ? "jpg" : "mp4");
      const folder = isImage ? "images" : "videos";
      const path = `outfits/${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("outfit-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadErr) {
        const msg = uploadErr.message ?? "";
        let friendly = `Upload failed: ${msg}`;
        if (msg.includes("EntityTooLarge") || msg.includes("too large")) {
          friendly = isImage ? `Image must be under ${IMAGE_MAX_MB}MB.` : `Video must be under ${VIDEO_MAX_MB}MB.`;
        } else if (msg.includes("security policy") || msg.includes("Unauthorized")) {
          friendly = "Upload not allowed. Check that you are signed in.";
        }
        setItems((prev) =>
          prev.map((m) =>
            m.localId === localId ? { ...m, uploading: false, error: friendly } : m
          )
        );
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("outfit-images").getPublicUrl(path);
      setItems((prev) =>
        prev.map((m) =>
          m.localId === localId ? { ...m, uploading: false, media_url: publicUrl } : m
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((m) =>
          m.localId === localId ? { ...m, uploading: false, error: "Upload failed. Check your connection and try again." } : m
        )
      );
    }
  }, []);

  // Generate a poster thumbnail for video files and upload it in parallel with the video
  const generateAndUploadThumbnail = useCallback(async (file: File, localId: string) => {
    try {
      const blob = await extractVideoFrame(file);
      if (!blob) return;

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const path = `outfits/${user.id}/thumbnails/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("outfit-images").upload(path, blob, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });
      if (error) return;

      const { data: { publicUrl } } = supabase.storage.from("outfit-images").getPublicUrl(path);
      setItems((prev) =>
        prev.map((m) => m.localId === localId ? { ...m, thumbnail_url: publicUrl } : m)
      );
    } catch {
      // Thumbnail is non-critical — video still uploads, just without a poster frame
    }
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    setGlobalError(null);
    const fileArr = Array.from(files);

    const remaining = MAX_ITEMS - items.filter((m) => !m.error).length;
    if (remaining <= 0) {
      setGlobalError(`Maximum ${MAX_ITEMS} photos/videos per post.`);
      return;
    }

    const toAdd = fileArr.slice(0, remaining);
    if (fileArr.length > remaining) {
      setGlobalError(`Only the first ${remaining} file${remaining !== 1 ? "s" : ""} were added (max ${MAX_ITEMS}).`);
    }

    const newItems: MediaItem[] = [];
    for (const file of toAdd) {
      const isImage = IMAGE_TYPES.includes(file.type);
      const isVideo = VIDEO_TYPES.includes(file.type);
      if (!isImage && !isVideo) {
        setGlobalError("Unsupported file type. Use JPG, PNG, WEBP, MP4, MOV, or WEBM.");
        continue;
      }
      if (isImage && file.size > IMAGE_MAX) {
        setGlobalError(`Images must be under ${IMAGE_MAX_MB}MB.`);
        continue;
      }
      if (isVideo && file.size > VIDEO_MAX) {
        setGlobalError(`Videos must be under ${VIDEO_MAX_MB}MB.`);
        continue;
      }
      newItems.push({
        localId: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        media_url: "",
        media_type: isImage ? "image" : "video",
        position: 0,
        uploading: true,
        error: null,
      });
    }

    if (newItems.length === 0) return;

    setItems((prev) =>
      [...prev.filter((m) => !m.error), ...newItems].map((m, i) => ({ ...m, position: i }))
    );

    newItems.forEach((item, idx) => {
      uploadFile(toAdd[idx], item.localId);
      // Thumbnail generation runs in parallel with video upload
      if (item.media_type === "video") {
        generateAndUploadThumbnail(toAdd[idx], item.localId);
      }
    });
  }, [items, uploadFile, generateAndUploadThumbnail]);

  const removeItem = (localId: string) => {
    setItems((prev) =>
      prev.filter((m) => m.localId !== localId).map((m, i) => ({ ...m, position: i }))
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const uploadedCount = items.filter((m) => m.media_url && !m.uploading).length;
  const uploadingCount = items.filter((m) => m.uploading).length;
  const canAddMore = items.filter((m) => !m.error).length < MAX_ITEMS;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={ALL_TYPES.join(",")}
        multiple
        className="sr-only"
        onChange={handleInputChange}
        tabIndex={-1}
      />

      {items.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
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
            <p className="text-sm font-semibold text-neutral-700">Upload photos or videos</p>
            <p className="text-xs text-neutral-400 mt-1">Show different angles, details, and pieces</p>
            <p className="text-[10px] text-neutral-300 mt-1.5">
              Up to {MAX_ITEMS} files · JPG, PNG, WEBP · MP4, MOV · Max {IMAGE_MAX_MB}MB / {VIDEO_MAX_MB}MB
            </p>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {items.map((item, idx) => (
              <div
                key={item.localId}
                className="relative shrink-0 w-24 h-32 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200"
              >
                {item.media_type === "video" ? (
                  item.thumbnail_url ? (
                    <Image
                      src={item.thumbnail_url}
                      alt={`Video ${idx + 1} thumbnail`}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                  ) : (
                    <video
                      src={item.previewUrl}
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )
                ) : (
                  <Image
                    src={item.previewUrl}
                    alt={`Media ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                )}

                {item.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {item.error && (
                  <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center p-1">
                    <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                )}

                {idx === 0 && !item.error && (
                  <div className="absolute bottom-1 left-1">
                    <span className="text-[9px] font-bold bg-white/90 text-neutral-900 px-1.5 py-0.5 rounded-full">
                      Cover
                    </span>
                  </div>
                )}

                {item.media_type === "video" && !item.error && !item.uploading && (
                  <div className="absolute top-1 left-1">
                    <span className="bg-black/50 text-white rounded-full p-0.5 flex">
                      <svg width="8" height="8" fill="white" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeItem(item.localId)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  aria-label="Remove"
                >
                  <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}

            {canAddMore && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="shrink-0 w-24 h-32 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-1 hover:border-neutral-400 hover:bg-neutral-100 transition-colors"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[10px] font-medium text-neutral-400">Add more</span>
              </button>
            )}
          </div>

          <p className="text-xs text-neutral-400">
            {uploadingCount > 0
              ? `Uploading ${uploadingCount} file${uploadingCount !== 1 ? "s" : ""}…`
              : `${uploadedCount} of ${items.filter((m) => !m.error).length} uploaded · First photo is the cover`}
          </p>
        </div>
      )}

      {items.some((m) => m.error) && (
        <div className="flex flex-col gap-1">
          {items.filter((m) => m.error).map((m) => (
            <p key={m.localId} className="text-xs font-medium text-red-500">{m.error}</p>
          ))}
        </div>
      )}

      {globalError && (
        <p className="text-xs font-medium text-red-500">{globalError}</p>
      )}
    </div>
  );
}
