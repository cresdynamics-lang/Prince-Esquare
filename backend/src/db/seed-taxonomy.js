/**
 * Upsert locked taxonomy tree + remap legacy categories/products.
 * Usage: node src/db/seed-taxonomy.js
 */
require('dotenv').config();
const db = require('../config/db');
const {
  TAXONOMY_TREE,
  LEGACY_SLUG_ALIASES,
  flattenTaxonomy,
} = require('../data/taxonomy');

async function upsertCategory({ name, slug, parentSlug, depth, copy, tileImage, heroImage, sortOrder, isNavPrimary }) {
  let parentId = null;
  if (parentSlug) {
    const p = await db.query('SELECT id FROM categories WHERE slug = $1', [parentSlug]);
    parentId = p.rows[0]?.id || null;
  }

  const existing = await db.query('SELECT id FROM categories WHERE slug = $1', [slug]);
  if (existing.rows.length) {
    const r = await db.query(
      `UPDATE categories SET
         name = $1,
         parent_id = $2,
         description = COALESCE(NULLIF($3, ''), description),
         nav_copy = $3,
         tile_image = $4,
         hero_image = $5,
         sort_order = $6,
         is_nav_primary = $7,
         depth = $8
       WHERE slug = $9
       RETURNING id, slug`,
      [name, parentId, copy || '', tileImage, heroImage, sortOrder, isNavPrimary, depth, slug]
    );
    return r.rows[0];
  }

  const r = await db.query(
    `INSERT INTO categories (
       name, slug, description, nav_copy, tile_image, hero_image,
       parent_id, sort_order, is_nav_primary, depth, is_featured
     ) VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,false)
     RETURNING id, slug`,
    [name, slug, copy || '', tileImage, heroImage, parentId, sortOrder, isNavPrimary, depth]
  );
  return r.rows[0];
}

async function seedTree() {
  // Deduplicate by slug (linen-trousers appears under Trousers and Linen Edit)
  const flat = [];
  const seen = new Set();
  for (const row of flattenTaxonomy(TAXONOMY_TREE)) {
    if (seen.has(row.slug)) continue;
    seen.add(row.slug);
    flat.push(row);
  }

  // Preserve declaration order within each depth (do NOT sort by slug)
  const sortCounter = {};
  for (const row of flat) {
    const key = row.parentSlug || '__root__';
    sortCounter[key] = (sortCounter[key] ?? 0);
    const sortOrder = sortCounter[key]++;
    await upsertCategory({
      name: row.name,
      slug: row.slug,
      parentSlug: row.parentSlug,
      depth: row.depth,
      copy: row.copy,
      tileImage: row.tileImage,
      heroImage: row.heroImage,
      sortOrder,
      isNavPrimary: row.isNavPrimary,
    });
    console.log(`upsert ${row.slug} (depth ${row.depth}, sort ${sortOrder})`);
  }
}

async function remapLegacyProducts() {
  for (const [from, to] of Object.entries(LEGACY_SLUG_ALIASES)) {
    const fromCat = await db.query('SELECT id FROM categories WHERE slug = $1', [from]);
    const toCat = await db.query('SELECT id FROM categories WHERE slug = $1', [to]);
    if (!fromCat.rows[0] || !toCat.rows[0]) {
      console.log(`skip remap ${from} → ${to} (missing category)`);
      continue;
    }
    if (fromCat.rows[0].id === toCat.rows[0].id) continue;
    const upd = await db.query(
      `UPDATE products SET category_id = $1
       WHERE category_id = $2
       RETURNING id`,
      [toCat.rows[0].id, fromCat.rows[0].id]
    );
    console.log(`remap products ${from} → ${to}: ${upd.rowCount}`);
  }
}

