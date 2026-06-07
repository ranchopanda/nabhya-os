import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { membersQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy } from "lucide-react";

const ROLES = ["founder", "team", "investor"] as const;
type Role = (typeof ROLES)[number];

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Members · Nabhya OS" }] }),
  beforeLoad: async () => {
    // Bypass auth
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) throw redirect({ to: "/auth" });
    // const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "founder");
    // if (!data?.length) throw redirect({ to: "/" });
    return;
  },
  loader: ({ context }) => { context.queryClient.ensureQueryData(membersQuery); },
  component: MembersPage,
  errorComponent: ({ error }) => <AppShell><div className="p-10 text-sm text-destructive">{error.message}</div></AppShell>,
  notFoundComponent: () => <AppShell><div className="p-10">Not found</div></AppShell>,
});

function MembersPage() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1200px] mx-auto">
        <PageHeader eyebrow="Admin" title="Members & Roles" description="Manage who can access Nabhya OS and what they can do." />
        <Suspense fallback={<Skeleton className="h-64" />}><MembersList /></Suspense>
        <InviteCard />
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); toast.success("Role updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3 w-48">Role</th></tr>
        </thead>
        <tbody>
          {members.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No members yet.</td></tr>}
          {members.map((m) => {
            const current = (m.roles[0] as Role) ?? "team";
            return (
              <tr key={m.id} className="border-t">
                <td className="p-3 font-medium">{m.display_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{m.email ?? "—"}</td>
                <td className="p-3">
                  <Select value={current} onValueChange={(v) => setRole.mutate({ userId: m.id, role: v as Role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
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

function InviteCard() {
  const [link] = useState(() => `${typeof window !== "undefined" ? window.location.origin : ""}/auth`);
  return (
    <Card className="mt-6 p-5">
      <div className="font-display text-lg mb-1">Invite a teammate</div>
      <p className="text-sm text-muted-foreground mb-3">
        Share this sign-up link. New accounts default to the <code>team</code> role — promote them to founder above if needed.
      </p>
      <div className="flex gap-2">
        <Input value={link} readOnly />
        <Button variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied"); }}>
          <Copy className="h-4 w-4" /> Copy
        </Button>
      </div>
    </Card>
  );
}
