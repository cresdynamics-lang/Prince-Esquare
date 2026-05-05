import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AttendantProfile } from "@/lib/attendantPermissions";
import {
  ATTENDANT_PERMISSION_KEYS,
  DEFAULT_ATTENDANT_PERMISSIONS,
  permissionLabels,
  type AttendantPermissions,
} from "@/lib/attendantPermissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type TeamRow = AttendantProfile & { created_at?: string };

type UserLabel = {
  label: string;
  secondary: string | null;
};

async function fetchAdminUserLabels() {
  const [{ data: profiles }, authResult] = await Promise.all([
    supabase
      .from("attendant_profiles")
      .select("user_id,display_name,email"),
    supabase.auth.getUser(),
  ]);

  const labels: Record<string, UserLabel> = {};
  for (const row of profiles ?? []) {
    labels[row.user_id] = {
      label: row.display_name || row.email || row.user_id,
      secondary: row.email || null,
    };
  }

  const currentUser = authResult.data.user;
  if (currentUser?.id && !labels[currentUser.id]) {
    labels[currentUser.id] = {
      label: "Super Admin",
      secondary: currentUser.email ?? null,
    };
  }

  return labels;
}

function summarizePermissions(perms: AttendantPermissions) {
  return permissionLabels()
    .filter(({ key }) => Boolean(perms[key]))
    .map(({ label }) => label);
}

