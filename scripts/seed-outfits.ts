/**
 * Seed script: 20 complete outfit posts with fit breakdowns.
 * Run with: npx tsx scripts/seed-outfits.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and
 * SUPABASE_SERVICE_ROLE_KEY in .env.local. Uses the service role key so it
 * can insert on behalf of any user — pass SEED_USER_ID env var to specify
 * the creator, or it falls back to the first profile found.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Outfit data
// ---------------------------------------------------------------------------

const UNSPLASH = [
  "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800",
  "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800",
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
  "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800",
  "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800",
  "https://images.unsplash.com/photo-1544441893-675973e31985?w=800",
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
  "https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=800",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
  "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800",
];

interface ItemDef {
  category: string;
  brand: string;
  name: string;
  price: number;
  shop_link: string;
  shop_type: "exact" | "similar";
}

interface OutfitDef {
  title: string;
  caption: string;
  tags: string[];
  image: string;
  items: ItemDef[];
}

const OUTFITS: OutfitDef[] = [
  {
    title: "Streetwear Casual",
    caption: "Clean street look for everyday wear",
    tags: ["streetwear", "casual"],
    image: UNSPLASH[0],
    items: [
      { category: "Tops", brand: "H&M", name: "Oversized Printed Hoodie", price: 34.99, shop_link: "https://www2.hm.com/en_us/men/products/hoodies-sweatshirts.html", shop_type: "similar" },
      { category: "Bottoms", brand: "Urban Outfitters", name: "BDG Cargo Pant", price: 79.00, shop_link: "https://www.urbanoutfitters.com/mens-pants", shop_type: "similar" },
      { category: "Footwear", brand: "Nike", name: "Air Force 1 '07", price: 110.00, shop_link: "https://www.nike.com/t/air-force-1-07-mens-shoes", shop_type: "exact" },
      { category: "Accessories", brand: "ASOS", name: "Ribbed Beanie", price: 12.00, shop_link: "https://www.asos.com/men/hats-scarves-gloves/cat/?cid=4174", shop_type: "similar" },
      { category: "Accessories", brand: "PacSun", name: "Canvas Crossbody Bag", price: 29.95, shop_link: "https://www.pacsun.com/mens/bags-accessories/", shop_type: "similar" },
    ],
  },
  {
    title: "Clean Minimal",
    caption: "Less is more. White tee energy.",
    tags: ["minimal", "clean"],
    image: UNSPLASH[1],
    items: [
      { category: "Tops", brand: "Uniqlo", name: "Supima Cotton Crewneck T-Shirt", price: 19.90, shop_link: "https://www.uniqlo.com/us/en/men/t-shirts-tops", shop_type: "exact" },
      { category: "Bottoms", brand: "Abercrombie", name: "Slim Chino Pants", price: 59.95, shop_link: "https://www.abercrombie.com/shop/us/mens-pants", shop_type: "similar" },
      { category: "Footwear", brand: "Adidas", name: "Stan Smith Sneakers", price: 100.00, shop_link: "https://www.adidas.com/us/stan-smith-shoes", shop_type: "exact" },
      { category: "Accessories", brand: "H&M", name: "Canvas Tote Bag", price: 14.99, shop_link: "https://www2.hm.com/en_us/men/products/accessories.html", shop_type: "similar" },
    ],
  },
  {
    title: "Old Money Prep",
    caption: "Vineyard Vines energy on a H&M budget",
    tags: ["old money", "preppy"],
    image: UNSPLASH[2],
    items: [
      { category: "Tops", brand: "Hollister", name: "Slim Fit Polo Shirt", price: 44.95, shop_link: "https://www.hollisterco.com/shop/us/mens-shirts", shop_type: "similar" },
      { category: "Bottoms", brand: "Gap", name: "Essential Khaki Shorts", price: 49.95, shop_link: "https://www.gap.com/browse/category.do?cid=1049649", shop_type: "similar" },
      { category: "Footwear", brand: "Nordstrom", name: "Leather Boat Shoes", price: 89.95, shop_link: "https://www.nordstrom.com/browse/men/shoes/boat-loafers", shop_type: "similar" },
      { category: "Accessories", brand: "H&M", name: "Woven Leather Belt", price: 19.99, shop_link: "https://www2.hm.com/en_us/men/products/accessories/belts.html", shop_type: "similar" },
    ],
  },
  {
    title: "Going Out Fit",
    caption: "Saturday night done right",
    tags: ["going out", "casual"],
    image: UNSPLASH[3],
    items: [
      { category: "Tops", brand: "Zara", name: "Slim Fit Oxford Shirt", price: 45.90, shop_link: "https://www.zara.com/us/en/man-shirts-l737.html", shop_type: "similar" },
      { category: "Bottoms", brand: "ASOS", name: "Slim Dark Wash Jeans", price: 55.00, shop_link: "https://www.asos.com/men/jeans/cat/?cid=4208", shop_type: "similar" },
      { category: "Footwear", brand: "Nordstrom", name: "Chelsea Boots", price: 129.00, shop_link: "https://www.nordstrom.com/browse/men/shoes/boots", shop_type: "similar" },
      { category: "Outerwear", brand: "H&M", name: "Slim Fit Leather Jacket", price: 99.99, shop_link: "https://www2.hm.com/en_us/men/products/jackets-coats.html", shop_type: "similar" },
    ],
  },
  {
    title: "Gym Fit",
    caption: "Gains incoming. No distractions.",
    tags: ["gym", "athleisure"],
    image: UNSPLASH[4],
    items: [
      { category: "Tops", brand: "Nike", name: "Dri-FIT Training T-Shirt", price: 35.00, shop_link: "https://www.nike.com/w/mens-training-gym-tops-shirts-6ymx6znik1", shop_type: "similar" },
      { category: "Bottoms", brand: "Adidas", name: "Tiro Jogger Pants", price: 55.00, shop_link: "https://www.adidas.com/us/tiro-pants", shop_type: "similar" },
      { category: "Footwear", brand: "Nike", name: "Metcon 9 Training Shoes", price: 130.00, shop_link: "https://www.nike.com/w/mens-training-gym-shoes-1gdj0znik1", shop_type: "similar" },
      { category: "Accessories", brand: "Nike", name: "Heritage Cap", price: 25.00, shop_link: "https://www.nike.com/w/mens-hats-accessories-8s6jvznik1", shop_type: "similar" },
    ],
  },
  {
    title: "Quiet Luxury",
    caption: "No logos needed when the fit speaks",
    tags: ["minimal", "luxury", "old money"],
    image: UNSPLASH[5],
    items: [
      { category: "Tops", brand: "Uniqlo", name: "Premium Lambswool Crewneck", price: 49.90, shop_link: "https://www.uniqlo.com/us/en/men/sweaters", shop_type: "similar" },
      { category: "Bottoms", brand: "Zara", name: "Slim Tailored Trousers", price: 59.90, shop_link: "https://www.zara.com/us/en/man-trousers-l853.html", shop_type: "similar" },
      { category: "Footwear", brand: "Nordstrom", name: "Leather Derby Shoes", price: 149.00, shop_link: "https://www.nordstrom.com/browse/men/shoes/oxfords-derbys", shop_type: "similar" },
      { category: "Accessories", brand: "ASOS", name: "Minimalist Leather Watch", price: 45.00, shop_link: "https://www.asos.com/men/watches/cat/?cid=4285", shop_type: "similar" },
    ],
  },
  {
    title: "Y2K Throwback",
    caption: "2004 called and we answered",
    tags: ["streetwear", "y2k", "retro"],
    image: UNSPLASH[6],
    items: [
      { category: "Tops", brand: "Urban Outfitters", name: "Vintage Graphic Tee", price: 39.00, shop_link: "https://www.urbanoutfitters.com/mens-graphic-tees", shop_type: "similar" },
      { category: "Bottoms", brand: "PacSun", name: "Baggy Dad Jeans", price: 59.95, shop_link: "https://www.pacsun.com/mens/jeans/", shop_type: "similar" },
      { category: "Footwear", brand: "Nike", name: "Air Max 97 Sneakers", price: 175.00, shop_link: "https://www.nike.com/w/air-max-97-shoes", shop_type: "similar" },
      { category: "Accessories", brand: "ASOS", name: "Bucket Hat", price: 18.00, shop_link: "https://www.asos.com/men/hats-scarves-gloves/cat/?cid=4174", shop_type: "similar" },
    ],
  },
  {
    title: "Campus Casual",
    caption: "Lecture ready, photo ready",
    tags: ["casual", "clean", "campus"],
    image: UNSPLASH[7],
    items: [
      { category: "Tops", brand: "Abercrombie", name: "Quarter Zip Pullover", price: 69.95, shop_link: "https://www.abercrombie.com/shop/us/mens-sweatshirts-hoodies", shop_type: "similar" },
      { category: "Bottoms", brand: "American Eagle", name: "AE Straight Leg Jeans", price: 59.95, shop_link: "https://www.ae.com/us/en/c/men/jeans/cat4840012", shop_type: "similar" },
      { category: "Footwear", brand: "Adidas", name: "Ultraboost 22 Sneakers", price: 190.00, shop_link: "https://www.adidas.com/us/ultraboost-shoes", shop_type: "similar" },
      { category: "Accessories", brand: "H&M", name: "Canvas Backpack", price: 29.99, shop_link: "https://www2.hm.com/en_us/men/products/accessories/bags-wallets.html", shop_type: "similar" },
    ],
  },
  {
    title: "All Black Night Out",
    caption: "Monochrome after dark",
    tags: ["going out", "minimal", "streetwear"],
    image: UNSPLASH[8],
    items: [
      { category: "Tops", brand: "Zara", name: "Slim Fit Black T-Shirt", price: 19.90, shop_link: "https://www.zara.com/us/en/man-t-shirts-l855.html", shop_type: "similar" },
      { category: "Bottoms", brand: "H&M", name: "Black Slim Fit Pants", price: 34.99, shop_link: "https://www2.hm.com/en_us/men/products/trousers.html", shop_type: "similar" },
      { category: "Footwear", brand: "Nike", name: "Air Force 1 All Black", price: 110.00, shop_link: "https://www.nike.com/t/air-force-1-07-mens-shoes", shop_type: "similar" },
      { category: "Accessories", brand: "ASOS", name: "Slim Black Belt", price: 16.00, shop_link: "https://www.asos.com/men/belts/cat/?cid=4229", shop_type: "similar" },
    ],
  },
  {
    title: "Gorpcore Outdoor",
    caption: "Functional and fashionable on the trail",
    tags: ["gorpcore", "outdoor", "streetwear"],
    image: UNSPLASH[9],
    items: [
      { category: "Outerwear", brand: "H&M", name: "Fleece Zip Jacket", price: 39.99, shop_link: "https://www2.hm.com/en_us/men/products/jackets-coats.html", shop_type: "similar" },
      { category: "Bottoms", brand: "Urban Outfitters", name: "Cargo Utility Pants", price: 89.00, shop_link: "https://www.urbanoutfitters.com/mens-pants", shop_type: "similar" },
      { category: "Footwear", brand: "Adidas", name: "Terrex Trailmaker Hiking Shoes", price: 130.00, shop_link: "https://www.adidas.com/us/terrex-shoes", shop_type: "similar" },
      { category: "Accessories", brand: "ASOS", name: "Technical Sling Bag", price: 35.00, shop_link: "https://www.asos.com/men/bags-backpacks/cat/?cid=4438", shop_type: "similar" },
    ],
  },
  {
    title: "Smart Casual Work",
    caption: "Business casual done properly",
    tags: ["formal", "clean", "workwear"],
    image: UNSPLASH[10],
    items: [
      { category: "Tops", brand: "Uniqlo", name: "Slim Fit Oxford Button-Down", price: 39.90, shop_link: "https://www.uniqlo.com/us/en/men/shirts", shop_type: "similar" },
      { category: "Bottoms", brand: "Gap", name: "Slim Fit Khaki Trousers", price: 59.95, shop_link: "https://www.gap.com/browse/category.do?cid=1049649", shop_type: "similar" },
      { category: "Footwear", brand: "Nordstrom", name: "Leather Oxford Derby", price: 109.00, shop_link: "https://www.nordstrom.com/browse/men/shoes/oxfords-derbys", shop_type: "similar" },
      { category: "Outerwear", brand: "ASOS", name: "Slim Fit Blazer", price: 75.00, shop_link: "https://www.asos.com/men/suits-tailoring/blazers/cat/?cid=4600", shop_type: "similar" },
    ],
  },
  {
    title: "Summer Linen",
    caption: "Hot weather, cooler fit",
    tags: ["summer", "casual", "clean"],
    image: UNSPLASH[11],
    items: [
      { category: "Tops", brand: "H&M", name: "Relaxed Linen Shirt", price: 24.99, shop_link: "https://www2.hm.com/en_us/men/products/shirts.html", shop_type: "similar" },
      { category: "Bottoms", brand: "American Eagle", name: "Linen Blend Shorts", price: 44.95, shop_link: "https://www.ae.com/us/en/c/men/shorts/cat4840010", shop_type: "similar" },
      { category: "Footwear", brand: "H&M", name: "Leather Sandals", price: 34.99, shop_link: "https://www2.hm.com/en_us/men/products/shoes.html", shop_type: "similar" },
      { category: "Accessories", brand: "ASOS", name: "Woven Straw Bucket Hat", price: 22.00, shop_link: "https://www.asos.com/men/hats-scarves-gloves/cat/?cid=4174", shop_type: "similar" },
    ],
  },
  {
    title: "Techwear Edge",
    caption: "Cyberpunk meets the streets",
    tags: ["techwear", "streetwear", "minimal"],
    image: UNSPLASH[12],
    items: [
      { category: "Outerwear", brand: "Urban Outfitters", name: "Technical Zip Jacket", price: 99.00, shop_link: "https://www.urbanoutfitters.com/mens-jackets-coats", shop_type: "similar" },
      { category: "Bottoms", brand: "ASOS", name: "Slim Jogger Pants", price: 45.00, shop_link: "https://www.asos.com/men/trousers/cat/?cid=4617", shop_type: "similar" },
      { category: "Footwear", brand: "Nike", name: "ACG Mountain Fly Trail Shoe", price: 150.00, shop_link: "https://www.nike.com/w/acg-shoes", shop_type: "similar" },
      { category: "Accessories", brand: "ASOS", name: "Cross-Body Sling Pack", price: 38.00, shop_link: "https://www.asos.com/men/bags-backpacks/cat/?cid=4438", shop_type: "similar" },
    ],
  },
  {
    title: "Prep School Classic",
    caption: "Ivy league energy, modern cut",
    tags: ["preppy", "clean", "classic"],
    image: UNSPLASH[13],
    items: [
      { category: "Tops", brand: "Hollister", name: "Striped Rugby Shirt", price: 49.95, shop_link: "https://www.hollisterco.com/shop/us/mens-shirts", shop_type: "similar" },
      { category: "Bottoms", brand: "Abercrombie", name: "Slim Straight Chinos", price: 59.95, shop_link: "https://www.abercrombie.com/shop/us/mens-pants", shop_type: "similar" },
      { category: "Footwear", brand: "Adidas", name: "Stan Smith Sneakers", price: 100.00, shop_link: "https://www.adidas.com/us/stan-smith-shoes", shop_type: "exact" },
      { category: "Accessories", brand: "Gap", name: "Canvas Web Belt", price: 19.95, shop_link: "https://www.gap.com/browse/category.do?cid=1049649", shop_type: "similar" },
    ],
  },
  {
    title: "Earth Tones",
    caption: "Nature palette, city fit",
    tags: ["minimal", "casual", "earth tones"],
    image: UNSPLASH[14],
    items: [
      { category: "Outerwear", brand: "H&M", name: "Brown Corduroy Jacket", price: 59.99, shop_link: "https://www2.hm.com/en_us/men/products/jackets-coats.html", shop_type: "similar" },
      { category: "Tops", brand: "Uniqlo", name: "Waffle Knit Long Sleeve", price: 29.90, shop_link: "https://www.uniqlo.com/us/en/men/tops", shop_type: "similar" },
      { category: "Bottoms", brand: "Urban Outfitters", name: "BDG Olive Cargo Pants", price: 79.00, shop_link: "https://www.urbanoutfitters.com/mens-pants", shop_type: "similar" },
      { category: "Footwear", brand: "Nordstrom", name: "Tan Suede Chelsea Boots", price: 129.00, shop_link: "https://www.nordstrom.com/browse/men/shoes/boots", shop_type: "similar" },
    ],
  },
  {
    title: "Athletic Luxe",
    caption: "Gym to brunch without changing",
    tags: ["athleisure", "luxury", "clean"],
    image: UNSPLASH[15],
    items: [
      { category: "Tops", brand: "Adidas", name: "Premium Track Jacket", price: 90.00, shop_link: "https://www.adidas.com/us/men-jackets", shop_type: "similar" },
      { category: "Bottoms", brand: "Adidas", name: "Tiro Premium Joggers", price: 75.00, shop_link: "https://www.adidas.com/us/tiro-pants", shop_type: "similar" },
      { category: "Footwear", brand: "Nike", name: "Air Max 270 Sneakers", price: 150.00, shop_link: "https://www.nike.com/w/air-max-270-shoes", shop_type: "similar" },
      { category: "Accessories", brand: "H&M", name: "Sports Watch", price: 24.99, shop_link: "https://www2.hm.com/en_us/men/products/accessories.html", shop_type: "similar" },
    ],
  },
  {
    title: "Coastal Summer",
    caption: "Salt air and good fits",
    tags: ["summer", "coastal", "casual"],
    image: UNSPLASH[16],
    items: [
      { category: "Tops", brand: "H&M", name: "Relaxed Fit Linen Shirt", price: 24.99, shop_link: "https://www2.hm.com/en_us/men/products/shirts.html", shop_type: "similar" },
      { category: "Bottoms", brand: "American Eagle", name: "Classic Swim Shorts", price: 39.95, shop_link: "https://www.ae.com/us/en/c/men/shorts/swim-shorts/cat7590011", shop_type: "similar" },
      { category: "Footwear", brand: "H&M", name: "Suede Slides", price: 29.99, shop_link: "https://www2.hm.com/en_us/men/products/shoes.html", shop_type: "similar" },
      { category: "Accessories", brand: "ASOS", name: "Baseball Cap", price: 15.00, shop_link: "https://www.asos.com/men/hats-scarves-gloves/cat/?cid=4174", shop_type: "similar" },
    ],
  },
  {
    title: "Dark Academia",
    caption: "If the library had a dress code",
    tags: ["dark academia", "vintage", "formal"],
    image: UNSPLASH[17],
    items: [
      { category: "Outerwear", brand: "ASOS", name: "Tweed Blazer", price: 85.00, shop_link: "https://www.asos.com/men/suits-tailoring/blazers/cat/?cid=4600", shop_type: "similar" },
      { category: "Tops", brand: "Uniqlo", name: "Ribbed Turtleneck Sweater", price: 39.90, shop_link: "https://www.uniqlo.com/us/en/men/sweaters", shop_type: "similar" },
      { category: "Bottoms", brand: "H&M", name: "Slim Corduroy Pants", price: 44.99, shop_link: "https://www2.hm.com/en_us/men/products/trousers.html", shop_type: "similar" },
      { category: "Footwear", brand: "Nordstrom", name: "Leather Oxford Shoes", price: 119.00, shop_link: "https://www.nordstrom.com/browse/men/shoes/oxfords-derbys", shop_type: "similar" },
    ],
  },
  {
    title: "Festival Fit",
    caption: "Main stage energy",
    tags: ["streetwear", "casual", "festival"],
    image: UNSPLASH[18],
    items: [
      { category: "Tops", brand: "Urban Outfitters", name: "Oversized Graphic Tee", price: 39.00, shop_link: "https://www.urbanoutfitters.com/mens-graphic-tees", shop_type: "similar" },
      { category: "Bottoms", brand: "American Eagle", name: "Distressed Denim Shorts", price: 49.95, shop_link: "https://www.ae.com/us/en/c/men/shorts/cat4840010", shop_type: "similar" },
      { category: "Footwear", brand: "Nike", name: "Air Max 90 Sneakers", price: 130.00, shop_link: "https://www.nike.com/w/air-max-90-shoes", shop_type: "similar" },
      { category: "Accessories", brand: "ASOS", name: "Canvas Fanny Pack", price: 22.00, shop_link: "https://www.asos.com/men/bags-backpacks/cat/?cid=4438", shop_type: "similar" },
    ],
  },
  {
    title: "Monochrome White",
    caption: "All white everything",
    tags: ["minimal", "clean", "monochrome"],
    image: UNSPLASH[19],
    items: [
      { category: "Tops", brand: "Uniqlo", name: "Supima Cotton White Tee", price: 19.90, shop_link: "https://www.uniqlo.com/us/en/men/t-shirts-tops", shop_type: "exact" },
      { category: "Bottoms", brand: "H&M", name: "White Slim Fit Trousers", price: 34.99, shop_link: "https://www2.hm.com/en_us/men/products/trousers.html", shop_type: "similar" },
      { category: "Footwear", brand: "Adidas", name: "Stan Smith All White", price: 100.00, shop_link: "https://www.adidas.com/us/stan-smith-shoes", shop_type: "exact" },
      { category: "Accessories", brand: "ASOS", name: "White Canvas Tote", price: 20.00, shop_link: "https://www.asos.com/men/bags-backpacks/cat/?cid=4438", shop_type: "similar" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  // Get the target user ID
  let userId = process.env.SEED_USER_ID;
  if (!userId) {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();
    if (error || !profiles) {
      console.error("No profiles found and SEED_USER_ID not set. Create a user first.");
      process.exit(1);
    }
    userId = profiles.id as string;
  }
  console.log(`Seeding as user: ${userId}`);

  let inserted = 0;
  let failed = 0;

  for (const [i, outfit] of OUTFITS.entries()) {
    // Insert outfit row
    const { data: outfitRow, error: outfitErr } = await supabase
      .from("outfits")
      .insert({
        creator_id: userId,
        title: outfit.title,
        description: outfit.caption,
        tags: outfit.tags,
        image_url: outfit.image,
        media_type: "image",
        published: true,
      })
      .select("id")
      .single();

    if (outfitErr || !outfitRow) {
      console.error(`  [${i + 1}] FAILED to insert outfit "${outfit.title}":`, outfitErr?.message);
      failed++;
      continue;
    }

    const outfitId = outfitRow.id as string;

    // Insert outfit_media row
    await supabase.from("outfit_media").insert({
      outfit_id: outfitId,
      media_url: outfit.image,
      media_type: "image",
      position: 0,
    });

    // Insert outfit_items
    const items = outfit.items.map((item, idx) => ({
      outfit_id: outfitId,
      category: item.category,
      brand: item.brand,
      name: item.name,
      price: item.price,
      shop_link: item.shop_link,
      shop_type: item.shop_type,
      display_order: idx,
    }));

    const { error: itemsErr } = await supabase.from("outfit_items").insert(items);
    if (itemsErr) {
      console.warn(`  [${i + 1}] Items insert failed for "${outfit.title}": ${itemsErr.message}`);
    }

    console.log(`  [${i + 1}/20] ✓ "${outfit.title}" — ${outfit.items.length} items`);
    inserted++;
  }

  console.log(`\nDone. ${inserted} outfits inserted, ${failed} failed.`);

  // Verify
  const { count } = await supabase
    .from("outfits")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", userId);
  console.log(`Total outfits for this user: ${count}`);
}

seed().catch((err) => {
  console.error("Seed script crashed:", err);
  process.exit(1);
});
