import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/nabhya-logo.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Nabhya OS" },
      { name: "description", content: "Sign in to Nabhya OS — the single source of truth for the team." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
    if (!result.redirected && !result.error) navigate({ to: "/" });
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-40" style={{
        background: "radial-gradient(60% 60% at 20% 20%, oklch(0.78 0.18 130 / 0.35), transparent), radial-gradient(50% 50% at 80% 80%, oklch(0.84 0.17 90 / 0.3), transparent)"
      }} />
      <Card className="relative w-full max-w-md p-8 shadow-[var(--shadow-glow)]">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo.url} alt="Nabhya" className="h-10 w-10 rounded-md" />
          <div>
            <div className="font-display text-xl font-semibold">Nabhya OS</div>
            <div className="text-xs text-muted-foreground">Single source of truth</div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold mb-1">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin" ? "Sign in to continue to Nabhya OS." : "First account becomes the Founder admin."}
        </p>

        <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anand" />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 text-sm text-muted-foreground hover:text-foreground w-full text-center"
        >
          {mode === "signin" ? "New to Nabhya? Create an account" : "Already have an account? Sign in"}
        </button>
      </Card>
    </div>
  );
}