export function AdminTeamPanel() {
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    display_name: "",
    branch_location: "",
    orders_visibility: "all" as "all" | "branch",
    permissions: { ...DEFAULT_ATTENDANT_PERMISSIONS } as AttendantPermissions,
    is_active: true,
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attendant_profiles")
      .select("user_id,email,display_name,branch_location,is_active,orders_visibility,permissions,created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows(
        (data ?? []).map((r: any) => ({
          user_id: r.user_id,
          email: r.email,
          display_name: r.display_name,
          branch_location: r.branch_location,
          is_active: r.is_active,
          orders_visibility: r.orders_visibility === "branch" ? "branch" : "all",
          permissions: (r.permissions ?? {}) as AttendantPermissions,
          created_at: r.created_at,
        })),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const invokeEdge = async (body: Record<string, unknown>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      toast.error("Not signed in.");
      return { error: "no session" };
    }
    const { data, error } = await supabase.functions.invoke("create-attendant-user", {
      body,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error) {
      toast.error(error.message ?? "Request failed");
      return { error };
    }
    if (data && typeof data === "object" && "error" in data && (data as any).error) {
      toast.error(String((data as any).error));
      return { error: (data as any).error };
    }
    return { data };
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await invokeEdge({
      action: "create",
      email: form.email.trim(),
      password: form.password,
      display_name: form.display_name.trim(),
      branch_location: form.branch_location.trim() || null,
      orders_visibility: form.orders_visibility,
      permissions: form.permissions,
    });
    if (res.error) return;
    toast.success("Attendant account created.");
    setCreating(false);
    setForm({
      email: "",
      password: "",
      display_name: "",
      branch_location: "",
      orders_visibility: "all",
      permissions: { ...DEFAULT_ATTENDANT_PERMISSIONS },
      is_active: true,
    });
    load();
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const res = await invokeEdge({
      action: "update",
      user_id: editing.user_id,
      display_name: form.display_name.trim(),
      branch_location: form.branch_location.trim() || null,
      orders_visibility: form.orders_visibility,
      permissions: form.permissions,
      is_active: form.is_active,
      password: form.password || undefined,
    });
    if (res.error) return;
    toast.success("Attendant updated.");
    setEditing(null);
    setForm({
      email: "",
      password: "",
      display_name: "",
      branch_location: "",
      orders_visibility: "all",
      permissions: { ...DEFAULT_ATTENDANT_PERMISSIONS },
      is_active: true,
    });
    load();
  };

  const openEdit = (r: TeamRow) => {
    setEditing(r);
    setForm({
      email: r.email,
      password: "",
      display_name: r.display_name,
      branch_location: r.branch_location ?? "",
      orders_visibility: r.orders_visibility,
      permissions: { ...DEFAULT_ATTENDANT_PERMISSIONS, ...r.permissions },
      is_active: r.is_active,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Super Admin only. Create shop attendant logins and set permissions. Deploy the{" "}
          <code className="rounded bg-muted px-1">create-attendant-user</code> Edge Function with service role.
        </p>
        <Button type="button" onClick={() => setCreating(true)}>
          Add attendant
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading team…</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Permissions</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} className="border-t border-border">
                  <td className="p-3 font-medium">{r.display_name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.branch_location ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {summarizePermissions({ ...DEFAULT_ATTENDANT_PERMISSIONS, ...r.permissions }).map((permission) => (
                        <span
                          key={permission}
                          className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {permission}
                        </span>
                      ))}
                      {summarizePermissions({ ...DEFAULT_ATTENDANT_PERMISSIONS, ...r.permissions }).length === 0 && (
                        <span className="text-xs text-muted-foreground">No access</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{r.orders_visibility === "branch" ? "Branch only" : "All"}</td>
                  <td className="p-3">{r.is_active ? "Active" : "Inactive"}</td>
                  <td className="p-3">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No attendant profiles yet. Create one to assign staff logins.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New shop attendant</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-3">
            <div>
              <Label htmlFor="att-email">Email</Label>
              <Input
                id="att-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="att-pass">Password (min 8)</Label>
              <Input
                id="att-pass"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="att-name">Display name</Label>
              <Input
                id="att-name"
                required
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="att-branch">Branch / location</Label>
              <Input
                id="att-branch"
                value={form.branch_location}
                onChange={(e) => setForm((f) => ({ ...f, branch_location: e.target.value }))}
              />
            </div>
            <div>
              <Label>Order visibility</Label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.orders_visibility}
                onChange={(e) =>
                  setForm((f) => ({ ...f, orders_visibility: e.target.value as "all" | "branch" }))
                }
              >
                <option value="all">All orders</option>
                <option value="branch">Branch / fulfillment match only</option>
              </select>
            </div>
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Permissions</p>
              {permissionLabels().map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(form.permissions[key])}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        permissions: { ...f.permissions, [key]: e.target.checked },
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit">Create account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit attendant</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={submitEdit} className="space-y-3">
              <p className="text-xs text-muted-foreground">Account: {editing.email}</p>
              <div>
                <Label>New password (optional)</Label>
                <Input
                  type="password"
                  minLength={8}
                  placeholder="Leave blank to keep"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <Label>Display name</Label>
                <Input
                  required
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Branch / location</Label>
                <Input
                  value={form.branch_location}
                  onChange={(e) => setForm((f) => ({ ...f, branch_location: e.target.value }))}
                />
              </div>
              <div>
                <Label>Order visibility</Label>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.orders_visibility}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, orders_visibility: e.target.value as "all" | "branch" }))
                  }
                >
                  <option value="all">All orders</option>
                  <option value="branch">Branch match only</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Active
              </label>
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Permissions</p>
                {ATTENDANT_PERMISSION_KEYS.map((key) => {
                  const label = permissionLabels().find((p) => p.key === key)?.label ?? key;
                  return (
                    <label key={key} className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={Boolean(form.permissions[key])}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            permissions: { ...f.permissions, [key]: e.target.checked },
                          }))
                        }
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type StockRow = {
  id: string;
  created_at: string;
  adjustment_type: string;
  quantity: number;
  reason: string;
  product_id: string;
  user_id: string | null;
  products: { title: string } | null;
  product_variants: { sku: string | null; size: string | null; color: string | null } | null;
};

export function AdminStockHistoryPanel() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [userLabels, setUserLabels] = useState<Record<string, UserLabel>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data, error }, labels] = await Promise.all([
        supabase
          .from("stock_adjustments")
          .select(
            "id,created_at,adjustment_type,quantity,reason,product_id,user_id,products(title),product_variants(sku,size,color)",
          )
          .order("created_at", { ascending: false })
          .limit(200),
        fetchAdminUserLabels(),
      ]);
      if (error) {
        toast.error(error.message);
        setRows([]);
      } else {
        setRows((data ?? []) as StockRow[]);
        setUserLabels(labels);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading stock history…</p>;

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Product</th>
            <th className="p-3">Variant</th>
            <th className="p-3">Type</th>
            <th className="p-3">Qty</th>
            <th className="p-3">Reason</th>
            <th className="p-3">Done By</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
              <td className="p-3">{r.products?.title ?? "—"}</td>
              <td className="p-3 text-xs text-muted-foreground">
                {[r.product_variants?.size, r.product_variants?.color, r.product_variants?.sku]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </td>
              <td className="p-3 capitalize">{r.adjustment_type}</td>
              <td className="p-3">{r.quantity}</td>
              <td className="p-3 max-w-xs">{r.reason}</td>
              <td className="p-3 text-xs">
                <div>{r.user_id ? (userLabels[r.user_id]?.label ?? `${r.user_id.slice(0, 8)}…`) : "—"}</div>
                {r.user_id && userLabels[r.user_id]?.secondary && (
                  <div className="text-muted-foreground">{userLabels[r.user_id]?.secondary}</div>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-muted-foreground">
                No adjustments yet. Use Adjust Stock on a variant to record moves.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type LogRow = {
  id: string;
  created_at: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  user_id: string;
};

export function AdminActivityLogPanel({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [userLabels, setUserLabels] = useState<Record<string, UserLabel>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data, error }, labels] = await Promise.all([
        supabase
          .from("admin_activity_log")
          .select("id,created_at,action,entity_type,entity_id,metadata,user_id")
          .order("created_at", { ascending: false })
          .limit(300),
        fetchAdminUserLabels(),
      ]);
      if (error) {
        toast.error(error.message);
        setRows([]);
      } else {
        setRows((data ?? []) as LogRow[]);
        setUserLabels(labels);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading activity…</p>;

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-3">When</th>
            {isSuperAdmin && <th className="p-3">User</th>}
            <th className="p-3">Action</th>
            <th className="p-3">Entity</th>
            <th className="p-3">Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
              {isSuperAdmin && (
                <td className="p-3 text-xs">
                  <div>{userLabels[r.user_id]?.label ?? `${r.user_id.slice(0, 8)}…`}</div>
                  {userLabels[r.user_id]?.secondary && (
                    <div className="text-muted-foreground">{userLabels[r.user_id]?.secondary}</div>
                  )}
                </td>
              )}
              <td className="p-3">{r.action}</td>
              <td className="p-3 text-xs">
                {r.entity_type ?? "—"} {r.entity_id ? `· ${r.entity_id.slice(0, 8)}` : ""}
              </td>
              <td className="p-3 max-w-md text-xs text-muted-foreground">
                {r.metadata ? JSON.stringify(r.metadata) : "—"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={isSuperAdmin ? 5 : 4} className="p-6 text-center text-muted-foreground">
                No activity rows yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type StockModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  variantId: string | null;
  productTitle: string;
  onApplied: () => void;
};

export function StockAdjustModal({ open, onOpenChange, variantId, productTitle, onApplied }: StockModalProps) {
  const [adjType, setAdjType] = useState<"add" | "remove">("remove");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantId) return;
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) {
      toast.error("Enter a positive quantity.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Reason is required.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("apply_stock_adjustment", {
      p_variant_id: variantId,
      p_adjustment_type: adjType,
      p_quantity: Math.floor(q),
      p_reason: reason.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data && typeof data === "object" && "error" in (data as object)) {
      toast.error(String((data as any).error));
      return;
    }
    toast.success("Stock adjusted.");
    setReason("");
    onOpenChange(false);
    onApplied();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {productTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Adjustment</Label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={adjType}
              onChange={(e) => setAdjType(e.target.value as "add" | "remove")}
            >
              <option value="add">Add stock</option>
              <option value="remove">Remove stock</option>
            </select>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <Label>Reason (required)</Label>
            <Input
              required
              placeholder="e.g. Moved to Westlands shop"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
