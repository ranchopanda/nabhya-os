import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery, queryOptions } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { membersQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, RefreshCw, ShieldAlert, Copy, UserX } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createInvite, listInvites, revokeInvite, resendInvite, purgeNonFounders } from "@/lib/invites.functions";
import { setMemberRole, removeMember } from "@/lib/members.functions";

const ROLES = ["founder", "team", "investor"] as const;
type Role = (typeof ROLES)[number];

const invitesQueryOptions = (fn: () => Promise<{ invites: any[] }>) =>
  queryOptions({ queryKey: ["invites"], queryFn: fn });

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Members · Nabhya OS" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(membersQuery);
  },
  component: MembersPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="p-10 text-sm text-destructive">{error.message}</div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="p-10">Not found</div>
    </AppShell>
  ),
});

function MembersPage() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Members & Invites"
          description="Nabhya OS is invite-only. Only founders can invite people, and every invite is locked to one email and one role."
        />
        <InvitesSection />
        <Suspense fallback={<Skeleton className="h-64" />}>
          <MembersList />
        </Suspense>
        <DangerZone />
      </div>
    </AppShell>
  );
}

function useCurrentUserId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setId(data.user?.id ?? null));
  }, []);
  return id;
}

function MembersList() {
  const { data: members } = useSuspenseQuery(membersQuery);
  const qc = useQueryClient();
  const meId = useCurrentUserId();
  const setRoleFn = useServerFn(setMemberRole);
  const removeFn = useServerFn(removeMember);

  const founderCount = members.filter((m) => m.roles.includes("founder")).length;

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) =>
      setRoleFn({ data: { userId, role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Role updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => removeFn({ data: { userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="font-display text-lg">Active members</div>
        <p className="text-xs text-muted-foreground">{members.length} total · {founderCount} founder{founderCount === 1 ? "" : "s"}</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Joined</th>
            <th className="text-left p-3 w-44">Role</th>
            <th className="text-right p-3 w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-muted-foreground">
                No members yet.
              </td>
            </tr>
          )}
          {members.map((m) => {
            const current = (m.roles[0] as Role) ?? "team";
            const isSelf = meId === m.id;
            const isLastFounder = current === "founder" && founderCount <= 1;
            const lockRole = isLastFounder;
            return (
              <tr key={m.id} className="border-t">
                <td className="p-3 font-medium">
                  {m.display_name ?? "—"} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                </td>
                <td className="p-3 text-muted-foreground">{m.email ?? "—"}</td>
                <td className="p-3 text-muted-foreground text-xs">
                  {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="p-3">
                  <Select
                    value={current}
                    disabled={lockRole || setRole.isPending}
                    onValueChange={(v) => setRole.mutate({ userId: m.id, role: v as Role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isLastFounder || remove.isPending}
                    onClick={() => {
                      if (confirm(`Remove ${m.email ?? m.display_name}? They will lose access immediately.`)) {
                        remove.mutate(m.id);
                      }
                    }}
                  >
                    <UserX className="h-3.5 w-3.5" /> Remove
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function InvitesSection() {
  const listFn = useServerFn(listInvites);
  const createFn = useServerFn(createInvite);
  const revokeFn = useServerFn(revokeInvite);
  const resendFn = useServerFn(resendInvite);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery(invitesQueryOptions(() => listFn()));
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("team");
  const [expiresInDays, setExpiresInDays] = useState<string>("7");
  const [lastLink, setLastLink] = useState<string | null>(null);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Copy failed — select the link manually"),
    );
  };

  const create = useMutation({
    mutationFn: async () => createFn({ data: { email, role, expiresInDays: Math.min(365, Math.max(1, parseInt(expiresInDays, 10) || 7)) } }),
    onSuccess: ({ token }) => {
      const url = `${window.location.origin}/auth?invite=${token}`;
      copyLink(url);
      setLastLink(url);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invites"] });
      toast.success("Invite revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resend = useMutation({
    mutationFn: async (id: string) => resendFn({ data: { id, expiresInDays: 7 } }),
    onSuccess: ({ token, invite }: any) => {
      const url = `${window.location.origin}/auth?invite=${token}`;
      copyLink(url);
      setLastLink(url);
      toast.success(`New link for ${invite.email}`);
      qc.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invites = data?.invites ?? [];

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg">Invites</div>
          <p className="text-xs text-muted-foreground">One-time, email-locked links. Expire automatically.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New invite</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create an invite</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person@company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="invite-exp">Expires (days)</Label>
                  <Input
                    id="invite-exp"
                    type="number"
                    min={1}
                    max={365}
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value) || 7)}
                  />
                </div>
              </div>
              {lastLink && (
                <div className="space-y-1">
                  <Label className="text-xs">Invite link (one-time, copy now)</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={lastLink} onFocus={(e) => e.currentTarget.select()} className="text-xs" />
                    <Button type="button" variant="secondary" size="sm" onClick={() => copyLink(lastLink)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); setLastLink(null); }}>
                Close
              </Button>
              <Button disabled={!email || create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? "Creating…" : "Create & copy link"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Role</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Expires</th>
            <th className="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
          {!isLoading && invites.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-muted-foreground">
                No invites yet.
              </td>
            </tr>
          )}
          {invites.map((inv: any) => (
            <tr key={inv.id} className="border-t">
              <td className="p-3 font-medium">{inv.email}</td>
              <td className="p-3">{inv.role}</td>
              <td className="p-3">
                <Badge variant={inv.status === "pending" ? "default" : "secondary"}>{inv.status}</Badge>
              </td>
              <td className="p-3 text-muted-foreground">{new Date(inv.expires_at).toLocaleDateString()}</td>
              <td className="p-3 text-right">
                {inv.status === "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => revoke.mutate(inv.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Revoke
                  </Button>
                )}
                {inv.status !== "accepted" && (
                  <Button size="sm" variant="ghost" onClick={() => resend.mutate(inv.id)}>
                    <RefreshCw className="h-3.5 w-3.5" /> New link
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function DangerZone() {
  const purgeFn = useServerFn(purgeNonFounders);
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const purge = useMutation({
    mutationFn: async () => purgeFn(),
    onSuccess: ({ removed }: any) => {
      toast.success(`Removed ${removed} non-founder account${removed === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["members"] });
      setConfirming(false);
      setTyped("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-5 border-destructive/40">
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <div className="font-display text-lg">Revoke all non-founders</div>
          <p className="text-sm text-muted-foreground mb-3">
            Removes every account that isn't a founder. Use this once to clean up accounts created before invites were
            required. They can be re-invited any time.
          </p>
          {!confirming ? (
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              Revoke all non-founders
            </Button>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Type <code className="px-1 bg-muted rounded">REVOKE</code> to confirm</Label>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="REVOKE" />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  disabled={typed !== "REVOKE" || purge.isPending}
                  onClick={() => purge.mutate()}
                >
                  {purge.isPending ? "Removing…" : "Yes, remove them"}
                </Button>
                <Button variant="outline" onClick={() => { setConfirming(false); setTyped(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
