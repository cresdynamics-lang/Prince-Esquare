import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Shape returned by product detail selects (slug page). Exported so callers are typed. */
export type FetchedProductDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  subcategory?: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  categories: { name: string; slug: string } | null;
  product_images: { image_url: string }[];
  product_variants: { id: string; size: string | null; color: string | null; stock_quantity: number }[];
};

/** Full card projection; requires `products.subcategory` in the database. */
export const PUBLISHED_PRODUCT_CARD_SELECT_WITH_SUB =
  "id,slug,title,price,sale_price,category_id,subcategory,product_images(image_url),product_variants(stock_quantity),categories(name,slug)";

/** Same without `subcategory` when the column is not migrated yet. */
export const PUBLISHED_PRODUCT_CARD_SELECT_FALLBACK =
  "id,slug,title,price,sale_price,category_id,product_images(image_url),product_variants(stock_quantity),categories(name,slug)";

type Client = SupabaseClient<Database>;

async function selectAllPages<T>(
  runPage: (from: number, to: number) => Promise<{ data: T[] | null; error: PostgrestError | null }>,
  pageSize = 1000,
) {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const page = await runPage(from, to);
    if (page.error) {
      return { data: null as T[] | null, error: page.error };
    }
    const pageRows = page.data ?? [];
    rows.push(...pageRows);
    if (pageRows.length < pageSize) break;
  }
  return { data: rows, error: null as PostgrestError | null };
}

/**
 * Loads published products for storefront grids. Retries without `subcategory` if the
 * first query fails (e.g. remote DB missing migration `20260502120000_products_subcategory.sql`).
 */
export async function fetchPublishedProductsForShopCards(client: Client) {
  const first = await selectAllPages((from, to) =>
    client
      .from("products")
      .select(PUBLISHED_PRODUCT_CARD_SELECT_WITH_SUB)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(from, to),
  );

  if (!first.error) {
    return { data: first.data, error: null as null, usedFallback: false };
  }

  console.warn(
    "[products] primary shop query failed; retrying without subcategory column:",
    first.error.message,
  );

  const second = await selectAllPages((from, to) =>
    client
      .from("products")
      .select(PUBLISHED_PRODUCT_CARD_SELECT_FALLBACK)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(from, to),
  );

  return {
    data: second.data,
    error: second.error,
    usedFallback: !second.error,
  };
}

const CATEGORY_PAGE_SELECT_WITH_SUB =
  "id,slug,title,price,sale_price,subcategory,product_images(image_url),product_variants(stock_quantity)";

const CATEGORY_PAGE_SELECT_FALLBACK =
  "id,slug,title,price,sale_price,product_images(image_url),product_variants(stock_quantity)";

export async function fetchPublishedProductsForCategoryPage(client: Client, categoryId: string) {
  const first = await selectAllPages((from, to) =>
    client
      .from("products")
      .select(CATEGORY_PAGE_SELECT_WITH_SUB)
      .eq("category_id", categoryId)
      .eq("is_published", true)
      .range(from, to),
  );

  if (!first.error) {
    return { data: first.data, error: null as null };
  }

  console.warn(
    "[products] category query failed; retrying without subcategory:",
    first.error.message,
  );

  const second = await selectAllPages((from, to) =>
    client
      .from("products")
      .select(CATEGORY_PAGE_SELECT_FALLBACK)
      .eq("category_id", categoryId)
      .eq("is_published", true)
      .range(from, to),
  );
  return { data: second.data, error: second.error };
}

const PRODUCT_DETAIL_SELECT_WITH_SUB =
  "id,slug,title,description,price,sale_price,subcategory,is_published,is_featured,categories(name,slug),product_images(image_url),product_variants(id,size,color,stock_quantity)";

const PRODUCT_DETAIL_SELECT_FALLBACK =
  "id,slug,title,description,price,sale_price,is_published,is_featured,categories(name,slug),product_images(image_url),product_variants(id,size,color,stock_quantity)";

/** Single product by slug; retries without `subcategory` if the column is missing. */
export async function fetchProductDetailBySlug(
  client: Client,
  slug: string,
  options: { onlyPublished: boolean },
): Promise<{ data: FetchedProductDetail | null; error: PostgrestError | null }> {
  const run = (select: string) => {
    let q = client.from("products").select(select).eq("slug", slug);
    if (options.onlyPublished) {
      q = q.eq("is_published", true);
    }
    return q.maybeSingle();
  };

  const first = await run(PRODUCT_DETAIL_SELECT_WITH_SUB);
  if (!first.error) {
    return { data: first.data as FetchedProductDetail | null, error: null };
  }

  console.warn(
    "[products] detail query failed; retrying without subcategory:",
    first.error.message,
  );

  const second = await run(PRODUCT_DETAIL_SELECT_FALLBACK);
  return { data: second.data as FetchedProductDetail | null, error: second.error };
}
