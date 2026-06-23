const db = require('./src/config/db');

const BLOG_POSTS = [
  {
    title: 'The Importance of Fit: How Getting the Perfect Size Matters',
    slug: 'fit-matters-perfect-size',
    excerpt: 'Discover why proper fit is crucial for looking your best, regardless of your clothing style or occasion.',
    content: `
# The Importance of Fit: How Getting the Perfect Size Matters

When it comes to men's fashion, nothing is more important than proper fit. Regardless of how expensive or trendy a garment may be, if it doesn't fit well, it won't look good. At Prince Esquire, we understand that the perfect fit is the foundation of style.

## Why Fit Matters

A well-fitting suit or shirt does more than just look good—it enhances your confidence and makes you feel ready to take on the world. Poor fit, on the other hand, can make even the most expensive piece look cheap and unflattering.

## Getting Measured

The first step to achieving the perfect fit is getting properly measured. Whether you're shopping for a suit, dress shirt, or casual wear, accurate measurements are essential. We recommend:

1. **Professional Measurements**: Visit a tailor or use our fitting guides for accurate measurements
2. **Know Your Size**: Understanding your measurements across multiple brands helps you shop with confidence
3. **Tailoring**: Don't hesitate to get items tailored for a custom fit

## Conclusion

Remember, fit is everything. Invest time in finding pieces that work with your body, and don't settle for anything less than perfect.
    `,
    category: 'Style Tips',
    author_name: 'Prince Esquire Team',
    featured_image_url: 'https://res.cloudinary.com/cresdynamics/image/upload/v1/prince-esquire/blog/fit-matters',
    is_published: true,
    views: 0,
    published_date: new Date('2024-01-15T10:00:00Z')
  },
  {
    title: 'Seasonal Trends: What Every Gentleman Should Wear This Season',
    slug: 'seasonal-trends-gentleman-wear',
    excerpt: 'Explore the latest seasonal trends and essential pieces every gentleman should have in their wardrobe.',
    content: `
# Seasonal Trends: What Every Gentleman Should Wear This Season

Fashion trends evolve with the seasons, and staying updated helps you maintain a modern wardrobe. Let's explore what's trending this season and why it matters.

## Spring/Summer Essentials

Lightweight fabrics and breathable materials are key during warmer months. Consider adding:

- Linen suits and shirts
- Lightweight chinos and trousers
- Classic white and pastel dress shirts
- Loafers and casual leather shoes

## Fall/Winter Essentials

As temperatures drop, layering becomes important. Include in your collection:

- Quality wool blazers
- Knit sweaters and cardigans
- Heavier fabrics like tweed
- Formal overcoats

## Timeless Pieces

While trends come and go, certain pieces remain forever stylish:

- Classic white dress shirt
- Navy blazer
- Well-fitted dark jeans
- Quality leather shoes

Stay fashionable while maintaining your personal style!
    `,
    category: 'Trends',
    author_name: 'Prince Esquire Team',
    featured_image_url: 'https://res.cloudinary.com/cresdynamics/image/upload/v1/prince-esquire/blog/seasonal-trends',
    is_published: true,
    views: 0,
    published_date: new Date('2024-02-01T10:00:00Z')
  },
  {
    title: 'The Art of Color Coordination: Building a Cohesive Wardrobe',
    slug: 'color-coordination-wardrobe',
    excerpt: 'Learn how to master color coordination to create stylish and professional outfits effortlessly.',
    content: `
# The Art of Color Coordination: Building a Cohesive Wardrobe

Color coordination is a fundamental skill in men's fashion. Understanding color theory helps you create harmonious outfits that look intentional and polished.

## Understanding Color Basics

Colors work in harmony when they follow these basic principles:

### Complementary Colors
Colors opposite on the color wheel create striking combinations. Think navy and gold, or burgundy and cream.

### Analogous Colors
Colors next to each other on the wheel create subtle, sophisticated looks. Examples include navy, teal, and green combinations.

### Monochromatic
Using different shades and tints of the same color creates a refined, elegant appearance.

## Building Your Palette

Start with neutral base colors:
- Navy blue
- Charcoal gray
- Black
- White
- Cream

Then add accent colors that complement your skin tone and personal style.

## Practical Tips

1. Match your belt to your shoes
2. Keep shirts and ties within 1-2 color families
3. Use accessories to add color interest
4. Remember: less is often more in men's fashion

Mastering color coordination elevates your entire wardrobe!
    `,
    category: 'Style Tips',
    author_name: 'Prince Esquire Team',
    featured_image_url: 'https://res.cloudinary.com/cresdynamics/image/upload/v1/prince-esquire/blog/color-coordination',
    is_published: true,
    views: 0,
    published_date: new Date('2024-02-15T10:00:00Z')
  },
  {
    title: 'Suit Care 101: How to Maintain Your Investment Pieces',
    slug: 'suit-care-maintenance',
    excerpt: 'Proper maintenance extends the life of your suits. Learn professional care tips to keep your investment pieces looking sharp.',
    content: `
# Suit Care 101: How to Maintain Your Investment Pieces

A quality suit is an investment. With proper care and maintenance, it can last for years while maintaining its appearance and structure.

## Storage

Proper storage is essential for suit longevity:

- Use wooden hangers with broad shoulders to maintain shape
- Store in a breathable garment bag (not plastic)
- Keep in a cool, dry place away from direct sunlight
- Ensure adequate space to prevent wrinkles

## Cleaning

### Dry Cleaning
- Dry clean sparingly—typically 2-3 times per season
- Over-cleaning damages fabric and shortens lifespan
- Use a reputable dry cleaner familiar with fine tailoring

### Brushing
- Brush your suit weekly with a soft brush to remove dust and lint
- Brush in the direction of the grain

### Airing Out
- Air out your suit after each wear
- Hang it in a well-ventilated area for 24 hours

## Repairs

Address small issues immediately:
- Loose buttons
- Small tears
- Seam damage
- Zipper issues

## Professional Help

Invest in professional tailoring for:
- Hemming
- Alterations
- Major repairs
- Cleaning and pressing

Your suit will thank you with years of reliable service!
    `,
    category: 'Maintenance',
    author_name: 'Prince Esquire Team',
    featured_image_url: 'https://res.cloudinary.com/cresdynamics/image/upload/v1/prince-esquire/blog/suit-care',
    is_published: true,
    views: 0,
    published_date: new Date('2024-03-01T10:00:00Z')
  }
];

async function seedBlogPosts() {
  try {
    console.log('🌱 Seeding blog posts...');

    for (const post of BLOG_POSTS) {
      // Check if blog post already exists
      const existing = await db.query(
        'SELECT id FROM blog_posts WHERE slug = $1',
        [post.slug]
      );

      if (existing.rows.length) {
        console.log(`⏭️  Skipping "${post.title}" (already exists)`);
        continue;
      }

      // Insert blog post
      const result = await db.query(
        `INSERT INTO blog_posts (
          title, slug, excerpt, content, category, author_name,
          featured_image_url, is_published, views, published_date,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          post.title,
          post.slug,
          post.excerpt,
          post.content,
          post.category,
          post.author_name,
          post.featured_image_url,
          post.is_published,
          post.views,
          post.published_date,
          new Date(),
          new Date()
        ]
      );

      console.log(`✅ Created blog post: "${post.title}"`);
    }

    console.log('✅ Blog posts seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedBlogPosts();
}

module.exports = { seedBlogPosts };
