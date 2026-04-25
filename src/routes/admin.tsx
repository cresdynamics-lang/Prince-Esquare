import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatKES } from "@/lib/format";
import { fashionProductsAsCards } from "@/lib/fashionProducts";
import { toast } from "sonner";

const ORDER_STATUSES: Enums<"order_status">[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard - Prince Esquare" }] }),
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
  const [promos, setPromos] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryNameDrafts, setCategoryNameDrafts] = useState<Record<string, string>>({});
  const [creatingCategory, setCreatingCategory] = useState(false);
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
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productVisibilityFilter, setProductVisibilityFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [newProduct, setNewProduct] = useState({
    title: "",
    slug: "",
    description: "",
    category_id: "",
    price: "",
    sale_price: "",
    image_url: "",
    is_published: true,
    is_featured: false,
  });

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
      { data: pr },
      { data: cs },
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
            "id, title, slug, category_id, price, sale_price, is_published, is_featured, categories(name), product_images(id,image_url,display_order)",
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
        supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("id,name,slug").order("display_order"),
      ]);
    setOrders(os ?? []);
    setProducts(ps ?? []);
    setMessages(ms ?? []);
    setBookings(bs ?? []);
    setLowStock(vs ?? []);
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
        is_published: Boolean(p.is_published),
        is_featured: Boolean(p.is_featured),
        image_url: p.product_images?.[0]?.image_url ?? "",
      };
    });
    setPriceDrafts(pDrafts);
    setSalePriceDrafts(sDrafts);
    setProductDrafts(prDrafts);
    const totalRev = (os ?? []).reduce((s, o: any) => s + Number(o.total ?? 0), 0);
    const liveProducts = (ps ?? []).filter((p: any) => p.is_published).length;
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

  const productCategoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const categoryName = product.categories?.name ?? "Uncategorized";
      counts.set(categoryName, (counts.get(categoryName) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const categoryName = product.categories?.name ?? "Uncategorized";
      const categoryMatch =
        productCategoryFilter === "all" || categoryName === productCategoryFilter;
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
          .includes(term);
      return categoryMatch && visibilityMatch && textMatch;
    });
  }, [products, productCategoryFilter, productVisibilityFilter, productSearch]);

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
    key: "title" | "slug" | "category_id" | "is_published" | "is_featured" | "image_url",
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
    const { error } = await supabase
      .from("products")
      .update({
        title: draft.title.trim(),
        slug: draft.slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        category_id: draft.category_id || null,
        price,
        sale_price: salePrice,
        is_published: draft.is_published,
        is_featured: draft.is_featured,
      })
      .eq("id", id);
    if (error) {
      setSavingProductId(null);
      toast.error(error.message);
      return;
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
    const { data, error } = await supabase
      .from("products")
      .insert({
        title: newProduct.title.trim(),
        slug,
        description: newProduct.description.trim() || null,
        category_id: newProduct.category_id || null,
        price: Number(newProduct.price || 0),
        sale_price: newProduct.sale_price ? Number(newProduct.sale_price) : null,
        is_published: newProduct.is_published,
        is_featured: newProduct.is_featured,
      })
      .select("id")
      .single();
    if (error || !data) {
      setCreatingProduct(false);
      toast.error(error?.message ?? "Could not create product");
      return;
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
        return {
          slug: p.slug,
          title: p.title,
          description: p.title,
          category_id: categoryIdBySlug.get(categorySlug) ?? null,
          price: Number(p.price ?? 0),
          sale_price: p.sale_price != null ? Number(p.sale_price) : null,
          is_published: true,
          is_featured: false,
        };
      });

      if (rowsToInsert.length > 0) {
        const { error: insertError } = await supabase.from("products").upsert(rowsToInsert, {
          onConflict: "slug",
          ignoreDuplicates: true,
        });
        if (insertError) {
          toast.error(insertError.message);
          return;
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

  if (loading || !isAdmin) {
    return (
      <div className="container mx-auto py-24 text-center text-muted-foreground">
        Checking permissions...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Link to="/">
          <Button variant="outline">View store -&gt;</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
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

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="promos">Promos</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
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
            <p className="mb-3 text-sm font-semibold">Find products quickly</p>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by title or slug"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All categories</option>
                {productCategoryCounts.map(([name, count]) => (
                  <option key={name} value={name}>
                    {name} ({count})
                  </option>
                ))}
              </select>
              <select
                value={productVisibilityFilter}
                onChange={(e) =>
                  setProductVisibilityFilter(e.target.value as "all" | "published" | "draft")
                }
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All visibility</option>
                <option value="published">Published only</option>
                <option value="draft">Draft only</option>
              </select>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products.
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
                      <select
                        value={productDrafts[p.id]?.category_id ?? ""}
                        onChange={(e) => updateProductDraft(p.id, "category_id", e.target.value)}
                        className="rounded border border-border bg-background px-2 py-1 text-sm"
                      >
                        <option value="">No category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
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
                      <input
                        value={productDrafts[p.id]?.image_url ?? ""}
                        onChange={(e) => updateProductDraft(p.id, "image_url", e.target.value)}
                        placeholder="/src/assets/... or https://..."
                        className="w-56 rounded border border-border bg-background px-2 py-1 text-sm"
                      />
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
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
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
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="p-3">{v.products?.title}</td>
                    <td className="p-3">{v.size}</td>
                    <td className="p-3 font-mono text-xs">{v.sku}</td>
                    <td className="p-3">
                      <span className="rounded bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
                        {v.stock_quantity} left
                      </span>
                    </td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-success">
                      All variants are well stocked.
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
            <p className="mb-3 text-sm font-semibold">Add new category</p>
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
      </Tabs>
    </div>
  );
}
