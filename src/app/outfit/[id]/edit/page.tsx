"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/Layout";
import { updateOutfit } from "@/app/actions/outfit-mutations";

const CATEGORIES = ["Top", "Bottom", "Outerwear", "Footwear", "Accessory", "Bag", "Other"];

interface ItemField {
  name: string;
  brand: string;
  category: string;
  price: string;
  image: string;
  link: string;
  type: "exact" | "similar";
}

export default function EditOutfitPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(true);
  const [items, setItems] = useState<ItemField[]>([
    { name: "", brand: "", category: "Top", price: "", image: "", link: "", type: "exact" },
  ]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/outfits/${id}`)
      .then((r) => r.json())
      .then((outfit) => {
        setTitle(outfit.title ?? "");
        setDescription(outfit.description ?? "");
        setImageUrl(outfit.image ?? "");
        setTags((outfit.tags ?? []).join(", "));
        setPublished(outfit.published !== false);
        if (outfit.items?.length) {
          setItems(
            outfit.items.map((i: { name: string; brand: string; category: string; price: number; image: string; shopLink: string; shopType?: string }) => ({
              name: i.name ?? "",
              brand: i.brand ?? "",
              category: i.category ?? "Top",
              price: String(i.price ?? ""),
              image: i.image ?? "",
              link: i.shopLink ?? "",
              type: i.shopType === "similar" ? "similar" : "exact",
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function updateItem(index: number, field: keyof ItemField, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", brand: "", category: "Top", price: "", image: "", link: "", type: "exact" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      setError("Title and image URL are required.");
      return;
    }
    setPending(true);
    setError("");

    const tagList = tags ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [];
    const itemList = items
      .filter((i) => i.name.trim())
      .map((i, idx) => ({
        name: i.name.trim(),
        brand: i.brand.trim(),
        category: i.category,
        price: parseFloat(i.price) || 0,
        image_url: i.image.trim() || undefined,
        shop_link: i.link.trim() || "#",
        shop_type: i.type,
        display_order: idx + 1,
      }));

    const result = await updateOutfit(id, { title: title.trim(), description: description.trim(), image_url: imageUrl.trim(), tags: tagList, published }, itemList);
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push(`/outfit/${id}`);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="font-bold text-xl tracking-tight text-neutral-900">Edit Outfit</span>
      </div>

      <div className="px-4 py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-neutral-900">Outfit Details</h2>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Tokyo Streetwear"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the vibe..."
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">Image URL *</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required type="url" placeholder="https://..."
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">Tags (comma-separated)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="streetwear, minimal, casual"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900" />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 accent-neutral-900 rounded" />
              <span className="text-sm font-medium text-neutral-700">Published (visible to everyone)</span>
            </label>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-neutral-900">Items</h2>
              <button type="button" onClick={addItem}
                className="text-xs font-semibold text-neutral-900 border border-neutral-200 px-3 py-1.5 rounded-xl hover:bg-neutral-50 transition-colors">
                + Add Item
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {items.map((item, i) => (
                <div key={i} className="bg-neutral-50 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-neutral-500">Item {i + 1}</p>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Name</label>
                      <input value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} placeholder="e.g. Cargo Pants"
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Brand</label>
                      <input value={item.brand} onChange={(e) => updateItem(i, "brand", e.target.value)} placeholder="e.g. Carhartt"
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Category</label>
                      <select value={item.category} onChange={(e) => updateItem(i, "category", e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white">
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Price ($)</label>
                      <input value={item.price} onChange={(e) => updateItem(i, "price", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00"
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Item Image URL</label>
                    <input value={item.image} onChange={(e) => updateItem(i, "image", e.target.value)} type="url" placeholder="https://..."
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white" />
                  </div>

                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Shop Link</label>
                    <input value={item.link} onChange={(e) => updateItem(i, "link", e.target.value)} type="url" placeholder="https://..."
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white" />
                  </div>

                  <div className="flex gap-4">
                    {(["exact", "similar"] as const).map((t) => (
                      <label key={t} className="flex items-center gap-1.5 text-sm text-neutral-700 cursor-pointer">
                        <input type="radio" checked={item.type === t} onChange={() => updateItem(i, "type", t)} className="accent-neutral-900" />
                        {t === "exact" ? "Exact match" : "Similar"}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <p className="text-sm font-medium text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button type="submit" disabled={pending}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-60">
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
