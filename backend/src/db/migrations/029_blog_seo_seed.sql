-- Seed Prince Esquire blog content for SEO and editorial visibility.
-- Posts use featured images already present on the website.

WITH seed_posts (
  title,
  slug,
  excerpt,
  content,
  category,
  author_name,
  product_slug,
  days_ago
) AS (
  VALUES
    (
      'How to Style Khaki Trousers for Nairobi Workweeks',
      'how-to-style-khaki-trousers-for-nairobi-workweeks',
      'A practical guide to wearing khaki trousers with shirts, loafers, and lightweight layers for office days, dinners, and weekend plans in Kenya.',
      $$Khaki trousers are one of the most useful items in a modern menswear rotation. In Nairobi, they work because they can move between office, lunch, travel, and evening plans without looking forced. The best approach is to keep the silhouette clean and let the rest of the outfit do the talking.

Start with a fitted shirt for structure. A white or pale blue shirt works when you need formality. A knit polo or a sharp casual shirt makes the same trousers feel more relaxed. If you want depth, add a navy blazer or a lightweight jacket so the outfit keeps its shape.

Footwear changes the mood immediately. Loafers make khaki trousers feel polished. Casual derbies or clean sneakers push the look toward relaxed smart casual. Keep belts, watches, and bags simple so the trousers remain the anchor piece.

For Nairobi wardrobes, the safest styling formula is this: one clean trouser, one strong shirt, one pair of dependable shoes. That formula sells because it is easy to repeat and easy to trust.$$,
      'Style Guide',
      'Prince Esquire Editorial',
      'black-smart-series-flex-waistband-khakis-showroom',
      0
    ),
    (
      'Why a Tailored Suit Still Matters in 2026',
      'why-a-tailored-suit-still-matters-in-2026',
      'Tailored suits still matter because they give structure, confidence, and instant polish for weddings, meetings, and formal events in Nairobi.',
      $$A well-cut suit still has a real place in 2026. Trends move quickly, but formalwear continues to matter because it creates a clean visual line and gives the wearer instant presence. That is why a navy or charcoal suit still performs in boardrooms, weddings, and evening events.

The right suit is not only about the jacket. Fit through the shoulders, the fall of the trouser leg, and the balance between shirt and tie all matter. When those details are right, the suit looks modern instead of stiff.

For men building a wardrobe in Kenya, a dark suit is not a special occasion item only. It can be broken up and worn separately with a crisp shirt, a polished loafer, or a knit polo. That makes the purchase more useful across the year.

If you want a wardrobe that feels complete, start with one suit that fits well, then build outward with shirts, shoes, and trousers that support it.$$,
      'Style Guide',
      'Prince Esquire Editorial',
      'fabio-bironin-dark-navy-wool-two-piece-suit-pg0003-3-03',
      1
    ),
    (
      'Choosing Between Casual Derby Shoes and Loafers',
      'choosing-between-casual-derby-shoes-and-loafers',
      'A simple guide to when a derby shoe works better than a loafer, and how both fit into a polished Nairobi wardrobe.',
      $$The choice between a casual derby shoe and a loafer is really a choice between two kinds of ease. A derby gives a little more structure and usually feels better when the rest of the outfit is sharper. A loafer feels lighter and often works when the outfit is already relaxed.

If you are wearing tailored trousers or a suit, a derby shoe adds balance. If you are wearing khakis, linen, or a relaxed shirt, a loafer can keep the outfit looking refined without feeling too dressed up.

For Nairobi weather and pace, both styles are useful. A derby works for days when you need to move through meetings, errands, and dinner with one pair of shoes. A loafer is a strong pick for weekend dressing, travel, and smart casual looks where comfort matters as much as polish.

The easiest rule is to buy the shoe you will reach for most. A useful shoe rotation is always better than a perfect shoe that stays in the box.$$,
      'Style Guide',
      'Prince Esquire Editorial',
      'clarks-black-casual-derby-sneaker',
      2
    ),
    (
      'How to Wear a Statement Shirt Without Overdoing It',
      'how-to-wear-a-statement-shirt-without-overdoing-it',
      'Patterned shirts can elevate a wardrobe when you keep the rest of the outfit quiet and let the shirt lead the look.',
      $$A statement shirt works best when the rest of the outfit steps back. Strong patterns, contrast collars, and detailed prints can look sharp, but they need balance. That balance is what turns a loud piece into a useful one.

In a Nairobi setting, a patterned shirt is ideal for events where you want personality without losing polish. Wear it with neutral trousers, simple shoes, and minimal accessories. If the shirt is detailed, keep the jacket plain. If the shirt is bold, let the trousers be calm.

The real trick is proportion. Choose a shirt that sits clean on the shoulders and closes neatly at the chest. If the fit is too loose, the pattern feels messy. If the fit is too tight, the whole look looks forced.

Statement shirts are useful because they let a man bring energy into a wardrobe without rebuilding everything else around them.$$,
      'Fashion Tips',
      'Prince Esquire Editorial',
      'presidential-blue-paisley-p6-6',
      3
    ),
    (
      'Weekend Dressing With Luxury Tracksuits',
      'weekend-dressing-with-luxury-tracksuits',
      'Luxury tracksuits are no longer just casual clothing. Styled well, they can work for travel, off-duty errands, and relaxed social plans.',
      $$A good tracksuit has moved far beyond gym wear. When the fabric is clean, the fit is sharp, and the branding is restrained, it becomes a weekend uniform that feels current and deliberate.

For off-duty dressing in Nairobi, a luxury tracksuit works best with clean sneakers and a simple outer layer. Do not overcrowd it with loud accessories. The appeal is in the ease. You want the outfit to feel relaxed but still intentional.

This is also where texture matters. A better fabric drapes properly and keeps its shape through the day. That means the tracksuit can hold up during travel, errands, or informal meetings without looking tired by midday.

The best off-duty wardrobes are not the ones with the most clothes. They are the ones with pieces that can be repeated without losing their edge.$$,
      'Lifestyle',
      'Prince Esquire Editorial',
      'prada-black-tracksuit-753',
      4
    ),
    (
      'Why Neutral Colors Sell the Hardest in Menswear',
      'why-neutral-colors-sell-the-hardest-in-menswear',
      'Neutral tones like taupe, cream, olive, and beige are the easiest way to build a premium wardrobe that stays flexible all year.',
      $$Neutral colors sell because they give the wardrobe range. Taupe, cream, olive, beige, and charcoal can move across different outfits without fighting each other. That makes getting dressed faster and makes each purchase work harder.

For men building a wardrobe in Kenya, neutral tones are the foundation pieces. They pair easily with navy, black, white, and brown, which means they support both casual and formal dressing. A neutral trouser can sit next to a statement shirt, a plain polo, or a dark blazer without breaking the look.

There is also a visual reason they work. Neutral colors look calm in photographs, clean in real life, and timeless across seasons. That is why they remain a strong choice for shoppers who want a wardrobe that lasts longer than one trend cycle.

If you are starting from scratch, build around one neutral trouser, one dark shoe, one crisp shirt, and one clean jacket. Those four pieces will do more than a crowded closet.$$,
      'Trends',
      'Prince Esquire Editorial',
      'taupe-tapered-fit-khaki-showroom',
      5
    )
)
INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  category,
  author_name,
  featured_image_url,
  is_published,
  published_date,
  created_at,
  updated_at
)
SELECT
  sp.title,
  sp.slug,
  sp.excerpt,
  sp.content,
  sp.category,
  sp.author_name,
  COALESCE(p.thumbnail, '/default-blog-image.jpg'),
  true,
  NOW() - (sp.days_ago * INTERVAL '1 day'),
  NOW(),
  NOW()
FROM seed_posts sp
LEFT JOIN products p ON p.slug = sp.product_slug
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  author_name = EXCLUDED.author_name,
  featured_image_url = EXCLUDED.featured_image_url,
  is_published = true,
  published_date = COALESCE(blog_posts.published_date, EXCLUDED.published_date),
  updated_at = NOW();
