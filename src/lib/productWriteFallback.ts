import type { PostgrestError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

function shouldRetryWithoutSubcategory(error: PostgrestError | null): boolean {
  if (!error?.message) return false;
  const m = error.message.toLowerCase();
  return m.includes("subcategory");
}

/**
 * When `products.subcategory` is not migrated, PostgREST returns 400. Retry without that field.
 */
function hasSubcategoryField(payload: object): boolean {
  return Object.prototype.hasOwnProperty.call(payload, "subcategory");
}

export async function productsUpdateSafe(client: Client, id: string, payload: ProductUpdate) {
  const first = await client.from("products").update(payload).eq("id", id);
  if (first.error && hasSubcategoryField(payload as object) && shouldRetryWithoutSubcategory(first.error)) {
    const { subcategory: _omit, ...rest } = payload as ProductUpdate & { subcategory?: unknown };
    console.warn(
      "[products] subcategory column missing — saved without it. Run: ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;",
    );
    const second = await client.from("products").update(rest).eq("id", id);
    return { ...second, omittedSubcategory: true as const };
  }
  return { ...first, omittedSubcategory: false as const };
}

export async function productsInsertSafe(client: Client, payload: ProductInsert) {
  const first = await client.from("products").insert(payload).select("id").single();
  if (first.error && hasSubcategoryField(payload as object) && shouldRetryWithoutSubcategory(first.error)) {
    const { subcategory: _omit, ...rest } = payload as ProductInsert & { subcategory?: unknown };
    console.warn("[products] subcategory column missing — insert without subcategory.");
    const second = await client.from("products").insert(rest).select("id").single();
    return { ...second, omittedSubcategory: true as const };
  }
  return { ...first, omittedSubcategory: false as const };
}

export async function productsUpsertSafe(
  client: Client,
  rows: ProductInsert[],
  options: { onConflict: string; ignoreDuplicates?: boolean },
) {
  const first = await client.from("products").upsert(rows, {
    onConflict: options.onConflict,
    ignoreDuplicates: options.ignoreDuplicates ?? false,
  });
  if (first.error && shouldRetryWithoutSubcategory(first.error)) {
    const stripped = rows.map(({ subcategory: _o, ...r }) => r);
    console.warn("[products] subcategory column missing — upsert without subcategory.");
    const second = await client.from("products").upsert(stripped, {
      onConflict: options.onConflict,
      ignoreDuplicates: options.ignoreDuplicates ?? false,
    });
    return { ...second, omittedSubcategory: true as const };
  }
  return { ...first, omittedSubcategory: false as const };
}
