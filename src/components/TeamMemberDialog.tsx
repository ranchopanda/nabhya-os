import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function TeamMemberDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [focus, setFocus] = useState("");
  const [wins, setWins] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [skills, setSkills] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("team_members").insert({
        name, role: role || null, current_focus: focus || null,
        wins_this_month: wins || null, linkedin: linkedin || null, skills: skills || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team member added");
      qc.invalidateQueries({ queryKey: ["team_members"] });
      setOpen(false);
      setName(""); setRole(""); setFocus(""); setWins(""); setLinkedin(""); setSkills("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Who's on the team and what they're focused on.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; mut.mutate(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tname">Name *</Label>
              <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trole">Role</Label>
              <Input id="trole" placeholder="Founder · AI" value={role} onChange={(e) => setRole(e.target.value)} />
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
              <Input id="tli" placeholder="https://" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tsk">Skills</Label>
              <Input id="tsk" value={skills} onChange={(e) => setSkills(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !name.trim()}>{mut.isPending ? "Saving…" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
