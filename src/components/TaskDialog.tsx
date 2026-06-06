import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TASK_STATUSES } from "@/lib/queries";

export function TaskDialog({ trigger }: { trigger: ReactNode; defaultStatus?: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("Backlog");
  const [due, setDue] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        title, description: description || null, status, due_date: due || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task added");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setOpen(false);
      setTitle(""); setDescription(""); setStatus("Backlog"); setDue("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setStatus("Backlog"); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Add work to the board.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; mut.mutate(); }}>
          <div className="space-y-1.5">
            <Label htmlFor="ttitle">Title *</Label>
            <Input id="ttitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tdesc">Description</Label>
            <Textarea id="tdesc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tdue">Due date</Label>
              <Input id="tdue" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
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
