import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in / Create account — Prince Esquire" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/account" });
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: signinEmail, password: signinPassword });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back.");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: { display_name: signupName },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — check your email to confirm.");
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Welcome to Prince Esquire</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in or create an account.</p>
      </div>

      <Tabs defaultValue="signin" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="mt-6 space-y-4 rounded-md border border-border bg-card p-6">
            <div><Label>Email</Label><Input type="email" required value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" required value={signinPassword} onChange={(e) => setSigninPassword(e.target.value)} /></div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="mt-6 space-y-4 rounded-md border border-border bg-card p-6">
            <div><Label>Name</Label><Input required value={signupName} onChange={(e) => setSignupName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" required minLength={6} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} /></div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Continue as guest? <Link to="/shop" className="text-gold hover:underline">Browse the collection</Link>
      </p>
    </div>
  );
}
