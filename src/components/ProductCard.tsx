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
    ? "bg-neutral-900 text-white hover:bg-neutral-800"
    : "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50";

  function handleShopClick() {
    trackClick(item.id, outfitId).catch(() => {});
  }

  if (variant === "list") {
    return (
      <div className="flex gap-3 bg-white rounded-2xl overflow-hidden border border-neutral-100/80 hover:border-neutral-200 transition-all duration-200 p-3">
        {/* Image */}
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-neutral-50">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest text-center px-1">{item.category}</span>
            </div>
          )}
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
            <p className="text-[11px] font-semibold text-neutral-400 leading-none mb-0.5 tracking-wide">
              {item.brand}
            </p>
            <p className="text-sm font-semibold text-neutral-900 leading-snug truncate">
              {item.name}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            {item.price > 0 && (
              <p className="text-sm font-bold text-neutral-900">
                ${item.price.toLocaleString()}
              </p>
            )}
            {item.price <= 0 && <span />}
            <a
              href={normalizeExternalUrl(item.shopLink) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleShopClick}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ${shopBtnClass}`}
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
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest text-center px-2">{item.category}</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest">
          {item.category}
        </span>
        <p className="text-[11px] font-semibold text-neutral-400">{item.brand}</p>
        <p className="text-sm font-medium text-neutral-900 leading-snug">{item.name}</p>
        {item.price > 0 && (
          <p className="text-sm font-bold text-neutral-900 mt-auto pt-1">
            ${item.price.toLocaleString()}
          </p>
        )}
        <a
          href={normalizeExternalUrl(item.shopLink) ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleShopClick}
          className={`mt-2 w-full text-center py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${shopBtnClass}`}
        >
          {shopLabel}
        </a>
      </div>
    </div>
  );
}
