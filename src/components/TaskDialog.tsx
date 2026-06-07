import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { type Task, teamMembersQuery, logActivity, TASK_STATUSES } from "@/lib/queries";

export function TaskDialog({ trigger, task, defaultStatus = "Backlog" }: { trigger: ReactNode; task?: Task; defaultStatus?: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<string>(task?.status ?? defaultStatus);
  const [due, setDue] = useState(task?.due_date ?? "");
  const [assigneeId, setAssigneeId] = useState<string>(task?.assignee_id ?? "");
  const { data: teamMembers = [] } = useQuery(teamMembersQuery);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        title, description: description || null, status, due_date: due || null,
        assignee_id: assigneeId || null,
      };
      const { error } = task
        ? await supabase.from("tasks").update(payload).eq("id", task.id)
        : await supabase.from("tasks").insert(payload);
      if (error) throw error;
      logActivity("Tasks", !task ? "Created task" : "Updated task", title);
    },
    onSuccess: () => {
      toast.success(task ? "Task updated" : "Task added");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["activity_log"] });
      setOpen(false);
      if (!task) {
        setTitle(""); setDescription(""); setStatus(defaultStatus); setDue(""); setAssigneeId("");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && !task) setStatus(defaultStatus); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>{task ? "Update work, status, or due date." : "Add work to the board."}</DialogDescription>
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
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Select value={assigneeId || "unassigned"} onValueChange={(v) => setAssigneeId(v === "unassigned" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !title.trim()}>{mut.isPending ? "Saving…" : task ? "Save" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
