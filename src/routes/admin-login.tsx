import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Admin Login — Prince Esquare" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const hasAdminRole = (roles ?? []).some((r: any) => r.role === "admin");
      if (hasAdminRole) navigate({ to: "/admin" });
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedIdentifier = (identifierRef.current?.value ?? "").trim().toLowerCase();
    const password = passwordRef.current?.value ?? "";
    if (!normalizedIdentifier) {
      toast.error("Username or email is required.");
      return;
    }
    const normalizedEmail =
      normalizedIdentifier.includes("@")
        ? normalizedIdentifier
        : normalizedIdentifier === "admin"
          ? "princeesquare@gmail.com"
          : "";
    if (!normalizedEmail) {
      toast.error("Enter email or use username: Admin");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      setBusy(false);
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Admin email is not confirmed yet. Apply the latest admin confirm SQL migration once.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    const {
      data: { user: signedUser },
    } = await supabase.auth.getUser();
    if (!signedUser) {
      setBusy(false);
      toast.error("Could not read logged in user.");
      return;
    }

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", signedUser.id);
    const hasAdminRole = (roles ?? []).some((r: any) => r.role === "admin");
    if (!hasAdminRole) {
      await supabase.auth.signOut();
      setBusy(false);
      toast.error("Admin credentials not recognized in database.");
      return;
    }

    setBusy(false);
    toast.success("Signed in. Redirecting to admin...");
    navigate({ to: "/admin" });
  };

  return (
    <div className="container mx-auto flex min-h-screen w-full items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-4 shadow-sm sm:p-6">
        <h1 className="font-display text-xl font-bold sm:text-2xl">Admin Login</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Use the admin credentials to manage orders, products, pricing, and categories.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:mt-6">
          <div>
            <label className="text-sm font-medium">Username or Email</label>
            <input
              ref={identifierRef}
              required
              defaultValue=""
              placeholder="Admin or email"
              className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-1 focus-visible:ring-ring"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              ref={passwordRef}
              type="password"
              required
              defaultValue=""
              className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-1 focus-visible:ring-ring"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="h-11 w-full rounded-md bg-gold px-4 text-base font-medium text-gold-foreground disabled:opacity-60"
            disabled={busy}
          >
            {busy ? "Signing in..." : "Login to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
