/** Keys stored in `attendant_profiles.permissions` (JSON booleans). */
export const ATTENDANT_PERMISSION_KEYS = [
  "view_products",
  "update_products",
  "view_orders",
  "update_order_status",
  "view_deliveries",
  "view_messages",
  "respond_messages",
  "view_daily_sales",
] as const;

export type AttendantPermissionKey = (typeof ATTENDANT_PERMISSION_KEYS)[number];

export type AttendantPermissions = Partial<Record<AttendantPermissionKey, boolean>>;

export type AttendantProfile = {
  user_id: string;
  email: string;
  display_name: string;
  branch_location: string | null;
  is_active: boolean;
  orders_visibility: "all" | "branch";
  permissions: AttendantPermissions;
};

export const DEFAULT_ATTENDANT_PERMISSIONS: AttendantPermissions = Object.fromEntries(
  ATTENDANT_PERMISSION_KEYS.map((k) => [k, false]),
) as AttendantPermissions;

export function hasAnyAttendantPermission(perms: AttendantPermissions | null | undefined): boolean {
  if (!perms || typeof perms !== "object") return false;
  return ATTENDANT_PERMISSION_KEYS.some((k) => Boolean(perms[k]));
}

export function permissionLabels(): { key: AttendantPermissionKey; label: string }[] {
  return [
    { key: "view_products", label: "View products (read-only list & stock)" },
    { key: "update_products", label: "Update products & stock (no delete)" },
    { key: "view_orders", label: "View orders" },
    { key: "update_order_status", label: "Update order status" },
    { key: "view_deliveries", label: "View deliveries" },
    { key: "view_messages", label: "View customer messages" },
    { key: "respond_messages", label: "Reply to messages" },
    { key: "view_daily_sales", label: "View daily sales (location scope)" },
  ];
}
