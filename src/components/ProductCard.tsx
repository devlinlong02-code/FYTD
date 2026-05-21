"use client";

import Image from "next/image";
import { OutfitItem } from "@/types";
import { trackClick } from "@/app/actions/clicks";
import { normalizeExternalUrl } from "@/lib/links";

interface ProductCardProps {
  item: OutfitItem;
  outfitId: string;
  variant?: "grid" | "list";
}

export default function ProductCard({ item, outfitId, variant = "grid" }: ProductCardProps) {
  const isExact = item.shopType !== "similar";
  const shopLabel = isExact ? "Shop Exact" : "Shop Similar";
  const shopBtnClass = isExact
    ? "bg-neutral-900 text-white hover:bg-neutral-700"
    : "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50";

  function handleShopClick() {
    trackClick(item.id, outfitId).catch(() => {});
  }

  if (variant === "list") {
    return (
      <div className="flex gap-3 bg-white rounded-2xl overflow-hidden border border-neutral-100 p-3">
        {/* Image */}
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-neutral-50">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0 justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400">
                {item.category}
              </span>
              {!isExact && (
                <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-600 bg-amber-50 px-1.5 py-px rounded-full">
                  Similar
                </span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-neutral-400 leading-none mb-0.5">
              {item.brand}
            </p>
            <p className="text-sm font-medium text-neutral-900 leading-snug truncate">
              {item.name}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-bold text-neutral-900">
              ${item.price.toLocaleString()}
            </p>
            <a
              href={normalizeExternalUrl(item.shopLink) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleShopClick}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors ${shopBtnClass}`}
            >
              {shopLabel}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-100 flex flex-col">
      <div className="relative aspect-square bg-neutral-50">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">
          {item.category}
        </span>
        <p className="text-[11px] font-semibold text-neutral-400">{item.brand}</p>
        <p className="text-sm font-medium text-neutral-900 leading-snug">{item.name}</p>
        <p className="text-sm font-bold text-neutral-900 mt-auto pt-1">
          ${item.price.toLocaleString()}
        </p>
        <a
          href={normalizeExternalUrl(item.shopLink) ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleShopClick}
          className={`mt-2 w-full text-center py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors ${shopBtnClass}`}
        >
          {shopLabel}
        </a>
      </div>
    </div>
  );
}
