import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((p, i) => (i === 0 ? p.trim() : l.slice(l.indexOf("=") + 1).trim())))
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Get first user to act as creator ──────────────────────────────────────────
const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
if (usersError || !users?.length) {
  console.error("No users found. Sign up first:", usersError?.message);
  process.exit(1);
}

const creator = users[0];
console.log(`Using creator: ${creator.email} (${creator.id})`);

// Ensure profile exists
await supabase.from("profiles").upsert({
  id: creator.id,
  username: creator.user_metadata?.username ?? creator.email.split("@")[0],
  display_name: creator.user_metadata?.display_name ?? creator.email.split("@")[0],
  is_creator: true,
  is_admin: true,
}, { onConflict: "id" });

// ── Mock outfits data ──────────────────────────────────────────────────────────
const outfits = [
  {
    title: "Tokyo Streetwear",
    description: "Oversized layers and bold graphics inspired by Harajuku culture. This fit balances volume with clean silhouettes for maximum street cred.",
    image_url: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80",
    tags: ["streetwear", "minimal"],
    items: [
      { name: "Active Jacket", brand: "Carhartt WIP", category: "Outerwear", price: 185, image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "8-Ball Tee", brand: "Stüssy", category: "Top", price: 55, image_url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Loose Utility Cargo", brand: "Dickies", category: "Bottom", price: 75, image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
      { name: "Chuck 70 Hi", brand: "Converse", category: "Footwear", price: 95, image_url: "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
    ],
  },
  {
    title: "Clean Money Moves",
    description: "Old money aesthetics meet modern minimalism. Neutral tones, quality fabrics, and understated branding — let the cut do the talking.",
    image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    tags: ["old money", "clean fit", "minimal"],
    items: [
      { name: "Slim Merino Crewneck", brand: "Ralph Lauren Purple Label", category: "Top", price: 295, image_url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Pleated Wool Trousers", brand: "Brunello Cucinelli", category: "Bottom", price: 650, image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4b3602?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
      { name: "Loafer in Calfskin", brand: "Tod's", category: "Footwear", price: 495, image_url: "https://images.unsplash.com/photo-1582897085656-c636d006a246?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Camel Overcoat", brand: "Loro Piana", category: "Outerwear", price: 2800, image_url: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
    ],
  },
  {
    title: "Campus Casual",
    description: "The go-to fit for lectures and library runs. Comfort-first with enough style to stand out between classes.",
    image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    tags: ["casual", "clean fit"],
    items: [
      { name: "Classic Oxford Shirt", brand: "Brooks Brothers", category: "Top", price: 98, image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Slim Chinos", brand: "Banana Republic", category: "Bottom", price: 79, image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
      { name: "Campus 80s", brand: "New Balance", category: "Footwear", price: 90, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Canvas Tote", brand: "L.L.Bean", category: "Bag", price: 35, image_url: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
    ],
  },
  {
    title: "Gym to Street",
    description: "Performance meets style. This fit goes from morning lift to brunch without missing a beat.",
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    tags: ["gym fit", "casual"],
    items: [
      { name: "Ltwt Define Jacket", brand: "Lululemon", category: "Outerwear", price: 128, image_url: "https://images.unsplash.com/photo-1556906781-9a412961a28c?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Surge Shorts 6\"", brand: "Lululemon", category: "Bottom", price: 68, image_url: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Ultraboost 23", brand: "Adidas", category: "Footwear", price: 190, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
      { name: "Essential Crew Sock", brand: "Bombas", category: "Accessory", price: 16, image_url: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
    ],
  },
  {
    title: "Coastal Summer",
    description: "Linen, light colors, and easy silhouettes. Dressed for the rooftop but ready for the beach.",
    image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80",
    tags: ["summer", "casual", "minimal"],
    items: [
      { name: "Linen Camp Shirt", brand: "Corridor", category: "Top", price: 175, image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Pleated Linen Shorts", brand: "Alex Mill", category: "Bottom", price: 115, image_url: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
      { name: "Suede Espadrille", brand: "Loro Piana", category: "Footwear", price: 545, image_url: "https://images.unsplash.com/photo-1582897085656-c636d006a246?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
      { name: "Wayfarers", brand: "Ray-Ban", category: "Accessory", price: 161, image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
    ],
  },
  {
    title: "Monochrome Minimal",
    description: "One color, zero noise. This all-black uniform proves that restraint is the ultimate flex.",
    image_url: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=800&q=80",
    tags: ["minimal", "clean fit"],
    items: [
      { name: "Oversized Tee", brand: "Rick Owens", category: "Top", price: 320, image_url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
      { name: "Dropped Crotch Pants", brand: "Rick Owens", category: "Bottom", price: 890, image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "GEO Runner", brand: "Filling Pieces", category: "Footwear", price: 210, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Tote Bag", brand: "Lemaire", category: "Bag", price: 395, image_url: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
    ],
  },
  {
    title: "Business Casual Friday",
    description: "Sharp enough for client meetings, relaxed enough for happy hour. The versatile professional's uniform.",
    image_url: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
    tags: ["formal", "clean fit", "old money"],
    items: [
      { name: "Stretch Dress Shirt", brand: "Charles Tyrwhitt", category: "Top", price: 89, image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Five-Pocket Chinos", brand: "Bonobos", category: "Bottom", price: 99, image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
      { name: "Wholecut Oxford", brand: "Allen Edmonds", category: "Footwear", price: 395, image_url: "https://images.unsplash.com/photo-1582897085656-c636d006a246?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Leather Belt", brand: "Trafalgar", category: "Accessory", price: 65, image_url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
    ],
  },
  {
    title: "NY Winter Layers",
    description: "Built for the cold, styled for the city. This layered fit keeps you warm from subway to street.",
    image_url: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&w=800&q=80",
    tags: ["streetwear", "old money"],
    items: [
      { name: "Puffer Vest", brand: "Canada Goose", category: "Outerwear", price: 350, image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Heavy Fleece Hoodie", brand: "Reigning Champ", category: "Top", price: 185, image_url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
      { name: "Slim Denim 511", brand: "Levi's", category: "Bottom", price: 79, image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Field Boot", brand: "Timberland", category: "Footwear", price: 198, image_url: "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "exact" },
      { name: "Beanie", brand: "Carhartt WIP", category: "Accessory", price: 28, image_url: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=400&q=80", shop_link: "#", shop_type: "similar" },
    ],
  },
];

// ── Insert outfits ─────────────────────────────────────────────────────────────
let inserted = 0;
for (const outfit of outfits) {
  const { items, ...outfitData } = outfit;

  const { data: row, error } = await supabase
    .from("outfits")
    .insert({ ...outfitData, creator_id: creator.id, published: true })
    .select("id")
    .single();

  if (error) {
    console.error(`Failed to insert "${outfit.title}":`, error.message);
    continue;
  }

  const itemRows = items.map((item, i) => ({
    ...item,
    outfit_id: row.id,
    display_order: i + 1,
  }));

  const { error: itemsError } = await supabase.from("outfit_items").insert(itemRows);
  if (itemsError) {
    console.error(`Failed to insert items for "${outfit.title}":`, itemsError.message);
  } else {
    console.log(`✓ ${outfit.title} (${items.length} items)`);
    inserted++;
  }
}

console.log(`\nDone. ${inserted}/${outfits.length} outfits seeded.`);
