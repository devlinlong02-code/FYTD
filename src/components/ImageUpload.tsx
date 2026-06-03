"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_ATTR = "image/jpeg,image/png,image/webp";

interface Props {
  name?: string;                         // hidden input mode
  onChange?: (url: string) => void;      // callback mode (no hidden input)
  storagePath: "outfits" | "outfit-items";
  size?: "large" | "small";
  initialUrl?: string;                   // pre-fill for edit flows
}

export default function ImageUpload({ name, onChange, storagePath, size = "large", initialUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploadedUrl, setUploadedUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Image must be JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 10MB.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${storagePath}/${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("outfit-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadErr) {
        console.error("[ImageUpload] Supabase storage error:", uploadErr);
        throw uploadErr;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("outfit-images")
        .getPublicUrl(path);

      setUploadedUrl(publicUrl);
      onChange?.(publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ImageUpload] Upload failed:", msg);
      if (msg.includes("not found") || msg.includes("NoSuchBucket")) {
        setError("Storage not configured. Contact support.");
      } else if (msg.includes("security policy") || msg.includes("unauthorized") || msg.includes("Unauthorized")) {
        setError("Upload not allowed. Make sure you are signed in.");
      } else if (msg.includes("Not signed in")) {
        setError("Please sign in to upload.");
      } else {
        setError(`Upload failed: ${msg}`);
      }
      setPreview(null);
      setUploadedUrl("");
      onChange?.("");
    } finally {
      setUploading(false);
    }
  }, [storagePath, onChange]);

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
    setUploadedUrl("");
    setError(null);
    onChange?.("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const openPicker = () => inputRef.current?.click();

  if (size === "large") {
    return (
      <div>
        {!onChange && <input type="hidden" name={name} value={uploadedUrl} />}
        <input ref={inputRef} type="file" accept={ACCEPTED_ATTR} className="sr-only" onChange={handleChange} tabIndex={-1} />

        {preview ? (
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100">
            <Image src={preview} alt="Preview" fill className="object-cover" sizes="448px" unoptimized={preview.startsWith("http")} />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!uploading && (
              <button type="button" onClick={handleRemove} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div onClick={openPicker} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-neutral-400 hover:bg-neutral-100 transition-colors">
            <div className="w-14 h-14 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-semibold text-neutral-700">Upload outfit photo</p>
              <p className="text-xs text-neutral-400 mt-1">Choose from camera roll or files</p>
              <p className="text-[10px] text-neutral-300 mt-1">JPG, PNG, or WEBP · Max 10MB</p>
            </div>
          </div>
        )}
        {error && <p className="text-xs font-medium text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  // Small variant
  return (
    <div>
      {!onChange && <input type="hidden" name={name} value={uploadedUrl} />}
      <input ref={inputRef} type="file" accept={ACCEPTED_ATTR} className="sr-only" onChange={handleChange} tabIndex={-1} />

      {preview ? (
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-100">
          <Image src={preview} alt="Item preview" fill className="object-cover" sizes="120px" unoptimized={preview.startsWith("http")} />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!uploading && (
            <button type="button" onClick={handleRemove} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div onClick={openPicker} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="w-full aspect-square rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-neutral-400 hover:bg-neutral-100 transition-colors">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-300">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-[10px] font-medium text-neutral-400">Add photo</span>
        </div>
      )}
      {error && <p className="text-[10px] font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
}
