import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Folder, Search } from "lucide-react";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Document Hub · Nabhya OS" }, { name: "description", content: "Central storage for business, research, legal and financial docs." }] }),
  component: Documents,
});

const folders = ["Business", "Research", "Financial", "Legal", "Presentations", "Competition Submissions"];

function Documents() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Module 9" title="Document Hub" description="One place. Searchable. Always current." />
        <Card className="p-4 mb-6 flex items-center gap-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search every document…" className="border-0 focus-visible:ring-0 shadow-none" />
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {folders.map((f) => (
            <Card key={f} className="p-5 hover:shadow-[var(--shadow-card)] transition-shadow cursor-pointer">
              <Folder className="h-8 w-8 text-brand-green" />
              <div className="mt-3 font-medium">{f}</div>
              <div className="text-xs text-muted-foreground">{Math.floor(Math.random() * 30) + 4} files</div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
