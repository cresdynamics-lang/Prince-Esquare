const { formatResponse } = require('../utils/responseFormatter');
const db = require('../config/db');
const { attachVariantAvailability } = require('../utils/productAvailability');
const { optimizeCloudinaryUrl } = require('../utils/cloudinaryImage');

const CACHE_TTL_MS = 5 * 60 * 1000;
let catalogueCache = null;
let catalogueCacheTime = 0;

exports.invalidateCatalogueCache = () => {
    catalogueCache = null;
    catalogueCacheTime = 0;
};

const toImageUrl = (product) => product.thumbnail || product.image_url || null;

exports.getCatalogue = async (req, res, next) => {
    try {
        const now = Date.now();
        if (catalogueCache && now - catalogueCacheTime < CACHE_TTL_MS) {
            res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
            return formatResponse(res, 200, true, 'Catalogue fetched from cache', catalogueCache);
        }

        const [productsResult, categoriesResult, brandsResult] = await Promise.all([
            db.query(`
                SELECT
                    p.id,
                    p.slug,
                    p.name,
                    p.price,
                    p.discount_price,
                    p.is_featured,
                    p.is_active,
                    p.stock_quantity,
                    p.thumbnail,
                    c.name AS category_name,
                    c.slug AS category_slug,
                    p_cat.name AS parent_category_name,
                    p_cat.slug AS parent_category_slug,
                    b.name AS brand_name,
                    b.slug AS brand_slug
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN categories p_cat ON c.parent_id = p_cat.id
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE p.is_active = true
                ORDER BY p.created_at DESC
            `),
            db.query('SELECT id, name, slug, parent_id FROM categories ORDER BY name ASC'),
            db.query('SELECT id, name, slug FROM brands ORDER BY name ASC'),
        ]);

        let products = productsResult.rows.map((product) => {
            const thumb = product.thumbnail;
            const gridImage = thumb
                ? optimizeCloudinaryUrl(thumb, { width: 400 })
                : null;
            return {
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                discount_price: product.discount_price,
                is_featured: product.is_featured,
                is_active: product.is_active,
                stock_quantity: product.stock_quantity,
                category_name: product.category_name,
                category_slug: product.category_slug,
                parent_category_name: product.parent_category_name,
                parent_category_slug: product.parent_category_slug,
                brand_name: product.brand_name,
                brand_slug: product.brand_slug,
                thumbnail: thumb,
                thumbnail_optimized: gridImage,
                image_url: gridImage || thumb,
            };
        });

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

        catalogueCache = {
            generated_at: new Date().toISOString(),
            products,
            categories: categoriesResult.rows,
            brands: brandsResult.rows,
            ads,
        };
        catalogueCacheTime = now;

        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
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
