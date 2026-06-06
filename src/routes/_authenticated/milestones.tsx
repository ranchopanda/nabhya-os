import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { milestones } from "@/lib/mock-data";

export const Route = createFileRoute("/milestones")({
  head: () => ({ meta: [{ title: "Milestones · Nabhya OS" }, { name: "description", content: "The story of Nabhya, in chronological order." }] }),
  component: Milestones,
});

function Milestones() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-3xl mx-auto">
        <PageHeader eyebrow="Module 11" title="Milestone Timeline" description="Every meaningful step the company has taken." />
        <div className="relative pl-8">
          <div className="absolute left-3 top-2 bottom-2 w-0.5" style={{ background: "var(--gradient-brand)" }} />
          {milestones.map((m, i) => (
            <div key={m.title} className="relative pb-10 last:pb-0">
              <div className="absolute -left-[22px] top-1 h-4 w-4 rounded-full border-4 border-background"
                style={{ background: ["var(--brand-green)", "var(--brand-lime)", "var(--brand-yellow)", "var(--brand-red)"][i % 4] }} />
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.date}</div>
              <div className="font-display text-xl font-semibold mt-1">{m.title}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
