"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { normalizeExternalUrl } from "@/lib/links";
import Image from "next/image";
import ImageUpload from "./ImageUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Piece {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: string;
  imageUrl: string;
  shopLink: string;
  shopType: "exact" | "similar";
  hotspotX?: number;
  hotspotY?: number;
  note?: string;
}

type ModalStep =
  | "entry"
  | "scan_camera" | "scan_analyzing" | "scan_confirm"
  | "outfit_camera" | "outfit_analyzing" | "outfit_confirm" | "outfit_item_edit"
  | "link_input" | "link_loading" | "link_confirm"
  | "manual"
  | "error";

type OutfitScanItem = {
  item_name: string;
  brand: string | null;
  category: string;
  confidence: string;
  notes: string | null;
  included: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["Top", "Bottom", "Outerwear", "Footwear", "Accessory", "Bag", "Other"];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Footwear: ["shoe", "sneaker", "boot", "air force", "jordan", "yeezy", "nike", "adidas", "new balance", "samba", "loafer", "heel", "sandal", "slide"],
  Outerwear: ["jacket", "coat", "parka", "puffer", "windbreaker", "trench", "bomber", "fleece", "vest"],
  Top: ["shirt", "tee", "t-shirt", "hoodie", "sweatshirt", "sweater", "knit", "polo", "longsleeve", "ls", "ss", "tank", "cardigan", "jersey"],
  Bottom: ["pant", "jean", "denim", "trouser", "short", "cargo", "sweatpant", "jogger", "skirt"],
  Bag: ["bag", "backpack", "tote", "crossbody", "clutch", "wallet", "pouch", "pack"],
  Accessory: ["hat", "cap", "beanie", "scarf", "glove", "belt", "watch", "ring", "chain", "necklace", "bracelet", "glasses", "sunglasses", "sock"],
};

const FASHION_BRANDS = [
  "Nike", "Adidas", "New Balance", "Jordan", "Converse", "Vans", "Puma", "Reebok", "Asics", "Salomon",
  "Arc'teryx", "Stone Island", "CP Company", "Carhartt WIP", "Dickies", "Levi's", "Wrangler", "Lee",
  "Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "GUESS", "Lacoste", "Fred Perry",
  "Supreme", "Palace", "Stussy", "Bape", "Off-White", "Fear of God", "Essentials", "Kith", "Noah",
  "Aime Leon Dore", "Human Made", "Visvim", "Needles", "Engineered Garments", "Our Legacy",
  "Acne Studios", "COS", "Zara", "H&M", "Uniqlo", "Gap", "American Eagle", "Abercrombie",
  "Patagonia", "The North Face", "Columbia", "Fjallraven", "Moncler", "Canada Goose",
  "Balenciaga", "Gucci", "Louis Vuitton", "Prada", "Burberry", "Versace", "Givenchy", "Dior",
  "Saint Laurent", "Alexander McQueen", "Bottega Veneta", "Loewe", "Margiela", "Maison Margiela",
  "Rick Owens", "Raf Simons", "Helmut Lang", "A.P.C.", "Isabel Marant", "Jacquemus", "Ami Paris",
  "Sandro", "Maje", "Celine", "Toteme", "Nanushka", "Ganni", "Stine Goya", "Rotate", "By Far",
  "Coperni", "Y-3", "Yohji Yamamoto", "Comme des Garçons", "Issey Miyake", "Jil Sander", "Lemaire",
  "Margaret Howell", "Paul Smith", "Vivienne Westwood", "Barbour", "Represent", "Rhude",
  "Purple Brand", "Gallery Dept", "Amiri", "Chrome Hearts", "Kapital", "Wtaps", "Neighborhood",
  "Undercover", "Sacai", "Simone Rocha", "Molly Goddard", "Self Portrait", "Reformation",
  "Buck Mason", "Everlane", "Madewell", "J.Crew", "Todd Snyder", "Banana Republic", "Club Monaco",
  "Theory", "Vince", "Equipment", "IRO", "Reiss", "Ted Baker", "Hugo Boss", "Tom Ford",
  "Ermenegildo Zegna", "Brunello Cucinelli", "Loro Piana", "Kiton", "Brioni", "Canali",
];

const AI_CALL_LIMIT = 50;
const AI_CALL_KEY = "fytd_ai_calls";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function suggestCategory(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return null;
}

