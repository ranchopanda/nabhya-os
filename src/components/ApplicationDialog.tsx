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
import { APPLICATION_STAGES, type Application } from "@/lib/queries";

export function ApplicationDialog({ trigger, application }: { trigger: ReactNode; application?: Application }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(application?.name ?? "");
  const [organizer, setOrganizer] = useState(application?.organizer ?? "");
  const [category, setCategory] = useState(application?.category ?? "");
  const [stage, setStage] = useState<string>(application?.stage ?? "Researching");
  const [date, setDate] = useState(application?.date_applied ?? "");
  const [remarks, setRemarks] = useState(application?.remarks ?? "");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name, organizer: organizer || null, category: category || null,
        stage, date_applied: date || null, remarks: remarks || null,
      };
      const { error } = application
        ? await supabase.from("applications").update(payload).eq("id", application.id)
        : await supabase.from("applications").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(application ? "Application updated" : "Application added");
      qc.invalidateQueries({ queryKey: ["applications"] });
      setOpen(false);
      if (!application) setName(""); setOrganizer(""); setCategory(""); setStage("Researching"); setDate(""); setRemarks("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{application ? "Edit Application" : "Add Application"}</DialogTitle>
          <DialogDescription>{application ? "Update stage, result, or notes." : "Track an incubator, grant, or competition."}</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; mut.mutate(); }}>
          <div className="space-y-1.5">
            <Label htmlFor="aname">Program name *</Label>
            <Input id="aname" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="aorg">Organizer</Label>
              <Input id="aorg" value={organizer} onChange={(e) => setOrganizer(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acat">Category</Label>
              <Input id="acat" placeholder="Grant / Incubator / Competition" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{APPLICATION_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adate">Date applied</Label>
              <Input id="adate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aremarks">Remarks</Label>
            <Textarea id="aremarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !name.trim()}>{mut.isPending ? "Saving…" : application ? "Save" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
