const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const { attachVariantAvailability } = require('../utils/productAvailability');

const CACHE_TTL_MS = 30 * 1000;
let catalogueCache = null;
let catalogueCacheTime = 0;

const toImageUrl = (product) => product.thumbnail || product.image_url || null;

exports.getCatalogue = async (req, res, next) => {
    try {
        const now = Date.now();
        if (catalogueCache && now - catalogueCacheTime < CACHE_TTL_MS) {
            res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
            return formatResponse(res, 200, true, 'Catalogue fetched from cache', catalogueCache);
        }

        const [productsResult, categoriesResult, brandsResult] = await Promise.all([
            db.query(`
                SELECT
                    p.*,
                    c.name AS category_name,
                    c.slug AS category_slug,
                    p_cat.name AS parent_category_name,
                    p_cat.slug AS parent_category_slug,
                    b.name AS brand_name,
                    b.slug AS brand_slug,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', v.id,
                                'color', v.color,
                                'size', v.size,
                                'stock', v.stock_quantity,
                                'price_override', v.price_modifier,
                                'image_url', v.image_url,
                                'sku', COALESCE(v.sku, v.stock_id),
                                'stock_id', COALESCE(v.sku, v.stock_id)
                            )
                            ORDER BY v.color, v.size
                        ) FILTER (WHERE v.id IS NOT NULL),
                        '[]'
                    ) AS variants
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN product_variants v ON p.id = v.product_id
                WHERE p.is_active = true
                GROUP BY p.id, c.name, c.slug, p_cat.name, p_cat.slug, b.name, b.slug
                ORDER BY p.created_at DESC
            `),
            db.query('SELECT * FROM categories ORDER BY name ASC'),
            db.query('SELECT * FROM brands ORDER BY name ASC'),
        ]);

        let products = productsResult.rows.map((product) => ({
            ...product,
            image_url: toImageUrl(product),
        }));

        products = await attachVariantAvailability(products);

        const ads = products
            .filter((product) => product.is_featured || product.online_in_stock)
            .slice(0, 12)
            .map((product) => ({
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image_url: toImageUrl(product),
                description: product.description || '',
                brand_name: product.brand_name,
                category_name: product.category_name,
            }));

        const imageUrls = [...new Set(products.map(toImageUrl).filter(Boolean))];

        catalogueCache = {
            generated_at: new Date().toISOString(),
            products,
            categories: categoriesResult.rows,
            brands: brandsResult.rows,
            ads,
            image_urls: imageUrls,
        };
        catalogueCacheTime = now;

        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
        formatResponse(res, 200, true, 'Catalogue fetched successfully', catalogueCache);
    } catch (error) {
        next(error);
    }
};

exports.getCatalogueAds = async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT
                p.id,
                p.slug,
                p.name,
                p.price,
                p.thumbnail AS image_url,
                p.description,
                c.name AS category_name,
                b.name AS brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.is_active = true
            ORDER BY p.is_featured DESC, p.created_at DESC
            LIMIT 24
        `);

        const ads = result.rows.map((product) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            description: product.description || '',
            category_name: product.category_name,
            brand_name: product.brand_name,
        }));

        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=180');
        formatResponse(res, 200, true, 'Catalogue ads fetched successfully', ads);
    } catch (error) {
        next(error);
    }
};