function getBrandSuggestions(input: string): string[] {
  if (!input || input.length < 2) return [];
  const lower = input.toLowerCase();
  return FASHION_BRANDS.filter((b) => b.toLowerCase().includes(lower)).slice(0, 5);
}

function calcCompleteness(_name: string, brand: string, price: string, shopLink: string, imageUrl: string): number {
  let pts = 1;
  if (brand.trim()) pts++;
  if (price && parseFloat(price) > 0) pts++;
  if (shopLink.trim()) pts++;
  if (imageUrl.trim()) pts++;
  return pts;
}

function canMakeAICall(): boolean {
  try {
    const calls = parseInt(sessionStorage.getItem(AI_CALL_KEY) || "0");
    return calls < AI_CALL_LIMIT;
  } catch { return true; }
}

function incrementAICallCount() {
  try {
    const calls = parseInt(sessionStorage.getItem(AI_CALL_KEY) || "0");
    sessionStorage.setItem(AI_CALL_KEY, String(calls + 1));
  } catch { /* sessionStorage unavailable */ }
}

async function imageToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function aiErrorMessage(errorCode: string | undefined): string {
  if (!errorCode) return "The AI couldn't process this right now. Try again.";
  if (errorCode === "No fashion item detected") return "No fashion item detected. Try a clearer photo of just the item.";
  if (errorCode === "AI service not configured") return "AI features are not set up yet. Contact the site admin to add the ANTHROPIC_API_KEY.";
  if (errorCode === "Unauthorized") return "Sign in to use AI features.";
  if (errorCode === "AI service error") return "The AI service returned an error. Check your API key and try again.";
  return "The AI couldn't process this right now. Try again.";
}

function CreationBadge({ pts }: { pts: number }) {
  if (pts < 3) return null;
  const config =
    pts === 5
      ? { label: "Complete ✦", cls: "bg-black text-white" }
      : pts === 4
      ? { label: "Strong", cls: "bg-neutral-200 text-neutral-700" }
      : { label: "Good", cls: "bg-neutral-100 text-neutral-500" };
  return (
    <span className={`text-[10px] font-medium tracking-[0.05em] uppercase px-2 py-0.5 rounded-full ${config.cls}`}>
      {config.label}
    </span>
  );
}

function LivePreviewCard({ name, brand, price, note, imageUrl, category }: {
  name: string; brand: string; price: string; note: string; imageUrl: string; category: string;
}) {
  const displayPrice = price && parseFloat(price) > 0 ? `$${parseFloat(price).toLocaleString()}` : null;
  return (
    <div style={{ border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 12, overflow: "hidden", background: "#fff", fontSize: 12 }}>
      <div className="relative w-full" style={{ aspectRatio: "16/9", background: "#f4f4f4" }}>
        {imageUrl ? (
          <Image src={imageUrl} alt="preview" fill className="object-cover" sizes="300px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ fontSize: 10, color: "#cccccc", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {category || "Item"}
            </span>
          </div>
        )}
        {category && (
          <span className="absolute top-2 left-2" style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 7px", borderRadius: 999 }}>
            {category}
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888888", marginBottom: 2 }}>
          {brand || <span style={{ color: "#dddddd" }}>Brand</span>}
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: name ? "#000" : "#cccccc" }}>{name || "Item name"}</p>
        {note && <p style={{ fontSize: 10, fontStyle: "italic", color: "#aaaaaa", marginTop: 2 }}>{note}</p>}
        {displayPrice && <p style={{ fontSize: 12, color: "#000", marginTop: 4 }}>{displayPrice}</p>}
      </div>
    </div>
  );
}

function AiFieldLabel({ label, filled }: { label: string; filled?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 mb-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{label}</span>
      {filled && (
        <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">✦ AI</span>
      )}
    </label>
  );
}

