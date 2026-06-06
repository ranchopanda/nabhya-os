import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { team } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "Team HQ · Nabhya OS" }, { name: "description", content: "Who's on the Nabhya team and what they're focused on." }] }),
  component: Team,
});

function Team() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Module 8" title="Team HQ" description="The humans behind Nabhya." />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((t) => (
            <Card key={t.name} className="p-6">
              <div className="h-12 w-12 rounded-full flex items-center justify-center font-display font-semibold text-lg text-primary-foreground"
                style={{ background: "var(--gradient-brand)" }}>
                {t.name[0]}
              </div>
              <h3 className="font-display text-lg font-semibold mt-4">{t.name}</h3>
              <div className="text-sm text-muted-foreground">{t.role}</div>
              <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Focus</div>
              <div className="text-sm">{t.focus}</div>
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Win this month</div>
              <div className="text-sm">{t.wins}</div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
