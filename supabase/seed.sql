-- FYTD Seed Data
-- Run AFTER 001_initial.sql.
-- Creates a seed creator profile and inserts all 12 mock outfits.
-- Replace SEED_USER_ID with the UUID of a real user created via signup.

-- Step 1: Sign up at /auth/signup, then run:
--   SELECT id FROM auth.users LIMIT 1;
-- Paste that UUID below:

DO $$
DECLARE
  creator_id UUID := '00000000-0000-0000-0000-000000000000'; -- ← replace with real user UUID
  o1 UUID; o2 UUID; o3 UUID; o4 UUID; o5 UUID; o6 UUID;
  o7 UUID; o8 UUID; o9 UUID; o10 UUID; o11 UUID; o12 UUID;
BEGIN

-- Update the seed creator profile to match mock user
UPDATE profiles SET
  username     = 'devlinfits',
  display_name = 'Devlin',
  bio          = 'Clean fits, streetwear, campus style, and everyday essentials.',
  location     = 'New York, NY',
  style_tags   = ARRAY['Streetwear', 'Minimal', 'Neutral', 'Campus'],
  is_creator   = TRUE
WHERE id = creator_id;

-- ── Outfit 1: Tokyo Streetwear ────────────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Tokyo Streetwear',
  'Oversized layers and bold graphics inspired by Harajuku culture. This fit balances volume with clean silhouettes for maximum street cred.',
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
  ARRAY['streetwear', 'minimal'], TRUE)
RETURNING id INTO o1;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o1, 'Active Jacket',   'Carhartt WIP', 'Outerwear', 185, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o1, 'Stock Logo Tee',  'Stüssy',       'Top',       42,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o1, 'Cargo Trousers',  'WTAPS',        'Bottoms',   220, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80', '#', 'similar', 3),
(o1, '992 Grey',        'New Balance',  'Footwear',  150, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', '#', 'exact',   4);

-- ── Outfit 2: Old Money Weekend ───────────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Old Money Weekend',
  'Understated elegance for a Saturday stroll. Cashmere, tailored trousers, and heritage accessories define this effortlessly affluent look.',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
  ARRAY['old money', 'clean fit', 'casual'], TRUE)
RETURNING id INTO o2;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o2, 'Cashmere Crewneck', 'Polo Ralph Lauren', 'Top',        298,  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o2, 'Slim Chino Pant',   'J.Crew',            'Bottoms',    98,   'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o2, 'Horsebit Loafer',   'Gucci',             'Footwear',   790,  'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80', '#', 'similar', 3),
(o2, 'Datejust 36',       'Rolex',             'Accessories',7500, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80', '#', 'exact',   4);

-- ── Outfit 3: Minimal Monday ──────────────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Minimal Monday',
  'Monochromatic tones and clean cuts. This look proves that less is always more — every piece earns its place.',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  ARRAY['minimal', 'clean fit'], TRUE)
RETURNING id INTO o3;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o3, 'Oversized Cotton Shirt', 'COS',            'Top',     89,  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o3, 'Max Cash Jeans',         'Acne Studios',   'Bottoms', 280, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o3, 'Achilles Low White',     'Common Projects','Footwear',455, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', '#', 'similar', 3);

-- ── Outfit 4: Summer Vacation Vibes ──────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Summer Vacation Vibes',
  'Breezy linen, warm tones, and effortless resort-ready style. Built for golden-hour walks and beachside dining.',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80',
  ARRAY['summer', 'casual', 'minimal'], TRUE)
RETURNING id INTO o4;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o4, 'Relaxed Linen Shirt', 'Linen Tales',  'Top',        75,  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o4, 'Moorea Swim Short',   'Vilebrequin',  'Bottoms',    285, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o4, 'Arizona Sandal',      'Birkenstock',  'Footwear',   110, 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&q=80', '#', 'exact',   3),
(o4, 'Wayfarer Sunglasses', 'Ray-Ban',      'Accessories',178, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80', '#', 'similar', 4);

-- ── Outfit 5: Gym to Street ───────────────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Gym to Street',
  'Elevated athleisure that transitions seamlessly from a workout to a coffee run. Technical fabrics, clean lines.',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
  ARRAY['gym fit', 'streetwear', 'casual'], TRUE)
RETURNING id INTO o5;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o5, 'Metal Vent Tech Tee', 'Lululemon', 'Top',        78,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o5, 'Crest Jogger',        'Gymshark',  'Bottoms',    55,  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o5, 'Air Max 270',         'Nike',      'Footwear',   130, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', '#', 'exact',   3),
(o5, 'Running Cap',         'Hoka',      'Accessories',35,  'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=400&q=80', '#', 'similar', 4);

-- ── Outfit 6: Clean Office Fit ───────────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Clean Office Fit',
  'Sharp, professional, and quietly confident. This office-ready look balances structure with subtle personality.',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
  ARRAY['formal', 'clean fit', 'old money'], TRUE)
