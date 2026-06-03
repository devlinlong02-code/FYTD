"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import type { OutfitMedia } from "@/types";

interface Props {
  media: OutfitMedia[];
  title: string;
  priority?: boolean;
  sizes?: string;
  /** Extra classes for the outer container. Defaults to "absolute inset-0". */
  className?: string;
  /**
   * Show "1 / 3" pill counter at top-center.
   * Pass false for feed cards where the badge row is already crowded.
   */
  showCounter?: boolean;
  /**
   * Detail-page mode: disables loop, shows a seekable progress bar.
   * Both modes use the same custom overlay controls — no native browser UI anywhere.
   */
  showVideoControls?: boolean;
}

const SWIPE_THRESHOLD = 40;
const DRAG_THRESHOLD = 8;

export default function MediaCarousel({
  media,
  title,
  priority = false,
  sizes,
  className = "absolute inset-0",
  showCounter = true,
  showVideoControls = false,
}: Props) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tapIconVisible, setTapIconVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const isInViewport = useRef(false);
  const tapIconTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const hasDragged = useRef(false);

  const count = media.length;
  const safeIndex = Math.min(index, count - 1);
  const current = media[safeIndex];
  const isCurrentVideo = current?.media_type === "video";

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(count - 1, i)));
  const prev = () => goTo(safeIndex - 1);
  const next = () => goTo(safeIndex + 1);

  // Single effect that owns all video DOM state
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      video.muted = isMuted;
      if (i !== safeIndex) {
        video.pause();
        return;
      }
      if (isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [safeIndex, isMuted, isPlaying]);

  // IntersectionObserver — autoplay when ≥50% visible, pause when off-screen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewport.current = entry.isIntersecting;
        setIsPlaying(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // When the active slide changes, reset progress and resume if in viewport
  useEffect(() => {
    setProgress(0);
    if (isInViewport.current) setIsPlaying(true);
  }, [safeIndex]);

  // Progress tracking for detail mode
  useEffect(() => {
    if (!showVideoControls) return;
    const video = videoRefs.current.get(safeIndex);
    if (!video) return;

    const onTime = () => {
      if (video.duration) setProgress(video.currentTime / video.duration);
    };
    const onEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
    };
  }, [safeIndex, showVideoControls]);

  const flashTapIcon = () => {
    setTapIconVisible(true);
    if (tapIconTimer.current) clearTimeout(tapIconTimer.current);
    tapIconTimer.current = setTimeout(() => setTapIconVisible(false), 800);
  };

  // ── Pointer / swipe handlers ────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (count < 2) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    hasDragged.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - (startY.current ?? e.clientY);
    if (!isDragging && Math.abs(dx) < DRAG_THRESHOLD) return;
    if (Math.abs(dy) > Math.abs(dx) && !isDragging) return;
    hasDragged.current = true;
    setIsDragging(true);
    setDragOffset(dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - (startY.current ?? e.clientY);
    startX.current = null;
    startY.current = null;
    setIsDragging(false);
    setDragOffset(0);
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? next() : prev();
    }
  };

  const onPointerCancel = () => {
    startX.current = null;
    startY.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  // Prevent the wrapping Link from navigating when the user swipes
  const onClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged.current = false;
    }
  };

  // Tap on a video slide → only interactive in detail mode.
  // In feed mode clicks fall through to the parent Link so the card navigates normally.
  const onSlideClick = (e: React.MouseEvent) => {
    if (hasDragged.current || !isCurrentVideo || !showVideoControls) return;
    e.stopPropagation();
    e.preventDefault();
    setIsPlaying((v) => !v);
    flashTapIcon();
  };

  // Seekable progress bar (detail mode)
  const onProgressSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRefs.current.get(safeIndex);
    if (!video || !video.duration) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio);
  };

  if (!current) return null;

  const railTranslatePct = count > 1 ? (safeIndex / count) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`${className} overflow-hidden select-none${count > 1 ? " cursor-grab active:cursor-grabbing" : ""}`}
      style={{ touchAction: count > 1 ? "pan-y" : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
    >
      {/* ── Sliding rail ────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-y-0 left-0 flex"
        style={{
          width: `${count * 100}%`,
          transform: `translateX(calc(-${railTranslatePct}% + ${dragOffset}px))`,
          transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
        }}
      >
        {media.map((item, i) => (
          <div
            key={item.id ?? i}
            className="relative h-full flex-none"
            style={{ width: `${100 / count}%` }}
            aria-hidden={i !== safeIndex}
            onClick={i === safeIndex ? onSlideClick : undefined}
          >
            {item.media_type === "video" ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(i, el);
                  else videoRefs.current.delete(i);
                }}
                src={item.media_url}
                poster={item.thumbnail_url}
                muted
                playsInline
                loop={!showVideoControls}
                preload="metadata"
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                className="absolute inset-0 w-full h-full object-cover"
                aria-label={title}
              />
            ) : (
              <Image
                src={item.media_url}
                alt={i === 0 ? title : `${title} – photo ${i + 1}`}
                fill
                className="object-cover"
                priority={priority && i === 0}
                sizes={sizes}
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Tap-to-play/pause icon flash — detail mode only ─────────────────── */}
      {isCurrentVideo && showVideoControls && (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            tapIconVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            {isPlaying ? (
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* ── Mute toggle — detail mode only ──────────────────────────────────── */}
      {isCurrentVideo && showVideoControls && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsMuted((v) => !v);
          }}
          className="absolute bottom-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" stroke="none" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" stroke="none" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}

      {/* ── Progress bar — detail mode only ─────────────────────────────────── */}
      {showVideoControls && isCurrentVideo && (
        <div
          className="absolute bottom-0 inset-x-0 z-20 h-[3px] bg-white/25 cursor-pointer group"
          onClick={onProgressSeek}
        >
          <div
            className="h-full bg-white transition-none"
            style={{ width: `${progress * 100}%` }}
          />
          {/* Scrubber thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress * 100}%`, transform: "translate(-50%, -50%)" }}
          />
        </div>
      )}

      {/* ── Multi-slide controls ─────────────────────────────────────────────── */}
      {count > 1 && (
        <>
          {showCounter && (
            <div className="absolute top-2.5 inset-x-0 z-20 flex justify-center pointer-events-none">
              <span className="bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-white text-[10px] font-semibold tabular-nums">
                {safeIndex + 1} / {count}
              </span>
            </div>
          )}

          <div className="absolute bottom-3 inset-x-0 z-30 flex justify-center items-center gap-[5px]">
            {media.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  goTo(i);
                }}
                className={`block rounded-full transition-all duration-200 drop-shadow ${
                  i === safeIndex
                    ? "w-[18px] h-[6px] bg-white"
                    : "w-[6px] h-[6px] bg-white/55 hover:bg-white/80"
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