function Spinner({ size = 20, white = false }: { size?: number; white?: boolean }) {
  return (
    <div
      className="rounded-full animate-spin"
      style={{
        width: size, height: size,
        border: `2px solid ${white ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)"}`,
        borderTopColor: white ? "#ffffff" : "#000000",
      }}
    />
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (piece: Piece) => void;
  onEdit: (piece: Piece) => void;
  onUpdateHotspot: (pieceId: string, x: number, y: number) => void;
  initial?: Piece | null;
  defaultCategory?: string;
  pieces: Piece[];
  outfitImageUrl?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PieceEditorModal({
  isOpen, onClose, onAdd, onEdit, onUpdateHotspot,
  initial, defaultCategory = "", pieces, outfitImageUrl,
}: Props) {

  // Step machine
  const [step, setStep] = useState<ModalStep>("entry");

  // Scan state
  const [scanPreviewUrl, setScanPreviewUrl] = useState("");
  const [aiConfidence, setAiConfidence] = useState("");
  const [aiFilledFields, setAiFilledFields] = useState<Record<string, boolean>>({});

  // Link state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  // Outfit scan state
  const [outfitScanItems, setOutfitScanItems] = useState<OutfitScanItem[]>([]);
  const [editingOutfitItemIndex, setEditingOutfitItemIndex] = useState<number | null>(null);

  // Error state
  const [errorMsg, setErrorMsg] = useState("");
  const [formNote, setFormNote] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [shopLink, setShopLink] = useState("");
  const [shopType, setShopType] = useState<"exact" | "similar">("exact");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageKey, setImageKey] = useState(0);
  const [nameError, setNameError] = useState(false);
  const [formState, setFormState] = useState<"adding" | "added">("adding");
  const [justAdded, setJustAdded] = useState<Piece | null>(null);
  const [pendingHotspot, setPendingHotspot] = useState<{ x: number; y: number } | null>(null);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [mounted, setMounted] = useState(false);
  const userPickedCategory = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      setImageKey((k) => k + 1);
      setStep(initial ? "manual" : "entry");
      setName(initial?.name ?? "");
      setCategory(initial?.category ?? defaultCategory);
      setBrand(initial?.brand ?? "");
      setPrice(initial?.price ?? "");
      setShopLink(initial?.shopLink ?? "");
      setShopType(initial?.shopType ?? "exact");
      setNote(initial?.note ?? "");
      setImageUrl(initial?.imageUrl ?? "");
      setNameError(false);
      setFormState("adding");
      setJustAdded(null);
      setPendingHotspot(null);
      setBrandSuggestions([]);
      setShowPreview(false);
      setAiFilledFields({});
      setAiConfidence("");
      setScanPreviewUrl("");
      setLinkUrl("");
      setLinkError("");
      setErrorMsg("");
      setOutfitScanItems([]);
      setEditingOutfitItemIndex(null);
      userPickedCategory.current = false;
    }
  }, [isOpen, initial, defaultCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // ── Form helpers ─────────────────────────────────────────────────────────

  const resetFormFields = useCallback((opts?: { category?: string }) => {
    setName(""); setCategory(opts?.category ?? defaultCategory); setBrand(""); setPrice("");
    setShopLink(""); setShopType("exact"); setNote(""); setImageUrl("");
    setNameError(false); setFormState("adding"); setPendingHotspot(null);
    setJustAdded(null); setBrandSuggestions([]); setShowPreview(false);
    setAiFilledFields({}); setAiConfidence(""); setFormNote("");
    setScanPreviewUrl(""); setLinkUrl(""); setLinkError(""); setErrorMsg("");
    userPickedCategory.current = false;
    setImageKey((k) => k + 1);
  }, [defaultCategory]);

  const prefillForm = (data: {
    name?: string; brand?: string | null; category?: string; price?: number | null; shopLink?: string; note?: string; imageUrl?: string | null;
  }) => {
    const filled: Record<string, boolean> = {};
    if (data.name) { setName(data.name); filled.name = true; }
    if (data.brand) { setBrand(data.brand); filled.brand = true; }
    if (data.category && CATEGORIES.includes(data.category)) {
      setCategory(data.category); userPickedCategory.current = true; filled.category = true;
    }
    if (data.price && data.price > 0) { setPrice(String(data.price)); filled.price = true; }
    if (data.shopLink) { setShopLink(data.shopLink); filled.shopLink = true; }
    if (data.note) { setNote(data.note); filled.note = true; }
    if (data.imageUrl) { setImageUrl(data.imageUrl); filled.imageUrl = true; }
    setAiFilledFields(filled);
  };

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    setNameError(false);
    if (userPickedCategory.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const suggested = suggestCategory(value);
      if (suggested) setCategory(suggested);
    }, 300);
  }, []);

  const handleBrandChange = (value: string) => {
    setBrand(value);
    setBrandSuggestions(getBrandSuggestions(value));
  };

  const goBack = () => {
    if (step === "link_confirm") { setStep("link_input"); return; }
    if (step === "outfit_item_edit") { setStep("outfit_confirm"); return; }
    // All other back navigation returns to entry — reset everything
    resetFormFields();
    setStep("entry");
  };

  // ── AI flows ─────────────────────────────────────────────────────────────

  const handleScanFileSelect = async (file: File) => {
    if (!canMakeAICall()) {
      setErrorMsg("You've reached the session limit. Refresh the page to reset.");
      setStep("error");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setScanPreviewUrl(previewUrl);
    setStep("scan_analyzing");

    try {
      const { base64, mediaType } = await imageToBase64(file);
      const res = await fetch("/api/analyze-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const result = await res.json();

      if (result.error) {
        setErrorMsg(aiErrorMessage(result.error));
        setStep("error");
        return;
      }

      incrementAICallCount();
      prefillForm({ name: result.item_name, brand: result.brand, category: result.category, imageUrl: previewUrl });
      setAiConfidence(result.confidence ?? "medium");
      setStep("scan_confirm");
    } catch {
      setErrorMsg(aiErrorMessage(undefined));
      setStep("error");
    }
  };

  const handleOutfitFileSelect = async (file: File) => {
    if (!canMakeAICall()) {
      setErrorMsg("You've reached the session limit. Refresh the page to reset.");
      setStep("error");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setScanPreviewUrl(previewUrl);
    setStep("outfit_analyzing");

    try {
      const { base64, mediaType } = await imageToBase64(file);
      const res = await fetch("/api/analyze-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const result = await res.json();

      if (!Array.isArray(result) || result.length === 0) {
        const errCode = !Array.isArray(result) ? result?.error : undefined;
        setErrorMsg(errCode ? aiErrorMessage(errCode) : "No outfit items detected. Try a clearer photo of a full outfit.");
        setStep("error");
        return;
      }
      incrementAICallCount();
      setOutfitScanItems(result.map((item: Omit<OutfitScanItem, "included">) => ({ ...item, included: true })));
      setStep("outfit_confirm");
    } catch {
      setErrorMsg(aiErrorMessage(undefined));
      setStep("error");
    }
  };

  const handleLinkSubmit = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    if (!url.startsWith("https://")) {
      setLinkError("Couldn't read that link. Make sure it starts with https://");
      return;
    }
    if (!canMakeAICall()) {
      setErrorMsg("You've reached the session limit. Refresh the page to reset.");
      setStep("error");
      return;
    }
    setLinkError("");
    setStep("link_loading");

    try {
      const res = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const result = await res.json();

      if (!res.ok || result.error) {
        // Fall back to manual — at minimum save the shop link
        prefillForm({ shopLink: url });
        setFormNote("Couldn't auto-fill from this link. Fill in the details below — shop link is saved.");
        setStep("manual");
        return;
      }

      incrementAICallCount();
      prefillForm({ name: result.item_name, brand: result.brand, category: result.category, price: result.price, shopLink: result.shop_link, imageUrl: result.image_url });
      setStep("link_confirm");
    } catch {
      prefillForm({ shopLink: url });
      setFormNote("Couldn't read this link automatically. Fill in the details — shop link is saved.");
      setStep("manual");
    }
  };

  // ── Primary form actions ──────────────────────────────────────────────────

  const handlePrimaryAction = () => {
    if (!name.trim()) { setNameError(true); return; }
    const piece: Piece = {
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(), category: category || "Other", brand: brand.trim(), price,
      imageUrl: imageUrl.trim(),
      shopLink: normalizeExternalUrl(shopLink) ?? "",
      shopType, note: note.trim() || undefined,
    };
    if (step === "outfit_item_edit" && editingOutfitItemIndex !== null) {
      setOutfitScanItems((prev) => {
        const updated = [...prev];
        updated[editingOutfitItemIndex] = {
          ...updated[editingOutfitItemIndex],
          item_name: name.trim(), brand: brand.trim() || null,
          category: category || "Other", notes: note.trim() || null,
        };
        return updated;
      });
      setStep("outfit_confirm");
      setEditingOutfitItemIndex(null);
      return;
    }
    if (initial) {
      onEdit(piece);
    } else {
      onAdd(piece);
      setJustAdded(piece);
      setFormState("added");
    }
  };

  const handleAddAnother = () => {
    resetFormFields();
    setStep("entry");
  };

  const handleDone = () => {
    if (pendingHotspot && justAdded) {
      onUpdateHotspot(justAdded.id, pendingHotspot.x, pendingHotspot.y);
    }
    onClose();
  };

  const handleAddAllOutfitItems = () => {
    const included = outfitScanItems.filter((item) => item.included);
    included.forEach((item) => {
      onAdd({
        id: crypto.randomUUID(),
        name: item.item_name,
        category: item.category,
        brand: item.brand ?? "",
        price: "",
        imageUrl: "",
        shopLink: "",
        shopType: "exact",
        note: item.notes ?? undefined,
      });
    });
    onClose();
  };

  const handleHotspotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100 * 10) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100 * 10) / 10;
    setPendingHotspot({ x, y });
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  if (!mounted) return null;

  const pts = calcCompleteness(name, brand, price, shopLink, imageUrl);

  const stepTitle = () => {
    if (initial && step === "manual") return "Edit piece";
    if (step === "outfit_item_edit") return "Edit piece";
    if (formState === "added") return "Piece added";
    switch (step) {
      case "entry": return "Add piece";
      case "scan_camera": case "scan_analyzing": return "Scan item";
      case "scan_confirm": return "Confirm item";
      case "outfit_camera": case "outfit_analyzing": return "Scan outfit";
      case "outfit_confirm": return "Review pieces";
      case "link_input": case "link_loading": return "Paste link";
      case "link_confirm": return "Confirm item";
      case "manual": return "Add piece";
      case "error": return "Something went wrong";
      default: return "Add piece";
    }
  };

  const showBack = formState !== "added" &&
    !["entry", "scan_analyzing", "outfit_analyzing", "link_loading"].includes(step) &&
    !(step === "manual" && !!initial);

  const includedCount = outfitScanItems.filter((i) => i.included).length;

  // ── Render ────────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (formState === "added" && justAdded) {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-neutral-900">{justAdded.name} added</p>
          </div>
          {pieces.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-2">In your breakdown</p>
              <div className="flex flex-wrap gap-1.5">
                {pieces.map((p) => (
                  <span key={p.id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 max-w-[140px] truncate">{p.name}</span>
                ))}
              </div>
            </div>
          )}
          {outfitImageUrl && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-2">Pin this item to the photo (optional)</p>
              <div className="relative w-full overflow-hidden rounded-xl cursor-crosshair bg-neutral-100" style={{ maxHeight: 180 }} onClick={handleHotspotClick}>
                <Image src={outfitImageUrl} alt="Outfit cover" width={400} height={300} className="w-full object-cover" style={{ maxHeight: 180 }} />
                {pendingHotspot && (
                  <div className="absolute pointer-events-none" style={{ left: `${pendingHotspot.x}%`, top: `${pendingHotspot.y}%`, transform: "translate(-50%, -50%)" }}>
                    <span className="relative flex w-4 h-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative flex w-4 h-4 rounded-full border-2 border-white shadow-md bg-black" />
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 mt-1.5 text-center">{pendingHotspot ? "Tap to reposition" : "Tap photo to pin"}</p>
            </div>
          )}
        </div>
      );
    }

    switch (step) {
      // ── Entry ──────────────────────────────────────────────────────────
      case "entry":
        return (
          <div className="flex flex-col gap-5">
            {/* Two primary cards */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep("scan_camera")}
                style={{ border: "1px solid rgba(0,0,0,0.10)", borderRadius: 16, padding: 20, textAlign: "left", background: "#fff", transition: "background 200ms" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f8f8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-3">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 4 }}>Scan Item</p>
                <p style={{ fontSize: 12, color: "#888888", lineHeight: 1.4 }}>Snap a photo to identify the piece</p>
              </button>
              <button
                type="button"
                onClick={() => setStep("link_input")}
                style={{ border: "1px solid rgba(0,0,0,0.10)", borderRadius: 16, padding: 20, textAlign: "left", background: "#fff", transition: "background 200ms" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f8f8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-3">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 4 }}>Paste Link</p>
                <p style={{ fontSize: 12, color: "#888888", lineHeight: 1.4 }}>Auto-fill from any product URL</p>
              </button>
            </div>

            {/* Divider + manual */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-100" />
              <span className="text-xs text-neutral-300 font-medium">or</span>
              <div className="flex-1 h-px bg-neutral-100" />
            </div>
            <button
              type="button"
              onClick={() => { resetFormFields(); setStep("manual"); }}
              className="text-left"
            >
              <p className="text-sm font-semibold text-neutral-700">Add manually</p>
              <p className="text-xs text-neutral-400 mt-0.5">Fill in details yourself</p>
            </button>

            {/* Full outfit scan promo */}
            <button
              type="button"
              onClick={() => setStep("outfit_camera")}
              style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "16px 20px", textAlign: "left", background: "#fafafa", transition: "background 200ms", display: "flex", alignItems: "center", gap: 14 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fafafa")}
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#000", marginBottom: 2 }}>Scan your full outfit</p>
                <p style={{ fontSize: 11, color: "#888888", lineHeight: 1.4 }}>Upload one photo — AI identifies all pieces at once</p>
              </div>
            </button>

            {process.env.NODE_ENV === "development" && (
              <button
                type="button"
                onClick={() => { sessionStorage.removeItem(AI_CALL_KEY); window.location.reload(); }}
                style={{ fontSize: 10, color: "#aaa", textAlign: "left", marginTop: 4 }}
              >
                Reset AI limit (dev only)
              </button>
            )}
          </div>
        );

      // ── Scan camera ────────────────────────────────────────────────────
      case "scan_camera":
        return (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-neutral-400">Take or upload a photo of a single clothing item. AI will identify the piece and fill in the details.</p>
            <label
              style={{ border: "1.5px dashed rgba(0,0,0,0.15)", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, cursor: "pointer", background: "#fafafa", transition: "background 200ms" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f0f0f0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafafa")}
            >
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-neutral-400">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-semibold text-neutral-900">Choose photo</p>
                <p className="text-xs text-neutral-400 mt-1">JPG, PNG, WEBP · Camera or library</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanFileSelect(f); }}
              />
            </label>
          </div>
        );

      // ── Scan analyzing ─────────────────────────────────────────────────
      case "scan_analyzing":
        return (
          <div className="flex flex-col gap-4">
            <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-100" style={{ aspectRatio: "4/3" }}>
              {scanPreviewUrl && (
                <Image src={scanPreviewUrl} alt="Scanning" fill className="object-cover" sizes="400px" unoptimized />
              )}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <Spinner size={28} white />
                <p className="text-white text-sm font-medium">Identifying item…</p>
              </div>
            </div>
            <p className="text-xs text-neutral-400 text-center">AI is analyzing your photo. This takes a few seconds.</p>
          </div>
        );

      // ── Outfit camera ──────────────────────────────────────────────────
      case "outfit_camera":
        return (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-neutral-400">Upload a full outfit photo. AI will identify every visible piece and pre-fill your breakdown.</p>
            <label
              style={{ border: "1.5px dashed rgba(0,0,0,0.15)", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, cursor: "pointer", background: "#fafafa", transition: "background 200ms" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f0f0f0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafafa")}
            >
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-neutral-400">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-semibold text-neutral-900">Upload outfit photo</p>
                <p className="text-xs text-neutral-400 mt-1">Full body shot works best</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOutfitFileSelect(f); }}
              />
            </label>
          </div>
        );

      // ── Outfit analyzing ───────────────────────────────────────────────
      case "outfit_analyzing":
        return (
          <div className="flex flex-col gap-4">
            <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-100" style={{ aspectRatio: "3/4" }}>
              {scanPreviewUrl && (
                <Image src={scanPreviewUrl} alt="Scanning outfit" fill className="object-cover" sizes="400px" unoptimized />
              )}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <Spinner size={28} white />
                <p className="text-white text-sm font-medium">Analyzing outfit…</p>
                <p className="text-white/70 text-xs">Identifying all pieces</p>
              </div>
            </div>
          </div>
        );

      // ── Outfit confirm ─────────────────────────────────────────────────
      case "outfit_confirm":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-neutral-400">{outfitScanItems.length} pieces identified. Remove any that are wrong, or edit to fix details.</p>
            {outfitScanItems.map((item, i) => (
              <div
                key={i}
                style={{ border: item.included ? "1px solid rgba(0,0,0,0.10)" : "1px solid rgba(0,0,0,0.04)", borderRadius: 14, padding: "12px 14px", background: item.included ? "#fff" : "#fafafa", opacity: item.included ? 1 : 0.5, transition: "all 200ms" }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(0,0,0,0.08)", color: "#555", padding: "2px 7px", borderRadius: 999 }}>{item.category}</span>
                      {item.confidence === "low" && (
                        <span style={{ fontSize: 9, fontWeight: 600, color: "#b45309", background: "#fef3c7", padding: "2px 7px", borderRadius: 999 }}>⚠ Review</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 truncate">{item.item_name}</p>
                    {item.brand && <p className="text-xs text-neutral-400">{item.brand}</p>}
                    {item.notes && <p className="text-xs text-neutral-300 italic mt-0.5">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        prefillForm({ name: item.item_name, brand: item.brand, category: item.category, note: item.notes ?? undefined });
                        setEditingOutfitItemIndex(i);
                        setStep("outfit_item_edit");
                      }}
                      className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutfitScanItems((prev) => prev.filter((_, idx) => idx !== i))}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => { resetFormFields(); setStep("manual"); }}
              className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors text-left pt-1"
            >
              + Add a missed piece
            </button>
          </div>
        );

      // ── Link input ─────────────────────────────────────────────────────
      case "link_input":
        return (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-neutral-400 mb-3">Paste a product link and AI will extract the name, brand, category, and price automatically.</p>
              <p className="text-[10px] text-neutral-300 mb-3">Works with: Nike, SSENSE, Grailed, StockX, ASOS, Zara, H&M and more</p>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => { setLinkUrl(e.target.value); setLinkError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLinkSubmit(); }}
                placeholder="https://..."
                autoFocus
                className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              {linkError && <p className="text-xs text-red-500 mt-1.5">{linkError}</p>}
            </div>
          </div>
        );

      // ── Link loading ───────────────────────────────────────────────────
      case "link_loading":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <Spinner size={28} />
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-700">Reading product page…</p>
              <p className="text-xs text-neutral-400 mt-1">Extracting details and categorizing</p>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-1 overflow-hidden">
              <div className="h-1 bg-neutral-900 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        );

      // ── Error ──────────────────────────────────────────────────────────
      case "error":
        return (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 mb-1">{errorMsg || "Something went wrong"}</p>
              <p className="text-xs text-neutral-400">Try a clearer photo, a different link, or add manually.</p>
            </div>
          </div>
        );

      // ── Form (manual / scan_confirm / link_confirm / outfit_item_edit) ─
      default:
        return (
          <div className="flex flex-col gap-4">
            {/* Low confidence warning */}
            {aiConfidence === "low" && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <span className="text-amber-500 text-sm mt-0.5">⚠</span>
                <p className="text-xs text-amber-700">Low confidence — the AI wasn't sure about this item. Check the details before saving.</p>
              </div>
            )}

            {/* Link fallback note */}
            {step === "manual" && formNote && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-400 text-sm mt-0.5">ℹ</span>
                <p className="text-xs text-neutral-500">{formNote}</p>
              </div>
            )}

            {/* Scan preview (above form, scan_confirm only) */}
            {step === "scan_confirm" && scanPreviewUrl && (
              <div className="relative w-full overflow-hidden rounded-xl bg-neutral-100" style={{ aspectRatio: "4/3", maxHeight: 160 }}>
                <Image src={scanPreviewUrl} alt="Scanned item" fill className="object-cover" sizes="400px" unoptimized />
                <span className="absolute top-2 left-2 text-[9px] font-semibold uppercase tracking-wide bg-black/70 text-white px-2 py-0.5 rounded-full">Scanned</span>
              </div>
            )}

            {/* Live preview toggle */}
            {showPreview && (
              <LivePreviewCard name={name} brand={brand} price={price} note={note} imageUrl={imageUrl} category={category} />
            )}

            {/* Image upload */}
            <div>
              <AiFieldLabel label="Item photo" filled={aiFilledFields.imageUrl} />
              <ImageUpload key={imageKey} storagePath="outfit-items" size="small" onChange={(url) => setImageUrl(url)} initialUrl={initial?.imageUrl || imageUrl || undefined} />
            </div>

            {/* Name */}
            <div>
              <AiFieldLabel label="Item name *" filled={aiFilledFields.name} />
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Black Oversized Tee"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 ${nameError ? "border-red-400 bg-red-50" : "border-neutral-200"}`}
              />
              {nameError && <p className="text-xs text-red-500 mt-1">Item name is required.</p>}
            </div>

            {/* Category */}
            <div>
              <AiFieldLabel label="Category" filled={aiFilledFields.category} />
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setCategory(cat); userPickedCategory.current = true; }}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${category === cat ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div className="relative">
              <AiFieldLabel label="Brand" filled={aiFilledFields.brand} />
              <input
                value={brand}
                onChange={(e) => handleBrandChange(e.target.value)}
                onBlur={() => setTimeout(() => setBrandSuggestions([]), 150)}
                placeholder="e.g. Uniqlo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              {brandSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white border border-neutral-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                  {brandSuggestions.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onMouseDown={() => { setBrand(b); setBrandSuggestions([]); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <AiFieldLabel label="Price ($)" filled={aiFilledFields.price} />
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min="0"
                max="99999"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                How I found it <span className="normal-case tracking-normal font-normal text-neutral-300">— optional</span>
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='"Thrifted · $12" or "Sold out — similar linked"'
                maxLength={120}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Shop link */}
            <div>
              <AiFieldLabel label="Shop link" filled={aiFilledFields.shopLink} />
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
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">Is this the exact item or similar?</label>
                <div className="flex gap-2">
                  {(["exact", "similar"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setShopType(type)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${shopType === type ? "bg-neutral-100 text-neutral-900 border-neutral-400 font-semibold" : "bg-white text-neutral-400 border-neutral-200 hover:border-neutral-300"}`}
                    >
                      {type === "exact" ? "Exact match" : "Similar style"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scan again link */}
            {step === "scan_confirm" && (
              <button
                type="button"
                onClick={() => { setStep("scan_camera"); setScanPreviewUrl(""); setAiFilledFields({}); setAiConfidence(""); }}
                className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors text-center mt-1"
              >
                Not right? Scan again
              </button>
            )}
          </div>
        );
    }
  };

  const renderFooter = () => {
    if (formState === "added" && justAdded) {
      return (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={handleDone} className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 active:scale-[0.98] transition-all">
            Done
          </button>
          <button type="button" onClick={handleAddAnother} className="w-full py-3.5 rounded-2xl border border-neutral-200 bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-50 active:scale-[0.98] transition-all">
            Add another piece
          </button>
        </div>
      );
    }

    switch (step) {
      case "scan_confirm":
      case "link_confirm":
      case "manual":
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-1 rounded-full" style={{ width: 20, background: n <= pts ? "#000" : "#e5e5e5", transition: "background 200ms" }} />
                ))}
              </div>
              <CreationBadge pts={pts} />
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${showPreview ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"}`}
              >
                Preview
              </button>
            </div>
            <button type="button" onClick={handlePrimaryAction} className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 active:scale-[0.98] transition-all">
              {initial ? "Save Changes" : "Add to Breakdown"}
            </button>
          </>
        );

      case "outfit_item_edit":
        return (
          <button type="button" onClick={handlePrimaryAction} className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 active:scale-[0.98] transition-all">
            Confirm changes
          </button>
        );

      case "outfit_confirm":
        return (
          <button
            type="button"
            onClick={handleAddAllOutfitItems}
            disabled={includedCount === 0}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Add {includedCount === 1 ? "1 piece" : `all ${includedCount} pieces`} to breakdown
          </button>
        );

      case "link_input":
        return (
          <button
            type="button"
            onClick={handleLinkSubmit}
            disabled={!linkUrl.trim()}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Auto-fill from link
          </button>
        );

      case "error":
        return (
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => { resetFormFields(); setStep("entry"); }} className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 active:scale-[0.98] transition-all">
              Try again
            </button>
            <button type="button" onClick={() => { resetFormFields(); setStep("manual"); }} className="w-full py-3.5 rounded-2xl border border-neutral-200 bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-50 active:scale-[0.98] transition-all">
              Add manually
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[58] bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className={`fixed bottom-0 left-0 right-0 z-[60] pb-16 transition-transform duration-300 ease-out ${isOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="mx-auto max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>

          {/* Handle + header */}
          <div className="shrink-0">
            <div className="pt-4 pb-2 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>
            <div className="flex items-center gap-2 px-5 pb-3">
              {showBack && (
                <button
                  type="button"
                  onClick={goBack}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors shrink-0"
                  aria-label="Back"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
              )}
              <h3 className="text-base font-bold text-neutral-900 flex-1">{stepTitle()}</h3>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div key={`${step}-${formState}`} className="flex-1 overflow-y-auto px-5 pb-4" style={{ animation: "step-fade-in 200ms ease" }}>
            {renderContent()}
          </div>

          {/* Footer */}
          {renderFooter() && (
            <div className="shrink-0 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-neutral-100 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
              {renderFooter()}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
