import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery, queryOptions } from "@tanstack/react-query";
import { Suspense, useState } from "react";
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
import { Trash2, RefreshCw, ShieldAlert } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createInvite, listInvites, revokeInvite, resendInvite, purgeNonFounders } from "@/lib/invites.functions";

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

function MembersList() {
  const { data: members } = useSuspenseQuery(membersQuery);
  const qc = useQueryClient();

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Role updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="font-display text-lg">Active members</div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3 w-48">Role</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 && (
            <tr>
              <td colSpan={3} className="p-6 text-center text-muted-foreground">
                No members yet.
              </td>
            </tr>
          )}
          {members.map((m) => {
            const current = (m.roles[0] as Role) ?? "team";
            return (
              <tr key={m.id} className="border-t">
                <td className="p-3 font-medium">{m.display_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{m.email ?? "—"}</td>
                <td className="p-3">
                  <Select value={current} onValueChange={(v) => setRole.mutate({ userId: m.id, role: v as Role })}>
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
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => createFn({ data: { email, role, expiresInDays } }),
    onSuccess: ({ token }) => {
      const url = `${window.location.origin}/auth?invite=${token}`;
      navigator.clipboard.writeText(url).catch(() => {});
      setLastLink(url);
      toast.success("Invite created — link copied");
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
      navigator.clipboard.writeText(url).catch(() => {});
      setLastLink(url);
      toast.success(`New link for ${invite.email} — copied`);
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
                    max={60}
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value) || 7)}
                  />
                </div>
              </div>
              {lastLink && (
                <div className="text-xs p-2 rounded bg-muted break-all">
                  Last link copied: <code>{lastLink}</code>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
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
                {(inv.status === "pending" || inv.status === "expired" || inv.status === "revoked") && (
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
  const purge = useMutation({
    mutationFn: async () => purgeFn(),
    onSuccess: ({ removed }: any) => {
      toast.success(`Removed ${removed} non-founder account${removed === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["members"] });
      setConfirming(false);
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
            <div className="flex gap-2">
              <Button variant="destructive" disabled={purge.isPending} onClick={() => purge.mutate()}>
                {purge.isPending ? "Removing…" : "Yes, remove them"}
              </Button>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// keep helper imports used above
export { Copy };
