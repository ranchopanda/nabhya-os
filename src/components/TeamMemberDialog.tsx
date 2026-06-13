import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TeamMember } from "@/lib/queries";

export function TeamMemberDialog({ trigger, member }: { trigger: ReactNode; member?: TeamMember }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState(member?.role ?? "");
  const [focus, setFocus] = useState(member?.current_focus ?? "");
  const [wins, setWins] = useState(member?.wins_this_month ?? "");
  const [linkedin, setLinkedin] = useState(member?.linkedin ?? "");
  const [skills, setSkills] = useState(member?.skills ?? "");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        role: role || null,
        current_focus: focus || null,
        wins_this_month: wins || null,
        linkedin: linkedin || null,
        skills: skills || null,
      };
      const { error } = member
        ? await supabase.from("team_members").update(payload).eq("id", member.id)
        : await supabase.from("team_members").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(member ? "Team member updated" : "Team member added");
      qc.invalidateQueries({ queryKey: ["team_members"] });
      setOpen(false);
      if (!member) setName("");
      setRole("");
      setFocus("");
      setWins("");
      setLinkedin("");
      setSkills("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
          <DialogDescription>
            {member
              ? "Update role, focus, wins, or links."
              : "Who's on the team and what they're focused on."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mut.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tname">Name *</Label>
              <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trole">Role</Label>
              <Input
                id="trole"
                placeholder="Founder · AI"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tfocus">Current focus</Label>
            <Input id="tfocus" value={focus} onChange={(e) => setFocus(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="twins">Wins this month</Label>
            <Textarea id="twins" rows={2} value={wins} onChange={(e) => setWins(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tli">LinkedIn</Label>
              <Input
                id="tli"
                placeholder="https://"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tsk">Skills</Label>
              <Input id="tsk" value={skills} onChange={(e) => setSkills(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending || !name.trim()}>
              {mut.isPending ? "Saving…" : member ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
