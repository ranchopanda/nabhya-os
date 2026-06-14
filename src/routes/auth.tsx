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
import { useServerFn } from "@tanstack/react-start";
import {
  validateInvite,
  redeemInviteWithPassword,
  redeemInviteAfterOAuth,
} from "@/lib/invite-redeem.functions";

const INVITE_STORAGE_KEY = "nabhya:invite-token";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Nabhya OS" },
      { name: "description", content: "Sign in to Nabhya OS — invite-only workspace." },
    ],
  }),
  component: AuthPage,
});

type InviteInfo = { email: string; role: string } | null;

function AuthPage() {
  const navigate = useNavigate();
  const validate = useServerFn(validateInvite);
  const redeemPassword = useServerFn(redeemInviteWithPassword);
  const redeemOAuth = useServerFn(redeemInviteAfterOAuth);

  const [mode, setMode] = useState<"signin" | "invite">("signin");
  const [invite, setInvite] = useState<InviteInfo>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function hasAssignedRole(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1);
    if (error) throw error;
    return (data ?? []).length > 0;
  }

  // 1) Parse ?invite=… and stored token; validate
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let token = params.get("invite");
    if (!token && typeof window !== "undefined") {
      token = sessionStorage.getItem(INVITE_STORAGE_KEY);
    }
    if (!token) return;
    setInviteToken(token);
    setMode("invite");
    (async () => {
      try {
        const res = await validate({ data: { token } });
        if (res.valid) {
          setInvite({ email: res.email, role: res.role });
          setEmail(res.email);
        } else {
          setInviteError(`Invite is ${res.reason}.`);
        }
      } catch (e) {
        setInviteError(e instanceof Error ? e.message : "Invalid invite");
      }
    })();
  }, [validate]);

  // 2) If there's already a session, finish OAuth invite flow or just go home
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const pendingToken =
        typeof window !== "undefined" ? sessionStorage.getItem(INVITE_STORAGE_KEY) : null;

      if (pendingToken) {
        sessionStorage.removeItem(INVITE_STORAGE_KEY);
        try {
          await redeemOAuth({
            data: {
              token: pendingToken,
              userId: data.session.user.id,
              email: data.session.user.email ?? "",
            },
          });
          toast.success("Welcome to Nabhya OS");
          navigate({ to: "/" });
        } catch (e) {
          await supabase.auth.signOut();
          toast.error(
            e instanceof Error ? e.message : "This Google account doesn't match the invite email.",
          );
        }
        return;
      }
      if (!(await hasAssignedRole(data.session.user.id))) {
        await supabase.auth.signOut();
        toast.error("Your account needs an invite before you can sign in.");
        return;
      }
      navigate({ to: "/" });
    })();
  }, [navigate, redeemOAuth]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data } = await supabase.auth.getUser();
      if (data.user && !(await hasAssignedRole(data.user.id))) {
        await supabase.auth.signOut();
        throw new Error("Your account needs an invite before you can sign in.");
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteToken || !invite) return;
    setLoading(true);
    try {
      await redeemPassword({
        data: { token: inviteToken, password, displayName: name || invite.email.split("@")[0] },
      });
      const { error } = await supabase.auth.signInWithPassword({ email: invite.email, password });
      if (error) throw error;
      toast.success("Welcome to Nabhya OS");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept invite");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    if (inviteToken) sessionStorage.setItem(INVITE_STORAGE_KEY, inviteToken);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      toast.error(
        result.error instanceof Error ? result.error.message : "Google sign-in failed",
      );
      sessionStorage.removeItem(INVITE_STORAGE_KEY);
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    // Session set — existing effect will route the user.
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 20% 20%, oklch(0.78 0.18 130 / 0.35), transparent), radial-gradient(50% 50% at 80% 80%, oklch(0.84 0.17 90 / 0.3), transparent)",
        }}
      />
      <Card className="relative w-full max-w-md p-8 shadow-[var(--shadow-glow)]">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo.url} alt="Nabhya" className="h-10 w-10 rounded-md" />
          <div>
            <div className="font-display text-xl font-semibold">Nabhya OS</div>
            <div className="text-xs text-muted-foreground">Invite-only workspace</div>
          </div>
        </div>

        {mode === "invite" ? (
          <>
            <h1 className="font-display text-2xl font-semibold mb-1">Accept your invite</h1>
            {invite ? (
              <p className="text-sm text-muted-foreground mb-6">
                You're joining as <span className="font-medium text-foreground">{invite.role}</span>{" "}
                with <span className="font-medium text-foreground">{invite.email}</span>.
              </p>
            ) : inviteError ? (
              <p className="text-sm text-destructive mb-6">{inviteError}</p>
            ) : (
              <p className="text-sm text-muted-foreground mb-6">Checking your invite…</p>
            )}

            {invite && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  Continue with Google ({invite.email})
                </Button>
                <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" /> OR{" "}
                  <div className="flex-1 h-px bg-border" />
                </div>
                <form onSubmit={handleAcceptInvite} className="space-y-3">
                  <div>
                    <Label htmlFor="name">Display name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={invite.email} readOnly disabled />
                  </div>
                  <div>
                    <Label htmlFor="password">Create password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating…" : "Create account"}
                  </Button>
                </form>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setInviteError(null);
              }}
              className="mt-5 text-sm text-muted-foreground hover:text-foreground w-full text-center"
            >
              Already have an account? Sign in
            </button>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in with your Nabhya OS account. New accounts are invite-only.
            </p>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : "Sign in"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
