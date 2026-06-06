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

export function MilestoneDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("milestones").insert({
        title, description: description || null, occurred_on: date, category: category || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Milestone added");
      qc.invalidateQueries({ queryKey: ["milestones"] });
      setOpen(false);
      setTitle(""); setDescription(""); setCategory("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Milestone</DialogTitle>
          <DialogDescription>Record a meaningful moment in Nabhya's story.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; mut.mutate(); }}>
          <div className="space-y-1.5">
            <Label htmlFor="mtitle">Title *</Label>
            <Input id="mtitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mdate">Date *</Label>
              <Input id="mdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mcat">Category</Label>
              <Input id="mcat" placeholder="Win / Pilot / Funding" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mdesc">Description</Label>
            <Textarea id="mdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !title.trim()}>{mut.isPending ? "Saving…" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
