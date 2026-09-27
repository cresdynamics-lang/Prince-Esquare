const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const {
  TAXONOMY_TREE,
  NAV_ANCHORS,
  TAXONOMY_VERSION,
  LEGACY_SLUG_ALIASES,
  findTaxonBySlug,
  flattenTaxonomy,
} = require('../data/taxonomy');

/** Allowed child slugs per parent from locked config (hides legacy orphans in nav) */
function allowedChildrenMap() {
  const map = {};
  const walk = (nodes, parentSlug = null) => {
    for (const n of nodes) {
      if (parentSlug) {
        if (!map[parentSlug]) map[parentSlug] = new Set();
        map[parentSlug].add(n.slug);
      }
      if (n.children?.length) walk(n.children, n.slug);
    }
  };
  walk(TAXONOMY_TREE);
  return map;
}

const ALLOWED_CHILDREN = allowedChildrenMap();
const NAV_SLUGS = new Set(flattenTaxonomy(TAXONOMY_TREE).map((r) => r.slug));

function mapCategoryRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.nav_copy || row.description || '',
    navCopy: row.nav_copy || row.description || '',
    image: row.tile_image || row.image || null,
    tileImage: row.tile_image || row.image || null,
    heroImage: row.hero_image || null,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isNavPrimary: row.is_nav_primary,
    depth: row.depth,
    isFeatured: row.is_featured,
  };
}

async function loadCategoryMap() {
  const { rows } = await db.query(
    `SELECT id, name, slug, description, nav_copy, image, tile_image, hero_image,
            parent_id, sort_order, is_nav_primary, depth, is_featured
     FROM categories`
  );
  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]));
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  return { rows, bySlug, byId };
}

function buildNavTree(rows) {
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const childrenOf = {};
  for (const r of rows) {
    if (!NAV_SLUGS.has(r.slug) && !r.is_nav_primary) continue;
    const parent = r.parent_id ? byId[r.parent_id] : null;
    const parentSlug = parent?.slug || null;
    if (parentSlug && ALLOWED_CHILDREN[parentSlug] && !ALLOWED_CHILDREN[parentSlug].has(r.slug)) {
      continue;
    }
    const key = r.parent_id || 'root';
    if (!childrenOf[key]) childrenOf[key] = [];
    childrenOf[key].push(r);
  }
  for (const list of Object.values(childrenOf)) {
    list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  }

  const walk = (parentId) =>
    (childrenOf[parentId || 'root'] || []).map((r) => ({
      ...mapCategoryRow(r),
      children: walk(r.id),
    }));

  const primaries = rows
    .filter((r) => r.is_nav_primary)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return primaries.map((p) => ({
    ...mapCategoryRow(p),
    children: walk(p.id),
  }));
}

/** GET /api/taxonomy — full nav tree + anchors */
exports.getTaxonomy = async (req, res, next) => {
  try {
    const { rows } = await loadCategoryMap();
    const primaries = rows.filter((r) => r.is_nav_primary);
    const tree = primaries.length ? buildNavTree(rows) : TAXONOMY_TREE;

    formatResponse(res, 200, true, 'Taxonomy fetched', {
      version: TAXONOMY_VERSION,
      anchors: NAV_ANCHORS,
      tree,
      legacyAliases: LEGACY_SLUG_ALIASES,
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/taxonomy/:slug — landing payload for a category node */
exports.getTaxonomyLanding = async (req, res, next) => {
  try {
    let { slug } = req.params;
    if (LEGACY_SLUG_ALIASES[slug]) slug = LEGACY_SLUG_ALIASES[slug];

    const { bySlug, byId, rows } = await loadCategoryMap();
    const cat = bySlug[slug];
    if (!cat) {
      const staticNode = findTaxonBySlug(slug);
      if (!staticNode) return formatResponse(res, 404, false, 'Category not found');
      return formatResponse(res, 200, true, 'Taxonomy landing (static)', {
        category: {
          name: staticNode.name,
          slug: staticNode.slug,
          navCopy: staticNode.copy || '',
          heroImage: staticNode.heroImage || staticNode.tileImage,
          tileImage: staticNode.tileImage,
        },
        children: (staticNode.children || []).map((c) => ({
          name: c.name,
          slug: c.slug,
          tileImage: c.tileImage,
          navCopy: c.copy || '',
        })),
        breadcrumbs: [{ name: 'Home', href: '/' }],
      });
    }

    const allowed = ALLOWED_CHILDREN[cat.slug];
    let children = rows
      .filter((r) => r.parent_id === cat.id)
      .filter((r) => !allowed || allowed.has(r.slug))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(mapCategoryRow);

    // Linen Edit tiles include linen-trousers (home under Trousers) via locked config
    const staticNode = findTaxonBySlug(cat.slug);
    if (staticNode?.children?.length) {
      const byChildSlug = new Map(children.map((c) => [c.slug, c]));
      children = staticNode.children.map((c) => {
        const fromDb = byChildSlug.get(c.slug) || bySlug[c.slug];
        return {
          name: c.name,
          slug: c.slug,
          tileImage: fromDb?.tile_image || fromDb?.tileImage || c.tileImage || null,
          navCopy: c.copy || fromDb?.nav_copy || '',
          heroImage: fromDb?.hero_image || null,
        };
      });
    }

    const breadcrumbs = [{ name: 'Home', href: '/' }];
    let walkCat = cat;
    const chain = [];
    while (walkCat) {
      chain.unshift(walkCat);
      walkCat = walkCat.parent_id ? byId[walkCat.parent_id] : null;
    }
    for (const c of chain) {
      breadcrumbs.push({ name: c.name, href: `/shop/${c.slug}`, slug: c.slug });
    }

    formatResponse(res, 200, true, 'Taxonomy landing fetched', {
      category: mapCategoryRow(cat),
      children,
      breadcrumbs,
    });
  } catch (error) {
    next(error);
  }
};

/** Resolve category ids for browse: home + descendants */
exports.resolveBrowseCategoryIds = async (slug) => {
  let resolved = slug;
  if (LEGACY_SLUG_ALIASES[slug]) resolved = LEGACY_SLUG_ALIASES[slug];

  const cat = await db.query('SELECT id FROM categories WHERE slug = $1', [resolved]);
  if (!cat.rows[0]) return { categoryIds: [], crossTag: resolved, slug: resolved };

  const rootId = cat.rows[0].id;
  const ids = await db.query(
    `WITH RECURSIVE tree AS (
       SELECT id FROM categories WHERE id = $1
       UNION ALL
       SELECT c.id FROM categories c JOIN tree t ON c.parent_id = t.id
     )
     SELECT id FROM tree`,
    [rootId]
  );

  return {
    slug: resolved,
    categoryIds: ids.rows.map((r) => r.id),
    crossTag: resolved,
  };
};
