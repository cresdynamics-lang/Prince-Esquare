import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  hasAnyAttendantPermission,
  type AttendantPermissionKey,
  type AttendantProfile,
} from "@/lib/attendantPermissions";

type Role = "admin" | "staff" | "customer";

type AuthState = {
  session: Session | null;
  user: User | null;
  roles: Role[];
  /** Super admin (Charles): `admin` role or legacy primary email. Full destructive access. */
  isSuperAdmin: boolean;
  /** Shop attendants with active profile + at least one permission, or super admin. */
  canAccessAdminPanel: boolean;
  /** Draft previews / internal storefront tools (admin or any staff role). */
  isStaff: boolean;
  /**
   * Same as `isSuperAdmin`. Kept for older call sites that mean “full admin”, not attendants.
   * Prefer `isSuperAdmin` in new code.
   */
  isAdmin: boolean;
  attendantProfile: AttendantProfile | null;
  can: (perm: AttendantPermissionKey) => boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchAttendantProfile(userId: string): Promise<AttendantProfile | null> {
  const { data, error } = await supabase
    .from("attendant_profiles")
    .select("user_id,email,display_name,branch_location,is_active,orders_visibility,permissions")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as any;
  return {
    user_id: row.user_id,
    email: row.email ?? "",
    display_name: row.display_name ?? "",
    branch_location: row.branch_location ?? null,
    is_active: Boolean(row.is_active),
    orders_visibility: row.orders_visibility === "branch" ? "branch" : "all",
    permissions: (row.permissions ?? {}) as AttendantProfile["permissions"],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [attendantProfile, setAttendantProfile] = useState<AttendantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyRolesAndProfile = useCallback(async (uid: string | undefined, nextRoles: Role[]) => {
    setRoles(nextRoles);
    if (!uid) {
      setAttendantProfile(null);
      return;
    }
    if (nextRoles.includes("staff")) {
      const profile = await fetchAttendantProfile(uid);
      setAttendantProfile(profile);
    } else {
      setAttendantProfile(null);
    }
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(async () => {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", newSession.user.id);
          const next = (data ?? []).map((r) => r.role as Role);
          await applyRolesAndProfile(newSession.user.id, next);
          setLoading(false);
        }, 0);
      } else {
        setRoles([]);
        setAttendantProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", existing.user.id)
          .then(async ({ data }) => {
            const next = (data ?? []).map((r) => r.role as Role);
            await applyRolesAndProfile(existing.user.id, next);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [applyRolesAndProfile]);

  const isSuperAdmin = useMemo(
    () =>
      roles.includes("admin") ||
      (user?.email?.toLowerCase() ?? "") === "princeesquire@gmail.com",
    [roles, user?.email],
  );

  const canAccessAdminPanel = useMemo(() => {
    if (isSuperAdmin) return true;
    if (!roles.includes("staff") || !attendantProfile?.is_active) return false;
    return hasAnyAttendantPermission(attendantProfile.permissions);
  }, [isSuperAdmin, roles, attendantProfile]);

  const isStaff = useMemo(
    () =>
      isSuperAdmin ||
      roles.includes("staff") ||
      (user?.email?.toLowerCase() ?? "") === "princeesquire@gmail.com",
    [isSuperAdmin, roles, user?.email],
  );

  const can = useCallback(
    (perm: AttendantPermissionKey) => {
      if (isSuperAdmin) return true;
      if (!attendantProfile?.is_active) return false;
      return Boolean(attendantProfile.permissions[perm]);
    },
    [isSuperAdmin, attendantProfile],
  );

  const value: AuthState = {
    session,
    user,
    roles,
    isSuperAdmin,
    canAccessAdminPanel,
    isStaff,
    isAdmin: isSuperAdmin,
    attendantProfile,
    can,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
