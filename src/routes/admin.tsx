import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ClipboardList,
  Mail,
  Menu,
  Package,
  Percent,
  Shield,
  Tag,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatKES, STORE_INFO } from "@/lib/format";
import { fashionProductsAsCards } from "@/lib/fashionProducts";
import { ALLOWED_CATEGORY_SLUGS, CATALOG_TAXONOMY } from "@/lib/catalogTaxonomy";
import { getSubcategoriesForCategory, inferSubcategory, resolveSubcategory } from "@/lib/subcategories";
import { productsInsertSafe, productsUpdateSafe, productsUpsertSafe } from "@/lib/productWriteFallback";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ORDER_STATUSES: Enums<"order_status">[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard - Prince Esquire" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    liveProducts: 0,
    totalProducts: 0,
    lowStock: 0,
    messages: 0,
    bookings: 0,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [variantStockDrafts, setVariantStockDrafts] = useState<Record<string, string>>({});
  const [variantBusyId, setVariantBusyId] = useState<string | null>(null);
  const [autoCreatingVariants, setAutoCreatingVariants] = useState(false);
  const [fillingDescriptions, setFillingDescriptions] = useState(false);
  const [newVariant, setNewVariant] = useState({
    product_id: "",
    size: "",
    color: "",
    sku: "",
    stock_quantity: "",
  });
  const [promos, setPromos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true,
  );
  const [financeStats, setFinanceStats] = useState({
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    weeklyOrders: 0,
    monthlyOrders: 0,
    itemsSold: 0,
    soldAmount: 0,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryNameDrafts, setCategoryNameDrafts] = useState<Record<string, string>>({});
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [applyingRequiredTaxonomy, setApplyingRequiredTaxonomy] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    image_url: "",
    description: "",
  });
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [salePriceDrafts, setSalePriceDrafts] = useState<Record<string, string>>({});
  const [productDrafts, setProductDrafts] = useState<
    Record<
      string,
      {
        title: string;
        slug: string;
        category_id: string;
        subcategory: string;
        is_published: boolean;
        is_featured: boolean;
        image_url: string;
      }
    >
  >({});
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [syncingAssetProducts, setSyncingAssetProducts] = useState(false);
  const [uploadingNewProductImage, setUploadingNewProductImage] = useState(false);
  const [uploadingProductImageId, setUploadingProductImageId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  /** "all" or a category slug from `CATALOG_TAXONOMY`. */
  const [productCategorySlugFilter, setProductCategorySlugFilter] = useState<string>("all");
  /** "all" | "__none__" | subcategory label; only applies when a category slug is selected. */
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState<string>("all");
  /** Storefront = same inclusion rules as the public shop (published + approved catalog category). */
  const [productCatalogScope, setProductCatalogScope] = useState<"storefront" | "full">("full");
  const [productVisibilityFilter, setProductVisibilityFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [newProduct, setNewProduct] = useState({
    title: "",
    slug: "",
    description: "",
    category_id: "",
    subcategory: "",
    price: "",
    sale_price: "",
    image_url: "",
    is_published: true,
    is_featured: false,
  });

  const uploadImageToStorage = async (file: File) => {
    const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const fileBase = file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image";
    const filePath = `admin-uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileBase}.${fileExt}`;
    const bucket = supabase.storage.from("product-images");
    const { error: uploadError } = await bucket.upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type || undefined,
    });
    if (uploadError) throw uploadError;
    const { data } = bucket.getPublicUrl(filePath);
    return data.publicUrl;
  };

  const uploadNewProductImage = async (file: File) => {
    try {
      setUploadingNewProductImage(true);
      const publicUrl = await uploadImageToStorage(file);
      setNewProduct((p) => ({ ...p, image_url: publicUrl }));
      toast.success("Image uploaded.");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to upload image.");
    } finally {
      setUploadingNewProductImage(false);
    }
  };

  const uploadDraftProductImage = async (productId: string, file: File) => {
    try {
      setUploadingProductImageId(productId);
      const publicUrl = await uploadImageToStorage(file);
      updateProductDraft(productId, "image_url", publicUrl);
      toast.success("Image uploaded.");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to upload image.");
    } finally {
      setUploadingProductImageId(null);
    }
  };

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin, navigate]);

  const loadAll = async () => {
    if (!isAdmin) return;
    const [
      { data: os },
      { data: ps },
      { data: ms },
      { data: bs },
      { data: vs },
      { data: allVariants },
      { data: pr },
      { data: cs },
      { data: oi },
    ] =
      await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, status, total, created_at, guest_name")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("products")
          .select(
            "id, title, slug, category_id, subcategory, price, sale_price, is_published, is_featured, categories(name,slug), product_images(id,image_url,display_order)",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("contact_messages")
          .select("id, name, email, subject, message, is_read, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        (supabase as any)
          .from("bookings")
          .select("id,name,email,phone,service,booking_date,booking_time,status,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("product_variants")
          .select("id, sku, size, stock_quantity, products(title)")
          .lt("stock_quantity", 5)
          .order("stock_quantity"),
        supabase
          .from("product_variants")
          .select("id, product_id, sku, size, color, stock_quantity, products(title)")
          .order("created_at", { ascending: false }),
        supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("id,name,slug").order("display_order"),
        supabase.from("order_items").select("quantity,line_total,created_at"),
      ]);
    setOrders(os ?? []);
    setProducts(ps ?? []);
    setMessages(ms ?? []);
    setBookings(bs ?? []);
    setLowStock(vs ?? []);
    setVariants(allVariants ?? []);
    setPromos(pr ?? []);
    setCategories(cs ?? []);
    const cDrafts: Record<string, string> = {};
    (cs ?? []).forEach((c: any) => {
      cDrafts[c.id] = c.name ?? "";
    });
    setCategoryNameDrafts(cDrafts);
    const pDrafts: Record<string, string> = {};
    const sDrafts: Record<string, string> = {};
    const prDrafts: Record<
      string,
      {
        title: string;
        slug: string;
        category_id: string;
        subcategory: string;
        is_published: boolean;
        is_featured: boolean;
        image_url: string;
      }
    > = {};
    (ps ?? []).forEach((p: any) => {
      pDrafts[p.id] = String(p.price ?? "");
      sDrafts[p.id] = p.sale_price != null ? String(p.sale_price) : "";
      prDrafts[p.id] = {
        title: p.title ?? "",
        slug: p.slug ?? "",
        category_id: p.category_id ?? "",
        subcategory: p.subcategory ?? "",
        is_published: Boolean(p.is_published),
        is_featured: Boolean(p.is_featured),
        image_url: p.product_images?.[0]?.image_url ?? "",
      };
    });
    setPriceDrafts(pDrafts);
    setSalePriceDrafts(sDrafts);
    setProductDrafts(prDrafts);
    const vDrafts: Record<string, string> = {};
    (allVariants ?? []).forEach((v: any) => {
      vDrafts[v.id] = String(v.stock_quantity ?? "0");
    });
    setVariantStockDrafts(vDrafts);
    const totalRev = (os ?? []).reduce((s, o: any) => s + Number(o.total ?? 0), 0);
    const liveProducts = (ps ?? []).filter((p: any) => p.is_published).length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const weeklyOrders = (os ?? []).filter((o: any) => new Date(o.created_at).getTime() >= weekAgo);
    const monthlyOrders = (os ?? []).filter((o: any) => new Date(o.created_at).getTime() >= monthAgo);
    setFinanceStats({
      weeklyRevenue: weeklyOrders.reduce((sum: number, o: any) => sum + Number(o.total ?? 0), 0),
      monthlyRevenue: monthlyOrders.reduce((sum: number, o: any) => sum + Number(o.total ?? 0), 0),
      weeklyOrders: weeklyOrders.length,
      monthlyOrders: monthlyOrders.length,
      itemsSold: (oi ?? []).reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0),
      soldAmount: (oi ?? []).reduce((sum: number, item: any) => sum + Number(item.line_total ?? 0), 0),
    });
    setStats({
      orders: (os ?? []).length,
      revenue: totalRev,
      liveProducts,
      totalProducts: (ps ?? []).length,
      lowStock: (vs ?? []).length,
      messages: (ms ?? []).filter((m: any) => !m.is_read).length,
      bookings: (bs ?? []).filter((b: any) => b.status === "pending").length,
    });
  };

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  useEffect(() => {
    setProductSubcategoryFilter("all");
  }, [productCategorySlugFilter]);

  const taxonomyCategoryCounts = useMemo(() => {
    return CATALOG_TAXONOMY.map((g) => {
      const count = products.filter((p) => {
        if (p.categories?.slug !== g.slug) return false;
        if (productCatalogScope === "full") return true;
        const slug = p.categories?.slug as string | undefined;
        return Boolean(p.is_published && slug && ALLOWED_CATEGORY_SLUGS.has(slug));
      }).length;
      return { slug: g.slug, name: g.name, count };
    });
  }, [products, productCatalogScope]);

  const storefrontProductCount = useMemo(
    () =>
      products.filter((p) => {
        const slug = p.categories?.slug as string | undefined;
        return Boolean(p.is_published && slug && ALLOWED_CATEGORY_SLUGS.has(slug));
      }).length,
    [products],
  );

  const subcategoryFilterOptions = useMemo(() => {
    if (productCategorySlugFilter === "all") return [];
    const fromTaxonomy = getSubcategoriesForCategory(productCategorySlugFilter);
    return fromTaxonomy;
  }, [productCategorySlugFilter]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const catSlug = product.categories?.slug as string | undefined;

      if (productCatalogScope === "storefront") {
        const ok =
          Boolean(product.is_published) &&
          Boolean(catSlug && ALLOWED_CATEGORY_SLUGS.has(catSlug));
        if (!ok) return false;
      }

      if (productCategorySlugFilter !== "all" && catSlug !== productCategorySlugFilter) {
        return false;
      }

      if (productCategorySlugFilter !== "all" && productSubcategoryFilter !== "all") {
        const resolved = resolveSubcategory(
          product.subcategory,
          catSlug,
          `${product.title ?? ""} ${product.slug ?? ""}`,
        );
        if (productSubcategoryFilter === "__none__") {
          if (resolved != null) return false;
        } else if (resolved !== productSubcategoryFilter) {
          return false;
        }
      }

      const visibilityMatch =
        productVisibilityFilter === "all" ||
        (productVisibilityFilter === "published" && product.is_published) ||
        (productVisibilityFilter === "draft" && !product.is_published);
      const textMatch =
        term.length === 0 ||
        String(product.title ?? "")
          .toLowerCase()
          .includes(term) ||
        String(product.slug ?? "")
          .toLowerCase()
          .includes(term) ||
        String(resolveSubcategory(product.subcategory, catSlug, `${product.title ?? ""} ${product.slug ?? ""}`) ?? "")
          .toLowerCase()
          .includes(term);
      return visibilityMatch && textMatch;
    });
  }, [
    products,
    productCatalogScope,
    productCategorySlugFilter,
    productSubcategoryFilter,
    productVisibilityFilter,
    productSearch,
  ]);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-products-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          loadAll();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_images" },
        () => {
          loadAll();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          loadAll();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          loadAll();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const updateOrderStatus = async (id: string, status: Enums<"order_status">) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order updated");
    loadAll();
  };

  const markMessageRead = async (id: string) => {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    loadAll();
  };

  const updateBookingStatus = async (id: string, status: "pending" | "confirmed" | "completed" | "cancelled") => {
    const { error } = await (supabase as any).from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking updated");
    loadAll();
  };

  const updateProductDraft = (
    id: string,
    key: "title" | "slug" | "category_id" | "subcategory" | "is_published" | "is_featured" | "image_url",
    value: string | boolean,
  ) => {
    setProductDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const saveProduct = async (id: string) => {
    const draft = productDrafts[id];
    if (!draft) return;
    const price = Number(priceDrafts[id]);
    const saleRaw = salePriceDrafts[id];
    const salePrice = saleRaw === "" ? null : Number(saleRaw);
    if (!draft.title.trim()) {
      toast.error("Product title is required.");
      return;
    }
    if (!draft.slug.trim()) {
      toast.error("Product slug is required.");
      return;
    }
    if (Number.isNaN(price)) {
      toast.error("Price must be a valid number.");
      return;
    }
    if (salePrice !== null && Number.isNaN(salePrice)) {
      toast.error("Sale price must be a valid number.");
      return;
    }

    setSavingProductId(id);
    const { error, omittedSubcategory } = await productsUpdateSafe(supabase, id, {
      title: draft.title.trim(),
      slug: draft.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      category_id: draft.category_id || null,
      subcategory: draft.subcategory.trim() || null,
      price,
      sale_price: salePrice,
      is_published: draft.is_published,
      is_featured: draft.is_featured,
    });
    if (error) {
      setSavingProductId(null);
      toast.error(error.message);
      return;
    }
    if (omittedSubcategory) {
      toast.message(
        "Other fields saved. Add column `products.subcategory` in Supabase (or run the migration) to store subcategories.",
      );
    }

    const currentProduct = products.find((p) => p.id === id);
    const existingImageId = currentProduct?.product_images?.[0]?.id as string | undefined;
    const imageUrl = draft.image_url.trim();
    if (imageUrl) {
      if (existingImageId) {
        await supabase.from("product_images").update({ image_url: imageUrl }).eq("id", existingImageId);
      } else {
        await supabase.from("product_images").insert({ product_id: id, image_url: imageUrl, display_order: 0 });
      }
    } else if (existingImageId) {
      await supabase.from("product_images").delete().eq("id", existingImageId);
    }

    setSavingProductId(null);
    toast.success("Product updated.");
    loadAll();
  };

  const deleteProduct = async (id: string, title: string) => {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingProductId(id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    setDeletingProductId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product deleted.");
    loadAll();
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingProduct(true);
    const slug =
      newProduct.slug.trim() ||
      newProduct.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const { data, error, omittedSubcategory } = await productsInsertSafe(supabase, {
      title: newProduct.title.trim(),
      slug,
      description: newProduct.description.trim() || null,
      category_id: newProduct.category_id || null,
      subcategory: newProduct.subcategory.trim() || null,
      price: Number(newProduct.price || 0),
      sale_price: newProduct.sale_price ? Number(newProduct.sale_price) : null,
      is_published: newProduct.is_published,
      is_featured: newProduct.is_featured,
    });
    if (error || !data) {
      setCreatingProduct(false);
      toast.error(error?.message ?? "Could not create product");
      return;
    }
    if (omittedSubcategory) {
      toast.message(
        "Product created. Add `products.subcategory` in Supabase to persist subcategory on future edits.",
      );
    }
    if (newProduct.image_url.trim()) {
      await supabase.from("product_images").insert({
        product_id: data.id,
        image_url: newProduct.image_url.trim(),
        display_order: 0,
      });
    }
    setNewProduct({
      title: "",
      slug: "",
      description: "",
      category_id: "",
      subcategory: "",
      price: "",
      sale_price: "",
      image_url: "",
      is_published: true,
      is_featured: false,
    });
    setCreatingProduct(false);
    toast.success("Product created.");
    loadAll();
  };

  const syncAssetProductsToDatabase = async () => {
    setSyncingAssetProducts(true);
    try {
      const fashionCards = fashionProductsAsCards();
      const dbSlugSet = new Set(products.map((p) => String(p.slug ?? "")));
      const candidates = fashionCards.filter((p) => p.slug && p.title);

      if (candidates.length === 0) {
        toast.error("No asset products found to sync.");
        return;
      }

      const normalizeSlug = (value: string) =>
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      const normalizeName = (slug: string) =>
        slug
          .split("-")
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");

      const assetCategorySlugs = Array.from(
        new Set(
          candidates
            .map((p) => normalizeSlug(p.category_slug ?? p.category_name ?? ""))
            .filter(Boolean),
        ),
      );
      if (assetCategorySlugs.length > 0) {
        const existingCategorySlugs = new Set(categories.map((c) => String(c.slug ?? "")));
        const categoriesToInsert = assetCategorySlugs
          .filter((slug) => !existingCategorySlugs.has(slug))
          .map((slug) => ({
            slug,
            name: normalizeName(slug),
            description: null,
            image_url: null,
          }));
        if (categoriesToInsert.length > 0) {
          await supabase.from("categories").upsert(categoriesToInsert, {
            onConflict: "slug",
            ignoreDuplicates: true,
          });
        }
      }

      const { data: freshCategories } = await supabase
        .from("categories")
        .select("id,slug")
        .in("slug", assetCategorySlugs);
      const categoryIdBySlug = new Map<string, string>(
        (freshCategories ?? []).map((row: any) => [row.slug, row.id]),
      );

      const missingCards = candidates.filter((p) => !dbSlugSet.has(p.slug));
      const rowsToInsert = missingCards.map((p) => {
        const categorySlug = normalizeSlug(p.category_slug ?? p.category_name ?? "");
        const sub = inferSubcategory(
          categorySlug || undefined,
          `${p.title ?? ""} ${p.slug ?? ""}`,
        );
        return {
          slug: p.slug,
          title: p.title,
          description: p.title,
          category_id: categoryIdBySlug.get(categorySlug) ?? null,
          subcategory: sub,
          price: Number(p.price ?? 0),
          sale_price: p.sale_price != null ? Number(p.sale_price) : null,
          is_published: true,
          is_featured: false,
        };
      });

      if (rowsToInsert.length > 0) {
        const { error: insertError, omittedSubcategory } = await productsUpsertSafe(supabase, rowsToInsert, {
          onConflict: "slug",
          ignoreDuplicates: true,
        });
        if (insertError) {
          toast.error(insertError.message);
          return;
        }
        if (omittedSubcategory) {
          toast.message("Synced products without subcategory until the DB column exists.");
        }
      }

      const allSyncSlugs = candidates.map((p) => p.slug);
      const { data: syncedProducts } = await supabase
        .from("products")
        .select("id,slug")
        .in("slug", allSyncSlugs);
      const productIdBySlug = new Map<string, string>(
        (syncedProducts ?? []).map((row: any) => [row.slug, row.id]),
      );
      const syncedProductIds = Array.from(productIdBySlug.values());

      if (syncedProductIds.length > 0) {
        const { data: existingImages } = await supabase
          .from("product_images")
          .select("product_id,image_url")
          .in("product_id", syncedProductIds);
        const imageKeySet = new Set(
          (existingImages ?? []).map((img: any) => `${img.product_id}::${img.image_url}`),
        );
        const imageRows = candidates
          .filter((p) => Boolean(p.image))
          .map((p) => {
            const productId = productIdBySlug.get(p.slug);
            if (!productId || !p.image) return null;
            const key = `${productId}::${p.image}`;
            if (imageKeySet.has(key)) return null;
            imageKeySet.add(key);
            return {
              product_id: productId,
              image_url: p.image,
              display_order: 0,
            };
          })
          .filter(Boolean);
        if (imageRows.length > 0) {
          await supabase.from("product_images").insert(imageRows as any[]);
        }
      }

      const insertedCount = rowsToInsert.length;
      toast.success(
        insertedCount > 0
          ? `Sync complete: ${insertedCount} new products added to database.`
          : "Sync complete: all asset products are already in database.",
      );
      loadAll();
    } finally {
      setSyncingAssetProducts(false);
    }
  };

  const updateCategoryName = async (id: string) => {
    const name = (categoryNameDrafts[id] ?? "").trim();
    if (!name) {
      toast.error("Category name is required.");
      return;
    }
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const { error } = await supabase.from("categories").update({ name, slug }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Category updated.");
    loadAll();
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCategory(true);
    const name = newCategory.name.trim();
    const slug =
      newCategory.slug.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const { error } = await supabase.from("categories").insert({
      name,
      slug,
      image_url: newCategory.image_url.trim() || null,
      description: newCategory.description.trim() || null,
    });
    setCreatingCategory(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Category created.");
    setNewCategory({ name: "", slug: "", image_url: "", description: "" });
    loadAll();
  };

  const inferCategorySlug = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("polo")) return "polo-t-shirts";
    if (/(shoe|loafer|oxford|boot|sandal)/.test(t)) return "shoes";
    if (/(three-piece|two-piece|wedding suit|suit)/.test(t) && !t.includes("track")) return "suits";
    if (t.includes("blazer")) return "blazers";
    if (/(track|jogger|athleisure)/.test(t)) return "track-suits";
    if (/(jacket|coat|bomber)/.test(t)) return "jackets";
    if (/(khaki|chino|jean|gurkha|trouser|pant)/.test(t)) return "trousers";
    if (t.includes("linen")) return "linen";
    if (/(cap|hat)/.test(t)) return "caps-hats";
    if (/(belt|tie)/.test(t)) return "belts-ties";
    if (/(sweater|knitwear|cardigan|pullover)/.test(t)) return "sweaters";
    if (/(t-shirt|tee|sweat-shirt|round-neck|v-neck)/.test(t)) return "t-shirts";
    if (/(shirt|presidential)/.test(t)) return "shirts";
    return "shirts";
  };

  const applyRequiredTaxonomy = async () => {
    setApplyingRequiredTaxonomy(true);
    try {
      const requiredRows = CATALOG_TAXONOMY.map((cat, index) => ({
        slug: cat.slug,
        name: cat.name,
        description:
          cat.subcategories.length > 0
            ? `Subcategories: ${cat.subcategories.join(", ")}`
            : `${cat.name} collection`,
        display_order: index + 1,
      }));

      const { error: upsertError } = await supabase
        .from("categories")
        .upsert(requiredRows, { onConflict: "slug" });
      if (upsertError) {
        toast.error(upsertError.message);
        return;
      }

      const { data: freshCats, error: catReadError } = await supabase
        .from("categories")
        .select("id,slug");
      if (catReadError) {
        toast.error(catReadError.message);
        return;
      }
      const categoryIdBySlug = new Map((freshCats ?? []).map((c: any) => [c.slug, c.id]));

      for (const p of products) {
        const text = `${p.slug ?? ""} ${p.title ?? ""}`;
        const targetSlug = inferCategorySlug(text);
        const targetCategoryId = categoryIdBySlug.get(targetSlug) ?? null;
        const { error } = await supabase
          .from("products")
          .update({ category_id: targetCategoryId })
          .eq("id", p.id);
        if (error) {
          toast.error(error.message);
          return;
        }
      }

      const keepSlugs = new Set(CATALOG_TAXONOMY.map((c) => c.slug));
      const staleIds = (freshCats ?? [])
        .filter((c: any) => !keepSlugs.has(c.slug))
        .map((c: any) => c.id);
      if (staleIds.length > 0) {
        const { error: staleError } = await supabase.from("categories").delete().in("id", staleIds);
        if (staleError) {
          toast.error(staleError.message);
          return;
        }
      }

      toast.success("Required categories applied and products remapped.");
      loadAll();
    } finally {
      setApplyingRequiredTaxonomy(false);
    }
  };

  const updateVariantStock = async (variantId: string) => {
    const stock = Number(variantStockDrafts[variantId]);
    if (Number.isNaN(stock) || stock < 0) {
      toast.error("Stock must be a valid non-negative number.");
      return;
    }
    setVariantBusyId(variantId);
    const { error } = await supabase
      .from("product_variants")
      .update({ stock_quantity: stock })
      .eq("id", variantId);
    setVariantBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Stock updated.");
    loadAll();
  };

  const deleteVariant = async (variantId: string) => {
    const confirmed = window.confirm("Delete this stock variant?");
    if (!confirmed) return;
    setVariantBusyId(variantId);
    const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
    setVariantBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Variant deleted.");
    loadAll();
  };

  const createVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const stock = Number(newVariant.stock_quantity || 0);
    if (!newVariant.product_id) {
      toast.error("Choose a product for this stock row.");
      return;
    }
    if (Number.isNaN(stock) || stock < 0) {
      toast.error("Stock must be a valid non-negative number.");
      return;
    }
    const { error } = await supabase.from("product_variants").insert({
      product_id: newVariant.product_id,
      size: newVariant.size || null,
      color: newVariant.color || null,
      sku: newVariant.sku || null,
      stock_quantity: stock,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Variant added.");
    setNewVariant({ product_id: "", size: "", color: "", sku: "", stock_quantity: "" });
    loadAll();
  };

  const autoCreateDefaultVariants = async () => {
    setAutoCreatingVariants(true);
    try {
      const { data: allProducts, error: productsError } = await supabase
        .from("products")
        .select("id,slug,title,category_id,categories(name)");
      if (productsError) {
        toast.error(productsError.message);
        return;
      }
      const { data: allExistingVariants, error: variantsError } = await supabase
        .from("product_variants")
        .select("product_id,sku");
      if (variantsError) {
        toast.error(variantsError.message);
        return;
      }
      const productsWithVariants = new Set((allExistingVariants ?? []).map((v: any) => v.product_id));
      const existingSkus = new Set((allExistingVariants ?? []).map((v: any) => String(v.sku ?? "")));

      const rows: any[] = [];
      for (const p of allProducts ?? []) {
        if (productsWithVariants.has(p.id)) continue;
        const text = `${p.slug ?? ""} ${p.title ?? ""} ${p.categories?.name ?? ""}`.toLowerCase();
        const isShoes = /(shoe|loafer|oxford|boot|sandal)/.test(text);
        const isAccessory = /(cap|hat|belt|tie)/.test(text);
        const sizes = isAccessory ? ["One Size"] : isShoes ? ["40", "41", "42", "43"] : ["S", "M", "L", "XL"];
        const colors = ["Black", "Navy", "Brown"];
        const baseSku = String(p.slug ?? "item")
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 20);
        for (let i = 0; i < Math.min(3, sizes.length); i += 1) {
          const size = sizes[i];
          let sku = `${baseSku}-${String(size).replace(/\s+/g, "")}`;
          if (existingSkus.has(sku)) {
            sku = `${sku}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          }
          existingSkus.add(sku);
          rows.push({
            product_id: p.id,
            size,
            color: colors[i % colors.length],
            sku,
            stock_quantity: 5,
          });
        }
      }

      if (rows.length === 0) {
        toast.success("All products already have variants.");
        return;
      }
      const { error: insertError } = await supabase.from("product_variants").insert(rows);
      if (insertError) {
        toast.error(insertError.message);
        return;
      }
      toast.success(`Created ${rows.length} default variants.`);
      loadAll();
    } finally {
      setAutoCreatingVariants(false);
    }
  };

  const autoFillMissingDescriptions = async () => {
    setFillingDescriptions(true);
    try {
      const { data: allProducts, error: readError } = await supabase
        .from("products")
        .select("id,title,description,categories(name)");
      if (readError) {
        toast.error(readError.message);
        return;
      }

      const categoryPitch = (categoryName: string) => {
        const key = categoryName.toLowerCase();
        if (key.includes("suit")) {
          return {
            material: "premium suiting blend",
            fit: "structured tailored fit",
            occasion: "weddings, business meetings, and formal events",
            care: "Dry clean recommended to preserve shape and finish",
          };
        }
        if (key.includes("shirt") || key.includes("polo")) {
          return {
            material: "soft breathable cotton blend",
            fit: "modern regular fit",
            occasion: "office, dinner, and polished casual wear",
            care: "Machine wash cold and warm iron for a crisp look",
          };
        }
        if (key.includes("shoe")) {
          return {
            material: "quality leather-look upper with durable sole",
            fit: "comfort-focused foot shape",
            occasion: "workdays, events, and smart weekend outfits",
            care: "Wipe clean and store with shoe support",
          };
        }
        if (key.includes("trouser") || key.includes("linen")) {
          return {
            material: "lightweight woven fabric with breathable comfort",
            fit: "clean tapered silhouette",
            occasion: "daily office wear, travel, and smart casual dressing",
            care: "Gentle wash and low-heat pressing for best results",
          };
        }
        if (key.includes("jacket") || key.includes("blazer") || key.includes("sweater")) {
          return {
            material: "premium textured outerwear fabric",
            fit: "layer-friendly modern cut",
            occasion: "cool-weather styling, office layering, and evening outings",
            care: "Follow garment label care and avoid high-heat drying",
          };
        }
        if (key.includes("cap") || key.includes("hat") || key.includes("belt") || key.includes("tie")) {
          return {
            material: "durable accessory-grade construction",
            fit: "practical everyday profile",
            occasion: "finishing touch for formal and smart-casual looks",
            care: "Spot clean and store away from direct heat",
          };
        }
        return {
          material: "quality menswear fabric",
          fit: "balanced modern fit",
          occasion: "versatile day-to-evening styling",
          care: "Follow basic garment care for long-term durability",
        };
      };

      const keywordOverrides = (title: string) => {
        const t = title.toLowerCase();
        const out: Partial<{
          material: string;
          fit: string;
          occasion: string;
          care: string;
        }> = {};

        if (t.includes("linen")) {
          out.material = "premium breathable linen blend";
          out.occasion = "warm-weather business, events, and refined casual settings";
          out.care = "Gentle wash or dry clean to preserve the natural linen texture";
        }
        if (t.includes("wedding")) {
          out.occasion = "weddings, receptions, and premium celebration dressing";
        }
        if (t.includes("formal")) {
          out.fit = "sharp formal profile with clean lines";
          out.occasion = "boardroom meetings, ceremonies, and formal occasions";
        }
        if (t.includes("casual")) {
          out.fit = "relaxed modern fit for all-day comfort";
          out.occasion = "smart-casual days, travel, and weekend plans";
        }
        if (t.includes("track")) {
          out.material = "lightweight performance-inspired fabric";
          out.fit = "athletic modern cut with easy movement";
          out.occasion = "travel, active days, and clean streetwear styling";
          out.care = "Machine wash cold and air dry for best longevity";
        }
        if (t.includes("polo")) {
          out.material = "soft knitted cotton blend";
        }
        if (t.includes("boot") || t.includes("loafer") || t.includes("oxford")) {
          out.material = "structured premium upper with durable grip sole";
          out.fit = "supportive footwear profile for extended wear";
        }
        if (t.includes("sweater")) {
          out.material = "soft knit fabric with warm breathable feel";
          out.care = "Hand wash or gentle cycle to maintain knit quality";
        }
        return out;
      };

      const baseCopy = (categoryName: string, title: string) => {
        const profile = categoryPitch(categoryName);
        const override = keywordOverrides(title);
        const material = override.material ?? profile.material;
        const fit = override.fit ?? profile.fit;
        const occasion = override.occasion ?? profile.occasion;
        const care = override.care ?? profile.care;
        return `${title} is part of our ${categoryName} collection, created for men who want polished style with everyday comfort. Made from ${material}, it features a ${fit} that looks clean and confident. Ideal for ${occasion}, this piece pairs easily with both formal and smart-casual outfits. Care: ${care}. We deliver across Kenya, with fast Nairobi fulfilment for a smooth shopping experience.`;
      };

      let updated = 0;
      for (const p of allProducts ?? []) {
        const categoryName = String(p.categories?.name ?? "menswear");
        const description = baseCopy(categoryName, p.title);
        const { error } = await supabase.from("products").update({ description }).eq("id", p.id);
        if (error) {
          toast.error(error.message);
          return;
        }
        updated += 1;
      }

      toast.success(
        updated > 0
          ? `Generated detailed descriptions for ${updated} products.`
          : "No products found to update.",
      );
      loadAll();
    } finally {
      setFillingDescriptions(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="container mx-auto py-24 text-center text-muted-foreground">
        Checking permissions...
      </div>
    );
  }

  const isSuperAdmin = Boolean(user?.email && user.email.toLowerCase() === STORE_INFO.email.toLowerCase());

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const openProductsFilteredBySubcategory = (categorySlug: string, subFilter: string) => {
    setProductCatalogScope("full");
    setProductCategorySlugFilter(categorySlug);
    setProductSubcategoryFilter(subFilter);
    setProductSearch("");
    setActiveTab("products");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const taxonomyGroupsWithSubcategories = useMemo(
    () => CATALOG_TAXONOMY.filter((g) => g.subcategories.length > 0),
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-[60] flex h-14 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setSidebarOpen((o) => !o)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-bold leading-tight md:text-xl">Admin Dashboard</h1>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email} {isSuperAdmin ? "· Super Admin" : "· Admin"}
          </p>
        </div>
        <Link to="/" className="shrink-0">
          <Button variant="outline" size="sm" className="text-xs md:text-sm">
            View store →
          </Button>
        </Link>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="relative flex min-h-[calc(100vh-3.5rem)] w-full">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/50 lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          id="admin-sidebar"
          className={cn(
            "fixed left-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-[min(100vw-2.5rem,18rem)] flex-col border-r border-border bg-card shadow-xl transition-transform duration-200 ease-out lg:shadow-md",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Dashboard
            </span>
          </div>
          <TabsList className="h-auto flex-1 flex-col items-stretch justify-start gap-0.5 overflow-y-auto rounded-none border-0 bg-transparent p-2">
            <TabsTrigger
              value="orders"
              className="w-full justify-start gap-2 rounded-md px-3 py-2.5 text-left data-[state=active]:bg-gold/15 data-[state=active]:text-foreground"
            >
              <ClipboardList className="h-4 w-4 shrink-0 opacity-70" />
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="w-full justify-start gap-2 rounded-md px-3 py-2.5 text-left data-[state=active]:bg-gold/15 data-[state=active]:text-foreground"
            >
              <Package className="h-4 w-4 shrink-0 opacity-70" />
              Products
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="w-full justify-start gap-2 rounded-md px-3 py-2.5 text-left data-[state=active]:bg-gold/15 data-[state=active]:text-foreground"
            >
              <Mail className="h-4 w-4 shrink-0 opacity-70" />
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="w-full justify-start gap-2 rounded-md px-3 py-2.5 text-left data-[state=active]:bg-gold/15 data-[state=active]:text-foreground"
            >
              <Calendar className="h-4 w-4 shrink-0 opacity-70" />
              Bookings
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="w-full justify-start gap-2 rounded-md px-3 py-2.5 text-left data-[state=active]:bg-gold/15 data-[state=active]:text-foreground"
            >
              <Warehouse className="h-4 w-4 shrink-0 opacity-70" />
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="w-full justify-start gap-2 rounded-md px-3 py-2.5 text-left data-[state=active]:bg-gold/15 data-[state=active]:text-foreground"
            >
              <Tag className="h-4 w-4 shrink-0 opacity-70" />
              Categories
            </TabsTrigger>
            <TabsTrigger
              value="promos"
              className="w-full justify-start gap-2 rounded-md px-3 py-2.5 text-left data-[state=active]:bg-gold/15 data-[state=active]:text-foreground"
            >
              <Percent className="h-4 w-4 shrink-0 opacity-70" />
              Promos
            </TabsTrigger>
            <TabsTrigger
              value="super-admin"
              className="w-full justify-start gap-2 rounded-md px-3 py-2.5 text-left data-[state=active]:bg-gold/15 data-[state=active]:text-foreground"
            >
              <Shield className="h-4 w-4 shrink-0 opacity-70" />
              Super Admin
            </TabsTrigger>
          </TabsList>
        </aside>

        <div
          className={cn(
            "min-w-0 flex-1 px-3 pb-10 pt-6 transition-[margin] duration-200 ease-out md:px-4",
            sidebarOpen ? "lg:ml-72" : "lg:ml-0",
          )}
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Recent Orders", value: stats.orders },
                { label: "Recent Revenue", value: formatKES(stats.revenue) },
                { label: "Live Products", value: stats.liveProducts, sub: `Total: ${stats.totalProducts}` },
                { label: "Pending Bookings", value: stats.bookings, accent: stats.bookings > 0 },
                { label: "Low Stock", value: stats.lowStock, accent: stats.lowStock > 0 },
                { label: "Unread Messages", value: stats.messages, accent: stats.messages > 0 },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className={`mt-1 font-display text-2xl font-bold ${s.accent ? "text-gold" : ""}`}>
                    {s.value}
                  </p>
                  {s.sub && <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
        <TabsContent value="orders" className="mt-0">
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{o.order_number}</td>
                    <td className="p-3">{o.guest_name ?? "Customer"}</td>
                    <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold">{formatKES(o.total)}</td>
                    <td className="p-3">
                      <select
                        value={o.status}
                        onChange={(e) =>
                          updateOrderStatus(o.id, e.target.value as Enums<"order_status">)
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-xs capitalize"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="p-3">
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleString()}
                      </p>
                    </td>
                    <td className="p-3">{b.service}</td>
                    <td className="p-3">{b.booking_date}</td>
                    <td className="p-3">{b.booking_time}</td>
                    <td className="p-3">
                      <a href={`mailto:${b.email}`} className="block text-gold hover:underline">
                        {b.email}
                      </a>
                      {b.phone && <a href={`tel:${b.phone}`}>{b.phone}</a>}
                    </td>
                    <td className="p-3">
                      <select
                        value={b.status}
                        onChange={(e) =>
                          updateBookingStatus(
                            b.id,
                            e.target.value as "pending" | "confirmed" | "completed" | "cancelled",
                          )
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-xs capitalize"
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <form
            onSubmit={createProduct}
            className="mb-5 rounded-md border border-border bg-card p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">Add new product</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={fillingDescriptions}
                  onClick={autoFillMissingDescriptions}
                >
                  {fillingDescriptions ? "Generating..." : "Generate detailed descriptions (all)"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={syncingAssetProducts}
                  onClick={syncAssetProductsToDatabase}
                >
                  {syncingAssetProducts ? "Syncing..." : "Sync asset products to database"}
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={newProduct.title}
                onChange={(e) => setNewProduct((p) => ({ ...p, title: e.target.value }))}
                placeholder="Title"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
                required
              />
              <input
                value={newProduct.slug}
                onChange={(e) => setNewProduct((p) => ({ ...p, slug: e.target.value }))}
                placeholder="Slug (optional)"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                value={newProduct.category_id}
                onChange={(e) => setNewProduct((p) => ({ ...p, category_id: e.target.value }))}
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {(() => {
                const catSlug = categories.find((c) => c.id === newProduct.category_id)?.slug;
                const subOpts = catSlug ? getSubcategoriesForCategory(catSlug) : [];
                return (
                  <>
                    <input
                      list={subOpts.length ? "new-product-subcat" : undefined}
                      value={newProduct.subcategory}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, subcategory: e.target.value }))
                      }
                      placeholder="Subcategory (optional)"
                      className="rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                    {subOpts.length > 0 && (
                      <datalist id="new-product-subcat">
                        {subOpts.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    )}
                  </>
                );
              })()}
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                placeholder="Price"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
                required
              />
              <input
                type="number"
                value={newProduct.sale_price}
                onChange={(e) => setNewProduct((p) => ({ ...p, sale_price: e.target.value }))}
                placeholder="Sale price (optional)"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={newProduct.image_url}
                onChange={(e) => setNewProduct((p) => ({ ...p, image_url: e.target.value }))}
                placeholder="Image URL (/src/assets/... or https://...)"
                className="rounded border border-border bg-background px-3 py-2 text-sm md:col-span-3"
              />
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Or upload image from computer
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void uploadNewProductImage(file);
                    e.currentTarget.value = "";
                  }}
                />
                {uploadingNewProductImage && (
                  <p className="mt-1 text-xs text-muted-foreground">Uploading image...</p>
                )}
              </div>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                className="rounded border border-border bg-background px-3 py-2 text-sm md:col-span-3"
                rows={2}
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newProduct.is_published}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, is_published: e.target.checked }))
                  }
                />
                Published
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newProduct.is_featured}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, is_featured: e.target.checked }))
                  }
                />
                Featured
              </label>
              <Button type="submit" size="sm" disabled={creatingProduct}>
                {creatingProduct ? "Adding..." : "Add product"}
              </Button>
            </div>
          </form>
          <div className="mb-4 rounded-md border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Browse like the storefront</p>
                <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                  <strong>Full inventory</strong> lists every product in the database (default). Use{" "}
                  <strong>Storefront</strong> to narrow to the same published, in-catalog items shoppers see. Parent
                  categories and subcategory labels match the site taxonomy; create or rename parent categories in
                  the{" "}
                  <button
                    type="button"
                    className="font-medium text-gold underline-offset-2 hover:underline"
                    onClick={() => setActiveTab("categories")}
                  >
                    Categories
                  </button>{" "}
                  tab.
                </p>
              </div>
              <p className="shrink-0 rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{storefrontProductCount}</span> live on shop
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Catalog scope
                <select
                  value={productCatalogScope}
                  onChange={(e) =>
                    setProductCatalogScope(e.target.value as "storefront" | "full")
                  }
                  className="rounded border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
                >
                  <option value="full">Full inventory (all products)</option>
                  <option value="storefront">Storefront only (as shoppers see)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Category
                <select
                  value={productCategorySlugFilter}
                  onChange={(e) => setProductCategorySlugFilter(e.target.value)}
                  className="rounded border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
                >
                  <option value="all">All categories</option>
                  {taxonomyCategoryCounts.map(({ slug, name, count }) => (
                    <option key={slug} value={slug}>
                      {name} ({count})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Subcategory
                <select
                  value={productSubcategoryFilter}
                  onChange={(e) => setProductSubcategoryFilter(e.target.value)}
                  disabled={productCategorySlugFilter === "all"}
                  className="rounded border border-border bg-background px-3 py-2 text-sm font-normal text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="all">All subcategories</option>
                  {productCategorySlugFilter !== "all" && (
                    <option value="__none__">Unlabeled / other</option>
                  )}
                  {subcategoryFilterOptions.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground sm:col-span-2 xl:col-span-1">
                Search
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Title, slug, or subcategory"
                  className="rounded border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Visibility
                <select
                  value={productVisibilityFilter}
                  onChange={(e) =>
                    setProductVisibilityFilter(e.target.value as "all" | "published" | "draft")
                  }
                  className="rounded border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
                >
                  <option value="all">All</option>
                  <option value="published">Published only</option>
                  <option value="draft">Draft only</option>
                </select>
              </label>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredProducts.length}</span> of{" "}
              <span className="font-medium text-foreground">{products.length}</span> products
              {productCatalogScope === "storefront" ? " (storefront scope applied)" : ""}.
            </p>
          </div>
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Sale Price</th>
                  <th className="p-3">Image</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3">
                      <input
                        value={productDrafts[p.id]?.title ?? ""}
                        onChange={(e) => updateProductDraft(p.id, "title", e.target.value)}
                        className="w-52 rounded border border-border bg-background px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        value={productDrafts[p.id]?.slug ?? ""}
                        onChange={(e) => updateProductDraft(p.id, "slug", e.target.value)}
                        className="w-44 rounded border border-border bg-background px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <select
                          value={productDrafts[p.id]?.category_id ?? ""}
                          onChange={(e) => updateProductDraft(p.id, "category_id", e.target.value)}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        >
                          <option value="">No category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const catSlug = categories.find(
                            (c) => c.id === productDrafts[p.id]?.category_id,
                          )?.slug as string | undefined;
                          const subOpts = catSlug ? getSubcategoriesForCategory(catSlug) : [];
                          return (
                            <>
                              <input
                                list={subOpts.length ? `subcat-${p.id}` : undefined}
                                value={productDrafts[p.id]?.subcategory ?? ""}
                                onChange={(e) =>
                                  updateProductDraft(p.id, "subcategory", e.target.value)
                                }
                                placeholder="Subcategory (optional)"
                                className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                              />
                              {subOpts.length > 0 && (
                                <datalist id={`subcat-${p.id}`}>
                                  {subOpts.map((s) => (
                                    <option key={s} value={s} />
                                  ))}
                                </datalist>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <span className="text-xs text-muted-foreground">
                        {resolveSubcategory(
                          p.subcategory,
                          p.categories?.slug,
                          `${p.title ?? ""} ${p.slug ?? ""}`,
                        ) ?? "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={priceDrafts[p.id] ?? ""}
                        onChange={(e) =>
                          setPriceDrafts((s) => ({ ...s, [p.id]: e.target.value }))
                        }
                        className="w-28 rounded border border-border bg-background px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={salePriceDrafts[p.id] ?? ""}
                        onChange={(e) =>
                          setSalePriceDrafts((s) => ({ ...s, [p.id]: e.target.value }))
                        }
                        className="w-28 rounded border border-border bg-background px-2 py-1 text-sm"
                        placeholder="none"
                      />
                    </td>
                    <td className="p-3">
                      <div className="space-y-2">
                        <input
                          value={productDrafts[p.id]?.image_url ?? ""}
                          onChange={(e) => updateProductDraft(p.id, "image_url", e.target.value)}
                          placeholder="/src/assets/... or https://..."
                          className="w-56 rounded border border-border bg-background px-2 py-1 text-sm"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="w-56 rounded border border-border bg-background px-2 py-1 text-xs"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            void uploadDraftProductImage(p.id, file);
                            e.currentTarget.value = "";
                          }}
                        />
                        {uploadingProductImageId === p.id && (
                          <p className="text-xs text-muted-foreground">Uploading...</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 text-xs">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(productDrafts[p.id]?.is_published)}
                            onChange={(e) => updateProductDraft(p.id, "is_published", e.target.checked)}
                          />
                          Published
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(productDrafts[p.id]?.is_featured)}
                            onChange={(e) => updateProductDraft(p.id, "is_featured", e.target.checked)}
                          />
                          Featured
                        </label>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingProductId === p.id}
                          onClick={() => saveProduct(p.id)}
                        >
                          {savingProductId === p.id ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingProductId === p.id}
                          onClick={() => deleteProduct(p.id, p.title)}
                        >
                          {deletingProductId === p.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-muted-foreground">
                      No products match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-md border bg-card p-4 ${m.is_read ? "border-border" : "border-gold"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.name} -{" "}
                      <a href={`mailto:${m.email}`} className="text-gold hover:underline">
                        {m.email}
                      </a>{" "}
                      - {new Date(m.created_at).toLocaleString()}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!m.is_read && (
                      <Button size="sm" variant="outline" onClick={() => markMessageRead(m.id)}>
                        Mark read
                      </Button>
                    )}
                    <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>
                      <Button size="sm" variant="default">
                        Reply
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No messages yet.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={autoCreatingVariants}
              onClick={autoCreateDefaultVariants}
            >
              {autoCreatingVariants ? "Creating..." : "Auto-create default variants"}
            </Button>
          </div>
          <form onSubmit={createVariant} className="mb-4 rounded-md border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold">Add stock variant</p>
            <div className="grid gap-3 md:grid-cols-5">
              <select
                value={newVariant.product_id}
                onChange={(e) => setNewVariant((v) => ({ ...v, product_id: e.target.value }))}
                className="rounded border border-border bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <input
                value={newVariant.size}
                onChange={(e) => setNewVariant((v) => ({ ...v, size: e.target.value }))}
                placeholder="Size"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={newVariant.color}
                onChange={(e) => setNewVariant((v) => ({ ...v, color: e.target.value }))}
                placeholder="Color"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={newVariant.sku}
                onChange={(e) => setNewVariant((v) => ({ ...v, sku: e.target.value }))}
                placeholder="SKU"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={newVariant.stock_quantity}
                  onChange={(e) => setNewVariant((v) => ({ ...v, stock_quantity: e.target.value }))}
                  placeholder="Stock"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <Button type="submit" size="sm">
                  Add
                </Button>
              </div>
            </div>
          </form>

          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="p-3">{v.products?.title}</td>
                    <td className="p-3">{v.size || "-"}</td>
                    <td className="p-3">{v.color || "-"}</td>
                    <td className="p-3 font-mono text-xs">{v.sku || "-"}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        value={variantStockDrafts[v.id] ?? ""}
                        onChange={(e) =>
                          setVariantStockDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))
                        }
                        className="w-24 rounded border border-border bg-background px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={variantBusyId === v.id}
                          onClick={() => updateVariantStock(v.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={variantBusyId === v.id}
                          onClick={() => deleteVariant(v.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {variants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No stock variants yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <form
            onSubmit={createCategory}
            className="mb-5 rounded-md border border-border bg-card p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">Add new category</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={applyingRequiredTaxonomy}
                onClick={applyRequiredTaxonomy}
              >
                {applyingRequiredTaxonomy ? "Applying..." : "Apply required categories"}
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={newCategory.name}
                onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))}
                placeholder="Category name"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
                required
              />
              <input
                value={newCategory.slug}
                onChange={(e) => setNewCategory((c) => ({ ...c, slug: e.target.value }))}
                placeholder="Slug (optional)"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={newCategory.image_url}
                onChange={(e) => setNewCategory((c) => ({ ...c, image_url: e.target.value }))}
                placeholder="Image URL"
                className="rounded border border-border bg-background px-3 py-2 text-sm md:col-span-2"
              />
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory((c) => ({ ...c, description: e.target.value }))}
                placeholder="Description"
                className="rounded border border-border bg-background px-3 py-2 text-sm md:col-span-2"
                rows={2}
              />
            </div>
            <div className="mt-3">
              <Button type="submit" size="sm" disabled={creatingCategory}>
                {creatingCategory ? "Adding..." : "Add category"}
              </Button>
            </div>
          </form>

          <div className="mb-5 rounded-md border border-border bg-card p-4">
            <p className="text-sm font-semibold">Requested category structure</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {CATALOG_TAXONOMY.map((group) => (
                <div key={group.slug} className="rounded border border-border/80 p-3">
                  <p className="text-sm font-semibold">{group.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.subcategories.length > 0
                      ? group.subcategories.join(", ")
                      : "No subcategories specified."}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-5 rounded-md border border-border bg-card p-4">
            <p className="text-sm font-semibold">Subcategory placement</p>
            <p className="mt-1 text-xs text-muted-foreground">
              For categories like <strong>Shoes</strong>, pick the correct subcategory for each product so the shop
              filters (Formal shoes, Casual, Boots, etc.) match. &quot;Inferred&quot; uses title/slug rules until you
              set a stored value. Use the chips to jump to the same filter in the Products tab, or edit and{" "}
              <strong>Save</strong> here.
            </p>
            <div className="mt-4 space-y-3">
              {taxonomyGroupsWithSubcategories.map((group) => {
                const inGroup = products.filter((p: any) => p.categories?.slug === group.slug);
                const countResolved = (label: string) =>
                  inGroup.filter(
                    (p: any) =>
                      resolveSubcategory(
                        p.subcategory,
                        group.slug,
                        `${p.title ?? ""} ${p.slug ?? ""}`,
                      ) === label,
                  ).length;
                const unlabeledCount = inGroup.filter(
                  (p: any) =>
                    resolveSubcategory(
                      p.subcategory,
                      group.slug,
                      `${p.title ?? ""} ${p.slug ?? ""}`,
                    ) == null,
                ).length;
                return (
                  <details
                    key={group.slug}
                    className="group rounded-lg border border-border open:bg-secondary/20"
                    open={group.slug === "shoes"}
                  >
                    <summary className="cursor-pointer list-none px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {group.name}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({inGroup.length} product{inGroup.length === 1 ? "" : "s"})
                          </span>
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {group.subcategories.map((s) => (
                            <span key={s} className="mr-2 inline-block">
                              {s}: {countResolved(s)}
                            </span>
                          ))}
                          {unlabeledCount > 0 && (
                            <span className="text-amber-700 dark:text-amber-400">
                              Unlabeled: {unlabeledCount}
                            </span>
                          )}
                        </span>
                      </span>
                    </summary>
                    <div className="border-t border-border px-4 pb-4 pt-2">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openProductsFilteredBySubcategory(group.slug, "all")}
                        >
                          Open in Products (all {group.name})
                        </Button>
                        {group.subcategories.map((sub) => (
                          <Button
                            key={sub}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openProductsFilteredBySubcategory(group.slug, sub)}
                          >
                            {sub}
                          </Button>
                        ))}
                        {unlabeledCount > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => openProductsFilteredBySubcategory(group.slug, "__none__")}
                          >
                            Unlabeled only
                          </Button>
                        )}
                      </div>
                      {inGroup.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No products in this category yet.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-md border border-border">
                          <table className="w-full min-w-[640px] text-sm">
                            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                              <tr>
                                <th className="p-2">Product</th>
                                <th className="p-2">Effective (shop)</th>
                                <th className="p-2">Assign subcategory</th>
                                <th className="p-2 w-28">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inGroup.map((p: any) => {
                                const effective = resolveSubcategory(
                                  p.subcategory,
                                  group.slug,
                                  `${p.title ?? ""} ${p.slug ?? ""}`,
                                );
                                return (
                                  <tr key={p.id} className="border-t border-border">
                                    <td className="p-2 font-medium">{p.title}</td>
                                    <td className="p-2 text-xs text-muted-foreground">
                                      {effective ?? "—"}
                                    </td>
                                    <td className="p-2">
                                      <select
                                        className="w-full max-w-xs rounded border border-border bg-background px-2 py-1.5 text-sm"
                                        value={productDrafts[p.id]?.subcategory ?? ""}
                                        onChange={(e) =>
                                          updateProductDraft(p.id, "subcategory", e.target.value)
                                        }
                                      >
                                        <option value="">Inferred from title (no fixed label)</option>
                                        {group.subcategories.map((s) => (
                                          <option key={s} value={s}>
                                            {s}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="p-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={savingProductId === p.id}
                                        onClick={() => saveProduct(p.id)}
                                      >
                                        {savingProductId === p.id ? "Saving…" : "Save"}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-3">
                      <input
                        value={categoryNameDrafts[c.id] ?? ""}
                        onChange={(e) =>
                          setCategoryNameDrafts((s) => ({ ...s, [c.id]: e.target.value }))
                        }
                        className="w-52 rounded border border-border bg-background px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" onClick={() => updateCategoryName(c.id)}>
                        Save
                      </Button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">
                      No categories yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="promos">
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Usage</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-mono font-bold text-gold">{p.code}</td>
                    <td className="p-3">
                      {p.discount_type === "percent"
                        ? `${p.discount_value}%`
                        : formatKES(p.discount_value)}
                    </td>
                    <td className="p-3">
                      {p.usage_count} / {p.usage_limit || "unlimited"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-1 text-xs ${p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                      >
                        {p.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="super-admin" className="mt-0">
          <div className="rounded-md border border-border bg-card p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Super Admin Finance Console</h3>
                <p className="text-sm text-muted-foreground">
                  Finance, weekly and monthly reports, sold-items summary, and stock control.
                </p>
              </div>
              <span className="rounded border border-gold/40 bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">
                {isSuperAdmin ? "Super Admin Access" : "Admin View"}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded border border-border p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Weekly Sales</p>
                <p className="mt-1 text-2xl font-bold">{formatKES(financeStats.weeklyRevenue)}</p>
                <p className="text-xs text-muted-foreground">{financeStats.weeklyOrders} orders</p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Sales</p>
                <p className="mt-1 text-2xl font-bold">{formatKES(financeStats.monthlyRevenue)}</p>
                <p className="text-xs text-muted-foreground">{financeStats.monthlyOrders} orders</p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Sold Items Summary</p>
                <p className="mt-1 text-2xl font-bold">{financeStats.itemsSold} items</p>
                <p className="text-xs text-muted-foreground">Amount: {formatKES(financeStats.soldAmount)}</p>
              </div>
            </div>
          </div>
        </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
