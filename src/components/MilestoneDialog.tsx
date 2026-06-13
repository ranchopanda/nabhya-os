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
import { type Milestone, logActivity } from "@/lib/queries";

export function MilestoneDialog({
  trigger,
  milestone,
}: {
  trigger: ReactNode;
  milestone?: Milestone;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");
  const [date, setDate] = useState(milestone?.occurred_on ?? new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(milestone?.category ?? "");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description: description || null,
        occurred_on: date,
        category: category || null,
      };
      const { error } = milestone
        ? await supabase.from("milestones").update(payload).eq("id", milestone.id)
        : await supabase.from("milestones").insert(payload);
      if (error) throw error;
      logActivity("Milestones", !milestone ? "Created milestone" : "Updated milestone", title);
    },
    onSuccess: () => {
      toast.success(milestone ? "Milestone updated" : "Milestone added");
      qc.invalidateQueries({ queryKey: ["milestones"] });
      qc.invalidateQueries({ queryKey: ["activity_log"] });
      setOpen(false);
      if (!milestone) setTitle("");
      setDescription("");
      setCategory("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{milestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
          <DialogDescription>
            {milestone
              ? "Update a moment in Nabhya's story."
              : "Record a meaningful moment in Nabhya's story."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            mut.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="mtitle">Title *</Label>
            <Input id="mtitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mdate">Date *</Label>
              <Input
                id="mdate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mcat">Category</Label>
              <Input
                id="mcat"
                placeholder="Win / Pilot / Funding"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mdesc">Description</Label>
            <Textarea
              id="mdesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending || !title.trim()}>
              {mut.isPending ? "Saving…" : milestone ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
