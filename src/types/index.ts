export interface OutfitItem {
  id: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  image: string;
  shopLink: string;
  shopType?: "exact" | "similar";
}

export interface OutfitMedia {
  id?: string;
  media_url: string;
  media_type: "image" | "video";
  position: number;
}

export interface Outfit {
  id: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string | null;
  /** UUID of the creator — present for DB-backed outfits, undefined for mock data. */
  creatorId?: string;
  /** Primary media URL — first item in the media array. Kept for backward compat. */
  image: string;
  /** Primary media type. Kept for backward compat. */
  mediaType?: "image" | "video";
  /** Full ordered media array. Always at least one item for real posts. */
  media: OutfitMedia[];
  description: string;
  tags: string[];
  items: OutfitItem[];
}

export type AestheticTag =
  | "streetwear"
  | "clean fit"
  | "old money"
  | "minimal"
  | "gym fit"
  | "casual"
  | "formal"
  | "summer"
  | "campus"
  | "night out"
  | "business casual";
