import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Admin Login — Prince Esquare" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [loading, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedIdentifier = identifier.trim().toLowerCase();
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
    <div className="container mx-auto max-w-md px-4 py-16">
      <div className="rounded-md border border-border bg-card p-6">
        <h1 className="font-display text-2xl font-bold">Admin Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the admin credentials to manage orders, products, pricing, and categories.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label>Username or Email</Label>
            <Input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Admin or princeesquare@gmail.com"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in..." : "Login to Admin"}
          </Button>
        </form>
      </div>
    </div>
  );
}