RETURNING id INTO o6;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o6, 'Tailored Blazer',    'Theory',          'Outerwear',  465,  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o6, 'Silk Blouse',        'Equipment',       'Top',        218,  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o6, 'High-Waist Trousers','Zara',            'Bottoms',    89,   'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80', '#', 'exact',   3),
(o6, 'Nudist Sandal',      'Stuart Weitzman', 'Footwear',   398,  'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&q=80', '#', 'similar', 4),
(o6, 'Arco Tote',          'Bottega Veneta',  'Accessories',2850, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80', '#', 'exact',   5);

-- ── Outfit 7: Casual Coffee Run ───────────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Casual Coffee Run',
  'The perfect nothing-to-prove weekend outfit. Relaxed, lived-in, and effortlessly cool for those low-key days.',
  'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80',
  ARRAY['casual', 'minimal'], TRUE)
RETURNING id INTO o7;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o7, 'Reverse Weave Hoodie','Champion', 'Top',     70, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80', '#', 'exact', 1),
(o7, '501 Original Jeans',  'Levi''s',  'Bottoms', 98, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80', '#', 'exact', 2),
(o7, 'Stan Smith',          'Adidas',   'Footwear',90, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', '#', 'exact', 3);

-- ── Outfit 8: NYC Underground ─────────────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'NYC Underground',
  'Dark, layered, and intentional. This underground NYC-inspired look is for those who move through the city with purpose.',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  ARRAY['streetwear', 'minimal'], TRUE)
RETURNING id INTO o8;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o8, 'Bauhaus Jacket',   'Rick Owens',      'Outerwear', 1850, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80', '#', 'similar', 1),
(o8, 'Box Tee Black',    'Our Legacy',      'Top',       145,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o8, 'Wide Leg Trouser', 'Yohji Yamamoto',  'Bottoms',   680,  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80', '#', 'exact',   3),
(o8, '1460 Boot Black',  'Dr. Martens',     'Footwear',  160,  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', '#', 'exact',   4);

-- ── Outfit 9: Beach Club Ready ────────────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Beach Club Ready',
  'Sun-drenched and effortless. This beach club look is all about lightweight fabrics, warm tones, and confident simplicity.',
  'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
  ARRAY['summer', 'casual', 'clean fit'], TRUE)
RETURNING id INTO o9;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o9, 'Floral Wrap Top',        'Faithfull the Brand',   'Top',        149, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o9, 'High-Rise Bikini Bottom','Solid & Striped',        'Bottoms',    78,  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o9, 'Ikaria Sandal',          'Ancient Greek Sandals',  'Footwear',   195, 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&q=80', '#', 'similar', 3),
(o9, 'Le Chiquito Bag',        'Jacquemus',              'Accessories',540, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80', '#', 'exact',   4);

-- ── Outfit 10: Business Casual Refined ───────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Business Casual Refined',
  'The modern gentleman''s uniform. Heritage brands, precise tailoring, and quiet confidence in every stitch.',
  'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=800&q=80',
  ARRAY['old money', 'formal', 'clean fit'], TRUE)
RETURNING id INTO o10;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o10, 'Linen Sport Coat',   'Brunello Cucinelli','Outerwear',  2400, 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o10, 'Bengal Stripe Shirt','Turnbull & Asser',  'Top',        350,  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o10, 'Slim Wool Trouser',  'Incotex',           'Bottoms',    320,  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80', '#', 'exact',   3),
(o10, 'Chelsea Boot Tan',   'Edward Green',      'Footwear',   950,  'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80', '#', 'similar', 4),
(o10, 'Twill Pocket Square','Hermès',            'Accessories',210,  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80', '#', 'exact',   5);

-- ── Outfit 11: Athleisure Elevated ───────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Athleisure Elevated',
  'Where performance meets polish. Elevated athleisure that looks equally at home in a pilates class or a brunch spot.',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
  ARRAY['gym fit', 'casual', 'clean fit'], TRUE)
RETURNING id INTO o11;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o11, 'Airlift Crop Tank',  'Alo Yoga', 'Top',     62,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o11, 'Effortless Legging', 'Vuori',    'Bottoms', 98,  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o11, 'Century Zip Up',     'Varley',   'Outerwear',115,'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80', '#', 'exact',   3),
(o11, 'Cloud 5 White',      'On Running','Footwear',140,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', '#', 'similar', 4);

-- ── Outfit 12: Evening Out Minimal ───────────────────────────────────────────
INSERT INTO outfits (id, creator_id, title, description, image_url, tags, published)
VALUES (gen_random_uuid(), creator_id, 'Evening Out Minimal',
  'Sleek, understated, and dressed for the night. This minimal evening look lets quality and confidence do the talking.',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
  ARRAY['minimal', 'formal', 'clean fit'], TRUE)
RETURNING id INTO o12;

INSERT INTO outfit_items (outfit_id, name, brand, category, price, image_url, shop_link, shop_type, display_order) VALUES
(o12, 'Leila Silk Blouse', 'The Row',       'Top',        890,  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80', '#', 'exact',   1),
(o12, 'Slim Crepe Trouser','Saint Laurent', 'Bottoms',    750,  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80', '#', 'exact',   2),
(o12, 'BB Pump Black',     'Manolo Blahnik','Footwear',   725,  'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&q=80', '#', 'similar', 3),
(o12, 'Puzzle Bag Small',  'Loewe',         'Accessories',2650, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80', '#', 'exact',   4);

END $$;
