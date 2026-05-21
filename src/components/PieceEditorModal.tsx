"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ImageUpload from "./ImageUpload";
import { normalizeExternalUrl } from "@/lib/links";

export interface Piece {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: string;
  imageUrl: string;
  shopLink: string;
  shopType: "exact" | "similar";
}

const CATEGORIES = ["Top", "Bottom", "Outerwear", "Footwear", "Accessory", "Bag", "Other"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (piece: Piece) => void;
  initial?: Piece | null;
  defaultCategory?: string;
}

export default function PieceEditorModal({ isOpen, onClose, onSave, initial, defaultCategory = "" }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [shopLink, setShopLink] = useState("");
  const [shopType, setShopType] = useState<"exact" | "similar">("exact");
  const [nameError, setNameError] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? "");
      setCategory(initial?.category ?? defaultCategory);
      setBrand(initial?.brand ?? "");
      setPrice(initial?.price ?? "");
      setImageUrl(initial?.imageUrl ?? "");
      setShopLink(initial?.shopLink ?? "");
      setShopType(initial?.shopType ?? "exact");
      setNameError(false);
      // Remount ImageUpload so its internal preview/file state is wiped clean
      setImageKey((k) => k + 1);
    }
  }, [isOpen, initial, defaultCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      category: category || "Other",
      brand: brand.trim(),
      price: price,
      imageUrl,
      shopLink: normalizeExternalUrl(shopLink) ?? "",
      shopType,
    });
  };

  // Render into document.body so the modal is never inside the upload <form>
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop — z-[58] covers the nav (z-50) when modal is open */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[58] bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
      />

      {/* pb-16 lifts the panel above the bottom nav bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] pb-16 transition-transform duration-300 ease-out ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Panel: flex column, capped at 80vh to leave room above */}
        <div className="mx-auto max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh]">

          {/* ── Sticky header (never scrolls away) ── */}
          <div className="shrink-0">
            <div className="pt-4 pb-2 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-base font-bold text-neutral-900">
                {initial ? "Edit piece" : "Add piece"}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Scrollable body (form fields only) ── */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">

            {/* Name */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                Item name *
              </label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(false); }}
                placeholder="e.g. Black Oversized Tee"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 ${nameError ? "border-red-400 bg-red-50" : "border-neutral-200"}`}
              />
              {nameError && <p className="text-xs text-red-500 mt-1">Item name is required.</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${category === cat ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">Brand</label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Uniqlo"
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">Price ($)</label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* Item image */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">Item photo</label>
              <div className="w-24">
                <ImageUpload
                  key={imageKey}
                  storagePath="outfit-items"
                  size="small"
                  initialUrl={imageUrl || undefined}
                  onChange={setImageUrl}
                />
              </div>
            </div>

            {/* Shop link */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">Shop link</label>
              <input
                value={shopLink}
                onChange={(e) => setShopLink(e.target.value)}
                type="url"
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Link type */}
            {shopLink && (
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                  Is this the exact item or similar?
                </label>
                <div className="flex gap-2">
                  {(["exact", "similar"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setShopType(type)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        shopType === type
                          ? "bg-neutral-100 text-neutral-900 border-neutral-400 font-semibold"
                          : "bg-white text-neutral-400 border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      {type === "exact" ? "Exact match" : "Similar style"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sticky footer — always visible, never scrolls away ── */}
          <div className="shrink-0 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-neutral-100 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 active:scale-[0.98] transition-all"
            >
              {initial ? "Save Changes" : "Add to Breakdown"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
