"use client";

import Image from "next/image";
import { useState } from "react";

interface AvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({
  avatarUrl,
  displayName = "",
  size = 40,
  className = "",
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = !!avatarUrl && !imgError;

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          src={avatarUrl!}
          alt={displayName || "Avatar"}
          fill
          className="object-cover"
          sizes={`${size}px`}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="flex items-center justify-center w-full h-full text-neutral-300">
          <svg
            width={Math.round(size * 0.55)}
            height={Math.round(size * 0.55)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            viewBox="0 0 24 24"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
      )}
    </div>
  );
}