async function applyCrossTagsFromTaxonomy() {
  const pairs = [
    ['blazers', 'jackets'],
    ['waistcoats', 'jackets'],
    ['vests', 'jackets'],
    ['linen-trousers', 'linen-edit'],
    ['linen-shirts', 'linen-edit'],
    ['linen-set', 'linen-edit'],
  ];
  for (const [homeSlug, tag] of pairs) {
    const cat = await db.query('SELECT id FROM categories WHERE slug = $1', [homeSlug]);
    if (!cat.rows[0]) continue;
    const r = await db.query(
      `UPDATE products
       SET cross_tags = (
         SELECT ARRAY(SELECT DISTINCT x FROM unnest(COALESCE(cross_tags, '{}') || $1::text[]) AS x)
       )
       WHERE category_id = $2
       RETURNING id`,
      [[tag], cat.rows[0].id]
    );
    console.log(`cross_tag ${homeSlug} += ${tag}: ${r.rowCount} products`);
  }

  // Name heuristics: one home category, surface in second context via tag (no SKU clone)
  const heuristics = [
    {
      match: `%blazer%`,
      homeSlug: 'blazers',
      tags: ['jackets'],
    },
    {
      match: `%sport coat%`,
      homeSlug: 'blazers',
      tags: ['jackets'],
    },
    {
      match: `%waistcoat%`,
      homeSlug: 'waistcoats',
      tags: ['jackets'],
    },
    {
      match: `% vest%`,
      homeSlug: 'vests',
      tags: ['jackets'],
      altMatch: `%vest`,
    },
    {
      match: `%gilet%`,
      homeSlug: 'vests',
      tags: ['jackets'],
    },
  ];

  for (const rule of heuristics) {
    const home = await db.query('SELECT id FROM categories WHERE slug = $1', [rule.homeSlug]);
    if (!home.rows[0]) continue;
    const r = await db.query(
      `UPDATE products p
       SET category_id = $1,
           cross_tags = (
             SELECT ARRAY(SELECT DISTINCT x FROM unnest(COALESCE(p.cross_tags, '{}') || $2::text[]) AS x)
           )
       WHERE p.is_active = true
         AND (
           LOWER(p.name) LIKE LOWER($3)
           OR ($4::text IS NOT NULL AND LOWER(p.name) LIKE LOWER($4))
         )
         AND p.category_id IS DISTINCT FROM $1
       RETURNING p.id, p.name`,
      [home.rows[0].id, rule.tags, rule.match, rule.altMatch || null]
    );
    console.log(`heuristic → ${rule.homeSlug}: ${r.rowCount}`, r.rows.map((x) => x.name).slice(0, 5));
  }

  // Linen pieces by name/category already under linen-* keep linen-edit tag
  await db.query(
    `UPDATE products p
     SET cross_tags = (
       SELECT ARRAY(SELECT DISTINCT x FROM unnest(COALESCE(p.cross_tags, '{}') || ARRAY['linen-edit']) AS x)
     )
     FROM categories c
     WHERE p.category_id = c.id
       AND (
         c.slug IN ('linen-trousers', 'linen-shirts', 'linen-set')
         OR LOWER(p.name) LIKE '%linen%'
       )`
  );
  console.log('linen-edit cross_tags refreshed');
}

async function reparentKnownChildren() {
  // Ensure existing children hang under the right primary
  const moves = [
    ['blazers', 'suits'],
    ['vests', 'suits'],
    ['waistcoats', 'suits'],
    ['two-piece', 'suits'],
    ['three-piece', 'suits'],
    ['suit-sets', 'suits'],
    ['formal-shirts', 'shirts'],
    ['shirts-casual', 'shirts'],
    ['polo-t-shirts', 'shirts'],
    ['t-shirts', 'shirts'],
    ['sweat-shirts', 'shirts'],
    ['chino', 'trousers'],
    ['khaki', 'trousers'],
    ['jeans', 'trousers'],
    ['cargo', 'trousers'],
    ['linen-trousers', 'trousers'],
    ['full-jackets', 'jackets'],
    ['half-jackets', 'jackets'],
    ['track-tops', 'jackets'],
    ['formal-shoes', 'shoes'],
    ['bespoke-formal', 'shoes'],
    ['loafers', 'shoes'],
    ['casual', 'shoes'],
    ['belts', 'accessories'],
    ['ties', 'accessories'],
    ['caps', 'accessories'],
    ['hats', 'accessories'],
    ['linen-shirts', 'linen-edit'],
    ['linen-set', 'linen-edit'],
  ];
  for (const [child, parent] of moves) {
    const p = await db.query('SELECT id FROM categories WHERE slug = $1', [parent]);
    if (!p.rows[0]) continue;
    await db.query(
      `UPDATE categories SET parent_id = $1 WHERE slug = $2 AND (parent_id IS DISTINCT FROM $1)`,
      [p.rows[0].id, child]
    );
  }

  // Gift Sets = primary #7 (not under Accessories)
  await db.query(
    `UPDATE categories
     SET parent_id = NULL, is_nav_primary = true, depth = 0
     WHERE slug = 'gift-sets'`
  );

  // Linen Edit = special landing (anchor), not a top-nav primary
  await db.query(
    `UPDATE categories
     SET parent_id = NULL, is_nav_primary = false, depth = 0
     WHERE slug = 'linen-edit'`
  );
}

async function main() {
  try {
    console.log('Seeding taxonomy v2...');
    await seedTree();
    await reparentKnownChildren();
    await remapLegacyProducts();
    await applyCrossTagsFromTaxonomy();
    const primaries = await db.query(
      `SELECT name, slug FROM categories WHERE is_nav_primary = true ORDER BY sort_order`
    );
    console.log('Nav primaries:', primaries.rows.map((r) => r.slug).join(', '));
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
