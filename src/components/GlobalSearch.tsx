import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, FileText, CheckSquare, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { leadsQuery, tasksQuery, pilotsQuery, teamMembersQuery } from "@/lib/queries";

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  // Fetch data for search (non-blocking, handled by React Query cache mostly)
  const { data: leads } = useQuery({ ...leadsQuery, staleTime: Infinity });
  const { data: tasks } = useQuery({ ...tasksQuery, staleTime: Infinity });
  const { data: pilots } = useQuery({ ...pilotsQuery, staleTime: Infinity });
  const { data: team } = useQuery({ ...teamMembersQuery, staleTime: Infinity });

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {leads && leads.length > 0 && (
          <CommandGroup heading="CRM Leads">
            {leads.slice(0, 5).map((lead) => (
              <CommandItem
                key={lead.id}
                value={`lead ${lead.company} ${lead.contact_name || ""}`}
                onSelect={() => runCommand(() => navigate({ to: "/crm" }))}
              >
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{lead.company}</span>
                {lead.contact_name && (
                  <span className="ml-2 text-xs text-muted-foreground">— {lead.contact_name}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {tasks && tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {tasks.slice(0, 5).map((task) => (
              <CommandItem
                key={task.id}
                value={`task ${task.title}`}
                onSelect={() => runCommand(() => navigate({ to: "/tasks" }))}
              >
                <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{task.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {pilots && pilots.length > 0 && (
          <CommandGroup heading="Pilots">
            {pilots.slice(0, 5).map((pilot) => (
              <CommandItem
                key={pilot.id}
                value={`pilot ${pilot.name} ${pilot.organization || ""}`}
                onSelect={() => runCommand(() => navigate({ to: "/pilots" }))}
              >
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{pilot.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {team && team.length > 0 && (
          <CommandGroup heading="Team Members">
            {team.map((member) => (
              <CommandItem
                key={member.id}
                value={`team ${member.name} ${member.role || ""}`}
                onSelect={() => runCommand(() => navigate({ to: "/team" }))}
              >
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{member.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">— {member.role}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
