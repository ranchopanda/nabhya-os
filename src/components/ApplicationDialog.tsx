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
import { APPLICATION_STAGES } from "@/lib/queries";

export function ApplicationDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState<string>("Researching");
  const [date, setDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").insert({
        name, organizer: organizer || null, category: category || null,
        stage, date_applied: date || null, remarks: remarks || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application added");
      qc.invalidateQueries({ queryKey: ["applications"] });
      setOpen(false);
      setName(""); setOrganizer(""); setCategory(""); setStage("Researching"); setDate(""); setRemarks("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
          <DialogDescription>Track an incubator, grant, or competition.</DialogDescription>
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
            <Button type="submit" disabled={mut.isPending || !name.trim()}>{mut.isPending ? "Saving…" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
