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
}: Props) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const hasDragged = useRef(false);

  const count = media.length;
  const safeIndex = Math.min(index, count - 1);
  const current = media[safeIndex];

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(count - 1, i)));
  const prev = () => goTo(safeIndex - 1);
  const next = () => goTo(safeIndex + 1);

  // Pause off-screen videos; sync mute state
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      video.muted = isMuted;
      if (i === safeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [safeIndex, isMuted]);

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
    // Only track as horizontal drag — ignore mostly-vertical movement
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

  // Prevent the wrapping Link/card from navigating when the user swipes
  const onClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged.current = false;
    }
  };

  if (!current) return null;

  // Sliding-rail math:
  //   rail width  = count × containerWidth
  //   translateX  = -(safeIndex / count) × 100%  (% relative to rail's own width)
  //   + dragOffset px (live drag preview, 0 when not dragging)
  const railTranslatePct = count > 1 ? (safeIndex / count) * 100 : 0;

  return (
    <div
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
          >
            {item.media_type === "video" ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(i, el);
                  else videoRefs.current.delete(i);
                }}
                src={item.media_url}
                autoPlay={i === 0}
                muted
                loop
                playsInline
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

      {/* ── Mute toggle — video slides only ─────────────────────────────────── */}
      {current.media_type === "video" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsMuted((v) => !v);
          }}
          className="absolute top-2.5 left-2.5 z-20 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
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

      {/* ── Multi-slide controls ─────────────────────────────────────────────── */}
      {count > 1 && (
        <>
          {/* "1 / 3" counter — centered top */}
          {showCounter && (
            <div className="absolute top-2.5 inset-x-0 z-20 flex justify-center pointer-events-none">
              <span className="bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-white text-[10px] font-semibold tabular-nums">
                {safeIndex + 1} / {count}
              </span>
            </div>
          )}

          {/* Clickable dot indicators — bottom center */}
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
