import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ApplicationDialog } from "@/components/ApplicationDialog";
import { ContentDialog } from "@/components/ContentDialog";
import { LeadDialog } from "@/components/LeadDialog";
import { MilestoneDialog } from "@/components/MilestoneDialog";
import { PilotDialog } from "@/components/PilotDialog";
import { ProductUpdateDialog } from "@/components/ProductUpdateDialog";
import { TaskDialog } from "@/components/TaskDialog";
import { TeamMemberDialog } from "@/components/TeamMemberDialog";
import { UploadDialog } from "@/components/UploadDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCurrentRole } from "@/hooks/use-current-role";
import {
  FileCheck2,
  FileText,
  History,
  ListTodo,
  Megaphone,
  Plus,
  Rocket,
  ShieldCheck,
  Upload,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/data-entry")({
  head: () => ({
    meta: [
      { title: "Data Entry · Nabhya OS" },
      {
        name: "description",
        content:
          "Add leads, pilots, applications, proof, documents, tasks, and team data into Nabhya OS.",
      },
    ],
  }),
  component: DataEntryPage,
});

const actions: Array<{
  title: string;
  description: string;
  to: string;
  icon: typeof Plus;
  dialog: (trigger: ReactNode) => ReactNode;
}> = [
  {
    title: "Lead",
    description: "Company, contact, status, next action.",
    to: "/crm",
    icon: Users,
    dialog: (trigger) => <LeadDialog trigger={trigger} />,
  },
  {
    title: "Pilot",
    description: "Field deployment, KPIs, progress.",
    to: "/pilots",
    icon: Rocket,
    dialog: (trigger) => <PilotDialog trigger={trigger} />,
  },
  {
    title: "Application",
    description: "Grants, incubators, competitions.",
    to: "/applications",
    icon: FileCheck2,
    dialog: (trigger) => <ApplicationDialog trigger={trigger} />,
  },
  {
    title: "Product update",
    description: "Feature shipped, owner, impact.",
    to: "/product",
    icon: Wrench,
    dialog: (trigger) => <ProductUpdateDialog trigger={trigger} />,
  },
  {
    title: "Milestone",
    description: "Company timeline and major wins.",
    to: "/milestones",
    icon: History,
    dialog: (trigger) => <MilestoneDialog trigger={trigger} />,
  },
  {
    title: "Content post",
    description: "Platform, topic, status, reach.",
    to: "/content",
    icon: Megaphone,
    dialog: (trigger) => <ContentDialog trigger={trigger} />,
  },
  {
    title: "Team member",
    description: "Roles, focus, wins, links.",
    to: "/team",
    icon: UsersRound,
    dialog: (trigger) => <TeamMemberDialog trigger={trigger} />,
  },
  {
    title: "Task",
    description: "Work item, status, due date.",
    to: "/tasks",
    icon: ListTodo,
    dialog: (trigger) => <TaskDialog trigger={trigger} />,
  },
  {
    title: "Proof",
    description: "Awards, validation, media receipts.",
    to: "/proof",
    icon: ShieldCheck,
    dialog: (trigger) => <UploadDialog kind="vault" trigger={trigger} />,
  },
  {
    title: "Document",
    description: "Decks, SOPs, legal and research files.",
    to: "/documents",
    icon: FileText,
    dialog: (trigger) => <UploadDialog kind="document" trigger={trigger} />,
  },
];

function DataEntryPage() {
  const { canEdit, role, loading } = useCurrentRole();

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Operations"
          title="Data Entry"
          description="One place to feed the live system. Anything added here immediately updates the connected module and dashboard."
          action={
            <Badge variant={canEdit ? "default" : "secondary"}>
              {loading
                ? "Checking access"
                : canEdit
                  ? "Can edit"
                  : `Readonly${role ? ` · ${role}` : ""}`}
            </Badge>
          }
        />

        {!canEdit && !loading ? (
          <Card className="p-6 mb-6 border-dashed">
            <h2 className="font-display text-lg font-semibold">Readonly access</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your account can view the operating system, but only founder/team roles can add or
              edit data. Ask a founder to update your role in Members.
            </p>
          </Card>
        ) : null}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="p-5 flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold">Add {action.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  </div>
                </div>
                <div className="mt-auto flex gap-2">
                  {canEdit ? (
                    action.dialog(
                      <Button size="sm">
                        <Plus className="h-4 w-4" /> Add
                      </Button>,
                    )
                  ) : (
                    <Button size="sm" disabled>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <a href={action.to}>View module</a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
