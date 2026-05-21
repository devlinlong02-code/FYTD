import { Outfit } from "@/types";

function singleMedia(url: string, type: "image" | "video" = "image") {
  return [{ media_url: url, media_type: type, position: 0 }];
}

export const outfits: Outfit[] = [
  {
    id: "1",
    title: "Tokyo Streetwear",
    creatorName: "Kenji Mori",
    creatorHandle: "@kenjimori",
    creatorAvatar: "https://i.pravatar.cc/150?img=11",
    image:
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80"),
    description:
      "Oversized layers and bold graphics inspired by Harajuku culture. This fit balances volume with clean silhouettes for maximum street cred.",
    tags: ["streetwear", "minimal"],
    items: [
      {
        id: "1-1",
        category: "Outerwear",
        brand: "Carhartt WIP",
        name: "Active Jacket",
        price: 185,
        image:
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "1-2",
        category: "Top",
        brand: "Stüssy",
        name: "Stock Logo Tee",
        price: 42,
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "1-3",
        category: "Bottoms",
        brand: "WTAPS",
        name: "Cargo Trousers",
        price: 220,
        image:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
      {
        id: "1-4",
        category: "Footwear",
        brand: "New Balance",
        name: "992 Grey",
        price: 150,
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
    ],
  },
  {
    id: "2",
    title: "Old Money Weekend",
    creatorName: "Charlotte Wells",
    creatorHandle: "@charlottewells",
    creatorAvatar: "https://i.pravatar.cc/150?img=5",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80"),
    description:
      "Understated elegance for a Saturday stroll. Cashmere, tailored trousers, and heritage accessories define this effortlessly affluent look.",
    tags: ["old money", "clean fit", "casual"],
    items: [
      {
        id: "2-1",
        category: "Top",
        brand: "Polo Ralph Lauren",
        name: "Cashmere Crewneck",
        price: 298,
        image:
          "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "2-2",
        category: "Bottoms",
        brand: "J.Crew",
        name: "Slim Chino Pant",
        price: 98,
        image:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "2-3",
        category: "Footwear",
        brand: "Gucci",
        name: "Horsebit Loafer",
        price: 790,
        image:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
      {
        id: "2-4",
        category: "Accessories",
        brand: "Rolex",
        name: "Datejust 36",
        price: 7500,
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
    ],
  },
  {
    id: "3",
    title: "Minimal Monday",
    creatorName: "Seo Ji-hoon",
    creatorHandle: "@seojihoon",
    creatorAvatar: "https://i.pravatar.cc/150?img=12",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"),
    description:
      "Monochromatic tones and clean cuts. This look proves that less is always more — every piece earns its place.",
    tags: ["minimal", "clean fit"],
    items: [
      {
        id: "3-1",
        category: "Top",
        brand: "COS",
        name: "Oversized Cotton Shirt",
        price: 89,
        image:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "3-2",
        category: "Bottoms",
        brand: "Acne Studios",
        name: "Max Cash Jeans",
        price: 280,
        image:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "3-3",
        category: "Footwear",
        brand: "Common Projects",
        name: "Achilles Low White",
        price: 455,
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
    ],
  },
  {
    id: "4",
    title: "Summer Vacation Vibes",
    creatorName: "Mia Torres",
    creatorHandle: "@mia.torres",
    creatorAvatar: "https://i.pravatar.cc/150?img=9",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80"),
    description:
      "Breezy linen, warm tones, and effortless resort-ready style. Built for golden-hour walks and beachside dining.",
    tags: ["summer", "casual", "minimal"],
    items: [
      {
        id: "4-1",
        category: "Top",
        brand: "Linen Tales",
        name: "Relaxed Linen Shirt",
        price: 75,
        image:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "4-2",
        category: "Bottoms",
        brand: "Vilebrequin",
        name: "Moorea Swim Short",
        price: 285,
        image:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "4-3",
        category: "Footwear",
        brand: "Birkenstock",
        name: "Arizona Sandal",
        price: 110,
        image:
          "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "4-4",
        category: "Accessories",
        brand: "Ray-Ban",
        name: "Wayfarer Sunglasses",
        price: 178,
        image:
          "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
    ],
  },
  {
    id: "5",
    title: "Gym to Street",
    creatorName: "Marcus Reid",
    creatorHandle: "@marcusreid",
    creatorAvatar: "https://i.pravatar.cc/150?img=14",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80"),
    description:
      "Elevated athleisure that transitions seamlessly from a workout to a coffee run. Technical fabrics, clean lines.",
    tags: ["gym fit", "streetwear", "casual"],
    items: [
      {
        id: "5-1",
        category: "Top",
        brand: "Lululemon",
        name: "Metal Vent Tech Tee",
        price: 78,
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "5-2",
        category: "Bottoms",
        brand: "Gymshark",
        name: "Crest Jogger",
        price: 55,
        image:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "5-3",
        category: "Footwear",
        brand: "Nike",
        name: "Air Max 270",
        price: 130,
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "5-4",
        category: "Accessories",
        brand: "Hoka",
        name: "Running Cap",
        price: 35,
        image:
          "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
    ],
  },
  {
    id: "6",
    title: "Clean Office Fit",
    creatorName: "Priya Sharma",
    creatorHandle: "@priya.sharma",
    creatorAvatar: "https://i.pravatar.cc/150?img=6",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80"),
    description:
      "Sharp, professional, and quietly confident. This office-ready look balances structure with subtle personality.",
    tags: ["formal", "clean fit", "old money"],
    items: [
      {
        id: "6-1",
        category: "Outerwear",
        brand: "Theory",
        name: "Tailored Blazer",
        price: 465,
        image:
          "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "6-2",
        category: "Top",
        brand: "Equipment",
        name: "Silk Blouse",
        price: 218,
        image:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "6-3",
        category: "Bottoms",
        brand: "Zara",
        name: "High-Waist Trousers",
        price: 89,
        image:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "6-4",
        category: "Footwear",
        brand: "Stuart Weitzman",
        name: "Nudist Sandal",
        price: 398,
        image:
          "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
      {
        id: "6-5",
        category: "Accessories",
        brand: "Bottega Veneta",
        name: "Arco Tote",
        price: 2850,
        image:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
    ],
  },
  {
    id: "7",
    title: "Casual Coffee Run",
    creatorName: "Jake Novak",
    creatorHandle: "@jakenovak",
    creatorAvatar: "https://i.pravatar.cc/150?img=15",
    image:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80"),
    description:
      "The perfect nothing-to-prove weekend outfit. Relaxed, lived-in, and effortlessly cool for those low-key days.",
    tags: ["casual", "minimal"],
    items: [
      {
        id: "7-1",
        category: "Top",
        brand: "Champion",
        name: "Reverse Weave Hoodie",
        price: 70,
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "7-2",
        category: "Bottoms",
        brand: "Levi's",
        name: "501 Original Jeans",
        price: 98,
        image:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "7-3",
        category: "Footwear",
        brand: "Adidas",
        name: "Stan Smith",
        price: 90,
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
    ],
  },
  {
    id: "8",
    title: "NYC Underground",
    creatorName: "Dev Rao",
    creatorHandle: "@devrao__",
    creatorAvatar: "https://i.pravatar.cc/150?img=13",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"),
    description:
      "Dark, layered, and intentional. This underground NYC-inspired look is for those who move through the city with purpose.",
    tags: ["streetwear", "minimal"],
    items: [
      {
        id: "8-1",
        category: "Outerwear",
        brand: "Rick Owens",
        name: "Bauhaus Jacket",
        price: 1850,
        image:
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
      {
        id: "8-2",
        category: "Top",
        brand: "Our Legacy",
        name: "Box Tee Black",
        price: 145,
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "8-3",
        category: "Bottoms",
        brand: "Yohji Yamamoto",
        name: "Wide Leg Trouser",
        price: 680,
        image:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "8-4",
        category: "Footwear",
        brand: "Dr. Martens",
        name: "1460 Boot Black",
        price: 160,
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
    ],
  },
  {
    id: "9",
    title: "Beach Club Ready",
    creatorName: "Sofia Reyes",
    creatorHandle: "@sofiareyes",
    creatorAvatar: "https://i.pravatar.cc/150?img=10",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80"),
    description:
      "Sun-drenched and effortless. This beach club look is all about lightweight fabrics, warm tones, and confident simplicity.",
    tags: ["summer", "casual", "clean fit"],
    items: [
      {
        id: "9-1",
        category: "Top",
        brand: "Faithfull the Brand",
        name: "Floral Wrap Top",
        price: 149,
        image:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "9-2",
        category: "Bottoms",
        brand: "Solid & Striped",
        name: "High-Rise Bikini Bottom",
        price: 78,
        image:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "9-3",
        category: "Footwear",
        brand: "Ancient Greek Sandals",
        name: "Ikaria Sandal",
        price: 195,
        image:
          "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
      {
        id: "9-4",
        category: "Accessories",
        brand: "Jacquemus",
        name: "Le Chiquito Bag",
        price: 540,
        image:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
    ],
  },
  {
    id: "10",
    title: "Business Casual Refined",
    creatorName: "Oliver Banks",
    creatorHandle: "@oliverbanks",
    creatorAvatar: "https://i.pravatar.cc/150?img=7",
    image:
      "https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=800&q=80"),
    description:
      "The modern gentleman's uniform. Heritage brands, precise tailoring, and quiet confidence in every stitch.",
    tags: ["old money", "formal", "clean fit"],
    items: [
      {
        id: "10-1",
        category: "Outerwear",
        brand: "Brunello Cucinelli",
        name: "Linen Sport Coat",
        price: 2400,
        image:
          "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "10-2",
        category: "Top",
        brand: "Turnbull & Asser",
        name: "Bengal Stripe Shirt",
        price: 350,
        image:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "10-3",
        category: "Bottoms",
        brand: "Incotex",
        name: "Slim Wool Trouser",
        price: 320,
        image:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "10-4",
        category: "Footwear",
        brand: "Edward Green",
        name: "Chelsea Boot Tan",
        price: 950,
        image:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
      {
        id: "10-5",
        category: "Accessories",
        brand: "Hermès",
        name: "Twill Pocket Square",
        price: 210,
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
    ],
  },
  {
    id: "11",
    title: "Athleisure Elevated",
    creatorName: "Zara Kim",
    creatorHandle: "@zarakim__",
    creatorAvatar: "https://i.pravatar.cc/150?img=8",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80"),
    description:
      "Where performance meets polish. Elevated athleisure that looks equally at home in a pilates class or a brunch spot.",
    tags: ["gym fit", "casual", "clean fit"],
    items: [
      {
        id: "11-1",
        category: "Top",
        brand: "Alo Yoga",
        name: "Airlift Crop Tank",
        price: 62,
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "11-2",
        category: "Bottoms",
        brand: "Vuori",
        name: "Effortless Legging",
        price: 98,
        image:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "11-3",
        category: "Outerwear",
        brand: "Varley",
        name: "Century Zip Up",
        price: 115,
        image:
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "11-4",
        category: "Footwear",
        brand: "On Running",
        name: "Cloud 5 White",
        price: 140,
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
    ],
  },
  {
    id: "12",
    title: "Evening Out Minimal",
    creatorName: "Elena Voss",
    creatorHandle: "@elenavoss",
    creatorAvatar: "https://i.pravatar.cc/150?img=4",
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    media: singleMedia("https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"),
    description:
      "Sleek, understated, and dressed for the night. This minimal evening look lets quality and confidence do the talking.",
    tags: ["minimal", "formal", "clean fit"],
    items: [
      {
        id: "12-1",
        category: "Top",
        brand: "The Row",
        name: "Leila Silk Blouse",
        price: 890,
        image:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "12-2",
        category: "Bottoms",
        brand: "Saint Laurent",
        name: "Slim Crepe Trouser",
        price: 750,
        image:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
      {
        id: "12-3",
        category: "Footwear",
        brand: "Manolo Blahnik",
        name: "BB Pump Black",
        price: 725,
        image:
          "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "similar",
      },
      {
        id: "12-4",
        category: "Accessories",
        brand: "Loewe",
        name: "Puzzle Bag Small",
        price: 2650,
        image:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80",
        shopLink: "#",
        shopType: "exact",
      },
    ],
  },
];
